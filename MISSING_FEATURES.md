# Vacation Planner — Feature Gap Analysis

> Built after reading the whole repo (graph generated with [graphify](https://github.com/safishamsi/graphify):
> `graphify update .` → `graphify export callflow-html`). This documents what the app
> **does today** and the **features that are missing** relative to what a production shift /
> vacation-planning tool is expected to do.

## What the app is

A client-only React + Vite single-page app — a Swedish **"Semester Planner"** for scheduling
operator leave against process-coverage requirements on a 52-week calendar. There is **no backend**;
all state lives in `localStorage` and is shared by encoding a snapshot into the URL hash.

Domain model (`src/types.js`):
- **Operators** — `{ name, shift: S1|S2, active, certifications[] }` across 5 fixed processes
  (`Avsyning`, `Kapselresaren`, `Serialisering`, `Etikettering`, `Granskning/uttag av dok`).
- **Vacation blocks** — week ranges with status (`draft|pending|approved|requested`),
  optional per-day status overrides, and notes.
- **Demand** — required headcount per process per week.
- **Coverage** — `green/yellow/red` per process/week from a smart assignment of multi-certified ops.

## What already works (so we don't ask for it twice)

- Drag-to-create / move / resize vacation blocks; week-zoom and day-zoom views.
- Coverage engine with dynamic assignment of multi-certified operators to the neediest process.
- Demand editing; shift modes (separate / combined / summer).
- Swedish public holidays via `date-holidays`.
- CSV import/export of operators (Swedish + English headers, fuzzy cert matching), JSON export/import.
- Undo/redo (50-step history) with keyboard shortcuts; share-via-URL; 4 themes; responsive layout.
- Vitest unit/component tests for most modules.

---

## Missing features

### High impact (core planning gaps)
1. **Pending requests don't affect coverage.** `getAllCoverageForWeek` only treats `status === 'approved'`
   as an absence (`src/coverage.js:33`). Planners can't see the *impact of pending/requested leave* before
   approving — defeating much of the point of a request workflow.
2. **No approval workflow.** Statuses exist but there's no submit → review → approve/reject flow, no
   notion of *who* requested or approved, no notifications, and no audit trail of status changes.
3. **No multi-user / backend / real collaboration.** Single-browser `localStorage` only; "sharing" is a
   one-way URL snapshot, not live shared state. No auth, no roles (operator vs. manager), no concurrent edits.
4. **No year dimension.** Everything is hardcoded to weeks 1–52 of the *current* year
   (`new Date().getFullYear()` in `holidays.js`; weeks derived from `startWeek`). No cross-year planning,
   no week 53, and holidays are only computed for the current year.
5. **No hard coverage guards.** Overlap is prevented only for the *same* operator. There's no limit on
   simultaneous absences per shift/process and no blocking when a week goes `red` — only color feedback.

### Medium impact (expected functionality)
6. **Demand is week-level only**, even though day-zoom coverage exists. No per-day demand and no automatic
   demand reduction on holidays (holidays are flagged but not factored into required headcount).
7. **No printable / exportable schedule or coverage report.** No PDF, no print stylesheet, no coverage
   heatmap export — only operator-list CSV. Managers can't hand out or archive a plan.
8. **Processes/certifications are hardcoded** (`PROCESSES` in `src/data.js`). No UI to add/rename processes
   or model certification *levels* (e.g. trainee vs. certified), which the coverage engine could use.
9. **Limited operator management.** No employee ID/contact/seniority fields, no half-day or percentage
   leave, and the sidebar only supports name search — no filter/sort by shift, certification, or who's off.
10. **"Summer" shift mode is cosmetic** — it only changes a label (`CalendarGrid.jsx`), with no distinct
    summer-staffing logic.

### Lower impact / polish
11. **Share link isn't actually compressed** (the comment in `storage.js` says "compressed" but it's plain
    `base64`). With many operators the URL can exceed browser length limits.
12. **No state versioning / migration.** Persisted or imported JSON has no schema version, so a stale or
    foreign file can silently break the app on load.
13. **Mixed-language UI, no i18n.** Strings are a hardcoded mix of Swedish and English with no language toggle.
14. **Accessibility gaps in the grid.** Block creation is pointer-only (no keyboard path), with limited ARIA.
15. **No React error boundary** — a render error blanks the whole app.

### Repo / project hygiene
- **`README.md` is the stock Vite template** — no project-specific docs.
- **`ARCHITECTURE.md` is misleading** — it diagrams a Frontend → API → Database backend that does not
  exist; this app is entirely client-side.
- **No CI** — `package.json` has a `test:ci` script but there's no `.github/workflows`.
- **No TypeScript** despite the README recommending it; types live only as JSDoc in `types.js`.

---

## Regenerating this picture

```bash
uv tool install graphifyy          # one-time
graphify update .                  # build graphify-out/graph.json (AST only, no API key)
graphify export callflow-html      # -> graphify-out/vacation-planner-callflow.html
```

Open `graphify-out/vacation-planner-callflow.html` for the interactive call-flow diagrams, or read
`graphify-out/GRAPH_REPORT.md` for god-nodes, communities, and knowledge gaps. (`graphify-out/` is
git-ignored as generated output.)
