import { useState, useEffect, useRef, useCallback } from 'react';
import DayZoomGrid from './DayZoomGrid';
import BlockPopover from './BlockPopover';
import Legend from './Legend';

export default function CalendarGrid({
  operators, vacationBlocks, demand, settings, weeks, holidayMap,
  onAddBlock, onUpdateBlock, onDeleteBlock, onSetBlockStatus,
  onSetBlockDayStatus, onClearBlockDayStatus, onSetBlockNote,
  setStartWeek, setVisibleWeeks, showDemand, onToggleDemand,
  selectedOperatorId, onSelectOperator,
}) {
  const { shiftMode, startWeek, visibleWeeks } = settings;
  const gridWrapperRef = useRef(null);
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
      if (block) setPopover({ x: e.clientX, y: e.clientY, block });
      return;
    }
    if (drag && drag.type === 'drawing' && !pointerMoved.current) {
      onAddBlock(drag.opId, drag.startWeek, drag.startWeek);
      setDrag(null);
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
    : [{ label: 'All Operators', ops: operators, shift: null }];

  const sliderMax = 52 - visibleWeeks + 1;

  const canZoomIn = visibleWeeks > 4;
  const canZoomOut = visibleWeeks < 26;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-3 py-2 flex-wrap" style={{ borderBottom: '1px solid var(--paper-3)', background: 'var(--paper-2)' }}>
        <input type="range" className="time-slider" style={{ width: 180 }}
          value={startWeek} min={1} max={sliderMax}
          onChange={e => setStartWeek(+e.target.value)} />
        <span className="text-sm font-medium whitespace-nowrap" style={{ color: 'var(--ink)' }}>
          v.{weeks[0]}
        </span>
        <div className="flex items-center gap-1 ml-2">
          <button onClick={() => setVisibleWeeks(visibleWeeks + 4)} disabled={!canZoomOut}
            aria-label="Zoom out" title="Zoom out (more weeks)"
            className="zoom-btn px-2 py-1 text-sm font-bold rounded disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: 'transparent', color: 'var(--ink-mute)', border: '1px solid var(--paper-3)' }}>
            −
          </button>
          <button onClick={() => setVisibleWeeks(visibleWeeks - 4)} disabled={!canZoomIn}
            aria-label="Zoom in" title="Zoom in (fewer weeks)"
            className="zoom-btn px-2 py-1 text-sm font-bold rounded disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: 'transparent', color: 'var(--ink-mute)', border: '1px solid var(--paper-3)' }}>
            +
          </button>
        </div>
        <button onClick={() => setShowTools(t => !t)}
          className="px-2 py-1 text-sm rounded ml-auto"
          style={{ background: showTools ? 'var(--indigo)' : 'var(--paper)', color: showTools ? '#fff' : 'var(--ink)', border: '1px solid var(--paper-3)' }}>
          ⚙
        </button>
      </div>

      {/* Secondary tools row */}
      {showTools && (
        <div className="flex items-center gap-3 px-3 py-1.5 flex-wrap" style={{ borderBottom: '1px solid var(--paper-3)', background: 'var(--paper-2)' }}>
          <Legend />
          <button onClick={onToggleDemand} className="px-2 py-1 text-xs ml-auto"
            style={{ background: showDemand ? 'var(--indigo)' : 'var(--paper)', color: showDemand ? '#fff' : 'var(--ink)', border: '1px solid var(--paper-3)', borderRadius: 'var(--r-s)' }}>
            Demand
          </button>
        </div>
      )}

      {/* Grid */}
      <div ref={gridWrapperRef} data-testid="grid-wrapper" className="flex-1 relative flex flex-col overflow-hidden">
        <DayZoomGrid
          operators={operators} vacationBlocks={vacationBlocks} demand={demand}
          settings={settings} weeks={weeks} holidayMap={holidayMap} groups={groups}
          drag={drag}
          showDayCoverage={showDayCoverage} onToggleDayCoverage={() => setShowDayCoverage(c => !c)}
          setPopover={setPopover}
          onAddBlock={onAddBlock}
          onCellPointerDown={handleCellPointerDown}
          onCellPointerUp={handleCellPointerUp}
          onResizePointerDown={handleResizePointerDown}
          selectedOperatorId={selectedOperatorId}
          onSelectOperator={onSelectOperator}
        />
      </div>

      {/* Popover */}
      {popover && (
        <BlockPopover x={popover.x} y={popover.y} block={popover.block}
          dateStr={popover.dateStr}
          onSetStatus={onSetBlockStatus} onDelete={onDeleteBlock}
          onSetDayStatus={onSetBlockDayStatus} onClearDayStatus={onClearBlockDayStatus}
          onSetNote={onSetBlockNote}
          onClose={() => setPopover(null)} />
      )}
    </div>
  );
}
