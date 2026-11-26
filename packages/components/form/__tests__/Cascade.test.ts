// @vitest-environment happy-dom
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

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
 * A wizard whose `content` is not "step, step, step".
 *
 * The engine keeps two numbers apart: `index` is the position in `content` (cascade paths
 * and `dataset.index` speak it), while "first"/"last step" belong to the steps that
 * actually exist. Treating the position as an ordinal broke both ends: `content` opening
 * with anything that is not a group threw `Langkah ke-0 tidak dikenal`, and a node after
 * the last group took the Submit button away. These tests are the proof of both halves.
 */
describe("multistep boundaries from the steps that exist", () => {
  const step = (id: string, type: string) => ({ id, group: [{ content: { type, id: `${id}-field`, label: id } }] });

  /** Button order of the live nav set, read by role rather than by class name. */
  const nav = (form: HTMLFormElement): string[] =>
    Array.from(form.querySelectorAll<HTMLButtonElement>(".buttons.set button")).map((button) =>
      button.classList.contains("next") ? "next" : button.classList.contains("back") ? "back" : button.type === "submit" ? "submit" : "?"
    );

  const active = (form: HTMLFormElement) => form.querySelector<HTMLElement>("fieldset.active") ?? null;
  const current = (form: HTMLFormElement) => active(form)?.dataset.index ?? null;

  const build = (content: any[]): HTMLFormElement =>
    builder().create({ content, config: { multistep: true } }) as HTMLFormElement;

  it("mounts the smallest held step when a header precedes the steps", () => {
    const form = build([`<p class="wizard-head">Pendaftaran</p>`, step("h1", "email"), step("h2", "text"), step("h3", "text")]);

    expect(form.querySelector(".wizard-head")).not.toBeNull();
    // Position 0 is the header, so the opening step lives at schema position 1 — and it
    // must not offer a Back button, because there is no step behind it.
    expect(current(form)).toBe("1");
    expect(active(form)?.id).toBe("h1");
    expect(nav(form)).toEqual(["next"]);
  });

  it("walks next/back over those steps and ends on Submit", () => {
    const form = build([`<p class="wizard-head">Pendaftaran</p>`, step("h1", "email"), step("h2", "text"), step("h3", "text")]);

    form.querySelector<HTMLButtonElement>(".buttons.set button.next")!.click();
    expect(current(form)).toBe("2");
    expect(nav(form)).toEqual(["back", "next"]);

    form.querySelector<HTMLButtonElement>(".buttons.set button.next")!.click();
    expect(current(form)).toBe("3");
    expect(nav(form)).toEqual(["back", "submit"]);

    form.querySelector<HTMLButtonElement>(".buttons.set button.back")!.click();
    expect(current(form)).toBe("2");
    expect(nav(form)).toEqual(["back", "next"]);
  });

  it("keeps Submit on the last step when content follows it", () => {
    const form = build([step("t1", "email"), step("t2", "text"), `<p class="wizard-tail">Catatan</p>`]);

    form.querySelector<HTMLButtonElement>(".buttons.set button.next")!.click();

    expect(active(form)?.id).toBe("t2");
    expect(nav(form)).toEqual(["back", "submit"]);
  });

  it("offers Submit, not a dead Next, when the wizard has one step", () => {
    const form = build([step("solo", "email")]);

    expect(nav(form)).toEqual(["submit"]);
  });

  it("does not animate the opening step as if it were reached from behind", () => {
    const form = build([`<p class="wizard-head">Pendaftaran</p>`, step("a1", "email"), step("a2", "text")]);

    // Nothing has moved yet, so neither the step nor the nav set carries a direction.
    expect(form.querySelector("[animate]")).toBeNull();

    form.querySelector<HTMLButtonElement>(".buttons.set button.next")!.click();

    expect(form.querySelector(".buttons.set")?.getAttribute("animate")).toBe("next");
    expect(form.querySelector('fieldset[data-index="1"]')?.getAttribute("animate")).toBe("back");
  });
});

/**
 * The nav set is shaped by tokens, not by two competing blocks.
 *
 * The wizard used to repeat `.buttons.set` only to add a border and padding. Both shapes
 * now share one rule, which made the difference a token — and a token that nobody declares
 * is not a default, it is a silently dropped border. happy-dom runs no cascade, so the
 * declaration is pinned as text here; the rendered box is checked in the browser probe.
 */
describe("the nav set reads tokens that exist", () => {
  const sheet = readFileSync(resolve(process.cwd(), "packages/components/form/Form.css"), "utf8");

  it("declares every `--form-buttons-*` that `.buttons.set` reads", () => {
    const used = new Set([...sheet.matchAll(/var\((--form-buttons-[a-z]+)/g)].map((match) => match[1]));

    expect(used.size).toBeGreaterThan(0);
    for (const name of used) {
      // Two shapes, two declarations: the plain form's default and the wizard's override.
      expect(sheet.match(new RegExp(`${name}:`, "g"))?.length ?? 0).toBeGreaterThanOrEqual(2);
    }
  });

  it("lets the wizard close the step box with its own values", () => {
    const wizard = /\.form:is\(\.multistep\) \{([\s\S]*?)\n\}/.exec(sheet);

    expect(wizard).not.toBeNull();
    expect(wizard![1]).toMatch(/--form-buttons-padding: 1\.5em;/);
    expect(wizard![1]).toMatch(/--form-buttons-border: 1px solid var\(--input-border-color\);/);
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
        expect(held.dataset.span).toBe("100");
      }

      const ref = form.querySelector("#ref") as HTMLInputElement;
      ref.value = "A-1";
      ref.dispatchEvent(new Event("input", { bubbles: true }));
      await tick();

      const memo = form.querySelector("#memo")!.closest(".field") as HTMLElement;
      expect(memo.dataset.span).toBe("100");
      expect(memo.style.getPropertyValue("--span")).toBe("100");
      expect(memo.style.gridColumn).toBe("1 / span 100");
    });
  }
});
