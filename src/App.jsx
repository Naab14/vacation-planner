import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { PROCESSES, seedOperators, seedVacationBlocks, buildDefaultDemand, defaultSettings, themes } from './data';
import { saveState, loadState, clearState, saveTheme, loadTheme, exportJSON, importJSON, debouncedSave } from './storage';
import { parseCSV, mergeOperators, downloadCSVTemplate } from './csv';
import { getCoverage } from './coverage';
import { buildHolidayMap } from './holidays';

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

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  TOP BAR                                                                  */
/* ═══════════════════════════════════════════════════════════════════════════ */

function TopBar({ shiftMode, onShiftModeChange, theme, onThemeChange, viewMode, onViewModeChange, onImportCSV, onSave, onExportJSON, onImportJSON, onReset, onToggleOperators }) {
  const modes = [
    { value: 'separate', label: 'Separate' },
    { value: 'combined', label: 'Combined' },
    { value: 'summer', label: 'Summer' },
  ];
  const btnStyle = { background: 'rgba(255,255,255,0.15)', color: 'var(--topbar-text)', borderRadius: 'var(--border-radius)' };

  return (
    <div className="flex items-center gap-3 px-4 py-2 flex-wrap" style={{ background: 'var(--topbar-bg)', color: 'var(--topbar-text)' }}>
      <h1 className="text-lg font-bold mr-4 whitespace-nowrap" style={{ color: 'var(--topbar-text)' }}>Semester Planner</h1>

      {/* Shift mode toggle */}
      <div className="flex items-center gap-1 mr-4">
        {modes.map(m => (
          <button key={m.value} onClick={() => onShiftModeChange(m.value)}
            className="px-3 py-1 text-sm rounded transition-all"
            style={{ background: shiftMode === m.value ? 'var(--accent)' : 'rgba(255,255,255,0.1)', color: '#fff', borderRadius: 'var(--border-radius)' }}>
            {m.label}
          </button>
        ))}
      </div>

      {/* View mode toggle */}
      <div className="flex items-center gap-1 mr-4">
        {['week', 'day'].map(v => (
          <button key={v} onClick={() => onViewModeChange(v)}
            className="px-3 py-1 text-sm rounded transition-all"
            style={{ background: viewMode === v ? 'var(--accent)' : 'rgba(255,255,255,0.1)', color: '#fff', borderRadius: 'var(--border-radius)' }}>
            {v === 'week' ? 'Vecka' : 'Dag'}
          </button>
        ))}
      </div>

      {/* Theme */}
      <div className="flex items-center gap-1 mr-4">
        <span className="text-xs opacity-70 mr-1">Theme:</span>
        <select value={theme} onChange={e => onThemeChange(e.target.value)}
          className="px-2 py-1 text-sm rounded"
          style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 'var(--border-radius)' }}>
          {themes.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
        </select>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 ml-auto flex-wrap">
        <button onClick={onImportCSV} className="px-3 py-1 text-sm hover:opacity-80" style={btnStyle}>Import CSV</button>
        <button onClick={onSave} className="px-3 py-1 text-sm hover:opacity-80" style={btnStyle}>Save</button>
        <button onClick={onExportJSON} className="px-3 py-1 text-sm hover:opacity-80" style={btnStyle}>Export</button>
        <button onClick={onImportJSON} className="px-3 py-1 text-sm hover:opacity-80" style={btnStyle}>Import</button>
        <button onClick={onReset} className="px-3 py-1 text-sm hover:opacity-80 text-red-300" style={btnStyle}>Reset</button>
        <button onClick={onToggleOperators} className="px-3 py-1 text-sm hover:opacity-80" style={btnStyle}>Operators</button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  OPERATOR PANEL (left sidebar)                                            */
/* ═══════════════════════════════════════════════════════════════════════════ */

function OperatorPanel({ operators, onUpdateOperator, showMgmt, onToggleMgmt, onAddOperator, onRemoveOperator, onDownloadTemplate }) {
  const [editId, setEditId] = useState(null);
  const [newName, setNewName] = useState('');
  const [newShift, setNewShift] = useState('S1');

  const handleAdd = () => {
    if (!newName.trim()) return;
    onAddOperator(newName.trim(), newShift);
    setNewName('');
  };

  return (
    <div className="w-[200px] min-w-[200px] overflow-y-auto h-full" style={{ background: 'var(--bg-panel)', borderRight: '1px solid var(--border)' }}>
      <div className="flex items-center gap-1 px-2 py-2" style={{ color: 'var(--text-secondary)' }}>
        <span className="font-semibold text-sm uppercase tracking-wide">Operators</span>
        <div className="ml-auto flex gap-1">
          <button onClick={onDownloadTemplate} className="px-1.5 py-0.5 text-[10px] font-medium rounded hover:opacity-80"
            style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--border-radius)' }}>CSV</button>
          {showMgmt ? null : (
            <button onClick={onToggleMgmt} className="px-1.5 py-0.5 text-[10px] font-medium rounded hover:opacity-80"
              style={{ background: 'var(--accent)', color: '#fff', borderRadius: 'var(--border-radius)' }}>+ Add</button>
          )}
        </div>
      </div>

      {/* ── Add/Remove Operator Panel ─────────────────────────────────── */}
      {showMgmt && (
        <div className="px-3 pb-3 mb-2" style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
          <div className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-secondary)' }}>Add Operator</div>
          <input type="text" placeholder="Name" value={newName} onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            className="w-full px-2 py-1 text-sm mb-1" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 'var(--border-radius)', color: 'var(--text-primary)' }} />
          <div className="flex gap-1 mb-1">
            <select value={newShift} onChange={e => setNewShift(e.target.value)} className="flex-1 px-2 py-1 text-sm"
              style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 'var(--border-radius)', color: 'var(--text-primary)' }}>
              <option value="S1">S1</option><option value="S2">S2</option>
            </select>
            <button onClick={handleAdd} className="px-3 py-1 text-sm font-medium text-white" style={{ background: 'var(--accent)', borderRadius: 'var(--border-radius)' }}>Add</button>
          </div>
          <button onClick={onDownloadTemplate} className="w-full px-2 py-1 text-xs mt-1 hover:opacity-80"
            style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 'var(--border-radius)', color: 'var(--text-secondary)' }}>
            ↓ Download CSV Template
          </button>
        </div>
      )}

      {/* ── Operator List ─────────────────────────────────────────────── */}
      {operators.map(op => (
        <div key={op.id}>
          <div className="px-3 py-2 flex items-center gap-2 cursor-pointer hover:opacity-80 text-sm"
            style={{ opacity: op.active ? 1 : 0.4, background: editId === op.id ? 'var(--bg-secondary)' : 'transparent', color: 'var(--text-primary)' }}
            onClick={() => setEditId(editId === op.id ? null : op.id)}>
            <span className="flex-1 truncate font-medium">{op.name}</span>
            <span className="text-xs px-1.5 py-0.5 rounded font-mono"
              style={{ background: op.shift === 'S1' ? 'var(--accent)' : 'var(--accent-secondary)', color: '#fff', borderRadius: 'var(--border-radius)' }}>
              {op.shift}
            </span>
          </div>

          {/* Inline edit panel */}
          {editId === op.id && (
            <div className="px-3 pb-3 space-y-2" style={{ background: 'var(--bg-secondary)' }}>
              <div>
                <label className="text-xs block mb-1" style={{ color: 'var(--text-secondary)' }}>Name</label>
                <input type="text" value={op.name} onChange={e => onUpdateOperator(op.id, { name: e.target.value })}
                  className="w-full px-2 py-1 text-sm" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 'var(--border-radius)', color: 'var(--text-primary)' }} />
              </div>
              <div>
                <label className="text-xs block mb-1" style={{ color: 'var(--text-secondary)' }}>Shift</label>
                <select value={op.shift} onChange={e => onUpdateOperator(op.id, { shift: e.target.value })}
                  className="w-full px-2 py-1 text-sm" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 'var(--border-radius)', color: 'var(--text-primary)' }}>
                  <option value="S1">S1</option><option value="S2">S2</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={op.active} onChange={e => onUpdateOperator(op.id, { active: e.target.checked })} id={`active-${op.id}`} />
                <label htmlFor={`active-${op.id}`} className="text-sm" style={{ color: 'var(--text-primary)' }}>Active</label>
              </div>
              <div>
                <label className="text-xs block mb-1" style={{ color: 'var(--text-secondary)' }}>Certifications</label>
                {PROCESSES.map(p => (
                  <label key={p} className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--text-primary)' }}>
                    <input type="checkbox" checked={op.certifications.includes(p)}
                      onChange={e => {
                        const certs = e.target.checked ? [...op.certifications, p] : op.certifications.filter(c => c !== p);
                        onUpdateOperator(op.id, { certifications: certs });
                      }} />
                    {p}
                  </label>
                ))}
              </div>
              {showMgmt && (
                <button onClick={() => { if (confirm(`Remove ${op.name}?`)) { onRemoveOperator(op.id); setEditId(null); } }}
                  className="w-full px-2 py-1 text-xs text-red-600 hover:bg-red-50" style={{ border: '1px solid var(--border)', borderRadius: 'var(--border-radius)' }}>
                  Remove Operator
                </button>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  CONTEXT MENU                                                             */
/* ═══════════════════════════════════════════════════════════════════════════ */

function ContextMenu({ x, y, block, onSetStatus, onDelete, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    const keyHandler = e => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('mousedown', handler);
    document.addEventListener('keydown', keyHandler);
    return () => { document.removeEventListener('mousedown', handler); document.removeEventListener('keydown', keyHandler); };
  }, [onClose]);

  if (!block) return null;

  const statuses = ['draft', 'pending', 'approved', 'requested'];
  const statusLabels = { draft: 'Utkast', pending: 'Väntande', approved: 'Godkänd', requested: 'Begärd' };
  const statusColors = {
    draft: 'var(--draft-bg)', pending: 'var(--pending-bg)',
    approved: 'var(--approved-bg)', requested: 'var(--requested-bg)',
  };
  const statusBorders = {
    draft: 'var(--draft-border)', pending: 'var(--pending-border)',
    approved: 'var(--approved-border)', requested: 'var(--requested-border)',
  };

  return (
    <div ref={ref} className="fixed z-50 shadow-lg py-1 min-w-[160px]"
      style={{ left: x, top: y, background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: 'var(--border-radius)', color: 'var(--text-primary)' }}>
      <div className="px-3 py-1 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>Status</div>
      {statuses.map(s => (
        <button key={s} onClick={() => { onSetStatus(block.id, s); onClose(); }}
          className="w-full text-left px-3 py-1.5 text-sm hover:opacity-80 flex items-center gap-2"
          style={{ background: block.status === s ? 'var(--bg-secondary)' : 'transparent', color: 'var(--text-primary)' }}>
          <span className="w-3 h-3 rounded-sm inline-block"
            style={{ background: statusColors[s], border: `1px solid ${statusBorders[s]}`,
              ...(s === 'requested' ? { backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px)', borderStyle: 'dashed' } : {})
            }} />
          {statusLabels[s]}
        </button>
      ))}
      <hr style={{ borderColor: 'var(--border)' }} className="my-1" />
      <button onClick={() => { onDelete(block.id); onClose(); }}
        className="w-full text-left px-3 py-1.5 text-sm text-red-600 hover:bg-red-50">Delete</button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  COVERAGE TOOLTIP                                                         */
/* ═══════════════════════════════════════════════════════════════════════════ */

function CoverageTooltip({ coverageData, week, process, holidayMap, style }) {
  if (!coverageData) return null;
  const { covered, required, operatorsIn, operatorsOut, isHoliday } = coverageData;
  const holidayNames = holidayMap?.[week]?.holidays?.map(h => h.name) || [];

  return (
    <div className="coverage-tooltip" style={style} role="tooltip">
      <div className="font-semibold mb-1">{process} — v.{week}</div>
      {isHoliday && <div style={{ color: 'var(--holiday-text)' }} className="text-xs mb-1">🔴 {holidayNames.join(', ')}</div>}
      <div className="mb-1">{covered} av {required} tillgängliga</div>
      {operatorsIn.length > 0 && (
        <div className="mb-1">
          <span className="font-medium" style={{ color: 'var(--coverage-green)' }}>Inne:</span>
          {operatorsIn.map(o => <div key={o.id} className="ml-2">{o.name}</div>)}
        </div>
      )}
      {operatorsOut.length > 0 && (
        <div>
          <span className="font-medium" style={{ color: 'var(--coverage-red)' }}>Borta:</span>
          {operatorsOut.map(o => <div key={o.id} className="ml-2">{o.name}</div>)}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  LEGEND                                                                   */
/* ═══════════════════════════════════════════════════════════════════════════ */

function Legend() {
  const items = [
    { label: 'Utkast', bg: 'var(--draft-bg)', border: 'var(--draft-border)', style: {} },
    { label: 'Väntande', bg: 'var(--pending-bg)', border: 'var(--pending-border)', style: {} },
    { label: 'Godkänd', bg: 'var(--approved-bg)', border: 'var(--approved-border)', style: {} },
    { label: 'Begärd', bg: 'var(--requested-bg)', border: 'var(--requested-border)',
      style: { backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px)', borderStyle: 'dashed', opacity: 0.65 } },
    { label: 'Helgdag', bg: 'var(--holiday-bg)', border: 'var(--holiday-border)', style: {} },
  ];
  return (
    <div className="flex items-center gap-3 px-2 py-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
      {items.map(i => (
        <div key={i.label} className="flex items-center gap-1">
          <span className="w-4 h-3 rounded-sm inline-block" style={{ background: i.bg, border: `1px solid ${i.border}`, ...i.style }} />
          {i.label}
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  CALENDAR GRID (WEEK VIEW)                                                */
/* ═══════════════════════════════════════════════════════════════════════════ */

const CELL_W = 68;
const CELL_H = 32;
const LABEL_W = 130;

function CalendarGrid({ operators, vacationBlocks, demand, settings, weeks, holidayMap, onAddBlock, onUpdateBlock, onDeleteBlock, onSetBlockStatus, shiftWeeks, showDemand, onToggleDemand, updateDemand, onSwitchToDay }) {
  const { shiftMode } = settings;
  const gridRef = useRef(null);

  // ── Drag state (pointer events) ────────────────────────────────────────
  const [drawing, setDrawing] = useState(null);     // { opId, startWeek, endWeek }
  const [resizing, setResizing] = useState(null);   // { blockId, edge }
  const [moving, setMoving] = useState(null);        // { blockId, originWeek, origStart, origEnd, origOpId }
  const [ctxMenu, setCtxMenu] = useState(null);

  // ── Pointer event handlers ─────────────────────────────────────────────
  const handleCellPointerDown = (e, opId, week) => {
    if (e.button !== 0) return;
    e.preventDefault();
    // Check if clicking on existing block
    const block = vacationBlocks.find(b => b.operatorId === opId && week >= b.startWeek && week <= b.endWeek);
    if (block) {
      const cell = e.currentTarget;
      const rect = cell.getBoundingClientRect();
      const relX = e.clientX - rect.left;
      const cellW = rect.width;
      if (relX < 8) {
        setResizing({ blockId: block.id, edge: 'left', origStart: block.startWeek, origEnd: block.endWeek });
      } else if (relX > cellW - 8) {
        setResizing({ blockId: block.id, edge: 'right', origStart: block.startWeek, origEnd: block.endWeek });
      } else {
        setMoving({ blockId: block.id, originWeek: week, origStart: block.startWeek, origEnd: block.endWeek, origOpId: opId });
      }
    } else {
      setDrawing({ opId, startWeek: week, endWeek: week });
    }
    (e.target).setPointerCapture?.(e.pointerId);
  };

  const handleCellPointerMove = (e, opId, week) => {
    if (drawing && drawing.opId === opId) {
      setDrawing(d => ({ ...d, endWeek: week }));
    }
    if (resizing) {
      const block = vacationBlocks.find(b => b.id === resizing.blockId);
      if (block) {
        if (resizing.edge === 'left') onUpdateBlock(resizing.blockId, { startWeek: Math.min(week, block.endWeek) });
        else onUpdateBlock(resizing.blockId, { endWeek: Math.max(week, block.startWeek) });
      }
    }
    if (moving) {
      const delta = week - moving.originWeek;
      onUpdateBlock(moving.blockId, { operatorId: opId, startWeek: moving.origStart + delta, endWeek: moving.origEnd + delta });
    }
  };

  const handlePointerUp = () => {
    if (drawing) {
      const sw = Math.min(drawing.startWeek, drawing.endWeek);
      const ew = Math.max(drawing.startWeek, drawing.endWeek);
      onAddBlock(drawing.opId, sw, ew);
    }
    setDrawing(null);
    setResizing(null);
    setMoving(null);
  };

  const handleContextMenu = (e, block) => {
    e.preventDefault();
    setCtxMenu({ x: e.clientX, y: e.clientY, block });
  };

  // ── Build row groups ───────────────────────────────────────────────────
  const groups = shiftMode === 'separate'
    ? [{ label: 'S1', ops: operators.filter(o => o.shift === 'S1'), shift: 'S1' },
       { label: 'S2', ops: operators.filter(o => o.shift === 'S2'), shift: 'S2' }]
    : [{ label: shiftMode === 'summer' ? 'Summer Schedule' : 'All Operators', ops: operators, shift: null }];

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Nav + legend */}
      <div className="flex items-center gap-2 px-2 py-1 flex-wrap" style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
        <button onClick={() => shiftWeeks(-4)} className="px-2 py-1 text-sm hover:opacity-80" style={{ color: 'var(--text-primary)' }}>← 4 veckor</button>
        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>v.{weeks[0]} — v.{weeks[weeks.length - 1]}</span>
        <button onClick={() => shiftWeeks(4)} className="px-2 py-1 text-sm hover:opacity-80" style={{ color: 'var(--text-primary)' }}>4 veckor →</button>
        <Legend />
        <div className="ml-auto flex gap-1">
          <button onClick={onToggleDemand} className="px-2 py-1 text-xs"
            style={{ background: showDemand ? 'var(--accent)' : 'var(--bg-primary)', color: showDemand ? '#fff' : 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 'var(--border-radius)' }}>
            Demand
          </button>
        </div>
      </div>

      {/* Grid */}
      <div ref={gridRef} className="flex-1 overflow-auto select-none" onPointerUp={handlePointerUp}>
        <div style={{ minWidth: LABEL_W + weeks.length * CELL_W }}>
          {/* Header */}
          <div className="flex sticky top-0 z-20" style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
            <div className="sticky left-0 z-10 flex items-center px-2 text-xs font-semibold" style={{ width: LABEL_W, minWidth: LABEL_W, background: 'var(--bg-secondary)', color: 'var(--text-secondary)', borderRight: '1px solid var(--border)' }}>
              Operator
            </div>
            {weeks.map(w => {
              const isHoliday = holidayMap[w]?.holidays?.length > 0;
              const holidayAbbrevs = isHoliday ? holidayMap[w].holidays.map(h => {
                // Abbreviate long holiday names to fit column
                const abbrevMap = {
                  'Annandag påsk': 'Annandag',
                  'Första maj': 'Första m',
                  'Kristi himmelsfärdsdag': 'Kristi h',
                  'Pingstdagen': 'Pingstda',
                  'Nationaldagen': 'Sveriges',
                  'Midsommarafton': 'Midsom.',
                  'Midsommardagen': 'Midsom.',
                  'Långfredagen': 'Långfre',
                  'Påskdagen': 'Påskdag',
                  'Trettondedag jul': 'Trett.',
                  'Nyårsdagen': 'Nyår',
                  'Julafton': 'Julaft',
                  'Juldagen': 'Juldag',
                  'Annandag jul': 'Ann.jul',
                  'Nyårsafton': 'Nyårsaf',
                  'Alla helgons dag': 'Alla h',
                };
                return abbrevMap[h.name] || h.name.slice(0, 7);
              }) : [];
              return (
                <div key={w} className="flex flex-col items-center justify-center text-xs font-medium cursor-pointer hover:opacity-80"
                  style={{ width: CELL_W, minWidth: CELL_W, height: isHoliday ? CELL_H + 12 : CELL_H, color: isHoliday ? 'var(--holiday-text)' : 'var(--text-secondary)', background: isHoliday ? 'var(--holiday-bg)' : 'transparent', borderRight: '1px solid var(--border)', lineHeight: 1.1 }}
                  title={isHoliday ? holidayMap[w].holidays.map(h => h.name).join(', ') : undefined}
                  onClick={() => onSwitchToDay(w)}>
                  <span>v.{w}</span>
                  {isHoliday && <span className="text-[9px] italic opacity-80 truncate w-full text-center" style={{ color: 'var(--holiday-text)' }}>{holidayAbbrevs[0]}</span>}
                </div>
              );
            })}
          </div>

          {/* Rows per group */}
          {groups.map(group => (
            <div key={group.label}>
              {/* Group header */}
              {groups.length > 1 && (
                <div className="flex items-center text-xs font-semibold uppercase tracking-wider px-2"
                  style={{ height: 24, background: 'var(--bg-secondary)', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)' }}>
                  {group.label}
                </div>
              )}

              {/* Operator rows */}
              {group.ops.map(op => (
                <div key={op.id} className="flex relative" style={{ height: CELL_H, borderBottom: '1px solid var(--border)', opacity: op.active ? 1 : 0.4 }}>
                  <div className="sticky left-0 z-10 flex items-center px-2 text-xs truncate"
                    style={{ width: LABEL_W, minWidth: LABEL_W, background: 'var(--bg-primary)', borderRight: '1px solid var(--border)', color: 'var(--text-primary)' }}>
                    {op.name}
                  </div>
                  {weeks.map(w => {
                    const block = vacationBlocks.find(b => b.operatorId === op.id && w >= b.startWeek && w <= b.endWeek);
                    const isDrawing = drawing?.opId === op.id && w >= Math.min(drawing.startWeek, drawing.endWeek) && w <= Math.max(drawing.startWeek, drawing.endWeek);
                    const isStart = block && w === block.startWeek;
                    const isEnd = block && w === block.endWeek;
                    const isDrag = moving?.blockId === block?.id || resizing?.blockId === block?.id;
                    const isHoliday = holidayMap[w]?.holidays?.length > 0;

                    let cellBg = 'transparent';
                    let cellBorder = '';
                    let cellStyle = {};

                    if (block) {
                      if (block.status === 'requested') {
                        cellStyle = {
                          background: `repeating-linear-gradient(45deg, var(--requested-bg), var(--requested-bg) 4px, transparent 4px, transparent 8px)`,
                          borderTop: '2px dashed var(--requested-border)',
                          borderBottom: '2px dashed var(--requested-border)',
                          opacity: 0.65,
                          zIndex: 1, // Behind approved
                        };
                        if (isStart) cellStyle.borderLeft = '2px dashed var(--requested-border)';
                        if (isEnd) cellStyle.borderRight = '2px dashed var(--requested-border)';
                      } else {
                        const bgVar = `var(--${block.status}-bg)`;
                        const borderVar = `var(--${block.status}-border)`;
                        cellStyle = {
                          background: bgVar,
                          borderTop: `2px solid ${borderVar}`,
                          borderBottom: `2px solid ${borderVar}`,
                          zIndex: block.status === 'approved' ? 3 : 2,
                        };
                        if (isStart) cellStyle.borderLeft = `2px solid ${borderVar}`;
                        if (isEnd) cellStyle.borderRight = `2px solid ${borderVar}`;
                      }
                      if (isDrag) cellStyle.outline = '2px solid var(--accent)';
                    } else if (isDrawing) {
                      cellStyle = { background: 'var(--draft-bg)', opacity: 0.5 };
                    } else if (isHoliday) {
                      cellStyle = { background: 'var(--holiday-bg)' };
                    }

                    return (
                      <div key={w}
                        className={`flex items-center justify-center text-xs relative ${isDrag ? 'drag-ghost' : ''} ${!block && !isDrawing ? 'drop-target-highlight-zone' : ''}`}
                        style={{ width: CELL_W, minWidth: CELL_W, height: CELL_H, borderRight: '1px solid var(--border)', cursor: block ? (resizing ? 'ew-resize' : 'grab') : 'crosshair', touchAction: 'none', ...cellStyle }}
                        onPointerDown={e => handleCellPointerDown(e, op.id, w)}
                        onPointerMove={e => handleCellPointerMove(e, op.id, w)}
                        onContextMenu={block ? e => handleContextMenu(e, block) : undefined}>
                        {/* Resize handles */}
                        {block && isStart && (
                          <div className="absolute left-0 top-0 h-full w-2 cursor-w-resize" style={{ zIndex: 10 }}
                            onPointerDown={e => { e.stopPropagation(); setResizing({ blockId: block.id, edge: 'left', origStart: block.startWeek, origEnd: block.endWeek }); }} />
                        )}
                        {block && isEnd && (
                          <div className="absolute right-0 top-0 h-full w-2 cursor-e-resize" style={{ zIndex: 10 }}
                            onPointerDown={e => { e.stopPropagation(); setResizing({ blockId: block.id, edge: 'right', origStart: block.startWeek, origEnd: block.endWeek }); }} />
                        )}
                        {/* Block label — show week range */}
                        {block && isStart && (
                          <span className="absolute inset-[2px] flex items-center justify-center text-xs font-medium truncate pointer-events-none select-none"
                            style={{ color: 'var(--text-primary)' }}>
                            {block.startWeek === block.endWeek ? `v.${block.startWeek}` : `v.${block.startWeek}-${block.endWeek}`}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}

              {/* Coverage rows for this group */}
              <CoverageRows operators={operators} vacationBlocks={vacationBlocks} demand={demand}
                weeks={weeks} shiftMode={settings.shiftMode} shiftFilter={group.shift} holidayMap={holidayMap} label={`COVERAGE (${group.label})`} />
            </div>
          ))}

          {/* Demand editor */}
          {showDemand && (
            <DemandEditor demand={demand} weeks={weeks} updateDemand={updateDemand} />
          )}
        </div>
      </div>

      {/* Context menu */}
      {ctxMenu && (
        <ContextMenu {...ctxMenu} onSetStatus={onSetBlockStatus} onDelete={onDeleteBlock} onClose={() => setCtxMenu(null)} />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  COVERAGE ROWS                                                            */
/* ═══════════════════════════════════════════════════════════════════════════ */

function CoverageRows({ operators, vacationBlocks, demand, weeks, shiftMode, shiftFilter, holidayMap, label }) {
  const [tooltip, setTooltip] = useState(null);
  const colorMap = { green: 'var(--coverage-green)', yellow: 'var(--coverage-yellow)', red: 'var(--coverage-red)' };

  return (
    <>
      <div className="flex items-center text-xs font-semibold uppercase tracking-wider px-2"
        style={{ height: 24, background: 'var(--bg-secondary)', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ width: LABEL_W, minWidth: LABEL_W }}>{label}</div>
      </div>
      {PROCESSES.map(proc => (
        <div key={proc} className="flex" style={{ height: CELL_H, borderBottom: '1px solid var(--border)' }}>
          <div className="sticky left-0 z-10 flex items-center px-2 text-xs truncate"
            style={{ width: LABEL_W, minWidth: LABEL_W, background: 'var(--bg-primary)', borderRight: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
            {proc}
          </div>
          {weeks.map(w => {
            const cov = getCoverage(operators, vacationBlocks, demand, proc, w, shiftMode, shiftFilter, holidayMap);
            return (
              <div key={w}
                className="flex items-center justify-center text-xs font-medium relative"
                style={{ width: CELL_W, minWidth: CELL_W, height: CELL_H, borderRight: '1px solid var(--border)', color: colorMap[cov.level], cursor: 'help' }}
                tabIndex={0}
                role="button"
                aria-label={`${proc} v.${w}: ${cov.covered}/${cov.required}`}
                onPointerEnter={e => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = rect.right + 4 > window.innerWidth ? rect.left - 220 : rect.right + 4;
                  const y = Math.min(rect.top, window.innerHeight - 200);
                  setTooltip({ proc, week: w, cov, x, y });
                }}
                onPointerLeave={() => setTooltip(null)}
                onFocus={e => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setTooltip({ proc, week: w, cov, x: rect.right + 4, y: rect.top });
                }}
                onBlur={() => setTooltip(null)}>
                {cov.covered}/{cov.required}
                {cov.isHoliday && <span className="absolute top-0 right-0.5 text-[8px]" style={{ color: 'var(--holiday-text)' }}>★</span>}
              </div>
            );
          })}
        </div>
      ))}
      {tooltip && (
        <CoverageTooltip coverageData={tooltip.cov} week={tooltip.week} process={tooltip.proc}
          holidayMap={holidayMap} style={{ position: 'fixed', left: tooltip.x, top: tooltip.y }} />
      )}
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  DEMAND EDITOR                                                            */
/* ═══════════════════════════════════════════════════════════════════════════ */

function DemandEditor({ demand, weeks, updateDemand }) {
  return (
    <div style={{ borderTop: '2px solid var(--border)' }}>
      <div className="flex items-center justify-between px-2 py-1" style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Demand</span>
      </div>
      <div className="flex" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="sticky left-0 z-10 flex items-center px-2 text-xs font-semibold"
          style={{ width: LABEL_W, minWidth: LABEL_W, background: 'var(--bg-secondary)', color: 'var(--text-secondary)', borderRight: '1px solid var(--border)' }}>
          Process
        </div>
        {weeks.map(w => (
          <div key={w} className="flex items-center justify-center text-xs font-medium"
            style={{ width: CELL_W, minWidth: CELL_W, color: 'var(--text-secondary)', borderRight: '1px solid var(--border)' }}>
            v.{w}
          </div>
        ))}
      </div>
      {PROCESSES.map(proc => (
        <div key={proc} className="flex" style={{ height: CELL_H, borderBottom: '1px solid var(--border)' }}>
          <div className="sticky left-0 z-10 flex items-center px-2 text-xs"
            style={{ width: LABEL_W, minWidth: LABEL_W, background: 'var(--bg-primary)', borderRight: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
            {proc}
          </div>
          {weeks.map(w => (
            <div key={w} className="flex items-center justify-center"
              style={{ width: CELL_W, minWidth: CELL_W, borderRight: '1px solid var(--border)' }}>
              <input type="number" min={0} max={20}
                value={demand[proc]?.[w] ?? 2}
                onChange={e => updateDemand(proc, w, Math.max(0, parseInt(e.target.value) || 0))}
                className="w-8 text-center text-xs py-0.5"
                style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 'var(--border-radius)', color: 'var(--text-primary)' }} />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  DAY VIEW                                                                 */
/* ═══════════════════════════════════════════════════════════════════════════ */

function DayView({ week, operators, vacationBlocks, demand, shiftMode, holidayMap, onBack, onWeekChange }) {
  const holidays = holidayMap[week]?.holidays || [];

  const getStatus = (op) => {
    const block = vacationBlocks.find(b => b.operatorId === op.id && week >= b.startWeek && week <= b.endWeek);
    if (!block) return { status: 'working', label: 'Working' };
    return { status: block.status, label: block.status === 'requested' ? 'Requested' : block.status.charAt(0).toUpperCase() + block.status.slice(1) };
  };

  const statusBg = {
    working: 'var(--coverage-green)',
    draft: 'var(--draft-bg)',
    pending: 'var(--pending-bg)',
    approved: 'var(--approved-bg)',
    requested: 'var(--requested-bg)',
  };

  return (
    <div className="flex-1 overflow-auto p-4">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={onBack} className="px-3 py-1.5 text-sm font-medium"
          style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--border-radius)', color: 'var(--text-primary)' }}>
          ← Vecka
        </button>
        <button onClick={() => onWeekChange(Math.max(1, week - 1))} className="px-2 py-1 text-sm"
          style={{ color: 'var(--text-primary)' }}>◀</button>
        <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
          Vecka {week}
        </h2>
        <button onClick={() => onWeekChange(Math.min(52, week + 1))} className="px-2 py-1 text-sm"
          style={{ color: 'var(--text-primary)' }}>▶</button>
      </div>

      {/* Holiday banner */}
      {holidays.length > 0 && (
        <div className="mb-4 p-3 rounded" style={{ background: 'var(--holiday-bg)', border: '1px solid var(--holiday-border)', borderRadius: 'var(--border-radius)' }}>
          <div className="text-sm font-medium" style={{ color: 'var(--holiday-text)' }}>
            Helgdag: {holidays.map(h => h.name).join(', ')}
          </div>
        </div>
      )}

      {/* Operator status table */}
      <div className="mb-6" style={{ border: '1px solid var(--border)', borderRadius: 'var(--border-radius)', overflow: 'hidden' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: 'var(--bg-secondary)' }}>
              <th className="text-left px-3 py-2" style={{ color: 'var(--text-secondary)' }}>Operator</th>
              <th className="text-left px-3 py-2" style={{ color: 'var(--text-secondary)' }}>Shift</th>
              <th className="text-left px-3 py-2" style={{ color: 'var(--text-secondary)' }}>Status</th>
              <th className="text-left px-3 py-2" style={{ color: 'var(--text-secondary)' }}>Certifications</th>
            </tr>
          </thead>
          <tbody>
            {operators.filter(o => o.active).map(op => {
              const { status, label } = getStatus(op);
              return (
                <tr key={op.id} style={{ borderTop: '1px solid var(--border)', opacity: status === 'approved' ? 0.5 : 1 }}>
                  <td className="px-3 py-2 font-medium" style={{ color: 'var(--text-primary)' }}>{op.name}</td>
                  <td className="px-3 py-2">
                    <span className="text-xs px-1.5 py-0.5 rounded font-mono"
                      style={{ background: op.shift === 'S1' ? 'var(--accent)' : 'var(--accent-secondary)', color: '#fff', borderRadius: 'var(--border-radius)' }}>
                      {op.shift}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <span className="text-xs px-2 py-0.5 rounded font-medium" style={{ background: statusBg[status], borderRadius: 'var(--border-radius)' }}>
                      {label}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {op.certifications.join(', ') || '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Coverage summary */}
      <h3 className="text-sm font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Coverage Summary</h3>
      <div className="grid grid-cols-2 gap-2" style={{ maxWidth: 500 }}>
        {PROCESSES.map(proc => {
          const cov = getCoverage(operators, vacationBlocks, demand, proc, week, shiftMode, null, holidayMap);
          const colorMap = { green: 'var(--coverage-green)', yellow: 'var(--coverage-yellow)', red: 'var(--coverage-red)' };
          return (
            <div key={proc} className="p-2 rounded" style={{ border: '1px solid var(--border)', borderRadius: 'var(--border-radius)' }}>
              <div className="text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>{proc}</div>
              <div className="text-lg font-bold" style={{ color: colorMap[cov.level] }}>{cov.covered}/{cov.required}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
