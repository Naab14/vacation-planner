# Design tokens — status & provenance

**Source of truth:** the owner's design bundle, received 2026-07-06 and archived in
`design/reference/` (HANDOFF.md — the hifi spec, DESIGN_STRATEGY.md — the creative
brief, sp-app.jsx — the 8-theme palette map). Aesthetic: **Neo-Kinetic**
(Neo-Brutalism × Memphis) — warm paper surfaces, 2px ink borders, hard 4px offset
"game-piece" shadows, Epilogue 900 italic display, indigo/coral/yellow triad,
light default + soft dark.

**Status: RECONCILED.** `tokens.css` implements the Neo-Kinetic default theme
(light + soft dark) from the bundle. The remaining 7 themes (Duck Pond, Citrus
Grove, Electric Plum, Harbor, Monochrome, Lumina, Playful) live in the archived
THEMES map and can be added as alternate `[data-theme]` blocks + a theme picker
when wanted. The bundle's `sp.css` (1134 lines) was not part of the upload; the
HANDOFF.md spec is detailed enough that shadows, radii, status colors and type
treatments are matched from it.

Components consume only Tailwind classes / `var(--…)` — no hardcoded hexes —
so palette changes remain a token-file diff, not a refactor.

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
