// Stamps a content hash onto the stylesheet, script, and portrait URLs in index.html, so a browser that
// cached an older file never pairs it with newer markup (GitHub Pages caches for 10 minutes).
// Run after any change to styles.css, fluid.js, or the portrait files:  node tools/stamp.mjs
// Hashes use LF line endings so they match what GitHub Pages serves, even on Windows checkouts.
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const lf = (file) => readFileSync(join(root, file), "utf8").replace(/\r\n/g, "\n");
const isBinary = (file) => /\.(png|webp)$/.test(file);
export const hashOf = (file) => createHash("sha256").update(isBinary(file) ? readFileSync(join(root, file)) : lf(file)).digest("hex").slice(0, 8);
export const VERSIONED = ["styles.css", "fluid.js", "motion.js", "assets/profile.png", "assets/profile.webp"];

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  let html = lf("index.html");
  for (const file of VERSIONED) {
    const pattern = new RegExp(`((?:href|src|srcset)=")${file.replace(".", "\\.")}(?:\\?v=[0-9a-f]{8})?"`);
    if (!pattern.test(html)) throw new Error(`index.html does not reference ${file}`);
    html = html.replace(pattern, `$1${file}?v=${hashOf(file)}"`);
  }
  writeFileSync(join(root, "index.html"), html, "utf8");
  console.log(VERSIONED.map((f) => `${f}?v=${hashOf(f)}`).join("  "));
}
