'use server';

import { revalidatePath } from 'next/cache';
import { AbsenceStatus, LeaveDecision, Role } from '@prisma/client';
import { z } from 'zod';
import { db } from '@/lib/db';
import { AuthorizationError, requireManager, requireUser } from '@/lib/rbac';
import { notifyManagers, notifyUser } from '@/server/notify';

export interface RequestActionResult {
  ok: boolean;
  error?: string;
  blockId?: string;
}

function asResult(error: unknown): RequestActionResult {
  if (error instanceof AuthorizationError) return { ok: false, error: error.message };
  throw error;
}

async function audit(
  orgId: string,
  actorId: string,
  action: string,
  entityId: string,
  before: unknown,
  after: unknown,
) {
  await db.auditLog.create({
    data: {
      orgId,
      actorId,
      action,
      entity: 'AbsenceBlock',
      entityId,
      before: before == null ? undefined : JSON.parse(JSON.stringify(before)),
      after: after == null ? undefined : JSON.parse(JSON.stringify(after)),
    },
  });
}

const submitSchema = z.object({
  year: z.number().int().min(2020).max(2100),
  startWeek: z.number().int().min(1).max(53),
  endWeek: z.number().int().min(1).max(53),
  note: z.string().trim().max(500).optional(),
  /** Managers may submit on behalf of an operator; employees always use their own. */
  operatorId: z.string().min(1).max(64).optional(),
});

/** Employee submits a leave request → block enters REQUESTED + immutable trail entry. */
export async function submitLeaveRequest(input: unknown): Promise<RequestActionResult> {
  try {
    const session = await requireUser();
    const parsed = submitSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: 'Ogiltiga värden' };
    const data = parsed.data;
    const { orgId, role } = session.user;
    const isManager = role === Role.MANAGER || role === Role.ADMIN;

    const operatorId = isManager
      ? (data.operatorId ?? session.user.operatorId)
      : session.user.operatorId;
    if (!operatorId) return { ok: false, error: 'Ditt konto är inte kopplat till en operatör' };
    if (!isManager && data.operatorId && data.operatorId !== session.user.operatorId) {
      return { ok: false, error: 'Du kan bara ansöka för dig själv' };
    }

    const operator = await db.operator.findFirst({ where: { id: operatorId, orgId } });
    if (!operator) return { ok: false, error: 'Okänd operatör' };

    const startWeek = Math.min(data.startWeek, data.endWeek);
    const endWeek = Math.max(data.startWeek, data.endWeek);

    const settings = await db.settings.findUniqueOrThrow({ where: { orgId } });
    const locked = new Set(settings.lockedWeeks);
    for (let week = startWeek; week <= endWeek; week++) {
      if (locked.has(week)) return { ok: false, error: `v.${week} är låst för planering` };
    }

    const block = await db.absenceBlock.create({
      data: {
        operatorId,
        year: data.year,
        startWeek,
        endWeek,
        status: AbsenceStatus.REQUESTED,
        note: data.note || null,
      },
    });
    await db.leaveEvent.create({
      data: {
        absenceBlockId: block.id,
        requestedById: session.user.id,
        decision: LeaveDecision.SUBMITTED,
        comment: data.note || null,
      },
    });
    await audit(orgId, session.user.id, 'request.submit', block.id, null, block);
    await notifyManagers(orgId, 'request.submitted', {
      title: `Ny ledighetsansökan: ${operator.name} v.${startWeek}–${endWeek}`,
      body: data.note,
      href: '/requests',
      blockId: block.id,
    });

    revalidatePath('/requests');
    revalidatePath('/planning');
    return { ok: true, blockId: block.id };
  } catch (error) {
    return asResult(error);
  }
}

const decideSchema = z.object({
  blockId: z.string().min(1).max(64),
  decision: z.enum(['APPROVED', 'DENIED']),
  comment: z.string().trim().max(500).optional(),
});

