import { useEffect, useRef, useState } from 'react';
import { STATUS_COLORS, STATUS_LABELS, STATUSES } from './constants';

export default function BlockPopover({ x, y, block, dateStr, onSetStatus, onDelete, onSetDayStatus, onClearDayStatus, onSetNote, onClose }) {
  const ref = useRef(null);
  const [noteDraft, setNoteDraft] = useState(block?.note || '');

  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    const keyHandler = e => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('mousedown', handler);
    document.addEventListener('keydown', keyHandler);
    return () => { document.removeEventListener('mousedown', handler); document.removeEventListener('keydown', keyHandler); };
  }, [onClose]);

  if (!block) return null;

  const commitNote = () => {
    if (!onSetNote) return;
    if (noteDraft === (block.note || '')) return;
    onSetNote(block.id, noteDraft);
  };

  const dayStatus = dateStr ? (block.dayStatuses?.[dateStr] || block.status) : null;
  const hasOverride = dateStr && block.dayStatuses?.[dateStr];

  const rowStyle = (isActive) => ({
    background: isActive ? 'var(--paper-2)' : 'transparent',
    color: 'var(--ink)',
    fontFamily: 'var(--f-body)',
    fontWeight: isActive ? 700 : 500,
  });

  return (
    <div ref={ref} className="nk-popover" style={{ left: x, top: y }}>

      {/* Per-day status section */}
      {dateStr && (
        <>
          <div className="nk-popover-lbl px-3 py-1">
            Dag: {dateStr}
          </div>
          {STATUSES.map(s => (
            <button key={`day-${s}`}
              onClick={() => {
                if (s === block.status && hasOverride) onClearDayStatus(block.id, dateStr);
                else if (s !== block.status) onSetDayStatus(block.id, dateStr, s);
                onClose();
              }}
              className="w-full text-left px-3 py-1.5 text-sm flex items-center gap-2 transition-opacity hover:opacity-75"
              style={rowStyle(dayStatus === s)}>
              <span className="w-3 h-3 rounded-sm inline-block flex-shrink-0"
                style={{
                  background: STATUS_COLORS[s].bg, border: `1px solid ${STATUS_COLORS[s].border}`,
                  ...(s === 'requested' ? { borderStyle: 'dashed' } : {}),
                }} />
              {STATUS_LABELS[s]}
              {s === block.status && !hasOverride && <span className="ml-auto text-[10px]" style={{ color: 'var(--ink-mute)' }}>(block)</span>}
              {hasOverride && s === block.dayStatuses[dateStr] && <span className="ml-auto text-[9px]" style={{ color: 'var(--indigo)' }}>●</span>}
            </button>
          ))}
          {hasOverride && (
            <button onClick={() => { onClearDayStatus(block.id, dateStr); onClose(); }}
              className="w-full text-left px-3 py-1.5 text-xs transition-opacity hover:opacity-70"
              style={{ color: 'var(--ink-mute)', fontFamily: 'var(--f-body)' }}>
              Reset → {STATUS_LABELS[block.status]}
            </button>
          )}
          <hr className="nk-popover-divider" />
        </>
      )}

      {/* Block-level status */}
      <div className="px-3 py-1"
        style={{ fontFamily: 'var(--f-mono)', fontSize: 10, fontWeight: 700, letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--ink-mute)' }}>
        {dateStr ? 'Hela blocket' : 'Status'}
      </div>
      {STATUSES.map(s => (
        <button key={s}
          onClick={() => { onSetStatus(block.id, s); onClose(); }}
          className="w-full text-left px-3 py-1.5 text-sm flex items-center gap-2 transition-opacity hover:opacity-75"
          style={rowStyle(!dateStr && block.status === s)}>
          <span className="w-3 h-3 rounded-sm inline-block flex-shrink-0"
            style={{
              background: STATUS_COLORS[s].bg, border: `1px solid ${STATUS_COLORS[s].border}`,
              ...(s === 'requested' ? { borderStyle: 'dashed' } : {}),
            }} />
          {STATUS_LABELS[s]}
        </button>
      ))}

      {/* Note */}
      {onSetNote && (
        <>
          <hr className="nk-popover-divider" />
          <div className="nk-popover-lbl px-3 py-1">
            Anteckning
          </div>
          <div className="px-3 pb-2">
            <textarea
              aria-label="Block note"
              placeholder="Lägg till anteckning…"
              value={noteDraft}
              onChange={e => setNoteDraft(e.target.value)}
              onBlur={commitNote}
              onKeyDown={e => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault(); commitNote(); onClose();
                }
              }}
              rows={3}
              className="w-full text-sm rounded p-2"
              style={{
                background: 'var(--paper-2)', color: 'var(--ink)',
                border: '1.5px solid var(--paper-3)', borderRadius: 'var(--r-s)',
                fontFamily: 'var(--f-body)', resize: 'vertical', minHeight: 48,
                outline: 'none',
              }}
            />
          </div>
        </>
      )}

      <hr className="nk-popover-divider" />
      <button onClick={() => { onDelete(block.id); onClose(); }}
        className="nk-delete-btn w-full text-left px-3 py-1.5 text-sm">
        Delete
      </button>
    </div>
  );
}
