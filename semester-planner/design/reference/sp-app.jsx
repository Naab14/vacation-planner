/* Main App — Semester Planner (Neo-Kinetic re-skin) */
const SPD = window.SPData;
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "neo-kinetic",
  "mode": "light",
  "density": "default",
  "accent": "indigo",
  "font": "epilogue",
  "glass": false,
  "asym": 0.7,
  "grain": 0.55
}/*EDITMODE-END*/;

// Color themes — each defines ink/paper + brand triad.
// Dark mode is a SOFT dark (not pitch black) built from deep ink surfaces.
const THEMES = {
  'neo-kinetic': {
    label:'Neo-Kinetic',
    light:{ ink:'#0B0A1F', inkSoft:'#3A3758', inkMute:'#807DA0',
            paper:'#FAF7F2', paper2:'#F2ECE2', paper3:'#E8E0D0', panel:'#FFFFFF',
            indigo:'#4F46E5', coral:'#FF4D6D', yellow:'#FFD60A' },
    dark:{  ink:'#F5F1E8', inkSoft:'#C9C3D9', inkMute:'#8A84A6',
            paper:'#1A1830', paper2:'#22203A', paper3:'#2D2A4A', panel:'#26233F',
            indigo:'#8B82FF', coral:'#FF7A93', yellow:'#FFE156' },
  },
  'duck-pond': {
    label:'Duck Pond',
    light:{ ink:'#1F2937', inkSoft:'#4B5563', inkMute:'#8B95A3',
            paper:'#F4EFEA', paper2:'#EBE5DF', paper3:'#DDD4C8', panel:'#FFFFFF',
            indigo:'#F9BC30', coral:'#2BA5FF', yellow:'#53DBC9' },
    dark:{  ink:'#F4EFEA', inkSoft:'#D5CEC2', inkMute:'#938C80',
            paper:'#1F2329', paper2:'#262B33', paper3:'#30363F', panel:'#2C323B',
            indigo:'#FFCB5C', coral:'#57BDFF', yellow:'#7BE8D8' },
  },
  'citrus-grove': {
    label:'Citrus Grove',
    light:{ ink:'#1A1A1A', inkSoft:'#3D3D3D', inkMute:'#7A7A7A',
            paper:'#F5F5F0', paper2:'#EBEBE3', paper3:'#DDDDD2', panel:'#FFFFFF',
            indigo:'#E25D33', coral:'#FF8C42', yellow:'#7FB069' },
    dark:{  ink:'#F5F5F0', inkSoft:'#CFCFC5', inkMute:'#8F8F85',
            paper:'#1F1E1A', paper2:'#27251F', paper3:'#322F27', panel:'#2A2822',
            indigo:'#FF8657', coral:'#FFB080', yellow:'#A3D28D' },
  },
  'electric-plum': {
    label:'Electric Plum',
    light:{ ink:'#17091F', inkSoft:'#3E1F4B', inkMute:'#7A5A88',
            paper:'#F7F2F9', paper2:'#EEE4F0', paper3:'#E0D0E4', panel:'#FFFFFF',
            indigo:'#7C2FAD', coral:'#E91E63', yellow:'#00D4A8' },
    dark:{  ink:'#F7F2F9', inkSoft:'#D9C9DE', inkMute:'#9486A0',
            paper:'#1E0F26', paper2:'#271430', paper3:'#33193F', panel:'#2B1534' ,
            indigo:'#B366E0', coral:'#FF5A8F', yellow:'#3FE9BE' },
  },
  'harbor': {
    label:'Harbor',
    light:{ ink:'#0C1C2B', inkSoft:'#2E4456', inkMute:'#6E8293',
            paper:'#F2F6F8', paper2:'#E5EDF1', paper3:'#D3DFE6', panel:'#FFFFFF',
            indigo:'#0E7490', coral:'#F97068', yellow:'#FFBF3F' },
    dark:{  ink:'#EEF4F6', inkSoft:'#BFCDD2', inkMute:'#7D8E97',
            paper:'#0F1F2B', paper2:'#162836', paper3:'#1E3144', panel:'#1A2C3C',
            indigo:'#3BB4CF', coral:'#FF9189', yellow:'#FFD26E' },
  },
  'monochrome': {
    label:'Monochrome',
    light:{ ink:'#0A0A0A', inkSoft:'#333333', inkMute:'#777777',
            paper:'#F6F4F0', paper2:'#EDE9E0', paper3:'#DED8CC', panel:'#FFFFFF',
            indigo:'#0A0A0A', coral:'#E53935', yellow:'#F6D34A' },
    dark:{  ink:'#F6F4F0', inkSoft:'#C4C0B8', inkMute:'#8C887E',
            paper:'#1C1B18', paper2:'#23221F', paper3:'#2D2B26', panel:'#262521',
            indigo:'#F6F4F0', coral:'#FF6E66', yellow:'#FFDF5F' },
  },
  // Soft SaaS — muted lavender/sage/peach, airy and quiet
  'lumina': {
    label:'Lumina',
    light:{ ink:'#1F1B2E', inkSoft:'#5A5470', inkMute:'#9691A8',
            paper:'#FBFAFD', paper2:'#F3F0F9', paper3:'#E8E3F2', panel:'#FFFFFF',
            indigo:'#8B7FD6', coral:'#F5A695', yellow:'#A8C9A8' },
    dark:{  ink:'#F0EEF7', inkSoft:'#C7C1DB', inkMute:'#8D86A5',
            paper:'#1A1726', paper2:'#221E30', paper3:'#2D273F', panel:'#272238',
            indigo:'#B0A4F0', coral:'#FFBCAB', yellow:'#BFE0BF' },
  },
  // Playful — candy palette, bouncy and loud
  'playful': {
    label:'Playful',
    light:{ ink:'#1A0B2E', inkSoft:'#3D2960', inkMute:'#7A6594',
            paper:'#FFF8F0', paper2:'#FFEEE0', paper3:'#FFDAC4', panel:'#FFFFFF',
            indigo:'#FF3DA5', coral:'#FF9A3C', yellow:'#A8E61D' },
    dark:{  ink:'#FFF4E8', inkSoft:'#E5CFE0', inkMute:'#A18FB2',
            paper:'#1B0E2E', paper2:'#241340', paper3:'#301B52', panel:'#2A1648',
            indigo:'#FF6AB8', coral:'#FFAE5E', yellow:'#C4F04C' },
  },
};

