import { useState, useMemo } from 'react';
import { PROCESSES } from '../data';

const CERT_COLORS = {
  'Avsyning':                  'var(--coral)',
  'Kapselresaren':             'var(--indigo)',
  'Serialisering':             '#2DD4BF',
  'Etikettering':              'var(--yellow)',
  'Granskning/uttag av dok':   '#60A5FA',
};

const firstInitial = name => (name.trim().split(/\s+/)[0]?.[0] || '').toUpperCase();

export default function OperatorPanel({
  operators, onUpdateOperator, showMgmt, onToggleMgmt, onAddOperator, onRemoveOperator,
  onDownloadTemplate, collapsed, onToggleCollapse,
  selectedOperatorId, onSelectOperator,
}) {
  const [editId, setEditId] = useState(null);
  const [newName, setNewName] = useState('');
  const [newShift, setNewShift] = useState('S1');
  const [search, setSearch] = useState('');

  const handleAdd = () => {
    if (!newName.trim()) return;
    onAddOperator(newName.trim(), newShift);
    setNewName('');
  };

  const q = search.trim().toLowerCase();
  const filteredOperators = q
    ? operators.filter(op =>
        op.name.toLowerCase().includes(q) ||
        op.certifications.some(c => c.toLowerCase().includes(q))
      )
    : operators;

  const groups = useMemo(() => {
    const s1 = filteredOperators.filter(o => o.shift === 'S1');
    const s2 = filteredOperators.filter(o => o.shift === 'S2');
    return [
      { label: 'Skift 1', shift: 'S1', ops: s1 },
      { label: 'Skift 2', shift: 'S2', ops: s2 },
    ].filter(g => g.ops.length > 0);
  }, [filteredOperators]);

  return (
    <div className={`w-[260px] min-w-[260px] overflow-y-auto h-full flex flex-col z-20 relative transition-all duration-200 ${collapsed ? 'sidebar-collapsed' : ''}`}
      style={{ background: 'var(--paper-2)', borderRight: '2px solid var(--ink)' }}>

      {/* Header with collapse toggle */}
      <div className="flex items-center justify-between px-3 py-3" style={{ borderBottom: '2px solid var(--ink)' }}>
        <button onClick={onToggleCollapse}
          className="flex items-center justify-center w-7 h-7 rounded-md text-xs font-bold transition-all duration-150"
          style={{ background: 'var(--ink)', color: 'var(--paper)' }}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
          {collapsed ? '▶' : '◀'}
        </button>
        <span className="sidebar-full-only font-mono font-bold text-[10px] tracking-[.22em] uppercase" style={{ color: 'var(--ink-soft)' }}>
          Operatörer
        </span>
        <div className="sidebar-full-only flex gap-2">
          <button onClick={onDownloadTemplate} className="nk-btn sm" aria-label="Download CSV template">
            CSV
          </button>
          {!showMgmt && (
            <button onClick={onToggleMgmt} className="nk-btn primary sm" aria-label="Add operator">
              + Add
            </button>
          )}
        </div>
      </div>

      {/* Add/Remove Operator Panel */}
      {showMgmt && (
        <div className="sidebar-full-only p-4" style={{ borderBottom: '2px solid var(--ink)', background: 'var(--panel)' }}>
          <div className="font-mono text-[10px] font-bold uppercase tracking-[.22em] mb-3" style={{ color: 'var(--ink-mute)' }}>
            Lägg till operatör
          </div>
          <input type="text" placeholder="Namn" value={newName} onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            className="w-full px-3 py-2 text-sm mb-2 outline-none"
            style={{ background: 'var(--paper)', border: '1.5px solid var(--ink)', borderRadius: 'var(--r-s)', color: 'var(--ink)' }} />
          <div className="flex gap-2 mb-2">
            <select value={newShift} onChange={e => setNewShift(e.target.value)}
              className="flex-1 px-3 py-2 text-sm outline-none"
              style={{ background: 'var(--paper)', border: '1.5px solid var(--ink)', borderRadius: 'var(--r-s)', color: 'var(--ink)' }}>
              <option value="S1">S1</option><option value="S2">S2</option>
            </select>
            <button onClick={handleAdd} className="nk-btn primary sm">Add</button>
          </div>
          <button onClick={onDownloadTemplate}
            className="w-full px-3 py-2 text-xs mt-2 font-semibold transition-opacity hover:opacity-70"
            style={{ background: 'var(--paper)', border: '1.5px dashed var(--ink)', borderRadius: 'var(--r-s)', color: 'var(--ink-soft)' }}>
            ↓ CSV-mall
          </button>
          <button onClick={onToggleMgmt}
            className="w-full px-3 py-2 text-xs mt-2 font-semibold transition-opacity hover:opacity-70"
            style={{ background: 'var(--paper)', border: '1.5px solid var(--ink)', borderRadius: 'var(--r-s)', color: 'var(--ink)' }}>
            Klar
          </button>
        </div>
      )}

      {/* Search */}
      <div className="sidebar-full-only pt-3">
        <div className="nk-op-filter">
          <span className="nk-glyph" aria-hidden="true">⌕</span>
          <input type="text" placeholder="Sök operatör eller certifiering…" value={search}
            aria-label="Search operators"
            onChange={e => setSearch(e.target.value)} />
          {search && (
            <button onClick={() => setSearch('')} aria-label="Clear search" className="nk-clear">
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Operator List */}
      <div className="sidebar-full-only flex-1 overflow-y-auto px-3 pb-3">
        {filteredOperators.length === 0 && (
          <div className="px-3 py-6 text-xs text-center font-mono uppercase tracking-widest" style={{ color: 'var(--ink-mute)' }}>
            Inga träffar
          </div>
        )}

        {groups.map(group => (
          <div key={group.shift}>
            <div className="nk-op-group-title">
              <span>{group.label}</span>
              <span className="nk-count">{group.ops.length}</span>
            </div>

            {group.ops.map(op => {
              const isOpen = editId === op.id;
              const isSelected = selectedOperatorId === op.id;
              const shiftClass = op.shift === 'S2' ? 's2' : 's1';
              return (
                <div key={op.id}>
                  <div
                    className={`nk-op-card ${isOpen ? 'open' : ''} ${isSelected ? 'selected' : ''}`}
                    style={{ opacity: op.active ? 1 : 0.45 }}
                    aria-label={op.name}
                    onClick={() => {
                      setEditId(isOpen ? null : op.id);
                      if (onSelectOperator) onSelectOperator(isSelected ? null : op.id);
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setEditId(isOpen ? null : op.id);
                        if (onSelectOperator) onSelectOperator(isSelected ? null : op.id);
                      }
                    }}>
                    <div className={`nk-op-avatar ${shiftClass}`}>{firstInitial(op.name)}</div>
                    <div className="flex items-center gap-1 flex-1 min-w-0">
                      {op.certifications.map(cert => (
                        <span
                          key={cert}
                          className="nk-cert-dot"
                          style={{ background: CERT_COLORS[cert] || 'var(--ink-mute)' }}
                          title={cert}
                        />
                      ))}
                    </div>
                  </div>

                  {isOpen && (
                    <div className="px-3 pb-4 pt-1 space-y-3 mb-2"
                      style={{ background: 'var(--panel)', border: '1.5px solid var(--ink)', borderRadius: 'var(--r-m)', marginTop: -2 }}>
                      <div className="pt-3">
                        <label className="font-mono text-[10px] block mb-1 font-bold uppercase tracking-[.2em]" style={{ color: 'var(--ink-mute)' }}>Namn</label>
                        <input type="text" value={op.name} onChange={e => onUpdateOperator(op.id, { name: e.target.value })}
                          className="w-full px-2.5 py-1.5 text-sm outline-none"
                          style={{ background: 'var(--paper)', border: '1.5px solid var(--ink)', borderRadius: 'var(--r-s)', color: 'var(--ink)' }} />
                      </div>
                      <div>
                        <label className="font-mono text-[10px] block mb-1 font-bold uppercase tracking-[.2em]" style={{ color: 'var(--ink-mute)' }}>Skift</label>
                        <select value={op.shift} onChange={e => onUpdateOperator(op.id, { shift: e.target.value })}
                          className="w-full px-2.5 py-1.5 text-sm outline-none"
                          style={{ background: 'var(--paper)', border: '1.5px solid var(--ink)', borderRadius: 'var(--r-s)', color: 'var(--ink)' }}>
                          <option value="S1">S1</option><option value="S2">S2</option>
                        </select>
                      </div>
                      <div className="flex items-center gap-2 pt-1">
                        <input type="checkbox" checked={op.active} onChange={e => onUpdateOperator(op.id, { active: e.target.checked })} id={`active-${op.id}`}
                          className="w-4 h-4" style={{ accentColor: 'var(--indigo)' }} />
                        <label htmlFor={`active-${op.id}`} className="text-sm font-medium" style={{ color: 'var(--ink)' }}>Aktiv</label>
                      </div>
                      <div className="pt-1">
                        <label className="font-mono text-[10px] block mb-1.5 font-bold uppercase tracking-[.2em]" style={{ color: 'var(--ink-mute)' }}>Certifieringar</label>
                        <div className="space-y-1.5">
                          {PROCESSES.map(p => (
                            <label key={p} className="flex items-center gap-2 text-sm" style={{ color: 'var(--ink)' }}>
                              <input type="checkbox" checked={op.certifications.includes(p)}
                                className="w-3.5 h-3.5" style={{ accentColor: 'var(--indigo)' }}
                                onChange={e => {
                                  const certs = e.target.checked ? [...op.certifications, p] : op.certifications.filter(c => c !== p);
                                  onUpdateOperator(op.id, { certifications: certs });
                                }} />
                              {p}
                            </label>
                          ))}
                        </div>
                      </div>
                      {showMgmt && (
                        <button onClick={() => { if (confirm(`Ta bort ${op.name}?`)) { onRemoveOperator(op.id); setEditId(null); } }}
                          className="w-full px-3 py-2 text-xs font-bold uppercase tracking-widest transition-opacity hover:opacity-80 mt-2"
                          style={{ color: 'var(--coral)', background: 'var(--paper)', border: '1.5px solid var(--coral)', borderRadius: 'var(--r-s)' }}>
                          Ta bort operatör
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
