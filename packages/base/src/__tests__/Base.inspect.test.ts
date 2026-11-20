// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";

import { Builder } from "../Base";

/**
 * SNAPSHOT PROBES — what a deterministic inspection surface would rest on, measured.
 *
 * These tests add no API. They pin the four properties an `inspect()` / `renderToHTML`
 * API would depend on, so building one is a decision made by the runtime instead of by
 * expectation. Each test buys one property:
 *
 * - **V1 determinism** — the same payload renders the same markup twice. Without this a
 *   snapshot has no value: every render would differ and every diff would be noise.
 * - **V2 metadata shape** — a builder root carries ONE record (its own), not a page graph.
 *   This is why an inspection API must be hierarchy-first, not records-first.
 * - **V4 hierarchy** — `hierarchy` is a complete key inventory with a per-key element list,
 *   and re-running the walk does not change it.
 * - **V5 anti-FOUC** — a host that declares no stylesheet loader never paints a skeleton,
 *   so a synchronous snapshot cannot be polluted by a loading mockup.
 */

/** Counts `loading()` calls across instances; V5 reads it after `create()`. */
const loadingCalls = { count: 0 };

class ProbeBuilder extends Builder<"@probe" | "@probe>item", any> {
  readonly builderId = "section" as const;
  readonly name = "section" as const;
  readonly stylesheet = "" as const;
  public config: any;

  constructor(config: any = {}) {
    super();
    this.config = this.resolveConfig(
      {
        themeId: "default",
        namespace: null,
        emit: () => { },
        selectors: {
          "@probe": { tagName: "div", className: "probe" },
          "@probe>item": { tagName: "p", className: "item" },
        },
        slots: {},
      },
      config
    );
  }

  public prepare(content: any): HTMLElement {
    const root = this.render("@probe")!;
    const rows = Array.isArray(content?.content) ? content.content : [];
    for (const row of rows) root.appendChild(this.render("@probe>item", row)!);
    return root;
  }

  protected template(typeKey: string, el: HTMLElement, payload?: any): void {
    if (typeKey === "@probe>item") el.textContent = String(payload?.title ?? "");
  }

  public initialize(): void { }

  protected loading(): HTMLElement {
    loadingCalls.count += 1;
    const skeleton = document.createElement("div");
    skeleton.setAttribute("data-skeleton", "bone");
    return skeleton;
  }
}

/** A fresh payload per call: a shared object would ride the same proxy twice. */
function payload() {
  return { content: [{ title: "One" }, { title: "Two" }] };
}

describe("inspect probes — the properties a snapshot depends on", () => {
  it("V1 — the same payload renders the same markup twice", () => {
    const first = new ProbeBuilder().create({ content: payload() });
    const second = new ProbeBuilder().create({ content: payload() });

    expect(first.outerHTML).toBe(second.outerHTML);
    expect(first.outerHTML).toContain("One");
    expect(first.outerHTML).toContain("Two");
  });

  it("V2 — a builder root carries exactly one record, not a page graph", () => {
    const root = new ProbeBuilder().create({ content: payload() });

    expect(root.getMetadata?.() ?? []).toHaveLength(1);
  });

  it("V4 — hierarchy inventories every key and its elements, idempotently", () => {
    const builder = new ProbeBuilder();
    builder.create({ content: payload() });

    const read = () => JSON.parse(JSON.stringify((builder as any).hierarchy.get()));
    const first = read();

    expect(Object.keys(first).sort()).toEqual(["@probe", "@probe>item"]);
    // Direct-layer inventory: the item elements are recorded once, deduped.
    expect(first["@probe"].elements).toEqual(["p.item"]);
    // Static key relations come from `selectorToTree` and must survive the DOM walk.
    expect(first["@probe"].children).toHaveLength(1);

    (builder as any).hierarchy.update();
    expect(read()).toEqual(first);
  });

  it("V5 — no skeleton is painted when the host declares no stylesheet loader", () => {
    loadingCalls.count = 0;
    const root = new ProbeBuilder().create({ content: payload() });

    expect(root.querySelector("[data-skeleton]")).toBeNull();
    expect(loadingCalls.count).toBe(0);
    // The hold still ran: it decided there was nothing to wait for and released at once.
    expect(root.getAttribute("data-loaded")).toBe("true");
    expect(root.style.getPropertyValue("--is-loading")).toBe("0");
  });
});
