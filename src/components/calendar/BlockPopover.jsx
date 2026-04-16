import { useEffect, useRef } from 'react';
import { STATUS_COLORS, STATUS_LABELS, STATUSES } from './constants';

export default function BlockPopover({ x, y, block, onSetStatus, onDelete, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    const keyHandler = e => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('mousedown', handler);
    document.addEventListener('keydown', keyHandler);
    return () => { document.removeEventListener('mousedown', handler); document.removeEventListener('keydown', keyHandler); };
  }, [onClose]);

  if (!block) return null;

  return (
    <div ref={ref} className="block-popover" style={{ left: x, top: y }}>
      <div className="px-3 py-1 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>Status</div>
      {STATUSES.map(s => (
        <button key={s} onClick={() => { onSetStatus(block.id, s); onClose(); }}
          className="w-full text-left px-3 py-1.5 text-sm hover:opacity-80 flex items-center gap-2"
          style={{ background: block.status === s ? 'var(--bg-secondary)' : 'transparent', color: 'var(--text-primary)' }}>
          <span className="w-3 h-3 rounded-sm inline-block"
            style={{ background: STATUS_COLORS[s].bg, border: `1px solid ${STATUS_COLORS[s].border}`,
              ...(s === 'requested' ? { backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px)', borderStyle: 'dashed' } : {})
            }} />
          {STATUS_LABELS[s]}
        </button>
      ))}
      <hr style={{ borderColor: 'var(--border)' }} className="my-1" />
      <button onClick={() => { onDelete(block.id); onClose(); }}
        className="w-full text-left px-3 py-1.5 text-sm text-red-600 hover:bg-red-50">Delete</button>
    </div>
  );
}
