// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";

import { Builder } from "../Base";

/**
 * `config.selectors[key].color` — the general ink door.
 *
 * One property only: a selector that names a `color` must land on the element as an inline
 * `color`, which is what lets any component expose "override my main ink" without a
 * bespoke `config.color` per component. A selector that names no colour must not touch the
 * `style` attribute at all, so a sheet's token keeps deciding.
 */

class InkBuilder extends Builder<"@ink" | "@ink>label", any> {
  readonly builderId = "table" as const;
  readonly name = "table" as const;
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
          "@ink": { tagName: "div", className: "ink" },
          "@ink>label": { tagName: "span", className: "label" },
        },
        slots: {},
      },
      config,
    );
  }

  public prepare(): HTMLElement {
    const root = this.render("@ink")!;
    root.appendChild(this.render("@ink>label")!);
    return root;
  }

  protected template(): void { }

  public initialize(): void { }
}

describe("selector color", () => {
  it("writes the selector's colour as inline ink", () => {
    const builder = new InkBuilder({
      selectors: { "@ink>label": { tagName: "span", className: "label", color: "tomato" } },
    });

    const root = builder.create();

    expect((root.querySelector(".label") as HTMLElement).style.color).toBe("tomato");
  });

  it("leaves the element untouched when no colour is declared", () => {
    const root = new InkBuilder().create();

    expect((root.querySelector(".label") as HTMLElement).getAttribute("style")).toBeNull();
  });

  it("keeps the colour when the caller overrides the rest of the selector", () => {
    const builder = new InkBuilder({
      selectors: {
        "@ink": { tagName: "div", className: "ink", color: "tomato" },
        "@ink>label": { tagName: "span", className: "label", color: "goldenrod" },
      },
    });

    const root = builder.create();

    expect(root.style.color).toBe("tomato");
    expect((root.querySelector(".label") as HTMLElement).style.color).toBe("goldenrod");
  });
});
