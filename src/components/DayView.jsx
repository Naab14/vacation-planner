import { PROCESSES } from '../data';
import { getCoverage } from '../coverage';

export default function DayView({ week, operators, vacationBlocks, demand, shiftMode, holidayMap, onBack, onWeekChange }) {
  const holidays = holidayMap[week]?.holidays || [];

  const getStatus = (op) => {
    const block = vacationBlocks.find(b => b.operatorId === op.id && week >= b.startWeek && week <= b.endWeek);
    if (!block) return { status: 'working', label: 'Working' };
    return { status: block.status, label: block.status === 'requested' ? 'Requested' : block.status.charAt(0).toUpperCase() + block.status.slice(1) };
  };

  const statusBg = {
    working: 'var(--coverage-green)',
    draft: 'var(--draft-bg)',
    pending: 'var(--pending-bg)',
    approved: 'var(--approved-bg)',
    requested: 'var(--requested-bg)',
  };

  return (
    <div className="flex-1 overflow-auto p-4">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={onBack} className="px-3 py-1.5 text-sm font-medium"
          style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--border-radius)', color: 'var(--text-primary)' }}>
          ← Vecka
        </button>
        <button onClick={() => onWeekChange(Math.max(1, week - 1))} className="px-2 py-1 text-sm"
          style={{ color: 'var(--text-primary)' }}>◀</button>
        <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
          Vecka {week}
        </h2>
        <button onClick={() => onWeekChange(Math.min(52, week + 1))} className="px-2 py-1 text-sm"
          style={{ color: 'var(--text-primary)' }}>▶</button>
      </div>

      {/* Holiday banner */}
      {holidays.length > 0 && (
        <div className="mb-4 p-3 rounded" style={{ background: 'var(--holiday-bg)', border: '1px solid var(--holiday-border)', borderRadius: 'var(--border-radius)' }}>
          <div className="text-sm font-medium" style={{ color: 'var(--holiday-text)' }}>
            Helgdag: {holidays.map(h => h.name).join(', ')}
          </div>
        </div>
      )}

      {/* Operator status table */}
      <div className="mb-6" style={{ border: '1px solid var(--border)', borderRadius: 'var(--border-radius)', overflow: 'hidden' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: 'var(--bg-secondary)' }}>
              <th className="text-left px-3 py-2" style={{ color: 'var(--text-secondary)' }}>Operator</th>
              <th className="text-left px-3 py-2" style={{ color: 'var(--text-secondary)' }}>Shift</th>
              <th className="text-left px-3 py-2" style={{ color: 'var(--text-secondary)' }}>Status</th>
              <th className="text-left px-3 py-2" style={{ color: 'var(--text-secondary)' }}>Certifications</th>
            </tr>
          </thead>
          <tbody>
            {operators.filter(o => o.active).map(op => {
              const { status, label } = getStatus(op);
              return (
                <tr key={op.id} style={{ borderTop: '1px solid var(--border)', opacity: status === 'approved' ? 0.5 : 1 }}>
                  <td className="px-3 py-2 font-medium" style={{ color: 'var(--text-primary)' }}>{op.name}</td>
                  <td className="px-3 py-2">
                    <span className="text-xs px-1.5 py-0.5 rounded font-mono"
                      style={{ background: op.shift === 'S1' ? 'var(--accent)' : 'var(--accent-secondary)', color: '#fff', borderRadius: 'var(--border-radius)' }}>
                      {op.shift}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <span className="text-xs px-2 py-0.5 rounded font-medium" style={{ background: statusBg[status], borderRadius: 'var(--border-radius)' }}>
                      {label}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {op.certifications.join(', ') || '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Coverage summary */}
      <h3 className="text-sm font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Coverage Summary</h3>
      <div className="grid grid-cols-2 gap-2" style={{ maxWidth: 500 }}>
        {PROCESSES.map(proc => {
          const cov = getCoverage(operators, vacationBlocks, demand, proc, week, shiftMode, null, holidayMap);
          const colorMap = { green: 'var(--coverage-green)', yellow: 'var(--coverage-yellow)', red: 'var(--coverage-red)' };
          return (
            <div key={proc} className="p-2 rounded" style={{ border: '1px solid var(--border)', borderRadius: 'var(--border-radius)' }}>
              <div className="text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>{proc}</div>
              <div className="text-lg font-bold" style={{ color: colorMap[cov.level] }}>{cov.covered}/{cov.required}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
