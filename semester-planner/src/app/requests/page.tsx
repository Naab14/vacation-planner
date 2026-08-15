import { redirect } from 'next/navigation';
import { AbsenceStatus, Role } from '@prisma/client';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { AppHeader } from '@/components/app-header';
import { RequestsView, type RequestItem } from '@/components/requests/requests-view';
import { loadPlanningData } from '@/server/data/planning';
import { evaluateCandidate } from '@/server/engine/conflicts';

export const dynamic = 'force-dynamic';

export default async function RequestsPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  const { orgId, role } = session.user;
  const isManager = role === Role.MANAGER || role === Role.ADMIN;

  const settings = await db.settings.findUniqueOrThrow({ where: { orgId } });
  const year = settings.planningYear;

  const blocks = await db.absenceBlock.findMany({
    where: {
      year,
      operator: { orgId },
      // employees see their own requests; managers see everything with a trail
      ...(isManager
        ? { events: { some: {} } }
        : { operatorId: session.user.operatorId ?? '∅none' }),
    },
    include: {
      operator: { select: { id: true, name: true, shift: true } },
      events: {
        orderBy: { createdAt: 'asc' },
        include: {
          requestedBy: { select: { email: true } },
          decidedBy: { select: { email: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Decision support: what does approving each open request do to projected coverage,
  // compared to the plan without it? (its own projected status is excluded from "before")
  const planning = await loadPlanningData(orgId, year);
  const items: RequestItem[] = blocks.map((block) => {
    const isOpen = block.status === AbsenceStatus.REQUESTED || block.status === AbsenceStatus.PENDING;
    const warnings = isOpen
      ? evaluateCandidate(
          {
            id: '∅candidate',
            operatorId: block.operatorId,
            startWeek: block.startWeek,
            endWeek: block.endWeek,
            status: 'APPROVED',
          },
          { ...planning, absences: planning.absences.filter((a) => a.id !== block.id) },
        )
      : [];
    return {
      id: block.id,
      operatorName: block.operator.name,
      operatorShift: block.operator.shift,
      startWeek: block.startWeek,
      endWeek: block.endWeek,
      status: block.status,
      note: block.note,
      createdAt: block.createdAt.toISOString(),
      warnings: warnings.map((w) => w.message),
      events: block.events.map((e) => ({
        decision: e.decision,
        comment: e.comment,
        by: e.decidedBy?.email ?? e.requestedBy.email,
        at: e.createdAt.toISOString(),
      })),
      own: block.operatorId === session.user.operatorId,
    };
  });

  const notifications = await db.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  return (
    <div className="min-h-screen bg-bg">
      <AppHeader active="/requests" role={role} email={session.user.email ?? ''} userId={session.user.id} />
      <main className="p-4">
        <RequestsView
          items={items}
          isManager={isManager}
          canSubmit={!!session.user.operatorId || isManager}
          year={year}
          notifications={notifications.map((n) => ({
            id: n.id,
            title: String((n.payload as { title?: string }).title ?? n.type),
            body: (n.payload as { body?: string }).body ?? null,
            read: n.readAt !== null,
            at: n.createdAt.toISOString(),
          }))}
        />
      </main>
    </div>
  );
}
