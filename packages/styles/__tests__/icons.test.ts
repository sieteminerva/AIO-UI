import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * The icon channel: `icons.css` links, it does not inline.
 *
 * The sheet is published on its own (`@aio-ui/styles/icons.css`, and therefore its own CDN
 * path), so its relative `url("imgs/…")` is the whole contract — one missing sibling 404s
 * silently and the glyph simply never draws. These assertions are the only thing standing
 * between a renamed export and a blank icon in production.
 */
const DIR = join(process.cwd(), "packages/styles/icons");
const sheet = readFileSync(join(DIR, "icons.css"), "utf8");
const files = readdirSync(join(DIR, "imgs")).filter((name) => name.endsWith(".svg")).sort();

const linked = Object.keys(Object.fromEntries([...sheet.matchAll(/url\("imgs\/([\w-]+\.svg)"\)/g)].map((m) => [m[1], true]))).sort();

describe("the icon channel links, and every link resolves", () => {
  it("never inlines a glyph", () => {
    expect(sheet).not.toMatch(/data:image/);
  });

  it("points every rule at a file that ships beside it", () => {
    expect(linked.length).toBeGreaterThan(100);
    expect(files.filter((name) => !linked.includes(name))).toEqual([]);
  });

  it("leaves no file unreferenced", () => {
    expect(linked.filter((name) => !files.includes(name))).toEqual([]);
  });

  it("carries the base sheet, so it also works linked on its own", () => {
    expect(sheet).toMatch(/@import "\.\.\/src\/icon\.css";/);
  });

  it("is packaged and exported, which is what gives it a CDN path", () => {
    const manifest = JSON.parse(readFileSync(join(process.cwd(), "packages/styles/package.json"), "utf8"));

    // jsDelivr serves the tarball contents: a folder left out of `files` never reaches it.
    expect(manifest.files).toContain("icons");
    expect(manifest.exports["./icons.css"].default).toBe("./icons/icons.css");
  });
});
