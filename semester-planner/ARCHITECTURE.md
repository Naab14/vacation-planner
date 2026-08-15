# Architecture

## Layout

```
semester-planner/
  design/tokens.css        # ALL colors/shadows/motion as CSS variables (source of truth)
  prisma/schema.prisma     # domain model (see below), migrations/, seed.ts
  src/
    app/                   # App Router: pages, layouts, route handlers
      api/auth/[...nextauth]/  # Auth.js handlers
      api/coverage/        # GET coverage per week range (RBAC + zod)
      login/               # credentials login (server action)
    auth.config.ts         # edge-safe Auth.js config (middleware)
    auth.ts                # Node Auth.js: credentials + argon2 + rate limit
    middleware.ts          # session gate; roles enforced server-side per action
    lib/                   # db (Prisma singleton), rbac, password, rate-limit
    server/
      engine/              # pure, unit-tested domain engines (no I/O)
        coverage.ts        #   covered vs required per process/week, confirmed|projected
        conflicts.ts       #   locked weeks, overlap, min staffing, new-red detection
      data/                # Prisma → engine-shape loaders
    components/            # ui primitives consuming ONLY token slots
```

## Principles

- **Server-authoritative:** every mutation is a server action / route handler that
  starts with `requireRole(...)`; the client is never trusted. Engines run on the
  server; the board's live drag preview may re-run the same pure functions client-side
  for latency, but the server re-validates on save.
- **Tokens, not hexes:** components reference Tailwind slots that resolve to
  `design/tokens.css` variables. Reduced motion zeroes the kinetic tokens globally.
- **Pure engines:** `src/server/engine/*` take plain data in, return plain data out —
  unit-tested without a database. Loaders in `src/server/data/` adapt Prisma rows.
- **Sparse demand:** missing `Demand` rows fall back to `Settings.defaultRequired`
  in exactly one place (the coverage engine).
- **Shifts are always separate** (S1/S2 grouping); there is no combined/summer mode.
- **Immutable history:** `LeaveEvent` rows are insert-only; `AuditLog` records every
  mutation with before/after snapshots.

## Domain model

Organization → Users (ADMIN/MANAGER/EMPLOYEE, optional Operator link), Operators
(shift, active, certifications), Processes (slug-keyed; certifications ARE processes),
Demand (per process/year/week, sparse), AbsenceBlock (DRAFT → REQUESTED → PENDING →
APPROVED/DENIED, `dayStatuses` jsonb for day-zoom), LeaveEvent (approval trail),
Settings (staffing rules, locked weeks, thresholds), Holiday (SE), AuditLog,
Notification.

## Coverage semantics

- `confirmed` counts only APPROVED absences as out; `projected` adds PENDING +
  REQUESTED so planners see impact before approving. DRAFT/DENIED never count.
- Assignment: single-cert operators first; multi-cert operators to the process with
  the lowest covered/required ratio.
- Levels: green (covered ≥ required), yellow (exactly required−1), red (below that).

## Conflict semantics

Candidate create/move/resize is compared **before vs after** so pre-existing
problems are never blamed on the new block. Locked weeks are the only hard block
(admin can override). Overlap counts distinct absent operators with projected
statuses within the same shift only.
