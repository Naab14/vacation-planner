import { useMemo } from 'react';
import { getAllCoverageForWeek } from '../coverage';
import { STATUS_LABELS } from '../components/calendar/constants';

const colorMap = { green: 'var(--coverage-green)', yellow: 'var(--coverage-yellow)', red: 'var(--coverage-red)' };

/** Printable plan: a coverage heatmap plus the leave schedule. */
export default function ExportPrint({ operators, vacationBlocks, demand, settings, weeks, processes, holidayMap, onExportCSV }) {
  const shiftMode = settings.shiftMode;
  const shift = shiftMode === 'separate' ? null : null; // heatmap is combined for the printable overview

  const heat = useMemo(() => {
    const map = {};
    for (const w of weeks) {
      map[w] = getAllCoverageForWeek(operators, vacationBlocks, demand, w, 'combined', shift, holidayMap, processes, { absentStatuses: ['approved', 'pending', 'requested'] });
    }
    return map;
  }, [operators, vacationBlocks, demand, weeks, processes, holidayMap]); // eslint-disable-line react-hooks/exhaustive-deps

  const leaves = vacationBlocks
    .map(b => ({ ...b, op: operators.find(o => o.id === b.operatorId) }))
    .filter(b => b.op)
    .sort((a, b) => a.startWeek - b.startWeek);

  return (
    <div className="flex-1 overflow-auto p-6 print-area">
      <style>{`@media print { .no-print { display: none !important; } body { background: #fff; } .print-area { padding: 0 !important; } }`}</style>

      <div className="flex items-center gap-3 mb-4 no-print">
        <h2 className="impact-heading text-lg" style={{ color: 'var(--accent)' }}>Export / Print</h2>
        <div className="ml-auto flex gap-2">
          <button onClick={() => window.print()} className="px-4 py-1.5 text-sm font-semibold rounded" style={{ background: 'var(--accent)', color: '#fff' }}>🖨️ Print</button>
          {onExportCSV && <button onClick={onExportCSV} className="px-4 py-1.5 text-sm font-semibold rounded" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>Export CSV</button>}
        </div>
      </div>

      <h1 className="text-xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Vacation Plan {settings.planningYear}</h1>
      <p className="text-sm mb-5" style={{ color: 'var(--text-secondary)' }}>Weeks {weeks[0]}–{weeks[weeks.length - 1]} · projected coverage (incl. pending/requested)</p>

      {/* Coverage heatmap */}
      <h3 className="text-sm font-bold mb-2 uppercase tracking-wide" style={{ color: 'var(--text-primary)' }}>Coverage heatmap</h3>
      <table className="border-collapse mb-8 text-xs">
        <thead>
          <tr>
            <th className="text-left px-2 py-1" style={{ borderBottom: '1px solid var(--border)' }}>Process</th>
            {weeks.map(w => <th key={w} className="px-1.5 py-1" style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)' }}>v.{w}</th>)}
          </tr>
        </thead>
        <tbody>
          {processes.map(proc => (
            <tr key={proc}>
              <td className="px-2 py-1 font-medium" style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-primary)' }}>{proc}</td>
              {weeks.map(w => {
                const c = heat[w]?.[proc];
                if (!c) return <td key={w} />;
                return (
                  <td key={w} className="text-center px-1.5 py-1 font-semibold"
                    style={{ borderBottom: '1px solid var(--border)', color: '#fff', background: colorMap[c.level] }}
                    title={`${proc} v.${w}: ${c.covered}/${c.required}`}>
                    {c.covered}/{c.required}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Leave schedule */}
      <h3 className="text-sm font-bold mb-2 uppercase tracking-wide" style={{ color: 'var(--text-primary)' }}>Leave schedule</h3>
      <table className="border-collapse text-sm" style={{ minWidth: 360 }}>
        <thead>
          <tr style={{ color: 'var(--text-secondary)' }}>
            <th className="text-left px-2 py-1" style={{ borderBottom: '1px solid var(--border)' }}>Operator</th>
            <th className="text-left px-2 py-1" style={{ borderBottom: '1px solid var(--border)' }}>Shift</th>
            <th className="text-left px-2 py-1" style={{ borderBottom: '1px solid var(--border)' }}>Weeks</th>
            <th className="text-left px-2 py-1" style={{ borderBottom: '1px solid var(--border)' }}>Status</th>
          </tr>
        </thead>
        <tbody>
          {leaves.map(b => (
            <tr key={b.id}>
              <td className="px-2 py-1" style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-primary)' }}>{b.op.name}</td>
              <td className="px-2 py-1" style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)' }}>{b.op.shift}</td>
              <td className="px-2 py-1" style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-primary)' }}>v.{b.startWeek}{b.endWeek !== b.startWeek ? `–${b.endWeek}` : ''}</td>
              <td className="px-2 py-1" style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)' }}>{STATUS_LABELS[b.status] || b.status}</td>
            </tr>
          ))}
          {leaves.length === 0 && <tr><td colSpan={4} className="px-2 py-4" style={{ color: 'var(--text-secondary)' }}>No leave booked.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
