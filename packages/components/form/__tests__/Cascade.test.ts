// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";

import { ModuleLoader } from "@aio-ui/module-loader";
import { INPUT_MODULE_DEFINITIONS } from "@aio-ui/input";

import { FormBuilder } from "../Form";
import { FORM_ADAPTER_DEFINITIONS } from "../FormAdapters";

/**
 * This file exercises cascade, multistep and the group action set, so it declares both
 * layers: the test says which engines it depends on instead of inheriting them from the
 * builder.
 */
function builder(): FormBuilder {
  return new FormBuilder({
    modules: new ModuleLoader("form", FORM_ADAPTER_DEFINITIONS),
    inputModules: INPUT_MODULE_DEFINITIONS,
  });
}

/**
 * Cascade, both hold modes.
 *
 * `template` (default) builds a conditional item only while its condition holds.
 * `hidden` builds it immediately and toggles visibility — the mode a chained picker
 * needs, because its API has to inject options into an element that does not exist yet in
 * template mode. These tests are the first proof either mode runs in a real DOM.
 */
const schema = [
  {
    id: "company",
    title: "Perusahaan",
    group: [
      { content: { type: "text", id: "brand", label: "Nama brand" } },
      { content: { type: "text", id: "address", label: "Alamat kantor" }, condition: { field: "brand", filled: true } },
    ],
  },
];

function build(mode: "template" | "hidden"): HTMLFormElement {
  return builder().create({ content: schema, config: { cascading: true, cascadeMode: mode } }) as HTMLFormElement;
}

