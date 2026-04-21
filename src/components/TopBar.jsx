import { useState, useEffect, useRef } from 'react';

export default function TopBar({
  onImportCSV, onExportCSV, onSave, onExportJSON, onImportJSON, onReset, onShare,
  onUndo, onRedo, canUndo, canRedo,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClick = e => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    const handleKey = e => { if (e.key === 'Escape') setMenuOpen(false); };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => { document.removeEventListener('mousedown', handleClick); document.removeEventListener('keydown', handleKey); };
  }, [menuOpen]);

  return (
    <div className="flex items-center gap-4 px-5 py-3 flex-wrap z-30 relative"
      style={{
        background: 'var(--ink)', color: 'var(--paper)',
        borderBottom: '3px solid var(--ink)',
        boxShadow: 'var(--elev-topbar)',
      }}>

      {/* Brand block — Neo-Kinetic wordmark */}
      <div className="nk-brand mr-2">
        <div className="nk-brand-kicker">Uppsala · Works Planning</div>
        <div className="nk-brand-wordmark">
          <span className="nk-dot" aria-hidden="true" />
          <span>Semester<span className="nk-period">.</span>Planner</span>
        </div>
      </div>

      {/* Undo / Redo */}
      <div className="flex items-center gap-1">
        <button onClick={onUndo} disabled={!canUndo}
          title="Undo (Ctrl+Z)" aria-label="Undo"
          className="w-8 h-8 flex items-center justify-center text-base font-bold rounded-lg transition-all duration-200 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
          style={{ color: 'var(--paper)' }}>
          ↶
        </button>
        <button onClick={onRedo} disabled={!canRedo}
          title="Redo (Ctrl+Shift+Z)" aria-label="Redo"
          className="w-8 h-8 flex items-center justify-center text-base font-bold rounded-lg transition-all duration-200 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
          style={{ color: 'var(--paper)' }}>
          ↷
        </button>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Share — primary game-piece button */}
      <button onClick={onShare} className="nk-btn primary sm">
        Share link
      </button>

      {/* Overflow menu */}
      <div className="relative" ref={menuRef}>
        <button onClick={() => setMenuOpen(o => !o)}
          className="w-8 h-8 flex items-center justify-center text-base font-bold rounded-lg transition-all duration-200 hover:bg-white/10"
          style={{ color: 'var(--paper)' }}
          aria-label="More actions">
          ⋮
        </button>
        {menuOpen && (
          <div className="absolute right-0 top-full mt-2 py-1 min-w-[180px] rounded-lg shadow-xl z-50"
            style={{ background: 'var(--panel)', border: '2px solid var(--ink)', boxShadow: '4px 4px 0 0 var(--ink)' }}>
            {[
              { label: 'Import CSV', action: onImportCSV },
              { label: 'Export CSV', action: onExportCSV },
              { label: 'Export JSON', action: onExportJSON },
              { label: 'Import JSON', action: onImportJSON },
              { label: 'Save', action: onSave },
            ].filter(item => item.action).map(item => (
              <button key={item.label} onClick={() => { item.action(); setMenuOpen(false); }}
                className="w-full text-left px-4 py-2 text-sm transition-opacity hover:opacity-70"
                style={{ color: 'var(--ink)', fontFamily: 'var(--f-body)', fontWeight: 600 }}>
                {item.label}
              </button>
            ))}
            <hr style={{ borderColor: 'var(--paper-3)' }} className="my-1" />
            <button onClick={() => { onReset(); setMenuOpen(false); }}
              className="w-full text-left px-4 py-2 text-sm transition-colors hover:opacity-80"
              style={{ color: 'var(--coral)', fontFamily: 'var(--f-body)', fontWeight: 700 }}>
              Reset
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
