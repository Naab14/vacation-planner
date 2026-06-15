# Vacation Planner Evolution Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Evolve the existing client-only vacation planner into a small manager-facing planning tool with Dashboard, Planning, Certification Matrix, Employees, Settings, and Export/Print modules while preserving the current calendar workflow and visual identity.

**Architecture:** Keep the app as a React/Vite SPA with flat serializable state, undo/redo through `historyReducer`, and persistence through a store abstraction backed by localStorage. Move process/certification data out of hardcoded constants and into versioned app state before building matrix, dashboard, and conflict features.

**Tech Stack:** React 19, Vite 8, Tailwind CSS utilities, CSS variables, Vitest, Testing Library, ESLint, `date-holidays`, custom pointer drag.

---

## Graph-Grounded Findings

- `PROCESSES` is the key bridge across `src/data.js`, `src/coverage.js`, `src/csv.js`, `OperatorPanel`, `CoverageRows`, `DemandEditor`, and tests.
- `App.jsx` owns all state and updater callbacks, so module routing should first be a thin shell around the existing board.
- `CalendarGrid.jsx` owns drag state and should remain the core planning surface.
- `coverage.js`, `storage.js`, `csv.js`, and `historyReducer.js` are already pure or near-pure enough for focused tests.

## Phase 0: Shell and Documentation

**Files:**
- Modify: `src/App.jsx`
- Modify: `src/components/TopBar.jsx`
- Create: `src/modules/PlanningBoard.jsx`
- Create: `src/modules/Dashboard.jsx`
- Create: `src/modules/CertificationMatrix.jsx`
- Create: `src/modules/Employees.jsx`
- Create: `src/modules/Settings.jsx`
- Create: `src/modules/ExportPrint.jsx`
- Test: `src/test/App.test.jsx`
- Test: `src/test/TopBar.test.jsx`

- [ ] Add a lightweight module switch state in `App.jsx` with default module `planning`.
- [ ] Move the existing `OperatorPanel` + `CalendarGrid` layout into `PlanningBoard.jsx` without changing props or behavior.
- [ ] Add nav buttons to `TopBar.jsx` for Dashboard, Planning, Matrix, Employees, Settings, and Export/Print.
- [ ] Render placeholder module bodies that use existing theme variables and compact layouts.
- [ ] Keep `OperatorPanel` visible in Planning only until Employees is implemented.
- [ ] Run `npm run test:ci -- src/test/App.test.jsx src/test/TopBar.test.jsx`.
- [ ] Run `npm run lint` and `npm run build`.

## Phase 1: Versioned Data Layer and Processes as Data

**Files:**
- Modify: `src/data.js`
- Create: `src/schema.js`
- Create: `src/store/localStore.js`
- Create: `src/store/index.js`
- Modify: `src/storage.js`
- Modify: `src/App.jsx`
- Modify: `src/coverage.js`
- Modify: `src/csv.js`
- Modify: `src/components/calendar/CoverageRows.jsx`
- Modify: `src/components/calendar/DemandEditor.jsx`
- Modify: `src/components/OperatorPanel.jsx`
- Test: `src/test/schema.test.js`
- Test: `src/test/storage.test.js`
- Test: `src/test/coverage.test.js`
- Test: `src/test/csv.test.js`

- [ ] Add `schemaVersion` and `processes: [{ id, name }]` to defaults.
- [ ] Store operator certifications by process ID while migrating legacy certification names.
- [ ] Store demand by process ID while migrating legacy process-name demand.
- [ ] Add migration tests for saved state, imported JSON, and share-link state.
- [ ] Add an async-capable store interface with `getState`, `saveState`, `clearState`, `getUI`, `saveUI`, `getTheme`, and `saveTheme`.
- [ ] Keep localStorage as the only implementation.
- [ ] Update coverage, CSV, demand, and operator editing to receive `processes` explicitly instead of importing `PROCESSES`.
- [ ] Run the full `npm run test:ci`, `npm run lint`, and `npm run build`.

## Phase 2: Certification Matrix, Icons, and Search

