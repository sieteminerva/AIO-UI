// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { Builder } from "../Base";

interface iModel {
  name: string;
  count: number;
}

class BinderBuilder extends Builder<"@binder" | "@binder>field" | "@binder>out", any> {
  readonly builderId = "table" as const;
  readonly name = "table" as const;
  readonly stylesheet = "" as const;
  public config: any;

  /** The one model the builder owns — created once, then always the proxy. */
  readonly #model = this.setProxy("model", { name: "Alice", count: 1 }) as iModel;
  /** How many times `paint()` ran, so the mirror can be counted instead of eyeballed. */
  public paints = 0;

  /** Test handle: the same proxy the mirror writes through. */
  public get data(): iModel {
    return this.#model;
  }

  constructor() {
    super();
    this.config = this.resolveConfig(
      {
        themeId: "default",
        namespace: null,
        emit: () => { },
        selectors: {
          "@binder": { tagName: "div", className: "binder" },
          "@binder>field": { tagName: "input" },
          "@binder>out": { tagName: "output" },
        },
        slots: {},
      },
      {},
    );
  }

  protected model(): Record<string, any> {
    return this.#model;
  }

  protected paint(scope: HTMLElement): void {
    this.paints += 1;
    const out = scope.querySelector("output");
    if (out) out.textContent = this.data.name;
  }

  public prepare(): HTMLElement {
    const root = this.render("@binder")!;
    const field = this.render("@binder>field")! as HTMLInputElement;
    field.dataset.bind = "name";
    // A decoy: hydration must overwrite whatever `template()` wrote.
    field.value = "from-render";
    root.append(field, this.render("@binder>out")!);
    return root;
  }

  protected template() { }

  public initialize() { }
}

const tick = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

describe("Builder binding seam: model() ↔ [data-bind]", () => {
  it("hydrates every bound control from the model before the first event", () => {
    const builder = new BinderBuilder();
    const root = builder.create({});
    const field = root.querySelector<HTMLInputElement>("input")!;

    expect(field.value).toBe("Alice");
    expect(builder.paints).toBeGreaterThan(0);
  });

  it("writes a control edit back into the model through one delegated listener", () => {
    const builder = new BinderBuilder();
    const root = builder.create({});
    const field = root.querySelector<HTMLInputElement>("input")!;

    field.value = "Bob";
    field.dispatchEvent(new Event("input", { bubbles: true }));

    expect(builder.data.name).toBe("Bob");
  });

  it("repaints every tracked scope from one model write", async () => {
    const builder = new BinderBuilder();
    const root = builder.create({});
    const field = root.querySelector<HTMLInputElement>("input")!;

    builder.data.name = "Cara";
    await tick();

    expect(field.value).toBe("Cara");
    expect(root.querySelector("output")!.textContent).toBe("Cara");
  });

  it("stops painting and listening after destroy()", async () => {
    const builder = new BinderBuilder();
    const root = builder.create({});
    const field = root.querySelector<HTMLInputElement>("input")!;

    builder.destroy();
    const paintsAfterDestroy = builder.paints;

    builder.data.name = "Dan";
    await tick();
    field.dispatchEvent(new Event("input", { bubbles: true }));

    expect(builder.paints).toBe(paintsAfterDestroy);
    // The control keeps the last value it was given; nothing writes it any more.
    expect(field.value).toBe("Alice");
    expect(builder.data.name).toBe("Dan");
  });
});
