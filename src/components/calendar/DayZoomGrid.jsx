import CoverageRows from './CoverageRows';
import { CELL_H, LABEL_W, STATUS_LABELS, SWEDISH_DAYS, stToken, getInitials, indexBlocksByOp } from './constants';
import { isoWeekDates, formatDateStr } from './dateUtils';

const DAY_ZOOM_WEEKS = 8;
const DAY_COL_W = 38;
const WEEK_HDR_H = 28;
const DAY_HDR_H = 40;

function getDayStatus(block, dateStr) {
  if (!block) return null;
  return block.dayStatuses?.[dateStr] || block.status;
}

export default function DayZoomGrid({
  operators, vacationBlocks, demand, settings, weeks, holidayMap, groups,
  showDayCoverage, onToggleDayCoverage, setPopover,
  onAddBlock,
}) {
  const today = new Date();
  const todayStr = formatDateStr(today);
  const year = today.getFullYear();
  const visibleWeeks = weeks.slice(0, DAY_ZOOM_WEEKS);

  const cells = [];
  visibleWeeks.forEach(w => {
    isoWeekDates(year, w).forEach((d, i) => {
      cells.push({ week: w, date: d, dayIndex: i, dateStr: formatDateStr(d) });
    });
  });

  const holidaysByDate = {};
  if (holidayMap) {
    Object.values(holidayMap).forEach(wk => {
      wk.holidays.forEach(h => { holidaysByDate[h.dateStr] = h; });
    });
  }

  const blocksByOp = indexBlocksByOp(vacationBlocks);
  const weekCellW = DAY_COL_W * 7;
  const totalWidth = LABEL_W + cells.length * DAY_COL_W;

  const handleDayClick = (e, op, block, dateStr, week) => {
    if (block) {
      setPopover({ x: e.clientX, y: e.clientY, block, dateStr });
    } else if (onAddBlock) {
      onAddBlock(op.id, week, week);
    }
  };

  return (
    <div className="flex-1 overflow-auto select-none">
      <div style={{ minWidth: totalWidth }}>

        {/* ── Week header row (dark ink strip) ───────────────────────────── */}
        <div className="flex sticky top-0 z-30"
          style={{ background: 'var(--ink)', height: WEEK_HDR_H }}>
          <div className="sticky left-0 z-10 flex items-center justify-center"
            style={{
              width: LABEL_W, minWidth: LABEL_W, height: WEEK_HDR_H,
              background: 'var(--ink)', borderRight: '1px solid rgba(255,255,255,0.10)',
            }}>
            <span style={{ fontFamily: 'var(--f-mono)', fontSize: 9, fontWeight: 700, letterSpacing: '.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>
              Dag-vy
            </span>
          </div>
          {visibleWeeks.map(w => {
            const isHolWeek = !!holidayMap?.[w]?.isHoliday;
            const holidayTitle = isHolWeek
              ? holidayMap[w].holidays.map(h => `${h.name} — ${h.dateStr}`).join(', ')
              : undefined;
            return (
              <div key={w} className="flex items-center justify-center"
                title={holidayTitle}
                style={{ width: weekCellW, minWidth: weekCellW, height: WEEK_HDR_H, borderRight: '1px solid rgba(255,255,255,0.08)' }}>
                <span className={`nk-week-chip${isHolWeek ? ' hol' : ''}`}>v.{w}</span>
              </div>
            );
          })}
        </div>

        {/* ── Day header row ──────────────────────────────────────────────── */}
        <div className="flex sticky z-20"
          style={{ top: WEEK_HDR_H, background: 'var(--paper-2)', borderBottom: '2px solid var(--ink)' }}>
          <div className="sticky left-0 z-10"
            style={{
              width: LABEL_W, minWidth: LABEL_W, height: DAY_HDR_H,
              background: 'var(--paper-2)', borderRight: '2px solid var(--ink)',
            }} />
          {cells.map((c, idx) => {
            const isHoliday = !!holidaysByDate[c.dateStr];
            const isWeekend = c.dayIndex >= 5;
            const isToday = c.dateStr === todayStr;
            const isWeekBoundary = c.dayIndex === 6;
            const headerTitle = isHoliday ? `${holidaysByDate[c.dateStr].name} — ${c.dateStr}` : undefined;

            let hdrBg = 'var(--paper-2)';
            let hdrColor = isWeekend ? 'var(--ink-mute)' : 'var(--ink-soft)';
            if (isToday) { hdrBg = 'var(--yellow)'; hdrColor = 'var(--ink)'; }
            else if (isHoliday) { hdrBg = 'var(--hol-bg)'; hdrColor = 'var(--hol-text)'; }

            return (
              <div key={idx} className="nk-day-hdr"
                title={headerTitle}
                style={{
                  width: DAY_COL_W, minWidth: DAY_COL_W, height: DAY_HDR_H,
                  borderRight: isWeekBoundary ? '2px solid var(--ink)' : '1px solid var(--paper-3)',
                  background: hdrBg, color: hdrColor,
                }}>
                <span style={{ fontSize: 9, opacity: isWeekend ? 0.7 : 1 }}>{SWEDISH_DAYS[c.dayIndex]}</span>
                <span style={{ fontSize: 11, fontWeight: 800 }}>{c.date.getDate()}</span>
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
                style={{ height: CELL_H, borderBottom: '1px solid var(--paper-3)', opacity: op.active ? 1 : 0.45 }}>

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

                {/* Day cells */}
                {cells.map((c, idx) => {
                  const block = (blocksByOp[op.id] || []).find(b =>
                    c.week >= b.startWeek && c.week <= b.endWeek,
                  );
                  const isHoliday = !!holidaysByDate[c.dateStr];
                  const isWeekend = c.dayIndex >= 5;
                  const isWeekBoundary = c.dayIndex === 6;
                  const isToday = c.dateStr === todayStr;
                  const dayStatus = getDayStatus(block, c.dateStr);
                  const hasOverride = block && block.dayStatuses?.[c.dateStr] && block.dayStatuses[c.dateStr] !== block.status;
                  const isAbsStart = block && c.week === block.startWeek && c.dayIndex === 0;
                  const isAbsEnd = block && c.week === block.endWeek && c.dayIndex === 6;
                  const holidayTitle = !block && isHoliday
                    ? `${holidaysByDate[c.dateStr].name} — ${c.dateStr}`
                    : undefined;

                  let bgClass = isWeekend ? 'day-cell-off' : '';
                  let cellStyle = {};
                  let borderRight;

                  if (block) {
                    const st = stToken(dayStatus);
                    const bgVar = `var(--st-${st}-bg)`;
                    const bdVar = `var(--st-${st}-bd)`;
                    const isDashed = dayStatus === 'requested';
                    const bStyle = isDashed ? 'dashed' : 'solid';
                    cellStyle = {
                      background: bgVar,
                      borderTop: `2px ${bStyle} ${bdVar}`,
                      borderBottom: `2px ${bStyle} ${bdVar}`,
                      cursor: 'pointer', zIndex: 1,
                      ...(isAbsStart && {
                        borderLeft: `2px ${bStyle} ${bdVar}`,
                        borderTopLeftRadius: 'var(--r-s)',
                        borderBottomLeftRadius: 'var(--r-s)',
                      }),
                      ...(isAbsEnd && {
                        borderTopRightRadius: 'var(--r-s)',
                        borderBottomRightRadius: 'var(--r-s)',
                      }),
                    };
                    bgClass = '';
                    if (isAbsEnd) {
                      borderRight = `2px ${bStyle} ${bdVar}`;
                    } else if (isWeekBoundary) {
                      borderRight = '1.5px solid var(--paper-3)';
                    } else {
                      borderRight = '1px solid rgba(0,0,0,0.07)';
                    }
                  } else if (isHoliday) {
                    cellStyle = { background: 'var(--holiday-pattern)', cursor: 'pointer' };
                    bgClass = '';
                    borderRight = isWeekBoundary ? '2px solid var(--ink)' : '1px solid var(--paper-3)';
                  } else {
                    cellStyle = {
                      cursor: 'pointer',
                      ...(isToday && { background: 'rgba(255,214,10,0.10)' }),
                    };
                    borderRight = isWeekBoundary ? '2px solid var(--ink)' : '1px solid var(--paper-3)';
                  }

                  return (
                    <div key={idx}
                      className={`flex items-center justify-center relative ${bgClass} ${block ? 'nk-block-cell' : ''}`}
                      title={holidayTitle}
                      style={{ width: DAY_COL_W, minWidth: DAY_COL_W, height: CELL_H, borderRight, ...cellStyle }}
                      onClick={e => handleDayClick(e, op, block, c.dateStr, c.week)}>
                      {block && isAbsStart && (
                        <span className="nk-status-chip"
                          style={{
                            background: `var(--st-${stToken(dayStatus)}-bd)`,
                            color: dayStatus === 'approved' ? 'var(--ink)' : '#fff',
                          }}>
                          {STATUS_LABELS[dayStatus]?.slice(0, 3)}
                        </span>
                      )}
                      {hasOverride && (
                        <span className="absolute top-0 right-0.5 text-[7px] pointer-events-none"
                          style={{ color: 'var(--indigo)' }}>●</span>
                      )}
                      {block?.note && isAbsStart && (
                        <span className="absolute top-0 left-0.5 text-[8px] pointer-events-none"
                          title={block.note} aria-label="Has note">💬</span>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}

            {showDayCoverage && (
              <CoverageRows operators={operators} vacationBlocks={vacationBlocks} demand={demand}
                weeks={visibleWeeks} shiftMode={settings.shiftMode} shiftFilter={group.shift}
                holidayMap={holidayMap} label={`COVERAGE (${group.label})`}
                cellWidth={weekCellW} />
            )}
          </div>
        ))}

        {/* Coverage toggle */}
        <div className="flex items-center px-3 py-2"
          style={{ background: 'var(--paper-2)', borderTop: '1px solid var(--paper-3)' }}>
          <button onClick={onToggleDayCoverage}
            className="nk-btn sm"
            style={showDayCoverage
              ? { background: 'var(--indigo)', color: '#fff', borderColor: 'var(--indigo)', boxShadow: '2px 2px 0 0 var(--yellow)' }
              : {}}>
            {showDayCoverage ? 'Hide Coverage' : 'Show Coverage'}
          </button>
        </div>
      </div>
    </div>
  );
}
