# Semester Planner — flexible resource & vacation planning

A planning board for **shift-based, skills-constrained teams**. It was built for a
pharma/manufacturing context where each operator is *certified* for specific
processes (Avsyning, Kapselresaren, Serialisering, Etikettering, Granskning/uttag
av dok), works a shift (S1/S2), and every process needs a minimum number of
certified bodies present each week. The hard question it answers:

> _Can I approve this person's vacation without leaving a critical process
> understaffed?_

## What's in the box

- **Coverage-aware calendar grid** — drag to create vacation blocks, resize/move
  them, set status (draft → pending → approved → requested), per-day overrides and
  notes. Coverage rows under each shift show `covered / required` per process and
  per week, colour-coded green / yellow / red. Multi-certified operators are
  assigned dynamically to the process that needs them most.
- **Demand editor** — per-process, per-week minimum staffing.
- **Swedish public holidays** (via `date-holidays`), week & day zoom, shift modes
  (separate / combined / summer), undo-redo, CSV & JSON import/export, share
  links, four themes, responsive layout.

## ✨ Planning Assistant (the prescriptive layer)

The grid is *descriptive* — it shows you coverage after you place vacations. The
**Planning Assistant** (the `✨ Insights` button, top right) makes the tool
*prescriptive*. Open the drawer and it scans the whole 52-week season and tells
you what to do:

- **Approval queue** — every pending/requested vacation is graded **Safe**,
  **Leaves a gap**, or **Would understaff**, listing exactly which process/weeks
  would degrade. Approve safe requests in one click; risky ones warn first. The
  top-bar badge counts how many requests can't be safely approved.
- **Cross-training to remove risk** — greedy what-if analysis: _"Train Erik on
  Avsyning → resolves 4 understaffed weeks."_ One click applies the certification.
- **Single points of failure** — processes with ≤1 certified operator in a shift
  (the classic skills-matrix risk).
- **Coverage risks** — the worst `covered/required` cells across the season,
  click to jump the grid to that week.

This mirrors how mature workforce-management tools (Shiftboard, Infor, ADP) and
manufacturing skills-matrix practice (ILUO proficiency, *coverage depth* and
*flex-ratio* KPIs) turn raw schedules into decisions — minimum-coverage conflict
detection *before* leave is approved, single-point-of-failure detection, and
cross-training recommendations with explicit coverage-depth targets.

## Architecture

Pure-function domain logic, thin React UI, everything persisted to
`localStorage`. No backend.

| Module | Responsibility |
| --- | --- |
| `src/coverage.js` | Assigns operators to processes per week, computes coverage levels |
| `src/insights.js` | **Planning Assistant engine** — risk scan, SPOF/skill depth, cross-training, approval guard (all pure, fully unit-tested) |
| `src/historyReducer.js` | Undo/redo over app state |
| `src/holidays.js` / `src/csv.js` / `src/storage.js` | Holidays, CSV I/O, persistence & share links |
| `src/components/calendar/*` | Grid, coverage rows, demand editor, popovers, zoom |
| `src/components/InsightsPanel.jsx` | The Planning Assistant drawer |

## Develop

```bash
npm install
npm run dev        # Vite dev server
npm test           # Vitest (watch)
npm run test:ci    # single run
npm run lint
npm run build
```
