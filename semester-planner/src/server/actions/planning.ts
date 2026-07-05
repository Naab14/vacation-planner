'use server';

import { revalidatePath } from 'next/cache';
import { Role } from '@prisma/client';
import { z } from 'zod';
import { db } from '@/lib/db';
import { AuthorizationError, requireManager } from '@/lib/rbac';
import { loadPlanningData } from '@/server/data/planning';
import { evaluateCandidate, hasBlockingConflict } from '@/server/engine/conflicts';
import type { ConflictWarning } from '@/server/engine/conflicts';

export interface PlanningActionResult {
  ok: boolean;
  error?: string;
  warnings?: ConflictWarning[];
  blockId?: string;
}

const blockSchema = z.object({
  id: z.string().min(1).max(64).optional(), // absent = create
  operatorId: z.string().min(1).max(64),
  year: z.number().int().min(2020).max(2100),
  startWeek: z.number().int().min(1).max(53),
  endWeek: z.number().int().min(1).max(53),
  status: z.enum(['DRAFT', 'REQUESTED', 'PENDING', 'APPROVED', 'DENIED']).optional(),
  note: z.string().max(500).optional(),
});

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
      before: before === null ? undefined : JSON.parse(JSON.stringify(before)),
      after: after === null ? undefined : JSON.parse(JSON.stringify(after)),
    },
  });
}

/** Create, move or resize an absence block on the board. Manager+ only. */
export async function saveAbsenceBlock(input: unknown): Promise<PlanningActionResult> {
  try {
    const session = await requireManager();
    const parsed = blockSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: 'Ogiltiga värden' };
    const data = parsed.data;
    const { orgId } = session.user;
    const isAdmin = session.user.role === Role.ADMIN;

    const startWeek = Math.min(data.startWeek, data.endWeek);
    const endWeek = Math.max(data.startWeek, data.endWeek);

    const operator = await db.operator.findFirst({
      where: { id: data.operatorId, orgId },
    });
    if (!operator) return { ok: false, error: 'Okänd operatör' };

    const existing = data.id
      ? await db.absenceBlock.findFirst({
          where: { id: data.id, operator: { orgId } },
        })
      : null;
    if (data.id && !existing) return { ok: false, error: 'Blocket finns inte längre' };

    const planning = await loadPlanningData(orgId, data.year);
    const warnings = evaluateCandidate(
      {
        id: data.id ?? '∅new',
        operatorId: data.operatorId,
        startWeek,
        endWeek,
        status: data.status ?? existing?.status ?? 'DRAFT',
      },
      planning,
    );
    if (hasBlockingConflict(warnings) && !isAdmin) {
      return { ok: false, error: 'Veckan är låst för planering', warnings };
    }

    const payload = {
      operatorId: data.operatorId,
      year: data.year,
      startWeek,
      endWeek,
      status: data.status ?? existing?.status ?? 'DRAFT',
      note: data.note ?? existing?.note ?? null,
    } as const;

    const block = existing
      ? await db.absenceBlock.update({ where: { id: existing.id }, data: payload })
      : await db.absenceBlock.create({ data: payload });

    await audit(
      orgId,
      session.user.id,
      existing ? 'absence.move' : 'absence.create',
      'AbsenceBlock',
      block.id,
      existing,
      block,
    );

    revalidatePath('/planning');
    return { ok: true, warnings, blockId: block.id };
  } catch (error) {
    if (error instanceof AuthorizationError) return { ok: false, error: error.message };
    throw error;
  }
}

/** Delete a block from the board. Manager+ only. */
export async function deleteAbsenceBlock(input: unknown): Promise<PlanningActionResult> {
  try {
    const session = await requireManager();
    const parsed = z.object({ id: z.string().min(1).max(64) }).safeParse(input);
    if (!parsed.success) return { ok: false, error: 'Ogiltiga värden' };
    const { orgId } = session.user;

    const existing = await db.absenceBlock.findFirst({
      where: { id: parsed.data.id, operator: { orgId } },
    });
    if (!existing) return { ok: false, error: 'Blocket finns inte längre' };

    await db.absenceBlock.delete({ where: { id: existing.id } });
    await audit(orgId, session.user.id, 'absence.delete', 'AbsenceBlock', existing.id, existing, null);

    revalidatePath('/planning');
    return { ok: true };
  } catch (error) {
    if (error instanceof AuthorizationError) return { ok: false, error: error.message };
    throw error;
  }
}

const demandSchema = z.object({
  processId: z.string().min(1).max(64),
  year: z.number().int().min(2020).max(2100),
  week: z.number().int().min(1).max(53),
  required: z.number().int().min(0).max(50),
});

/** Inline demand edit on the board. Manager+ only. */
export async function setDemand(input: unknown): Promise<PlanningActionResult> {
  try {
    const session = await requireManager();
    const parsed = demandSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: 'Ogiltiga värden' };
    const { processId, year, week, required } = parsed.data;
    const { orgId } = session.user;

    const process = await db.process.findFirst({ where: { id: processId, orgId } });
    if (!process) return { ok: false, error: 'Okänd process' };

    const before = await db.demand.findUnique({
      where: { processId_year_week: { processId, year, week } },
    });
    const after = await db.demand.upsert({
      where: { processId_year_week: { processId, year, week } },
      update: { required },
      create: { processId, year, week, required },
    });
    await audit(orgId, session.user.id, 'demand.update', 'Demand', after.id, before, after);

    revalidatePath('/planning');
    return { ok: true };
  } catch (error) {
    if (error instanceof AuthorizationError) return { ok: false, error: error.message };
    throw error;
  }
}
