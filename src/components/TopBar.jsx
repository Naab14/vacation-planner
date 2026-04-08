import { themes } from '../data';

export default function TopBar({ shiftMode, onShiftModeChange, theme, onThemeChange, viewMode, onViewModeChange, onImportCSV, onSave, onExportJSON, onImportJSON, onReset, onToggleOperators }) {
  const modes = [
    { value: 'separate', label: 'Separate' },
    { value: 'combined', label: 'Combined' },
    { value: 'summer', label: 'Summer' },
  ];
  
  // Use Tailwind utility classes for buttons
  const btnClass = "px-4 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 hover:scale-[1.02] active:scale-95 shadow-sm bg-white/10 backdrop-blur-sm text-white/90 hover:bg-white/20 hover:text-white border border-white/10";
  const dangerBtnClass = "px-4 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 hover:scale-[1.02] active:scale-95 shadow-sm bg-red-500/10 backdrop-blur-sm text-red-300 hover:bg-red-500/20 hover:text-red-200 border border-red-500/20";

  return (
    <div className="flex items-center gap-4 px-6 py-3 flex-wrap shadow-md dark:shadow-none transition-colors duration-300 z-30 relative" style={{ background: 'var(--topbar-bg)', color: 'var(--topbar-text)' }}>
      <h1 className="text-xl font-bold mr-6 whitespace-nowrap tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-300 drop-shadow-sm">Semester Planner</h1>

      {/* Shift mode toggle */}
      <div className="flex items-center gap-1.5 bg-black/20 p-1 rounded-xl backdrop-blur-md border border-white/5 mx-2 shadow-inner">
        {modes.map(m => (
          <button key={m.value} onClick={() => onShiftModeChange(m.value)}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-300 ${shiftMode === m.value ? 'bg-blue-500 text-white shadow-md' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}
            >
            {m.label}
          </button>
        ))}
      </div>

      {/* View mode toggle */}
      <div className="flex items-center gap-1.5 bg-black/20 p-1 rounded-xl backdrop-blur-md border border-white/5 mx-2 shadow-inner">
        {['week', 'day'].map(v => (
          <button key={v} onClick={() => onViewModeChange(v)}
            className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all duration-300 ${viewMode === v ? 'bg-blue-500 text-white shadow-md' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}
            >
            {v === 'week' ? 'Vecka' : 'Dag'}
          </button>
        ))}
      </div>

      {/* Theme */}
      <div className="flex items-center gap-2 ml-4">
        <span className="text-xs uppercase tracking-wider font-semibold opacity-60">Theme</span>
        <div className="relative">
          <select value={theme} onChange={e => onThemeChange(e.target.value)}
            className="appearance-none pl-3 pr-8 py-1.5 text-sm rounded-lg font-medium outline-none transition-all duration-200 cursor-pointer shadow-sm border"
            style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', borderColor: 'var(--border)' }}>
            {themes.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 opacity-50">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2.5 ml-auto flex-wrap">
        <button onClick={onToggleOperators} className={btnClass}>Operators</button>
        <div className="w-px h-5 bg-white/20 mx-1"></div>
        <button onClick={onImportCSV} className={btnClass}>Import CSV</button>
        <button onClick={onExportJSON} className={btnClass}>Export</button>
        <button onClick={onSave} className={`${btnClass} !bg-blue-600/80 !border-blue-500/50 hover:!bg-blue-500/90`}>Save</button>
        <button onClick={onReset} className={dangerBtnClass}>Reset</button>
      </div>
    </div>
  );
}
