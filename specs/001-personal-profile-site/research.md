# Research: Personal Profile Website

## Decision 1: Plain HTML and CSS, no framework

- **Decision**: Hand-written `index.html` and `styles.css`.
- **Rationale**: The assignment teaches HTML basics and GitHub Pages. A framework adds a build step the
  grader never sees and the constitution forbids it.
- **Alternatives considered**: Jekyll (GitHub Pages default, adds config and theme indirection), Vite or
  React (needs a build and a deploy action), a page generator (hides the HTML the assignment asks for).

## Decision 2: Self-hosted Inter and Manrope

- **Decision**: Self-host the Latin variable subsets of Inter (body) and Manrope (headings), 73 KB together,
  with `font-display: swap` and the heading font preloaded.
- **Rationale**: The red noir reference the owner chose depends on these faces. Self-hosting keeps the page
  free of third-party requests. This replaces the earlier system-font decision.
- **Alternatives considered**: Google Fonts link (third-party request), system stack (loses the reference look).

## Decision 3: JavaScript only as local progressive enhancement

- **Decision**: Content is plain HTML. One hand-written file, `fluid.js`, draws an optional WebGL2 "ember
  smoke" background. The assignment allows JavaScript; the limits below come from this project's own rules.
  This replaces the earlier decision to ship no script at all, which was a self-imposed choice, not an
  assignment requirement.
- **Rationale**: Every required fact lives in the HTML, so the page stays complete when the script does not
  run. `fluid.js` exits silently without WebGL2, pauses when the tab is hidden, and
  caps its colours so text contrast holds on every frame.
- **Alternatives considered**: Three.js or the React LiquidEther component (adds a dependency and a build
  step, and copies someone else's work); CSS-only gradients (kept as the always-on fallback behind the canvas);
  no script (simpler, but gives up an interactive background the owner asked for).

## Decision 4: Hosting from `main` at the repository root

- **Decision**: Enable GitHub Pages with source `main` and folder `/`.
- **Rationale**: Simplest configuration, matches the assignment's "upload and publish" steps.
- **Alternatives considered**: `docs/` folder or `gh-pages` branch (extra moving parts for one page).

## Decision 5: Verification by a Node script

- **Decision**: `tests/check-profile.mjs` parses `index.html` with plain string and regex checks.
- **Rationale**: Node is already installed, no packages are needed, and the checks map one-to-one to spec
  requirements FR-001 to FR-010.
- **Alternatives considered**: Playwright or Lighthouse (heavy installs for a one-page site). Viewport
  checks stay manual and are listed in `quickstart.md`.

## Decision 6: Repository and short-link names

- **Decision**: Repository `M0405251083_IGustiPutuAdityaParamaNanda_AboutMeAI62`; short link
  `ipb.link/M0405251083-IGustiPutuAdityaParamaNanda-aboutmeAI62`.
- **Rationale**: The assignment gives the pattern `NIM_NamaLengkap_AboutMeAI62`. GitHub names cannot contain
  spaces, so the full name is written in PascalCase without spaces.
- **Alternatives considered**: Hyphenated or lower-case names (deviate from the stated format).

## Decision 9: Content-hashed asset URLs

- **Decision**: `index.html` references `styles.css?v=<sha256 prefix>` and `fluid.js?v=<...>`. `tools/stamp.mjs`
  rewrites the hashes, and a test fails when they are stale.
- **Rationale**: GitHub Pages sends `Cache-Control: max-age=600` and offers no header control. A real visitor saw
  new markup with the previous stylesheet (unstyled bullets and default links) minutes after a deploy.
- **Alternatives considered**: Renaming files per release (manual, easy to forget), a service worker (more code
  than the page), waiting out the cache (not acceptable for a graded link).

## Decision 11: Email stays off the page; background comes only from the owner's documents

- **Decision**: No email address or `mailto:` link anywhere. "Contact me" buttons scroll to the social links (hero,
  nav) or open LinkedIn (closing). Education, organisations, projects, skills, and training are listed with
  provider and year, taken from the signed CV, the resume, and one completion certificate.
- **Rationale**: The owner asked for the address to be removed; the repository is public and an address on a
  static page is easy to harvest. A portfolio page that omitted the CV's content looked thin.
- **Alternatives considered**: Obfuscating the address in script (needs JavaScript, still harvestable), a contact
  form (needs a backend, out of scope), copying the whole CV (would publish the phone number, religion, blood
  type, and health history the constitution forbids).

## Decision 7: Fluid background as a ported solver, not a library

- **Decision**: Port the LiquidEther solver loop (BFECC advection, force splat, divergence, Poisson pressure,
  projection) to dependency-free WebGL2, with a 0.4 grid scale, 16 solver iterations, a 30 fps cap, and a
  brightness cap enforced by a test.
- **Rationale**: The component is React plus Three.js, which the constitution and the weight goal rule out.
  The algorithm carries over; the framework does not.
- **Alternatives considered**: Bundling Three.js and React (hundreds of KB, needs a build), the first
  ad-hoc smoke shader (cheaper but not a real fluid).

## Decision 8: Design rules are checked, not only intended

- **Decision**: Principle V of the constitution (distinct, not templated) is backed by tests for dashes,
  hero subtext length, and one label per contact action, and by a review of the rendered page.
- **Rationale**: The owner flagged a first version as looking generated. Rules that can be tested should be.

## Decision 10: Respect reduced motion by default, allow an explicit opt-in (superseded by Decision 12)

- **Decision**: With `prefers-reduced-motion: reduce` the page is static, but a switch ("Animations are off. Turn on")
  lets the visitor enable it; the choice is stored in `localStorage` with a safe fallback.
- **Rationale**: The owner's machine has Windows animation effects off, so the button highlight, starfield,
  entrance, and fluid background were all frozen and invisible to them. Overriding the setting silently would
  harm people who need it; hiding the effects with no way to enable them hid the page's main feature from many
  viewers (remote desktops, battery saver, VMs).
- **Alternatives considered**: Ignoring the preference (accessibility regression), a permanent static page
  (loses the design), a settings panel (more UI than the page needs).

## Decision 12: Motion is always on; interactions are vanilla CSS and JavaScript

- **Decision**: Remove the motion switch and the `prefers-reduced-motion` handling. Add `motion.js` (spring-driven card
  press-in, spinnable portrait, letter-by-letter headings, scroll reveal, magnetic buttons, nav scroll-spy) and rewrite
  `fluid.js` with a dye field, vorticity, wandering emitters, smoke shading and an adaptive quality governor.
- **Rationale**: The owner could not see the effects with the setting honoured and asked for them to stay on. Three.js and
  React stay out for weight (FR-014); LiquidEther and GhostCursor are idea sources only, the shaders are written fresh.
- **Alternatives considered**: Keeping a calmer tier for reduced-motion visitors (rejected by the owner), importing
  Three.js (about 600 KB), animation libraries (a dependency for what springs and keyframes do).
