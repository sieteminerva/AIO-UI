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

  it("gives every file the namespace an image document needs", () => {
    // A mask source is parsed as its own image document, not as markup in the page: without
    // `xmlns` the parser rejects it and the glyph draws nothing at all — two files shipped
    // that way and `hamburger` / `display list` were simply invisible.
    const broken = files.filter((name) => {
      const svg = readFileSync(join(DIR, "imgs", name), "utf8");
      return !svg.includes('xmlns="http://www.w3.org/2000/svg"');
    });

    expect(broken).toEqual([]);
  });

  it("paints every glyph opaque — a mask reads alpha, not colour", () => {
    // The `<i>` is painted with `background-color: currentColor` and the file is used as an
    // alpha mask, so a translucent stroke anywhere in the file comes out as a translucent
    // icon. Colour never matters; full alpha is the contract.
    const faint = files.filter((name) =>
      /rgba\(|opacity=|fill-opacity|stroke-opacity/.test(readFileSync(join(DIR, "imgs", name), "utf8")),
    );

    expect(faint).toEqual([]);
  });

  it("declares no behaviour of its own — the `<i>` base lives in `src/components.css`", () => {
    // The channel is storage: links only. Size, ink, mask setup and the spinner's rotation
    // are global component styling, so a host that links `index.css` has them and this sheet
    // stays one `url()` per glyph.
    expect(sheet).not.toMatch(/^i\.icon\s*\{/m);
    expect(sheet).not.toMatch(/@keyframes/);

    const base = readFileSync(join(process.cwd(), "packages/styles/src/components.css"), "utf8");
    expect(base).toMatch(/^i\.icon\s*\{/m);
    expect(base).toMatch(/mask-size: contain/);
    expect(base).toMatch(/@keyframes coreSpinLoop/);
  });

  it("is packaged and exported, which is what gives it a CDN path", () => {
    const manifest = JSON.parse(readFileSync(join(process.cwd(), "packages/styles/package.json"), "utf8"));

    // jsDelivr serves the tarball contents: a folder left out of `files` never reaches it.
    expect(manifest.files).toContain("icons");
    expect(manifest.exports["./icons.css"].default).toBe("./icons/icons.css");
  });
});
