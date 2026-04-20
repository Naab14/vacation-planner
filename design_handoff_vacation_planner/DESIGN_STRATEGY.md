# Design System Strategy: The Digital Playground

## 1. Overview & Creative North Star
**Creative North Star: "Neo-Kinetic Travelogue"**

This design system is built to transform the logistical friction of travel planning into a high-energy, ludic experience. We are moving away from the quiet, "safe" corporate aesthetics of modern tech toward a high-contrast, **Neo-Brutalism meets Memphis-Modern** vibe. 

The goal is to break the "standard template" look. We achieve this through:
*   **Intentional Asymmetry:** Overlapping containers and off-grid typography placements that suggest movement.
*   **Tonal Depth:** Replacing boring 1px lines with deep, atmospheric layering.
*   **Tactile Play:** Every interaction should feel like moving a physical game piece across a digital board.

The UI is not a static grid; it is a dynamic playground where the user's journey begins the moment they open the app.

---

## 2. Colors & The Surface Manifesto

### The Palette
We utilize a high-impact palette where `primary` (Electric Indigo), `secondary` (Neon Coral), and `tertiary` (Sun-Drenched Yellow) dominate the visual field. 

*   **Primary (#4F46E5):** The engine of the app. Use for core actions and momentum-building elements.
*   **Secondary (#FF4D6D):** The "pop" of energy. Reserved for high-value alerts, playful accents, and "heart" moments.
*   **Tertiary (#FFD60A):** The sun-drenched highlight. Best used for "Joy Points" and travel rewards.

### The Rules of Engagement
1.  **The "No-Line" Rule:** We do not use 1px solid borders to section content. Boundaries must be defined solely through background color shifts. For example, a `surface-container-low` section sitting on a `surface` background creates a clean, sophisticated break without the "boxed-in" feeling of a line.
2.  **Surface Hierarchy & Nesting:** Treat the UI as stacked sheets of material. Place `surface-container-highest` elements on top of `surface-container` to indicate priority.
3.  **The "Glass & Gradient" Rule:** To provide a premium "soul," use subtle gradients (Primary to Primary-Container) for CTAs. For floating headers or navigation bars, use **Glassmorphism** (semi-transparent surface colors with a `backdrop-filter: blur(20px)`).
4.  **Signature Textures:** Apply a 2% grain or noise overlay on `surface` colors to give the "Digital Playground" a tactile, printed-matter quality.

---

## 3. Typography: The Editorial Voice

We pair the unapologetic punch of **Epilogue** with the modern utility of **Plus Jakarta Sans**.

*   **Display & Headlines (Epilogue):** This is our "voice." It is bold, expressive, and authoritative. Headlines should often use tight letter-spacing (-0.02em) to feel like an editorial magazine.
*   **Body & Labels (Plus Jakarta Sans):** This is our "guide." It provides high legibility for itineraries and flight details. 

**Typography Hierarchy:**
*   **Display-LG (3.5rem):** Use for hero "Let's Go" moments.
*   **Headline-MD (1.75rem):** For destination names and major categories.
*   **Body-LG (1rem):** For travel descriptions and itinerary notes.
*   **Label-MD (0.75rem):** For metadata (e.g., flight numbers, time zones).

---

## 4. Elevation & Depth: The Neo-Brutalism Layering

Forget standard drop shadows. We use **Tonal Layering** and **Ambient Shadows** to create a "tactile game board" feel with a compact, efficient spatial rhythm.

1.  **The Layering Principle:** Depth is achieved by "stacking." A `surface-container-lowest` card placed on a `surface-container-low` background creates a natural lift.
2.  **Ambient Shadows:** When an element must "float" (like a FAB or a modal), use an extra-diffused shadow. 
    *   *Shadow Rule:* Blur: 40px, Opacity: 6%, Color: `on-surface` (tinted with `primary`). This mimics natural light rather than digital mud.
3.  **The "Ghost Border" Fallback:** If a border is required for accessibility, use the `outline-variant` token at **15% opacity**. Never use 100% opaque borders.
4.  **Dynamic Shapes:** We use subtle roundedness for a sharp, modern feel. Shapes feature a slight corner radius to maintain the Neo-Brutalist structure without feeling aggressive.

---

## 5. Components

### Buttons
*   **Primary:** `primary` background with `on-primary` text. Use a 4px offset shadow of `primary_dim` to give it a "pressed" game-button feel.
*   **Secondary:** `secondary_container` with `on-secondary_container` text. 
*   **Tertiary:** Glassmorphic background (semi-transparent `surface`) with a `primary` outline-variant ghost border.

### Cards & Lists
*   **The Divider Ban:** Strictly forbid the use of divider lines. Separate list items using `compact` vertical white space or subtle alternating background shifts between `surface` and `surface-container-low`.
*   **Interactive Cards:** Cards should feature a consistent subtle corner radius. Upon hover/active state, they should shift from `surface-container` to `surface-container-highest` with a slight "tilt" (1-2 degrees) to emphasize the playful nature.

### Input Fields
*   **Styling:** Minimalist containers using `surface-container-high`. Labels should be `label-md` in `on-surface-variant`.
*   **Error State:** Use `error` text and a soft `error_container` background fill. No harsh red outlines.

### Chips (Destinations & Tags)
*   **Selection Chips:** Use `primary_container` for the active state and `surface-container-highest` for inactive. Ensure high contrast with `on-primary-container` text.

---

## 6. Do’s and Don’ts

### Do:
*   **Do** lean into an efficient use of space. Our compact spacing ensures information density remains high but readable.
*   **Do** use asymmetrical layouts. Let an image "break" the container or a headline "bleed" into a margin.
*   **Do** use vibrant gradients for progress bars to make the "boring" parts of planning feel like leveling up in a game.

### Don’t:
*   **Don't** use 1px gray dividers. They kill the premium feel of this system.
*   **Don't** use standard #000000 shadows. Always tint your shadows with the `primary` or `on-surface` color.
*   **Don't** use more than three font weights per screen. Let the size and the font family do the work.
*   **Don't** over-round components; maintain the subtle, slightly sharp architectural vibe of the current theme.