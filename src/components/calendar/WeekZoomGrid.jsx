import CoverageRows from './CoverageRows';
import DemandEditor from './DemandEditor';
import { CELL_W, CELL_H, LABEL_W, HOLIDAY_ABBREV, stToken, getInitials, indexBlocksByOp } from './constants';

export default function WeekZoomGrid({
  ref, operators, vacationBlocks, demand, settings, weeks, holidayMap,
  groups, drag, showDemand, updateDemand,
  onCellPointerDown, onCellPointerUp, onResizePointerDown,
}) {
  const blocksByOp = indexBlocksByOp(vacationBlocks);

  return (
    <div ref={ref} className={`flex-1 overflow-auto select-none ${drag ? 'grid-dragging' : ''}`}>
      <div style={{ minWidth: LABEL_W + weeks.length * CELL_W }}>

        {/* ── Week header row ─────────────────────────────────────────────── */}
        <div className="flex sticky top-0 z-20"
          style={{ background: 'var(--paper-2)', borderBottom: '2px solid var(--ink)' }}>
          <div className="sticky left-0 z-10 flex items-center px-3"
            style={{
              width: LABEL_W, minWidth: LABEL_W, height: CELL_H,
              background: 'var(--paper-2)', borderRight: '2px solid var(--ink)',
              fontFamily: 'var(--f-mono)', fontSize: 10, fontWeight: 700,
              letterSpacing: '.18em', textTransform: 'uppercase',
              color: 'var(--ink-mute)',
            }}>
            Operatör
          </div>
          {weeks.map(w => {
            const isHoliday = holidayMap[w]?.holidays?.length > 0;
            const holidayAbbrevs = isHoliday ? holidayMap[w].holidays.map(h => HOLIDAY_ABBREV[h.name] || h.name.slice(0, 7)) : [];
            const holidayTitle = isHoliday ? holidayMap[w].holidays.map(h => `${h.name} — ${h.dateStr}`).join(', ') : undefined;
            return (
              <div key={w}
                className="flex flex-col items-center justify-center"
                style={{
                  width: CELL_W, minWidth: CELL_W, height: isHoliday ? CELL_H + 12 : CELL_H,
                  borderRight: '1px solid var(--paper-3)', lineHeight: 1.1,
                  background: isHoliday ? 'var(--holiday-pattern)' : 'transparent',
                }}
                title={holidayTitle}>
                <span style={{
                  fontFamily: 'var(--f-mono)', fontSize: 11, fontWeight: 700,
                  letterSpacing: '.06em',
                  color: isHoliday ? 'var(--hol-text)' : 'var(--ink-soft)',
                }}>
                  v.{w}
                </span>
                {isHoliday && (
                  <span style={{ fontFamily: 'var(--f-mono)', fontSize: 9, fontStyle: 'italic', color: 'var(--hol-text)', opacity: 0.85 }}>
                    {holidayAbbrevs[0]}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Row groups ──────────────────────────────────────────────────── */}
        {groups.map(group => (
          <div key={group.label}>
            {groups.length > 1 && (
              <div className="nk-op-group-title"
                style={{ height: 26, padding: '0 10px', background: 'var(--paper-2)', borderBottom: '1px solid var(--paper-3)' }}>
                {group.label}
                <span className="nk-count">{group.ops.length}</span>
              </div>
            )}

            {group.ops.map(op => (
              <div key={op.id} className="flex relative"
                style={{ height: CELL_H, borderBottom: '1px solid var(--paper-3)', opacity: op.active ? 1 : 0.4 }}>

                {/* Operator label */}
                <div className="sticky left-0 z-10 flex items-center gap-1.5 px-2"
                  style={{
                    width: LABEL_W, minWidth: LABEL_W,
                    background: 'var(--paper)', borderRight: '2px solid var(--ink)',
                    color: 'var(--ink)', fontFamily: 'var(--f-body)', fontWeight: 600, fontSize: 12,
                    overflow: 'hidden',
                  }}>
                  <span style={{
                    flexShrink: 0, width: 20, height: 20, borderRadius: '50%',
                    background: op.shift === 'S2' ? 'var(--coral)' : 'var(--yellow)',
                    color: op.shift === 'S2' ? '#fff' : 'var(--ink)',
                    fontFamily: 'var(--f-head)', fontWeight: 900, fontStyle: 'italic',
                    fontSize: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '1px solid var(--ink)',
                  }}>
                    {getInitials(op.name)}
                  </span>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                    {op.name}
                  </span>
                </div>

                {/* Week cells */}
                {weeks.map(w => {
                  const block = (blocksByOp[op.id] || []).find(b => w >= b.startWeek && w <= b.endWeek);
                  const hasDayOverrides = block && block.dayStatuses && Object.keys(block.dayStatuses).length > 0;
                  const isDrawing = drag?.type === 'drawing' && drag.opId === op.id
                    && w >= Math.min(drag.startWeek, drag.endWeek) && w <= Math.max(drag.startWeek, drag.endWeek);
                  const isStart = block && w === block.startWeek;
                  const isEnd = block && w === block.endWeek;
                  const isDrag = drag && (
                    (drag.type === 'moving' && drag.blockId === block?.id) ||
                    (drag.type === 'resizing' && drag.blockId === block?.id)
                  );
                  const isHoliday = holidayMap[w]?.holidays?.length > 0;

                  let cellStyle = {};
                  if (block) {
                    const st = stToken(block.status);
                    const bgVar = `var(--st-${st}-bg)`;
                    const bdVar = `var(--st-${st}-bd)`;
                    const isDashed = block.status === 'requested';
                    const bStyle = isDashed ? 'dashed' : 'solid';
                    cellStyle = {
                      background: bgVar,
                      borderTop: `2px ${bStyle} ${bdVar}`,
                      borderBottom: `2px ${bStyle} ${bdVar}`,
                      zIndex: block.status === 'approved' ? 3 : 2,
                      boxShadow: isDrag ? '0 6px 16px rgba(0,0,0,0.22)' : '0 1px 3px rgba(0,0,0,0.08)',
                    };
                    if (isStart) {
                      cellStyle.borderLeft = `2px ${bStyle} ${bdVar}`;
                      cellStyle.borderTopLeftRadius = 'var(--r-s)';
                      cellStyle.borderBottomLeftRadius = 'var(--r-s)';
                    }
                    if (isEnd) {
                      cellStyle.borderRight = `2px ${bStyle} ${bdVar}`;
                      cellStyle.borderTopRightRadius = 'var(--r-s)';
                      cellStyle.borderBottomRightRadius = 'var(--r-s)';
                    }
                    if (isDrag) {
                      cellStyle.transform = 'scale(1.02)';
                      cellStyle.outline = '2px solid var(--indigo)';
                    }
                  } else if (isDrawing) {
                    cellStyle = { background: 'var(--st-draft-bg)', opacity: 0.5 };
                  } else if (isHoliday) {
                    cellStyle = { background: 'var(--holiday-pattern)' };
                  }

                  const cellTitle = !block && isHoliday
                    ? holidayMap[w].holidays.map(h => `${h.name} — ${h.dateStr}`).join(', ')
                    : undefined;

                  return (
                    <div key={w}
                      data-week={w} data-op={op.id}
                      className={`flex items-center justify-center text-xs relative ${isDrag ? 'block-dragging' : ''}`}
                      style={{
                        width: CELL_W, minWidth: CELL_W, height: CELL_H,
                        borderRight: isEnd ? undefined : '1px solid var(--paper-3)',
                        cursor: block ? 'grab' : 'crosshair', touchAction: 'none',
                        ...cellStyle,
                      }}
                      title={cellTitle}
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
                          style={{ color: 'var(--ink)', fontFamily: 'var(--f-mono)', fontSize: 10, fontWeight: 700 }}>
                          {block.startWeek === block.endWeek ? `v.${block.startWeek}` : `v.${block.startWeek}-${block.endWeek}`}
                        </span>
                      )}
                      {hasDayOverrides && isEnd && (
                        <span className="absolute top-0 right-0.5 text-[8px] pointer-events-none"
                          style={{ color: 'var(--indigo)' }} title="Per-day overrides">●</span>
                      )}
                      {block?.note && isStart && (
                        <span className="absolute top-0 left-0.5 text-[9px] pointer-events-none"
                          title={block.note} aria-label="Has note">💬</span>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}

            <CoverageRows operators={operators} vacationBlocks={vacationBlocks} demand={demand}
              weeks={weeks} shiftMode={settings.shiftMode} shiftFilter={group.shift} holidayMap={holidayMap}
              label={`COVERAGE (${group.label})`} />
          </div>
        ))}

        {showDemand && <DemandEditor demand={demand} weeks={weeks} updateDemand={updateDemand} />}
      </div>
    </div>
  );
}
