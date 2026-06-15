# Vacation Planner Agent Guide

## Overview

Vacation Planner is a client-only React/Vite SPA for planning operator vacations by week and day. The app currently keeps all domain state in the browser and persists it through localStorage/share-link helpers. There is no backend, auth layer, API server, or database in this baseline.

The core workflow is the planning board: operators as rows, weeks/days as columns, draggable vacation blocks, inline demand editing, and color-coded coverage rows. Preserve that workflow and the clean themed visual identity while evolving the app into small manager-facing modules.

## Key Directories and Files

- `src/App.jsx` owns app state, undo/redo dispatch, persistence hooks, top-level layout, and state updater callbacks.
- `src/schema.js` contains schema versioning, default processes, seed state, migrations, process IDs, settings defaults, and operator icon generation.
- `src/data.js` keeps lightweight compatibility exports plus themes.
- `src/coverage.js` contains the confirmed/projected coverage engine for assigning single-cert and multi-cert operators.
- `src/conflicts.js` contains locked-week and allowed-overlap helper logic.
- `src/dashboard.js` derives manager health summaries.
- `src/storage.js` handles localStorage, JSON import/export, share links, UI preferences, and theme persistence.
- `src/csv.js` handles operator CSV parsing, fuzzy certification warnings, merging, and CSV download helpers.
- `src/historyReducer.js` contains the capped undo/redo reducer.
- `src/holidays.js` builds Swedish holiday maps through `date-holidays`.
- `src/components/TopBar.jsx` renders app actions, shift mode, theme, and undo/redo controls.
- `src/components/OperatorPanel.jsx` renders the employee/sidebar list, add/edit form, CSV template action, and name/certification search.
- `src/components/OperatorAvatar.jsx` renders deterministic operator initials/color icons.
- `src/components/calendar/CalendarGrid.jsx` owns custom pointer-based create/move/resize drag behavior and week/day zoom switching.
- `src/components/calendar/WeekZoomGrid.jsx` renders week-level operator rows, vacation blocks, coverage rows, and demand editor.
- `src/components/calendar/DayZoomGrid.jsx` renders day-level rows and per-day block interactions.
- `src/components/calendar/CoverageRows.jsx` renders per-process coverage cells and tooltips.
- `src/components/calendar/DemandEditor.jsx` renders inline process/week demand inputs.
- `src/index.css` defines CSS variables for the four themes plus shared grid, drag, tooltip, and responsive styles.
- `src/test/` contains Vitest and Testing Library coverage for core utilities and components.
- `public/icons.svg` is available for lightweight operator or app icons.
- `graphify-out/` is generated analysis output and should be refreshed with `graphify update .` after meaningful code changes.

## Commands

- Install: `npm install`
- Dev server: `npm run dev`
- Build: `npm run build`
- Preview build: `npm run preview`
- Lint: `npm run lint`
- Test watch: `npm test`
- Test once: `npm run test:ci`
- Refresh code graph: `graphify update .`
- Export callflow graph: `graphify export callflow-html`

## Current Architecture

- State shape is flat: `{ schemaVersion, operators, processes, vacationBlocks, demand, teams, settings }`.
- Undo/redo wraps the entire app state through `historyReducer`.
- Persistence is localStorage today, with an async-capable store abstraction in `src/store/` and a synchronous compatibility facade in `storage.js`.
- Demand and certifications are keyed by process ID; `schema.js` migrates legacy process-name data.
- Coverage supports `confirmed` and `projected` modes; projected includes approved, pending, and requested leave.
- Calendar drag is custom pointer logic in `CalendarGrid.jsx`; keep it unless a future cross-module need clearly justifies a dependency.
- Week zoom and day zoom are separate render components under `src/components/calendar/`.
- Styling relies on Tailwind utility classes plus CSS variables from `src/index.css`; preserve the four themes.

## Development Conventions

- Keep changes scoped and incremental. This is an evolution of the existing app, not a rewrite.
- Prefer existing component patterns and flat serializable state over heavy state libraries.
- Keep data model changes migration-friendly. Existing saved localStorage/share-link states must continue to load when possible.
- Use process IDs for new process-aware data, but provide compatibility for legacy process-name demand/certification data.
- Keep the coverage engine in a testable pure module. Add focused tests before changing its behavior.
- Preserve the custom pointer drag implementation and add conflict/forecast feedback around it instead of replacing it.
- Use CSS variables for colors/statuses/coverage thresholds so themes remain coherent.
- Keep UI strings consistent with the existing mixed Swedish planner vocabulary. Avoid introducing unrelated terminology.
- Do not expose secrets or read/write environment files unless the user explicitly asks.
- Do not run destructive Git commands unless the user explicitly asks.

## Verification Expectations

Run the narrowest useful checks after each change:

- Pure data/coverage/storage changes: `npm run test:ci -- src/test/<target>.test.js`
- Component changes: matching Testing Library tests plus `npm run lint`
- Cross-module state or routing changes: `npm run test:ci`, `npm run lint`, and `npm run build`
- Visual/planning board changes: run the dev server and verify the relevant flows in a browser at desktop and mobile widths.
- Graph/docs checkpoints: refresh Graphify with `graphify update .` when architecture-significant code changes land.

## Review Expectations

- Existing tests must keep passing; extend them rather than deleting them.
- New state migrations need tests for old and new persisted shapes.
- New modules should preserve overview: compact rows, sticky operator/process labels, readable legends, and no nested card clutter.
- Conflict and capacity warnings should be visible on the board and testable through pure helpers where practical.
- Keep PRs reviewable by shipping the requested phases in small, coherent steps.
