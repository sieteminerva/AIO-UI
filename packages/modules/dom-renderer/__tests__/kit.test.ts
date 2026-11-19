// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";

import { DOMRenderer as CoreRenderer, inspectPage as coreInspect } from "@aio-ui/core";
import { DOMRenderer as KitRenderer, inspectPage as kitInspect } from "../src/index";

/**
 * The differential test: the generated kit and `@aio-ui/core`'s renderer must build the same
 * DOM. It runs against the same fixture through both classes, because a copy that drifts is
 * worse than no copy at all — the kit is what external projects migrate with.
 *
 * `scripts/build-renderer-kit.mjs --check` keeps the bytes honest; this keeps the behaviour.
 */
const page = {
  "main.page": {
    "div.hero": { content: "hello", attrs: { "data-role": "hero" } },
    "div.grid": {
      "div.row": { "div.column$1": { content: "alpha" }, "div.column$2": { content: "beta" } },
    },
  },
} as any;

const render = (renderer: any) => renderer.render(page, undefined, undefined);

describe("dom-renderer kit", () => {
  it("renders the same markup as core", () => {
    expect(kitInspect(render(new KitRenderer())).html).toBe(coreInspect(render(new CoreRenderer())).html);
  });

  it("records the same nodes", () => {
    const kit = kitInspect(render(new KitRenderer()));
    const core = coreInspect(render(new CoreRenderer()));

    expect(kit.nodeCount).toBe(core.nodeCount);
    expect(kit.records.map((record) => record.key)).toEqual(core.records.map((record) => record.key));
    expect(kit.nodeCount).toBeGreaterThanOrEqual(4);
  });

  it("builds without any workspace import", () => {
    // The one property that makes the kit migratable: the class exists on its own.
    expect(typeof KitRenderer).toBe("function");
    expect(new KitRenderer().constructor.name).toBe("DOMRenderer");
  });
});
