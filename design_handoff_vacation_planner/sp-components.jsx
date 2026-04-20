/* Components: TopBar, Sidebar, Popover, Tweaks, Toast */
const { useState, useEffect, useRef, useMemo, useCallback } = React;
const { STATUSES, STATUS_LABELS, STATUS_DESC, initials, PROCESSES } = window.SPData;

/* ─ TopBar ───────────────────────────────────────────── */
function TopBar({ shiftMode, onShiftModeChange, onOpenTweaks, siteName, mode, onToggleMode }){
  const modes = [
    { v:'separate', l:'Separate' },
    { v:'combined', l:'Combined' },
    { v:'summer',   l:'Summer'   },
  ];
  return (
    <header className="topbar">
      <div className="brand">
        <span className="brand-kicker">Uppsala · Works Planning</span>
        <span className="brand-wordmark">
          <span className="dot" />
          Semester<span style={{color:'var(--yellow)'}}>.</span>Planner
        </span>
      </div>

      <div className="shift-pill" role="tablist" aria-label="Shift mode">
        {modes.map(m=>(
          <button key={m.v} role="tab" aria-selected={shiftMode===m.v}
            className={shiftMode===m.v?'active':''}
            onClick={()=>onShiftModeChange(m.v)}>{m.l}</button>
        ))}
      </div>

      <div className="spacer" />

      <div className="topbar-meta">
        <span>Site</span><b>{siteName}</b>
        <span>·</span>
        <span>Year</span><b>2026</b>
      </div>

      <button className="btn ghost sm" onClick={onToggleMode} title="Toggle light/dark">{mode==='dark'?'☾':'☀'}</button>
      <button className="btn ghost sm" onClick={onOpenTweaks}>⚙ Tweaks</button>
      <button className="btn primary">Share link</button>
    </header>
  );
}