/** Manager approves or denies a pending/requested block, with comment + trail + notification. */
export async function decideLeaveRequest(input: unknown): Promise<RequestActionResult> {
  try {
    const session = await requireManager();
    const parsed = decideSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: 'Ogiltiga värden' };
    const { blockId, decision, comment } = parsed.data;
    const { orgId } = session.user;

    const block = await db.absenceBlock.findFirst({
      where: { id: blockId, operator: { orgId } },
      include: { operator: { include: { user: { select: { id: true } } } }, events: true },
    });
    if (!block) return { ok: false, error: 'Ansökan finns inte längre' };
    if (block.status !== AbsenceStatus.REQUESTED && block.status !== AbsenceStatus.PENDING) {
      return { ok: false, error: 'Ansökan är redan avgjord' };
    }

    const submitEvent = block.events.find((e) => e.decision === LeaveDecision.SUBMITTED);

    const updated = await db.absenceBlock.update({
      where: { id: block.id },
      data: { status: decision === 'APPROVED' ? AbsenceStatus.APPROVED : AbsenceStatus.DENIED },
    });
    await db.leaveEvent.create({
      data: {
        absenceBlockId: block.id,
        requestedById: submitEvent?.requestedById ?? session.user.id,
        decidedById: session.user.id,
        decision: decision === 'APPROVED' ? LeaveDecision.APPROVED : LeaveDecision.DENIED,
        comment: comment || null,
      },
    });
    await audit(orgId, session.user.id, `request.${decision.toLowerCase()}`, block.id, block, updated);

    const recipient = block.operator.user?.id ?? submitEvent?.requestedById;
    if (recipient) {
      await notifyUser(orgId, recipient, 'request.decided', {
        title: `Din ansökan v.${block.startWeek}–${block.endWeek} ${decision === 'APPROVED' ? 'godkändes' : 'nekades'}`,
        body: comment,
        href: '/requests',
        blockId: block.id,
      });
    }

    revalidatePath('/requests');
    revalidatePath('/planning');
    return { ok: true, blockId: block.id };
  } catch (error) {
    return asResult(error);
  }
}

/** Requester withdraws an undecided request. Trail keeps a CANCELLED row; block becomes DRAFT. */
export async function cancelLeaveRequest(input: unknown): Promise<RequestActionResult> {
  try {
    const session = await requireUser();
    const parsed = z.object({ blockId: z.string().min(1).max(64) }).safeParse(input);
    if (!parsed.success) return { ok: false, error: 'Ogiltiga värden' };
    const { orgId, role } = session.user;
    const isManager = role === Role.MANAGER || role === Role.ADMIN;

    const block = await db.absenceBlock.findFirst({
      where: { id: parsed.data.blockId, operator: { orgId } },
    });
    if (!block) return { ok: false, error: 'Ansökan finns inte längre' };
    if (!isManager && block.operatorId !== session.user.operatorId) {
      return { ok: false, error: 'Du kan bara återkalla dina egna ansökningar' };
    }
    if (block.status !== AbsenceStatus.REQUESTED && block.status !== AbsenceStatus.PENDING) {
      return { ok: false, error: 'Ansökan är redan avgjord' };
    }

    const updated = await db.absenceBlock.update({
      where: { id: block.id },
      data: { status: AbsenceStatus.DRAFT },
    });
    await db.leaveEvent.create({
      data: {
        absenceBlockId: block.id,
        requestedById: session.user.id,
        decision: LeaveDecision.CANCELLED,
      },
    });
    await audit(orgId, session.user.id, 'request.cancel', block.id, block, updated);

    revalidatePath('/requests');
    revalidatePath('/planning');
    return { ok: true };
  } catch (error) {
    return asResult(error);
  }
}

/** Mark all of the current user's notifications as read. */
export async function markNotificationsRead(): Promise<RequestActionResult> {
  try {
    const session = await requireUser();
    await db.notification.updateMany({
      where: { userId: session.user.id, readAt: null },
      data: { readAt: new Date() },
    });
    revalidatePath('/requests');
    return { ok: true };
  } catch (error) {
    return asResult(error);
  }
}