async function type(form: HTMLFormElement, id: string, value: string): Promise<void> {
  const input = form.querySelector(`#${id}`) as HTMLInputElement;
  input.value = value;
  input.dispatchEvent(new Event("input", { bubbles: true }));
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe("cascade in template mode", () => {
  it("keeps the conditional field out of the DOM until its condition holds", async () => {
    const form = build("template");

    expect(form.querySelector("#address")).toBeNull();
    expect(form.querySelector("template[data-cascade]")).not.toBeNull();

    await type(form, "brand", "Seribu");

    expect(form.querySelector("#address")).not.toBeNull();
  });

  it("takes the field back out when the condition stops holding", async () => {
    const form = build("template");
    await type(form, "brand", "Seribu");
    expect(form.querySelector("#address")).not.toBeNull();

    await type(form, "brand", "");

    expect(form.querySelector("#address")).toBeNull();
  });
});

describe("cascade in hidden mode", () => {
  it("builds the field up front and only hides it", () => {
    const form = build("hidden");
    const field = form.querySelector("#address") as HTMLInputElement;

    expect(field).not.toBeNull();
    expect(field.closest("[data-cascade]")?.hasAttribute("hidden")).toBe(true);
  });

  it("shows it when the condition holds and hides it again when it does not", async () => {
    const form = build("hidden");
    const holder = () => form.querySelector("#address")!.closest("[data-cascade]") as HTMLElement;

    await type(form, "brand", "Seribu");
    expect(holder().hasAttribute("hidden")).toBe(false);

    await type(form, "brand", "");
    expect(holder().hasAttribute("hidden")).toBe(true);
  });

  it("never rebuilds the element, so an injected option survives the toggle", async () => {
    const form = build("hidden");
    await type(form, "brand", "Seribu");

    // Simulate a chained picker injecting into the dependent select.
    const holder = form.querySelector("#address")!.closest("[data-cascade]") as HTMLElement;
    holder.dataset.marker = "kept";

    await type(form, "brand", "");
    await type(form, "brand", "Seribu");

    expect(form.querySelector("[data-cascade]")?.getAttribute("data-marker")).toBe("kept");
  });
});

describe("multistep gate", () => {
  const steps = [
    { id: "s1", title: "Satu", group: [{ content: { type: "email", id: "m-email", label: "Email" }, config: { required: true } }] },
    { id: "s2", title: "Dua", group: [{ content: { type: "text", id: "m-city", label: "Kota" } }] },
  ];

  function buildSteps(): HTMLFormElement {
    return builder().create({ content: steps, config: { multistep: true } }) as HTMLFormElement;
  }

  const active = (form: HTMLFormElement) =>
    form.querySelector<HTMLElement>("fieldset.active")?.id ?? null;

  it("stays on the step while a required field is empty", async () => {
    const form = buildSteps();

    form.querySelector<HTMLButtonElement>(".buttons.set button.next")!.click();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(active(form)).toBe("s1");
  });

  it("advances once the step is valid", async () => {
    const form = buildSteps();
    (form.querySelector("#m-email") as HTMLInputElement).value = "budi@example.com";

    form.querySelector<HTMLButtonElement>(".buttons.set button.next")!.click();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(active(form)).toBe("s2");
  });
});

/**
 * A conditional item must follow its condition in **every** live instance, and a repeated
 * copy must be driven by its *own* inputs: the copy's controls are suffixed (`sku` →
 * `sku-1`), so the resolution is scoped to the instance that owns the condition.
 */
describe("cascade and a repeated scope", () => {
  const repeatable = [
    {
      id: "line",
      title: "Baris",
      actions: [{ type: "add", label: "Add", onClick: () => undefined }],
      group: [
        { content: { type: "text", id: "sku", label: "SKU" } },
        { content: { type: "text", id: "note", label: "Catatan" }, condition: { field: "sku", filled: true } },
      ],
    },
  ];

  const render = (mode: "template" | "hidden") =>
    builder().create({ content: repeatable, config: { cascading: true, cascadeMode: mode } }) as HTMLFormElement;

  const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

  for (const mode of ["hidden", "template"] as const) {
    it(`drives each copy from its own inputs (${mode})`, async () => {
      const form = render(mode);
      await tick();

      // No SKU yet: the note is held away — hidden in `hidden` mode, a placeholder in
      // `template` mode. Either way it is not a live element.
      const held = form.querySelector('[data-cascade]:not(template)') as HTMLElement | null;
      if (mode === "hidden") expect(held?.hidden).toBe(true);
      else expect(held).toBeNull();

      (form.querySelector("button.add") as HTMLButtonElement).click();
      await tick();

      const clone = form.querySelector("#line-1") as HTMLElement;
      const cloneSku = clone.querySelector("#sku-1") as HTMLInputElement;
      cloneSku.value = "ABC";
      cloneSku.dispatchEvent(new Event("input", { bubbles: true }));
      await tick();

      // The copy shows its note, built with the copy's own id…
      expect(clone.querySelector("#note-1")).not.toBeNull();
      const cloneNote = clone.querySelector('[data-cascade]:not(template)') as HTMLElement;
      expect(cloneNote.hidden).toBe(false);

      // …while the original still shows nothing: conditions do not leak across copies.
      const sourceItem = (form.querySelector("#line") as HTMLElement).querySelector("[data-cascade]");
      const sourceIsPlaceholder = sourceItem instanceof HTMLTemplateElement;
      expect(sourceIsPlaceholder || (sourceItem as HTMLElement).hidden).toBe(true);
    });
  }
});

/**
 * A conditional child is built by the cascade, not by the row loop, so its share of the
 * row has to be stamped a second time. Without that, a `wide: "auto"` child fell back to
 * one column and sat in half the row it asked for.
 */
describe("cascade keeps a child's share of its row", () => {
  const line = [
    {
      id: "line",
      column: 2,
      row: [
        { content: { type: "text", id: "ref", label: "Ref" }, config: { wide: 50 } },
        {
          content: { type: "text", id: "memo", label: "Memo" },
          config: { wide: "auto" },
          condition: { field: "ref", filled: true },
        },
      ],
    },
  ];

  const render = (mode: "template" | "hidden") =>
    builder().create({ content: line, config: { cascading: true, cascadeMode: mode } }) as HTMLFormElement;

  const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

  for (const mode of ["hidden", "template"] as const) {
    it(`stamps --span on the held field once it is built (${mode})`, async () => {
      const form = render(mode);

      if (mode === "hidden") {
        const held = form.querySelector("#memo")!.closest(".field") as HTMLElement;
        expect(held.dataset.span).toBe("2");
      }

      const ref = form.querySelector("#ref") as HTMLInputElement;
      ref.value = "A-1";
      ref.dispatchEvent(new Event("input", { bubbles: true }));
      await tick();

      const memo = form.querySelector("#memo")!.closest(".field") as HTMLElement;
      expect(memo.dataset.span).toBe("2");
      expect(memo.style.getPropertyValue("--span")).toBe("2");
    });
  }
});
