# Verification log

How each phase was verified before pushing. Everything below ran against the
production build (`next build` + `next start`) with a local PostgreSQL 16 seeded
by `prisma db seed`, in addition to CI (lint, typecheck, Vitest, build, and the
Playwright e2e job on a fresh database).

## Automated

- **Vitest (28 tests)** — coverage engine (assignment strategy, confirmed vs
  projected modes, draft/cross-shift exclusion, sparse-demand fallback),
  conflict engine (locked weeks, overlap, min-staffing, new-red detection),
  CSV escaping, ISO-week edge cases.
- **Playwright (8 tests, `npm run test:e2e`)** —
  - auth: wrong password rejected; unauthenticated → `/login`; manager sees
    Översikt/Rapporter in the nav; employee does not and is bounced from
    `/dashboard`;
  - request flow: employee submits a leave request, a manager approves it with
    a comment in a second browser session, both sides see it move to history;
  - dashboard/reports: tiles + risk table render, coverage heatmap renders,
    both CSV exports actually download, planning board shows process rows.

## Manual (real browser, per phase)

- **Board (phase 2):** drag to create/move/resize blocks with live conflict
  preview; inline demand edit as manager; coverage rows flip between
  confirmed/projected; locked weeks refuse drops.
- **Matrix/employees (phase 3):** toggled certifications and watched counts
  update; renamed and removed a process; searched employees by certification.
- **Requests (phase 4):** submit → unread badge on the manager's session →
  approve with comment → requester notified, block turned APPROVED on the
  board; withdraw returned a block to DRAFT with a CANCELLED trail entry.
- **Overview/reports (phase 5):** dashboard numbers matched the seeded data;
  exported both CSVs and opened them (UTF-8 with BOM, Swedish characters
  intact); employee sessions RBAC-redirected away.

## Accessibility spot-check

- All interactive controls are reachable by keyboard (the board has explicit
  keyboard fallbacks for drag operations).
- Icon-only buttons carry `aria-label`s; nav uses `aria-current="page"`;
  alerts use `role="alert"`; sections are landmarked (`aria-label` on
  request lists, `role="group"` on the shift picker).
- `lang="sv"` on the document; `prefers-reduced-motion` honored by the token
  pipeline; status colors are always paired with text (never color alone).

## Known limitations

- UI copy is Swedish-only. The brief's i18n slot (next-intl, `en` catalog) is
  deferred: strings live as literals today, and retrofitting next-intl is a
  mechanical extraction pass once the copy stabilizes. Nothing in the
  architecture blocks it.
- Email delivery is best-effort fire-and-await with logging; there is no retry
  queue. Fine for notification volume, revisit if delivery guarantees matter.
