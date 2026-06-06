import { useMemo } from 'react';
import { buildInsights } from '../insights';

/* ── Small presentational helpers ─────────────────────────────────────────── */

const VERDICT = {
  safe: { label: 'Safe to approve', color: 'var(--coverage-green)', icon: '✓' },
  caution: { label: 'Leaves a gap', color: 'var(--coverage-yellow)', icon: '!' },
  risky: { label: 'Would understaff', color: 'var(--coverage-red)', icon: '✕' },
};

function Stat({ value, label, color }) {
  return (
    <div className="flex flex-col items-center justify-center px-3 py-2 rounded-lg flex-1"
      style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
      <span className="text-xl font-extrabold leading-none" style={{ color }}>{value}</span>
      <span className="text-[10px] uppercase tracking-wide mt-1 text-center" style={{ color: 'var(--text-secondary)' }}>{label}</span>
    </div>
  );
}

function Section({ title, count, children }) {
  return (
    <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
      <div className="flex items-center gap-2 mb-2">
        <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>{title}</h3>
        {count != null && (
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
            style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>{count}</span>
        )}
      </div>
      {children}
    </div>
  );
}

function Empty({ children }) {
  return <p className="text-xs py-1" style={{ color: 'var(--text-secondary)' }}>{children}</p>;
}

/* ── Panel ────────────────────────────────────────────────────────────────── */

