import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AbsenceStatus, Role } from '@prisma/client';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { isoWeek } from '@/lib/isoweek';
import { AppHeader } from '@/components/app-header';
import { Badge } from '@/components/ui/badge';
import { Panel } from '@/components/ui/panel';
import { scanCoverage } from '@/server/data/overview';
import { OUT_STATUSES } from '@/server/engine/coverage';

export const dynamic = 'force-dynamic';

const LEVEL_CLASS = {
  green: 'bg-ok/20 text-ok',
  yellow: 'bg-coverage-yellow/20 text-coverage-yellow',
  red: 'bg-alert/25 text-alert',
} as const;

const STATUS_TONE = {
  [AbsenceStatus.REQUESTED]: 'requested',
  [AbsenceStatus.PENDING]: 'pending',
  [AbsenceStatus.APPROVED]: 'approved',
} as const;

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  const { orgId, role } = session.user;
  if (role !== Role.MANAGER && role !== Role.ADMIN) redirect('/planning');

  const { data, cells } = await scanCoverage(orgId, 'projected');
  const { settings, operators, absences } = data;
  const year = settings.planningYear;

  const pendingCount = await db.absenceBlock.count({
    where: {
      year,
      operator: { orgId },
      status: { in: [AbsenceStatus.REQUESTED, AbsenceStatus.PENDING] },
    },
  });

  const now = new Date();
  const currentWeek =
    year === now.getFullYear()
      ? Math.min(Math.max(isoWeek(now), settings.startWeek), settings.startWeek + settings.visibleWeeks - 1)
      : settings.startWeek;

  const operatorById = new Map(operators.map((op) => [op.id, op]));
  const projected = OUT_STATUSES.projected;
  const awayInWeek = (week: number) =>
    absences
      .filter((a) => projected.has(a.status) && week >= a.startWeek && week <= a.endWeek)
      .map((a) => ({ ...a, operator: operatorById.get(a.operatorId) }))
      .filter((a) => a.operator?.active)
      .sort((a, b) => (a.operator!.name < b.operator!.name ? -1 : 1));

  const awayNow = awayInWeek(currentWeek);
  const awayNext = awayInWeek(currentWeek + 1);

  const problem = cells
    .filter((c) => c.level !== 'green')
    .sort((a, b) => {
      const deficit = b.required - b.covered - (a.required - a.covered);
      return deficit !== 0 ? deficit : a.week - b.week;
    });
  const redCount = problem.filter((c) => c.level === 'red').length;
  const yellowCount = problem.length - redCount;

  const tiles = [
    { label: 'Väntande ansökningar', value: pendingCount, href: '/requests' },
    { label: `Borta v.${currentWeek}`, value: awayNow.length, href: '/planning' },
    { label: 'Röda veckoceller', value: redCount, href: '/reports' },
    { label: 'Gula veckoceller', value: yellowCount, href: '/reports' },
  ];

  return (
    <div className="min-h-screen bg-bg">
      <AppHeader active="/dashboard" role={role} email={session.user.email ?? ''} userId={session.user.id} />
      <main className="mx-auto flex max-w-6xl flex-col gap-4 p-4">
        <h1 className="font-heading text-xl font-extrabold">Översikt {year}</h1>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {tiles.map((tile) => (
            <Link key={tile.label} href={tile.href}>
              <Panel className="p-4 transition-shadow duration-(--motion-base) hover:shadow-glow-accent">
                <div className="font-mono text-2xl font-bold">{tile.value}</div>
                <div className="mt-1 text-xs text-ink-muted">{tile.label}</div>
              </Panel>
            </Link>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Panel className="p-4">
            <h2 className="text-sm font-bold">Största bemanningsriskerna (prognos)</h2>
            {problem.length === 0 ? (
              <p className="mt-3 text-sm text-ink-muted">Ingen vecka under behovet — allt grönt.</p>
            ) : (
              <table className="mt-3 w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-ink-muted">
                    <th className="py-1 pr-2 font-semibold">Vecka</th>
                    <th className="py-1 pr-2 font-semibold">Skift</th>
                    <th className="py-1 pr-2 font-semibold">Process</th>
                    <th className="py-1 font-semibold">Bemanning</th>
                  </tr>
                </thead>
                <tbody>
                  {problem.slice(0, 10).map((c) => (
                    <tr key={`${c.week}-${c.shift}-${c.processId}`} className="border-t border-line">
                      <td className="py-1.5 pr-2 font-mono">v.{c.week}</td>
                      <td className="py-1.5 pr-2">{c.shift}</td>
                      <td className="py-1.5 pr-2">{c.processName}</td>
                      <td className="py-1.5">
                        <span className={`rounded-md px-2 py-0.5 font-mono text-xs font-bold ${LEVEL_CLASS[c.level]}`}>
                          {c.covered}/{c.required}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {problem.length > 10 && (
              <p className="mt-2 text-xs text-ink-muted">
                +{problem.length - 10} till —{' '}
                <Link href="/reports" className="font-semibold text-accent-2 hover:underline">
                  se hela rapporten
                </Link>
              </p>
            )}
          </Panel>

          <div className="flex flex-col gap-4">
            {[
              { title: `Borta vecka ${currentWeek}`, rows: awayNow },
              { title: `Borta vecka ${currentWeek + 1}`, rows: awayNext },
            ].map((section) => (
              <Panel key={section.title} className="p-4">
                <h2 className="text-sm font-bold">{section.title}</h2>
                {section.rows.length === 0 ? (
                  <p className="mt-3 text-sm text-ink-muted">Ingen frånvaro (prognos).</p>
                ) : (
                  <ul className="mt-3 flex flex-col gap-1.5">
                    {section.rows.map((a) => (
                      <li key={a.id} className="flex items-center justify-between gap-2 text-sm">
                        <span>
                          {a.operator!.name}
                          <span className="ml-2 text-xs text-ink-muted">{a.operator!.shift}</span>
                        </span>
                        <span className="flex items-center gap-2">
                          <span className="font-mono text-xs text-ink-muted">
                            v.{a.startWeek}–{a.endWeek}
                          </span>
                          <Badge tone={STATUS_TONE[a.status as keyof typeof STATUS_TONE] ?? 'muted'}>
                            {a.status}
                          </Badge>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </Panel>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
