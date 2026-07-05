# Semester Planner — Phase 0–1 plan

Full-stack rebuild per `FABLE_PROMPT.md`. App lives in `semester-planner/` (clearly
separated from the legacy SPA at the repo root); Vercel's project root will point here.
Behavior reference: `codex/vacation-planner-evolution` (`src/coverage.js`,
`src/conflicts.js`, `src/schema.js`, `src/settings.js`) — ported as typed, tested,
server-authoritative code, not copied.

## Stack decisions

| Concern | Choice | Rationale |
|---|---|---|
| Framework | Next.js 15 (App Router) + TypeScript, strict | brief mandate |
| DB | PostgreSQL (Neon) + Prisma Migrate | brief mandate; Neon has a Vercel-native integration |
| Auth | Auth.js v5 credentials provider, JWT session strategy, argon2 hashes | works on Vercel serverless without a session table; RBAC claims re-checked server-side per mutation |
| Validation | zod on every route handler / server action | brief mandate |
| Styling | Tailwind v4 + `design/tokens.css` variables via a preset | tokens are the single source of truth |
| i18n | next-intl, `sv` default / `en` ready | brief mandate |
| Tests | Vitest (engines, RBAC helpers) + Playwright (login, request→approve, drag-create) | brief mandate |
| Email | Resend, env-gated, no-op when unconfigured | phase 5 |

## Phase 0 — scaffold (one PR-reviewable commit series)

1. `create-next-app` in `semester-planner/` (TS, ESLint, Tailwind, App Router,
   `src/` layout); Prettier; strict tsconfig.
2. Tokens wired: `design/tokens.css` imported in the root layout; Tailwind preset
   mapping theme slots → CSS variables; base components (Button, Panel, Badge) to
   prove the token pipeline; dark default + light theme toggle;
   `prefers-reduced-motion` honored.
3. Prisma init with `prisma/schema.prisma` (already in this PR); `db push`-free
   workflow: `prisma migrate dev` locally, `prisma migrate deploy` on release.
4. Auth skeleton: `/login`, Auth.js credentials + argon2, middleware guarding all
   app routes, role helpers (`requireRole('MANAGER')`) used by every server action;
   basic rate limit on the credentials callback (per-IP token bucket, Upstash-free
   in-memory fallback for dev).
5. Seed admin (`ADMIN_EMAIL`/`ADMIN_PASSWORD` env, never committed).
6. Docs: `README.md` (setup, env, commands), `ARCHITECTURE.md` (real stack),
   `AGENTS.md`, `.env.example` (`DATABASE_URL`, `AUTH_SECRET`, `RESEND_API_KEY`,
   `ADMIN_EMAIL`, `ADMIN_PASSWORD`), `vercel.json` + deploy notes.
7. CI: GitHub Actions — lint, typecheck, vitest on PR.

## Phase 1 — data + engines

1. Full migration for the schema; sparse `Demand` (missing row ⇒
   `Settings.defaultRequired`).
2. Seed script: 1 org, settings (planningYear 2026, shiftMode SEPARATE, S1/S2),
   5 Swedish processes (Avsyning, Kapselresaren, Serialisering, Etikettering,
   Granskning/uttag av dok), 16 operators with certs (from reference seed),
   demand, ~10 absence blocks across statuses, SE holidays for the planning year,
   demo manager + employee users.
3. `src/server/engine/coverage.ts` — pure, typed port:
   single-cert operators assigned first; multi-cert to lowest covered/required
   ratio; `confirmed` (APPROVED) vs `projected` (APPROVED+PENDING+REQUESTED)
   modes; level green (covered ≥ required), yellow (= required−1), red
   (< required−1); thresholds read from Settings.
4. `src/server/engine/conflicts.ts` — locked weeks (hard block, admin override);
   overlap = simultaneous projected-status absences within the same shift only
   (never drafts, never cross-shift); below-min-staffing only when the candidate
   worsens it; projected-RED warning only when the candidate newly causes or
   worsens red (before/after comparison).
5. Vitest suites for both engines ported from the reference behavior + edge cases
   (draft exclusion, cross-shift exclusion, pre-existing red not blamed, locked
   week boundaries, sparse demand fallback).
6. Read-only API: `GET /api/coverage?year&from&to&mode`, RBAC-checked, zod-validated
   — consumed by phases 2+.

Exit criteria: `pnpm lint && pnpm typecheck && pnpm test` green in CI; migrations
reproducible from empty DB; seeded app logs in as admin/manager/employee.

## Open items needing input

1. **Design access (blocking pixel-perfect tokens only):** see `design/TOKENS.md` —
   commit the design HTML, paste its CSS, or publish it publicly. Build proceeds on
   provisional tokens meanwhile.
2. **Database provisioning:** no `DATABASE_URL` exists in this environment. I'll
   develop against local Postgres in CI/dev; for the Vercel deploy I need a Neon
   (or Supabase) connection string added to Vercel env — or tell me if you want the
   Vercel-Neon integration and I'll document the exact steps.
3. **Vercel deploy:** happy to wire `vercel.json` + docs now; the actual deploy
   needs the Vercel project linked to this repo with root directory
   `semester-planner/`.
