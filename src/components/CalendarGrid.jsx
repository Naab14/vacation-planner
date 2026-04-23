import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { PROCESSES, defaultLeaveTypes } from '../data';
import { getCoverage } from '../coverage';
import {
  getISOWeek, isoWeekDates, getISOWeekMonday, getISOWeekFriday,
  blockCoversWeek, getWorkdaysInWeek, datesOverlap, blockCoversDate, formatDateLabel,
} from '../dateUtils';

const CELL_W = 68;
const CELL_H = 32;
const DAY_W = 100;
const LABEL_W = 130;

const WORKFLOW_STYLES = {
  draft:    { borderStyle: 'dotted', opacity: 0.55 },
  ansökt:   { borderStyle: 'dashed', opacity: 0.75 },
  beviljad: { borderStyle: 'solid',  opacity: 1.0 },
};
const WORKFLOW_LABELS = { draft: 'Utkast', ansökt: 'Ansökt', beviljad: 'Beviljad' };
const WORKFLOWS = ['draft', 'ansökt', 'beviljad'];

const SWEDISH_DAYS = ['Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör', 'Sön'];

function fmtDate(dt) {
  const y = dt.getUTCFullYear();
  const m = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const d = String(dt.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parseDateUTC(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

/* ── Legend ────────────────────────────────────────────────────────────────── */
function Legend({ leaveTypes }) {
  const types = leaveTypes || defaultLeaveTypes;
  return (
    <div className="flex items-center gap-3 px-2 py-1 text-xs flex-wrap" style={{ color: 'var(--text-secondary)' }}>
      {types.map(lt => (
        <div key={lt.id} className="flex items-center gap-1">
          <span className="w-4 h-3 rounded-sm inline-block" style={{ background: lt.color, border: `1px solid ${lt.color}` }} />
          {lt.label}
        </div>
      ))}
      <span className="mx-1" style={{ color: 'var(--border)' }}>|</span>
      {WORKFLOWS.map(w => (
        <div key={w} className="flex items-center gap-1">
          <span className="w-4 h-3 rounded-sm inline-block"
            style={{ background: 'var(--bg-secondary)', border: `2px ${WORKFLOW_STYLES[w].borderStyle} var(--text-secondary)`, opacity: WORKFLOW_STYLES[w].opacity }} />
          {WORKFLOW_LABELS[w]}
        </div>
      ))}
      <span className="mx-1" style={{ color: 'var(--border)' }}>|</span>
      <div className="flex items-center gap-1">
        <span className="w-4 h-3 rounded-sm inline-block" style={{ background: 'var(--holiday-bg)', border: '1px solid var(--holiday-border)' }} />
        Helgdag
      </div>
    </div>
  );
}

/* ── Coverage Tooltip ─────────────────────────────────────────────────────── */
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

/* ── Coverage Rows ────────────────────────────────────────────────────────── */
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
                tabIndex={0} role="button"
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

/* ── Demand Editor ────────────────────────────────────────────────────────── */
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

/* ── Block Popover ────────────────────────────────────────────────────────── */
function BlockPopover({ x, y, block, leaveTypes, onUpdate, onDelete, onClose }) {
  const ref = useRef(null);
  const [comment, setComment] = useState(block?.comment || '');
  const [blockId, setBlockId] = useState(block?.id);
  const types = leaveTypes || defaultLeaveTypes;

  if (block && block.id !== blockId) {
    setBlockId(block.id);
    setComment(block.comment || '');
  }

  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    const keyHandler = e => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('mousedown', handler);
    document.addEventListener('keydown', keyHandler);
    return () => { document.removeEventListener('mousedown', handler); document.removeEventListener('keydown', keyHandler); };
  }, [onClose]);

  if (!block) return null;

  const saveComment = () => {
    if (comment !== (block.comment || '')) {
      onUpdate(block.id, { comment });
    }
  };

  return (
    <div ref={ref} className="block-popover" style={{ left: x, top: y }}>
      <div className="px-3 py-1 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>
        {formatDateLabel(block.startDate)} – {formatDateLabel(block.endDate)}
      </div>

      <div className="px-3 py-1 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>Typ</div>
      <div className="flex gap-1 px-3 pb-1 flex-wrap">
        {types.map(lt => (
          <button key={lt.id} onClick={() => { onUpdate(block.id, { type: lt.id }); }}
            className="px-2 py-1 text-xs rounded flex items-center gap-1"
            style={{
              background: block.type === lt.id ? lt.color : 'var(--bg-primary)',
              color: block.type === lt.id ? '#fff' : 'var(--text-primary)',
              border: `1px solid ${lt.color}`,
            }}>
            {lt.label}
          </button>
        ))}
      </div>

      <div className="px-3 py-1 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>Status</div>
      {WORKFLOWS.map(s => (
        <button key={s} onClick={() => { onUpdate(block.id, { status: s }); }}
          className="w-full text-left px-3 py-1.5 text-sm hover:opacity-80 flex items-center gap-2"
          style={{ background: block.status === s ? 'var(--bg-secondary)' : 'transparent', color: 'var(--text-primary)' }}>
          <span className="w-3 h-3 rounded-sm inline-block"
            style={{ background: 'var(--bg-secondary)', border: `2px ${WORKFLOW_STYLES[s].borderStyle} var(--text-secondary)`, opacity: WORKFLOW_STYLES[s].opacity }} />
          {WORKFLOW_LABELS[s]}
        </button>
      ))}

      <div className="px-3 py-1 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>Kommentar</div>
      <div className="px-3 pb-2">
        <textarea value={comment} onChange={e => setComment(e.target.value)} onBlur={saveComment}
          rows={2} className="w-full text-xs p-1.5 rounded"
          style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', color: 'var(--text-primary)', resize: 'vertical' }}
          placeholder="Lägg till kommentar..." />
      </div>

      <hr style={{ borderColor: 'var(--border)' }} className="my-1" />
      <button onClick={() => { onDelete(block.id); onClose(); }}
        className="w-full text-left px-3 py-1.5 text-sm text-red-600 hover:bg-red-50">Ta bort</button>
    </div>
  );
}

/* ── Holiday abbrev map ───────────────────────────────────────────────────── */
const HOLIDAY_ABBREV = {
  'Annandag påsk': 'Annandag', 'Första maj': 'Första m', 'Första Maj': 'Första m',
  'Kristi himmelsfärdsdag': 'Kristi h', 'Kristi himmelfärdsdag': 'Kristi h',
  'Pingstdagen': 'Pingstda', 'Nationaldagen': 'Sveriges', 'Sveriges nationaldag': 'Sveriges',
  'Midsommarafton': 'Midsom.', 'Midsommardagen': 'Midsom.',
  'Långfredagen': 'Långfre', 'Påskdagen': 'Påskdag',
  'Trettondedag jul': 'Trett.', 'Nyårsdagen': 'Nyår', 'Julafton': 'Julaft',
  'Juldagen': 'Juldag', 'Annandag jul': 'Ann.jul', 'Nyårsafton': 'Nyårsaf',
  'Alla helgons dag': 'Alla h', 'Alla Helgons dag': 'Alla h',
};

function getLeaveColor(block, leaveTypes) {
  const types = leaveTypes || defaultLeaveTypes;
  const lt = types.find(t => t.id === block.type);
  return lt?.color || '#94a3b8';
}

/* ══════════════════════════════════════════════════════════════════════════ */
/*  MAIN COMPONENT                                                          */
/* ══════════════════════════════════════════════════════════════════════════ */

export default function CalendarGrid({
  operators, vacationBlocks, demand, settings, weeks, holidayMap,
  leaveTypes, onAddBlock, onUpdateBlock, onDeleteBlock,
  setStartWeek, showDemand, onToggleDemand, updateDemand,
  zoom, onZoomChange,
}) {
  const { shiftMode, startWeek, visibleWeeks } = settings;
  const scrollRef = useRef(null);
  const [showTools, setShowTools] = useState(false);
  const [popover, setPopover] = useState(null);
  const [drag, setDrag] = useState(null);
  const longPressTimer = useRef(null);
  const pointerMoved = useRef(false);
  const [showDayCoverage, setShowDayCoverage] = useState(false);
  const year = new Date().getFullYear();

  const isOverlappingDates = useCallback((opId, startDate, endDate, ignoreId = null) => {
    return vacationBlocks.some(b =>
      b.operatorId === opId &&
      b.id !== ignoreId &&
      datesOverlap(startDate, endDate, b.startDate, b.endDate)
    );
  }, [vacationBlocks]);

  /* ── Day-level drag state ──────────────────────────────────────────────── */
  const commitDayDrag = useCallback(() => {
    if (!drag) return;
    if (drag.type === 'drawing') {
      const sd = drag.startDate <= drag.endDate ? drag.startDate : drag.endDate;
      const ed = drag.startDate <= drag.endDate ? drag.endDate : drag.startDate;
      if (!isOverlappingDates(drag.opId, sd, ed)) {
        onAddBlock(drag.opId, sd, ed);
      }
    }
  }, [drag, isOverlappingDates, onAddBlock]);

  useEffect(() => {
    if (!drag) return;
    const onMove = (e) => {
      pointerMoved.current = true;
      if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; }

      const el = document.elementFromPoint(e.clientX, e.clientY);

      if (drag.mode === 'day') {
        const cell = el?.closest('[data-date][data-op]');
        if (!cell) return;
        const dateStr = cell.dataset.date;
        const opId = cell.dataset.op;

        if (drag.type === 'drawing' && opId === drag.opId) {
          const sd = drag.startDate <= dateStr ? drag.startDate : dateStr;
          const ed = drag.startDate <= dateStr ? dateStr : drag.startDate;
          if (!isOverlappingDates(drag.opId, sd, ed)) {
            setDrag(d => ({ ...d, endDate: dateStr }));
          }
        } else if (drag.type === 'moving') {
          const origStart = parseDateUTC(drag.origStartDate);
          const origEnd = parseDateUTC(drag.origEndDate);
          const dur = (origEnd - origStart) / 86400000;
          const pointerDate = parseDateUTC(dateStr);
          const offsetDate = parseDateUTC(drag.anchorDate);
          const delta = (pointerDate - offsetDate) / 86400000;
          const newStartD = new Date(origStart.getTime() + delta * 86400000);
          const newEndD = new Date(newStartD.getTime() + dur * 86400000);
          const ns = fmtDate(newStartD);
          const ne = fmtDate(newEndD);
          if (!isOverlappingDates(opId, ns, ne, drag.blockId)) {
            onUpdateBlock(drag.blockId, { operatorId: opId, startDate: ns, endDate: ne });
            setDrag(d => ({ ...d, anchorDate: dateStr, currentOpId: opId }));
          }
        } else if (drag.type === 'resizing') {
          const block = vacationBlocks.find(b => b.id === drag.blockId);
          if (!block) return;
          if (drag.edge === 'left') {
            const ns = dateStr <= block.endDate ? dateStr : block.endDate;
            if (!isOverlappingDates(block.operatorId, ns, block.endDate, block.id)) {
              onUpdateBlock(drag.blockId, { startDate: ns });
            }
          } else {
            const ne = dateStr >= block.startDate ? dateStr : block.startDate;
            if (!isOverlappingDates(block.operatorId, block.startDate, ne, block.id)) {
              onUpdateBlock(drag.blockId, { endDate: ne });
            }
          }
        }
      } else {
        const cell = el?.closest('[data-week][data-op]');
        if (!cell) return;
        const week = +cell.dataset.week;
        const opId = cell.dataset.op;

        if (drag.type === 'drawing' && opId === drag.opId) {
          const sw = Math.min(drag.startWeekNum, week);
          const ew = Math.max(drag.startWeekNum, week);
          const sd = getISOWeekMonday(year, sw);
          const ed = getISOWeekFriday(year, ew);
          if (!isOverlappingDates(drag.opId, sd, ed)) {
            setDrag(d => ({ ...d, endWeekNum: week }));
          }
        } else if (drag.type === 'moving') {
          const delta = week - drag.anchorWeek;
          const newSW = drag.origStartWeek + delta;
          const newEW = drag.origEndWeek + delta;
          if (newSW >= 1 && newEW <= 52) {
            const ns = getISOWeekMonday(year, newSW);
            const ne = getISOWeekFriday(year, newEW);
            if (!isOverlappingDates(opId, ns, ne, drag.blockId)) {
              onUpdateBlock(drag.blockId, { operatorId: opId, startDate: ns, endDate: ne });
              setDrag(d => ({ ...d, anchorWeek: week, currentOpId: opId }));
            }
          }
        } else if (drag.type === 'resizing') {
          const block = vacationBlocks.find(b => b.id === drag.blockId);
          if (!block) return;
          if (drag.edge === 'left') {
            const ns = getISOWeekMonday(year, week);
            if (ns <= block.endDate && !isOverlappingDates(block.operatorId, ns, block.endDate, block.id)) {
              onUpdateBlock(drag.blockId, { startDate: ns });
            }
          } else {
            const ne = getISOWeekFriday(year, week);
            if (ne >= block.startDate && !isOverlappingDates(block.operatorId, block.startDate, ne, block.id)) {
              onUpdateBlock(drag.blockId, { endDate: ne });
            }
          }
        }
      }
    };

    const onUp = () => {
      if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; }
      commitDayDrag();
      setDrag(null);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [drag, isOverlappingDates, onUpdateBlock, vacationBlocks, commitDayDrag, year, onAddBlock]);

  /* ── Week-level pointer handlers ───────────────────────────────────────── */
  const handleWeekCellPointerDown = (e, opId, week) => {
    if (e.button !== 0) return;
    e.preventDefault();
    pointerMoved.current = false;

    const block = vacationBlocks.find(b => b.operatorId === opId && blockCoversWeek(b, week, year));
    if (block) {
      const bStartW = getWeekNum(block.startDate);
      const bEndW = getWeekNum(block.endDate);
      setDrag({ mode: 'week', type: 'moving', blockId: block.id, opId, origStartWeek: bStartW, origEndWeek: bEndW, anchorWeek: week, currentOpId: opId });
      longPressTimer.current = setTimeout(() => {
        if (!pointerMoved.current) {
          setDrag(null);
          setPopover({ x: e.clientX, y: e.clientY, block });
        }
        longPressTimer.current = null;
      }, 500);
    } else {
      const sd = getISOWeekMonday(year, week);
      const ed = getISOWeekFriday(year, week);
      if (!isOverlappingDates(opId, sd, ed)) {
        setDrag({ mode: 'week', type: 'drawing', opId, startWeekNum: week, endWeekNum: week });
      }
    }
  };

  const handleWeekCellPointerUp = (e) => {
    if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; }
    if (drag && drag.mode === 'week' && drag.type === 'moving' && !pointerMoved.current) {
      setDrag(null);
      const block = vacationBlocks.find(b => b.id === drag.blockId);
      if (block) setPopover({ x: e.clientX, y: e.clientY, block });
      return;
    }
    if (drag && drag.mode === 'week' && drag.type === 'drawing' && !pointerMoved.current) {
      const sw = Math.min(drag.startWeekNum, drag.endWeekNum);
      const ew = Math.max(drag.startWeekNum, drag.endWeekNum);
      onAddBlock(drag.opId, getISOWeekMonday(year, sw), getISOWeekFriday(year, ew));
      setDrag(null);
    }
  };

  const handleWeekResizeDown = (e, blockId, edge) => {
    e.stopPropagation(); e.preventDefault();
    pointerMoved.current = false;
    setDrag({ mode: 'week', type: 'resizing', blockId, edge });
  };

  /* ── Day-level pointer handlers ────────────────────────────────────────── */
  const handleDayCellPointerDown = (e, opId, dateStr) => {
    if (e.button !== 0) return;
    e.preventDefault();
    pointerMoved.current = false;

    const block = vacationBlocks.find(b => b.operatorId === opId && blockCoversDate(b, dateStr));
    if (block) {
      setDrag({ mode: 'day', type: 'moving', blockId: block.id, opId, origStartDate: block.startDate, origEndDate: block.endDate, anchorDate: dateStr, currentOpId: opId });
      longPressTimer.current = setTimeout(() => {
        if (!pointerMoved.current) {
          setDrag(null);
          setPopover({ x: e.clientX, y: e.clientY, block });
        }
        longPressTimer.current = null;
      }, 500);
    } else {
      if (!isOverlappingDates(opId, dateStr, dateStr)) {
        setDrag({ mode: 'day', type: 'drawing', opId, startDate: dateStr, endDate: dateStr });
      }
    }
  };

  const handleDayCellPointerUp = (e) => {
    if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; }
    if (drag && drag.mode === 'day' && drag.type === 'moving' && !pointerMoved.current) {
      setDrag(null);
      const block = vacationBlocks.find(b => b.id === drag.blockId);
      if (block) setPopover({ x: e.clientX, y: e.clientY, block });
      return;
    }
    if (drag && drag.mode === 'day' && drag.type === 'drawing' && !pointerMoved.current) {
      onAddBlock(drag.opId, drag.startDate, drag.startDate);
      setDrag(null);
    }
  };

  const handleDayResizeDown = (e, blockId, edge) => {
    e.stopPropagation(); e.preventDefault();
    pointerMoved.current = false;
    setDrag({ mode: 'day', type: 'resizing', blockId, edge });
  };

  const handleDoubleClick = (e, block) => {
    if (block) {
      setPopover({ x: e.clientX, y: e.clientY, block, focusComment: true });
    }
  };

  const groups = shiftMode === 'separate'
    ? [{ label: 'S1', ops: operators.filter(o => o.shift === 'S1'), shift: 'S1' },
       { label: 'S2', ops: operators.filter(o => o.shift === 'S2'), shift: 'S2' }]
    : [{ label: shiftMode === 'summer' ? 'Summer Schedule' : 'All Operators', ops: operators, shift: null }];

  const sliderMax = 52 - visibleWeeks + 1;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* ── Toolbar ──────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-3 py-2 flex-wrap" style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
        <input type="range" className="time-slider" style={{ width: 180 }}
          value={startWeek} min={1} max={sliderMax}
          onChange={e => setStartWeek(+e.target.value)} />
        <span className="text-sm font-medium whitespace-nowrap" style={{ color: 'var(--text-primary)' }}>
          {zoom === 'day' ? `v.${weeks[0]}` : `v.${weeks[0]} — v.${weeks[weeks.length - 1]}`}
        </span>
        <div className="flex items-center gap-1 ml-2">
          <button onClick={() => onZoomChange('day')}
            className="px-2 py-1 text-sm font-bold rounded"
            style={{ background: zoom === 'day' ? 'var(--accent)' : 'var(--bg-primary)', color: zoom === 'day' ? '#fff' : 'var(--text-primary)', border: '1px solid var(--border)' }}>
            −
          </button>
          <button onClick={() => onZoomChange('week')}
            className="px-2 py-1 text-sm font-bold rounded"
            style={{ background: zoom === 'week' ? 'var(--accent)' : 'var(--bg-primary)', color: zoom === 'week' ? '#fff' : 'var(--text-primary)', border: '1px solid var(--border)' }}>
            +
          </button>
        </div>
        <button onClick={() => setShowTools(t => !t)}
          className="px-2 py-1 text-sm rounded ml-auto"
          style={{ background: showTools ? 'var(--accent)' : 'var(--bg-primary)', color: showTools ? '#fff' : 'var(--text-primary)', border: '1px solid var(--border)' }}>
          ⚙
        </button>
      </div>

      {/* ── Secondary tools row ──────────────────────────────────────────── */}
      {showTools && (
        <div className="flex items-center gap-3 px-3 py-1.5 flex-wrap" style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
          <Legend leaveTypes={leaveTypes} />
          <button onClick={onToggleDemand} className="px-2 py-1 text-xs ml-auto"
            style={{ background: showDemand ? 'var(--accent)' : 'var(--bg-primary)', color: showDemand ? '#fff' : 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 'var(--border-radius)' }}>
            Demand
          </button>
        </div>
      )}

      {/* ── Grid ─────────────────────────────────────────────────────────── */}
      {zoom === 'week' ? (
        <WeekZoomGrid
          ref={scrollRef}
          operators={operators} vacationBlocks={vacationBlocks} demand={demand}
          settings={settings} weeks={weeks} holidayMap={holidayMap} leaveTypes={leaveTypes}
          groups={groups} drag={drag} showDemand={showDemand} updateDemand={updateDemand}
          year={year}
          onCellPointerDown={handleWeekCellPointerDown}
          onCellPointerUp={handleWeekCellPointerUp}
          onResizePointerDown={handleWeekResizeDown}
          onZoomChange={onZoomChange} setStartWeek={setStartWeek}
        />
      ) : (
        <DayZoomGrid
          operators={operators} vacationBlocks={vacationBlocks} demand={demand}
          settings={settings} weeks={weeks} holidayMap={holidayMap} leaveTypes={leaveTypes}
          groups={groups} drag={drag}
          showDayCoverage={showDayCoverage} onToggleDayCoverage={() => setShowDayCoverage(c => !c)}
          year={year}
          onCellPointerDown={handleDayCellPointerDown}
          onCellPointerUp={handleDayCellPointerUp}
          onResizePointerDown={handleDayResizeDown}
          onDoubleClick={handleDoubleClick}
        />
      )}

      {/* ── Popover ──────────────────────────────────────────────────────── */}
      {popover && (
        <BlockPopover x={popover.x} y={popover.y} block={popover.block}
          leaveTypes={leaveTypes} onUpdate={onUpdateBlock} onDelete={onDeleteBlock}
          onClose={() => setPopover(null)} />
      )}
    </div>
  );
}

