# Claude Handoff — Vacation Planner

**Repo**: `naab14/vacation-planner` · **Stack**: React 19 + Vite 8 + Tailwind 3 + Vitest 4
**Active branch**: `claude/neo-kinetic-reskin` (reskin foundation; draft PR pending)

This doc is the pickup point between sessions. Read `design-handoff/` and the extracted bundle at `/tmp/design_unpack/neo-kinetic-travelogue/` for the full visual spec.

---

## What shipped so far

### Merged to master
| PR | Phase | What |
|----|-------|------|
| #3 | 2.2 | Undo/Redo via history reducer + `Ctrl+Z` / `Ctrl+Shift+Z` |
| #4 | 2.4 | Operator search with case-insensitive substring filter + clear button |
| #5 | — | Block comments / notes (💬 indicator) |
| #6 | 2.5 | Holiday-aware grid with amber diagonal stripes |
| #7 | 2.8 | Human-readable Swedish CSV import/export |
| #8 | 2.6 | Scroll-wheel zoom with transition overlay |
| #9 | 2.7 | Expanded (wide) day view |
| #10 | 2.9 | Responsive breakpoints + touch adjustments |

### In flight — `claude/neo-kinetic-reskin` (not yet pushed in this session)
Neo-Kinetic Travelogue reskin foundation:
- `src/theme/themes.js` — **new**. 8 themes × {light, dark} palette matrix + `applyTheme(themeId, mode)` that writes Neo-Kinetic tokens **and** back-compat aliases (`--accent`, `--bg-primary`, etc.) onto `:root`. Sets `body[data-theme]` + `body[data-mode]` for personality overrides.
- `src/data.js` — theme list replaced with 8 IDs: `neo-kinetic, duck-pond, citrus-grove, electric-plum, harbor, monochrome, lumina, playful`.
- `src/index.css` — ~230 lines of Neo-Kinetic primitives appended: `--f-head`/`--f-body`/`--f-mono`, `--r-s`/`--r-m`/`--r-l`/`--r-pill`, grain overlay via SVG fractalNoise under `body.nk-on::before`, `.nk-brand` wordmark, `.nk-shift-pill`, `.nk-btn` (primary/ghost/sm/icon-only variants with 4px game-piece shadow), `.nk-op-filter` search, `.nk-op-card`/`.nk-op-avatar`/`.nk-op-name`/`.nk-op-shift`, `.nk-mode-toggle`, Lumina override (soft shadows), Playful override (bouncier radii).
- `src/App.jsx` — imports `applyTheme`, adds `mode` state, runs theme effect, persists `mode` into UI storage, passes `mode` + `onToggleMode` to TopBar.
- `src/components/TopBar.jsx` — full rewrite. New signature includes `mode, onToggleMode`. Uses `.nk-brand` wordmark ("Uppsala · Works Planning" kicker + "Semester.Planner" with coral dot + yellow period), `.nk-shift-pill` for shift mode tabs, dark-pill theme select, `.nk-mode-toggle` ☀/☾ button, `.nk-btn.primary.sm` "Share link" button, game-piece overflow menu with 4px `var(--ink)` shadow.
- `src/components/OperatorPanel.jsx` — rewrite: `.nk-op-filter` search (⌕ glyph + ✕ clear), operators grouped by shift under `.nk-op-group-title`, `.nk-op-card` rows with `.nk-op-avatar` (initials, coral for S2), `.nk-op-name`, `.nk-op-shift.s1/.s2`. Expanded-edit panel uses Swedish labels (Namn / Skift / Aktiv / Certifieringar / Ta bort operatör).
- Tests updated — `src/test/TopBar.test.jsx` + `src/test/OperatorPanel.test.jsx` + `src/test/App.test.jsx` rewritten for new markup / Swedish labels / theme semantics. **171/171 passing.**

---

## What's still TODO on the reskin

Per user priority: *"also i like the new search bar in the design file.. and its geared mostly to plan the days"* — day-view polish is the next highest-value chunk.

### High priority
1. **Calendar grid plate** — background, week-column dividers, week-header chips (v.15, v.16, …). Reference `/tmp/design_unpack/neo-kinetic-travelogue/project/sp-grid.jsx` + `sp.css`.
2. **Day-view polish** — user's #1 callout. Restyle `DayZoomGrid.jsx` day headers, per-day status chips, block visuals. Hover/active states. The current merged PR #9 is functional but unstyled.
3. **Block visual states** — `pending` / `approved` / `draft` / `requested` use the new `--st-*-bg/-bd` tokens already written by `applyTheme`. Border colors, resize handles, 💬 note icon placement.
4. **BlockPopover restyle** — game-piece shadow (`4px 4px 0 0 var(--ink)`), dashed section rule between fields, coral "Delete" CTA.

