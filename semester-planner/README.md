# Semester Planner

Shift & personnel management for a manufacturing team: operators, certifications,
vacation planning on a drag-and-drop board, staffing coverage vs demand per process
per week, and a leave request → approval workflow. Swedish-first UI.

Full-stack rebuild of the legacy client-only SPA at the repo root — see
`../FABLE_PROMPT.md` (brief) and `docs/PLAN.md` (build plan).

## Stack

Next.js 15 (App Router, TypeScript strict) · PostgreSQL + Prisma · Auth.js
(credentials, argon2, JWT, server-side RBAC) · Tailwind v4 driven by
`design/tokens.css` · Vitest + Playwright · Vercel.

## Getting started

```bash
cd semester-planner
npm install
cp .env.example .env      # fill in DATABASE_URL, AUTH_SECRET, ADMIN_EMAIL/PASSWORD
npx prisma migrate dev    # create/apply migrations
npm run db:seed           # demo org, 16 operators, 5 processes, demand, absences
npm run dev               # http://localhost:3000
```

Seeded logins: the admin from `ADMIN_EMAIL`/`ADMIN_PASSWORD`, plus demo users
`manager@example.com` / `anna.lindgren@example.com` (password `demo-password`).

## Commands

| Command | What |
|---|---|
| `npm run dev` / `build` / `start` | Next.js |
| `npm run lint` / `typecheck` / `test` | ESLint · tsc · Vitest |
| `npm run test:e2e` | Playwright (needs a seeded database; see `docs/VERIFICATION.md`) |
| `npm run db:migrate` / `db:deploy` / `db:seed` / `db:studio` | Prisma |

## Environment

See `.env.example`. Secrets are never committed; email features degrade
gracefully when `RESEND_API_KEY` is unset.

## Deploy (Vercel)

1. Vercel project → root directory `semester-planner/`.
2. Env vars: `DATABASE_URL` (Neon/Supabase pooled string), `AUTH_SECRET`,
   `ADMIN_EMAIL`, `ADMIN_PASSWORD`, optional `RESEND_API_KEY`.
3. Migrations run via `prisma migrate deploy` (see `vercel.json` build command).

Full walkthrough: `docs/DEPLOY.md`. Verification log: `docs/VERIFICATION.md`.
