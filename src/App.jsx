import { useState, useEffect, useCallback, useMemo, useReducer } from 'react';
import { seedOperators, seedVacationBlocks, buildDefaultDemand, defaultSettings } from './data';
import {
  saveState, loadState, clearState,
  saveTheme, loadTheme,
  saveUI, loadUI,
  exportJSON, importJSON, debouncedSave,
  buildShareLink, loadStateFromUrl, clearShareHash, copyToClipboard,
} from './storage';
import { parseCSV, mergeOperators, downloadCSVTemplate, downloadOperatorsCSV } from './csv';
import { buildHolidayMap, initHolidays } from './holidays';
import { historyReducer, initHistory } from './historyReducer';
import { useBreakpoint } from './hooks/useBreakpoint';
import { applyTheme, THEMES, DEFAULT_THEME, DEFAULT_MODE } from './theme/themes';

import TopBar from './components/TopBar';
import SettingsPanel from './components/SettingsPanel';
import OperatorPanel from './components/OperatorPanel';
import CalendarGrid from './components/calendar/CalendarGrid';

/* ── Utility ──────────────────────────────────────────────────────────────── */
let _uid = 0;
const uid = () => `id_${++_uid}_${Date.now().toString(36)}`;

function getDefaults() {
  const shared = loadStateFromUrl();
  if (shared) {
    clearShareHash();
    return { state: shared, wasShared: true };
  }
  return {
    state: loadState() || {
      operators: seedOperators,
      vacationBlocks: seedVacationBlocks,
      demand: buildDefaultDemand(),
      settings: defaultSettings,
    },
    wasShared: false,
  };
}