### Medium
5. **Coverage pills heatmap** — replace current CoverageRows with `.nk-pill` heatmap showing coverage per process × week. Green / yellow / red map to `--coverage-*` tokens.
6. **Legend restyle** with Swedish labels (Väntar / Godkänd / Utkast / Helg, etc.).
7. **TweaksPanel component** — new panel with controls for density, accent color override, font stack, `--asym` toggle (to kill rotation micro-accents), grain intensity. See `design-handoff/` for exact control set.
8. **Responsive breakpoints from sp.css** — `@media (max-width: 960px)` stacks sidebar under topbar; `@media (max-width: 560px)` compact week headers. PR #10 added hybrid-touch handles; sp.css has additional density tweaks.

### Blocked on user
- 30 real operator names for seed swap (currently Swedish-style placeholders in `src/data.js`).
- Holiday + working-hours config paste.
- Backup data for a Reports Dashboard.
- Schema extensions: additional absence statuses (study leave, parental, sick), AQL demand dimension, period-comment annotations.

---

## How the theme system works

```
user changes <select> → setTheme('harbor') → useEffect in App.jsx
  → applyTheme('harbor', 'light')
    → writes --ink, --paper, --indigo, --coral, --yellow, … to :root
    → writes --accent, --bg-primary, --topbar-bg, … (back-compat aliases)
    → writes --st-*-bg/-bd (status tokens)
    → body.setAttribute('data-theme', 'harbor')
    → body.setAttribute('data-mode', 'light')
  → saveTheme('harbor') persists to localStorage
```

**Back-compat aliases** are the key — unrestyled components still read `var(--accent)` / `var(--bg-primary)` / `var(--topbar-bg)` etc. and pick up per-theme colors automatically. As components migrate to Neo-Kinetic tokens (`var(--ink)` / `var(--indigo)` / etc.), the aliases become redundant but don't need to be removed — they cost nothing at runtime.

**Mode overrides** — dark mode uses soft-dark tints (not pitch black), e.g. `#1A1830` for neo-kinetic dark. Status tokens in dark mode derive tinted backgrounds via `color-mix(in srgb, …)` rather than using light-mode flat colors.

**Personality overrides** — `body[data-theme="lumina"]` kills the game-piece shadow in favor of softer shadows; `body[data-theme="playful"]` inflates shadow distance and bounces radii. All other themes share the default Neo-Kinetic look.

---

## Dev loop

```bash
npm install            # first run only
npm run dev            # starts Vite on :5173
npm run test:ci        # runs full Vitest suite (171 tests)
npm run test:ci -- historyReducer   # scope to one file
npm run lint           # ESLint
```

Production build: `npm run build` → `dist/`. No server — static hosting only.

---

## Branch policy

- `master` — always deployable. PRs squash-merge into master.
- `claude/*` — feature branches. Create one PR per feature phase, draft initially.
- **Never** push directly to master. **Never** force-push shared branches without `--force-with-lease`.
- Bot review feedback: address the real issues, push a follow-up commit, don't delete the original to hide bad history.

---

## Continuation prompt for a fresh chat

```
I'm working on the Neo-Kinetic Travelogue reskin of the vacation-planner repo.
Read CLAUDE.md at the repo root first — it has the session handoff and open
TODOs. The last session landed the theme foundation + TopBar + OperatorPanel
on `claude/neo-kinetic-reskin` (171/171 tests green).

Next up (in order):
  1. Restyle the calendar grid plate + week headers using Neo-Kinetic tokens.
  2. Polish the day view — this is the user's top priority (they plan mostly
     at day-resolution).
  3. Restyle block visual states using the --st-*-bg/-bd tokens.
  4. Restyle the BlockPopover.

Reference the design handoff at `design-handoff/` (branch) or the extracted
bundle at `/tmp/design_unpack/neo-kinetic-travelogue/project/sp*.jsx` + `sp.css`.
Follow the implementation order in
`design-handoff/project/design_handoff_vacation_planner/README.md`.

When done with each chunk: run `npm run test:ci`, commit on
`claude/neo-kinetic-reskin`, push. Open one draft PR for the whole reskin
foundation once it's stable.
```

---

## Repo map (essentials)

```
src/
├── App.jsx                      main shell; useReducer history; theme + mode state
├── main.jsx, index.css          entry + Tailwind + Neo-Kinetic primitives
├── data.js                      PROCESSES, seedOperators, themes[]
├── storage.js                   localStorage wrappers + share-link (hash-based)
├── holidays.js                  date-holidays lazy import + holiday map builder
├── historyReducer.js            past/present/future reducer; HISTORY_CAP=50
├── theme/
│   └── themes.js                8 themes × {light,dark} + applyTheme()
└── components/
    ├── TopBar.jsx               brand / shift mode / theme / mode toggle / share / ⋮ menu
    ├── OperatorPanel.jsx        sidebar: search, grouped operator cards, edit panel
    ├── BlockPopover.jsx         per-block editor popover
    ├── CoverageRows.jsx         per-week process-coverage summary (pending restyle)
    └── calendar/
        ├── CalendarGrid.jsx     week-zoom grid
        ├── DayZoomGrid.jsx      day-zoom grid (PR #9; pending full restyle)
        └── GridRow.jsx          per-operator row shared by zoom levels

design-handoff/                  branch with full design spec; local extract at
                                  /tmp/design_unpack/neo-kinetic-travelogue/
```
