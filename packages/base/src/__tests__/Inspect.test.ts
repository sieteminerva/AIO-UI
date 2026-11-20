// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";

import { Builder } from "../Base";

/**
 * `Builder.inspect()` — the component-level inspection door.
 *
 * The probes next door (`Base.inspect.test.ts`) proved the properties exist; this file pins
 * the API that exposes them, and the three guarantees a caller is allowed to rely on:
 * same payload → same data, reading twice changes nothing, and the inventory names the
 * elements each key actually owns.
 */

class PanelBuilder extends Builder<"@panel" | "@panel>row" | "@panel>foot", any> {
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
          "@panel": { tagName: "section", className: "panel" },
          "@panel>row": { tagName: "p", className: "row" },
          "@panel>foot": { tagName: "footer", className: "foot" },
        },
        slots: {},
      },
      config
    );
  }

  public prepare(content: any): HTMLElement {
    const root = this.render("@panel")!;
    const rows = Array.isArray(content?.rows) ? content.rows : [];
    for (const row of rows) root.appendChild(this.render("@panel>row", row)!);
    root.appendChild(this.render("@panel>foot")!);
    return root;
  }

  protected template(typeKey: string, el: HTMLElement, payload?: any): void {
    if (typeKey === "@panel>row") el.textContent = String(payload ?? "");
    if (typeKey === "@panel>foot") el.textContent = "end";
  }

  public initialize(): void { }
}

function payload() {
  return { rows: ["alpha", "beta"] };
}

describe("Builder.inspect()", () => {
  it("reports every key the instance registered", () => {
    const builder = new PanelBuilder();
    builder.create({ content: payload() });

    expect(builder.inspect().keys).toEqual(["@panel", "@panel>row", "@panel>foot"]);
  });

  it("inventories the elements each key owns, without duplicating across keys", () => {
    const builder = new PanelBuilder();
    builder.create({ content: payload() });
    const { hierarchy } = builder.inspect();

    // Two rows were built; the inventory is deduped by selector string.
    expect(hierarchy["@panel"].elements).toEqual(["p.row", "footer.foot"]);
    // A leaf key owns nothing below itself.
    expect(hierarchy["@panel>row"].elements).toEqual([]);
  });

  it("serialises the markup the instance actually produced", () => {
    const builder = new PanelBuilder();
    builder.create({ content: payload() });
    const { html } = builder.inspect();

    expect(html).toContain('class="panel"');
    expect(html).toContain("alpha");
    expect(html).toContain("end");
  });

  it("is deterministic: the same payload inspects to the same data", () => {
    const first = new PanelBuilder();
    first.create({ content: payload() });
    const second = new PanelBuilder();
    second.create({ content: payload() });

    const a = first.inspect();
    const b = second.inspect();

    expect(a.html).toBe(b.html);
    expect(a.namespace).toBe(b.namespace);
    expect(a.keys).toEqual(b.keys);
  });

  it("is idempotent: reading twice returns the same data", () => {
    const builder = new PanelBuilder();
    builder.create({ content: payload() });

    expect(builder.inspect()).toEqual(builder.inspect());
  });

  it("carries the root record, and says so honestly instead of faking a page graph", () => {
    const builder = new PanelBuilder();
    builder.create({ content: payload() });
    const { records } = builder.inspect();

    expect(records).toHaveLength(1);
    expect(records[0].relations?.key).toBe("@panel");
  });

  it("returns an empty inspection before anything was built", () => {
    const builder = new PanelBuilder();

    expect(builder.inspect()).toEqual({
      html: "",
      keys: [],
      hierarchy: {},
      namespace: null,
      records: [],
    });
  });
});
