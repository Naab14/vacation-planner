import { redirect } from 'next/navigation';
import { AbsenceStatus, Role } from '@prisma/client';
import { auth } from '@/auth';
import { AppHeader } from '@/components/app-header';
import {
  ReportsView,
  type OperatorSummary,
  type ReportAbsence,
} from '@/components/reports/reports-view';
import { scanCoverage } from '@/server/data/overview';

export const dynamic = 'force-dynamic';

const PROJECTED: AbsenceStatus[] = [
  AbsenceStatus.APPROVED,
  AbsenceStatus.PENDING,
  AbsenceStatus.REQUESTED,
];

export default async function ReportsPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  const { orgId, role } = session.user;
  if (role !== Role.MANAGER && role !== Role.ADMIN) redirect('/planning');

  const { data, weeks, cells } = await scanCoverage(orgId, 'projected');
  const { operators, absences, processes, settings } = data;

  const operatorById = new Map(operators.map((op) => [op.id, op]));
  const relevant = absences
    .filter((a) => PROJECTED.includes(a.status as AbsenceStatus) && operatorById.has(a.operatorId))
    .sort((a, b) => a.startWeek - b.startWeek);

  const absenceRows: ReportAbsence[] = relevant.map((a) => {
    const op = operatorById.get(a.operatorId)!;
    return {
      operator: op.name,
      shift: op.shift,
      status: a.status,
      startWeek: a.startWeek,
      endWeek: a.endWeek,
    };
  });

  const summaryByOperator = new Map<string, OperatorSummary>();
  for (const a of relevant) {
    const op = operatorById.get(a.operatorId)!;
    const row =
      summaryByOperator.get(op.id) ??
      ({ name: op.name, shift: op.shift, approvedWeeks: 0, projectedWeeks: 0, blocks: 0 } satisfies OperatorSummary);
    const length = a.endWeek - a.startWeek + 1;
    if (a.status === AbsenceStatus.APPROVED) row.approvedWeeks += length;
    else row.projectedWeeks += length;
    row.blocks += 1;
    summaryByOperator.set(op.id, row);
  }
  const summary = [...summaryByOperator.values()].sort((a, b) =>
    a.shift === b.shift ? a.name.localeCompare(b.name, 'sv') : a.shift.localeCompare(b.shift, 'sv'),
  );

  return (
    <div className="min-h-screen bg-bg">
      <AppHeader active="/reports" role={role} email={session.user.email ?? ''} userId={session.user.id} />
      <main className="mx-auto max-w-6xl p-4">
        <ReportsView
          year={settings.planningYear}
          weeks={weeks}
          shifts={settings.shifts}
          processes={processes}
          cells={cells}
          absences={absenceRows}
          summary={summary}
        />
      </main>
    </div>
  );
}
