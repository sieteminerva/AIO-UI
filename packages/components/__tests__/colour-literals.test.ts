import { readFileSync, readdirSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

/**
 * Colour-literal lint — `packages/styles/TASK.md` §4 (T5).
 *
 * A component sheet must not paint a colour from a raw literal; it derives from the
 * `--app-*` contract so every theme and both modes follow. Three things are allowed, and
 * only these:
 *
 *   1. Media overlays — a caption/backdrop/lightbox sits on an arbitrary image, so its
 *      palette has to be literal. Those files are listed below and marked in their sheet.
 *   2. The code-block paper/ink pair, deliberately theme-independent (14.7:1).
 *   3. Values that cannot be literals by nature: a `var(--app-*, <fallback>)` guard, a
 *      `url(...)`/`data:` mask, a shadow (no token shape carries a shadow), and keywords
 *      such as `transparent` / `currentColor`.
 *
 * It scans source sheets only (`dist/` is generated).
 */

const here = dirname(fileURLToPath(import.meta.url));
const componentsRoot = join(here, ".."); // packages/components

/** Files where a literal is intentional (`packages/styles/TASK.md` §4). */
const ALLOWLISTED_FILES = new Set([
  "modal/Modal.css", // backdrop + lightbox chrome
  "masonry/Masonry.css", // lightbox backdrop/controls
  "carousel/Carousel.css", // caption/controls/dots on media
  "code-block/CodeBlock.css", // theme-independent paper/ink pair
]);

/** A shadow (or backdrop/lightbox token) legitimately carries a literal. */
const SHADOW_DECL = /(?:box-shadow|text-shadow|drop-shadow|--[\w-]*(?:shadow|backdrop|lightbox))/i;

/** Concrete colour syntaxes. */
const COLOUR_LITERAL = /#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(/;

/** Named colours, checked only in the value position of a declaration. */
const NAMED_COLOUR =
  /\b(?:white|black|gray|grey|silver|red|blue|green|yellow|orange|purple|pink|brown|navy|teal|olive|maroon|lime|aqua|fuchsia|cyan|magenta|gold|goldenrod|darkgoldenrod)\b/i;

/** Remove `url(...)`/`data:...` and balanced `var(...)` groups (their fallbacks are guards). */
function stripBalanced(css: string, token: string): string {
  const needle = token.toLowerCase();
  let out = "";
  let i = 0;
  while (i < css.length) {
    if (css.slice(i, i + needle.length).toLowerCase() === needle) {
      let depth = 0;
      let j = i + needle.length - 1; // at '('
      for (; j < css.length; j++) {
        if (css[j] === "(") depth++;
        else if (css[j] === ")") {
          depth--;
          if (depth === 0) {
            j++;
            break;
          }
        }
      }
      i = j;
      continue;
    }
    out += css[i++];
  }
  return out;
}

function stripComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, "");
}

/** Every source stylesheet under packages/components (no `dist`, no `__tests__`). */
function collectSheets(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === "dist" || entry.name === "__tests__") continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) collectSheets(full, acc);
    else if (entry.name.endsWith(".css")) acc.push(full);
  }
  return acc;
}

function toRel(file: string): string {
  return relative(componentsRoot, file).split(sep).join("/");
}

describe("component colour literals", () => {
  it("derive every colour from --app-* (except the §4 allowlist)", () => {
    const offenders: string[] = [];

    for (const file of collectSheets(componentsRoot)) {
      const rel = toRel(file);
      if (ALLOWLISTED_FILES.has(rel)) continue;

      let css = stripComments(readFileSync(file, "utf8"));
      css = stripBalanced(css, "url(");
      css = stripBalanced(css, "var(");

      css.split(/\r?\n/).forEach((line, index) => {
        const text = line.trim();
        // Only inspect declaration values: skip blank lines and block/selector openers.
        if (!text.includes(":") || text.includes("{") || text.includes("}")) return;
        if (SHADOW_DECL.test(text)) return;

        if (COLOUR_LITERAL.test(text)) {
          offenders.push(`${rel}:${index + 1}: ${text}`);
          return;
        }
        const value = text.slice(text.indexOf(":") + 1);
        if (NAMED_COLOUR.test(value)) {
          offenders.push(`${rel}:${index + 1}: ${text}`);
        }
      });
    }

    expect(offenders, `Raw colour literals found:\n${offenders.join("\n")}`).toEqual([]);
  });
});
