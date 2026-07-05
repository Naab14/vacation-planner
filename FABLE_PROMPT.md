# FABLE_PROMPT — Semester Planner (production build)

ROLE & MINDSET
You are a senior full-stack engineer building "Semester Planner" (Swedish shift &
personnel management) as a REAL, production-grade product — not a prototype. There is
an existing client-only React SPA of an earlier version (this repo, Naab14/vacation-planner)
that proves the domain and UX; treat it as a reference for behavior, NOT as code to
port line-by-line. The most feature-complete reference is the branch
`codex/vacation-planner-evolution` (dashboard, planning board, certification matrix,
projected coverage, drag conflict engine). You are building fresh on a modern full-stack
foundation with a PostgreSQL database, authentication, and everything needed to ship. Do
not over-engineer, but do build it properly: migrations, tests, auth, error handling, deploy.

PRODUCT IN ONE LINE
An all-in-one shift & personnel management tool for a manufacturing team: manage
operators, their shifts and certifications, plan vacations/absences with a visual
drag-and-drop board, see staffing coverage vs. demand per process per week in real time,
and run a leave request → approval workflow — with a manager dashboard on top.

USERS & ROLES (single organization, role-based auth)
- Admin: full control incl. settings, processes, users.
- Manager / Planner: plans on the board, edits demand & certifications, approves/denies
  leave requests, sees all dashboards.
- Employee (Operator): self-service — sees their own schedule/coverage, submits leave
  requests, edits own profile basics. Cannot approve or see others' private data beyond
  the shared coverage view.
Implement proper login (email + password, hashed with argon2/bcrypt; sessions or JWT),
role-based authorization enforced server-side on every mutation, and a seed admin.

STACK (build exactly this unless a step clearly justifies otherwise)
- Next.js (App Router, TypeScript) — one repo, one deploy.
- PostgreSQL via Prisma ORM. Use Neon or Supabase Postgres (connection string in env).
- Auth: Auth.js (NextAuth) credentials provider, or Lucia — server-enforced RBAC.
- Tailwind CSS for styling, driven by the neon-kinetic design tokens (below).
- Data fetching via server components + route handlers / server actions. TanStack Query
  optional for client-side optimistic updates on the board.
- Deploy target: Vercel. Provide vercel.json / env docs and a Prisma migration workflow.
- Testing: Vitest (unit — coverage/conflict engines) + Playwright (a couple of e2e flows:
  login, submit-and-approve a leave request, drag-create a block).
- Never commit secrets. Conventional commits, PR.

VISUAL DESIGN — "NEON-KINETIC" (source of truth)
Open this design and treat it as the authoritative visual spec — extract its palette,
neon glow/box-shadow treatments, typography, gradients, radii, and its motion/kinetic
transitions, then build a Tailwind theme + CSS-variable token set from it:
  https://claude.ai/design/p/d4672239-17e6-4b80-a21b-eac4a80e91ff?file=Semester+Planner.html&via=share
Guardrails for "neon-kinetic": dark base surfaces; saturated neon accents with soft outer
glow (layered box-shadows) on active/interactive elements; smooth, springy micro-motion on
hover/drag/state-change (transform + opacity, GPU-friendly, respect prefers-reduced-motion);
crisp high-contrast text. Centralize every color/shadow/timing as a design token — no
hardcoded hexes in components. Keep it legible and calm despite the neon; functionality
first, flourish second. Support light+dark if the design implies both.

DOMAIN MODEL → POSTGRES SCHEMA (Prisma; adjust names sensibly)
- Organization (single row for now, but model it so multi-tenant is a later add).
- User { id, email, passwordHash, role (ADMIN|MANAGER|EMPLOYEE), operatorId?, locale }
- Operator/Employee { id, name, shift (S1|S2|…), active, teamId?, iconColor }  // derive
  initials from name at render — do NOT persist initials.
- Team { id, name, shift? }
- Process { id, slug, name }                         // certifications ARE processes; id-keyed
- Certification { operatorId, processId, level? }    // join table (operator × process)
- Demand { processId, week (1–52), year, required:int }  // required staffing per process/week
- AbsenceBlock { id, operatorId, startWeek, endWeek, status, note?, dayStatuses(jsonb?) }
    status: DRAFT | REQUESTED | PENDING | APPROVED | DENIED
- LeaveRequest / Approval trail { id, absenceBlockId, requestedBy, decidedBy?, decision,
    decidedAt, comment }                              // full history, immutable rows
- Settings { orgId, planningYear, shiftMode, visibleWeeks, startWeek, minStaffing,
    defaultRequired, allowedOverlap, lockedWeeks(int[]), holidaysRegion, colorThresholds(jsonb) }
- Holiday { region, year, week, name }                // seed SE holidays; region-configurable
- AuditLog { id, actorId, action, entity, entityId, before(jsonb), after(jsonb), at }
- Notification { id, userId, type, payload(jsonb), readAt? }
Add a schemaVersion/migration story via Prisma Migrate. Seed realistic demo data
(≈16 operators across S1/S2, the 5 processes, demand, a few absence blocks & requests).

CORE LOGIC (make it server-authoritative + unit-tested)
Port these two engines from the reference SPA's behavior, but as typed, tested server code:
1. Coverage engine — for a given week, compute covered vs required per process. Operators
   with ONE cert are assigned first; multi-cert operators are assigned to the most-needed
   process (lowest covered/required ratio). Two modes:
     - confirmed = count only APPROVED absences as "out".
     - projected = count APPROVED + PENDING + REQUESTED as "out" (so planners see impact
       BEFORE approving).
   Level per process: green (covered ≥ required), yellow (= required-1), red (< required-1).
