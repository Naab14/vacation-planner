import CoverageRows from './CoverageRows';
import { CELL_H, LABEL_W, STATUS_COLORS, SWEDISH_DAYS } from './constants';
import { isoWeekDates, formatDateStr } from './dateUtils';

export default function DayZoomGrid({ operators, vacationBlocks, demand, settings, weeks, holidayMap, groups, showDayCoverage, onToggleDayCoverage, setPopover }) {
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
