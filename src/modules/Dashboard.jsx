import { buildDashboardSummary } from '../dashboard';
import OperatorAvatar from '../components/OperatorAvatar';

function Stat({ label, value, tone = 'neutral' }) {
  const colors = {
    neutral: 'var(--text-primary)',
    warning: 'var(--coverage-yellow)',
    danger: 'var(--coverage-red)',
    good: 'var(--coverage-green)',
  };
  return (
    <div className="px-4 py-3" style={{ borderRight: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
      <div className="text-xs font-semibold uppercase" style={{ color: 'var(--text-secondary)' }}>{label}</div>
      <div className="text-2xl font-extrabold" style={{ color: colors[tone] }}>{value}</div>
    </div>
  );
}

export default function Dashboard({
  operators = [],
  vacationBlocks = [],
  demand = {},
  processes = [],
  weeks = [],
  settings = {},
  holidayMap = {},
  onOpenPlanning,
}) {
  const summary = buildDashboardSummary({ operators, vacationBlocks, demand, processes, weeks, settings, holidayMap });

  return (
    <main className="flex-1 overflow-auto" style={{ background: 'var(--bg-primary)' }}>
      <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
        <div className="flex items-center gap-3">
          <div>
            <h2 className="text-xl font-extrabold" style={{ color: 'var(--text-primary)' }}>Plan health</h2>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Projected coverage and capacity risk at a glance.</p>
          </div>
          <button onClick={onOpenPlanning} className="ml-auto px-3 py-1.5 text-sm font-semibold"
            style={{ background: 'var(--accent)', color: '#fff', borderRadius: 'var(--border-radius)' }}>
            Open planning
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4" style={{ borderTop: '1px solid var(--border)' }}>
        <Stat label="Red weeks" value={summary.redWeeks.length} tone={summary.redWeeks.length ? 'danger' : 'good'} />
        <Stat label="Pending requests" value={summary.pendingCount} tone={summary.pendingCount ? 'warning' : 'good'} />
        <Stat label="Off this week" value={summary.offThisWeek.length} />
        <Stat label="Capacity gaps" value={summary.biggestGaps.length} tone={summary.biggestGaps.length ? 'danger' : 'good'} />
      </div>

      <div className="grid md:grid-cols-3 gap-0" style={{ borderTop: '1px solid var(--border)' }}>
        <section className="p-4" style={{ borderRight: '1px solid var(--border)' }}>
          <h3 className="text-sm font-extrabold mb-3" style={{ color: 'var(--text-primary)' }}>Red weeks</h3>
          {summary.redWeeks.length ? summary.redWeeks.map(week => (
            <button key={week} onClick={onOpenPlanning} className="mr-2 mb-2 px-2 py-1 text-xs font-semibold"
              style={{ color: 'var(--coverage-red)', background: 'var(--bg-secondary)', borderRadius: 'var(--border-radius)' }}>
              v.{week}
            </button>
          )) : <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>No red weeks in view.</p>}
        </section>

        <section className="p-4" style={{ borderRight: '1px solid var(--border)' }}>
          <h3 className="text-sm font-extrabold mb-3" style={{ color: 'var(--text-primary)' }}>Who's off</h3>
          {[...summary.offThisWeek, ...summary.offNextWeek].length ? [...summary.offThisWeek, ...summary.offNextWeek].map(op => (
            <div key={op.id} className="flex items-center gap-2 mb-2 text-sm" style={{ color: 'var(--text-primary)' }}>
              <OperatorAvatar operator={op} size={22} />
              {op.name}
            </div>
          )) : <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>No projected absences in the next two weeks.</p>}
        </section>

        <section className="p-4">
          <h3 className="text-sm font-extrabold mb-3" style={{ color: 'var(--text-primary)' }}>Biggest gaps</h3>
          {summary.biggestGaps.length ? summary.biggestGaps.map(gap => (
            <button key={`${gap.week}-${gap.processId}`} onClick={onOpenPlanning}
              className="block w-full text-left px-2 py-2 mb-2 text-sm"
              style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', borderRadius: 'var(--border-radius)' }}>
              <span className="font-semibold">{gap.processName}</span>
              <span className="ml-2" style={{ color: 'var(--coverage-red)' }}>-{gap.gap}</span>
              <span className="ml-2 text-xs" style={{ color: 'var(--text-secondary)' }}>v.{gap.week}</span>
            </button>
          )) : <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>No capacity gaps in view.</p>}
        </section>
      </div>
    </main>
  );
}
