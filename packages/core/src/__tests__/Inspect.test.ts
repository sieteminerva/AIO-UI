// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";

import { DOMRenderer } from "../DOMRenderer";
import { inspectPage } from "../Inspect";

/**
 * `inspectPage()` — the page-level inspection door.
 *
 * The renderer already records every node it builds; this function is the one honest way to
 * read that back. Two rules are pinned here because they follow from how the recording works
 * and are invisible in the signature:
 *
 * - the pool is complete only on the root (a child holds a partial snapshot),
 * - the markup is raw — anti-FOUC markers included — so a caller can diff without the
 *   framework having quietly decided what "equal" means.
 */

function buildPage(renderer = new DOMRenderer()): HTMLElement {
  return renderer.render(
    {
      "main.page": {
        "div.hero": { content: "hello" },
        "div.grid": { content: "world" },
      },
    } as any,
    undefined,
    undefined
  );
}

describe("inspectPage()", () => {
  it("returns the markup of the root it was given", () => {
    const { html } = inspectPage(buildPage());

    expect(html.startsWith("<main")).toBe(true);
    expect(html).toContain("hello");
    expect(html).toContain("world");
  });

  it("returns the complete record pool, counted", () => {
    const page = inspectPage(buildPage());

    expect(page.nodeCount).toBe(page.records.length);
    expect(page.nodeCount).toBeGreaterThanOrEqual(3);
  });

  it("names the key and relation of every record, so a caller can walk the tree", () => {
    const { records } = inspectPage(buildPage());

    for (const record of records) {
      expect(typeof record.key).toBe("string");
      expect(record.relations).toBeDefined();
    }

    const keys = records.map((record) => record.relations?.key);
    expect(keys).toContain("main.page");
    expect(keys).toContain("div.hero");
  });

  it("returns the renderer's markup unchanged — no anti-FOUC markers, because none exist here", () => {
    const { html } = inspectPage(buildPage());

    // The hold belongs to `Builder.create()`, not to the renderer, so a page built from
    // plain nodes has no `data-loaded` / `--is-loading` residue to normalise away.
    expect(html).not.toContain("data-loaded");
    expect(html).not.toContain("is-loading");
  });

  it("is stable across two renders of the same document", () => {
    expect(inspectPage(buildPage()).html).toBe(inspectPage(buildPage()).html);
  });

  it("does not throw on an element that carries no records", () => {
    const bare = document.createElement("div");

    expect(inspectPage(bare)).toEqual({ html: '<div></div>', records: [], nodeCount: 0 });
  });
});
