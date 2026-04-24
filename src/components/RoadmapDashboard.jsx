import { useMemo } from 'react';

/**
 * Static roadmap content derived from vacation-planner-asks.md.
 * State is one of 'done' | 'partial' | 'planned'. Edit this list — it's the
 * source of truth for what ships in the UI.
 */
const ROADMAP = [
  {
    title: 'Fundament',
    kicker: '01 · Stabil grund',
    items: [
      { id: 'S1', label: 'Vite + React + Tailwind + pointer-based DnD',          state: 'done' },
      { id: 'S2', label: 'Vercel-deploy från master',                              state: 'done' },
      { id: 'S5', label: 'README + CSV-format dokumenterat',                      state: 'done' },
      { id: 'S6', label: 'ARCHITECTURE.md',                                       state: 'done' },
      { id: 'S7', label: 'Vitest + jsdom, full testsvit grön',                    state: 'done' },
    ],
  },
  {
    title: 'Datamodell',
    kicker: '02 · Dag-upplösta block + svenska statusar',
    items: [
      { id: 'D1',  label: '16 operatörer, S1/S2 split, certifieringar',           state: 'done' },
      { id: 'D2',  label: 'Fyra ursprungliga processer + Granskning/uttag av dok',state: 'done' },
      { id: 'D4',  label: 'Block med startDate/endDate (YYYY-MM-DD) + migration', state: 'done' },
      { id: 'D5',  label: 'Ledighetskategorier: Semester / VAB / Sjuk / Komp',    state: 'done' },
      { id: 'D6',  label: 'Status-arbetsflöde: draft → ansökt → beviljad',        state: 'done' },
      { id: 'D7',  label: 'Block-kommentar + triangel-märke när kommentar finns', state: 'partial' },
      { id: 'D8',  label: 'Demand per process per vecka (default 2)',             state: 'done' },
      { id: 'D9',  label: 'Summer-skiftläge fullt kopplat till coverage',         state: 'planned' },
    ],
  },
  {
    title: 'Kalender & DnD',
    kicker: '03 · Dag-vy som primärt redigerings-ytor',
    items: [
      { id: 'C1',  label: 'Svenska veckoetiketter, ISO 8601, prev/next +4',       state: 'done' },
      { id: 'C2',  label: 'Grid: kolumner=veckor, rader=operatörer',              state: 'done' },
      { id: 'C4',  label: 'Tidsreglage i toolbar',                                state: 'done' },
      { id: 'C6',  label: 'Dag-vy redigerbar (draw/resize/move)',                 state: 'done' },
      { id: 'DD1', label: 'Window-level pointer-lyssnare',                        state: 'done' },
      { id: 'DD4', label: '500 ms long-press → BlockPopover',                     state: 'done' },
      { id: 'DD7', label: '44 px touch-targets (coarse pointer)',                 state: 'done' },
      { id: 'B5',  label: 'Dubbelklick på block → kommentar-editor',              state: 'planned' },
      { id: 'B6',  label: 'Hörn-triangel när kommentar finns',                    state: 'planned' },
      { id: 'B2',  label: 'Högerklicksmeny (status / delete)',                    state: 'planned' },
    ],
  },
  {
    title: 'Operator-panel',
    kicker: '04 · Certifieringar + ikoner',
    items: [
      { id: 'O1',  label: 'Lägg till / döp om / ta bort operatörer i UI',         state: 'done' },
      { id: 'O2',  label: 'Inline-rad: namn, skift, aktiv, cert-checkboxar',      state: 'done' },
      { id: 'O3',  label: 'Kollaps-chevron (48 px) — bevarar val',                state: 'done' },
      { id: 'O4',  label: 'Neo-Kinetic styling, S1/S2 badges',                    state: 'done' },
      { id: 'H3',  label: 'Distinkta Lucide-ikoner per certifiering',             state: 'done' },
      { id: 'H2',  label: 'Certifieringsmatris (ops × certs)',                    state: 'done' },
    ],
  },
  {
    title: 'Topbar & paneler',
    kicker: '05 · Reducerad topbar + vänster Inställningar',
    items: [
      { id: 'T7',  label: 'Topbar: brand + undo/redo + share + overflow',         state: 'done' },
      { id: 'T4',  label: 'Tydlig Share-knapp',                                   state: 'done' },
      { id: 'T5',  label: 'Overflow ⋮: Import/Export CSV/JSON, Save, Reset',      state: 'done' },
      { id: 'NK7', label: 'Vänster Inställningar — startvecka, demand, typer',    state: 'done' },
    ],
  },
  {
    title: 'Helgdagar & täckning',
    kicker: '06 · Svensk helgdags-medvetenhet',
    items: [
      { id: 'HOL1', label: 'date-holidays via dynamic import (kod-split)',        state: 'done' },
      { id: 'HOL2', label: 'Innevarande + nästa år förvärmt',                     state: 'planned' },
      { id: 'HOL3', label: 'Visuell markering + etikett i dag- och vecko-vy',     state: 'done' },
      { id: 'CV1',  label: 'Grön / gul / röd tröskel',                            state: 'done' },
      { id: 'CV3',  label: 'Två-pass tilldelning (enkel-cert → multi-cert)',      state: 'done' },
      { id: 'CV4',  label: 'Coverage-tooltip: total, namn in/ut, helgdag',        state: 'done' },
      { id: 'CV6',  label: 'Coverage på datum + beviljad',                        state: 'done' },
    ],
  },
  {
    title: 'Block, flaggor & overlays',
    kicker: '07 · Pending-lager + legend',
    items: [
      { id: 'B1', label: 'Färg per status: draft/ansökt/beviljad',                state: 'done' },
      { id: 'B3', label: 'BlockPopover: fixed position, swatches, Esc-stängning',  state: 'done' },
      { id: 'B4', label: 'Hatchad amber pending-lager bakom beviljad',            state: 'planned' },
      { id: 'B7', label: 'Ledighetstyper redigerbara (label + färg)',             state: 'done' },
      { id: 'B8', label: 'Legend täcker alla lager',                              state: 'partial' },
    ],
  },
  {
    title: 'Import / export',
    kicker: '08 · CSV + JSON + share',
    items: [
      { id: 'CSV1', label: 'CSV-import: Namn, Skift, Certifieringar',             state: 'done' },
      { id: 'CSV2', label: 'Download CSV-mall',                                    state: 'done' },
      { id: 'CSV3', label: 'Export / Import JSON',                                 state: 'done' },
      { id: 'CSV4', label: 'Share-länk med secure-context + fallback',            state: 'done' },
    ],
  },
];

