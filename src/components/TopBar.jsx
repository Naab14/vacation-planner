import { useState, useEffect, useRef } from 'react';
import { themes } from '../data';

export default function TopBar({
  shiftMode, onShiftModeChange, theme, onThemeChange,
  mode, onToggleMode,
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

  const modes = [
    { value: 'separate', label: 'Separate' },
    { value: 'combined', label: 'Combined' },
    { value: 'summer', label: 'Summer' },
  ];

  return (
    <div className="flex items-center gap-4 px-5 py-3 flex-wrap z-30 relative"
      style={{ background: 'var(--ink)', color: 'var(--paper)', borderBottom: '3px solid var(--ink)' }}>

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

      {/* Shift mode pill */}
      <div className="nk-shift-pill" role="tablist" aria-label="Shift mode">
        {modes.map(m => (
          <button key={m.value} role="tab" aria-selected={shiftMode === m.value}
            onClick={() => onShiftModeChange(m.value)}
            className={shiftMode === m.value ? 'active' : ''}>
            {m.label}
          </button>
        ))}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Theme select */}
      <div className="relative">
        <select value={theme} onChange={e => onThemeChange(e.target.value)}
          aria-label="Theme"
          className="appearance-none pl-3 pr-8 py-1.5 text-xs font-mono font-bold tracking-widest uppercase rounded-full cursor-pointer outline-none"
          style={{ background: 'rgba(255,255,255,0.08)', color: 'var(--paper)', border: '1px solid rgba(255,255,255,0.18)' }}>
          {themes.map(t => <option key={t.id} value={t.id} style={{ color: '#000' }}>{t.label}</option>)}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center opacity-60">▾</div>
      </div>

      {/* Light/Dark toggle */}
      <button onClick={onToggleMode} className="nk-mode-toggle"
        title={mode === 'dark' ? 'Switch to light' : 'Switch to dark'}
        aria-label={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
        {mode === 'dark' ? '☀' : '☾'}
      </button>

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
