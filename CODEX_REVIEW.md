# Code review — PR #19 (`codex/vacation-planner-evolution`)

Reviewer: Claude. Reviewed by reading the actual files on this branch (not just
the diff). Every finding below was verified against the source; line/function
references are real. **Codex: please work through these and address each item,
or reply on the item explaining why it should stay as-is.**

Overall verdict: **strong build.** The module split, the id-keyed data model, the
`migrateState` migration, and the drag-time conflict engine are genuinely good.
The items below are improvements, not a rejection.

---

## Strengths (keep these)

- Pure logic extracted into testable modules (`schema.js`, `coverage.js`,
  `conflicts.js`, `dashboard.js`, `settings.js`, `store/`); components stay thin.
- Processes modeled as `{id, name}` with **id-keyed demand**, plus a real
  `migrateState` that recovers processes from legacy demand keys + operator certs
  and slugifies Swedish characters. Solid backward-compat.
- `coverage.js` `resolveProcessId` / `normalizeCertifications` tolerate certs
  stored as id *or* name — a real migration safety net, also honored in the
  `OperatorPanel` cert checkboxes (`op.certifications.includes(p.id) || includes(p.name)`).
- Drag-time feedback engine (`conflicts.js`): locked weeks, allowed-overlap,
  min-staffing, projected red-coverage, plus a live ghost preview block. This is
  the standout feature.
- `CalendarGrid` has a real **keyboard fallback** (`handleCellKeyDown`): Enter/Space
  creates a one-week block or opens the popover. Coverage cells in `CoverageRows`
  are focusable with `aria-label`s. Good baseline a11y.
- `sanitizeSettingsPatch` clamps numeric settings with sane bounds.
- `historyReducer` undo/redo (past/present/future) is clean and reused well.

---

## Issues to fix

### Logic layer

**1. `getOverlapWarnings` over-counts (`src/conflicts.js`).**
The `absent` count includes **every** block overlapping the week — any `status`
(so `draft` counts) and any shift — then `+1` for the candidate. "Allowed overlap"
should mean simultaneous *projected* absences within the relevant shift. As written,
an overlap warning can fire because of a colleague's draft on the other shift.
Fix: filter the count to `PROJECTED_STATUSES` and, when `shiftMode === 'separate'`,
to the candidate operator's shift — mirror the filtering already in `getCapacityWarnings`.

**2. Red-coverage warnings don't compare before/after (`src/conflicts.js`).**
`getCapacityWarnings` flags any process that is RED *after* placing the candidate,
even if it was already RED beforehand — blaming pre-existing gaps on the new block.
Fix: compute coverage once without the candidate, and only warn when the candidate
makes a process newly red (or lowers its covered count).

**3. Persisted operator-icon initials go stale (`src/schema.js`).**
`migrateState` stamps `icon: op.icon || buildOperatorIcon(op.name, index)`, persisting
the **initials** into state. Renaming an operator later leaves the old initials.
Keeping a stable color is fine; stale initials are not. Fix: persist only the color
and derive initials from the current name at render (`OperatorAvatar`), or recompute
on rename.

**4. Dead diacritic handling (`src/schema.js`, `processIdForName`).**
The explicit `.replace(/å/g,'a').replace(/ä/g,'a').replace(/ö/g,'o')` runs *after*
`normalize('NFD')` + combining-mark strip + `toLowerCase`, by which point those chars
are already folded. Unreachable — drop it (or drop the NFD pass instead).

### State / settings layer

**5. `defaultRequired` is a phantom setting.**
`App.jsx` `addProcess` reads `s.settings.defaultRequired ?? 2`, but `defaultSettings`
(`schema.js`) never defines it and `sanitizeSettingsPatch` (`settings.js`) never
clamps/passes it intentionally. `coverage.js` independently hardcodes the same
fallback: `demand[...]?.[week] ?? ... ?? 2`. So "default required coverage" is
referenced in three places and owned by none — it's effectively always 2.
Fix: define `defaultRequired` once in `defaultSettings`, clamp it in
`sanitizeSettingsPatch`, and have `coverage.js` + `addProcess` read it from settings.

