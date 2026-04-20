/* Week grid + Day grid + Coverage */
const { useState: useStateG, useEffect: useEffectG, useRef: useRefG, useMemo: useMemoG, useCallback: useCallbackG } = React;
const { isoWeekDates, formatDateStr, SWEDISH_DAYS, MONTHS_SV, STATUS_LABELS } = window.SPData;

/* Coverage calc — count available people per week for a shift */
function coverageFor(operators, blocks, week, shiftFilter){
  const pool = operators.filter(o=>o.active && (!shiftFilter || o.shift===shiftFilter));
  let onVacation = 0;
  for(const op of pool){
    const b = blocks.find(b=>b.operatorId===op.id && week>=b.startWeek && week<=b.endWeek && (b.status==='approved' || b.status==='pending'));
    if(b) onVacation++;
  }
  const available = pool.length - onVacation;
  const min = Math.max(3, Math.ceil(pool.length * 0.55)); // target
  const ratio = available / min;
  const band = ratio >= 1 ? 'ok' : ratio >= 0.8 ? 'warn' : 'bad';
  return { available, total: pool.length, band };
}

function WeekZoomGrid({
  operators, vacationBlocks, weeks, holidayMap, groups, drag, currentWeek,
  onCellPointerDown, onCellPointerUp, onResizePointerDown,
}){
  return (
    <div className="grid-plate">
      {/* Header */}
      <div className="grid-header">
        <div className="cell-op">Operator · Shift</div>
        {weeks.map(w=>{
          const h = holidayMap[w];
          return (
            <div key={w} className={"wk"+(h?' holiday':'')+(w===currentWeek?' current':'')}>
              <em>vecka</em>
              <span>{String(w).padStart(2,'0')}</span>
            </div>
          );
        })}
      </div>

      {groups.map(group=>(
        <React.Fragment key={group.label}>
          {groups.length > 1 && (
            <div className="shift-header">
              <span className="tag">Shift {group.label}</span>
              <span className="meta">{group.ops.length} operators</span>
            </div>
          )}

          {group.ops.map(op=>(
            <div key={op.id} className={"row"+(op.active?'':' inactive')}>
              <div className="cell-op">
                <div className={"op-avatar"+(op.shift==='S2'?' s2':'')}>{window.SPData.initials(op.name)}</div>
                <span style={{flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{op.name}</span>
              </div>
              {weeks.map(w=>{
                const block = vacationBlocks.find(b=>b.operatorId===op.id && w>=b.startWeek && w<=b.endWeek);
                const isStart = block && w===block.startWeek;
                const isEnd   = block && w===block.endWeek;
                const isDrawing = drag?.type==='drawing' && drag.opId===op.id && w>=Math.min(drag.startWeek,drag.endWeek) && w<=Math.max(drag.startWeek,drag.endWeek);
                const isDrag = block && drag && (drag.blockId===block.id);
                const hasOverride = block?.dayStatuses && Object.keys(block.dayStatuses).length>0;

                let cls = 'cell';
                if(block){
                  cls += ' block st-'+block.status;
                  if(isStart) cls += ' is-start';
                  if(isEnd) cls += ' is-end';
                } else if(isDrawing){
                  cls += ' block st-draft drafting is-start is-end';
                } else if(holidayMap[w]){
                  cls += ' holiday';
                } else if(w%2===0){
                  cls += ' alt';
                }
                if(isDrag) cls += ' dragging-active';

                return (
                  <div key={w} className={cls}
                       data-week={w} data-op={op.id}
                       onPointerDown={e=>onCellPointerDown(e, op.id, w)}
                       onPointerUp={e=>onCellPointerUp(e, op.id, w)}>
                    {block && isStart && (
                      <div className="resize-h left" onPointerDown={e=>onResizePointerDown(e, block.id, 'left', block)}/>
                    )}
                    {block && isEnd && (
                      <div className="resize-h right" onPointerDown={e=>onResizePointerDown(e, block.id, 'right', block)}/>
                    )}
                    {block && isStart && (
                      <span className="week-label">
                        {block.startWeek===block.endWeek ? `v.${block.startWeek}` : `v.${block.startWeek}–${block.endWeek}`}
                      </span>
                    )}
                    {hasOverride && isEnd && <span className="override-dot" title="Per-day overrides"/>}
                  </div>
                );
              })}
            </div>
          ))}

          <CoverageRow operators={operators} blocks={vacationBlocks} weeks={weeks} shiftFilter={group.shift} label={`COVERAGE · ${group.label}`}/>
        </React.Fragment>
      ))}
    </div>
  );
}

function CoverageRow({ operators, blocks, weeks, shiftFilter, label }){
  return (
    <div className="coverage">
      <div className="cell-op">{label}</div>
      {weeks.map(w=>{
        const c = coverageFor(operators, blocks, w, shiftFilter);
        return (
          <div key={w} className="cov-cell">
            <span className={"pill "+c.band}>{c.available}/{c.total}</span>
          </div>
        );
      })}
    </div>
  );
}

function DayZoomGrid({ operators, vacationBlocks, weeks, holidayMap, groups, setPopover, onAddBlock }){
  const focusWeek = weeks[0];
  const year = 2026;
  const dates = isoWeekDates(year, focusWeek);
  const holidaysByDate = {};
  Object.values(holidayMap).forEach(wk => wk.holidays.forEach(h => holidaysByDate[h.dateStr] = h));

  return (
    <div className="grid-plate day-grid">
      <div className="grid-header">
        <div className="cell-op">Operator · Week {focusWeek}</div>
        {dates.map((d,i)=>{
          const dateStr = formatDateStr(d);
          const h = holidaysByDate[dateStr];
          const weekend = i>=5;
          return (
            <div key={i} className={"dh"+(h?' holiday':weekend?' weekend':'')}>
              <span>{SWEDISH_DAYS[i]}</span>
              <em>{d.getUTCDate()} {MONTHS_SV[d.getUTCMonth()]}</em>
            </div>
          );
        })}
      </div>

      {groups.map(group=>(
        <React.Fragment key={group.label}>
          {groups.length>1 && (
            <div className="shift-header">
              <span className="tag">Shift {group.label}</span>
              <span className="meta">{group.ops.length} operators</span>
            </div>
          )}
          {group.ops.map(op=>{
            const block = vacationBlocks.find(b=>b.operatorId===op.id && focusWeek>=b.startWeek && focusWeek<=b.endWeek);
            return (
              <div key={op.id} className={"row"+(op.active?'':' inactive')}>
                <div className="cell-op">
                  <div className={"op-avatar"+(op.shift==='S2'?' s2':'')}>{window.SPData.initials(op.name)}</div>
                  <span style={{flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{op.name}</span>
                </div>
                {dates.map((d,i)=>{
                  const dateStr = formatDateStr(d);
                  const h = holidaysByDate[dateStr];
                  const weekend = i>=5;
                  const dayStatus = block ? (block.dayStatuses?.[dateStr] || block.status) : null;
                  const hasOverride = block?.dayStatuses?.[dateStr] && block.dayStatuses[dateStr]!==block.status;
                  let cls = 'cell';
                  if(block){
                    cls += ' block st-'+dayStatus;
                    if(i===0 || !block || block.startWeek===focusWeek) cls += ' is-start';
                    if(i===6 || !block || block.endWeek===focusWeek) cls += ' is-end';
                  } else if(h){ cls += ' holiday'; }
                  else if(weekend){ cls += ' weekend'; }
                  return (
                    <div key={i} className={cls}
                         onClick={e=>{
                           if(block) setPopover({x:e.clientX, y:e.clientY, block, dateStr});
                           else onAddBlock(op.id, focusWeek, focusWeek);
                         }}>
                      {block && <span className="week-label">{STATUS_LABELS[dayStatus]}</span>}
                      {hasOverride && <span className="override-dot"/>}
                    </div>
                  );
                })}
              </div>
            );
          })}
          <CoverageRow operators={operators} blocks={vacationBlocks} weeks={[focusWeek]} shiftFilter={group.shift} label={`COVERAGE · ${group.label}`}/>
        </React.Fragment>
      ))}
    </div>
  );
}

Object.assign(window, { WeekZoomGrid, DayZoomGrid });
