import { useState, useEffect, useRef } from 'react';
import { PROCESSES } from '../data';
import { getCoverage } from '../coverage';

/* ── Context Menu ────────────────────────────────────────────────────────── */
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

/* ── Coverage Tooltip ──────────────────────────────────────────────────────── */
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

/* ── Coverage Rows ─────────────────────────────────────────────────────────── */
function CoverageRows({ operators, vacationBlocks, demand, weeks, shiftMode, shiftFilter, holidayMap, label }) {
  const [tooltip, setTooltip] = useState(null);
  const colorMap = { green: 'var(--coverage-green)', yellow: 'var(--coverage-yellow)', red: 'var(--coverage-red)' };

  return (
    <>
      <div className="flex items-center text-xs font-semibold uppercase tracking-wider px-2"
        style={{ height: 24, background: 'var(--bg-secondary)', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ width: 130, minWidth: 130 }}>{label}</div>
      </div>
      {PROCESSES.map(proc => (
        <div key={proc} className="flex" style={{ height: 32, borderBottom: '1px solid var(--border)' }}>
          <div className="sticky left-0 z-10 flex items-center px-2 text-xs truncate"
            style={{ width: 130, minWidth: 130, background: 'var(--bg-primary)', borderRight: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
            {proc}
          </div>
          {weeks.map(w => {
            const cov = getCoverage(operators, vacationBlocks, demand, proc, w, shiftMode, shiftFilter, holidayMap);
            return (
              <div key={w}
                className="flex items-center justify-center text-xs font-medium relative"
                style={{ width: 68, minWidth: 68, height: 32, borderRight: '1px solid var(--border)', color: colorMap[cov.level], cursor: 'help' }}
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

/* ── Demand Editor ─────────────────────────────────────────────────────────── */
function DemandEditor({ demand, weeks, updateDemand }) {
  return (
    <div style={{ borderTop: '2px solid var(--border)' }}>
      <div className="flex items-center justify-between px-2 py-1" style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Demand</span>
      </div>
      <div className="flex" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="sticky left-0 z-10 flex items-center px-2 text-xs font-semibold"
          style={{ width: 130, minWidth: 130, background: 'var(--bg-secondary)', color: 'var(--text-secondary)', borderRight: '1px solid var(--border)' }}>
          Process
        </div>
        {weeks.map(w => (
          <div key={w} className="flex items-center justify-center text-xs font-medium"
            style={{ width: 68, minWidth: 68, color: 'var(--text-secondary)', borderRight: '1px solid var(--border)' }}>
            v.{w}
          </div>
        ))}
      </div>
      {PROCESSES.map(proc => (
        <div key={proc} className="flex" style={{ height: 32, borderBottom: '1px solid var(--border)' }}>
          <div className="sticky left-0 z-10 flex items-center px-2 text-xs"
            style={{ width: 130, minWidth: 130, background: 'var(--bg-primary)', borderRight: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
            {proc}
          </div>
          {weeks.map(w => (
            <div key={w} className="flex items-center justify-center"
              style={{ width: 68, minWidth: 68, borderRight: '1px solid var(--border)' }}>
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

/* ── Main Component ────────────────────────────────────────────────────────── */
const CELL_W = 68;
const CELL_H = 32;
const LABEL_W = 130;

export default function CalendarGrid({ operators, vacationBlocks, demand, settings, weeks, holidayMap, onAddBlock, onUpdateBlock, onDeleteBlock, onSetBlockStatus, shiftWeeks, showDemand, onToggleDemand, updateDemand, onSwitchToDay }) {
  const { shiftMode } = settings;
  const gridRef = useRef(null);

  // ── Drag state (pointer events) ────────────────────────────────────────
  const [drawing, setDrawing] = useState(null);     // { opId, startWeek, endWeek }
  const [resizing, setResizing] = useState(null);   // { blockId, edge }
  const [moving, setMoving] = useState(null);        // { blockId, originWeek, origStart, origEnd, origOpId }
  const [ctxMenu, setCtxMenu] = useState(null);

  // Helper to prevent overlaps
  const isOverlapping = (opId, start, end, ignoreId = null) => {
    const sw = Math.min(start, end);
    const ew = Math.max(start, end);
    return vacationBlocks.some(b => 
      b.operatorId === opId && 
      b.id !== ignoreId && 
      Math.max(sw, b.startWeek) <= Math.min(ew, b.endWeek)
    );
  };

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
      if (!isOverlapping(opId, week, week)) {
        setDrawing({ opId, startWeek: week, endWeek: week });
      }
    }
    (e.target).setPointerCapture?.(e.pointerId);
  };

  const handleCellPointerMove = (e, opId, week) => {
    if (drawing && drawing.opId === opId) {
      if (!isOverlapping(opId, drawing.startWeek, week)) {
        setDrawing(d => ({ ...d, endWeek: week }));
      }
    }
    if (resizing) {
      const block = vacationBlocks.find(b => b.id === resizing.blockId);
      if (block) {
        if (resizing.edge === 'left') {
          const newStart = Math.min(week, block.endWeek);
          if (!isOverlapping(block.operatorId, newStart, block.endWeek, block.id)) {
            onUpdateBlock(resizing.blockId, { startWeek: newStart });
          }
        } else {
          const newEnd = Math.max(week, block.startWeek);
          if (!isOverlapping(block.operatorId, block.startWeek, newEnd, block.id)) {
            onUpdateBlock(resizing.blockId, { endWeek: newEnd });
          }
        }
      }
    }
    if (moving) {
      const delta = week - moving.originWeek;
      const newStart = moving.origStart + delta;
      const newEnd = moving.origEnd + delta;
      if (!isOverlapping(opId, newStart, newEnd, moving.blockId)) {
        onUpdateBlock(moving.blockId, { operatorId: opId, startWeek: newStart, endWeek: newEnd });
      }
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
                        if (isStart) { cellStyle.borderLeft = '2px dashed var(--requested-border)'; cellStyle.borderTopLeftRadius = '6px'; cellStyle.borderBottomLeftRadius = '6px'; }
                        if (isEnd) { cellStyle.borderRight = '2px dashed var(--requested-border)'; cellStyle.borderTopRightRadius = '6px'; cellStyle.borderBottomRightRadius = '6px'; }
                      } else {
                        const bgVar = `var(--${block.status}-bg)`;
                        const borderVar = `var(--${block.status}-border)`;
                        cellStyle = {
                          background: bgVar,
                          borderTop: `2px solid ${borderVar}`,
                          borderBottom: `2px solid ${borderVar}`,
                          zIndex: block.status === 'approved' ? 3 : 2,
                        };
                        if (isStart) { cellStyle.borderLeft = `2px solid ${borderVar}`; cellStyle.borderTopLeftRadius = '6px'; cellStyle.borderBottomLeftRadius = '6px'; }
                        if (isEnd) { cellStyle.borderRight = `2px solid ${borderVar}`; cellStyle.borderTopRightRadius = '6px'; cellStyle.borderBottomRightRadius = '6px'; }
                      }
                      // Add a subtle drop shadow to blocks
                      cellStyle.boxShadow = isDrag ? '0 10px 15px -3px rgba(0,0,0,0.1)' : '0 2px 4px -1px rgba(0,0,0,0.06)';
                      if (isDrag) cellStyle.transform = 'scale(1.02)';
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
