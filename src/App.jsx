import { useState, useEffect, useCallback, useMemo, useReducer } from 'react';
import { seedOperators, seedVacationBlocks, seedProcesses, buildDefaultDemand, defaultSettings } from './data';
import {
  saveState, loadState, clearState,
  saveTheme, loadTheme,
  saveUI, loadUI,
  exportJSON, importJSON, debouncedSave,
  buildShareLink, loadStateFromUrl, clearShareHash, copyToClipboard,
} from './storage';
import { migrateState } from './store';
import { addProcess, renameProcess, removeProcess, toggleCertification } from './processOps';
import { parseCSV, mergeOperators, downloadCSVTemplate, downloadOperatorsCSV } from './csv';
import { buildHolidayMap, initHolidays } from './holidays';
import { historyReducer, initHistory } from './historyReducer';
import { useBreakpoint } from './hooks/useBreakpoint';

import TopBar from './components/TopBar';
import OperatorPanel from './components/OperatorPanel';
import NavRail from './components/NavRail';
import CalendarGrid from './components/calendar/CalendarGrid';
import CertificationMatrix from './modules/CertificationMatrix';
import Dashboard from './modules/Dashboard';
import Employees from './modules/Employees';
import SettingsPanel from './modules/SettingsPanel';
import ExportPrint from './modules/ExportPrint';

/* ── Utility ──────────────────────────────────────────────────────────────── */
let _uid = 0;
const uid = () => `id_${++_uid}_${Date.now().toString(36)}`;

