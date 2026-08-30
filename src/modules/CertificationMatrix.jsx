import { useState } from 'react';
import { defaultProcesses } from '../schema';
import OperatorAvatar from '../components/OperatorAvatar';

export default function CertificationMatrix({
  operators = [],
  processes = defaultProcesses,
  onToggleCertification,
  onAddProcess,
  onRenameProcess,
  onRemoveProcess,
}) {
  const [newProcess, setNewProcess] = useState('');

  const handleAdd = () => {
    const name = newProcess.trim();
    if (!name) return;
    onAddProcess?.(name);
    setNewProcess('');
  };

  return (
    <main className="flex-1 overflow-auto" style={{ background: 'var(--bg-primary)' }}>
      <div className="min-w-fit">
        <div className="sticky top-0 z-20 flex items-center gap-3 px-4 py-3"
          style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
          <div>
            <h2 className="text-lg font-extrabold" style={{ color: 'var(--text-primary)' }}>Certification matrix</h2>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Operators x processes</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <input
              value={newProcess}
              onChange={e => setNewProcess(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              placeholder="New process"
              className="px-3 py-1.5 text-sm outline-none"
              style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 'var(--border-radius)', color: 'var(--text-primary)' }}
            />
            <button
              onClick={handleAdd}
              className="px-3 py-1.5 text-sm font-semibold"
              style={{ background: 'var(--accent)', color: '#fff', borderRadius: 'var(--border-radius)' }}>
              Add process
            </button>
          </div>
        </div>

        <div className="grid" style={{ gridTemplateColumns: `220px repeat(${processes.length}, 150px)` }}>
          <div className="sticky left-0 top-[73px] z-20 px-3 py-2 text-xs font-semibold uppercase"
            style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)', borderRight: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
            Operator
          </div>
          {processes.map(process => (
            <div key={process.id} className="sticky top-[73px] z-10 px-2 py-2 text-xs font-semibold"
              style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', borderRight: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
              <input
                aria-label={`Rename ${process.name}`}
                value={process.name}
                onChange={e => onRenameProcess?.(process.id, e.target.value)}
                className="w-full px-2 py-1 text-xs font-semibold outline-none"
                style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 'var(--border-radius)', color: 'var(--text-primary)' }}
              />
              <button
                aria-label={`Remove ${process.name}`}
                onClick={() => onRemoveProcess?.(process.id)}
                className="mt-1 text-[10px]"
                style={{ color: 'var(--accent-alert)' }}>
                Remove
              </button>
            </div>
          ))}

          {operators.map(op => (
            <div key={op.id} className="contents">
              <div className="sticky left-0 z-10 flex items-center gap-2 px-3 py-2 text-sm"
                style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', borderRight: '1px solid var(--border)', borderBottom: '1px solid var(--border)', opacity: op.active ? 1 : 0.45 }}>
                <OperatorAvatar operator={op} size={24} />
                <div className="min-w-0">
                  <div className="truncate font-semibold">{op.name}</div>
                  <div className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>{op.shift}</div>
                </div>
              </div>
              {processes.map(process => {
                const checked = (op.certifications || []).includes(process.id) || (op.certifications || []).includes(process.name);
                return (
                  <label key={`${op.id}-${process.id}`} className="flex items-center justify-center"
                    style={{ minHeight: 42, borderRight: '1px solid var(--border)', borderBottom: '1px solid var(--border)', background: checked ? 'color-mix(in srgb, var(--coverage-green) 16%, var(--bg-primary))' : 'var(--bg-primary)' }}>
                    <input
                      type="checkbox"
                      aria-label={`${op.name} ${process.name}`}
                      checked={checked}
                      onChange={() => onToggleCertification?.(op.id, process.id)}
                      className="w-4 h-4"
                      style={{ accentColor: 'var(--accent)' }}
                    />
                  </label>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
