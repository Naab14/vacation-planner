# Design tokens — status & provenance

**Source of truth per the brief:** the neon-kinetic design at
`https://claude.ai/design/p/d4672239-17e6-4b80-a21b-eac4a80e91ff?file=Semester+Planner.html`

**Access status: BLOCKED from the build environment.** The share link redirects to
`claude.ai/login` (it is scoped to the owner's Claude account), and the login page is
additionally behind a Cloudflare Turnstile challenge. Attempted via WebFetch (403),
curl (Cloudflare challenge), and a real headless Chromium through the egress proxy
(reaches the page, then is bounced to login). The raw bundle is hosted on
`claudeusercontent.com` behind the same auth.

**To unblock (any one of these):**
1. In the design page, download/copy the `Semester Planner.html` file and commit it to
   this repo (e.g. `semester-planner/design/reference/Semester Planner.html`), or
2. Paste the design's `<style>` / CSS variable block into the PR, or
3. Publish the design as a public artifact and share that URL.

Until then, `tokens.css` is a **provisional** implementation of the brief's written
guardrails, structured so reconciliation touches only two files:

- `design/tokens.css` — every color, glow, radius, font, duration as CSS variables,
  dark (primary) + light themes, `prefers-reduced-motion` zeroing.
- `tailwind.preset.ts` (phase 0) — maps Tailwind theme slots onto the variables
  (`bg-panel`, `text-primary`, `shadow-glow-accent`, `ease-spring`, …).

Components consume only Tailwind classes / `var(--…)` — no hardcoded hexes — so
swapping in the real palette is a token-file diff, not a refactor.

## Token groups

| Group | Tokens | Notes |
|---|---|---|
| Surfaces | `--bg-primary/secondary/panel/raised`, `--border(-strong)` | 4-step dark elevation ramp |
| Text | `--text-primary/secondary/inverse` | WCAG AA against their surfaces |
| Neon accents | `--accent`, `--accent-secondary`, `--accent-alert`, `--accent-ok` | violet / cyan / rose / mint |
| Glows | `--glow-accent/ok/risk` | 3-layer box-shadows; only on interactive/active elements |
| Block statuses | `--{draft,requested,pending,approved,denied}-{bg,border}` | same slots as the reference SPA |
| Coverage | `--coverage-{green,yellow,red}` | drives coverage rows + heatmap |
| Holidays | `--holiday-*`, `--holiday-pattern` | striped pattern kept from SPA |
| Motion | `--motion-{fast,base,slow}`, `--ease-spring`, `--lift-{hover,drag}` | springy transform/opacity only (GPU-friendly); zeroed under reduced motion |
| Type & radii | `--font-{heading,body,mono}`, `--radius-*` | fonts inherited from SPA pending real spec |