**Files:**
- Create: `src/components/OperatorAvatar.jsx`
- Modify: `src/modules/CertificationMatrix.jsx`
- Modify: `src/modules/Employees.jsx`
- Modify: `src/components/OperatorPanel.jsx`
- Modify: `src/components/calendar/WeekZoomGrid.jsx`
- Modify: `src/components/calendar/DayZoomGrid.jsx`
- Modify: `src/csv.js`
- Test: `src/test/CertificationMatrix.test.jsx`
- Test: `src/test/Employees.test.jsx`
- Test: `src/test/OperatorPanel.test.jsx`
- Test: `src/test/CalendarGrid.test.jsx`

- [ ] Add deterministic operator icon data on migration: initials plus a theme-safe color token.
- [ ] Render `OperatorAvatar` in employee list, board rows, and matrix rows.
- [ ] Implement editable operator/process certification grid.
- [ ] Add process create, rename, and remove controls in the matrix with demand/certification migration safeguards.
- [ ] Extend search to match operator name, process name, and certification ID/name.
- [ ] Verify matrix edits immediately change coverage rows.

## Phase 3: Forecast-Aware Coverage and Drag Feedback

**Files:**
- Modify: `src/coverage.js`
- Create: `src/conflicts.js`
- Modify: `src/components/calendar/CalendarGrid.jsx`
- Modify: `src/components/calendar/WeekZoomGrid.jsx`
- Modify: `src/components/calendar/CoverageRows.jsx`
- Modify: `src/components/calendar/Legend.jsx`
- Test: `src/test/coverage.test.js`
- Test: `src/test/conflicts.test.js`
- Test: `src/test/CalendarGrid.test.jsx`

- [ ] Add coverage mode: `confirmed` counts approved only, `projected` counts approved, pending, and requested.
- [ ] Add board toggle and legend for confirmed/projected coverage.
- [ ] Add `settings.lockedWeeks`, `settings.allowedOverlap`, and `settings.minStaffing`.
- [ ] Add pure conflict helpers for locked weeks, overlap, under-minimum staffing, and red process coverage.
- [ ] Change drag behavior to preview candidate state before commit and block hard-locked weeks.
- [ ] Show warning outline and tooltip text for projected red coverage, locked weeks, and overlap violations.
- [ ] Keep override behavior for non-locked warnings.

## Phase 4: Dashboard

**Files:**
- Modify: `src/modules/Dashboard.jsx`
- Create: `src/dashboard.js`
- Test: `src/test/dashboard.test.js`
- Test: `src/test/Dashboard.test.jsx`

- [ ] Derive red/under-staffed weeks from projected coverage.
- [ ] Count pending and requested vacation blocks.
- [ ] List people off this week and next week from planning year/week helpers.
- [ ] Rank biggest capacity gaps by process and week.
- [ ] Add quick links that switch to Planning and position the visible week range.

## Phase 5: Settings

**Files:**
- Modify: `src/modules/Settings.jsx`
- Modify: `src/App.jsx`
- Modify: `src/data.js`
- Modify: `src/holidays.js`
- Test: `src/test/Settings.test.jsx`
- Test: `src/test/holidays.test.js`

- [ ] Add planning year, visible weeks, and start week controls.
- [ ] Add staffing controls for default required count, minimum staffing, allowed overlap, and locked weeks.
- [ ] Add teams/groups data with operator assignment support.
- [ ] Add holidays region setting with Sweden as default.
- [ ] Add appearance controls for theme and status/coverage colors where practical.

## Phase 6: Export/Print and Final Polish

**Files:**
- Modify: `src/modules/ExportPrint.jsx`
- Modify: `src/csv.js`
- Modify: `src/index.css`
- Modify: `README.md`
- Modify: `ARCHITECTURE.md`
- Test: `src/test/ExportPrint.test.jsx`
- Test: `src/test/csv.test.js`

- [ ] Add printable plan table grouped by shift/team and week.
- [ ] Add printable coverage heatmap using the same coverage engine and color thresholds.
- [ ] Preserve existing CSV export.
- [ ] Add print CSS rules for clean paper output.
- [ ] Refresh README and architecture docs after the implementation matches the target state.
- [ ] Run `npm run test:ci`, `npm run lint`, `npm run build`, and `graphify update .`.

## Review Gates

- [ ] Keep each phase reviewable as its own commit or PR section.
- [ ] Do not merge a phase if existing tests fail.
- [ ] Re-run Graphify after architecture-significant phases.
- [ ] Use browser verification for board drag, responsive layout, matrix editing, and print view.
