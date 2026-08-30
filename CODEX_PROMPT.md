ROLE & MINDSET
You are a senior full-stack engineer continuing the "Vacation Planner" (Swedish:
"Semester Planner"). This is an EVOLUTION of an existing app I like — not a rewrite.
Preserve the current clean look and core workflow, and grow it into a practical,
robust planning tool in the spirit of monday.com: visual, fast, and easy for a
manager to plan vacations, see conflicts clearly, and adjust without losing overview.
Do NOT over-engineer. Work on a NEW branch; never touch master directly.

REPO
https://github.com/Naab14/vacation-planner   (baseline = master, commit 02a5bcd)

VISUAL REFERENCE (read carefully)
My favorite build is https://vacation-planner-j6u3f6qjf-naab14s-projects.vercel.app/
It is a client-rendered SPA, so you can't scrape it — treat my description as the spec.
What I love and want to KEEP/REACH: clean uncluttered look; an icon per operator;
search by BOTH operator name AND certification; a clear "what do I have right now / for
this day" coverage view; fast inline editing of demand vs. available resources.
IMPORTANT: three things I describe are NOT in the current repo or any branch — search by
certification, operator icons wired in, a dedicated certification-matrix page, and a
dashboard page. Build these fresh to match the look; do not assume they already exist.

STEP 0 — GROUND YOURSELF WITH GRAPHIFY (then show me)
Before editing, build a knowledge graph so you understand the real structure:
  uv tool install graphifyy      # or: pipx install graphifyy
  graphify update .              # AST graph, no API key needed
  graphify export callflow-html
Show me: graphify-out/vacation-planner-callflow.html, the god-nodes/communities/gaps from
graphify-out/GRAPH_REPORT.md, and a short plain-language summary of how the pieces connect.
Then inspect the stack, scripts, and conventions. Create/update a repo-level AGENTS.md
(overview, key directories, install/dev/test/lint/build commands, conventions, verification
and review expectations). Do not start feature work until you've shown me the graph + plan.

PROJECT GOAL
Evolve the single-page calendar app into a small multi-module tool (Dashboard, Planning
board, Certification matrix, Employees, Settings, Export/Print) that keeps today's clean
feel, makes drag-and-drop planning the core experience, and surfaces conflicts and
capacity gaps instantly. Client-only now, but structured so a backend can be added later.

WHAT TO PRESERVE (do not rebuild from scratch)
- The clean, themed visual identity (CSS variables in src/index.css; 4 themes). Reuse it.
- CalendarGrid's custom POINTER-based drag (create/move/resize) — keep the custom impl,
  do NOT swap in a heavy DnD library unless a cross-module need clearly justifies it.
- Week + day zoom, per-day coverage view, inline demand editing.
- Coverage engine in src/coverage.js (smart multi-cert assignment), holidays.js, csv.js,
  storage.js, historyReducer.js (undo/redo), useBreakpoint responsiveness.
- Existing Vitest tests must keep passing; extend them, don't delete them.

WHAT TO IMPROVE / ADD (functionality first, design second)
1. Certifications become data, not constants. Move PROCESSES out of src/data.js into app
   state/settings so processes can be added/renamed/removed. Migrate existing seed data.
2. Certification matrix module: operators (rows) × processes (columns) grid, editable on
   the fly (toggle a cert, or set a level if you add levels). Edits reflect IMMEDIATELY in
   coverage and on the planning board. Add/rename/remove a process here too.
3. Operator icons: give each operator a lightweight visual identity (color + initials, or
   an icon from public/icons.svg). Show it in the employee list, board rows, and matrix.
4. Search by certification AND name in the employee list / board (currently name-only).
5. Coverage becomes forecast-aware: pending + requested leave must affect coverage, not
   just approved (today coverage.js:33 ignores them). Add a clear toggle/legend between
   "confirmed" (approved only) and "projected" (incl. pending/requested) so a planner sees
   impact BEFORE approving.
6. Conflict + capacity warnings: during drag and on the board, clearly flag weeks that go
   under minimum staffing or red coverage, locked weeks, and overlap-rule violations.
   Show a live ghost/preview of the resulting coverage while dragging. Allow override
   unless a week is hard-locked.
7. Dashboard (manager summary): at-a-glance health — red/under-staffed weeks, count of
   pending requests, who's off this/next week, biggest capacity gaps, quick links to fix.
8. Export/Print view: a clean printable plan + coverage heatmap; keep existing CSV export.
9. Fix ARCHITECTURE.md to reflect reality (client-only SPA, no backend).

MODULES / NAVIGATION (suggested — adjust with reason)
Add lightweight routing (react-router-dom, or a simple tab/state switch if you prefer
fewer deps). Modules:
- Dashboard — manager overview/summary (read-only with drill-in). Why: managers need the
  "is my plan healthy?" answer in one glance.
- Planning board — THE core surface (calendar + Excel-grid hybrid): operators as rows,
  weeks as columns, draggable vacation blocks, an editable demand row, a color-coded
  coverage row, day-zoom. This is today's CalendarGrid, evolved. Why: it's what works.
- Certification matrix — editable competence grid. Why: the user explicitly needs this and
  it must stay in sync with planning.
- Employees — list/add/edit operators, icons, active flag, search by name + cert. Why:
  evolve the existing OperatorPanel rather than replace it.
- Settings — staffing rules, teams, year, colors, holidays (see below). Why: replaces
  hardcoded constants with practical controls.
- Export / Print — shareable, archivable output for managers.
(Keep the set small; don't add modules without a clear use.)

DRAG-AND-DROP BEHAVIOR (core experience)
- Create: drag across week columns on a row to draw a vacation block (exists — keep).
- Move: drag a block to other weeks or onto another operator's row / group (exists — keep,
  make group moves explicit).
