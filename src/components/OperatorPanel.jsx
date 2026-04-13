import { useState } from 'react';
import { PROCESSES } from '../data';

export default function OperatorPanel({ operators, onUpdateOperator, showMgmt, onToggleMgmt, onAddOperator, onRemoveOperator, onDownloadTemplate }) {
  const [editId, setEditId] = useState(null);
  const [newName, setNewName] = useState('');
  const [newShift, setNewShift] = useState('S1');

  const handleAdd = () => {
    if (!newName.trim()) return;
    onAddOperator(newName.trim(), newShift);
    setNewName('');
  };

  return (
    <div
      className="w-[240px] min-w-[240px] overflow-y-auto h-full flex flex-col z-20 relative transition-colors duration-300"
      style={{
        background: 'var(--bg-panel)',
        borderRight: '1px solid var(--border)',
        boxShadow: '4px 0 20px -4px rgba(79,70,229,0.08)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-4"
        style={{ color: 'var(--text-primary)', borderBottom: '1px solid var(--border)' }}
      >
        <span
          className="text-xs font-black uppercase tracking-widest"
          style={{ fontFamily: 'var(--font-heading)', fontStyle: 'italic', color: 'var(--accent)', letterSpacing: '0.12em' }}
        >
          Operators
        </span>
        <div className="flex gap-2">
          <button
            onClick={onDownloadTemplate}
            className="px-2.5 py-1 text-xs font-bold rounded-lg shadow-sm hover:scale-105 active:scale-95 transition-all border"
            style={{ color: 'var(--accent)', background: 'rgba(79,70,229,0.07)', borderColor: 'rgba(79,70,229,0.2)' }}
          >
            CSV
          </button>
          {!showMgmt && (
            <button
              onClick={onToggleMgmt}
              className="px-2.5 py-1 text-xs font-bold rounded-lg shadow-sm hover:scale-105 active:scale-95 transition-all text-white"
              style={{ background: 'var(--accent)', boxShadow: '0 2px 8px rgba(79,70,229,0.35)' }}
            >
              + Add
            </button>
          )}
        </div>
      </div>

      {/* Add Operator Panel */}
      {showMgmt && (
        <div className="p-4 mb-1" style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
          <div
            className="text-xs font-black uppercase tracking-widest mb-3"
            style={{ fontFamily: 'var(--font-heading)', fontStyle: 'italic', color: 'var(--accent)' }}
          >
            Add Operator
          </div>
          <input
            type="text"
            placeholder="Name"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            className="w-full px-3 py-2 text-sm mb-2 shadow-sm focus:outline-none transition-shadow"
            style={{
              background: 'var(--bg-panel)',
              border: '1.5px solid var(--border)',
              borderRadius: 'var(--border-radius)',
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-body)',
            }}
            onFocus={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px rgba(79,70,229,0.12)'; }}
            onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}
          />
          <div className="flex gap-2 mb-2">
            <select
              value={newShift}
              onChange={e => setNewShift(e.target.value)}
              className="flex-1 px-3 py-2 text-sm focus:outline-none"
              style={{
                background: 'var(--bg-panel)',
                border: '1.5px solid var(--border)',
                borderRadius: 'var(--border-radius)',
                color: 'var(--text-primary)',
              }}
            >
              <option value="S1">S1</option>
              <option value="S2">S2</option>
            </select>
            <button
              onClick={handleAdd}
              className="px-4 py-2 text-sm font-bold rounded-lg text-white transition-all duration-200 hover:scale-[1.02] active:scale-95"
              style={{ background: 'var(--accent)', boxShadow: '0 2px 8px rgba(79,70,229,0.35)' }}
            >
              Add
            </button>
          </div>
          <button
            onClick={onDownloadTemplate}
            className="w-full px-3 py-2 text-xs mt-1 font-semibold hover:opacity-75 transition-opacity"
            style={{
              background: 'var(--bg-panel)',
              border: '1.5px dashed var(--border)',
              borderRadius: 'var(--border-radius)',
              color: 'var(--text-secondary)',
            }}
          >
            ↓ Download CSV Template
          </button>
          <button
            onClick={onToggleMgmt}
            className="w-full px-3 py-1.5 text-xs font-semibold mt-2 hover:opacity-75 transition-opacity rounded-lg"
            style={{ color: 'var(--text-secondary)' }}
          >
            Done
          </button>
        </div>
      )}

      {/* Operator List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {operators.map(op => (
          <div
            key={op.id}
            className="rounded-xl transition-all duration-200"
            style={{
              background: editId === op.id ? 'var(--bg-secondary)' : 'transparent',
              border: editId === op.id ? '1px solid var(--border)' : '1px solid transparent',
            }}
          >
            <div
              className="px-3 py-2.5 flex items-center gap-3 cursor-pointer rounded-xl text-sm transition-all duration-200 hover:scale-[1.01]"
              style={{
                opacity: op.active ? 1 : 0.35,
                color: 'var(--text-primary)',
              }}
              onMouseEnter={e => { if (editId !== op.id) e.currentTarget.style.background = 'rgba(79,70,229,0.05)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
              onClick={() => setEditId(editId === op.id ? null : op.id)}
            >
              <span className="flex-1 truncate font-semibold" style={{ fontFamily: 'var(--font-body)' }}>{op.name}</span>
              <span
                className="text-xs px-2 py-0.5 rounded-full font-black tracking-wide"
                style={{
                  background: op.shift === 'S1' ? 'var(--accent)' : 'var(--accent-secondary)',
                  color: '#fff',
                  fontSize: '0.65rem',
                  letterSpacing: '0.05em',
                  boxShadow: op.shift === 'S1'
                    ? '0 2px 6px rgba(79,70,229,0.35)'
                    : '0 2px 6px rgba(59,130,246,0.35)',
                }}
              >
                {op.shift}
              </span>
            </div>

            {/* Inline edit panel */}
            {editId === op.id && (
              <div className="px-3 pb-4 pt-1 space-y-3">
                <div>
                  <label className="text-xs block mb-1 font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)', fontSize: '0.65rem' }}>Name</label>
                  <input
                    type="text"
                    value={op.name}
                    onChange={e => onUpdateOperator(op.id, { name: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-sm focus:outline-none"
                    style={{
                      background: 'var(--bg-panel)',
                      border: '1.5px solid var(--border)',
                      borderRadius: 'var(--border-radius)',
                      color: 'var(--text-primary)',
                    }}
                    onFocus={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px rgba(79,70,229,0.12)'; }}
                    onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}
                  />
                </div>
                <div>
                  <label className="text-xs block mb-1 font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)', fontSize: '0.65rem' }}>Shift</label>
                  <select
                    value={op.shift}
                    onChange={e => onUpdateOperator(op.id, { shift: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-sm focus:outline-none"
                    style={{
                      background: 'var(--bg-panel)',
                      border: '1.5px solid var(--border)',
                      borderRadius: 'var(--border-radius)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    <option value="S1">S1</option>
                    <option value="S2">S2</option>
                  </select>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    checked={op.active}
                    onChange={e => onUpdateOperator(op.id, { active: e.target.checked })}
                    id={`active-${op.id}`}
                    className="w-4 h-4 rounded"
                    style={{ accentColor: 'var(--accent)' }}
                  />
                  <label htmlFor={`active-${op.id}`} className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Active</label>
                </div>
                <div className="pt-1">
                  <label className="text-xs block mb-1.5 font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)', fontSize: '0.65rem' }}>Certifications</label>
                  <div className="space-y-1.5">
                    {PROCESSES.map(p => (
                      <label key={p} className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-primary)' }}>
                        <input
                          type="checkbox"
                          checked={op.certifications.includes(p)}
                          className="w-3.5 h-3.5 rounded"
                          style={{ accentColor: 'var(--accent)' }}
                          onChange={e => {
                            const certs = e.target.checked
                              ? [...op.certifications, p]
                              : op.certifications.filter(c => c !== p);
                            onUpdateOperator(op.id, { certifications: certs });
                          }}
                        />
                        {p}
                      </label>
                    ))}
                  </div>
                </div>
                {showMgmt && (
                  <button
                    onClick={() => { if (confirm(`Remove ${op.name}?`)) { onRemoveOperator(op.id); setEditId(null); } }}
                    className="w-full px-3 py-2 text-xs font-bold rounded-lg transition-all duration-200 hover:scale-[1.02] active:scale-95 mt-2"
                    style={{
                      color: 'var(--accent-alert)',
                      background: 'rgba(244,63,94,0.07)',
                      border: '1.5px solid rgba(244,63,94,0.2)',
                    }}
                  >
                    Remove Operator
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
