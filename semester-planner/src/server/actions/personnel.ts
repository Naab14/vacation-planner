'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from '@/lib/db';
import { slugify } from '@/lib/slug';
import { AuthorizationError, requireManager } from '@/lib/rbac';

export interface PersonnelActionResult {
  ok: boolean;
  error?: string;
  id?: string;
}

const PLANNING_PATHS = ['/planning', '/matrix', '/employees'] as const;

function revalidateAll() {
  for (const path of PLANNING_PATHS) revalidatePath(path);
}

async function audit(
  orgId: string,
  actorId: string,
  action: string,
  entity: string,
  entityId: string,
  before: unknown,
  after: unknown,
) {
  await db.auditLog.create({
    data: {
      orgId,
      actorId,
      action,
      entity,
      entityId,
      before: before == null ? undefined : JSON.parse(JSON.stringify(before)),
      after: after == null ? undefined : JSON.parse(JSON.stringify(after)),
    },
  });
}

function asResult(error: unknown): PersonnelActionResult {
  if (error instanceof AuthorizationError) return { ok: false, error: error.message };
  throw error;
}

// ── Certifications ─────────────────────────────────────────────────────────

const certSchema = z.object({
  operatorId: z.string().min(1).max(64),
  processId: z.string().min(1).max(64),
  certified: z.boolean(),
});

export async function setCertification(input: unknown): Promise<PersonnelActionResult> {
  try {
    const session = await requireManager();
    const parsed = certSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: 'Ogiltiga värden' };
    const { operatorId, processId, certified } = parsed.data;
    const { orgId } = session.user;

    const [operator, process] = await Promise.all([
      db.operator.findFirst({ where: { id: operatorId, orgId } }),
      db.process.findFirst({ where: { id: processId, orgId } }),
    ]);
    if (!operator || !process) return { ok: false, error: 'Okänd operatör eller process' };

    if (certified) {
      await db.certification.upsert({
        where: { operatorId_processId: { operatorId, processId } },
        update: {},
        create: { operatorId, processId },
      });
    } else {
      await db.certification.deleteMany({ where: { operatorId, processId } });
    }
    await audit(orgId, session.user.id, certified ? 'certification.add' : 'certification.remove',
      'Certification', `${operatorId}:${processId}`, { certified: !certified }, { certified });

    revalidateAll();
    return { ok: true };
  } catch (error) {
    return asResult(error);
  }
}

// ── Processes ──────────────────────────────────────────────────────────────

export async function createProcess(input: unknown): Promise<PersonnelActionResult> {
  try {
    const session = await requireManager();
    const parsed = z.object({ name: z.string().trim().min(1).max(80) }).safeParse(input);
    if (!parsed.success) return { ok: false, error: 'Ogiltigt namn' };
    const { orgId } = session.user;
    const slug = slugify(parsed.data.name);

    const existing = await db.process.findUnique({ where: { orgId_slug: { orgId, slug } } });
    if (existing) return { ok: false, error: 'Processen finns redan' };

    const count = await db.process.count({ where: { orgId } });
    const process = await db.process.create({
      data: { orgId, slug, name: parsed.data.name, sortOrder: count },
    });
    await audit(orgId, session.user.id, 'process.create', 'Process', process.id, null, process);

    revalidateAll();
    return { ok: true, id: process.id };
  } catch (error) {
    return asResult(error);
  }
}

export async function renameProcess(input: unknown): Promise<PersonnelActionResult> {
  try {
    const session = await requireManager();
    const parsed = z
      .object({ id: z.string().min(1).max(64), name: z.string().trim().min(1).max(80) })
      .safeParse(input);
    if (!parsed.success) return { ok: false, error: 'Ogiltigt namn' };
    const { orgId } = session.user;

    const before = await db.process.findFirst({ where: { id: parsed.data.id, orgId } });
    if (!before) return { ok: false, error: 'Okänd process' };

    // Slug stays stable on rename — it is the machine key demand/certs hang off.
    const process = await db.process.update({
      where: { id: before.id },
      data: { name: parsed.data.name },
    });
    await audit(orgId, session.user.id, 'process.rename', 'Process', process.id, before, process);

    revalidateAll();
    return { ok: true };
  } catch (error) {
    return asResult(error);
  }
}

export async function deleteProcess(input: unknown): Promise<PersonnelActionResult> {
  try {
    const session = await requireManager();
    const parsed = z.object({ id: z.string().min(1).max(64) }).safeParse(input);
    if (!parsed.success) return { ok: false, error: 'Ogiltiga värden' };
    const { orgId } = session.user;

    const before = await db.process.findFirst({
      where: { id: parsed.data.id, orgId },
      include: { _count: { select: { certifications: true } } },
    });
    if (!before) return { ok: false, error: 'Okänd process' };

    // Cascades remove certifications and demand rows for the process.
    await db.process.delete({ where: { id: before.id } });
    await audit(orgId, session.user.id, 'process.delete', 'Process', before.id, before, null);

    revalidateAll();
    return { ok: true };
  } catch (error) {
    return asResult(error);
  }
}

// ── Operators ──────────────────────────────────────────────────────────────

const operatorSchema = z.object({
  id: z.string().min(1).max(64).optional(),
  name: z.string().trim().min(1).max(120),
  shift: z.string().trim().min(1).max(10),
  active: z.boolean(),
  iconColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .nullable()
    .optional(),
});

export async function saveOperator(input: unknown): Promise<PersonnelActionResult> {
  try {
    const session = await requireManager();
    const parsed = operatorSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: 'Ogiltiga värden' };
    const data = parsed.data;
    const { orgId } = session.user;

    const settings = await db.settings.findUniqueOrThrow({ where: { orgId } });
    if (!settings.shifts.includes(data.shift)) {
      return { ok: false, error: `Okänt skift: ${data.shift}` };
    }

    const before = data.id ? await db.operator.findFirst({ where: { id: data.id, orgId } }) : null;
    if (data.id && !before) return { ok: false, error: 'Okänd operatör' };

    const payload = {
      name: data.name,
      shift: data.shift,
      active: data.active,
      iconColor: data.iconColor ?? before?.iconColor ?? null,
    };
    const operator = before
      ? await db.operator.update({ where: { id: before.id }, data: payload })
      : await db.operator.create({ data: { ...payload, orgId } });

    await audit(orgId, session.user.id, before ? 'operator.update' : 'operator.create',
      'Operator', operator.id, before, operator);

    revalidateAll();
    return { ok: true, id: operator.id };
  } catch (error) {
    return asResult(error);
  }
}
