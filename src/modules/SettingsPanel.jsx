/** Practical settings: planning window, staffing rules, and locked weeks. */
export default function SettingsPanel({ settings, onUpdateSettings, weeks }) {
  const num = (key, label, { min = 0, max = 52, help } = {}) => (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>{label}</span>
      <input type="number" min={min} max={max} value={settings[key] ?? 0}
        onChange={e => onUpdateSettings({ [key]: Math.max(min, Math.min(max, parseInt(e.target.value) || 0)) })}
        className="px-3 py-1.5 text-sm outline-none" style={{ width: 120, background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 'var(--border-radius)', color: 'var(--text-primary)' }} />
      {help && <span className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>{help}</span>}
    </label>
  );

  const lockedWeeks = settings.lockedWeeks || [];
  const toggleLock = w => {
    const next = lockedWeeks.includes(w) ? lockedWeeks.filter(x => x !== w) : [...lockedWeeks, w].sort((a, b) => a - b);
    onUpdateSettings({ lockedWeeks: next });
  };

  return (
    <div className="flex-1 overflow-auto p-6">
      <h2 className="impact-heading text-lg mb-5" style={{ color: 'var(--accent)' }}>Settings</h2>

      <section className="rounded-xl p-5 mb-5" style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', maxWidth: 640 }}>
        <h3 className="text-sm font-bold mb-4 uppercase tracking-wide" style={{ color: 'var(--text-primary)' }}>Planning window</h3>
        <div className="flex gap-5 flex-wrap">
          {num('planningYear', 'Planning year', { min: 2000, max: 2100 })}
          {num('startWeek', 'Start week', { min: 1, max: 52 })}
          {num('visibleWeeks', 'Visible weeks', { min: 1, max: 52 })}
        </div>
      </section>

      <section className="rounded-xl p-5 mb-5" style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', maxWidth: 640 }}>
        <h3 className="text-sm font-bold mb-4 uppercase tracking-wide" style={{ color: 'var(--text-primary)' }}>Staffing rules</h3>
        <div className="flex gap-5 flex-wrap">
          {num('defaultRequired', 'Default required', { min: 0, max: 20, help: 'Demand for newly added processes' })}
          {num('minStaffing', 'Min staffing', { min: 0, max: 20, help: '0 = off' })}
          {num('allowedOverlap', 'Allowed overlap', { min: 0, max: 50, help: 'Max absences per shift/week · 0 = unlimited' })}
        </div>
      </section>

      <section className="rounded-xl p-5" style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', maxWidth: 640 }}>
        <h3 className="text-sm font-bold mb-1 uppercase tracking-wide" style={{ color: 'var(--text-primary)' }}>Locked weeks</h3>
        <p className="text-[11px] mb-3" style={{ color: 'var(--text-secondary)' }}>Locked weeks warn before changes on the planning board.</p>
        <div className="flex flex-wrap gap-1.5">
          {weeks.map(w => {
            const locked = lockedWeeks.includes(w);
            return (
              <button key={w} onClick={() => toggleLock(w)}
                aria-pressed={locked}
                className="px-2.5 py-1 text-xs rounded-full font-medium transition-colors"
                style={{ background: locked ? 'var(--accent-alert)' : 'var(--bg-secondary)', color: locked ? '#fff' : 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                {locked ? '🔒 ' : ''}v.{w}
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