export default function InsightsPanel({
  state, weeks, holidayMap,
  onSetBlockStatus, onUpdateOperator, onJumpToWeek, onClose,
}) {
  const insights = useMemo(
    () => buildInsights(state, { weeks, holidayMap }),
    [state, weeks, holidayMap],
  );

  const { redWeeks, yellowWeeks, risks, spofs, crossTraining, approvals } = insights;
  const separate = state.settings.shiftMode === 'separate';
  const grp = g => (separate && g.groupLabel ? ` · ${g.groupLabel}` : '');

  const applyCrossTrain = rec => {
    const op = state.operators.find(o => o.id === rec.operatorId);
    if (!op) return;
    onUpdateOperator(op.id, { certifications: [...op.certifications, rec.process] });
  };

  return (
    <>
      <div className="insights-backdrop" onClick={onClose} aria-hidden="true" />
      <aside className="insights-panel" role="dialog" aria-label="Planning assistant">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
          <div>
            <h2 className="text-sm font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>Planning Assistant</h2>
            <p className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>Full season · {state.settings.shiftMode} shifts</p>
          </div>
          <button onClick={onClose} aria-label="Close planning assistant"
            className="w-7 h-7 flex items-center justify-center rounded-md text-sm hover:opacity-70"
            style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
            ✕
          </button>
        </div>

        {/* Summary stats */}
        <div className="flex gap-2 px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
          <Stat value={redWeeks} label="Understaffed" color="var(--coverage-red)" />
          <Stat value={yellowWeeks} label="At risk" color="var(--coverage-yellow)" />
          <Stat value={spofs.length} label="Single points" color="var(--accent)" />
        </div>

        <div className="overflow-y-auto flex-1">
          {/* Approval queue */}
          <Section title="Approval queue" count={approvals.length}>
            {approvals.length === 0 && <Empty>No pending requests to review.</Empty>}
            <div className="space-y-2">
              {approvals.map(({ block, operator, verdict, conflicts }) => {
                const v = VERDICT[verdict];
                return (
                  <div key={block.id} className="rounded-lg p-2.5" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                          {operator?.name ?? 'Unknown'}
                        </div>
                        <div className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                          v.{block.startWeek}{block.endWeek !== block.startWeek ? `–${block.endWeek}` : ''} · {block.status}
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap"
                        style={{ color: '#fff', background: v.color }}>
                        {v.icon} {v.label}
                      </span>
                    </div>

                    {conflicts.length > 0 && (
                      <ul className="mt-1.5 space-y-0.5">
                        {conflicts.slice(0, 4).map((c, i) => (
                          <li key={i} className="text-[11px] flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                            <span style={{ color: c.to === 'red' ? 'var(--coverage-red)' : 'var(--coverage-yellow)' }}>●</span>
                            {c.process} v.{c.week} → {c.covered}/{c.required}
                          </li>
                        ))}
                        {conflicts.length > 4 && (
                          <li className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>+{conflicts.length - 4} more…</li>
                        )}
                      </ul>
                    )}

                    <div className="flex gap-2 mt-2">
                      <button onClick={() => onSetBlockStatus(block.id, 'approved')}
                        className="flex-1 text-xs font-semibold py-1.5 rounded-md transition-all hover:opacity-90 active:scale-95"
                        style={verdict === 'safe'
                          ? { background: 'var(--coverage-green)', color: '#fff' }
                          : { background: 'var(--bg-primary)', color: 'var(--text-primary)', border: `1px solid ${v.color}` }}>
                        {verdict === 'safe' ? 'Approve' : 'Approve anyway'}
                      </button>
                      <button onClick={() => onJumpToWeek(block.startWeek)}
                        className="text-xs py-1.5 px-2.5 rounded-md hover:opacity-80"
                        style={{ background: 'var(--bg-primary)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
                        title="Jump to this week in the grid">
                        View
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </Section>

          {/* Cross-training */}
          <Section title="Cross-training to remove risk" count={crossTraining.length}>
            {crossTraining.length === 0 && <Empty>No single training closes a coverage gap right now.</Empty>}
            <div className="space-y-2">
              {crossTraining.map(rec => (
                <div key={`${rec.operatorId}-${rec.process}`} className="rounded-lg p-2.5 flex items-center gap-2"
                  style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm" style={{ color: 'var(--text-primary)' }}>
                      Train <span className="font-semibold">{rec.operatorName}</span>
                      <span className="opacity-60"> on </span>
                      <span className="font-semibold">{rec.process}</span>
                    </div>
                    <div className="text-[11px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                      resolves
                      {rec.resolvedRed > 0 && <span style={{ color: 'var(--coverage-red)' }}> {rec.resolvedRed} understaffed</span>}
                      {rec.resolvedRed > 0 && rec.resolvedYellow > 0 && ' ·'}
                      {rec.resolvedYellow > 0 && <span style={{ color: 'var(--coverage-yellow)' }}> {rec.resolvedYellow} at-risk</span>}
                      {' week'}{rec.resolvedRed + rec.resolvedYellow > 1 ? 's' : ''}
                    </div>
                  </div>
                  <button onClick={() => applyCrossTrain(rec)}
                    className="text-xs font-semibold py-1.5 px-3 rounded-md whitespace-nowrap transition-all hover:opacity-90 active:scale-95"
                    style={{ background: 'var(--accent)', color: '#fff' }}>
                    Apply
                  </button>
                </div>
              ))}
            </div>
          </Section>

          {/* Single points of failure */}
          <Section title="Single points of failure" count={spofs.length}>
            {spofs.length === 0 && <Empty>Every process has at least two certified operators. 🎉</Empty>}
            <div className="space-y-1.5">
              {spofs.map(s => (
                <div key={`${s.process}-${s.groupLabel}`} className="flex items-center justify-between text-xs rounded-md px-2.5 py-1.5"
                  style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--text-primary)' }}>{s.process}{grp(s)}</span>
                  <span className="font-bold px-2 py-0.5 rounded-full"
                    style={{ color: '#fff', background: s.depth === 0 ? 'var(--coverage-red)' : 'var(--coverage-yellow)' }}>
                    {s.depth === 0 ? 'nobody certified' : `only ${s.operators[0].name}`}
                  </span>
                </div>
              ))}
            </div>
          </Section>

          {/* Coverage risks */}
          <Section title="Coverage risks" count={risks.length}>
            {risks.length === 0 && <Empty>No coverage gaps across the season. 🎉</Empty>}
            <div className="space-y-1">
              {risks.slice(0, 12).map((r, i) => (
                <button key={i} onClick={() => onJumpToWeek(r.week)}
                  className="w-full flex items-center justify-between text-xs rounded-md px-2.5 py-1.5 hover:opacity-80 transition-opacity"
                  style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                  <span className="flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
                    <span style={{ color: r.level === 'red' ? 'var(--coverage-red)' : 'var(--coverage-yellow)' }}>●</span>
                    {r.process}{grp(r)} · v.{r.week}
                  </span>
                  <span style={{ color: 'var(--text-secondary)' }}>{r.covered}/{r.required}</span>
                </button>
              ))}
              {risks.length > 12 && (
                <p className="text-[11px] pt-1" style={{ color: 'var(--text-secondary)' }}>+{risks.length - 12} more across the season…</p>
              )}
            </div>
          </Section>
        </div>
      </aside>
    </>
  );
}
