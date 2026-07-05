# Agent notes — semester-planner

- Read `docs/PLAN.md` and `ARCHITECTURE.md` first. The brief is `../FABLE_PROMPT.md`.
- Work happens in `semester-planner/`; the repo root is the legacy SPA (reference
  only — do not modify, do not port code line-by-line).
- **Never hardcode colors/shadows/durations** — add tokens to `design/tokens.css`
  and map them in `src/app/globals.css` `@theme inline`.
- **Every mutation** starts with `requireRole(...)` from `src/lib/rbac.ts` and
  validates input with zod. Employees may only touch their own operator's data
  (`assertOperatorAccess`).
- Engines in `src/server/engine/` stay pure (no Prisma imports); add tests beside
  them. Run `npm run test`, `npm run lint`, `npm run typecheck` before committing.
- Schema changes go through `npx prisma migrate dev --name <change>` — never edit
  applied migrations.
- Local dev DB: `postgresql://planner:planner@127.0.0.1:5432/semester_planner`
  (Postgres 16 in the dev container; start with `pg_ctlcluster 16 main start`).
- Swedish-first wording ("v.22" for weeks, S1/S2 shift labels). Shifts are always
  planned separately — no combined/summer view.
- Conventional commits; small reviewable steps; push to the designated branch only.