**6. Three different defaults for the same knob.**
`allowedOverlap` defaults to `2` in `defaultSettings`, `2` in `conflicts.js`'s
fallback, but `0` in `sanitizeSettingsPatch`'s fallback. `minStaffing` is `1` vs
`0`. The schema default wins today, so it's not a live bug, but it's fragile.
Fix: source fallbacks from `defaultSettings` constants in one place.

**7. `flash()` toast has no timer cleanup (`src/App.jsx`).**
`flash` is a non-memoized closure calling `setTimeout(() => setToast(null), 3000)`
with no stored handle. Rapid toasts let an earlier timer null out a newer message.
The `wasShared` effect right above it already does proper cleanup — copy that
pattern (store the timeout in a ref and clear it before setting a new toast).

### UI / interaction layer

**8. Keyboard support is partial (`src/components/calendar/CalendarGrid.jsx`).**
`handleCellKeyDown` covers single-week create + open-popover, but **multi-week
draw, move, and resize are pointer-only** (`handleCellPointerDown` / the
`pointermove` effect). Keyboard/AT users can't create a range or move/resize a
block. Fix: from the popover (already keyboard-reachable), offer start/end-week
inputs or arrow-key nudge for move/resize.

**9. Imperative focus-style mutation (`src/components/OperatorPanel.jsx`).**
~6 inputs/selects set focus styling via `onFocus={e => e.target.style.boxShadow=...}`
/ `onBlur`. This mutates the DOM outside React; a re-render mid-focus drops the
ring. Same imperative pattern on the row `onMouseEnter/Leave` (`transform`/`background`).
Fix: use a CSS `:focus-visible` / `:hover` rule (or state), not direct `style` writes.

**10. Tooltip viewport clamping is incomplete (`src/components/calendar/CoverageRows.jsx`).**
`onPointerEnter` clamps `y` with a hardcoded `window.innerHeight - 200` (magic
number, assumes a fixed tooltip height), and the `onFocus` path doesn't clamp `y`
at all (`y: rect.top`) so a keyboard-focused bottom-row cell can overflow off-screen.
Fix: measure the tooltip height (or use a shared constant) and clamp both paths.

**11. `role="button"` on non-activating cells (`CoverageRows.jsx`).**
Coverage cells are `tabIndex={0} role="button"` but have only hover/focus tooltip
handlers — no click/Enter action. Announcing them as buttons is misleading.
Fix: drop `role="button"` (a focusable cell with `aria-label` is enough), or use a
more accurate role.

### Tests

**12. Interaction paths under-tested.**
Module tests exist (`Dashboard.test.jsx`, `ExportPrint.test.jsx`,
`CertificationMatrix.test.jsx`) but are render-smoke level (~1–1.8 KB), while
`CalendarGrid`/`OperatorPanel`/`TopBar` tests are substantial. Under-covered:
- `conflicts.js` overlap/min-staffing/red-coverage branches via the engine
  (`conflicts.test.js` exists — extend it for items 1–2 above).
- Drag overlap rejection and long-press(500ms)-vs-click in `CalendarGrid`.
- `CertificationMatrix` process add / rename / remove and cert toggle.
- `Dashboard` KPI values (red weeks, pending counts), not just that it renders.

---

## Minor / optional

- `migrateState` re-derives icons and remaps certs on every load regardless of
  `schemaVersion`. Idempotent so it's safe, but you could short-circuit when
  `rawState.schemaVersion === SCHEMA_VERSION`.
- `getDefaults` (`App.jsx`) wraps `buildDefaultState()` — which already runs
  `migrateState` — in another `migrateState`. Harmless (idempotent), just redundant.
- `sanitizeSettingsPatch` spreads `...patch`, so unrecognized keys
  (`colorCoding`, `holidaysRegion`, `teams`, `defaultRequired`) pass through
  unvalidated. Fine for now; note it if/when those become user-editable.
- Confirm `teams` (written into state by `migrateState`) is actually consumed by
  the Settings UI; if not yet wired, mark it a known TODO so it isn't mistaken for
  dead state.

---

*Priority order: 1, 2, 5 (correctness/consistency of the coverage+conflict core),
then 8, 9, 3 (UX/a11y/data), then 12 (lock the fixes in with tests).*
