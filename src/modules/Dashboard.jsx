import { useMemo } from 'react';
import { getAllCoverageForWeek } from '../coverage';
import OperatorAvatar from '../components/OperatorAvatar';

const PROJECTED = { absentStatuses: ['approved', 'pending', 'requested'] };

function currentIsoWeek() {
  const d = new Date();
  const target = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNr = (target.getUTCDay() + 6) % 7;
  target.setUTCDate(target.getUTCDate() - dayNr + 3);
  const firstThursday = new Date(Date.UTC(target.getUTCFullYear(), 0, 4));
  const firstDayNr = (firstThursday.getUTCDay() + 6) % 7;
  firstThursday.setUTCDate(firstThursday.getUTCDate() - firstDayNr + 3);
  return 1 + Math.round((target - firstThursday) / (7 * 24 * 3600 * 1000));
}

function Stat({ label, value, tone, onClick }) {
  const color = tone === 'red' ? 'var(--coverage-red)' : tone === 'amber' ? 'var(--coverage-yellow)' : 'var(--accent)';
  return (
    <button onClick={onClick} disabled={!onClick}
      className="flex flex-col items-start gap-1 px-5 py-4 rounded-xl text-left transition-transform hover:scale-[1.02] disabled:hover:scale-100"
      style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', minWidth: 160, cursor: onClick ? 'pointer' : 'default' }}>
      <span className="text-3xl font-extrabold" style={{ color, letterSpacing: '-0.03em' }}>{value}</span>
      <span className="text-xs uppercase tracking-wider font-semibold" style={{ color: 'var(--text-secondary)' }}>{label}</span>
    </button>
  );
}

export default function Dashboard({ operators, vacationBlocks, demand, settings, weeks, processes, holidayMap, onNavigate }) {
  const shiftMode = settings.shiftMode;
  const groups = shiftMode === 'separate' ? ['S1', 'S2'] : [null];

  const summary = useMemo(() => {
    const evalWeek = (week, opts) => {
      let redProcs = 0, worst = null;
      for (const shift of groups) {
        const cov = getAllCoverageForWeek(operators, vacationBlocks, demand, week, shiftMode, shift, holidayMap, processes, opts);
        for (const proc of processes) {
          const c = cov[proc];
          if (!c) continue;
          if (c.level === 'red') redProcs++;
          const deficit = c.required - c.covered;
          if (deficit > 0 && (!worst || deficit > worst.deficit)) {
            worst = { week, process: proc, shift, deficit, covered: c.covered, required: c.required };
          }
        }
      }
      return { redProcs, worst };
    };

    let redConfirmed = 0, redProjected = 0;
    const gaps = [];
    for (const w of weeks) {
      if (evalWeek(w, {}).redProcs > 0) redConfirmed++;
      const proj = evalWeek(w, PROJECTED);
      if (proj.redProcs > 0) redProjected++;
      if (proj.worst) gaps.push(proj.worst);
    }
    gaps.sort((a, b) => b.deficit - a.deficit);

    return { redConfirmed, redProjected, gaps: gaps.slice(0, 8) };
  }, [operators, vacationBlocks, demand, settings, weeks, processes, holidayMap, shiftMode]); // eslint-disable-line react-hooks/exhaustive-deps

  const pending = vacationBlocks.filter(b => b.status === 'pending' || b.status === 'requested');
  const approved = vacationBlocks.filter(b => b.status === 'approved');
  const thisWeek = currentIsoWeek();
  const offThisWeek = operators.filter(op =>
    vacationBlocks.some(b => b.operatorId === op.id && b.status === 'approved' && thisWeek >= b.startWeek && thisWeek <= b.endWeek));

  const opById = useMemo(() => Object.fromEntries(operators.map(o => [o.id, o])), [operators]);

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="flex items-baseline gap-3 mb-5">
        <h2 className="impact-heading text-lg" style={{ color: 'var(--accent)' }}>Dashboard</h2>
        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          v.{weeks[0]}–v.{weeks[weeks.length - 1]} · {shiftMode}
        </span>
      </div>

      {/* KPI cards */}
      <div className="flex gap-3 flex-wrap mb-6">
        <Stat label="Red weeks (confirmed)" value={summary.redConfirmed} tone={summary.redConfirmed ? 'red' : 'ok'} onClick={() => onNavigate?.('planning')} />
        <Stat label="Red weeks (projected)" value={summary.redProjected} tone={summary.redProjected ? 'amber' : 'ok'} onClick={() => onNavigate?.('planning')} />
        <Stat label="Pending requests" value={pending.length} tone={pending.length ? 'amber' : 'ok'} onClick={() => onNavigate?.('planning')} />
        <Stat label="Approved leaves" value={approved.length} tone="ok" />
        <Stat label="Off this week" value={offThisWeek.length} tone="ok" />
      </div>

      <div className="grid gap-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
        {/* Biggest gaps */}
        <section className="rounded-xl p-4" style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)' }}>
          <h3 className="text-sm font-bold mb-3 uppercase tracking-wide" style={{ color: 'var(--text-primary)' }}>Biggest capacity gaps (projected)</h3>
          {summary.gaps.length === 0 && <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>No gaps — every process is covered. 🎉</p>}
          <ul className="space-y-1.5">
            {summary.gaps.map((g, i) => (
              <li key={i} className="flex items-center gap-2 text-sm">
                <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: 'var(--coverage-red)', color: '#fff' }}>−{g.deficit}</span>
                <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{g.process}</span>
                <span style={{ color: 'var(--text-secondary)' }}>v.{g.week}{g.shift ? ` · ${g.shift}` : ''}</span>
                <span className="ml-auto text-xs" style={{ color: 'var(--text-secondary)' }}>{g.covered}/{g.required}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Off this week */}
        <section className="rounded-xl p-4" style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)' }}>
          <h3 className="text-sm font-bold mb-3 uppercase tracking-wide" style={{ color: 'var(--text-primary)' }}>Off this week (v.{thisWeek})</h3>
          {offThisWeek.length === 0 && <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Everyone is in this week.</p>}
          <div className="flex flex-wrap gap-2">
            {offThisWeek.map(op => (
              <span key={op.id} className="flex items-center gap-1.5 px-2 py-1 rounded-full text-sm" style={{ background: 'var(--bg-secondary)' }}>
                <OperatorAvatar operator={op} size={20} /> {op.name}
              </span>
            ))}
          </div>
        </section>

        {/* Pending approvals */}
        <section className="rounded-xl p-4" style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)' }}>
          <h3 className="text-sm font-bold mb-3 uppercase tracking-wide" style={{ color: 'var(--text-primary)' }}>Awaiting decision</h3>
          {pending.length === 0 && <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Nothing pending.</p>}
          <ul className="space-y-1.5">
            {pending.slice(0, 10).map(b => {
              const op = opById[b.operatorId];
              return (
                <li key={b.id} className="flex items-center gap-2 text-sm">
                  {op && <OperatorAvatar operator={op} size={20} />}
                  <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{op?.name ?? 'Unknown'}</span>
                  <span style={{ color: 'var(--text-secondary)' }}>v.{b.startWeek}{b.endWeek !== b.startWeek ? `–${b.endWeek}` : ''}</span>
                  <span className="ml-auto text-[10px] uppercase px-1.5 py-0.5 rounded-full" style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>{b.status}</span>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </div>
  );
}
