# Quickstart: Validate the Personal Profile Website

## Prerequisites

- Node.js 20 or newer
- A modern browser
- `gh` (GitHub CLI), signed in, for the publish step

## Local validation

0. After any change to `styles.css` or `fluid.js`, run `node tools/stamp.mjs` so the page references the new file.
1. From the repository root run `node tests/check-profile.mjs`. Expected: every check prints `PASS` and the
   exit code is 0.
2. Open `index.html` in a browser. Resize to 360 px, 768 px, and 1440 px wide. Expected: no horizontal
   scroll, no overlapping text.
3. Disable JavaScript and confirm all sections still show on the static red background. With JavaScript on, move
   the pointer and confirm the ember smoke leaves trails, cards sink under the cursor, and the portrait drags and spins.
4. Print preview. Expected: a clean one or two page layout.

## Publish validation

1. Push to `main` in a public repository named `M0405251083_IGustiPutuAdityaParamaNanda_AboutMeAI62`.
2. Enable GitHub Pages (source: `main`, folder `/`).
3. Request the Pages URL. Expected: HTTP 200 and the profile name in the response body.
4. Create the short link at ipb.link with the slug `M0405251083-IGustiPutuAdityaParamaNanda-aboutmeAI62`
   pointing to the Pages URL. Expected: opening it lands on the profile.
5. Submit both URLs in Google Classroom.

See [data-model.md](data-model.md) for the content each section must contain.
