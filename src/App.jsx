import { useState, useEffect, useCallback, useMemo, useReducer } from 'react';
import { buildDefaultState } from './data';
import { migrateState, processIdForName, buildOperatorIcon } from './schema';
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

import TopBar from './components/TopBar';
import PlanningBoard from './modules/PlanningBoard';
import Dashboard from './modules/Dashboard';
import CertificationMatrix from './modules/CertificationMatrix';
import Employees from './modules/Employees';
import Settings from './modules/Settings';
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
  return {
    state: migrateState(loadState() || buildDefaultState()),
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
  const [theme, setTheme] = useState(loadTheme);
  const [toast, setToast] = useState(initResult.wasShared ? 'Loaded shared workspace' : null);
  const [showDemand, setShowDemand] = useState(false);
  const [showOperatorMgmt, setShowOperatorMgmt] = useState(false);
  const [activeModule, setActiveModule] = useState('planning');
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

  const { operators, vacationBlocks, demand, settings, processes } = state;
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
  const updateDemand = useCallback((processId, week, val) =>
    setFn(s => ({ ...s, demand: { ...s.demand, [processId]: { ...s.demand[processId], [week]: val } } })), [setFn]);
  const toggleCertification = useCallback((operatorId, processId) =>
    setFn(s => ({
      ...s,
      operators: s.operators.map(op => {
        if (op.id !== operatorId) return op;
        const hasCert = (op.certifications || []).includes(processId);
        return {
          ...op,
          certifications: hasCert
            ? op.certifications.filter(cert => cert !== processId)
            : [...(op.certifications || []), processId],
        };
      }),
    })), [setFn]);
  const addProcess = useCallback(name =>
    setFn(s => {
      const baseId = processIdForName(name);
      let id = baseId;
      let suffix = 2;
      while (s.processes.some(process => process.id === id)) id = `${baseId}-${suffix++}`;
      const weekDemand = {};
      for (let w = 1; w <= 52; w++) weekDemand[w] = s.settings.defaultRequired ?? 2;
      return {
        ...s,
        processes: [...s.processes, { id, name }],
        demand: { ...s.demand, [id]: weekDemand },
      };
    }), [setFn]);
  const renameProcess = useCallback((processId, name) =>
    setFn(s => ({
      ...s,
      processes: s.processes.map(process => process.id === processId ? { ...process, name } : process),
    })), [setFn]);
  const removeProcess = useCallback(processId =>
    setFn(s => {
      const { [processId]: _removed, ...demand } = s.demand;
      return {
        ...s,
        processes: s.processes.filter(process => process.id !== processId),
        demand,
        operators: s.operators.map(op => ({
          ...op,
          certifications: (op.certifications || []).filter(cert => cert !== processId),
        })),
      };
    }), [setFn]);
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
    setFn(s => ({
      ...s,
      settings: {
        ...s.settings,
        ...patch,
        startWeek: patch.startWeek != null
          ? Math.max(1, Math.min(52 - (patch.visibleWeeks ?? s.settings.visibleWeeks) + 1, patch.startWeek))
          : s.settings.startWeek,
      },
    })), [setFn]);

  /* ── Operator management ────────────────────────────────────────────────── */
  const addOperator = useCallback((name, shift) => {
    const op = { id: uid(), name, shift, active: true, certifications: [], icon: buildOperatorIcon(name, operators.length) };
    setFn(s => ({ ...s, operators: [...s.operators, op] }));
    flash(`${name} tillagd`);
  }, [operators.length, setFn]);
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

  const handleSave = useCallback(() => { saveState(state); flash('State saved'); }, [state]);
  const handleExport = useCallback(() => { exportJSON(state); flash('Exported to file'); }, [state]);
  const handleImport = useCallback(async () => {
    const data = await importJSON();
    if (data) { setFn(() => data); flash('State imported'); }
  }, [setFn]);
  const handleReset = useCallback(() => {
    if (confirm('Reset all data to defaults? This cannot be undone.')) {
      clearState();
      setFn(() => buildDefaultState());
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
        activeModule={activeModule}
        onModuleChange={setActiveModule}
      />

      {/* ── Main content ─────────────────────────────────────────────────── */}
      {activeModule === 'dashboard' && (
        <Dashboard
          operators={operators}
          vacationBlocks={vacationBlocks}
          demand={demand}
          processes={processes}
          weeks={weeks}
          settings={settings}
          holidayMap={holidayMap}
          onOpenPlanning={() => setActiveModule('planning')}
        />
      )}
      {activeModule === 'planning' && (
        <PlanningBoard
          operators={operators}
          vacationBlocks={vacationBlocks}
          demand={demand}
          settings={settings}
          processes={processes}
          weeks={weeks}
          holidayMap={holidayMap}
          onUpdateOperator={updateOp}
          showOperatorMgmt={showOperatorMgmt}
          onToggleOperatorMgmt={() => setShowOperatorMgmt(p => !p)}
          onAddOperator={addOperator}
          onRemoveOperator={removeOperator}
          onDownloadTemplate={() => downloadCSVTemplate(processes)}
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={() => setSidebarCollapsed(p => !p)}
          onAddBlock={addBlock}
          onUpdateBlock={updateBlock}
          onDeleteBlock={deleteBlock}
          onSetBlockStatus={setBlockStatus}
          onSetBlockDayStatus={setBlockDayStatus}
          onClearBlockDayStatus={clearBlockDayStatus}
          onSetBlockNote={setBlockNote}
          setStartWeek={setStartWeek}
          showDemand={showDemand}
          onToggleDemand={() => setShowDemand(p => !p)}
          updateDemand={updateDemand}
          zoom={zoom}
          onZoomChange={setZoom}
        />
      )}
      {activeModule === 'matrix' && (
        <CertificationMatrix
          operators={operators}
          processes={processes}
          onToggleCertification={toggleCertification}
          onAddProcess={addProcess}
          onRenameProcess={renameProcess}
          onRemoveProcess={removeProcess}
        />
      )}
      {activeModule === 'employees' && (
        <Employees
          operators={operators}
          processes={processes}
          onUpdateOperator={updateOp}
          showMgmt={showOperatorMgmt}
          onToggleMgmt={() => setShowOperatorMgmt(p => !p)}
          onAddOperator={addOperator}
          onRemoveOperator={removeOperator}
          onDownloadTemplate={() => downloadCSVTemplate(processes)}
        />
      )}
      {activeModule === 'settings' && <Settings settings={settings} onUpdateSettings={updateSettings} />}
      {activeModule === 'export' && (
        <ExportPrint
          operators={operators}
          vacationBlocks={vacationBlocks}
          demand={demand}
          processes={processes}
          weeks={weeks}
          settings={settings}
          holidayMap={holidayMap}
        />
      )}

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
