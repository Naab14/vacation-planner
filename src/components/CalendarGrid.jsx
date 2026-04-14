import { useState, useEffect, useRef, useCallback } from 'react';
import { PROCESSES } from '../data';
import { getCoverage } from '../coverage';

const CELL_W = 68;
const CELL_H = 32;
const LABEL_W = 130;

const STATUS_COLORS = {
  draft: { bg: 'var(--draft-bg)', border: 'var(--draft-border)' },
  pending: { bg: 'var(--pending-bg)', border: 'var(--pending-border)' },
  approved: { bg: 'var(--approved-bg)', border: 'var(--approved-border)' },
  requested: { bg: 'var(--requested-bg)', border: 'var(--requested-border)' },
};

const STATUS_LABELS = { draft: 'Utkast', pending: 'Väntande', approved: 'Godkänd', requested: 'Begärd' };
const STATUSES = ['draft', 'pending', 'approved', 'requested'];
const SWEDISH_DAYS = ['Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör', 'Sön'];

function isoWeekDates(year, week) {
  const jan4 = new Date(year, 0, 4);
  const jan4Dow = jan4.getDay() || 7;
  const week1Monday = new Date(jan4);
  week1Monday.setDate(jan4.getDate() - jan4Dow + 1);
  const monday = new Date(week1Monday);
  monday.setDate(week1Monday.getDate() + (week - 1) * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function formatDateStr(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/* ── Legend ────────────────────────────────────────────────────────────────── */
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
function BlockPopover({ x, y, block, onSetStatus, onDelete, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    const keyHandler = e => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('mousedown', handler);
    document.addEventListener('keydown', keyHandler);
    return () => { document.removeEventListener('mousedown', handler); document.removeEventListener('keydown', keyHandler); };
  }, [onClose]);

  if (!block) return null;

  return (
    <div ref={ref} className="block-popover" style={{ left: x, top: y }}>
      <div className="px-3 py-1 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>Status</div>
      {STATUSES.map(s => (
        <button key={s} onClick={() => { onSetStatus(block.id, s); onClose(); }}
          className="w-full text-left px-3 py-1.5 text-sm hover:opacity-80 flex items-center gap-2"
          style={{ background: block.status === s ? 'var(--bg-secondary)' : 'transparent', color: 'var(--text-primary)' }}>
          <span className="w-3 h-3 rounded-sm inline-block"
            style={{ background: STATUS_COLORS[s].bg, border: `1px solid ${STATUS_COLORS[s].border}`,
              ...(s === 'requested' ? { backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px)', borderStyle: 'dashed' } : {})
            }} />
          {STATUS_LABELS[s]}
        </button>
      ))}
      <hr style={{ borderColor: 'var(--border)' }} className="my-1" />
      <button onClick={() => { onDelete(block.id); onClose(); }}
        className="w-full text-left px-3 py-1.5 text-sm text-red-600 hover:bg-red-50">Delete</button>
    </div>
  );
}

/* ── Holiday abbrev map ───────────────────────────────────────────────────── */
const HOLIDAY_ABBREV = {
  'Annandag påsk': 'Annandag', 'Första maj': 'Första m', 'Kristi himmelsfärdsdag': 'Kristi h',
  'Pingstdagen': 'Pingstda', 'Nationaldagen': 'Sveriges', 'Midsommarafton': 'Midsom.',
  'Midsommardagen': 'Midsom.', 'Långfredagen': 'Långfre', 'Påskdagen': 'Påskdag',
  'Trettondedag jul': 'Trett.', 'Nyårsdagen': 'Nyår', 'Julafton': 'Julaft',
  'Juldagen': 'Juldag', 'Annandag jul': 'Ann.jul', 'Nyårsafton': 'Nyårsaf', 'Alla helgons dag': 'Alla h',
};

/* ══════════════════════════════════════════════════════════════════════════ */
/*  MAIN COMPONENT                                                          */
/* ══════════════════════════════════════════════════════════════════════════ */

export default function CalendarGrid({
  operators, vacationBlocks, demand, settings, weeks, holidayMap,
  onAddBlock, onUpdateBlock, onDeleteBlock, onSetBlockStatus,
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

  const isOverlapping = useCallback((opId, start, end, ignoreId = null) => {
    const sw = Math.min(start, end);
    const ew = Math.max(start, end);
    return vacationBlocks.some(b =>
      b.operatorId === opId &&
      b.id !== ignoreId &&
      Math.max(sw, b.startWeek) <= Math.min(ew, b.endWeek)
    );
  }, [vacationBlocks]);

  const commitDrag = useCallback(() => {
    if (!drag) return;
    if (drag.type === 'drawing') {
      const sw = Math.min(drag.startWeek, drag.endWeek);
      const ew = Math.max(drag.startWeek, drag.endWeek);
      if (!isOverlapping(drag.opId, sw, ew)) {
        onAddBlock(drag.opId, sw, ew);
      }
    }
  }, [drag, isOverlapping, onAddBlock]);

  useEffect(() => {
    if (!drag) return;
    const onMove = (e) => {
      pointerMoved.current = true;
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
      const el = document.elementFromPoint(e.clientX, e.clientY);
      const cell = el?.closest('[data-week][data-op]');
      if (!cell) return;
      const week = +cell.dataset.week;
      const opId = cell.dataset.op;

      if (drag.type === 'drawing' && opId === drag.opId) {
        if (!isOverlapping(drag.opId, drag.startWeek, week)) {
          setDrag(d => ({ ...d, endWeek: week }));
        }
      } else if (drag.type === 'moving') {
        const delta = week - (drag.pointerOffsetWeek + drag.origStart);
        const newStart = drag.origStart + delta;
        const newEnd = drag.origEnd + delta;
        if (!isOverlapping(opId, newStart, newEnd, drag.blockId)) {
          onUpdateBlock(drag.blockId, { operatorId: opId, startWeek: newStart, endWeek: newEnd });
          setDrag(d => ({ ...d, currentWeek: week, currentOpId: opId }));
        }
      } else if (drag.type === 'resizing') {
        const block = vacationBlocks.find(b => b.id === drag.blockId);
        if (!block) return;
        if (drag.edge === 'left') {
          const newStart = Math.min(week, block.endWeek);
          if (!isOverlapping(block.operatorId, newStart, block.endWeek, block.id)) {
            onUpdateBlock(drag.blockId, { startWeek: newStart });
          }
        } else {
          const newEnd = Math.max(week, block.startWeek);
          if (!isOverlapping(block.operatorId, block.startWeek, newEnd, block.id)) {
            onUpdateBlock(drag.blockId, { endWeek: newEnd });
          }
        }
      }
    };
    const onUp = () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
      commitDrag();
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
  }, [drag, isOverlapping, onUpdateBlock, vacationBlocks, commitDrag]);

  const handleCellPointerDown = (e, opId, week) => {
    if (e.button !== 0) return;
    e.preventDefault();
    pointerMoved.current = false;

    const block = vacationBlocks.find(b => b.operatorId === opId && week >= b.startWeek && week <= b.endWeek);
    if (block) {
      const offsetWeek = week - block.startWeek;
      setDrag({ type: 'moving', blockId: block.id, opId, origStart: block.startWeek, origEnd: block.endWeek, pointerOffsetWeek: offsetWeek, currentWeek: week, currentOpId: opId });
      longPressTimer.current = setTimeout(() => {
        if (!pointerMoved.current) {
          setDrag(null);
          setPopover({ x: e.clientX, y: e.clientY, block });
        }
        longPressTimer.current = null;
      }, 500);
    } else {
      if (!isOverlapping(opId, week, week)) {
        setDrag({ type: 'drawing', opId, startWeek: week, endWeek: week });
      }
    }
  };

  const handleCellPointerUp = (e) => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    if (drag && drag.type === 'moving' && !pointerMoved.current) {
      setDrag(null);
      const block = vacationBlocks.find(b => b.id === drag.blockId);
      if (block) {
        setPopover({ x: e.clientX, y: e.clientY, block });
      }
      return;
    }
    if (drag && drag.type === 'drawing' && !pointerMoved.current) {
      onAddBlock(drag.opId, drag.startWeek, drag.startWeek);
      setDrag(null);
      return;
    }
  };

  const handleResizePointerDown = (e, blockId, edge, block) => {
    e.stopPropagation();
    e.preventDefault();
    pointerMoved.current = false;
    setDrag({ type: 'resizing', blockId, edge, origStart: block.startWeek, origEnd: block.endWeek });
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
          <Legend />
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
          settings={settings} weeks={weeks} holidayMap={holidayMap}
          groups={groups} drag={drag} showDemand={showDemand} updateDemand={updateDemand}
          onCellPointerDown={handleCellPointerDown}
          onCellPointerUp={handleCellPointerUp}
          onResizePointerDown={handleResizePointerDown}
        />
      ) : (
        <DayZoomGrid
          operators={operators} vacationBlocks={vacationBlocks} demand={demand}
          settings={settings} weeks={weeks} holidayMap={holidayMap} groups={groups}
          showDayCoverage={showDayCoverage} onToggleDayCoverage={() => setShowDayCoverage(c => !c)}
          setPopover={setPopover}
        />
      )}

      {/* ── Popover ──────────────────────────────────────────────────────── */}
      {popover && (
        <BlockPopover x={popover.x} y={popover.y} block={popover.block}
          onSetStatus={onSetBlockStatus} onDelete={onDeleteBlock}
          onClose={() => setPopover(null)} />
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════ */
/*  WEEK ZOOM                                                               */
/* ══════════════════════════════════════════════════════════════════════════ */

const WeekZoomGrid = ({ operators, vacationBlocks, demand, settings, weeks, holidayMap, groups, drag, showDemand, updateDemand, onCellPointerDown, onCellPointerUp, onResizePointerDown }, ref) => {
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
              <div key={w} className="flex flex-col items-center justify-center text-xs font-medium"
                style={{ width: CELL_W, minWidth: CELL_W, height: isHoliday ? CELL_H + 12 : CELL_H, color: isHoliday ? 'var(--holiday-text)' : 'var(--text-secondary)', background: isHoliday ? 'var(--holiday-bg)' : 'transparent', borderRight: '1px solid var(--border)', lineHeight: 1.1 }}
                title={isHoliday ? holidayMap[w].holidays.map(h => h.name).join(', ') : undefined}>
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
                  const block = vacationBlocks.find(b => b.operatorId === op.id && w >= b.startWeek && w <= b.endWeek);
                  const isDrawing = drag?.type === 'drawing' && drag.opId === op.id && w >= Math.min(drag.startWeek, drag.endWeek) && w <= Math.max(drag.startWeek, drag.endWeek);
                  const isStart = block && w === block.startWeek;
                  const isEnd = block && w === block.endWeek;
                  const isDrag = drag && (drag.type === 'moving' && drag.blockId === block?.id || drag.type === 'resizing' && drag.blockId === block?.id);
                  const isHoliday = holidayMap[w]?.holidays?.length > 0;

                  let cellStyle = {};
                  if (block) {
                    if (block.status === 'requested') {
                      cellStyle = {
                        background: 'repeating-linear-gradient(45deg, var(--requested-bg), var(--requested-bg) 4px, transparent 4px, transparent 8px)',
                        borderTop: '2px dashed var(--requested-border)', borderBottom: '2px dashed var(--requested-border)',
                        opacity: 0.65, zIndex: 1,
                      };
                      if (isStart) { cellStyle.borderLeft = '2px dashed var(--requested-border)'; cellStyle.borderTopLeftRadius = '6px'; cellStyle.borderBottomLeftRadius = '6px'; }
                      if (isEnd) { cellStyle.borderRight = '2px dashed var(--requested-border)'; cellStyle.borderTopRightRadius = '6px'; cellStyle.borderBottomRightRadius = '6px'; }
                    } else {
                      const bgVar = `var(--${block.status}-bg)`;
                      const borderVar = `var(--${block.status}-border)`;
                      cellStyle = {
                        background: bgVar, borderTop: `2px solid ${borderVar}`, borderBottom: `2px solid ${borderVar}`,
                        zIndex: block.status === 'approved' ? 3 : 2,
                      };
                      if (isStart) { cellStyle.borderLeft = `2px solid ${borderVar}`; cellStyle.borderTopLeftRadius = '6px'; cellStyle.borderBottomLeftRadius = '6px'; }
                      if (isEnd) { cellStyle.borderRight = `2px solid ${borderVar}`; cellStyle.borderTopRightRadius = '6px'; cellStyle.borderBottomRightRadius = '6px'; }
                    }
                    cellStyle.boxShadow = isDrag ? '0 10px 15px -3px rgba(0,0,0,0.1)' : '0 2px 4px -1px rgba(0,0,0,0.06)';
                    if (isDrag) { cellStyle.transform = 'scale(1.02)'; cellStyle.outline = '2px solid var(--accent)'; }
                  } else if (isDrawing) {
                    cellStyle = { background: 'var(--draft-bg)', opacity: 0.5 };
                  } else if (isHoliday) {
                    cellStyle = { background: 'var(--holiday-bg)' };
                  }

                  return (
                    <div key={w}
                      data-week={w} data-op={op.id}
                      className={`flex items-center justify-center text-xs relative ${isDrag ? 'block-dragging' : ''}`}
                      style={{ width: CELL_W, minWidth: CELL_W, height: CELL_H, borderRight: '1px solid var(--border)', cursor: block ? 'grab' : 'crosshair', touchAction: 'none', ...cellStyle }}
                      onPointerDown={e => onCellPointerDown(e, op.id, w)}
                      onPointerUp={e => onCellPointerUp(e, op.id, w)}>
                      {block && isStart && (
                        <div className="resize-handle" style={{ left: 0, cursor: 'w-resize' }}
                          onPointerDown={e => onResizePointerDown(e, block.id, 'left', block)} />
                      )}
                      {block && isEnd && (
                        <div className="resize-handle" style={{ right: 0, cursor: 'e-resize' }}
                          onPointerDown={e => onResizePointerDown(e, block.id, 'right', block)} />
                      )}
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

function DayZoomGrid({ operators, vacationBlocks, demand, settings, weeks, holidayMap, groups, showDayCoverage, onToggleDayCoverage, setPopover }) {
  const focusWeek = weeks[0];
  const year = new Date().getFullYear();
  const dates = isoWeekDates(year, focusWeek);

  const holidaysByDate = {};
  if (holidayMap) {
    Object.values(holidayMap).forEach(wk => {
      wk.holidays.forEach(h => { holidaysByDate[h.dateStr] = h; });
    });
  }

  const handleDayClick = (e, block) => {
    if (block) {
      setPopover({ x: e.clientX, y: e.clientY, block });
    }
  };

  return (
    <div className="flex-1 overflow-auto select-none">
      <div style={{ minWidth: LABEL_W + 7 * 100 }}>
        {/* Header */}
        <div className="flex sticky top-0 z-20" style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
          <div className="sticky left-0 z-10 flex items-center px-2 text-xs font-semibold"
            style={{ width: LABEL_W, minWidth: LABEL_W, background: 'var(--bg-secondary)', color: 'var(--text-secondary)', borderRight: '1px solid var(--border)' }}>
            Operator
          </div>
          {dates.map((d, i) => {
            const dateStr = formatDateStr(d);
            const isHoliday = !!holidaysByDate[dateStr];
            const isWeekend = i >= 5;
            return (
              <div key={i} className="flex flex-col items-center justify-center text-xs font-medium"
                style={{ width: 100, minWidth: 100, height: CELL_H + 4, borderRight: '1px solid var(--border)',
                  color: isHoliday ? 'var(--holiday-text)' : isWeekend ? 'var(--text-secondary)' : 'var(--text-primary)',
                  background: isHoliday ? 'var(--holiday-bg)' : 'transparent' }}>
                <span>{SWEDISH_DAYS[i]} {d.getDate()}/{d.getMonth() + 1}</span>
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

            {group.ops.map(op => {
              const block = vacationBlocks.find(b => b.operatorId === op.id && focusWeek >= b.startWeek && focusWeek <= b.endWeek);
              return (
                <div key={op.id} className="flex relative" style={{ height: CELL_H, borderBottom: '1px solid var(--border)', opacity: op.active ? 1 : 0.4 }}>
                  <div className="sticky left-0 z-10 flex items-center px-2 text-xs truncate"
                    style={{ width: LABEL_W, minWidth: LABEL_W, background: 'var(--bg-primary)', borderRight: '1px solid var(--border)', color: 'var(--text-primary)' }}>
                    {op.name}
                  </div>
                  {dates.map((d, i) => {
                    const dateStr = formatDateStr(d);
                    const isHoliday = !!holidaysByDate[dateStr];
                    const isWeekend = i >= 5;

                    let bgClass = isWeekend ? 'day-cell-off' : 'day-cell-working';
                    let cellStyle = {};

                    if (block) {
                      const sc = STATUS_COLORS[block.status];
                      if (block.status === 'requested') {
                        cellStyle = {
                          background: 'repeating-linear-gradient(45deg, var(--requested-bg), var(--requested-bg) 4px, transparent 4px, transparent 8px)',
                          borderTop: '2px dashed var(--requested-border)', borderBottom: '2px dashed var(--requested-border)',
                          opacity: 0.65, cursor: 'pointer',
                        };
                      } else {
                        cellStyle = {
                          background: sc.bg,
                          borderTop: `2px solid ${sc.border}`, borderBottom: `2px solid ${sc.border}`,
                          cursor: 'pointer',
                        };
                      }
                      bgClass = '';
                    } else if (isHoliday) {
                      cellStyle = { background: 'var(--holiday-bg)' };
                      bgClass = '';
                    }

                    return (
                      <div key={i}
                        className={`flex items-center justify-center text-xs ${bgClass}`}
                        style={{ width: 100, minWidth: 100, height: CELL_H, borderRight: '1px solid var(--border)', ...cellStyle }}
                        onClick={e => block && handleDayClick(e, block)}>
                        {block && i === 0 && (
                          <span className="text-xs font-medium truncate pointer-events-none select-none"
                            style={{ color: 'var(--text-primary)' }}>
                            v.{block.startWeek}-{block.endWeek}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}

            {/* Coverage rows for day view — hidden by default */}
            {showDayCoverage && (
              <CoverageRows operators={operators} vacationBlocks={vacationBlocks} demand={demand}
                weeks={[focusWeek]} shiftMode={settings.shiftMode} shiftFilter={group.shift}
                holidayMap={holidayMap} label={`COVERAGE (${group.label})`} />
            )}
          </div>
        ))}

        {/* Coverage toggle for day view */}
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