/* ── Helper ──────────────────────────────────────────────────────────────── */
function getWeekNum(dateStr) {
  return getISOWeek(dateStr);
}

/* ══════════════════════════════════════════════════════════════════════════ */
/*  WEEK ZOOM                                                               */
/* ══════════════════════════════════════════════════════════════════════════ */

const WeekZoomGrid = ({ operators, vacationBlocks, demand, settings, weeks, holidayMap, leaveTypes, groups, drag, showDemand, updateDemand, year, onCellPointerDown, onCellPointerUp, onResizePointerDown, onZoomChange, setStartWeek }, ref) => {
  return (
    <div ref={ref} className={`flex-1 overflow-auto select-none ${drag ? 'grid-dragging' : ''}`}>
      <div style={{ minWidth: LABEL_W + weeks.length * CELL_W }}>
        {/* Header */}
        <div className="flex sticky top-0 z-20" style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
          <div className="sticky left-0 z-10 flex items-center px-2 text-xs font-semibold"
            style={{ width: LABEL_W, minWidth: LABEL_W, background: 'var(--bg-secondary)', color: 'var(--text-secondary)', borderRight: '1px solid var(--border)' }}>
            Operator
          </div>
          {weeks.map(w => {
            const isHoliday = holidayMap[w]?.holidays?.length > 0;
            const holidayAbbrevs = isHoliday ? holidayMap[w].holidays.map(h => HOLIDAY_ABBREV[h.name] || h.name.slice(0, 7)) : [];
            return (
              <div key={w} className="flex flex-col items-center justify-center text-xs font-medium cursor-pointer"
                style={{ width: CELL_W, minWidth: CELL_W, height: isHoliday ? CELL_H + 12 : CELL_H, color: isHoliday ? 'var(--holiday-text)' : 'var(--text-secondary)', background: isHoliday ? 'var(--holiday-bg)' : 'transparent', borderRight: '1px solid var(--border)', lineHeight: 1.1 }}
                title={isHoliday ? holidayMap[w].holidays.map(h => h.name).join(', ') : `Click to zoom to v.${w}`}
                onClick={() => { setStartWeek(w); onZoomChange('day'); }}>
                <span>v.{w}</span>
                {isHoliday && <span className="text-[9px] italic opacity-80 truncate w-full text-center" style={{ color: 'var(--holiday-text)' }}>{holidayAbbrevs[0]}</span>}
              </div>
            );
          })}
        </div>

        {/* Row groups */}
        {groups.map(group => (
          <div key={group.label}>
            {groups.length > 1 && (
              <div className="flex items-center text-xs font-semibold uppercase tracking-wider px-2"
                style={{ height: 24, background: 'var(--bg-secondary)', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)' }}>
                {group.label}
              </div>
            )}

            {group.ops.map(op => (
              <div key={op.id} className="flex relative" style={{ height: CELL_H, borderBottom: '1px solid var(--border)', opacity: op.active ? 1 : 0.4 }}>
                <div className="sticky left-0 z-10 flex items-center px-2 text-xs truncate"
                  style={{ width: LABEL_W, minWidth: LABEL_W, background: 'var(--bg-primary)', borderRight: '1px solid var(--border)', color: 'var(--text-primary)' }}>
                  {op.name}
                </div>
                {weeks.map(w => {
                  const block = vacationBlocks.find(b => b.operatorId === op.id && blockCoversWeek(b, w, year));
                  const isDrawing = drag?.mode === 'week' && drag?.type === 'drawing' && drag.opId === op.id &&
                    w >= Math.min(drag.startWeekNum, drag.endWeekNum) && w <= Math.max(drag.startWeekNum, drag.endWeekNum);
                  const isHoliday = holidayMap[w]?.holidays?.length > 0;
                  const isDrag = drag && (drag.type === 'moving' && drag.blockId === block?.id || drag.type === 'resizing' && drag.blockId === block?.id);

                  let cellStyle = {};
                  let partialLabel = null;

                  if (block) {
                    const color = getLeaveColor(block, leaveTypes);
                    const wf = WORKFLOW_STYLES[block.status] || WORKFLOW_STYLES.draft;
                    const workdays = getWorkdaysInWeek(block.startDate, block.endDate, w, year);
                    const isPartial = workdays < 5;
                    const isFirstWeek = blockCoversWeek(block, w, year) && !blockCoversWeek(block, w - 1, year);
                    const isLastWeek = blockCoversWeek(block, w, year) && !blockCoversWeek(block, w + 1, year);

                    cellStyle = {
                      background: isPartial
                        ? `linear-gradient(to right, ${color} ${workdays / 5 * 100}%, transparent ${workdays / 5 * 100}%)`
                        : color,
                      borderTop: `2px ${wf.borderStyle} ${color}`,
                      borderBottom: `2px ${wf.borderStyle} ${color}`,
                      opacity: wf.opacity,
                      zIndex: block.status === 'beviljad' ? 3 : 2,
                    };
                    if (isFirstWeek) { cellStyle.borderLeft = `2px ${wf.borderStyle} ${color}`; cellStyle.borderTopLeftRadius = '6px'; cellStyle.borderBottomLeftRadius = '6px'; }
                    if (isLastWeek) { cellStyle.borderRight = `2px ${wf.borderStyle} ${color}`; cellStyle.borderTopRightRadius = '6px'; cellStyle.borderBottomRightRadius = '6px'; }
                    cellStyle.boxShadow = isDrag ? '0 10px 15px -3px rgba(0,0,0,0.1)' : '0 2px 4px -1px rgba(0,0,0,0.06)';
                    if (isDrag) { cellStyle.transform = 'scale(1.02)'; cellStyle.outline = '2px solid var(--accent)'; }
                    if (isPartial) partialLabel = `${workdays}/5`;
                  } else if (isDrawing) {
                    cellStyle = { background: 'var(--draft-bg)', opacity: 0.5 };
                  } else if (isHoliday) {
                    cellStyle = { background: 'var(--holiday-bg)' };
                  }

                  const isFirstWeekOfBlock = block && blockCoversWeek(block, w, year) && !blockCoversWeek(block, w - 1, year);
                  const isLastWeekOfBlock = block && blockCoversWeek(block, w, year) && !blockCoversWeek(block, w + 1, year);

                  return (
                    <div key={w}
                      data-week={w} data-op={op.id}
                      className={`flex items-center justify-center text-xs relative ${isDrag ? 'block-dragging' : ''}`}
                      style={{ width: CELL_W, minWidth: CELL_W, height: CELL_H, borderRight: '1px solid var(--border)', cursor: block ? 'grab' : 'crosshair', touchAction: 'none', ...cellStyle }}
                      onPointerDown={e => onCellPointerDown(e, op.id, w)}
                      onPointerUp={e => onCellPointerUp(e, op.id, w)}>
                      {block && isFirstWeekOfBlock && (
                        <div className="resize-handle" style={{ left: 0, cursor: 'w-resize' }}
                          onPointerDown={e => onResizePointerDown(e, block.id, 'left')} />
                      )}
                      {block && isLastWeekOfBlock && (
                        <div className="resize-handle" style={{ right: 0, cursor: 'e-resize' }}
                          onPointerDown={e => onResizePointerDown(e, block.id, 'right')} />
                      )}
                      {block && isFirstWeekOfBlock && (
                        <span className="absolute inset-[2px] flex items-center justify-center text-xs font-medium truncate pointer-events-none select-none"
                          style={{ color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>
                          {formatDateLabel(block.startDate)}–{formatDateLabel(block.endDate)}
                        </span>
                      )}
                      {partialLabel && !isFirstWeekOfBlock && (
                        <span className="text-[9px] font-medium pointer-events-none select-none"
                          style={{ color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>
                          {partialLabel}
                        </span>
                      )}
                      {block && block.comment && isLastWeekOfBlock && (
                        <span className="comment-indicator" />
                      )}
                    </div>
                  );
                })}
              </div>
            ))}

            <CoverageRows operators={operators} vacationBlocks={vacationBlocks} demand={demand}
              weeks={weeks} shiftMode={settings.shiftMode} shiftFilter={group.shift} holidayMap={holidayMap} label={`COVERAGE (${group.label})`} />
          </div>
        ))}

        {showDemand && <DemandEditor demand={demand} weeks={weeks} updateDemand={updateDemand} />}
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════════════ */
/*  DAY ZOOM                                                                */
/* ══════════════════════════════════════════════════════════════════════════ */

function DayZoomGrid({ operators, vacationBlocks, demand, settings, weeks, holidayMap, leaveTypes, groups, drag, showDayCoverage, onToggleDayCoverage, year, onCellPointerDown, onCellPointerUp, onResizePointerDown, onDoubleClick }) {
  const focusWeek = weeks[0];
  const dates = useMemo(() => isoWeekDates(year, focusWeek), [year, focusWeek]);

  const holidaysByDate = useMemo(() => {
    const map = {};
    if (holidayMap) {
      Object.values(holidayMap).forEach(wk => {
        wk.holidays.forEach(h => { map[h.dateStr] = h; });
      });
    }
    return map;
  }, [holidayMap]);

  return (
    <div className="flex-1 overflow-auto select-none">
      <div style={{ minWidth: LABEL_W + 7 * DAY_W }}>
        {/* Header */}
        <div className="flex sticky top-0 z-20" style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
          <div className="sticky left-0 z-10 flex items-center px-2 text-xs font-semibold"
            style={{ width: LABEL_W, minWidth: LABEL_W, background: 'var(--bg-secondary)', color: 'var(--text-secondary)', borderRight: '1px solid var(--border)' }}>
            Operator
          </div>
          {dates.map((dateStr, i) => {
            const isHoliday = !!holidaysByDate[dateStr];
            const isWeekend = i >= 5;
            const dt = parseDateUTC(dateStr);
            return (
              <div key={i} className="flex flex-col items-center justify-center text-xs font-medium"
                style={{ width: DAY_W, minWidth: DAY_W, height: CELL_H + 4, borderRight: '1px solid var(--border)',
                  color: isHoliday ? 'var(--holiday-text)' : isWeekend ? 'var(--text-secondary)' : 'var(--text-primary)',
                  background: isHoliday ? 'var(--holiday-bg)' : 'transparent' }}>
                <span>{SWEDISH_DAYS[i]} {dt.getUTCDate()}/{dt.getUTCMonth() + 1}</span>
                {isHoliday && <span className="text-[9px] italic opacity-80">{holidaysByDate[dateStr].name}</span>}
              </div>
            );
          })}
        </div>

        {/* Row groups */}
        {groups.map(group => (
          <div key={group.label}>
            {groups.length > 1 && (
              <div className="flex items-center text-xs font-semibold uppercase tracking-wider px-2"
                style={{ height: 24, background: 'var(--bg-secondary)', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)' }}>
                {group.label}
              </div>
            )}

            {group.ops.map(op => (
              <div key={op.id} className="flex relative" style={{ height: CELL_H, borderBottom: '1px solid var(--border)', opacity: op.active ? 1 : 0.4 }}>
                <div className="sticky left-0 z-10 flex items-center px-2 text-xs truncate"
                  style={{ width: LABEL_W, minWidth: LABEL_W, background: 'var(--bg-primary)', borderRight: '1px solid var(--border)', color: 'var(--text-primary)' }}>
                  {op.name}
                </div>
                {dates.map((dateStr, i) => {
                  const isHoliday = !!holidaysByDate[dateStr];
                  const isWeekend = i >= 5;
                  const block = vacationBlocks.find(b => b.operatorId === op.id && blockCoversDate(b, dateStr));
                  const isDrawing = drag?.mode === 'day' && drag?.type === 'drawing' && drag.opId === op.id &&
                    dateStr >= (drag.startDate <= drag.endDate ? drag.startDate : drag.endDate) &&
                    dateStr <= (drag.startDate <= drag.endDate ? drag.endDate : drag.startDate);
                  const isDrag = drag && (drag.type === 'moving' && drag.blockId === block?.id || drag.type === 'resizing' && drag.blockId === block?.id);

                  let bgClass = isWeekend ? 'day-cell-off' : 'day-cell-working';
                  let cellStyle = {};

                  if (block) {
                    const color = getLeaveColor(block, leaveTypes);
                    const wf = WORKFLOW_STYLES[block.status] || WORKFLOW_STYLES.draft;
                    const isFirst = dateStr === block.startDate;
                    const isLast = dateStr === block.endDate;
                    cellStyle = {
                      background: color,
                      borderTop: `2px ${wf.borderStyle} ${color}`,
                      borderBottom: `2px ${wf.borderStyle} ${color}`,
                      opacity: wf.opacity,
                      cursor: 'grab',
                      touchAction: 'none',
                    };
                    if (isFirst) { cellStyle.borderLeft = `2px ${wf.borderStyle} ${color}`; cellStyle.borderTopLeftRadius = '6px'; cellStyle.borderBottomLeftRadius = '6px'; }
                    if (isLast) { cellStyle.borderRight = `2px ${wf.borderStyle} ${color}`; cellStyle.borderTopRightRadius = '6px'; cellStyle.borderBottomRightRadius = '6px'; }
                    if (isDrag) { cellStyle.transform = 'scale(1.02)'; cellStyle.outline = '2px solid var(--accent)'; cellStyle.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.1)'; }
                    bgClass = '';
                  } else if (isDrawing) {
                    cellStyle = { background: 'var(--draft-bg)', opacity: 0.5 };
                    bgClass = '';
                  } else if (isHoliday) {
                    cellStyle = { background: 'var(--holiday-bg)' };
                    bgClass = '';
                  }

                  const isFirst = block && dateStr === block.startDate;
                  const isLast = block && dateStr === block.endDate;

                  return (
                    <div key={i}
                      data-date={dateStr} data-op={op.id}
                      className={`flex items-center justify-center text-xs relative ${bgClass} ${isDrag ? 'block-dragging' : ''}`}
                      style={{ width: DAY_W, minWidth: DAY_W, height: CELL_H, borderRight: '1px solid var(--border)', cursor: block ? 'grab' : 'crosshair', touchAction: 'none', ...cellStyle }}
                      onPointerDown={e => onCellPointerDown(e, op.id, dateStr)}
                      onPointerUp={e => onCellPointerUp(e)}
                      onDoubleClick={e => block && onDoubleClick(e, block)}>
                      {block && isFirst && (
                        <div className="resize-handle" style={{ left: 0, cursor: 'w-resize' }}
                          onPointerDown={e => onResizePointerDown(e, block.id, 'left')} />
                      )}
                      {block && isLast && (
                        <div className="resize-handle" style={{ right: 0, cursor: 'e-resize' }}
                          onPointerDown={e => onResizePointerDown(e, block.id, 'right')} />
                      )}
                      {block && isFirst && (
                        <span className="text-xs font-medium truncate pointer-events-none select-none"
                          style={{ color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>
                          {formatDateLabel(block.startDate)}–{formatDateLabel(block.endDate)}
                        </span>
                      )}
                      {block && block.comment && isLast && (
                        <span className="comment-indicator" />
                      )}
                    </div>
                  );
                })}
              </div>
            ))}

            {showDayCoverage && (
              <CoverageRows operators={operators} vacationBlocks={vacationBlocks} demand={demand}
                weeks={[focusWeek]} shiftMode={settings.shiftMode} shiftFilter={group.shift}
                holidayMap={holidayMap} label={`COVERAGE (${group.label})`} />
            )}
          </div>
        ))}

        <div className="flex items-center px-3 py-1.5" style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
          <button onClick={onToggleDayCoverage} className="text-xs px-2 py-1"
            style={{ background: showDayCoverage ? 'var(--accent)' : 'var(--bg-primary)', color: showDayCoverage ? '#fff' : 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 'var(--border-radius)' }}>
            {showDayCoverage ? 'Hide Coverage' : 'Show Coverage'}
          </button>
        </div>
      </div>
    </div>
  );
}
