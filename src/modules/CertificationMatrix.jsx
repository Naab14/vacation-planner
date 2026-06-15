import { useState, useMemo } from 'react';
import OperatorAvatar from '../components/OperatorAvatar';

/**
 * Editable competence grid: operators (rows) × processes (columns). Toggling a
 * cell flows through onToggleCert into shared state, so coverage and the planning
 * board update immediately. Processes can be added, renamed, or removed here.
 */
export default function CertificationMatrix({
  operators, processes,
  onToggleCert, onAddProcess, onRenameProcess, onRemoveProcess,
}) {
  const [search, setSearch] = useState('');
  const [newProc, setNewProc] = useState('');
  const [renaming, setRenaming] = useState(null); // { name, value }

  const q = search.trim().toLowerCase();
  const rows = q
    ? operators.filter(op =>
        op.name.toLowerCase().includes(q) ||
        (op.certifications || []).some(c => c.toLowerCase().includes(q)))
    : operators;

  const perProcessCount = useMemo(() => {
    const m = {};
    for (const p of processes) m[p] = operators.filter(o => o.active && o.certifications?.includes(p)).length;
    return m;
  }, [operators, processes]);

  const handleAdd = () => {
    const name = newProc.trim();
    if (!name) return;
    onAddProcess(name);
    setNewProc('');
  };

  const commitRename = () => {
    if (renaming && renaming.value.trim() && renaming.value.trim() !== renaming.name) {
      onRenameProcess(renaming.name, renaming.value.trim());
    }
    setRenaming(null);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header / controls */}
      <div className="flex items-center gap-3 px-5 py-3 flex-wrap" style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
        <h2 className="impact-heading text-base" style={{ color: 'var(--accent)' }}>Certification Matrix</h2>
        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{operators.length} operators · {processes.length} processes</span>
        <div className="relative ml-auto">
          <input type="text" placeholder="Search name or certification" value={search}
            aria-label="Search matrix"
            onChange={e => setSearch(e.target.value)}
            className="pl-3 pr-8 py-1.5 text-sm shadow-sm outline-none"
            style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 'var(--border-radius)', color: 'var(--text-primary)', width: 240 }} />
          {search && (
            <button onClick={() => setSearch('')} aria-label="Clear search"
              className="absolute right-1 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center text-xs rounded hover:bg-black/5"
              style={{ color: 'var(--text-secondary)' }}>×</button>
          )}
        </div>
        <div className="flex items-center gap-1">
          <input type="text" placeholder="New process" value={newProc}
            aria-label="New process name"
            onChange={e => setNewProc(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            className="px-3 py-1.5 text-sm shadow-sm outline-none"
            style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 'var(--border-radius)', color: 'var(--text-primary)', width: 150 }} />
          <button onClick={handleAdd} className="px-3 py-1.5 text-sm font-semibold rounded"
            style={{ background: 'var(--accent)', color: '#fff' }}>+ Add</button>
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-auto">
        <table className="border-collapse" style={{ minWidth: '100%' }}>
          <thead>
            <tr style={{ position: 'sticky', top: 0, zIndex: 2 }}>
              <th className="text-left px-3 py-2 text-xs font-semibold uppercase tracking-wider"
                style={{ position: 'sticky', left: 0, zIndex: 3, background: 'var(--bg-secondary)', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)', borderRight: '1px solid var(--border)', minWidth: 200 }}>
                Operator
              </th>
              {processes.map(proc => (
                <th key={proc} className="px-2 py-2 text-xs font-medium"
                  style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)', borderRight: '1px solid var(--border)', minWidth: 110, verticalAlign: 'bottom' }}>
                  {renaming?.name === proc ? (
                    <input autoFocus value={renaming.value}
                      onChange={e => setRenaming({ name: proc, value: e.target.value })}
                      onBlur={commitRename}
                      onKeyDown={e => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') setRenaming(null); }}
                      className="w-full px-1 py-0.5 text-xs outline-none"
                      style={{ background: 'var(--bg-primary)', border: '1px solid var(--accent)', borderRadius: 4, color: 'var(--text-primary)' }} />
                  ) : (
                    <div className="flex flex-col items-center gap-1">
                      <button onClick={() => setRenaming({ name: proc, value: proc })}
                        title="Click to rename" className="font-semibold hover:underline" style={{ color: 'var(--text-primary)' }}>
                        {proc}
                      </button>
                      <span className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>{perProcessCount[proc]} cert.</span>
                      <button onClick={() => { if (confirm(`Remove process "${proc}"? This clears it from all operators and demand.`)) onRemoveProcess(proc); }}
                        title="Remove process" aria-label={`Remove ${proc}`}
                        className="text-[10px] hover:opacity-100 opacity-50" style={{ color: 'var(--accent-alert)' }}>✕</button>
                    </div>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(op => (
              <tr key={op.id} style={{ opacity: op.active ? 1 : 0.45 }}>
                <td className="px-3 py-1.5 text-sm"
                  style={{ position: 'sticky', left: 0, zIndex: 1, background: 'var(--bg-primary)', borderBottom: '1px solid var(--border)', borderRight: '1px solid var(--border)' }}>
                  <div className="flex items-center gap-2">
                    <OperatorAvatar operator={op} size={22} />
                    <span className="truncate font-medium" style={{ color: 'var(--text-primary)' }}>{op.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full font-mono ml-auto" style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>{op.shift}</span>
                  </div>
                </td>
                {processes.map(proc => {
                  const has = op.certifications?.includes(proc);
                  return (
                    <td key={proc} className="text-center"
                      style={{ borderBottom: '1px solid var(--border)', borderRight: '1px solid var(--border)' }}>
                      <button
                        onClick={() => onToggleCert(op.id, proc)}
                        aria-label={`${op.name} — ${proc}: ${has ? 'certified' : 'not certified'}`}
                        aria-pressed={has}
                        className="w-full h-9 flex items-center justify-center transition-colors"
                        style={{ background: has ? 'rgba(16,185,129,0.14)' : 'transparent', color: has ? 'var(--coverage-green)' : 'var(--text-secondary)' }}>
                        {has ? '✓' : '·'}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={processes.length + 1} className="px-3 py-8 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>No matches</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
