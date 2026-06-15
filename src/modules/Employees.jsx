import { useState } from 'react';
import OperatorAvatar from '../components/OperatorAvatar';

/** Full-width employee management: add, edit, search (name+cert), CSV in/out. */
export default function Employees({
  operators, processes,
  onUpdateOperator, onAddOperator, onRemoveOperator,
  onImportCSV, onExportCSV, onDownloadTemplate,
}) {
  const [search, setSearch] = useState('');
  const [newName, setNewName] = useState('');
  const [newShift, setNewShift] = useState('S1');
  const [expanded, setExpanded] = useState(null);

  const q = search.trim().toLowerCase();
  const rows = q
    ? operators.filter(op =>
        op.name.toLowerCase().includes(q) ||
        (op.certifications || []).some(c => c.toLowerCase().includes(q)))
    : operators;

  const handleAdd = () => {
    if (!newName.trim()) return;
    onAddOperator(newName.trim(), newShift);
    setNewName('');
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-3 flex-wrap" style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
        <h2 className="impact-heading text-base" style={{ color: 'var(--accent)' }}>Employees</h2>
        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{operators.length} total</span>

        <div className="flex items-center gap-1 ml-auto">
          <input type="text" placeholder="Name" value={newName}
            aria-label="New employee name"
            onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAdd()}
            className="px-3 py-1.5 text-sm outline-none" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 'var(--border-radius)', color: 'var(--text-primary)', width: 160 }} />
          <select value={newShift} onChange={e => setNewShift(e.target.value)}
            className="px-2 py-1.5 text-sm outline-none" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 'var(--border-radius)', color: 'var(--text-primary)' }}>
            <option value="S1">S1</option><option value="S2">S2</option>
          </select>
          <button onClick={handleAdd} className="px-3 py-1.5 text-sm font-semibold rounded" style={{ background: 'var(--accent)', color: '#fff' }}>+ Add</button>
        </div>
      </div>

      <div className="flex items-center gap-2 px-5 py-2 flex-wrap" style={{ borderBottom: '1px solid var(--border)' }}>
        <input type="text" placeholder="Search name or certification" value={search}
          aria-label="Search employees"
          onChange={e => setSearch(e.target.value)}
          className="px-3 py-1.5 text-sm outline-none" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 'var(--border-radius)', color: 'var(--text-primary)', width: 280 }} />
        <div className="flex gap-2 ml-auto">
          {onImportCSV && <button onClick={onImportCSV} className="px-3 py-1.5 text-xs font-semibold rounded" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>Import CSV</button>}
          {onExportCSV && <button onClick={onExportCSV} className="px-3 py-1.5 text-xs font-semibold rounded" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>Export CSV</button>}
          {onDownloadTemplate && <button onClick={onDownloadTemplate} className="px-3 py-1.5 text-xs font-semibold rounded" style={{ background: 'var(--bg-primary)', border: '1px dashed var(--border)', color: 'var(--text-secondary)' }}>Template</button>}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-3">
        <div className="space-y-1.5" style={{ maxWidth: 720 }}>
          {rows.map(op => (
            <div key={op.id} className="rounded-lg" style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)' }}>
              <div className="flex items-center gap-3 px-3 py-2.5 cursor-pointer" style={{ opacity: op.active ? 1 : 0.45 }}
                onClick={() => setExpanded(expanded === op.id ? null : op.id)}>
                <OperatorAvatar operator={op} />
                <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{op.name}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-mono" style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>{op.shift}</span>
                <span className="text-xs ml-auto" style={{ color: 'var(--text-secondary)' }}>{op.certifications?.length || 0} cert.</span>
              </div>
              {expanded === op.id && (
                <div className="px-3 pb-3 pt-1 space-y-3" style={{ borderTop: '1px solid var(--border)' }}>
                  <div className="flex gap-3 flex-wrap">
                    <label className="text-xs flex flex-col gap-1" style={{ color: 'var(--text-secondary)' }}>Name
                      <input value={op.name} onChange={e => onUpdateOperator(op.id, { name: e.target.value })}
                        className="px-2 py-1 text-sm outline-none" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 'var(--border-radius)', color: 'var(--text-primary)' }} />
                    </label>
                    <label className="text-xs flex flex-col gap-1" style={{ color: 'var(--text-secondary)' }}>Shift
                      <select value={op.shift} onChange={e => onUpdateOperator(op.id, { shift: e.target.value })}
                        className="px-2 py-1 text-sm outline-none" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 'var(--border-radius)', color: 'var(--text-primary)' }}>
                        <option value="S1">S1</option><option value="S2">S2</option>
                      </select>
                    </label>
                    <label className="text-xs flex items-center gap-2 mt-5" style={{ color: 'var(--text-primary)' }}>
                      <input type="checkbox" checked={op.active} onChange={e => onUpdateOperator(op.id, { active: e.target.checked })} style={{ accentColor: 'var(--accent)' }} />
                      Active
                    </label>
                  </div>
                  <div>
                    <div className="text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Certifications</div>
                    <div className="flex flex-wrap gap-2">
                      {processes.map(p => {
                        const has = op.certifications?.includes(p);
                        return (
                          <button key={p}
                            onClick={() => {
                              const certs = has ? op.certifications.filter(c => c !== p) : [...(op.certifications || []), p];
                              onUpdateOperator(op.id, { certifications: certs });
                            }}
                            className="px-2.5 py-1 text-xs rounded-full transition-colors"
                            style={{ background: has ? 'var(--accent)' : 'var(--bg-secondary)', color: has ? '#fff' : 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                            {has ? '✓ ' : ''}{p}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <button onClick={() => { if (confirm(`Remove ${op.name}?`)) { onRemoveOperator(op.id); setExpanded(null); } }}
                    className="px-3 py-1.5 text-xs font-semibold rounded" style={{ color: 'var(--accent-alert)', background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                    Remove
                  </button>
                </div>
              )}
            </div>
          ))}
          {rows.length === 0 && <p className="text-sm px-3 py-6" style={{ color: 'var(--text-secondary)' }}>No matches</p>}
        </div>
      </div>
    </div>
  );
}