- Resize: drag block edges to extend/shorten (exists — keep).
- Status: keep the popover for status changes; optionally allow dropping a block into a
  status lane in a secondary view. Don't force status into the calendar drag.
- Conflict feedback: while dragging, live-preview the resulting coverage; outline the block
  red and show a tooltip ("v.22 Serialisering would drop to RED" / "Week locked" /
  "Exceeds allowed overlap (2)"). Snap to week columns; large hit targets; smooth.
- Capacity gaps: coverage row colors update live; dashboard reflects new gaps.
- Accessibility: provide a non-drag fallback (click-to-select range, or keyboard) since the
  current grid is pointer-only.

DATA MODEL / STATE (extend the existing shape; keep it flat and serializable)
Current: { operators, vacationBlocks, demand, settings }. Evolve to:
- operators: { id, name, shift, active, certifications[], teamId?, icon? (color/initials) }
- processes: [{ id, name }]   // was the hardcoded PROCESSES array
- vacationBlocks: { id, operatorId, startWeek, endWeek, status, dayStatuses?, note? }  (keep)
- demand: { [processId]: { [week]: number } }   (key by processId, not name)
- teams/groups: [{ id, name, shift? }]            // optional grouping
- settings: { planningYear, shiftMode, visibleWeeks, startWeek, minStaffing,
    perWeekRequired defaults, allowedOverlap, lockedWeeks[], holidaysRegion, colorCoding }
- schemaVersion: number   // add versioning + a migration for old localStorage/JSON
Persistence: introduce a small store/repository abstraction (e.g. src/store/) with an
async-capable interface (get/save), backed by localStorage today, so a REST/Supabase
backend can drop in later WITHOUT touching components. Keep undo/redo (historyReducer).

SETTINGS STRUCTURE (practical, not exhaustive)
- Planning: planning year, visible weeks, start week.
- Staffing: default required per process/week, global minimum staffing, allowed overlap
  (max simultaneous absences per shift/group), locked weeks (no changes).
- Teams/groups: define teams; assign operators; per-team requirements (optional).
- Roles/requirements: per-process required certifications/levels (drives coverage).
- Calendar: holidays region (default SE), week numbering, weekend handling.
- Appearance: status colors / coverage color thresholds, theme.
Keep settings client-side; persist via the same store abstraction.

UI / UX PRINCIPLES
- Preserve the clean, calm look; reuse CSS-variable theming; consistent status/coverage
  colors. Functionality first, design second.
- Never lose overview: sticky operator column + week header, compact rows, clear legend.
- Fast inline editing (demand, certs) with optimistic updates and undo.
- Make conflicts and gaps obvious at a glance (color + icon + tooltip), not buried in menus.
- Responsive; mobile collapses to a focused view. Keep it lean — no clutter.

DESIGN DIRECTIONS (I want the hybrid; here's the trade-off summary)
- Calendar-first planner: closest to today; great time accuracy; weaker as a manager
  dashboard.
- Excel-like grid: dense, powerful bulk editing; can feel intimidating, weaker overview.
- Kanban board: very visual card moves; poor for exact week ranges/coverage.
- RECOMMENDED — Calendar + Excel-grid hybrid: operator rows × week columns with draggable
  blocks AND inline-editable demand/coverage cells, fronted by a Dashboard for the
  at-a-glance summary. Best balance of visual planning, precise weeks, and manager overview.
Build the hybrid; keep a clean dashboard on top.

IMPLEMENTATION PHASES (ship in small, reviewable steps)
0. Graphify + inspect + AGENTS.md; add routing/module shell WITHOUT breaking current app.
1. Data layer: processes-as-data + processId keys + schemaVersion/migration + store
   abstraction (backend-ready). Keep all current behavior green.
2. Certification matrix module + operator icons + search-by-certification.
3. Planning board upgrades: projected (pending/requested-aware) coverage with toggle;
   live drag conflict/capacity warnings; locked weeks + allowed-overlap rules.
4. Dashboard / manager summary.
5. Settings module (staffing, teams, year, colors, holidays).
6. Export/Print view; fix ARCHITECTURE.md; polish + tests + docs.

ACCEPTANCE CRITERIA
- App still builds, runs, and all existing Vitest tests pass; new logic has tests.
- The clean look and existing calendar drag workflow are intact.
- Certifications can be edited in the matrix and instantly change coverage and the board.
- Operators show icons; list/board can be filtered by name AND certification.
- Coverage can show "projected" impact of pending/requested leave; planners see red weeks
  before approving.
- Dragging shows live conflict/capacity feedback and respects locked weeks + overlap rules.
- Dashboard summarizes health (red weeks, pending count, who's off, gaps) at a glance.
- Settings drive staffing rules, teams, year, holidays, and colors (no hardcoded PROCESSES).
- Persistence goes through one store abstraction that could be swapped for a backend.
- A printable/exportable plan exists; ARCHITECTURE.md matches reality.

THINGS TO AVOID
- No rewrite-from-scratch; no throwing away the calendar, coverage engine, or themes.
- No real backend/auth/accounts yet (just be backend-ready).
- No heavy state libs (Redux/MobX) — the reducer + store abstraction is enough.
- Don't replace the working custom pointer DnD with a heavy library unless clearly needed.
- Don't over-build modules/settings nobody asked for; keep it lean and practical.
- Don't change the visual identity or introduce inconsistent new languages/strings.
- Don't break existing tests or commit directly to master.

DELIVERABLES
- New branch (not master) + a PR.
- AGENTS.md; corrected ARCHITECTURE.md.
- The implemented phases with passing tests and lint.
- A short write-up: what you built, why, and how to verify (commands + output).

Use gpt-5.5. Medium reasoning for setup/refactors, high reasoning when a step gets complex.