let _uid = 0;
const uid = () => `id_${++_uid}_${Date.now().toString(36)}`;

function App(){
  const [operators, setOperators]   = React.useState(SPD.SEED_OPERATORS);
  const [vacationBlocks, setBlocks] = React.useState(SPD.SEED_BLOCKS);
  const [shiftMode, setShiftMode]   = React.useState('separate');
  const [startWeek, setStartWeek]   = React.useState(15);
  const [zoom, setZoom]             = React.useState('week');
  const [sidebarCollapsed, setSC]   = React.useState(false);
  const [openOpId, setOpenOpId]     = React.useState(null);
  const [search, setSearch]         = React.useState('');
  const [popover, setPopover]       = React.useState(null);
  const [drag, setDrag]             = React.useState(null);
  const [toast, setToast]           = React.useState(null);
  const [tweaksOpen, setTweaksOpen] = React.useState(false);
  const [tweaks, setTweaks]         = React.useState(TWEAK_DEFAULTS);
  const longPressT = React.useRef(null);
  const moved = React.useRef(false);
  const VISIBLE = 12;
  const weeks = React.useMemo(()=>Array.from({length:VISIBLE},(_,i)=>startWeek+i),[startWeek]);
  const holidayMap = React.useMemo(()=>SPD.buildHolidayMap(),[]);
  const currentWeek = 17; // demo

  // Apply tweaks → CSS vars / body attrs
  React.useEffect(()=>{
    const root = document.documentElement;
    root.style.setProperty('--asym', tweaks.asym);
    root.style.setProperty('--grain', tweaks.grain);

    // Theme + mode
    const theme = THEMES[tweaks.theme] || THEMES['neo-kinetic'];
    const c = tweaks.mode==='dark' ? theme.dark : theme.light;
    root.style.setProperty('--ink', c.ink);
    root.style.setProperty('--ink-soft', c.inkSoft);
    root.style.setProperty('--ink-mute', c.inkMute);
    root.style.setProperty('--paper', c.paper);
    root.style.setProperty('--paper-2', c.paper2);
    root.style.setProperty('--paper-3', c.paper3);
    root.style.setProperty('--panel', c.panel);
    root.style.setProperty('--coral', c.coral);
    root.style.setProperty('--yellow', c.yellow);

    // Accent emphasis picks which theme hue drives primary
    const brands = { indigo: c.indigo, coral: c.coral, yellow: c.yellow };
    root.style.setProperty('--indigo', brands[tweaks.accent] || c.indigo);
    root.style.setProperty('--indigo-soft', (tweaks.mode==='dark') ? c.paper3 : '#EEEBFF');

    // Status colors (lighter tints for dark mode)
    const isDark = tweaks.mode==='dark';
    root.style.setProperty('--st-draft-bg',  isDark ? c.paper3   : '#EDE6D6');
    root.style.setProperty('--st-draft-bd',  isDark ? c.inkMute  : '#B8AE95');
    root.style.setProperty('--st-pending-bg',isDark ? 'color-mix(in srgb, '+c.coral+' 28%, '+c.panel+')' : '#FFE4E9');
    root.style.setProperty('--st-pending-bd',c.coral);
    root.style.setProperty('--st-approved-bg',isDark ? 'color-mix(in srgb, '+c.yellow+' 55%, '+c.panel+')' : c.yellow);
    root.style.setProperty('--st-approved-bd', isDark ? c.yellow : c.ink);
    root.style.setProperty('--st-req-bg',    isDark ? 'color-mix(in srgb, '+c.indigo+' 22%, '+c.panel+')' : '#EEEBFF');
    root.style.setProperty('--st-req-bd',    c.indigo);
    root.style.setProperty('--hol-bg',       isDark ? 'color-mix(in srgb, '+c.coral+' 18%, '+c.panel+')' : '#FFE4E9');
    root.style.setProperty('--hol-text',     c.coral);

    document.body.setAttribute('data-mode', tweaks.mode);
    document.body.setAttribute('data-theme', tweaks.theme);

    // Density
    const dens = tweaks.density;
    root.style.setProperty('--cell-h', dens==='compact'?'30px':dens==='spacious'?'48px':'38px');
    root.style.setProperty('--cell-w', dens==='compact'?'60px':dens==='spacious'?'86px':'72px');
    // Font
    root.style.setProperty('--f-head', tweaks.font==='mono'?"'Space Mono', monospace":"'Epilogue', system-ui, sans-serif");
    document.body.classList.toggle('glass-on', tweaks.glass);
  },[tweaks]);

  // Tweaks postMessage contract
  React.useEffect(()=>{
    const onMsg = (e)=>{
      if(e.data?.type==='__activate_edit_mode') setTweaksOpen(true);
      if(e.data?.type==='__deactivate_edit_mode') setTweaksOpen(false);
    };
    window.addEventListener('message', onMsg);
    window.parent.postMessage({type:'__edit_mode_available'}, '*');
    return ()=>window.removeEventListener('message', onMsg);
  },[]);
  React.useEffect(()=>{
    window.parent.postMessage({type:'__edit_mode_set_keys', edits: tweaks}, '*');
  },[tweaks]);

  const flash = (m)=>{ setToast(m); setTimeout(()=>setToast(null), 2200); };

  /* ── Block operations ── */
  const isOverlapping = (opId, s, e, ignoreId=null) => {
    const sw = Math.min(s,e), ew = Math.max(s,e);
    return vacationBlocks.some(b => b.operatorId===opId && b.id!==ignoreId && Math.max(sw,b.startWeek)<=Math.min(ew,b.endWeek));
  };
  const addBlock = (opId, sw, ew, status='draft')=> {
    if(isOverlapping(opId, sw, ew)) return;
    setBlocks(b=>[...b, {id:uid(), operatorId:opId, startWeek:sw, endWeek:ew, status}]);
    flash('Block created');
  };
  const updateBlock = (id, patch)=> setBlocks(b=>b.map(x=>x.id===id?{...x,...patch}:x));
  const deleteBlock = (id)=> { setBlocks(b=>b.filter(x=>x.id!==id)); flash('Block deleted'); };
  const setBlockStatus = (id, status)=> { setBlocks(b=>b.map(x=>x.id===id?{...x,status}:x)); flash('Status: '+SPD.STATUS_LABELS[status]); };
  const setBlockDayStatus = (id, dateStr, status)=> setBlocks(b=>b.map(x=>x.id===id?{...x, dayStatuses:{...x.dayStatuses, [dateStr]:status}}:x));
  const clearBlockDayStatus = (id, dateStr)=> setBlocks(b=>b.map(x=>{
    if(x.id!==id) return x;
    const { [dateStr]:_, ...rest } = x.dayStatuses||{};
    return { ...x, dayStatuses: Object.keys(rest).length ? rest : undefined };
  }));
  const updateOperator = (id, patch)=> setOperators(ops=>ops.map(o=>o.id===id?{...o,...patch}:o));

  /* ── Pointer drag ── */
  const commitDrag = React.useCallback(()=>{
    if(!drag) return;
    if(drag.type==='drawing'){
      const sw = Math.min(drag.startWeek, drag.endWeek);
      const ew = Math.max(drag.startWeek, drag.endWeek);
      if(!isOverlapping(drag.opId, sw, ew)) addBlock(drag.opId, sw, ew, 'draft');
    }
  },[drag, vacationBlocks]);
  React.useEffect(()=>{
    if(!drag) return;
    const onMove = (e)=>{
      moved.current = true;
      if(longPressT.current){ clearTimeout(longPressT.current); longPressT.current=null; }
      const el = document.elementFromPoint(e.clientX, e.clientY);
      const cell = el?.closest('[data-week][data-op]');
      if(!cell) return;
      const week = +cell.dataset.week;
      const opId = cell.dataset.op;
      if(drag.type==='drawing' && opId===drag.opId){
        if(!isOverlapping(drag.opId, drag.startWeek, week))
          setDrag(d=>({...d, endWeek: week}));
      } else if(drag.type==='moving'){
        const delta = week - (drag.pointerOffsetWeek + drag.origStart);
        const ns = drag.origStart + delta, ne = drag.origEnd + delta;
        if(!isOverlapping(opId, ns, ne, drag.blockId)){
          updateBlock(drag.blockId, { operatorId: opId, startWeek: ns, endWeek: ne });
        }
      } else if(drag.type==='resizing'){
        const block = vacationBlocks.find(b=>b.id===drag.blockId);
        if(!block) return;
        if(drag.edge==='left'){
          const ns = Math.min(week, block.endWeek);
          if(!isOverlapping(block.operatorId, ns, block.endWeek, block.id))
            updateBlock(drag.blockId, { startWeek: ns });
        } else {
          const ne = Math.max(week, block.startWeek);
          if(!isOverlapping(block.operatorId, block.startWeek, ne, block.id))
            updateBlock(drag.blockId, { endWeek: ne });
        }
      }
    };
    const onUp = ()=>{
      if(longPressT.current){ clearTimeout(longPressT.current); longPressT.current=null; }
      commitDrag(); setDrag(null);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return ()=>{
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  },[drag, vacationBlocks, commitDrag]);

  const onCellPointerDown = (e, opId, week)=>{
    if(e.button!==0) return;
    e.preventDefault();
    moved.current = false;
    const block = vacationBlocks.find(b=>b.operatorId===opId && week>=b.startWeek && week<=b.endWeek);
    if(block){
      setDrag({type:'moving', blockId:block.id, opId, origStart:block.startWeek, origEnd:block.endWeek, pointerOffsetWeek: week-block.startWeek});
      longPressT.current = setTimeout(()=>{
        if(!moved.current){ setDrag(null); setPopover({x:e.clientX, y:e.clientY, block}); }
      }, 450);
    } else {
      if(!isOverlapping(opId, week, week)) setDrag({type:'drawing', opId, startWeek:week, endWeek:week});
    }
  };
  const onCellPointerUp = (e)=>{
    if(longPressT.current){ clearTimeout(longPressT.current); longPressT.current=null; }
    if(drag?.type==='moving' && !moved.current){
      const block = vacationBlocks.find(b=>b.id===drag.blockId);
      setDrag(null);
      if(block) setPopover({x:e.clientX, y:e.clientY, block});
    } else if(drag?.type==='drawing' && !moved.current){
      addBlock(drag.opId, drag.startWeek, drag.startWeek, 'draft');
      setDrag(null);
    }
  };
  const onResizePointerDown = (e, blockId, edge, block)=>{
    e.stopPropagation(); e.preventDefault();
    moved.current = false;
    setDrag({type:'resizing', blockId, edge, origStart:block.startWeek, origEnd:block.endWeek});
  };

  /* ── Groups ── */
  const groups = shiftMode==='separate'
    ? [{label:'S1', ops:operators.filter(o=>o.shift==='S1'), shift:'S1'},
       {label:'S2', ops:operators.filter(o=>o.shift==='S2'), shift:'S2'}]
    : [{label: shiftMode==='summer'?'Summer Schedule':'All Operators', ops: operators, shift: null}];

  const sliderMax = 52 - VISIBLE + 1;

  /* ── Legend ── */
  const legend = [
    {s:'draft', l:'Utkast'},
    {s:'pending', l:'Väntande'},
    {s:'approved', l:'Godkänd'},
    {s:'requested', l:'Begärd'},
  ];

  return (
    <div className="app">
      <TopBar shiftMode={shiftMode} onShiftModeChange={setShiftMode}
        onOpenTweaks={()=>setTweaksOpen(true)} siteName="Uppsala"
        mode={tweaks.mode} onToggleMode={()=>setTweaks(t=>({...t, mode: t.mode==='dark'?'light':'dark'}))} />

      <div className="main">
        <Sidebar
          operators={operators}
          collapsed={sidebarCollapsed}
          onToggleCollapse={()=>setSC(c=>!c)}
          openOpId={openOpId} onOpen={setOpenOpId}
          onUpdateOperator={updateOperator}
          search={search} onSearch={setSearch}
        />

        <section className="calendar">
          <div className="cal-toolbar">
            <div className="week-badge">
              <em>now viewing</em>
              {zoom==='day' ? `v.${weeks[0]}` : `v.${weeks[0]} – v.${weeks[weeks.length-1]}`}
            </div>
            <input type="range" className="range-slider"
              min={1} max={sliderMax} value={startWeek}
              onChange={e=>setStartWeek(+e.target.value)} />
            <div className="zoom-toggle">
              <button className={zoom==='week'?'active':''} onClick={()=>setZoom('week')}>Week</button>
              <button className={zoom==='day'?'active':''} onClick={()=>setZoom('day')}>Day</button>
            </div>
            <div className="legend">
              {legend.map(x=>(
                <span key={x.s} className="swatch">
                  <span className="sw" style={{background:`var(--st-${x.s}-bg)`, borderColor:`var(--st-${x.s}-bd)`, ...(x.s==='requested'?{backgroundImage:'repeating-linear-gradient(45deg, var(--st-req-bg) 0 4px, transparent 4px 8px)'}:{})}} />
                  {x.l}
                </span>
              ))}
            </div>
          </div>

          <div className={"grid-wrap"+(drag?' dragging':'')}>
            {zoom==='week' ? (
              <WeekZoomGrid
                operators={operators} vacationBlocks={vacationBlocks}
                weeks={weeks} holidayMap={holidayMap} groups={groups}
                drag={drag} currentWeek={currentWeek}
                onCellPointerDown={onCellPointerDown}
                onCellPointerUp={onCellPointerUp}
                onResizePointerDown={onResizePointerDown}
              />
            ) : (
              <DayZoomGrid
                operators={operators} vacationBlocks={vacationBlocks}
                weeks={weeks} holidayMap={holidayMap} groups={groups}
                setPopover={setPopover} onAddBlock={addBlock}
              />
            )}
          </div>
        </section>
      </div>

      {popover && (
        <BlockPopover x={popover.x} y={popover.y} block={popover.block} dateStr={popover.dateStr}
          onSetStatus={setBlockStatus} onDelete={deleteBlock}
          onSetDayStatus={setBlockDayStatus} onClearDayStatus={clearBlockDayStatus}
          onClose={()=>setPopover(null)} />
      )}

      <Tweaks open={tweaksOpen} onClose={()=>setTweaksOpen(false)}
        tweaks={tweaks} setTweaks={setTweaks} themes={THEMES} />

      <Toast msg={toast} />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
