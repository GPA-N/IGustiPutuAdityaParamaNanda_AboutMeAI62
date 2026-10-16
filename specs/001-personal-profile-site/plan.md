# Implementation Plan: Personal Profile Website

**Branch**: `001-personal-profile-site` | **Date**: 2026-10-10 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/001-personal-profile-site/spec.md`

## Summary

Build a single-page, formal-English personal profile as hand-written HTML and CSS, with one local vanilla-JS
file (`fluid.js`) as an optional WebGL2 background, served by GitHub Pages from the repository root. A small Node script checks the page against the
spec (required fields, forbidden data, asset paths) so "done" is verified rather than assumed.

## Technical Context

**Language/Version**: HTML5, CSS3, and one local vanilla-JS file (`fluid.js`, WebGL2) as progressive enhancement; Node.js 20+ only for the local check script

**Primary Dependencies**: None at runtime. Inter and Manrope (Latin, variable woff2, 73 KB, SIL OFL) are self-hosted; no CDN assets

**Storage**: Static files in the repository (`index.html`, `styles.css`, `fluid.js`, `assets/`)

**Testing**: `node tests/check-profile.mjs` (content, copy, performance, and worst-case contrast checks); Lighthouse mobile lab runs; manual viewport check at 360/768/1440 px and on a 1366x768 laptop

**Target Platform**: Any modern browser, hosted on GitHub Pages (branch `main`, root folder)

**Project Type**: Static single-page website

**Performance Goals**: Page weight under 300 KB; loads in under 3 seconds on a typical mobile connection

**Constraints**: No build step, no backend, no third-party scripts, formal English, WCAG AA contrast

**Scale/Scope**: One page, eleven content sections, about 260 lines of HTML and 300 lines of CSS

## Constitution Check

| Principle | Status | Note |
|-----------|--------|------|
| I. Static and Dependency-Free | Pass | Plain HTML/CSS, system fonts, no build |
| II. Complete and Accurate Profile Content | Pass | Check script asserts all 11 required items |
| III. Privacy-Aware Publishing | Pass | Check script rejects phone, religion, blood type, street address |
| IV. Formal English, Readable Everywhere | Pass | Responsive CSS, semantic landmarks, alt text, no JS needed |
| V. Verify Before Publish | Pass | Check script plus HTTP 200 check on the Pages URL |

Re-evaluated after Phase 1 design: no violations.

## Project Structure

### Documentation (this feature)

```text
specs/001-personal-profile-site/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── checklists/requirements.md
└── tasks.md
```

### Source Code (repository root)

```text
index.html               # The page
styles.css               # Presentation (dark red noir theme)
fluid.js                 # Optional WebGL2 fluid background (port of a Navier-Stokes projection loop), no dependencies
assets/
├── profile.webp         # Student photo, served first (3.8 KB)
├── profile.png          # Same photo, fallback (50 KB)
└── fonts/               # Inter and Manrope, Latin variable woff2, plus licence note
tests/
└── check-profile.mjs    # Spec conformance checks
tools/
└── stamp.mjs            # Writes content hashes into asset URLs (run after editing CSS or JS)
README.md                # Short description and submission URLs
```

`contracts/` is omitted: the site exposes no API or external interface.

**Structure Decision**: Flat static layout at the repository root so GitHub Pages serves `index.html`
without configuration.

## Complexity Tracking

No constitution violations. Nothing to justify.
