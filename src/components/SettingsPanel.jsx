import { themes } from '../data';

const SHIFT_MODES = [
  { value: 'separate', label: 'Separate' },
  { value: 'combined', label: 'Combined' },
];

const DENSITY_OPTS = [
  { value: 'compact',  label: 'Kmpkt' },
  { value: 'normal',   label: 'Norm' },
  { value: 'spacious', label: 'Rymlig' },
];

export default function SettingsPanel({
  shiftMode, onShiftModeChange,
  theme, onThemeChange,
  mode, onToggleMode,
  visibleWeeks, onVisibleWeeksChange,
  density, onDensityChange,
  grain, onGrainChange,
  asym, onAsymChange,
  collapsed, onToggleCollapse,
}) {

  return (
    <div className={`nk-sp ${collapsed ? 'collapsed' : 'expanded'}`}
      aria-label="Settings panel">

      {/* ── Header — always visible ──────────────────────────────────────── */}
      <div className="nk-sp-header">
        {!collapsed && <span className="nk-sp-title">Inställningar</span>}
        <button
          className="nk-sp-toggle"
          onClick={onToggleCollapse}
          aria-label={collapsed ? 'Expand settings' : 'Collapse settings'}
          style={{ marginLeft: collapsed ? 'auto' : undefined, marginRight: collapsed ? 'auto' : undefined }}
        >
          {collapsed ? '⚙' : '◀'}
        </button>
      </div>

      {/* ── Body — full controls, hidden via CSS when collapsed ──────────── */}
      {!collapsed && (
        <div className="flex flex-col flex-1 overflow-y-auto py-1" aria-label="Settings controls">

          {/* Shift mode */}
          <div className="nk-sp-section">
            <span className="nk-sp-section-lbl">Skiftläge</span>
            <div className="nk-sp-pill" role="group" aria-label="Shift mode">
              {SHIFT_MODES.map(m => (
                <button
                  key={m.value}
                  onClick={() => onShiftModeChange(m.value)}
                  className={shiftMode === m.value ? 'active' : ''}
                  aria-pressed={shiftMode === m.value}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <hr className="nk-sp-divider" />

          {/* Theme */}
          <div className="nk-sp-section">
            <span className="nk-sp-section-lbl">Tema</span>
            <select
              className="nk-sp-select"
              value={theme}
              onChange={e => onThemeChange(e.target.value)}
              aria-label="Theme"
            >
              {themes.map(t => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
          </div>

          {/* Light / Dark mode */}
          <div className="nk-sp-section">
            <span className="nk-sp-section-lbl">Visningsläge</span>
            <div className="nk-sp-row">
              <span className="nk-sp-row-lbl">{mode === 'dark' ? '☾ Mörkt' : '☀ Ljust'}</span>
              <button
                className={`nk-sp-mode-btn ${mode === 'dark' ? 'dark-active' : ''}`}
                onClick={onToggleMode}
                aria-label={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {mode === 'dark' ? 'Ljust' : 'Mörkt'}
              </button>
            </div>
          </div>

          <hr className="nk-sp-divider" />

          {/* Visible weeks */}
          <div className="nk-sp-section">
            <span className="nk-sp-section-lbl">Synliga veckor — {visibleWeeks}</span>
            <input
              type="range"
              className="nk-sp-range"
              min={4} max={26} step={1}
              value={visibleWeeks}
              onChange={e => onVisibleWeeksChange(Number(e.target.value))}
              aria-label={`Visible weeks: ${visibleWeeks}`}
            />
          </div>

          {/* Density */}
          <div className="nk-sp-section">
            <span className="nk-sp-section-lbl">Täthet</span>
            <div className="nk-sp-density" role="group" aria-label="Density">
              {DENSITY_OPTS.map(d => (
                <button
                  key={d.value}
                  onClick={() => onDensityChange(d.value)}
                  className={density === d.value ? 'active' : ''}
                  aria-pressed={density === d.value}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <hr className="nk-sp-divider" />

          {/* Grain */}
          <div className="nk-sp-section">
            <span className="nk-sp-section-lbl">Kornighet — {Math.round(grain * 100)}%</span>
            <input
              type="range"
              className="nk-sp-range"
              min={0} max={1} step={0.05}
              value={grain}
              onChange={e => onGrainChange(Number(e.target.value))}
              aria-label={`Grain intensity: ${Math.round(grain * 100)}%`}
            />
          </div>

          {/* Asymmetry */}
          <div className="nk-sp-section">
            <div className="nk-sp-row">
              <span className="nk-sp-row-lbl">Mikro-rotation</span>
              <input
                type="checkbox"
                className="nk-sp-check"
                checked={asym}
                onChange={e => onAsymChange(e.target.checked)}
                aria-label="Enable micro-rotation asymmetry"
              />
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
