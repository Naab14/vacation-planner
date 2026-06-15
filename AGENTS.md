# AGENTS.md — Vacation Planner

A client-only (browser-only) vacation/leave planner for a shift-based production
team. React + Vite SPA, Swedish-language UI ("Semester Planner"). All data lives
in the browser (localStorage) and can be shared via an encoded URL — there is no
backend.

## Commands
- `npm run dev` — start the Vite dev server
- `npm run build` — production build to `dist/`
- `npm run test` / `npm run test:ci` — Vitest (watch / single run)
- `npm run lint` — ESLint (must be clean)

Verify changes with `npm run test:ci && npm run lint && npm run build` before pushing.

## Architecture (the short version)
- `src/App.jsx` — state hub. Holds the whole workspace in a `historyReducer`
  (undo/redo) and passes data + callbacks down. Owns module navigation (`view`).
- `src/components/NavRail.jsx` — left icon rail switching modules.
- Modules (`src/modules/`): `Dashboard`, `CertificationMatrix`, `Employees`,
  `SettingsPanel`, `ExportPrint`. The planning board itself is the existing
  `src/components/calendar/CalendarGrid.jsx` (custom pointer drag — keep it).
- `src/coverage.js` — the coverage engine. Smart multi-cert assignment. Accepts a
  `processes` list and an `opts.absentStatuses` set (confirmed vs projected view).
- `src/store/index.js` — the ONLY persistence seam. `migrateState` (schema
  migration), `freshState`, and an async `load/save/clear` store backed by
  localStorage today, swappable for an API later. Components never touch
  localStorage directly for core state.
- `src/processOps.js` — pure helpers to add/rename/remove a process and toggle a
  certification, keeping `processes`, `demand`, and operator `certifications`
  consistent.
- `src/operatorIcon.js` / `OperatorAvatar.jsx` — deterministic initials+colour
  avatars (no stored data).
- Supporting: `storage.js` (localStorage + share-link), `csv.js` (import/export
  with fuzzy cert matching), `holidays.js` (Swedish holidays, code-split),
  `historyReducer.js`, `hooks/useBreakpoint.js`.

## Key data model (flat, serializable)
```
{
  schemaVersion, 
  processes: string[],                 // certification/process names (stateful)
  operators: [{ id, name, shift, active, certifications: string[] }],
  vacationBlocks: [{ id, operatorId, startWeek, endWeek, status, dayStatuses?, note? }],
  demand: { [processName]: { [week]: number } },
  settings: { shiftMode, visibleWeeks, startWeek, planningYear,
              defaultRequired, minStaffing, allowedOverlap, lockedWeeks }
}
```

## Conventions / gotchas
- **Processes and demand are keyed by NAME, not an opaque id.** Names are unique
  and CSV fuzzy-matching depends on them, so renames cascade via `processOps`
  (this is intentional — see `renameProcess`). Stable visual identity for
  operators comes from `operatorIcon` keyed on `op.id`.
- Functions that consume the process list (`coverage.js`, `csv.js`,
  `buildDefaultDemand`) take an optional `processes` param defaulting to the
  `PROCESSES` constant, so unit tests and old callers keep working.
- Coverage statuses: `draft` and `requested`/`pending` do NOT reduce confirmed
  coverage; only `approved` does. Pass `opts.absentStatuses` to project the
  impact of pending/requested leave (the planning board's Confirmed/Projected
  toggle).
- Styling is CSS variables + Tailwind utility classes; respect the 4 themes in
  `src/index.css`. Keep UI strings consistent (mixed Swedish/English as today).
- Bump `SCHEMA_VERSION` in `src/data.js` and add a step to `migrateState` when the
  persisted shape changes.