2. Conflict/capacity engine — when creating/moving/resizing a block, return warnings:
     - locked week (hard block — disallow unless admin override),
     - allowed-overlap exceeded (count SIMULTANEOUS absences within the SAME shift and only
       PROJECTED statuses — not drafts, not other shifts),
     - below minimum staffing,
     - projected RED coverage — but only warn if THIS block newly causes/worsens red
       (compare coverage with vs. without the candidate; don't blame pre-existing gaps).
   Source defaults (defaultRequired, minStaffing, allowedOverlap) from Settings in ONE place.

MODULES / ROUTES
- /login, /  (role-aware landing)
- /dashboard — manager health summary: red/under-staffed weeks, pending-request count,
  who's off this/next week, biggest coverage gaps, quick links to fix. Drill-in.
- /planning — THE core surface: operator rows × week columns, draggable absence blocks,
  inline-editable demand row, color-coded coverage row, week+day zoom, confirmed/projected
  toggle, live drag conflict/coverage preview (neon glow = ok, red outline + tooltip = risk).
  Provide a non-drag keyboard/click fallback for creating & editing blocks (accessibility).
- /matrix — certification matrix: operators × processes, toggle certs inline; add/rename/
  remove processes; changes reflect immediately in coverage & board.
- /employees — list/add/edit operators, icons, active flag, team; search by name AND
  certification.
- /requests — leave request inbox: employees submit; managers approve/deny with comment;
  status history visible; triggers notifications.
- /settings — staffing rules, teams, planning year, allowed overlap, locked weeks, holidays
  region, colors/thresholds. Admin/manager only.
- /reports — coverage heatmap, absence summaries, printable/exportable plan; keep CSV export.

KEY WORKFLOWS
- Leave request → approval: employee submits (block enters REQUESTED) → manager sees it in
  /requests and on the projected board → approve (→ APPROVED, counts as confirmed) or deny
  (→ DENIED) with comment → notification + audit log entry both ways.
- Plan on the board: drag to create/move/resize; live projected-coverage preview; warnings
  as above; locked weeks respected. Optimistic UI with server reconciliation.
- Notifications: in-app always; email (Resend/Nodemailer, env-gated) for request submitted,
  decided, and coverage-risk alerts. Degrade gracefully if email not configured.

API SURFACE (route handlers / server actions, all RBAC-checked)
CRUD for operators, processes, certifications, demand, absence blocks, teams, settings;
POST leave request; POST approve/deny; GET coverage (week range, mode); GET dashboard
summary; GET/POST notifications. Validate all input (zod). Return typed errors.

NON-FUNCTIONAL
- i18n: Swedish-first, English-ready (next-intl or similar); current wording ("Semester
  Planner", "v.22", shift labels) preserved.
- Accessibility: keyboard-operable planning (not pointer-only), aria labels, focus-visible
  states, prefers-reduced-motion honored for the kinetic effects.
- Responsive: mobile collapses to a focused view (employee self-service works on phone).
- Security: server-side authz on every mutation, hashed passwords, no secrets in client,
  rate-limit auth. .env.example with DATABASE_URL, AUTH_SECRET, email keys.
- CI: lint + typecheck + test on PR; Prisma migrate deploy on release.

BUILD PHASES (ship in reviewable steps; show progress)
0. Scaffold Next.js+TS+Tailwind+Prisma; DB connection; design tokens from the neon-kinetic
   spec; auth skeleton + seed admin; AGENTS.md + README + ARCHITECTURE.md (real stack).
1. Schema + migrations + seed; coverage & conflict engines with unit tests.
2. Planning board (drag + inline demand + coverage rows + projected toggle + warnings).
3. Certification matrix + employees + search-by-cert + operator icons.
4. Leave request → approval workflow + /requests + audit log + notifications (in-app).
5. Dashboard + reports/export + email notifications.
6. Polish: i18n pass, a11y pass, e2e tests, deploy to Vercel, docs + verification write-up.

ACCEPTANCE CRITERIA
- Builds, runs, deploys to Vercel against a real Postgres; migrations reproducible; seed works.
- Login works; roles enforced server-side; employee vs manager see correctly scoped views.
- Coverage shows confirmed vs projected; planners see red weeks before approving.
- Drag planning gives live, accurate conflict/coverage feedback; locked weeks & overlap rules
  respected; keyboard fallback works.
- Certs editable in the matrix instantly change coverage & board.
- Leave request can be submitted, appears for a manager, approved/denied with history +
  notification + audit entry.
- Dashboard summarizes health; reports export a clean plan/heatmap + CSV.
- The neon-kinetic look matches the referenced design; tokens centralized; reduced-motion honored.
- Unit tests cover the engines; a couple of e2e flows pass.

THINGS TO AVOID
- No throwaway prototype: this is meant to be a shippable product.
- Don't hardcode processes, colors, or staffing defaults — they live in DB/settings/tokens.
- Don't make the board pointer-only; keyboard/click fallback is required.
- Don't count drafts or cross-shift absences in overlap; don't blame pre-existing red on a
  new block (compare before/after).
- Don't persist derived UI (icon initials); derive at render.
- Don't leak data across roles; authorize on the server, never trust the client.
- Don't over-build: shift-rota assignment and time-&-attendance are PHASE 2 — stub the data
  model hooks but don't build those UIs unless asked.

DELIVERABLES
- New repo (or a clearly separated app in this one) + PR; AGENTS.md, README, ARCHITECTURE.md;
  .env.example; Prisma schema + migrations + seed; the phased features with passing
  tests/lint/typecheck; a Vercel deployment; a short write-up of what was built, the schema,
  and how to verify (commands + output).
