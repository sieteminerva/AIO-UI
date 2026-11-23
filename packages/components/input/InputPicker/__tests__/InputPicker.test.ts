// @vitest-environment happy-dom
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { PickerBuilder, pickerInputModule } from "../InputPicker";
import { InputBuilder } from "../../Input";

/**
 * The picker is a grid behind one control. Two looks share one tree, so the tests drive
 * the popover look (trigger + panel) and the expanded look (grid inline), and assert the
 * single source of truth: `#selected` reaches cells, trigger and the hidden input together.
 *
 * The sheet is read from disk so a rule the build silently drops cannot hide from here.
 */
const sheet = readFileSync(
  resolve(process.cwd(), "packages/components/input/InputPicker/InputPicker.css"),
  "utf8",
);

const ICONS = ["gear", "user", "checkmark", "close", "plus", "search"];

function build(overrides: Record<string, unknown> = {}, content: Record<string, unknown> = {}): HTMLElement {
  return new PickerBuilder({ kind: "icon", columns: 3, ...overrides }).create({
    content: {
      id: "featureIcon",
      title: "Pilih Ikon",
      name: "featureIcon",
      options: ICONS,
      ...content,
    },
  }) as HTMLElement;
}

function cell(root: HTMLElement, value: string): HTMLElement {
  const found = root.querySelector<HTMLElement>(`.cell[data-value="${value}"]`);
  if (!found) throw new Error(`no cell for ${value}`);
  return found;
}

/** The selector declares `wrapper: ".field"`, so the inner `.picker` is one level down. */
function inner(root: HTMLElement): HTMLElement {
  const found = root.matches(".picker") ? root : root.querySelector<HTMLElement>(".picker");
  if (!found) throw new Error("no .picker root");
  return found;
}

describe("picker", () => {
  it("renders one cell per option, with the string shorthand normalised", () => {
    const root = build({ columns: 6 });

    const cells = root.querySelectorAll(".cell");
    expect(cells).toHaveLength(ICONS.length);
    expect(cell(root, "gear").querySelector(".name")?.textContent).toBe("gear");
    expect(inner(root).style.getPropertyValue("--picker-columns")).toBe("6");
    expect(inner(root).dataset.kind).toBe("icon");
  });

  it("draws the global icon for a cell and for the trigger preview", () => {
    const root = build();

    const icon = cell(root, "user").querySelector("i.icon");
    expect(icon?.classList.contains("user")).toBe(true);
    // Nothing selected yet: the trigger has no preview and shows the placeholder.
    expect(root.querySelector(".trigger .preview")?.childElementCount).toBe(0);
    expect(root.querySelector(".trigger .label")?.classList.contains("is-placeholder")).toBe(true);
  });

  it("splits an icon name on dots and spaces, so a multi-word class never reaches classList", () => {
    // `classList.add("hand swipe")` throws: the name is two classes, not one token.
    const root = new PickerBuilder().create({
      content: { options: ["user.settings", "hand swipe"] },
    }) as HTMLElement;

    const dotted = cell(root, "user.settings").querySelector("i.icon")!;
    expect([...dotted.classList]).toEqual(expect.arrayContaining(["user", "settings"]));

    const spaced = cell(root, "hand swipe").querySelector("i.icon")!;
    expect([...spaced.classList]).toEqual(expect.arrayContaining(["hand", "swipe"]));
  });

  it("selects one cell and pushes the choice into the label, aria and hidden value", () => {
    const root = build();
    const hidden = root.querySelector<HTMLInputElement>(".value")!;
    const events: string[] = [];
    root.addEventListener("picker:change", () => events.push("picker:change"));
    hidden.addEventListener("change", () => events.push("change"));

    cell(root, "gear").click();

    expect(cell(root, "gear").getAttribute("aria-selected")).toBe("true");
    expect(root.querySelector(".trigger .label")?.textContent).toBe("gear");
    expect(root.querySelector(".trigger .preview i.icon")).not.toBeNull();
    expect(hidden.value).toBe("gear");
    expect(hidden.name).toBe("featureIcon");
    expect(events.sort()).toEqual(["change", "picker:change"]);
  });

  it("keeps the panel open for a multiple picker and joins the values", () => {
    // `multiple` is part of the picker's content — the same door `options` and `value` use.
    const root = build({}, { multiple: true });
    root.querySelector<HTMLElement>(".trigger")!.click();
    expect(root.querySelector<HTMLElement>(".panel")!.dataset.open).toBe("true");

    cell(root, "gear").click();
    cell(root, "user").click();

    expect(root.querySelector<HTMLInputElement>(".value")!.value).toBe("gear,user");
    expect(root.querySelector<HTMLElement>(".panel")!.dataset.open).toBe("true");
    expect(root.querySelector(".trigger .label")?.textContent).toBe("gear +1");

    // A second press on the same cell deselects it instead of adding a duplicate.
    cell(root, "gear").click();
    expect(root.querySelector<HTMLInputElement>(".value")!.value).toBe("user");
  });

  it("closes after a single pick", () => {
    const root = build();
    root.querySelector<HTMLElement>(".trigger")!.click();
    cell(root, "plus").click();

    expect(root.querySelector<HTMLElement>(".panel")!.dataset.open).toBeUndefined();
  });

  it("filters the grid and surfaces the empty note only when nothing matches", () => {
    const root = build();
    const search = root.querySelector<HTMLInputElement>(".search")!;
    const empty = root.querySelector<HTMLElement>(".empty")!;

    search.value = "che";
    search.dispatchEvent(new Event("input"));
    expect(cell(root, "checkmark").hidden).toBe(false);
    expect(cell(root, "gear").hidden).toBe(true);
    expect(empty.hidden).toBe(true);

    search.value = "zzz";
    search.dispatchEvent(new Event("input"));
    expect(empty.hidden).toBe(false);
  });

  it("prints the grid inline when expanded, with no trigger and no popover", () => {
    const root = build({ expanded: true });

    expect(root.querySelector(".trigger")).toBeNull();
    expect(inner(root).dataset.expanded).toBe("true");
    expect(root.querySelector(".panel")?.hasAttribute("popover")).toBe(false);
    expect(root.querySelectorAll(".cell")).toHaveLength(ICONS.length);
  });

  it("accepts a preset selection, as an array or a comma string", () => {
    const many = new PickerBuilder().create({
      content: { options: ICONS, value: ["gear", "close"], multiple: true },
    }) as HTMLElement;
    const one = new PickerBuilder().create({ content: { options: ICONS, value: "user" } }) as HTMLElement;

    expect(many.querySelector<HTMLInputElement>(".value")!.value).toBe("gear,close");
    expect(cell(many, "close").getAttribute("aria-selected")).toBe("true");
    expect(one.querySelector(".trigger .label")?.textContent).toBe("user");
  });
});