function getDefaults() {
  const shared = loadStateFromUrl();
  if (shared) {
    clearShareHash();
    return { state: migrateState(shared), wasShared: true };
  }
  const loaded = loadState();
  const base = loaded || {
    operators: seedOperators,
    vacationBlocks: seedVacationBlocks,
    processes: seedProcesses,
    demand: buildDefaultDemand(),
    settings: defaultSettings,
  };
  return { state: migrateState(base), wasShared: false };
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
  const [theme, setTheme] = useState(loadTheme);
  const [toast, setToast] = useState(initResult.wasShared ? 'Loaded shared workspace' : null);
  const [showDemand, setShowDemand] = useState(false);
  const [showOperatorMgmt, setShowOperatorMgmt] = useState(false);
  const [view, setView] = useState('planning');
  const [coverageMode, setCoverageMode] = useState('confirmed'); // 'confirmed' | 'projected'
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
  const processes = state.processes || seedProcesses;
  const { startWeek, visibleWeeks, shiftMode } = settings;
  const weeks = useMemo(
    () => Array.from({ length: visibleWeeks }, (_, i) => startWeek + i),
    [startWeek, visibleWeeks],
  );
  const coverageOpts = useMemo(
    () => (coverageMode === 'projected' ? { absentStatuses: ['approved', 'pending', 'requested'] } : {}),
    [coverageMode],
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
  const addBlock = useCallback((opId, sw, ew, status = 'draft') => {
    const lo = Math.min(sw, ew), hi = Math.max(sw, ew);
    const locked = (settings.lockedWeeks || []).filter(w => w >= lo && w <= hi);
    if (locked.length) flash(`⚠ Vecka ${locked.join(', ')} är låst`);
    setFn(s => ({ ...s, vacationBlocks: [...s.vacationBlocks, { id: uid(), operatorId: opId, startWeek: sw, endWeek: ew, status }] }));
  }, [setFn, settings.lockedWeeks]);
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
  const updateSettings = useCallback(patch =>
    setFn(s => ({ ...s, settings: { ...s.settings, ...patch } })), [setFn]);

  /* ── Process / certification management ─────────────────────────────────── */
  const handleAddProcess = useCallback(name => setFn(s => addProcess(s, name)), [setFn]);
  const handleRenameProcess = useCallback((oldName, newName) => setFn(s => renameProcess(s, oldName, newName)), [setFn]);
  const handleRemoveProcess = useCallback(name => setFn(s => removeProcess(s, name)), [setFn]);
  const handleToggleCert = useCallback((opId, proc) => setFn(s => toggleCertification(s, opId, proc)), [setFn]);

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
        const { operators: parsed, error, warnings } = parseCSV(ev.target.result, processes);
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
  }, [operators, processes, update]);
  const handleCSVExport = useCallback(() => {
    downloadOperatorsCSV(operators, processes);
    flash('Personalexport nedladdad');
  }, [operators, processes]);
  const handleDownloadTemplate = useCallback(() => downloadCSVTemplate(processes), [processes]);

  const handleSave = useCallback(() => { saveState(state); flash('State saved'); }, [state]);
  const handleExport = useCallback(() => { exportJSON(state); flash('Exported to file'); }, [state]);
  const handleImport = useCallback(async () => {
    const data = await importJSON();
    if (data) { setFn(() => migrateState(data)); flash('State imported'); }
  }, [setFn]);
  const handleReset = useCallback(() => {
    if (confirm('Reset all data to defaults? This cannot be undone.')) {
      clearState();
      setFn(() => migrateState({ operators: seedOperators, vacationBlocks: seedVacationBlocks, processes: seedProcesses, demand: buildDefaultDemand(), settings: defaultSettings }));
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
        shiftMode={shiftMode} onShiftModeChange={setShiftMode}
        theme={theme} onThemeChange={setTheme}
        onImportCSV={handleCSVImport} onExportCSV={handleCSVExport} onSave={handleSave}
        onExportJSON={handleExport} onImportJSON={handleImport}
        onReset={handleReset}
        onShare={handleShare}
        onUndo={undo} onRedo={redo}
        canUndo={canUndo} canRedo={canRedo}
      />

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        <NavRail view={view} onChange={setView} />

        {view === 'planning' && (
          <div className="flex flex-1 overflow-hidden">
            {/* Left: Operator Panel */}
            <OperatorPanel
              operators={operators} onUpdateOperator={updateOp}
              showMgmt={showOperatorMgmt}
              onToggleMgmt={() => setShowOperatorMgmt(p => !p)}
              onAddOperator={addOperator} onRemoveOperator={removeOperator}
              onDownloadTemplate={handleDownloadTemplate}
              collapsed={sidebarCollapsed}
              onToggleCollapse={() => setSidebarCollapsed(p => !p)}
              processes={processes}
            />

            {/* Center: coverage-mode toggle + Calendar */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex items-center gap-2 px-3 py-1.5 text-xs" style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
                <span className="uppercase tracking-wide font-semibold" style={{ color: 'var(--text-secondary)' }}>Coverage</span>
                <div className="flex items-center gap-0.5 p-0.5 rounded-full" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)' }}>
                  {[['confirmed', 'Confirmed'], ['projected', 'Projected']].map(([val, label]) => (
                    <button key={val} onClick={() => setCoverageMode(val)}
                      className="px-3 py-0.5 text-xs font-semibold rounded-full transition-all"
                      style={coverageMode === val ? { background: 'var(--accent)', color: '#fff' } : { background: 'transparent', color: 'var(--text-secondary)' }}>
                      {label}
                    </button>
                  ))}
                </div>
                <span style={{ color: 'var(--text-secondary)' }}>
                  {coverageMode === 'projected' ? 'incl. pending & requested' : 'approved leave only'}
                </span>
              </div>
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
                processes={processes} coverageOpts={coverageOpts}
              />
            </div>
          </div>
        )}

        {view === 'matrix' && (
          <CertificationMatrix
            operators={operators} processes={processes}
            onToggleCert={handleToggleCert}
            onAddProcess={handleAddProcess}
            onRenameProcess={handleRenameProcess}
            onRemoveProcess={handleRemoveProcess}
          />
        )}

        {view === 'dashboard' && (
          <Dashboard
            operators={operators} vacationBlocks={vacationBlocks}
            demand={demand} settings={settings} weeks={weeks}
            processes={processes} holidayMap={holidayMap}
            onNavigate={setView}
          />
        )}

        {view === 'employees' && (
          <Employees
            operators={operators} processes={processes}
            onUpdateOperator={updateOp} onAddOperator={addOperator} onRemoveOperator={removeOperator}
            onImportCSV={handleCSVImport} onExportCSV={handleCSVExport} onDownloadTemplate={handleDownloadTemplate}
          />
        )}

        {view === 'settings' && (
          <SettingsPanel settings={settings} onUpdateSettings={updateSettings} weeks={weeks} />
        )}

        {view === 'export' && (
          <ExportPrint
            operators={operators} vacationBlocks={vacationBlocks}
            demand={demand} settings={settings} weeks={weeks}
            processes={processes} holidayMap={holidayMap}
            onExportCSV={handleCSVExport}
          />
        )}
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
