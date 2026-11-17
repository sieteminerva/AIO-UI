// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";

import { DOMRenderer } from "../DOMRenderer";

/**
 * PAGE METADATA PROBES — what a page-level snapshot may read, and from where.
 *
 * `DOMRenderer` sews a record for every node it builds and injects a `getMetadata()`
 * closure on each element. The closures are **not** equivalent: `setMetadata` copies the
 * pool at call time, and a node is stamped before its siblings exist. Only the root is
 * re-stamped once the walk is complete.
 *
 * So the contract a snapshot must follow is: **read from the root, never from a child.**
 * These probes pin that, because it is invisible in the type signature.
 */

function renderPage(renderer = new DOMRenderer()): HTMLElement {
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

describe("DOMRenderer metadata — where the complete pool lives", () => {
  it("V3 — the root carries every record; a child carries a partial snapshot", () => {
    const root = renderPage();

    const rootRecords = root.getMetadata?.() ?? [];
    const hero = root.querySelector("div.hero") as HTMLElement;
    const heroRecords = hero.getMetadata?.() ?? [];

    // The pool is real: three nodes were built.
    expect(rootRecords.length).toBeGreaterThanOrEqual(3);
    // ...and it is only complete on the root.
    expect(heroRecords.length).toBeLessThan(rootRecords.length);
  });

  it("V3b — every record names its key, element and relations", () => {
    const root = renderPage();
    const records = root.getMetadata?.() ?? [];

    for (const record of records) {
      expect(typeof record.key).toBe("string");
      expect(record.element).toBeInstanceOf(HTMLElement);
      expect(record.relations).toBeDefined();
    }
  });

  it("V3c — a second render starts a fresh pool instead of appending", () => {
    const renderer = new DOMRenderer();

    const first = renderPage(renderer).getMetadata?.() ?? [];
    const second = renderPage(renderer).getMetadata?.() ?? [];

    expect(second.length).toBe(first.length);
  });
});
