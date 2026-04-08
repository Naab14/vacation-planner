import { useState, useEffect, useCallback, useMemo } from 'react';
import { seedOperators, seedVacationBlocks, buildDefaultDemand, defaultSettings, themes } from './data';
import { saveState, loadState, clearState, saveTheme, loadTheme, exportJSON, importJSON, debouncedSave } from './storage';
import { parseCSV, mergeOperators, downloadCSVTemplate } from './csv';
import { buildHolidayMap } from './holidays';

import TopBar from './components/TopBar';
import OperatorPanel from './components/OperatorPanel';
import CalendarGrid from './components/CalendarGrid';
import DayView from './components/DayView';

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

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  APP                                                                      */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function App() {
  const [state, setState] = useState(getDefaults);
  const [theme, setTheme] = useState(loadTheme);
  const [toast, setToast] = useState(null);
  const [showDemand, setShowDemand] = useState(false);
  const [showOperatorMgmt, setShowOperatorMgmt] = useState(false);
  const [viewMode, setViewMode] = useState('week'); // 'week' | 'day'
  const [selectedDay, setSelectedDay] = useState(null); // { week, dayOfWeek } for day view

  const { operators, vacationBlocks, demand, settings } = state;
  const { startWeek, visibleWeeks, shiftMode } = settings;
  const weeks = useMemo(() => Array.from({ length: visibleWeeks }, (_, i) => startWeek + i), [startWeek, visibleWeeks]);

  const holidayMap = useMemo(() => buildHolidayMap(), []);

  // Theme effect
  useEffect(() => {
    if (theme === 'default') document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme', theme);
    saveTheme(theme);
  }, [theme]);

  // Auto-save
  useEffect(() => { debouncedSave(state); }, [state]);

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
  const shiftWeeks = useCallback(delta =>
    setState(s => ({ ...s, settings: { ...s.settings, startWeek: Math.max(1, Math.min(52 - s.settings.visibleWeeks + 1, s.settings.startWeek + delta)) } })), []);

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

  /* ── Render ─────────────────────────────────────────────────────────────── */
  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>

      {/* ── Top Bar ──────────────────────────────────────────────────────── */}
      <TopBar
        shiftMode={shiftMode} onShiftModeChange={setShiftMode}
        theme={theme} onThemeChange={setTheme}
        viewMode={viewMode} onViewModeChange={setViewMode}
        onImportCSV={handleCSVImport} onSave={handleSave}
        onExportJSON={handleExport} onImportJSON={handleImport}
        onReset={handleReset}
        onToggleOperators={() => setShowOperatorMgmt(p => !p)}
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
        />

        {/* Center: Calendar */}
        {viewMode === 'week' ? (
          <CalendarGrid
            operators={operators} vacationBlocks={vacationBlocks}
            demand={demand} settings={settings} weeks={weeks}
            holidayMap={holidayMap}
            onAddBlock={addBlock} onUpdateBlock={updateBlock}
            onDeleteBlock={deleteBlock} onSetBlockStatus={setBlockStatus}
            shiftWeeks={shiftWeeks} showDemand={showDemand}
            onToggleDemand={() => setShowDemand(p => !p)}
            updateDemand={updateDemand}
            onSwitchToDay={(week) => { setSelectedDay({ week }); setViewMode('day'); }}
          />
        ) : (
          <DayView
            week={selectedDay?.week || weeks[0]}
            operators={operators} vacationBlocks={vacationBlocks}
            demand={demand} shiftMode={shiftMode} holidayMap={holidayMap}
            onBack={() => setViewMode('week')}
            onWeekChange={w => setSelectedDay({ week: w })}
          />
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-4 right-4 z-50 px-4 py-2 rounded shadow-lg text-sm font-medium"
          style={{ background: 'var(--accent)', color: '#fff', borderRadius: 'var(--border-radius)' }}>
          {toast}
        </div>
      )}
    </div>
  );
}
