ROLE & MINDSET
You are an expert full-stack engineer joining the "Vacation Planner" (Swedish:
"Semester Planner") project. I'm looking to be genuinely awed here — not a
timid, minimal diff. Inspect the whole repo, understand the domain deeply, and
come back with something that makes me go "oh, that's exactly what this needed."
Surprise me with judgment and taste, not just feature checkboxes. Work on a new
branch so I can review before anything lands on master.

REPO
https://github.com/Naab14/vacation-planner

STEP 0 — BUILD UNDERSTANDING WITH GRAPHIFY
Before anything else, use Graphify (https://github.com/safishamsi/graphify) to
build a knowledge graph of this repo so your understanding is grounded in the
actual structure, not guesses:
  uv tool install graphifyy   # or: pipx install graphifyy
  graphify update .           # AST graph, no API key needed
  graphify export callflow-html
Then SHOW ME what you learned: surface the generated
graphify-out/vacation-planner-callflow.html, the god-nodes / communities /
knowledge-gaps from graphify-out/GRAPH_REPORT.md, and a short plain-language
summary of how the pieces connect. If you have an LLM API key available, also run
the deeper semantic pass (the /graphify skill) so the graph includes inferred
relationships, and note the difference. I want to see the graph and your read of
it before you start building.

STEP 1 — INSPECT BEFORE EDITING
First inspect the repository structure, detect the stack, package manager,
test/lint/build commands, and any existing conventions. Do not edit yet unless
the setup is obvious and low-risk.

Create or update a repo-level `AGENTS.md` that documents:
- project overview
- important directories
- install/develop/test/lint/typecheck/build commands
- coding conventions found in the repo
- verification expectations
- review guidelines

CONTEXT I ALREADY GATHERED (verify it yourself, don't just trust me)
This is a client-only React 19 + Vite SPA, Tailwind, Vitest. NO backend — all
state is in localStorage, "sharing" is a base64 snapshot in the URL hash. It
schedules operator vacation/leave against process-coverage needs on a 52-week
calendar.

Domain model (src/types.js):
- Operators: { name, shift: S1|S2, active, certifications[] } across 5 fixed
  processes (Avsyning, Kapselresaren, Serialisering, Etikettering,
  Granskning/uttag av dok).
- Vacation blocks: week ranges with status (draft|pending|approved|requested),
  optional per-day status overrides, and notes.
- Demand: required headcount per process per week.
- Coverage engine (src/coverage.js): green/yellow/red per process/week, with
  smart assignment of multi-certified operators to the neediest process.

What already works well (don't rebuild these, build ON them): drag-to-create/
move/resize blocks, week + day zoom, demand editing, shift modes
(separate/combined/summer), Swedish holidays via date-holidays, CSV import/
export with fuzzy cert matching, JSON import/export, undo/redo (50 steps),
share-via-URL, 4 themes, responsive layout, decent Vitest coverage.

WEAKNESSES / THINGS THAT NEED REVAMPING (the meat — fix or reimagine these)
1. Pending leave is invisible to coverage. getAllCoverageForWeek only counts
   status === 'approved' as an absence (src/coverage.js:33). A planner can't see
   the impact of pending/requested leave BEFORE approving it — which is the whole
   point of a planning tool. This is the #1 thing to fix.
2. No approval workflow. Statuses exist but there's no submit → review →
   approve/reject flow, no "who requested/approved", no audit trail.
3. No hard coverage guards — overlap is blocked only per-operator. Nothing warns
   or blocks when a week goes red, or caps simultaneous absences per shift.
4. No year dimension — hardcoded to weeks 1–52 of the current year; holidays only
   for this year; no cross-year planning, no week 53.
5. Demand is week-level only even though day-zoom coverage exists; holidays are
   flagged but don't reduce required headcount.
6. No printable / exportable plan — no PDF, no print stylesheet, no coverage
   heatmap export. Managers can't hand out or archive a schedule.
7. Processes/certifications are hardcoded in src/data.js; no UI to manage them,
   no cert levels (trainee vs certified).
8. "Summer" shift mode is cosmetic — just a label, no real summer-staffing logic.
9. Mixed Swedish/English strings, no i18n; share link claims to be "compressed"
   but is plain base64; no state schema versioning/migration; grid is pointer-only
   (accessibility gap); no React error boundary.
10. ARCHITECTURE.md is actively misleading — it diagrams a Frontend→API→Database
    backend that does NOT exist. README is the stock Vite template. No CI.

PROJECT GOAL
Pick the highest-leverage improvement from the weaknesses above and ship it
beautifully on a branch, OR invent a genuinely new tool/feature that elevates
this from "a calendar with colors" into something a shift manager would love.
Strong candidates (your call — argue for your choice):
- Make coverage forecast-aware: a "what-if" / scenario mode that shows the
  coverage impact of pending + requested leave, with clear red-week warnings and
  smart suggestions ("approving this drops Serialisering to red in v.22").
- A real request → approval workflow with an audit trail.
- An exportable/printable coverage & schedule report (PDF/print view + CSV heatmap).
Whatever you choose, make it feel polished, fast, and obvious to use, and keep it
consistent with the existing component patterns, theming (CSS vars), and tests.

AUTONOMY
Make up your own mind. The weaknesses and candidate features above are my
recommendations, not orders — you've now read the whole repo (and the Graphify
graph), so you may know better. Pick what you believe is the highest-leverage,
most impressive thing to build. If you choose something other than what I
suggested, briefly tell me why; if you build on my recommendations, great. Either
way I want your best judgment, not blind compliance.

DELIVERABLES
- A new branch (don't touch master).
- AGENTS.md as specified above.
- Your implementation, with tests (Vitest) and passing lint.
- Fix ARCHITECTURE.md so it reflects reality (client-only, no backend).
- A short write-up of WHAT you built, WHY you chose it, and how to verify it.

VERIFY before you call it done: run the existing test suite and lint, add tests
for new logic, and confirm the app still builds and runs. Show me the commands
and their output.

Use gpt-5.5. Use medium reasoning for setup and high reasoning if the task
becomes complex.
