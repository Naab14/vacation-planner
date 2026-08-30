/** Thin vertical icon rail for switching between the app's modules. */
const VIEWS = [
  { id: 'planning', icon: '🗓️', label: 'Planning' },
  { id: 'matrix', icon: '🎓', label: 'Certifications' },
  { id: 'dashboard', icon: '📊', label: 'Dashboard' },
  { id: 'employees', icon: '👥', label: 'Employees' },
  { id: 'settings', icon: '⚙️', label: 'Settings' },
  { id: 'export', icon: '🖨️', label: 'Export' },
];

export default function NavRail({ view, onChange }) {
  return (
    <nav
      className="flex flex-col items-center py-3 gap-1 shrink-0 z-20"
      style={{ width: 60, background: 'var(--bg-panel)', borderRight: '1px solid var(--border)' }}
      aria-label="Modules">
      {VIEWS.map(v => {
        const active = view === v.id;
        return (
          <button
            key={v.id}
            onClick={() => onChange(v.id)}
            title={v.label}
            aria-label={v.label}
            aria-current={active ? 'page' : undefined}
            className="flex flex-col items-center justify-center gap-0.5 rounded-xl transition-all duration-150 hover:scale-105"
            style={{
              width: 48, height: 48,
              background: active ? 'var(--accent)' : 'transparent',
              color: active ? '#fff' : 'var(--text-secondary)',
              boxShadow: active ? '0 0 12px rgba(79,70,229,0.4)' : 'none',
            }}>
            <span style={{ fontSize: 18, lineHeight: 1 }}>{v.icon}</span>
            <span style={{ fontSize: 7, fontWeight: 700, letterSpacing: '0.02em' }} className="uppercase">
              {v.label.slice(0, 5)}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
