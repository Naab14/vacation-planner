const items = [
  { label: 'Utkast',   bg: 'var(--st-draft-bg)',    border: 'var(--st-draft-bd)',    style: {} },
  { label: 'Ansökt',   bg: 'var(--st-pending-bg)',  border: 'var(--st-pending-bd)',
    style: { backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px)', borderStyle: 'dashed' } },
  { label: 'Beviljad', bg: 'var(--st-approved-bg)', border: 'var(--st-approved-bd)', style: {} },
  { label: 'Helgdag',  bg: 'var(--holiday-bg)',     border: 'var(--holiday-border)', style: {} },
];

export default function Legend() {
  return (
    <div className="flex items-center gap-3 px-2 py-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
      {items.map(i => (
        <div key={i.label} className="flex items-center gap-1">
          <span className="w-4 h-3 rounded-sm inline-block" style={{ background: i.bg, border: `1px solid ${i.border}`, ...i.style }} />
          {i.label}
        </div>
      ))}
    </div>
  );
}
