# Handoff: Vacation Planner — Neo-Kinetic Travelogue Re-skin

## Overview
High-fidelity visual & interaction re-skin of the existing `vacation-planner` app (https://github.com/Naab14/vacation-planner). Same data model, same core flows (operator management, vacation block drag-draw/resize/move, day + week zoom, shift-split coverage heatmap), dressed in a **Neo-Brutalism × Memphis-Modern** aesthetic with **8 color themes** and a **soft dark mode**.

The UI language is inspired by MotherDuck's playful-yet-technical style, with two additional personality-shifting themes (Lumina = soft SaaS / Playful = candy pop).

## About the Design Files
The files in this bundle are **design references created in HTML** — a working prototype demonstrating intended look and behavior. They are **not production code to copy directly**.

The task is to **recreate these designs inside the existing `vacation-planner` React codebase** (Vite + React 18, plain JSX, CSS custom properties — already in use). All component APIs, state shapes, storage keys, and derived-data hooks in the real app should stay exactly as they are; only the **visual surface** changes.

## Fidelity
**High-fidelity (hifi).** Every color, spacing value, radius, shadow offset, font weight, and interaction state has been designed intentionally. Match the prototype pixel-for-pixel within the existing React component structure.

## Target Codebase
Existing repo: `Naab14/vacation-planner` (master branch at time of handoff: commit `3b347f7f2fc3`).

Files that will need to change:
- `src/index.css` — replace with tokens + theme system (see `sp.css` in this bundle)
- `src/App.jsx` — add theme/mode/tweaks state + `data-theme` / `data-mode` attrs on `<body>`
- `src/components/TopBar.jsx` — new markup (brand wordmark, shift pill, mode toggle, tweaks button)
- `src/components/OperatorPanel.jsx` — new card styling (avatars, shift pills, cert chips, expanded editor)
- `src/components/calendar/WeekZoomGrid.jsx` — structure unchanged; new cell/block visual states
- `src/components/calendar/DayZoomGrid.jsx` — same
- `src/components/calendar/CoverageRows.jsx` — new pill heatmap
- `src/components/calendar/BlockPopover.jsx` — new styling only
- `src/components/calendar/Legend.jsx` — updated swatches
- **New file:** `src/theme/themes.js` — theme palette map
- **New file:** `src/components/TweaksPanel.jsx` — studio controls

The existing `data.js`, `storage.js`, `csv.js`, `coverage.js`, `holidays.js`, `types.js` files are **not touched**.

---

## Design System Foundation

### Typography
```
https://fonts.googleapis.com/css2?family=Epilogue:ital,wght@0,400;0,500;0,700;0,800;0,900;1,800;1,900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Space+Mono:wght@400;700&display=swap
```

| Role | Family | Usage |
|---|---|---|
| Display (`--f-head`) | Epilogue 900 italic, tracking `-0.035em` to `-0.045em` | Brand wordmark, week badge, shift headers |
| Body (`--f-body`) | Plus Jakarta Sans 400–800 | All regular UI copy |
| Mono (`--f-mono`) | Space Mono 700, tracking `.14em`–`.24em`, uppercase | Kickers, labels, meta, cell labels, chip text |

### Design Tokens (Default "Neo-Kinetic", Light)

```css
/* Ink + paper */
--ink:      #0B0A1F;
--ink-soft: #3A3758;
--ink-mute: #807DA0;
--paper:    #FAF7F2;   /* warm off-white */
--paper-2:  #F2ECE2;
--paper-3:  #E8E0D0;
--panel:    #FFFFFF;

/* Brand */
--indigo:   #4F46E5;   /* primary   */
--coral:    #FF4D6D;   /* secondary */
--yellow:   #FFD60A;   /* tertiary / "win" state */

/* Status remap (see Status System) */
--st-draft-bg:    #EDE6D6;   --st-draft-bd:    #B8AE95;
--st-pending-bg:  #FFE4E9;   --st-pending-bd:  #FF4D6D;
--st-approved-bg: #FFD60A;   --st-approved-bd: #0B0A1F;
--st-req-bg:      #EEEBFF;   --st-req-bd:      #4F46E5;

/* Coverage */
--cov-ok:   #0EA89A;   --cov-warn: #FFD60A;   --cov-bad: #FF4D6D;

/* Geometry */
--r-s: 6px;  --r-m: 10px;  --r-l: 18px;  --r-pill: 999px;
--cell-w: 72px;   --cell-h: 38px;   --label-w: 188px;
```

### Core Shadow Language — "Game-Piece Shadow"
All interactive surfaces use a **hard 4px offset shadow**, never a soft blur:
```css
box-shadow: 4px 4px 0 0 var(--ink);
border: 2px solid var(--ink);
```
- hover → `5px 5px 0 0`
- active → `1px 1px 0 0` + `translate(3px, 3px)` (surface "seats down")
- Primary buttons use `var(--yellow)` for the shadow color; ghost variant uses `var(--coral)`

### No 1px Gray Dividers
Dividers are surface shifts (paper → paper-2 → paper-3) or dashed rules in `var(--paper-3)`. Never a solid `1px #eee` line.

### Grain Overlay
Fixed-position SVG fractal-noise turbulence at `multiply` blend, opacity `calc(var(--grain) * 0.35)`. Dark mode swaps to `screen` blend at ~0.22 opacity. Controlled via `--grain: 0–1` (default `0.55`).

### Asymmetry Knob (`--asym: 0–1`, default `0.7`)
Controls decorative tilt — sidebar yellow strip rotates `calc(-6deg * var(--asym))`, coral triangle `calc(12deg * var(--asym))`, cards tilt `calc(-0.4deg * var(--asym))` on hover. Setting `--asym: 0` produces an orthogonal version.

---

## Theme System

Eight themes, each with hand-tuned **Light** + **Soft Dark** palettes. Soft Dark means: ink ↔ paper invert but `--paper` becomes a **warm tinted dark surface** (`#1A1830`, `#1F2329`, `#1E0F26`, etc.) — **never pitch black**. Brand hues brighten for legibility.

| Theme | Light paper | Primary (light) | Personality |
|---|---|---|---|
| **Neo-Kinetic** (default) | `#FAF7F2` | `#4F46E5` indigo | Bold editorial brutalism, Memphis accents |
| **Duck Pond** | `#F4EFEA` | `#F9BC30` yellow | MotherDuck homage — yellow + sky + mint |
| **Citrus Grove** | `#F5F5F0` | `#E25D33` terracotta | Warm orange + olive |
| **Electric Plum** | `#F7F2F9` | `#7C2FAD` purple | Deep plum + magenta + teal |
| **Harbor** | `#F2F6F8` | `#0E7490` teal | Nautical teal + salmon + amber |
| **Monochrome** | `#F6F4F0` | `#0A0A0A` black | Pure B&W + single red accent |
| **Lumina** | `#FBFAFD` | `#8B7FD6` lavender | Soft SaaS — muted, minimal shadows, pill-heavy |
| **Playful** | `#FFF8F0` | `#FF3DA5` hot pink | Candy pop — bouncier radii, chunkier shadows |

**Full palette source of truth:** `sp-app.jsx`, constant `THEMES` (lines ~17-85). Each entry has `{ label, light: {…}, dark: {…} }` with keys: `ink, inkSoft, inkMute, paper, paper2, paper3, panel, indigo, coral, yellow`.

### Applying a Theme
Set two body attributes; a `useEffect` writes the active palette to CSS custom properties on `:root`:
```jsx
document.body.setAttribute('data-theme', theme);   // 'neo-kinetic' | 'duck-pond' | ...
document.body.setAttribute('data-mode', mode);     // 'light' | 'dark'
```
The effect also writes status-color custom props (they are derived from the active theme using `color-mix()` for dark mode tints — see `sp-app.jsx` around line 100).

### Theme Personality Overrides
`Lumina` and `Playful` additionally override **visual personality**, not just colors. Selectors in `sp.css` at the bottom: `body[data-theme='lumina'] …` and `body[data-theme='playful'] …`.

- **Lumina** (soft SaaS): larger radii (`--r-s: 10px`), removes game-piece shadows, uses soft `0 4px 12px rgba(…)` blurs, pill-shaped chips, thin `1px` borders, radial halo sidebar decoration instead of tilted Memphis shapes.
- **Playful** (candy pop): larger radii (`--r-s: 12px`, `--r-m: 18px`), thicker `2.5px` borders, bigger `5–8px` offset shadows using yellow/coral, `900` display weight, dot-pattern decorations.

All other themes share the default Neo-Kinetic personality, varying only in palette.

---

## Screens / Views

### 1. TopBar (56px fixed header)
Layout: `display: flex; align-items: center; gap: 18px; padding: 0 24px; height: 56px`; background `var(--ink)`, text `var(--paper)`. Bottom border `2px solid var(--ink)` in light, `1px solid var(--paper-3)` in dark.

Children L → R:
- **Brand block** — two stacked lines:
  - kicker: Space Mono 700 @ 10px, `.24em` tracking, uppercase, `rgba(255,255,255,.5)` → reads `"Uppsala · Works Planning"`
  - wordmark: Epilogue 900 italic @ 26px, `-0.035em` tracking → `"Semester.Planner"` with `.` in `var(--yellow)`, preceded by a `10px` circular `var(--coral)` dot with `0 0 0 3px var(--ink)` ring shadow
- **Shift pill** — segmented control, pill-shaped, 3 tabs (`Separate` / `Combined` / `Summer`). Active tab: `var(--yellow)` bg, `var(--ink)` text.
- **Spacer** (`flex: 1`)
- **Meta inline text** — `"Site · Uppsala  ·  Year · 2026"`, Space Mono 11px, muted. Hidden < 960px.
- **Light/Dark toggle** — ghost button showing `☀` or `☾`
- **Tweaks button** — ghost sm, text `"⚙ Tweaks"`
- **Share link** — primary button, `var(--indigo)` bg, `var(--yellow)` shadow

Decoration: a dashed yellow strip `::after` pinned to the bottom-right of the topbar (hidden on mobile).

### 2. Sidebar / Operator Panel (272px left column)
Layout: fixed-width column, `background: var(--paper-2)`, `overflow: hidden`, `position: relative`. Two Memphis decorations:
- `::before` — `140×140` yellow (`var(--yellow)`) rotated rectangle, offset into top-left, opacity `calc(var(--asym) * 0.45)`
- `::after` — coral right-triangle bleed into bottom-right (CSS borders technique), opacity `calc(var(--asym) * 0.35)`

Children top → bottom:
- **Sidebar head** — kicker `"Team · 16"` (Space Mono uppercase), then Epilogue 900 italic display: `"Crew on deck"` with `"on deck"` in `var(--indigo)` (switches to `var(--coral)` in Duck Pond / Playful, etc. — it follows `--indigo` token).
- **Collapse button** — circular, 28px, top-right. Chevron flips `‹` ↔ `›`.
- **Search** — text input with `⌕` glyph prefix and `✕` clear suffix. `2px solid var(--ink)`, `box-shadow: 2px 2px 0 0 var(--ink)`, white bg.
- **Grouped operator list** — sticky group titles: `"Shift S1"` / `"Shift S2"` (Epilogue 800 italic 14px) with count badge pill on the right.
- **Operator card** — 48px tall, `flex` row: avatar (32px circle, initials in Epilogue 800) + name (Plus Jakarta 600) + shift chip (S1 indigo / S2 coral, pill, Space Mono 10px uppercase). Hover: translate(-1px,-1px) and shadow jumps to `3px 3px`. Open state: `border-color: var(--ink)`, background `var(--panel)`.
- **Expanded editor** (when a card is open) — slides in below the card: editable name input, shift select, certification chips (toggle on/off — `var(--indigo)` bg when on, outlined when off).
- **Sidebar foot** — two side-by-side buttons: `"Import CSV"` (ghost) + `"+ Add"` (primary).

### 3. Calendar Toolbar (above grid)
One row, flex, gap 14px, padding `16px 24px 10px`:
- **Week badge** — kicker `"now viewing"` (Space Mono uppercase 9px) stacked above `"v.15 – v.26"` (Epilogue 900 italic 28px, tracking `-0.035em`)
- **Range slider** — custom `input[type=range]`, ticks visible (repeating linear gradient), 4px track, pill thumb `18×18` with `2px` ink border and `2px 2px 0 0 var(--ink)` shadow
- **Zoom toggle** — segmented `Week | Day` (default: Week). `2px solid var(--ink)`, active tab in `var(--ink)` with `var(--paper)` text
- **Legend** — 4 swatches + labels (Utkast / Väntande / Godkänd / Begärd), each `14×14` with status bg + 2px status border. Requested uses `repeating-linear-gradient(45deg, indigo 0 4px, transparent 4px 8px)`.

Beneath: a dashed rule divider `repeating-linear-gradient(90deg, var(--paper-3) 0 14px, transparent 14px 22px)`, 2px tall.

### 4. Week Zoom Grid (main work area)
CSS grid with fixed header + body rows. Outer "plate" wrapper: `3px solid var(--ink)` + `6px 6px 0 0 var(--ink)` shadow + `border-radius: var(--r-l)` + `overflow: hidden`.

**Grid header (sticky top, 44px):**
- Left cell (`cell-op`, width `var(--label-w)`, `188px`) — black bg, white Space Mono label `"Operator · Shift"`
- Week headers — `var(--cell-w)` wide each, Space Mono kicker `"vecka"` @ 9px + Epilogue 900 italic number beneath. Holiday weeks: coral-tinted bg + coral number. Current week: thin yellow bar `::after` at bottom.

**Shift section header** — when `shiftMode === 'separate'`, one of these precedes each group's rows:
- Full-width stripe, `var(--paper-3)` bg, dashed top/bottom rules
- Left: Epilogue 900 italic tag `"Shift S1"` (or S2) @ 20px
- Right: Space Mono meta `"8 operators"`

**Operator row** — 1 row = `cell-op` (name + avatar) + 12 week cells:
- Cell default: `var(--panel)` bg, `1.5px` right border in `var(--paper-3)`
- Alt weeks (`w % 2 === 0`): `var(--paper)` bg
- Holiday cell: `var(--hol-bg)` tint
- Block cell: status bg + status border, `font-family: var(--f-mono)`, centered text
- Block start cell (`is-start`): left `6px` radius, left `3px` ink border
- Block end cell (`is-end`): right `6px` radius, right `3px` ink border
- Resize handle: `8px` wide strip at cell edge, `cursor: ew-resize`, shows on hover only. On `@media (pointer: coarse)` it's `14px` wide.
- While drawing a new block: status `draft` + soft yellow outline glow
- `.override-dot` — tiny `6px` indigo dot, top-right of end cell, indicates per-day overrides exist

**Coverage row** (one per shift group) — `cell-op` left reads `"COVERAGE · S1"` (Space Mono), then per-week pills:
- Pill values `N/M` where N = available today, M = shift total
- Color bands: `ok` → teal `#0EA89A`, `warn` → yellow, `bad` → coral
- Pill shape: `border-radius: var(--r-pill)`, `2px solid var(--ink)`, `font-family: var(--f-mono)`, `11px` tracking `.12em`

### 5. Day Zoom Grid (when zoom === 'day')
Same grid skeleton but 7 date columns (Mon–Sun) for a single focus week. Header cells show Swedish weekday abbreviation (Mån, Tis, Ons, Tor, Fre, Lör, Sön) over date (`2 mar`). Weekend: diagonal-stripe background. Holiday: coral-tinted bg + coral text. Click any day in a block to open the popover scoped to that day + per-day override controls.

### 6. Block Popover
`position: fixed; width: 240px; background: var(--panel); border: 2px solid var(--ink); border-radius: var(--r-m); box-shadow: 6px 6px 0 0 var(--ink)`. Two sections separated by a dashed rule:
- **Day section** (only when opened from day view, shows date `"2026-03-02"`) — status options for this specific day
- **Block section** — status options applied to the whole block; bottom item is `✕ Delete block` in coral

Each status item: `padding: 10px 14px; display: flex; gap: 10px`; left swatch = status color, middle label, right trailing Space Mono description (e.g., `"block default"`, `"pending approval"`). Active item: ink bg, paper text.

### 7. Tweaks Panel
Floating panel, `position: fixed; right: 24px; top: 80px; width: 340px`. Header strip `var(--ink)` bg, paper text reading `Tweaks  studio`. Body padding `16px`, stacked rows:
- **Theme** — 2-col grid of theme chips, each showing 4 color swatches + label
- **Mode** — segmented `Light / Soft dark`
- **Density** — segmented `Compact / Default / Spacious` (writes `--cell-w`, `--cell-h`)
- **Accent emphasis** — segmented `Primary / Coral / Yellow` (swaps which brand color drives `--indigo`)
- **Display font** — segmented `Epilogue / Space Mono`
- **Asymmetry** — range `0–1` step `0.1`
- **Grain** — range `0–1` step `0.05`

Each row label uses Space Mono kicker + a right-aligned bold value chip.

### 8. Toast
`position: fixed; bottom: 24px; left: 50%; translate(-50%, 0); background: var(--ink); color: var(--yellow); padding: 10px 18px; border-radius: var(--r-pill); box-shadow: 4px 4px 0 0 var(--coral)`. Auto-dismisses after 2200ms.

---

## Status System

The real app uses 4 statuses: `draft | pending | approved | requested`. Remap in this design:

| Status | Label (sv) | Bg | Border | Treatment |
|---|---|---|---|---|
| `draft` | Utkast | `#EDE6D6` | `#B8AE95` | Plain filled — "sketch" paper tone |
| `pending` | Väntande | `#FFE4E9` | `#FF4D6D` coral | Solid coral-tinted |
| `approved` | Godkänd | `#FFD60A` yellow | `#0B0A1F` ink | **"Win state"** — loudest, yellow filled |
| `requested` | Begärd | `#EEEBFF` | `#4F46E5` indigo | Diagonal stripe pattern (`repeating-linear-gradient(45deg, indigo 0 4px, transparent 4px 8px)`) |

In dark mode, `pending` / `approved` / `requested` backgrounds use `color-mix(in srgb, <hue> 28%, var(--panel))` for legibility.

---

## Interactions & Behavior

### Grid Interactions (identical to existing app semantics)
- **Click empty cell** → creates a 1-week `draft` block
- **Pointer-drag across empty cells** → draws a multi-week `draft` block. Overlap prevented; drag terminates at first collision
- **Pointer-drag existing block** → moves it (honors overlap; updates `operatorId` if dragged across rows)
- **Pointer-drag block edge handle** → resizes (left/right edge)
- **Click block** → opens popover at click position
- **Long-press** (450ms without movement) → also opens popover — for trackpad users who can't click + hold comfortably
- **Click day in day-zoom with existing block** → popover with per-day override section; clicking same status as block default clears the override

### Hover States
Every interactive surface has a hover state:
- **Buttons** → `translate(-1px, -1px)` + shadow grows by 1px
- **Operator cards** → same, plus `border-color` darkens
- **Grid cells (empty)** → `filter: brightness(0.96)`
- **Blocks** → `filter: brightness(1.05)` and the resize handles fade in

### Focus States
Visible focus rings on all inputs / buttons: `outline: 3px solid var(--indigo); outline-offset: 2px`. Never remove outlines.

### Animations
- Most state changes are CSS transitions, `transition: transform 80ms ease, box-shadow 80ms ease`.
- Popover / Tweaks panel entry: `transform: translateY(6px) → 0; opacity: 0 → 1` over 140ms, easing `cubic-bezier(.2,.8,.2,1)`.
- Drag/resize: no animation — direct pointer-follow.
- Toast: slide up + fade in 200ms; fade out 300ms.

### Responsive
Breakpoints in `sp.css`:
- `≤ 960px` — layout stacks vertically; sidebar becomes a horizontal drawer above calendar (max-height 44vh); Tweaks becomes a bottom sheet; `--cell-w: 54px`
- `≤ 560px` — brand kicker hidden, shift-pill wraps to its own row, `--cell-w: 48px`, `--label-w: 124px`
- `@media (pointer: coarse)` — resize handles widened to 14px

The calendar always horizontal-scrolls at narrow widths rather than shrinking cells below readable density.

---

## State Management

### In `App.jsx` (already in the repo — add these slices)
```js
const [theme, setTheme]       = useState('neo-kinetic');       // localStorage: 'sp.theme'
const [mode, setMode]         = useState('light');             // localStorage: 'sp.mode'
const [density, setDensity]   = useState('default');           // 'compact'|'default'|'spacious'
const [accent, setAccent]     = useState('indigo');            // 'indigo'|'coral'|'yellow'
const [font, setFont]         = useState('epilogue');          // 'epilogue'|'mono'
const [asym, setAsym]         = useState(0.7);
const [grain, setGrain]       = useState(0.55);
const [tweaksOpen, setTweaksOpen] = useState(false);
```
Persist all of these in a single localStorage key `'sp.tweaks'` (merge with existing storage in `src/storage.js`).

All **operator** and **vacation block** state is unchanged — keep using the existing hooks/reducers.

### Theme application effect
On every tweak change, update CSS custom properties on `:root` and set `data-theme` / `data-mode` on `<body>`. The source-of-truth implementation is in `sp-app.jsx`, the `useEffect` around line 95. Port directly into `App.jsx`.

---

## Assets
No raster images. All visual elements are pure CSS + inline SVG:
- Grain overlay → inline SVG `<feTurbulence>` filter embedded as a data URI in CSS (see `body::before` in `sp.css`)
- Icons → Unicode characters (`✕  ⌕  ⚙  ☀  ☾  ›  ‹  +  ●`) styled with Space Mono. If the target codebase already has a Lucide / Phosphor icon set, prefer those (`Search`, `Settings`, `Sun`, `Moon`, `X`) and match the weight.
- Placeholder "Memphis" shapes → CSS transforms + border tricks on `::before` / `::after` pseudo-elements
- No logo SVG in bundle — use the wordmark treatment described above (`Semester.Planner` with coral dot + yellow period)

---

## Tweaks-as-developer-UI
The prototype exposes a Tweaks panel with theme/mode/density/etc. In the real app, keep it but put it **behind a feature flag or admin-only toggle** — it's a power-user setting, not something every user needs. The light/dark toggle and theme picker should probably graduate into the real Settings screen (`src/components/TopBar.jsx` already has a themes dropdown — fold our 8 themes in there).

---

## Files in This Bundle
- `Semester Planner.html` — entry HTML, loads React + Babel + 4 JSX files + `sp.css`
- `sp.css` — **the visual source of truth** (1134 lines). Study this most carefully.
- `sp-data.jsx` — seed data (operators, blocks, dates, helpers). Parallel to `src/data.js` + `src/holidays.js` in the real repo; prefer the real versions.
- `sp-app.jsx` — App shell, state, theme effect, drag logic. Reference for state structure + theme application.
- `sp-components.jsx` — TopBar, Sidebar, BlockPopover, Tweaks, Toast
- `sp-grid.jsx` — WeekZoomGrid, DayZoomGrid, CoverageRow
- `DESIGN_STRATEGY.md` — the Neo-Kinetic Travelogue creative brief this design is built on

## Implementation Order (suggested)
1. Pull `sp.css` tokens into `src/index.css`. Body attributes + token overrides get you 70% of the theme system.
2. Port `THEMES` map from `sp-app.jsx` → new file `src/theme/themes.js`. Add the theme-apply `useEffect` to `App.jsx`.
3. Restyle `TopBar.jsx` — quickest visible win.
4. Restyle `CalendarGrid` wrapper + header (plate + shadow + dashed divider).
5. Restyle cells + blocks + resize handles. This is the most sensitive area — match shadows and corners exactly.
6. Restyle `OperatorPanel.jsx` (sidebar).
7. Restyle `BlockPopover.jsx` + `Legend.jsx`.
8. Add `TweaksPanel.jsx` (can ship minimal first: theme + mode only).
9. Add responsive media queries from the bottom of `sp.css`.
10. Lumina + Playful personality overrides last — they're the most invasive and benefit from the base system being stable first.

## Open Questions for the Developer
- Does the real app's existing `themes` dropdown (in `TopBar.jsx`) have backend-persisted prefs? If so, reuse that mechanism instead of a new localStorage key.
- Existing CSV import / JSON export styling wasn't part of this pass — apply the same token-based visual language when you rebuild those modals.
- The prototype is desktop-first but responsive; the real app may want a distinct mobile layout (e.g., a day-at-a-time view as default < 560px) — discuss with the product owner.
