import { useState, useEffect, useCallback, useMemo } from 'react';
import { seedOperators, seedVacationBlocks, buildDefaultDemand, defaultSettings } from './data';
import {
  saveState, loadState, clearState,
  saveTheme, loadTheme,
  saveUI, loadUI,
  exportJSON, importJSON, debouncedSave,
  buildShareLink, loadStateFromUrl, clearShareHash, copyToClipboard,
} from './storage';
import { parseCSV, mergeOperators, downloadCSVTemplate } from './csv';
import { buildHolidayMap } from './holidays';

import TopBar from './components/TopBar';
import OperatorPanel from './components/OperatorPanel';
import CalendarGrid from './components/CalendarGrid';

/* ── Utility ──────────────────────────────────────────────────────────────── */
let _uid = 0;
const uid = () => `id_${++_uid}_${Date.now().toString(36)}`;

function getDefaults() {
  return loadState() || {
    operators: seedOperators,
    vacationBlocks: seedVacationBlocks,
    demand: buildDefaultDemand(),
    settings: defaultSettings,
  };
}

const storedUI = loadUI();

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  APP                                                                      */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function App() {
  const [state, setState] = useState(getDefaults);
  const [theme, setTheme] = useState(loadTheme);
  const [toast, setToast] = useState(null);
  const [showDemand, setShowDemand] = useState(false);
  const [showOperatorMgmt, setShowOperatorMgmt] = useState(false);
  const [zoom, setZoom] = useState(storedUI.zoom === 'day' ? 'day' : 'week');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(!!storedUI.sidebarCollapsed);

  const { operators, vacationBlocks, demand, settings } = state;
  const { startWeek, visibleWeeks, shiftMode } = settings;
  const weeks = useMemo(
    () => Array.from({ length: visibleWeeks }, (_, i) => startWeek + i),
    [startWeek, visibleWeeks],
  );

  const holidayMap = useMemo(() => buildHolidayMap(), []);

  // Load shared state from URL hash on mount (#share=...)
  useEffect(() => {
    const shared = loadStateFromUrl();
    if (shared) {
      setState(shared);
      clearShareHash();
      flash('Loaded shared workspace');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Theme effect
  useEffect(() => {
    if (theme === 'default') document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme', theme);
    saveTheme(theme);
  }, [theme]);

  // Auto-save core state
  useEffect(() => { debouncedSave(state); }, [state]);

  // Persist UI preferences (zoom + sidebar)
  useEffect(() => {
    saveUI({ zoom, sidebarCollapsed });
  }, [zoom, sidebarCollapsed]);

  const flash = msg => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  /* ── State updaters ─────────────────────────────────────────────────────── */
  const update = useCallback(patch => setState(s => ({ ...s, ...patch })), []);
  const updateOp = useCallback((id, patch) =>
    setState(s => ({ ...s, operators: s.operators.map(o => o.id === id ? { ...o, ...patch } : o) })), []);
  const addBlock = useCallback((opId, sw, ew, status = 'draft') =>
    setState(s => ({ ...s, vacationBlocks: [...s.vacationBlocks, { id: uid(), operatorId: opId, startWeek: sw, endWeek: ew, status }] })), []);
  const updateBlock = useCallback((id, patch) =>
    setState(s => ({ ...s, vacationBlocks: s.vacationBlocks.map(b => b.id === id ? { ...b, ...patch } : b) })), []);
  const deleteBlock = useCallback(id =>
    setState(s => ({ ...s, vacationBlocks: s.vacationBlocks.filter(b => b.id !== id) })), []);
  const setBlockStatus = useCallback((id, status) =>
    setState(s => ({ ...s, vacationBlocks: s.vacationBlocks.map(b => b.id === id ? { ...b, status } : b) })), []);
  const updateDemand = useCallback((proc, week, val) =>
    setState(s => ({ ...s, demand: { ...s.demand, [proc]: { ...s.demand[proc], [week]: val } } })), []);
  const setShiftMode = useCallback(m =>
    setState(s => ({ ...s, settings: { ...s.settings, shiftMode: m } })), []);
  const setStartWeek = useCallback(w =>
    setState(s => ({
      ...s,
      settings: {
        ...s.settings,
        startWeek: Math.max(1, Math.min(52 - s.settings.visibleWeeks + 1, w)),
      },
    })), []);

  /* ── Operator management ────────────────────────────────────────────────── */
  const addOperator = useCallback((name, shift) => {
    const op = { id: uid(), name, shift, active: true, certifications: [] };
    setState(s => ({ ...s, operators: [...s.operators, op] }));
    flash(`${name} tillagd`);
  }, []);
  const removeOperator = useCallback(id => {
    setState(s => ({
      ...s,
      operators: s.operators.filter(o => o.id !== id),
      vacationBlocks: s.vacationBlocks.filter(b => b.operatorId !== id),
    }));
  }, []);

  /* ── CSV import ─────────────────────────────────────────────────────────── */
  const handleCSVImport = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = '.csv';
    input.onchange = e => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = ev => {
        const { operators: parsed, error } = parseCSV(ev.target.result);
        if (error) { flash(error); return; }
        const { operators: merged, added, updated } = mergeOperators(operators, parsed);
        update({ operators: merged });
        flash(`${added} operators imported, ${updated} updated`);
      };
      reader.readAsText(file);
    };
    input.click();
  }, [operators, update]);

  const handleSave = useCallback(() => { saveState(state); flash('State saved'); }, [state]);
  const handleExport = useCallback(() => { exportJSON(state); flash('Exported to file'); }, [state]);
  const handleImport = useCallback(async () => {
    const data = await importJSON();
    if (data) { setState(data); flash('State imported'); }
  }, []);
  const handleReset = useCallback(() => {
    if (confirm('Reset all data to defaults? This cannot be undone.')) {
      clearState();
      setState({ operators: seedOperators, vacationBlocks: seedVacationBlocks, demand: buildDefaultDemand(), settings: defaultSettings });
      flash('Reset to defaults');
    }
  }, []);
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
        shiftMode={shiftMode} onShiftModeChange={setShiftMode}
        theme={theme} onThemeChange={setTheme}
        onImportCSV={handleCSVImport} onSave={handleSave}
        onExportJSON={handleExport} onImportJSON={handleImport}
        onReset={handleReset}
        onShare={handleShare}
      />

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
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
