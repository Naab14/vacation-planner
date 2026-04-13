import { themes } from '../data';

export default function TopBar({ shiftMode, onShiftModeChange, theme, onThemeChange, viewMode, onViewModeChange, onImportCSV, onSave, onExportJSON, onImportJSON, onReset, onToggleOperators }) {
  const modes = [
    { value: 'separate', label: 'Separate' },
    { value: 'combined', label: 'Combined' },
    { value: 'summer', label: 'Summer' },
  ];

  const btnClass = "px-4 py-1.5 text-sm font-semibold rounded-lg transition-all duration-200 hover:scale-[1.02] active:scale-95 bg-white/10 backdrop-blur-sm text-white/90 hover:bg-white/20 hover:text-white border border-white/15 shadow-sm";
  const dangerBtnClass = "px-4 py-1.5 text-sm font-semibold rounded-lg transition-all duration-200 hover:scale-[1.02] active:scale-95 bg-rose-500/15 backdrop-blur-sm text-rose-300 hover:bg-rose-500/25 hover:text-rose-200 border border-rose-500/25 shadow-sm";

  return (
    <div
      className="flex items-center gap-4 px-6 py-3 flex-wrap z-30 relative"
      style={{
        background: 'var(--topbar-bg)',
        color: 'var(--topbar-text)',
        boxShadow: '0 4px 24px -4px rgba(0,0,0,0.4)',
      }}
    >
      {/* Impact heading — Epilogue italic */}
      <h1
        className="mr-6 whitespace-nowrap select-none"
        style={{
          fontFamily: 'var(--font-heading)',
          fontWeight: 900,
          fontStyle: 'italic',
          fontSize: '1.35rem',
          letterSpacing: '-0.05em',
          background: 'linear-gradient(135deg, #818CF8 0%, #C7D2FE 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        Semester Planner
      </h1>

      {/* Shift mode — pill toggle */}
      <div className="flex items-center gap-1 bg-black/25 p-1 rounded-full backdrop-blur-md border border-white/5 mx-1 shadow-inner">
        {modes.map(m => (
          <button
            key={m.value}
            onClick={() => onShiftModeChange(m.value)}
            className={`px-4 py-1.5 text-sm font-semibold rounded-full transition-all duration-200 ${
              shiftMode === m.value
                ? 'bg-indigo-500 text-white shadow-lg scale-105'
                : 'text-white/65 hover:bg-white/10 hover:text-white'
            }`}
            style={shiftMode === m.value ? { boxShadow: '0 4px 12px rgba(99,102,241,0.4)' } : {}}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* View mode — pill toggle */}
      <div className="flex items-center gap-1 bg-black/25 p-1 rounded-full backdrop-blur-md border border-white/5 mx-1 shadow-inner">
        {['week', 'day'].map(v => (
          <button
            key={v}
            onClick={() => onViewModeChange(v)}
            className={`px-4 py-1.5 text-sm font-semibold rounded-full transition-all duration-200 ${
              viewMode === v
                ? 'bg-indigo-500 text-white shadow-lg scale-105'
                : 'text-white/65 hover:bg-white/10 hover:text-white'
            }`}
            style={viewMode === v ? { boxShadow: '0 4px 12px rgba(99,102,241,0.4)' } : {}}
          >
            {v === 'week' ? 'Vecka' : 'Dag'}
          </button>
        ))}
      </div>

      {/* Theme selector */}
      <div className="flex items-center gap-2 ml-2">
        <span className="text-xs uppercase tracking-widest font-bold opacity-40">Theme</span>
        <div className="relative">
          <select
            value={theme}
            onChange={e => onThemeChange(e.target.value)}
            className="appearance-none pl-3 pr-8 py-1.5 text-sm rounded-lg font-semibold outline-none transition-all duration-200 cursor-pointer border"
            style={{ background: 'rgba(255,255,255,0.08)', color: 'var(--topbar-text)', borderColor: 'rgba(255,255,255,0.12)' }}
          >
            {themes.map(t => <option key={t.id} value={t.id} style={{ background: '#1e1b4b' }}>{t.label}</option>)}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 opacity-40">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" /></svg>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 ml-auto flex-wrap">
        <button onClick={onToggleOperators} className={btnClass}>Operators</button>
        <div className="w-px h-5 bg-white/15 mx-0.5" />
        <button onClick={onImportCSV} className={btnClass}>Import CSV</button>
        <button onClick={onExportJSON} className={btnClass}>Export</button>
        <button
          onClick={onSave}
          className="px-4 py-1.5 text-sm font-semibold rounded-lg transition-all duration-200 hover:scale-[1.02] active:scale-95 text-white border shadow-sm"
          style={{ background: '#4f46e5', borderColor: '#6366f1', boxShadow: '0 4px 12px rgba(79,70,229,0.35)' }}
        >
          Save
        </button>
        <button onClick={onReset} className={dangerBtnClass}>Reset</button>
      </div>
    </div>
  );
}
