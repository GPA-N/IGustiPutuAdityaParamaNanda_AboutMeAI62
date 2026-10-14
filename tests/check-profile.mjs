// Conformance checks for specs/001-personal-profile-site/spec.md (FR-001 to FR-017).
// Run from the repository root: node tests/check-profile.mjs
import { existsSync, readFileSync, statSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { VERSIONED, hashOf } from "../tools/stamp.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const indexPath = join(root, "index.html");

const results = [];
const check = (name, ok, detail = "") => results.push({ name, ok, detail });

if (!existsSync(indexPath)) {
  check("index.html exists at the repository root", false);
} else {
  const html = readFileSync(indexPath, "utf8");
  const text = html
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ");

  check("index.html exists at the repository root", true);
  check('<html lang="en">', /<html[^>]*\slang="en"/i.test(html));
  check("viewport meta tag", /<meta[^>]+name="viewport"/i.test(html));
  check("<title> present", /<title>[^<]+<\/title>/i.test(html));

  // FR-001 photo with alt text
  const img = html.match(/<img[^>]+src="assets\/profile\.png(?:\?v=[0-9a-f]{8})?"[^>]*>/i);
  check("FR-001 photo present", Boolean(img));
  const webp = html.match(/<source[^>]+srcset="([^"?]+\.webp)(?:\?v=[0-9a-f]{8})?"[^>]*type="image\/webp"/i);
  check("performance: portrait offers a WebP source that exists", Boolean(webp) && existsSync(join(root, webp[1])));
  // The portrait files must be 3:4 and agree with each other, so the CSS frame never has to stretch or crop them.
  const pngPath = join(root, "assets/profile.png");
  const webpPath = webp ? join(root, webp[1]) : "";
  if (existsSync(pngPath) && existsSync(webpPath)) {
    const png = readFileSync(pngPath);
    const wp = readFileSync(webpPath);
    const pngSize = [png.readUInt32BE(16), png.readUInt32BE(20)];
    const webpSize = wp.toString("ascii", 12, 16) === "VP8 " ? [wp.readUInt16LE(26) & 0x3fff, wp.readUInt16LE(28) & 0x3fff] : [0, 0];
    check("FR-001 portrait PNG is exactly 3:4", pngSize[0] * 4 === pngSize[1] * 3, pngSize.join("x"));
    check("FR-001 portrait WebP has the same size as the PNG", pngSize[0] === webpSize[0] && pngSize[1] === webpSize[1], `${pngSize.join("x")} vs ${webpSize.join("x")}`);
    check("FR-001 img width and height attributes match the file", Boolean(img && img[0].includes(`width="${pngSize[0]}"`) && img[0].includes(`height="${pngSize[1]}"`)));
  }
  check("performance: LCP portrait has fetchpriority=high", Boolean(img && /fetchpriority="high"/.test(img[0])));
  check("FR-001 photo has descriptive alt text", Boolean(img && /alt="[^"]{15,}"/.test(img[0])));

  // FR-002 to FR-005 required content
  const required = {
    "FR-002 full name": "I Gusti Putu Aditya Parama Nanda",
    "FR-002 study program": "Artificial Intelligence",
    "FR-002 cohort": "62",
    "FR-004 hobbies heading": "Interests",
    "FR-005 expectations heading": "Expectations",
  };
  for (const [name, needle] of Object.entries(required)) {
    check(name, text.includes(needle), `looking for "${needle}"`);
  }

  // FR-006 contact links
  const links = {
    GitHub: "https://github.com/GPA-N",
    LinkedIn: "https://www.linkedin.com/in/i-gusti-putu-aditya-parama-nanda-329a342a9",
    Instagram: "https://www.instagram.com/igp.aditya.pn",
  };
  for (const [name, href] of Object.entries(links)) {
    check(`FR-006 ${name} link`, html.includes(`href="${href}"`));
  }
  const contactTargets = [...html.matchAll(/<a class="(?:shiny|pill-btn)"[^>]*href="([^"]+)"/g)].map((m) => m[1]);
  check("FR-006 every Contact me button leads to the contact section or a public profile", contactTargets.length >= 3 && contactTargets.every((t) => t === "#contact" || Object.values(links).includes(t)), contactTargets.join(", "));

  // FR-007 English only: flag common Indonesian words in visible text
  const indonesian = /\b(dan|yang|dengan|untuk|saya|adalah|dari|pada|tidak|bagi)\b/i;
  const hit = text.match(indonesian);
  check("FR-007 visible copy has no common Indonesian words", !hit, hit ? `found "${hit[0]}"` : "");

  // FR-008 forbidden data
  const forbidden = {
    "phone number": /(\+62|\b08\d{8,})/,
    "email address or mailto link": /mailto:|[\w.+-]+@[\w-]+\.[\w.]+/i,
    religion: /\b(Hindu|Hinduism|religion)\b/i,
    "blood type": /blood\s*type|golongan darah/i,
    "street-level address": /\b(Jl\.|Jalan|Gang|RT\s*\d|RW\s*\d|No\.\s*\d)/i,
  };
  for (const [name, re] of Object.entries(forbidden)) {
    check(`FR-008 no ${name}`, name.startsWith("email") ? !re.test(html) : !re.test(text));
  }

  // FR-017 background content, each entry traced to the CV, resume, or certificate (data-model.md)
  const background = {
    "education: IPB University": "IPB University",
    "education: high school": "SMAS Ekayana Ehipassiko School BSD",
    "education: high school years": "July 2022 to June 2025",
    "organisation: ISAC": "Artificial Intelligence Student Association",
    "organisation: committee": "ISAC 2026 organising committee",
    "project: multimodal API": "Gemini Flash Multimodal API",
    "project: chatbot": "Gemini Chatbot AI",
    "project: model name": "Gemini 2.5 Flash Lite",
    "skills heading": "Skills",
    "training: SanberCode": "SanberCode",
    "training: Hacktiv8": "Hacktiv8 Indonesia",
    "training: Dicoding": "Dicoding Academy",
    "training: IBM certificate": "Unleashing the Power of AI Agents",
        "training: data course": "Getting Started with Data",
    "motto": "Salam kebajikan",
  };
  for (const [name, needle] of Object.entries(background)) {
    check(`FR-017 ${name}`, text.includes(needle), `looking for "${needle}"`);
  }
  for (const id of ["education", "projects", "training", "skills"]) {
    check(`FR-017 section #${id} has a heading`, new RegExp(`<h2 id="${id}-h">`).test(html));
  }
  check("FR-017 Indonesian course titles are translated", !/Belajar Dasar|Spec-Driven Development dengan|Maju Bareng AI Program: |\bdi AWS\b/.test(text));

  // FR-010 / FR-013 JavaScript is local progressive enhancement only
  const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
  check(
    "FR-010 every <script> is a local deferred file with no inline code",
    scripts.every(([, attrs, body]) => /\ssrc="(?!https?:|\/\/)[^"]+"/.test(` ${attrs}`) && /\sdefer\b/.test(` ${attrs}`) && !body.trim()),
  );
  const external = /(?:href|src)="(?:https?:)?\/\/(?!github\.com|www\.linkedin\.com|www\.instagram\.com)[^"]+"/i;
  check("FR-013 no external stylesheet, font, script, or CDN reference", !external.test(html) && !/@import|fonts\.googleapis/i.test(html));
  if (scripts.length) {
    const fluidPath = join(root, "fluid.js");
    const js = existsSync(fluidPath) ? readFileSync(fluidPath, "utf8") : "";
    check("FR-013 fluid.js exists", js.length > 0);
    check("FR-016 fluid.js ignores the reduced-motion setting (motion is always on)", !/prefers-reduced-motion|matchMedia/.test(js));
    check("FR-013 fluid.js pauses when the tab is hidden", /visibilitychange/.test(js) && /document\.hidden/.test(js));
    check("performance: fluid.js has an adaptive quality governor", /governor/i.test(js) && /requestAnimationFrame/.test(js));
    check("FR-018 fluid.js keeps one velocity field, coloured from the theme tokens, and reacts to clicks but not to scrolling", /uVel/.test(js) && /--red/.test(js) && /pointerdown/.test(js) && !/scrollY/.test(js));
    check("FR-013 fluid.js makes no network calls", !/\b(fetch\s*\(|XMLHttpRequest|WebSocket|import\s*\(|importScripts|sendBeacon)/.test(js));
    check("FR-010 fluid.js falls back silently without WebGL2", /getContext\(\s*['"]webgl2['"]/.test(js));
    check("FR-013 canvas is decorative (aria-hidden)", /<canvas[^>]*aria-hidden="true"/i.test(html));
  }

  const css = existsSync(join(root, "styles.css")) ? readFileSync(join(root, "styles.css"), "utf8") : "";
  check("performance: no backdrop-filter over the animated canvas", !/backdrop-filter/.test(css));

  // Contrast guard: the brightest possible smoke pixel must keep text readable (constitution IV).
  const jsForPeak = existsSync(join(root, "fluid.js")) ? readFileSync(join(root, "fluid.js"), "utf8") : "";
  const peak = Number((jsForPeak.match(/peak:\s*([0-9.]+)/) || [])[1]);
  if (peak) {
    const lin = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
    const lum = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
    const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
    const page = [26, 5, 5];                       // lightest page background behind the canvas
    const ember = [239, 35, 60];                   // brightest colour fluid.js can output: --red, at full speed
    const smoke = ember.map((e, i) => Math.round(e * peak + page[i] * (1 - peak)));
    const tail = smoke.map((c) => Math.round(0.42 * 255 + 0.58 * c)); // faded end of the gradient headline
    const worst = (name, fg, min) => check(`contrast over brightest smoke: ${name} >= ${min}:1`, ratio(fg, smoke) >= min, `${ratio(fg, smoke).toFixed(2)}:1`);
    // Cards are 86% opaque, so up to 14% of the smoke shows through them.
    const cardPx = smoke.map((c, i) => Math.round(c * 0.14 + [5, 3, 4][i] * 0.86));
    check("contrast over brightest smoke through a card: grey body text >= 4.5:1", ratio([161, 161, 170], cardPx) >= 4.5, `${ratio([161, 161, 170], cardPx).toFixed(2)}:1`);
    worst("white text", [255, 255, 255], 4.5);
    worst("grey body text #a1a1aa", [161, 161, 170], 4.5);
    worst("red headline text #ff4a5e", [255, 74, 94], 3);
    check("contrast over brightest smoke: headline gradient tail >= 3:1", ratio(tail, smoke) >= 3, `${ratio(tail, smoke).toFixed(2)}:1`);
    // Steel theme: the same peak over the brightest steel colour and the steel page background
    const steelEmber = [176, 186, 201], steelPage = [21, 23, 27];   // steel --red
    const steelSmoke = steelEmber.map((e, i) => Math.round(e * peak + steelPage[i] * (1 - peak)));
    const sr = (fg) => ratio(fg, steelSmoke);
    check("contrast in steel theme: white text >= 4.5:1", sr([255, 255, 255]) >= 4.5, `${sr([255, 255, 255]).toFixed(2)}:1`);
    check("contrast in steel theme: grey body text >= 4.5:1", sr([161, 161, 170]) >= 4.5, `${sr([161, 161, 170]).toFixed(2)}:1`);
    check("contrast in steel theme: steel accent text #d9dee7 >= 4.5:1", sr([217, 222, 231]) >= 4.5, `${sr([217, 222, 231]).toFixed(2)}:1`);
    // Banner: solid band, black text, one --banner token per theme (red and steel)
    const bannerCss = existsSync(join(root, "styles.css")) ? readFileSync(join(root, "styles.css"), "utf8") : "";
    const banners = [...bannerCss.matchAll(/--banner:\s*#([0-9a-f]{6})/gi)].map((m) => [0, 2, 4].map((i) => parseInt(m[1].slice(i, i + 2), 16)));
    check("contrast on the red and steel banners: black text >= 4.5:1", banners.length === 2 && banners.every((bg) => ratio([0, 0, 0], bg) >= 4.5), banners.map((bg) => `${ratio([0, 0, 0], bg).toFixed(2)}:1`).join(" / "));
  } else {
    check("fluid.js declares a brightness cap (peak)", false);
  }

  // Link previews (LinkedIn Featured, chat apps) need absolute Open Graph tags and a real image
  const og = (k) => (html.match(new RegExp(`<meta property="og:${k}" content="([^"]+)"`)) || [])[1];
  check("share: Open Graph title, description, url and image are set", ["title", "description", "url", "image"].every((k) => og(k)));
  check("share: og:image is an absolute https URL to a file that exists", /^https:\/\/gpa-n\.github\.io\/[^"]+\/assets\/og\.jpg$/.test(og("image") || "") && existsSync(join(root, "assets", "og.jpg")));

  // Anti-slop guards on visible copy
  check("copy: no em dash or en dash in visible text", !/[\u2014\u2013]/.test(text));
  const heroLead = html.match(/<p class="lead[^"]*"[^>]*>([^<]+)<\/p>/);
  const leadWords = heroLead ? heroLead[1].trim().split(/\s+/).length : 99;
  check("copy: hero subtext is 20 words or fewer", leadWords <= 20, `${leadWords} words`);
  check("copy: one label for the contact intent", !/Get in touch|Send an email|Let.s talk/.test(text) && (text.match(/Contact me/g) || []).length >= 2);

  // Motion is always on (FR-016): no switch, no reduced-motion handling, no opt-in state
  const cssNow = existsSync(join(root, "styles.css")) ? readFileSync(join(root, "styles.css"), "utf8") : "";
  check("FR-016 no motion switch in the page", !/motion-toggle/.test(html) && !/motion-toggle|motion-on/.test(cssNow));
  check("FR-016 no reduced-motion rules in the stylesheet", !/prefers-reduced-motion/.test(cssNow));
  check("FR-016 no stored motion preference", !/localStorage/.test(jsForPeak));

  // FR-018 interactions live in motion.js
  const motionPath = join(root, "motion.js");
  const mjs = existsSync(motionPath) ? readFileSync(motionPath, "utf8") : "";
  check("FR-018 motion.js exists and is linked", mjs.length > 0 && /<script[^>]+src="motion\.js\?v=[0-9a-f]{8}"[^>]*defer/.test(html));
  check("FR-018 motion.js makes no network calls and keeps no storage", !/(fetch\s*\(|XMLHttpRequest|WebSocket|sendBeacon|localStorage)/.test(mjs));
  check("FR-018 press-in cards follow the pointer", /--press/.test(mjs) && /--px/.test(mjs) && /\.card/.test(mjs) && /translateZ/.test(cssNow));
  check("FR-018 portrait spins with decay and settles", /friction|decay/i.test(mjs) && /setPointerCapture/.test(mjs) && /ArrowLeft/.test(mjs));
  check("FR-018 portrait is keyboard focusable", /<figure[^>]*class="avatar[^"]*"[^>]*tabindex="0"/.test(html));
  check("FR-018 split headings keep their text for assistive technology", /aria-label/.test(mjs) && /aria-hidden/.test(mjs));
  check("theme: steel is a token override on the root, not a second stylesheet", /\[data-theme="steel"\]/.test(cssNow) && !/TOKENS/.test(mjs));
  check("theme: no hard-coded red rgba left in the stylesheet (tokens only)", !/rgba\(239,/.test(cssNow));
  check("theme: the fluid tints to steel with the theme", /dataset\.theme/.test(jsForPeak));
  check("theme blob: a copy of the old look is clipped to a growing blob and its animations keep the original clock", /cloneNode/.test(mjs) && /clipPath/.test(mjs) && /evenodd/.test(mjs) && /\.theme-old/.test(cssNow) && /getAnimations/.test(mjs) && !/\.theme-old \*[^{]*\{[^}]*animation:\s*none/.test(cssNow));
  check("theme blob: nothing changes at the click (real page clipped to the blob, copy outside it, page gradient under the smoke)", /live/.test(mjs) && /el\.style\.clipPath\s*=\s*['"`]polygon\(/.test(mjs) && /theme-old-bg/.test(mjs) && /\.theme-old-bg\s*\{[^}]*z-index:\s*-4/.test(cssNow));
  check("links: in-page links glide in JS (browsers skip CSS smooth scroll when the OS animation setting is off)", /a\[href\^="#"\]/.test(mjs) && /behavior:\s*'instant'/.test(mjs) && /scrollMarginTop/.test(mjs));
  check("fluid: a quality step keeps the flow, and the colour wave does not trigger one", /oldVel/.test(jsForPeak) && /if \(wave\) warm = 0/.test(jsForPeak));
  check("theme wave: the front is a canvas mesh, with no dot wipe or drain", /createElement\('canvas'\)/.test(mjs) && !/nano-wipe|nano-spark|mix-blend-mode:\s*saturation/.test(cssNow) && !/var\(--d\)/.test(cssNow));
  check("theme wave: no view transition, so any browser with canvas and CSS transitions runs the wave", !/startViewTransition|view-transition/.test(mjs + cssNow));
  check("theme mesh: no brightness swell (no flashing)", !/brightness\(1\.45\)/.test(cssNow));
  check("theme mesh: motion.js dispatches colour-theme from the portrait card", /colour-theme/.test(mjs) && /\.avatar/.test(mjs));
  check("theme mesh: repeated Enter is ignored", /e\.repeat/.test(mjs));
  check("theme mesh: a second tap cancels the running wave", /cancelAnimationFrame/.test(mjs));
  check("theme mesh: fluid.js tints by the radial wave", /colour-theme/.test(jsForPeak) && /uWave/.test(jsForPeak) && /uOrigin/.test(jsForPeak));
  check("theme: the banner follows the theme token, not a fixed red", /\.banner\s*\{[^}]*background:\s*var\(--banner\)/.test(cssNow));
  check("theme: tap or Enter switches the theme", /dataset\.theme/.test(mjs) && /Enter/.test(mjs));
  check("FR-018 letter reveal fades, slides and unblurs", /@keyframes\s+char-in/.test(cssNow) && /blur\(/.test(cssNow));

  // No placeholders
  check("no placeholder tokens", !/\b(TODO|TBD|Lorem|FIXME)\b|\[[A-Z_ ]{3,}\]/.test(html));

  // Local asset paths resolve
  const refs = [...html.matchAll(/(?:src|href)="([^"#]+)"/g)]
    .map((m) => m[1].split("?")[0])
    .filter((p) => !/^(https?:|mailto:|tel:|data:)/.test(p));
  for (const ref of refs) {
    check(`asset exists: ${ref}`, existsSync(join(root, ref)));
  }
  check("styles.css is linked", refs.includes("styles.css"));
  for (const file of VERSIONED) {
    const stamped = (html.match(new RegExp(`(?:href|src|srcset)="${file.replace(".", "\\.")}\\?v=([0-9a-f]{8})"`)) || [])[1];
    check(`FR-015 ${file} is versioned and the hash is current`, stamped === hashOf(file), stamped ? `page has ${stamped}, file is ${hashOf(file)}; run: node tools/stamp.mjs` : "no ?v= stamp; run: node tools/stamp.mjs");
  }

  // Page weight (constitution: lightweight)
  const served = ["index.html", "styles.css", "fluid.js", "motion.js", "assets/profile.webp", "assets/fonts/inter-latin.woff2", "assets/fonts/manrope-latin.woff2"];
  const bytes = served.map((f) => join(root, f))
    .filter(existsSync)
    .reduce((sum, p) => sum + statSync(p).size, 0);
  check("FR-014 total uncompressed weight under 190 KB", bytes < 190 * 1024, `${Math.round(bytes / 1024)} KB`);
  // Transfer size: text files are gzipped by GitHub Pages; WebP and woff2 are already compressed.
  const transferred = served.map((f) => join(root, f)).filter(existsSync)
    .reduce((sum, p) => sum + (/\.(html|css|js)$/.test(p) ? gzipSync(readFileSync(p), { level: 9 }).length : statSync(p).size), 0);
  check("FR-014 estimated transfer under 150 KB", transferred < 150 * 1000, `${(transferred / 1000).toFixed(1)} KB`);
}

let failed = 0;
for (const r of results) {
  if (!r.ok) failed += 1;
  console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.name}${r.detail ? `  (${r.detail})` : ""}`);
}
console.log(`\n${results.length - failed}/${results.length} checks passed`);
process.exit(failed ? 1 : 0);
