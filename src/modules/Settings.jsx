function parseWeeks(value) {
  return String(value || '')
    .split(',')
    .map(part => Number(part.trim()))
    .filter(week => Number.isInteger(week) && week >= 1 && week <= 53);
}

function NumberField({ label, value, min, max, onChange }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold uppercase mb-1" style={{ color: 'var(--text-secondary)' }}>{label}</span>
      <input
        aria-label={label}
        type="number"
        min={min}
        max={max}
        value={value ?? ''}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full px-3 py-2 text-sm outline-none"
        style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 'var(--border-radius)', color: 'var(--text-primary)' }}
      />
    </label>
  );
}

export default function Settings({ settings = {}, onUpdateSettings }) {
  return (
    <main className="flex-1 overflow-auto" style={{ background: 'var(--bg-primary)' }}>
      <div className="px-5 py-4" style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
        <h2 className="text-xl font-extrabold" style={{ color: 'var(--text-primary)' }}>Settings</h2>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Planning, staffing, calendar, and guardrails.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-0">
        <section className="p-5 space-y-4" style={{ borderRight: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
          <h3 className="text-sm font-extrabold" style={{ color: 'var(--text-primary)' }}>Planning</h3>
          <NumberField label="Planning year" value={settings.planningYear} min={2020} max={2100}
            onChange={planningYear => onUpdateSettings?.({ planningYear })} />
          <NumberField label="Visible weeks" value={settings.visibleWeeks} min={4} max={52}
            onChange={visibleWeeks => onUpdateSettings?.({ visibleWeeks })} />
          <NumberField label="Start week" value={settings.startWeek} min={1} max={52}
            onChange={startWeek => onUpdateSettings?.({ startWeek })} />
        </section>

        <section className="p-5 space-y-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <h3 className="text-sm font-extrabold" style={{ color: 'var(--text-primary)' }}>Staffing</h3>
          <NumberField label="Minimum staffing" value={settings.minStaffing} min={0} max={20}
            onChange={minStaffing => onUpdateSettings?.({ minStaffing })} />
          <NumberField label="Allowed overlap" value={settings.allowedOverlap} min={0} max={20}
            onChange={allowedOverlap => onUpdateSettings?.({ allowedOverlap })} />
          <label className="block">
            <span className="block text-xs font-semibold uppercase mb-1" style={{ color: 'var(--text-secondary)' }}>Locked weeks</span>
            <input
              aria-label="Locked weeks"
              value={(settings.lockedWeeks || []).join(', ')}
              onChange={e => onUpdateSettings?.({ lockedWeeks: parseWeeks(e.target.value) })}
              placeholder="e.g. 28, 29, 30"
              className="w-full px-3 py-2 text-sm outline-none"
              style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 'var(--border-radius)', color: 'var(--text-primary)' }}
            />
          </label>
        </section>

        <section className="p-5 space-y-4" style={{ borderRight: '1px solid var(--border)' }}>
          <h3 className="text-sm font-extrabold" style={{ color: 'var(--text-primary)' }}>Calendar</h3>
          <label className="block">
            <span className="block text-xs font-semibold uppercase mb-1" style={{ color: 'var(--text-secondary)' }}>Holidays region</span>
            <select
              value={settings.holidaysRegion || 'SE'}
              onChange={e => onUpdateSettings?.({ holidaysRegion: e.target.value })}
              className="w-full px-3 py-2 text-sm outline-none"
              style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 'var(--border-radius)', color: 'var(--text-primary)' }}>
              <option value="SE">Sweden</option>
            </select>
          </label>
        </section>

        <section className="p-5">
          <h3 className="text-sm font-extrabold" style={{ color: 'var(--text-primary)' }}>Teams</h3>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Teams are stored in state and ready for group-specific planning rules.</p>
        </section>
      </div>
    </main>
  );
}