const storedUI = loadUI();

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  APP                                                                      */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function App() {
  const [initResult] = useState(getDefaults);
  const [history, dispatch] = useReducer(historyReducer, initResult.state, initHistory);
  const { present: state, past, future } = history;
  const canUndo = past.length > 0;
  const canRedo = future.length > 0;
  const setFn = useCallback(updater => dispatch({ type: 'SET', updater }), []);
  const undo = useCallback(() => dispatch({ type: 'UNDO' }), []);
  const redo = useCallback(() => dispatch({ type: 'REDO' }), []);
  const [theme, setTheme] = useState(() => {
    const t = loadTheme();
    return THEMES[t] ? t : DEFAULT_THEME;
  });
  const [mode, setMode] = useState(() => storedUI.mode === 'dark' ? 'dark' : DEFAULT_MODE);
  const [density, setDensity] = useState(() => storedUI.density || 'normal');
  const [grain, setGrain] = useState(() => storedUI.grain ?? 0.45);
  const [asym, setAsym] = useState(() => storedUI.asym !== false);
  const [settingsPanelCollapsed, setSettingsPanelCollapsed] = useState(!!storedUI.settingsPanelCollapsed);
  const [toast, setToast] = useState(initResult.wasShared ? 'Loaded shared workspace' : null);
  const [showDemand, setShowDemand] = useState(false);
  const [showOperatorMgmt, setShowOperatorMgmt] = useState(false);
  const [zoom, setZoom] = useState(storedUI.zoom === 'day' ? 'day' : 'week');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(!!storedUI.sidebarCollapsed);
  const { isMobile, isTablet, isDesktop } = useBreakpoint();

  // Auto-collapse sidebar on tablet/mobile; restore latest persisted preference on desktop
  useEffect(() => {
    if (isMobile || isTablet) {
      setSidebarCollapsed(true);
    } else if (isDesktop) {
      setSidebarCollapsed(!!loadUI().sidebarCollapsed);
    }
  }, [isMobile, isTablet, isDesktop]);

  const { operators, vacationBlocks, demand, settings } = state;
  const { startWeek, visibleWeeks, shiftMode } = settings;
  const weeks = useMemo(
    () => Array.from({ length: visibleWeeks }, (_, i) => startWeek + i),
    [startWeek, visibleWeeks],
  );

  const [holidayMap, setHolidayMap] = useState(() => buildHolidayMap());
  const flash = msg => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  // Load holidays async (date-holidays is code-split)
  useEffect(() => {
    initHolidays().then(map => setHolidayMap(map));
  }, []);

  // Auto-dismiss initial toast (shared workspace)
  useEffect(() => {
    if (initResult.wasShared) {
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [initResult.wasShared]);

  // Theme + mode effect — writes Neo-Kinetic tokens + legacy aliases to :root
  useEffect(() => {
    applyTheme(theme, mode);
    document.body.classList.add('nk-on');
    saveTheme(theme);
  }, [theme, mode]);

  useEffect(() => {
    document.body.setAttribute('data-density', density);
    document.documentElement.style.setProperty('--grain', grain);
    document.documentElement.style.setProperty('--asym', asym ? '0.7' : '0');
  }, [density, grain, asym]);

  // Auto-save core state
  useEffect(() => { debouncedSave(state); }, [state]);

  // Persist UI preferences
  useEffect(() => {
    saveUI({ zoom, sidebarCollapsed, mode, density, grain, asym, settingsPanelCollapsed });
  }, [zoom, sidebarCollapsed, mode, density, grain, asym, settingsPanelCollapsed]);

  // Keyboard shortcuts: Ctrl/Cmd+Z = undo, Ctrl/Cmd+Shift+Z = redo
  useEffect(() => {
    const handler = e => {
      const t = e.target;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      if (!(e.ctrlKey || e.metaKey) || e.key.toLowerCase() !== 'z') return;
      e.preventDefault();
      if (e.shiftKey) redo(); else undo();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [undo, redo]);

  /* ── State updaters ─────────────────────────────────────────────────────── */
  const update = useCallback(patch => setFn(s => ({ ...s, ...patch })), [setFn]);
  const updateOp = useCallback((id, patch) =>
    setFn(s => ({ ...s, operators: s.operators.map(o => o.id === id ? { ...o, ...patch } : o) })), [setFn]);
  const addBlock = useCallback((opId, sw, ew, status = 'draft') =>
    setFn(s => ({ ...s, vacationBlocks: [...s.vacationBlocks, { id: uid(), operatorId: opId, startWeek: sw, endWeek: ew, status }] })), [setFn]);
  const updateBlock = useCallback((id, patch) =>
    setFn(s => ({ ...s, vacationBlocks: s.vacationBlocks.map(b => b.id === id ? { ...b, ...patch } : b) })), [setFn]);
  const deleteBlock = useCallback(id =>
    setFn(s => ({ ...s, vacationBlocks: s.vacationBlocks.filter(b => b.id !== id) })), [setFn]);
  const setBlockStatus = useCallback((id, status) =>
    setFn(s => ({ ...s, vacationBlocks: s.vacationBlocks.map(b => b.id === id ? { ...b, status } : b) })), [setFn]);
  const setBlockDayStatus = useCallback((id, dateStr, status) =>
    setFn(s => ({
      ...s,
      vacationBlocks: s.vacationBlocks.map(b =>
        b.id === id
          ? { ...b, dayStatuses: { ...b.dayStatuses, [dateStr]: status } }
          : b
      ),
    })), [setFn]);
  const clearBlockDayStatus = useCallback((id, dateStr) =>
    setFn(s => ({
      ...s,
      vacationBlocks: s.vacationBlocks.map(b => {
        if (b.id !== id) return b;
        const { [dateStr]: _, ...rest } = b.dayStatuses || {};
        return { ...b, dayStatuses: Object.keys(rest).length ? rest : undefined };
      }),
    })), [setFn]);
  const setBlockNote = useCallback((id, note) =>
    setFn(s => ({
      ...s,
      vacationBlocks: s.vacationBlocks.map(b => {
        if (b.id !== id) return b;
        const trimmed = (note || '').trim();
        if (trimmed === (b.note || '')) return b;
        if (!trimmed) { const { note: _omit, ...rest } = b; return rest; }
        return { ...b, note: trimmed };
      }),
    })), [setFn]);
  const updateDemand = useCallback((proc, week, val) =>
    setFn(s => ({ ...s, demand: { ...s.demand, [proc]: { ...s.demand[proc], [week]: val } } })), [setFn]);
  const setShiftMode = useCallback(m =>
    setFn(s => ({ ...s, settings: { ...s.settings, shiftMode: m } })), [setFn]);
  const setStartWeek = useCallback(w =>
    setFn(s => ({
      ...s,
      settings: {
        ...s.settings,
        startWeek: Math.max(1, Math.min(52 - s.settings.visibleWeeks + 1, w)),
      },
    })), [setFn]);
  const setVisibleWeeks = useCallback(n =>
    setFn(s => ({
      ...s,
      settings: {
        ...s.settings,
        visibleWeeks: Math.max(4, Math.min(26, n)),
        startWeek: Math.max(1, Math.min(52 - n + 1, s.settings.startWeek)),
      },
    })), [setFn]);

  /* ── Operator management ────────────────────────────────────────────────── */
  const addOperator = useCallback((name, shift) => {
    const op = { id: uid(), name, shift, active: true, certifications: [] };
    setFn(s => ({ ...s, operators: [...s.operators, op] }));
    flash(`${name} tillagd`);
  }, [setFn]);
  const removeOperator = useCallback(id => {
    setFn(s => ({
      ...s,
      operators: s.operators.filter(o => o.id !== id),
      vacationBlocks: s.vacationBlocks.filter(b => b.operatorId !== id),
    }));
  }, [setFn]);

  /* ── CSV import ─────────────────────────────────────────────────────────── */
  const handleCSVImport = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = '.csv';
    input.onchange = e => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = ev => {
        const { operators: parsed, error, warnings } = parseCSV(ev.target.result);
        if (error) { flash(error); return; }
        const { operators: merged, added, updated } = mergeOperators(operators, parsed);
        update({ operators: merged });
        const firstWarning = warnings && warnings.length ? ` • ${warnings[0]}` : '';
        const more = warnings && warnings.length > 1 ? ` (+${warnings.length - 1} till)` : '';
        flash(`${added} importerade, ${updated} uppdaterade${firstWarning}${more}`);
      };
      reader.readAsText(file);
    };
    input.click();
  }, [operators, update]);
  const handleCSVExport = useCallback(() => {
    downloadOperatorsCSV(operators);
    flash('Personalexport nedladdad');
  }, [operators]);

  const handleSave = useCallback(() => { saveState(state); flash('State saved'); }, [state]);
  const handleExport = useCallback(() => { exportJSON(state); flash('Exported to file'); }, [state]);
  const handleImport = useCallback(async () => {
    const data = await importJSON();
    if (data) { setFn(() => data); flash('State imported'); }
  }, [setFn]);
  const handleReset = useCallback(() => {
    if (confirm('Reset all data to defaults? This cannot be undone.')) {
      clearState();
      setFn(() => ({ operators: seedOperators, vacationBlocks: seedVacationBlocks, demand: buildDefaultDemand(), settings: defaultSettings }));
      flash('Reset to defaults');
    }
  }, [setFn]);
  const handleShare = useCallback(async () => {
    const link = buildShareLink(state);
    const ok = await copyToClipboard(link);
    flash(ok ? 'Share link copied' : 'Could not copy link');
  }, [state]);

  /* ── Render ─────────────────────────────────────────────────────────────── */
  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>

      {/* ── Top Bar ──────────────────────────────────────────────────────── */}
      <TopBar
        onImportCSV={handleCSVImport} onExportCSV={handleCSVExport} onSave={handleSave}
        onExportJSON={handleExport} onImportJSON={handleImport}
        onReset={handleReset}
        onShare={handleShare}
        onUndo={undo} onRedo={redo}
        canUndo={canUndo} canRedo={canRedo}
      />

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Settings Panel */}
        <SettingsPanel
          shiftMode={shiftMode} onShiftModeChange={setShiftMode}
          theme={theme} onThemeChange={setTheme}
          mode={mode} onToggleMode={() => setMode(m => m === 'dark' ? 'light' : 'dark')}
          visibleWeeks={visibleWeeks} onVisibleWeeksChange={setVisibleWeeks}
          density={density} onDensityChange={setDensity}
          grain={grain} onGrainChange={setGrain}
          asym={asym} onAsymChange={setAsym}
          collapsed={settingsPanelCollapsed}
          onToggleCollapse={() => setSettingsPanelCollapsed(p => !p)}
        />

        {/* Left: Operator Panel */}
        <OperatorPanel
          operators={operators} onUpdateOperator={updateOp}
          showMgmt={showOperatorMgmt}
          onToggleMgmt={() => setShowOperatorMgmt(p => !p)}
          onAddOperator={addOperator} onRemoveOperator={removeOperator}
          onDownloadTemplate={downloadCSVTemplate}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(p => !p)}
        />

        {/* Center: Calendar (handles both zoom levels internally) */}
        <CalendarGrid
          operators={operators} vacationBlocks={vacationBlocks}
          demand={demand} settings={settings} weeks={weeks}
          holidayMap={holidayMap}
          onAddBlock={addBlock} onUpdateBlock={updateBlock}
          onDeleteBlock={deleteBlock} onSetBlockStatus={setBlockStatus}
          onSetBlockDayStatus={setBlockDayStatus} onClearBlockDayStatus={clearBlockDayStatus}
          onSetBlockNote={setBlockNote}
          setStartWeek={setStartWeek}
          showDemand={showDemand}
          onToggleDemand={() => setShowDemand(p => !p)}
          updateDemand={updateDemand}
          zoom={zoom}
          onZoomChange={setZoom}
        />
      </div>

      {/* Toast — Neo-Kinetic pill */}
      {toast && (
        <div
          className="fixed bottom-5 right-5 z-50 px-5 py-3 text-sm font-bold"
          style={{
            background: 'var(--accent)',
            color: '#fff',
            borderRadius: '999px',
            boxShadow: '0 8px 24px rgba(79,70,229,0.45)',
            fontFamily: 'var(--font-body)',
            letterSpacing: '-0.01em',
          }}
        >
          {toast}
        </div>
      )}
    </div>
  );
}