const STATE_META = {
  done:    { label: 'Klart',    cls: 'done' },
  partial: { label: 'Pågår',    cls: 'partial' },
  planned: { label: 'Planerat', cls: 'planned' },
};

export default function RoadmapDashboard() {
  const totals = useMemo(() => {
    const out = { done: 0, partial: 0, planned: 0, total: 0 };
    for (const group of ROADMAP) {
      for (const item of group.items) {
        out[item.state] += 1;
        out.total += 1;
      }
    }
    return out;
  }, []);

  const pctDone = Math.round((totals.done / totals.total) * 100);

  return (
    <div className="nk-roadmap" aria-label="Roadmap">
      <header className="nk-rm-header">
        <div>
          <div className="nk-rm-kicker">Vacation Planner · Roadmap</div>
          <h2 className="nk-rm-title">Vad är klart, vad pågår, vad planerar vi</h2>
        </div>
        <div className="nk-rm-summary">
          <div className="nk-rm-big">{pctDone}%</div>
          <div className="nk-rm-meter">
            <span className="nk-rm-meter-fill" style={{ width: `${pctDone}%` }} />
          </div>
          <div className="nk-rm-counts">
            <span className="nk-rm-count done">{totals.done} klart</span>
            <span className="nk-rm-count partial">{totals.partial} pågår</span>
            <span className="nk-rm-count planned">{totals.planned} planerat</span>
          </div>
        </div>
      </header>

      <div className="nk-rm-scroll">
        <div className="nk-rm-grid">
          {ROADMAP.map(group => (
            <section key={group.title} className="nk-rm-card">
              <div className="nk-rm-card-header">
                <div className="nk-rm-card-kicker">{group.kicker}</div>
                <h3 className="nk-rm-card-title">{group.title}</h3>
              </div>
              <ul className="nk-rm-list">
                {group.items.map(item => (
                  <li key={item.id} className={`nk-rm-item ${STATE_META[item.state].cls}`}>
                    <span className="nk-rm-id">{item.id}</span>
                    <span className="nk-rm-label">{item.label}</span>
                    <span className={`nk-rm-pill ${STATE_META[item.state].cls}`}>
                      {STATE_META[item.state].label}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