/* ─ Operator Sidebar ─────────────────────────────────── */
function Sidebar({
  operators, collapsed, onToggleCollapse,
  openOpId, onOpen, onUpdateOperator, search, onSearch,
}){
  const filtered = operators.filter(o =>
    !search || o.name.toLowerCase().includes(search.toLowerCase())
         || o.certifications.some(c=>c.toLowerCase().includes(search.toLowerCase())));
  const s1 = filtered.filter(o=>o.shift==='S1');
  const s2 = filtered.filter(o=>o.shift==='S2');

  return (
    <aside className={"sidebar" + (collapsed?' collapsed':'')}>
      <div className="sidebar-head">
        <button className="collapse-btn" onClick={onToggleCollapse} aria-label="Collapse">
          {collapsed?'›':'‹'}
        </button>
        <div className="sb-full ed-title">
          <em>Team · 16</em>
          Crew<br/><span style={{color:'var(--indigo)'}}>on deck</span>
        </div>
      </div>

      <div className="sb-full op-filter">
        <span className="glyph">⌕</span>
        <input placeholder="Search crew or skill…" value={search}
          onChange={e=>onSearch(e.target.value)} />
        {search && <span className="glyph" style={{cursor:'pointer'}} onClick={()=>onSearch('')}>✕</span>}
      </div>

      <div className="sb-full op-list">
        {[['S1',s1],['S2',s2]].map(([label, list])=>(
          <React.Fragment key={label}>
            <div className="op-group-title">Shift {label}<span className="count">{list.length}</span></div>
            {list.map(op=>(
              <React.Fragment key={op.id}>
                <div className={"op-card"+(openOpId===op.id?' open':'')}
                     onClick={()=>onOpen(op.id===openOpId?null:op.id)}>
                  <div className={"op-avatar"+(op.shift==='S2'?' s2':'')}>{initials(op.name)}</div>
                  <div className="op-name">{op.name}</div>
                  <div className={"op-shift "+(op.shift==='S1'?'s1':'s2')}>{op.shift}</div>
                </div>
                {openOpId===op.id && (
                  <div className="op-expand">
                    <div className="row" style={{gap:8}}>
                      <div style={{flex:1}}>
                        <label className="mini">Name</label>
                        <input type="text" value={op.name}
                          onChange={e=>onUpdateOperator(op.id,{name:e.target.value})}/>
                      </div>
                      <div style={{width:72}}>
                        <label className="mini">Shift</label>
                        <select value={op.shift}
                          onChange={e=>onUpdateOperator(op.id,{shift:e.target.value})}>
                          <option>S1</option><option>S2</option>
                        </select>
                      </div>
                    </div>
                    <label className="mini">Certifications</label>
                    <div className="certs">
                      {PROCESSES.map(p=>{
                        const on = op.certifications.includes(p);
                        return (
                          <span key={p}
                            className={"cert-chip"+(on?' on':'')}
                            onClick={()=>onUpdateOperator(op.id,{
                              certifications: on ? op.certifications.filter(c=>c!==p) : [...op.certifications, p]
                            })}>{p}</span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </React.Fragment>
            ))}
          </React.Fragment>
        ))}
      </div>

      <div className="sb-full sidebar-foot">
        <button className="btn sm" style={{flex:1}}>Import CSV</button>
        <button className="btn sm primary" style={{flex:1}}>+ Add</button>
      </div>
    </aside>
  );
}

/* ─ Block Popover ────────────────────────────────────── */
function BlockPopover({ x, y, block, dateStr, onSetStatus, onDelete, onSetDayStatus, onClearDayStatus, onClose }){
  const ref = useRef(null);
  useEffect(()=>{
    const h = e => { if(ref.current && !ref.current.contains(e.target)) onClose(); };
    const k = e => { if(e.key==='Escape') onClose(); };
    document.addEventListener('mousedown', h);
    document.addEventListener('keydown', k);
    return ()=>{ document.removeEventListener('mousedown', h); document.removeEventListener('keydown', k); };
  },[onClose]);
  if(!block) return null;
  const dayStatus = dateStr ? (block.dayStatuses?.[dateStr] || block.status) : null;
  const hasOverride = dateStr && block.dayStatuses && block.dayStatuses[dateStr];
  const posX = Math.min(window.innerWidth - 280, x);
  const posY = Math.min(window.innerHeight - 360, y);

  return (
    <div ref={ref} className="popover" style={{left: posX, top: posY}}>
      {dateStr && (<>
        <h4>Day · {dateStr}</h4>
        {STATUSES.map(s=>(
          <button key={'d-'+s} className={"popover-item"+(dayStatus===s?' active':'')}
            onClick={()=>{
              if(s===block.status && hasOverride) onClearDayStatus(block.id, dateStr);
              else if(s!==block.status) onSetDayStatus(block.id, dateStr, s);
              onClose();
            }}>
            <span className="sw" style={{background:`var(--st-${s}-bg)`,borderColor:`var(--st-${s}-bd)`}}/>
            {STATUS_LABELS[s]}
            {s===block.status && !hasOverride && <span className="tail">block default</span>}
            {hasOverride && s===block.dayStatuses[dateStr] && <span className="tail" style={{color:'var(--indigo)'}}>●</span>}
          </button>
        ))}
        <div className="popover-sep" />
      </>)}
      <h4>{dateStr?'Entire block':'Set status'}</h4>
      {STATUSES.map(s=>(
        <button key={s} className={"popover-item"+(!dateStr && block.status===s?' active':'')}
          onClick={()=>{ onSetStatus(block.id, s); onClose(); }}>
          <span className="sw" style={{background:`var(--st-${s}-bg)`,borderColor:`var(--st-${s}-bd)`}}/>
          {STATUS_LABELS[s]}
          <span className="tail">{STATUS_DESC[s]}</span>
        </button>
      ))}
      <div className="popover-sep" />
      <button className="popover-item danger"
        onClick={()=>{ onDelete(block.id); onClose(); }}>✕ Delete block</button>
    </div>
  );
}

/* ─ Tweaks Panel ─────────────────────────────────────── */
function Tweaks({ open, onClose, tweaks, setTweaks, themes }){
  if(!open) return null;
  const set = (k,v) => setTweaks({...tweaks, [k]: v});
  return (
    <div className="tweaks">
      <h3>
        Tweaks <small>studio</small>
        <button className="tw-close" onClick={onClose}>✕</button>
      </h3>
      <div className="body">
        <div className="tw-row">
          <label>Theme <b>{(themes[tweaks.theme]||{}).label||'—'}</b></label>
          <div className="theme-grid">
            {Object.entries(themes).map(([id, t])=>{
              const pal = tweaks.mode==='dark'?t.dark:t.light;
              return (
                <button key={id}
                  className={"theme-chip"+(tweaks.theme===id?' active':'')}
                  onClick={()=>set('theme', id)}
                  title={t.label}>
                  <span className="sw" style={{background:pal.paper}}/>
                  <span className="sw" style={{background:pal.indigo}}/>
                  <span className="sw" style={{background:pal.coral}}/>
                  <span className="sw" style={{background:pal.yellow}}/>
                  <em>{t.label}</em>
                </button>
              );
            })}
          </div>
        </div>
        <div className="tw-row">
          <label>Mode <b>{tweaks.mode==='dark'?'DARK':'LIGHT'}</b></label>
          <div className="seg">
            <button className={tweaks.mode==='light'?'active':''} onClick={()=>set('mode','light')}>Light</button>
            <button className={tweaks.mode==='dark'?'active':''} onClick={()=>set('mode','dark')}>Soft dark</button>
          </div>
        </div>
        <div className="tw-row">
          <label>Density <b>{tweaks.density.toUpperCase()}</b></label>
          <div className="seg">
            <button className={tweaks.density==='compact'?'active':''} onClick={()=>set('density','compact')}>Compact</button>
            <button className={tweaks.density==='default'?'active':''} onClick={()=>set('density','default')}>Default</button>
            <button className={tweaks.density==='spacious'?'active':''} onClick={()=>set('density','spacious')}>Spacious</button>
          </div>
        </div>
        <div className="tw-row">
          <label>Accent emphasis <b>{tweaks.accent.toUpperCase()}</b></label>
          <div className="seg">
            <button className={tweaks.accent==='indigo'?'active':''} onClick={()=>set('accent','indigo')}>Primary</button>
            <button className={tweaks.accent==='coral'?'active':''} onClick={()=>set('accent','coral')}>Coral</button>
            <button className={tweaks.accent==='yellow'?'active':''} onClick={()=>set('accent','yellow')}>Yellow</button>
          </div>
        </div>
        <div className="tw-row">
          <label>Display font <b>{tweaks.font.toUpperCase()}</b></label>
          <div className="seg">
            <button className={tweaks.font==='epilogue'?'active':''} onClick={()=>set('font','epilogue')}>Epilogue</button>
            <button className={tweaks.font==='mono'?'active':''} onClick={()=>set('font','mono')}>Space Mono</button>
          </div>
        </div>
        <div className="tw-row">
          <label>Asymmetry <b>{Math.round(tweaks.asym*10)}/10</b></label>
          <input type="range" min="0" max="1" step="0.1" value={tweaks.asym}
            onChange={e=>set('asym', +e.target.value)} />
        </div>
        <div className="tw-row">
          <label>Grain <b>{Math.round(tweaks.grain*100)}%</b></label>
          <input type="range" min="0" max="1" step="0.05" value={tweaks.grain}
            onChange={e=>set('grain', +e.target.value)} />
        </div>
      </div>
    </div>
  );
}

/* ─ Toast ────────────────────────────────────────────── */
function Toast({ msg }){ return msg ? <div className="toast">{msg}</div> : null; }

Object.assign(window, { TopBar, Sidebar, BlockPopover, Tweaks, Toast });