describe("picker input module", () => {
  let warn: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warn = vi.spyOn(console, "warn").mockImplementation(() => { });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("declines every field type it does not own", () => {
    const adapter = pickerInputModule.load({ builderConfig: { themeId: "default" } });
    const host = { builderConfig: { themeId: "default" } };

    expect(adapter.renderControl?.({ type: "text", id: "a" } as any, host)).toBeNull();
  });

  it("builds the picker through InputBuilder, reading the flat settings", () => {
    const root = new InputBuilder({ modules: [pickerInputModule] }).create({
      content: {
        type: "picker",
        id: "featureIcon",
        title: "Pilih Ikon",
        value: "gear",
        config: { style: "icon", column: 4, options: ICONS },
      },
    } as any);

    const picker = inner(root);
    expect(picker).not.toBeNull();
    expect(picker.style.getPropertyValue("--picker-columns")).toBe("4");
    expect(picker.querySelectorAll(".cell")).toHaveLength(ICONS.length);
    expect(picker.querySelector<HTMLInputElement>(".value")!.value).toBe("gear");
    expect(warn).not.toHaveBeenCalled();
  });

  it("falls back to a native select and says which module is missing", () => {
    const root = new InputBuilder({ modules: [] }).create({
      content: {
        type: "picker",
        id: "featureIcon",
        title: "Pilih Ikon",
        config: { options: ["gear", "user"] },
      },
    } as any);

    expect(root.querySelector(".picker")).toBeNull();
    expect(root.querySelector("select")).not.toBeNull();
    const message = String(warn.mock.calls[0]?.[0] ?? "");
    expect(message).toContain('"picker" module');
    expect(message).toContain("@aio-ui/input/picker (pickerInputModule)");
  });
});

describe("picker sheet", () => {
  it("has one root selector, nests with `&`, and never writes a Sass `&-` join", () => {
    expect(sheet).toMatch(/^\.field \.picker\[data-kind\] \{/m);
    expect(sheet).not.toMatch(/&-[a-z]/i);
  });

  it("derives the surface tokens from the input layer", () => {
    const derived = [...sheet.matchAll(/--picker-[a-z-]+:\s*var\(--input-[a-z-]+/g)];
    expect(derived.length).toBeGreaterThanOrEqual(6);
  });

  it("shows the panel only for its open, expanded or non-popover states", () => {
    expect(sheet).toMatch(/\[data-open="true"\]\s*\{\s*display:\s*block/);
    expect(sheet).toMatch(/\[data-expanded="true"\]\s*\.panel/);
  });

  it("drops the motion when the user asks for reduced motion", () => {
    expect(sheet).toMatch(/@media \(prefers-reduced-motion: reduce\)/);
  });
});
