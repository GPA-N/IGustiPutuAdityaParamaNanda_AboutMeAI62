# Motion and Interaction System

Extends the existing red-noir tokens in `styles.css` (`--red`, `--black`, `--ease`, `--line`) with motion tokens and four
components. Motion is always on (constitution IV, FR-016); every pattern below must stay readable with JavaScript off.

## Motion tokens (`:root` in `styles.css`)

| Token | Value | Use |
|-------|-------|-----|
| `--ease` | `cubic-bezier(.16, 1, .3, 1)` | Everything that slides or settles |
| `--dur-fast` | `.2s` | Colour and border changes |
| `--dur-med` | `.5s` | Nav ink slide |
| `--dur-slow` | `.9s` | Letter reveal, scroll reveal |
| `--stagger-char` | `28ms` | Delay per letter (shrinks on long headings so a heading never exceeds about 0.9 s) |
| `--press-depth` | `14px` | How far a pressed card sinks |
| `--tilt-max` | `5deg` | Largest card tilt at an edge |
| `--card` | `rgba(5,3,4,.86)` | Card fill; 14% of the fluid shows through |

Physics constants live in `motion.js` (spring stiffness 170 to 210, damping 15 to 17; portrait friction 1.8 per second,
speed cap 1440 deg/s, settle below 240 deg/s). Change them there, not per element.

## PressCard (`.card`, `.contact a`)

The spot under the pointer sinks away from the viewer and the far edge lifts; a dark dent with a faint red rim follows the pointer.

| State | Behaviour |
|-------|-----------|
| Rest | `--press: 0`, transform is identity |
| Hover (mouse, pen) | `--px/--py` (-1 to 1) tilt the card, `--mx/--my` place the dent, `--press` springs to 0.55 |
| Pressed | `--press` springs to 1 (slight overshoot, capped at 1.15) |
| Leave, cancel | Everything springs back to 0 |
| Touch | Press on `pointerdown` only, springs back on release; no hover state |

Accessibility: purely visual, no change to focus order or semantics. Text keeps AA contrast over the dent (the dent only darkens).
Do: keep cards flat when printed. Don't: add a second hover effect to the same card, or tilt more than `--tilt-max`.

## SpinPortrait (`.avatar`)

A 3D group: the photo on the front, the brand diamond on the back, the red offset frame behind.

| State | Behaviour |
|-------|-----------|
| Rest | Face-front, `cursor: grab`; one 18 degree wobble about 2 s after load as a hint |
| Dragging | Pointer capture; horizontal drag turns (0.9 deg per px), vertical drag tilts (clamped to 70 deg); `cursor: grabbing` |
| Released fast | Speed measured over the last 100 ms continues and decays exponentially |
| Released slow or after a pause | No flick |
| Settling | Below 240 deg/s the nearest face (front, or back after a flip) is chosen and a damped spring settles to it |
| Keyboard | Focusable (`tabindex="0"`); arrow keys add spin, then it settles the same way |

Accessibility: the figure carries `aria-label="Portrait of Aditya. Drag to spin it, or use the arrow keys."`; the photo keeps its
descriptive alt text; the back face is `aria-hidden`. `touch-action: none` applies to this 112 px element only.
Do: end every spin on a face (front or back) so the photo is never left sideways. Don't: add momentum that never stops.

## ColourTheme (`.back-mark`, `:root[data-theme="steel"]`)

The page is red by default and can switch to steel, a greyscale with a cool cast. Colour lives in tokens: `--rgb`, `--red`, `--red-text`, `--on-red`, `--bg-top`. The steel block in `styles.css` redefines them; nothing else hard-codes a colour.

| State | Behaviour |
|-------|-----------|
| Red (default) | No `data-theme` attribute; red-noir tokens; red fluid |
| Steel | `data-theme="steel"` on `<html>`; the fluid tints to steel in the same radial wave as the page |
| Switching | Tap the diamond on the portrait's back face (under 6 px of movement), or press Enter on the focused portrait (repeats ignored). A blob grows out of the portrait card over 1.3 s. The page takes the new theme at once; a frozen copy of the old look is clipped to everything outside the blob, with a mesh of squares on the edge. No view transitions. The fluid follows the same wave |
| Holding | A tap holds the portrait on its back face so the diamond stays clickable; a flip that ends on the back settles there |

Accessibility: the choice is not stored, so each visit starts red (no localStorage). Steel has its own AA checks in `tests/check-profile.mjs`. The dissolve changes shape only (squares grow and shrink), with no brightness change, so it does not flash. The portrait's aria-label names the tap and Enter.
Do: keep steel inside the tokens and the one `:root[data-theme="steel"]` block. Don't: store the choice, or add a second switch.

## SplitHeading (`h1`, `h2`, `h3`, `.col-title`)

Each letter fades in, slides up 0.6 em and loses a 12 px blur.

| State | Behaviour |
|-------|-----------|
| No JavaScript | Plain heading text, fully visible |
| Split, not started | Letters at opacity 0 (`.split:not(.go)`) |
| Playing | `.go` adds `char-in` per letter with delay `--i * --st` |
| Done | Letters at identity; the gradient and red-word clips are applied per letter, because blur plus `background-clip: text` on the parent renders blank |

The hero plays on load after fonts are ready (1.2 s cap); the others play once when 40% visible.
Accessibility: the heading gets an `aria-label` with its real text and the letter spans are `aria-hidden`, so assistive
technology reads one heading, not letters. Words are `inline-block` so a line never breaks mid-word.
Do: keep headings short. Don't: split body text.

## Ember (`#ember` canvas, `fluid.js`)

A red fluid background made of a velocity field and a dye field. It is tuned calm on purpose (owner feedback 2026-10-10: the first version distracted): slow drift, low brightness, soft edges, gentle reactions.

| Input | Reaction |
|-------|----------|
| Idle | Three wandering emitters keep ink moving |
| Pointer | A light push and a little ink along the movement; a soft haze lingers for seconds (dye decay 0.994, velocity decay 0.96 per frame, `mouseForce` 5) |
| Click or tap | A small, soft radial puff |
| Scroll | A faint wake dragged upward in proportion to scroll speed |
| Slow device | The quality governor steps grid size and solver iterations down when frames average over 24 ms |
| Tab hidden | Stops until visible again |
| Colour theme | Tints to steel in the radial wave from the portrait card (`colour-theme` event): the new theme appears inside the blob; steel takes a cool cast |
| No WebGL2 | Canvas stays transparent; the page is unchanged |

Contrast rule: alpha is capped at `peak: 0.22` and the brightest colour at (255, 92, 64); `tests/check-profile.mjs` proves white,
grey body, red headline and gradient-tail text, and text on a card, keep their AA ratio over that worst case. Raise either number
only after the test still passes. Steel has its own check (ember [118,124,138] over page [21,23,27]).
Do: keep it behind everything with `pointer-events: none`. Don't: add `backdrop-filter` over it.

## Supporting patterns

- **Scroll reveal** (`.rv`, `.in`): blocks below the first screen rise 24 px and fade once; the class is removed afterwards.
- **Magnetic CTAs** (`.shiny`, `.pill-btn`): lean up to 8 px toward a fine pointer; skipped on touch.
- **Nav ink** (`.nav-ink`, `.cur`): a red line slides under the link of the section in view.
- **Scroll progress**: a 2 px red hairline under the nav driven by `animation-timeline: scroll(root)`; ignored where unsupported.
