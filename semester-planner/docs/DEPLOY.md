# Deploying to Vercel

The app lives in `semester-planner/` inside the repository; the legacy SPA at
the repo root is untouched. Point the Vercel project at the subdirectory.

## One-time setup

1. **Vercel project**
   - Import the GitHub repo, set **Root Directory** to `semester-planner`.
   - Framework preset: Next.js (auto-detected). `vercel.json` already sets the
     build command to run `prisma migrate deploy` before `next build`, so
     migrations apply on every deploy.

2. **Database (Neon or Supabase)**
   - Easiest: Vercel Marketplace → Neon integration → it injects
     `DATABASE_URL` automatically. Otherwise create a database manually and
     add `DATABASE_URL` yourself (use the *pooled* connection string for
     serverless).

3. **Environment variables** (Vercel → Settings → Environment Variables)

   | Variable | Required | Notes |
   |---|---|---|
   | `DATABASE_URL` | yes | pooled Postgres connection string |
   | `AUTH_SECRET` | yes | `openssl rand -base64 32` |
   | `ADMIN_EMAIL` / `ADMIN_PASSWORD` | for seeding | read by `prisma db seed` |
   | `RESEND_API_KEY` | no | enables notification emails |
   | `EMAIL_FROM` | no | e.g. `Semester Planner <noreply@yourdomain>` |

4. **Seed the first admin** — run once against the production database:

   ```bash
   DATABASE_URL=... ADMIN_EMAIL=... ADMIN_PASSWORD=... npm run db:seed
   ```

   The seed is idempotent (upserts); it also creates the demo org, processes,
   operators and holidays. For a clean production org, edit `prisma/seed.ts`
   or create users through the app after seeding only the admin.

## Every deploy after that

Push to the connected branch. Vercel builds (`prisma migrate deploy && next
build`), and preview deployments get their own URL per PR. Nothing manual.

## Local production parity

```bash
npm run build && npm start          # same build Vercel runs
npm run test:e2e                    # Playwright against the production build
```
