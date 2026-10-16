---

description: "Task list for the personal profile website"
---

# Tasks: Personal Profile Website

**Input**: Design documents from `/specs/001-personal-profile-site/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: One conformance script (`tests/check-profile.mjs`) is included because the constitution requires
verification before publishing (principle V). It is written first and fails until the page exists.

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup

- [X] T001 Initialize Spec Kit project and its own git repository at the project root
- [X] T002 [P] Copy the student photo to `assets/profile.png`
- [X] T003 [P] Create `.gitignore` and `README.md` at the repository root

## Phase 2: Foundational

- [X] T004 Write `tests/check-profile.mjs` covering FR-001 to FR-010: required fields present, forbidden data
  absent, no placeholder tokens, all `src` and `href` paths resolve, `lang="en"`, viewport meta present.
  Run it and confirm it fails because `index.html` does not exist yet.

**Checkpoint**: Failing test in place. Page work can begin.

## Phase 3: User Story 1 - Identify the student at a glance (P1) MVP

**Goal**: All required content on the page.

**Independent Test**: `node tests/check-profile.mjs` passes the content checks.

- [X] T005 [US1] Create `index.html` with semantic landmarks, hero (photo, name, NIM, program), details list
  (cohort, group, birth place and date, home and current address), interests, expectations, and contact
  links, in formal English
- [X] T006 [US1] Re-run `node tests/check-profile.mjs` and fix content until every check passes

## Phase 4: User Story 2 - Read comfortably on any device (P2)

**Goal**: Professional, responsive presentation.

**Independent Test**: Visual check at 360, 768, and 1440 px; no horizontal scroll.

- [X] T007 [US2] Create `styles.css` with design tokens, responsive layout, focus styles, AA contrast, and
  print rules; link it from `index.html`
- [X] T008 [US2] Render the page at 360, 768, and 1440 px in a headless browser, inspect screenshots, and
  fix any overflow or overlap

## Phase 5: User Story 3 - Reach the student and verify the submission (P3)

**Goal**: Working links, published page, short-link value ready.

**Independent Test**: Pages URL returns 200 with the student's name.

- [X] T009 [US3] Confirm all external links in `index.html` use the public handles from `data-model.md`
- [X] T010 [US3] Commit all work on `main` with small descriptive commits
- [X] T011 [US3] Create the public repository `M0405251083_IGustiPutuAdityaParamaNanda_AboutMeAI62`, push
  `main`, and enable GitHub Pages from `main` at `/`
- [X] T012 [US3] Request the Pages URL until it returns HTTP 200, then confirm the response contains the
  student's full name and the photo URL also returns 200
- [X] T013 [US3] Write the final Pages URL and the ipb.link value into `README.md` and commit

## Phase 6: Polish

- [X] T014 Run `node tests/check-profile.mjs` one last time and mark all tasks complete
- [ ] T015 [FR-012, SC-005] Hand off to the student: create the ipb.link short link, confirm the current-address and
  expectations text, and submit both URLs in Google Classroom (cannot be done from this machine)

## Phase 7: First redesign (FR-013, superseded by Phase 8)

- [X] T016 Amend constitution to v1.1.0 (local progressive-enhancement JS allowed) and add FR-013 to spec
- [X] T017 Update `tests/check-profile.mjs` for local deferred scripts and `fluid.js` safety checks
- [X] T018 Rewrite `index.html` and `styles.css` in a first noir style (replaced in T022)
- [X] T019 Write a first WebGL2 background shader (replaced in T024)
- [X] T020 Verify at 360/768/1440 px, with JS disabled, and with reduced motion; commit, push, check live

## Phase 8: Red noir v2, performance, and design rules (FR-013, FR-014, Principle V)

- [X] T021 [FR-014] Serve the portrait as WebP (50 KB to 3.8 KB) with PNG fallback and `fetchpriority=high`
- [X] T022 [FR-013] Rebuild `index.html` and `styles.css` after the red noir reference: pill nav, starfield and
  grid, gradient headline, shiny-border button, bento details, red banner, contact cards, outlined footer word
- [X] T023 [FR-013] Self-host Inter and Manrope under `assets/fonts/` with a licence note
- [X] T024 [FR-013] Replace the first shader with a vanilla WebGL2 port of the LiquidEther solver loop; verify no
  NaN, no GL errors, about 31 steps per second, pointer takeover and auto-driver resume
- [X] T025 [FR-014] Cap the simulation at 30 fps with a scaled step and remove all `backdrop-filter`
- [X] T026 [IV] Add a worst-case contrast test over the brightest smoke pixel and set the brightness cap to 0.30
- [X] T027 [V] Anti-slop pass: remove fake live dot, placeholder circles, eyebrow labels, duplicate CTA labels;
  hero fits 1366x768; add dash, hero-length, and CTA-label tests
- [X] T028 [SC-002, SC-006] Measure with Lighthouse (mobile, simulated slow 4G, 3 runs) before and after
- [X] T029 Run `/speckit-analyze`, fix spec, plan, research, data-model, tasks, and checklist drift
- [X] T031 [FR-016] Found that the owner's Windows has Animation effects off, so every animation was (correctly)
  disabled; refactor `fluid.js` into a lazily created simulation with an on-page opt-in switch, CSS keyed on
  `.motion-on`, and tests
- [X] T030 [FR-015] Reproduce the reported unstyled page (new HTML with the previous cached CSS), add `tools/stamp.mjs`
  content-hash versioning for `styles.css` and `fluid.js`, and a test that fails when the stamp is stale

## Phase 9: Background content and privacy (FR-006, FR-008, FR-017)

- [X] T032 Record the owner's request in the constitution (v1.3.0: email removed from the allowed links), spec
  (FR-006, FR-008, FR-017), data model, and plan before touching the page
- [X] T033 [FR-006, FR-008] Remove the email address and every `mailto:` link from `index.html`; point the hero
  and nav "Contact me" buttons at the contact section and the closing button at LinkedIn
- [X] T034 [FR-017] Add Education, Organisations, Projects, Training, and Skills sections from the CV, resume, and
  IBM certificate, in formal English
- [X] T035 Extend `tests/check-profile.mjs`: no email address or `mailto:` anywhere, every new entry present,
  no Indonesian course titles; re-stamp, run, and check the page at 360, 768, 900, and 1440 px
- [X] T036 [FR-001] Replace the portrait: `profile_3x4.png` was the square photo stretched vertically (page rendered it at
  exactly 3:4, so the distortion was in the file). Rebuilt `assets/profile.png` and `.webp` from `linkedin_profile.png` by
  cropping to 3:4, and added tests that both files are 3:4 and the same size

## Phase 10: Always-on motion and interactions (FR-010, FR-016, FR-018)

- [X] T037 Record the owner's decision in the constitution (v1.4.0), spec (FR-010, FR-016, FR-018), research (Decision 12)
- [X] T038 Remove the motion switch, the reduced-motion CSS and the opt-in logic; update the tests first
- [X] T039 Rewrite `fluid.js`: dye field, vorticity, wandering emitters, smoke shading, click and scroll reactions, quality governor
- [X] T040 Add `motion.js`: press-in cards, spinnable portrait, split-letter headings, scroll reveal, magnetic buttons, scroll-spy
- [X] T041 Add motion tokens to `styles.css` and write `design-system.md`
- [X] T042 Verify drag decay, hover dent, heading reveal, fluid trails, contrast, byte budget, and the live site
- [X] T043 Calm the fluid (slower, dimmer, softer) and show training and certificate dates as a year only; update design-system.md and FR-018(d)
- [X] T044 Colour theme: tap the portrait's back-face diamond or press Enter to switch red and steel; the portrait holds on the back after a tap; fluid tints with the theme; steel contrast and structure checks; update FR-018(b, e) and design-system.md
- [X] T045 Replace the wipe with a blob that grows from the portrait card (frozen old-look copy clipped outside it, square mesh on the edge, no view transitions); the fluid tint follows the same wave; repeated Enter ignored; structural checks and visual frames (plan: docs/superpowers/plans/2026-10-11-theme-micro-mesh.md)

## Dependencies

- T004 before T005. T005 before T007. T007 before T008. T010 before T011. T011 before T012. T012 before T013.
- T002 and T003 can run in parallel with each other.
