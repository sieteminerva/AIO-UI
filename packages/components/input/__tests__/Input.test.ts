// @vitest-environment happy-dom
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";

import { InputBuilder } from "../Input";
import type { InputSchema } from "../InputSchema";
import { InputAttributeBuilder } from "../Attribute";
import { INPUT_TYPE_REGISTRY, inputTypeOf, scanInputAttributes } from "../FieldTypes";
import { INPUT_MODULE_DEFINITIONS } from "../index";
import { ModuleLoader } from "@aio-ui/module-loader";

/**
 * First DOM-aware tests in the repo: a field is markup, so the contract can only be
 * pinned down by rendering it. Everything else here is the type matrix and the module set.
 */

/**
 * Renders one field: `content` is the field itself, `config` its behaviour, and `builder`
 * the constructor configuration (the module set this file exercises).
 */
function build(
  content: Record<string, any>,
  config: Record<string, any> = {},
  builder: Record<string, any> = {},
): { container: HTMLElement; control: HTMLElement } {
  // The layer ships no preset of its own since `0.2.2`, so this file states the one it
  // exercises. Degradation with no modules at all is pinned in `Modules.test.ts`.
  const container = new InputBuilder({ modules: INPUT_MODULE_DEFINITIONS, ...builder } as any)
    .create({ content, config } as any) as HTMLElement;
  const control = container.querySelector("input, textarea, select") as HTMLElement;
  return { container, control };
}

describe("InputBuilder label", () => {
  it("renders the label once, bound to the control", () => {
    const { container, control } = build({ type: "text", id: "name", label: "Nama" });
    const labels = container.querySelectorAll("label");

    expect(labels).toHaveLength(1);
    expect(labels[0].textContent).toBe("Nama");
    expect(labels[0].getAttribute("for")).toBe(control.id);
  });

  it("renders one label for a checkbox (the second one was a duplicate)", () => {
    const { container } = build({ type: "checkbox", id: "agree", label: "Saya setuju" });

    expect(container.querySelectorAll("label")).toHaveLength(1);
  });

  it("defaults a toggle label to the right so it cannot sit on the switch", () => {
    const { container } = build({ type: "checkbox", id: "agree", label: "Saya setuju" });

    expect(container.querySelector("label")?.getAttribute("data-position")).toBe("right");
  });

  it("takes an explicit position from the config", () => {
    expect(build({ type: "checkbox", id: "a", label: "A" }, { position: "left" }).container.querySelector("label")?.getAttribute("data-position")).toBe("left");
    expect(build({ type: "text", id: "b", label: "B" }, { position: "right" }).container.querySelector("label")?.getAttribute("data-position")).toBe("right");
  });

  it("leaves a plain text label without a position hint", () => {
    const { container } = build({ type: "text", id: "name", label: "Nama" });

    expect(container.querySelector("label")?.hasAttribute("data-position")).toBe(false);
  });

  it("reads the caption from `label`, the only spelling a field has", () => {
    const { container } = build({ type: "text", id: "x", label: "Real label" });

    expect(container.querySelector("label")?.textContent).toBe("Real label");
  });

  it("honours useLabel: false", () => {
    const { container } = build({ type: "text", id: "x", label: "Nama" }, { useLabel: false });

    expect(container.querySelectorAll("label")).toHaveLength(0);
  });

  it("passes position through as a data attribute, not as a different order", () => {
    const { container } = build({ type: "text", id: "x", label: "Nama" }, { position: "right" });
    const label = container.querySelector("label") as HTMLElement;

    expect(label.getAttribute("data-position")).toBe("right");
    expect(label.nextElementSibling?.tagName).toBe("INPUT");
  });
});

describe("InputBuilder attributes", () => {
  it("maps id and name, defaulting name to the id", () => {
    const { container, control } = build({ type: "email", id: "email" });

    expect(control.id).toBe("email");
    expect(control.getAttribute("name")).toBe("email");
    expect(container.querySelector("label")).toBeNull();
  });

  it("leaves boolean attributes absent when the schema says false", () => {
    // The defaults carry `required: false` / `disabled: false`; rendering those as empty
    // attributes disabled every field in the demo form.
    const { control } = build({ type: "text", id: "x", required: false, disabled: false, readonly: false });

    expect(control.hasAttribute("required")).toBe(false);
    expect(control.hasAttribute("disabled")).toBe(false);
    expect(control.hasAttribute("readonly")).toBe(false);
  });

  it("applies the attributes a text field accepts", () => {
    const { control } = build({
      type: "text",
      id: "code",
      required: true,
      readonly: true,
      disabled: true,
      maxlength: 12,
      minlength: 2,
      pattern: "^[a-z]+$",
    });

    expect(control.hasAttribute("required")).toBe(true);
    expect(control.hasAttribute("readonly")).toBe(true);
    expect(control.hasAttribute("disabled")).toBe(true);
    expect(control.getAttribute("maxlength")).toBe("12");
    expect(control.getAttribute("minlength")).toBe("2");
    expect(control.getAttribute("pattern")).toBe("^[a-z]+$");
  });

  it("drops an attribute the type does not accept", () => {
    const { control } = build({ type: "checkbox", id: "agree", placeholder: "nope" }, { maxlength: 12 });

    expect(control.hasAttribute("maxlength")).toBe(false);
    expect(control.hasAttribute("placeholder")).toBe(false);
  });

  it("keeps numeric bounds and falls back to step=any", () => {
    const bounded = build({ type: "number", id: "qty" }, { min: 1, max: 9, step: 2 }).control;
    const loose = build({ type: "number", id: "qty" }).control;

    expect(bounded.getAttribute("min")).toBe("1");
    expect(bounded.getAttribute("max")).toBe("9");
    expect(bounded.getAttribute("step")).toBe("2");
    expect(loose.getAttribute("step")).toBe("any");
  });

  it("leaves radios unchecked unless the schema asks for it", () => {
    expect((build({ type: "radio", id: "a", name: "pick" }).control as HTMLInputElement).checked).toBe(false);
    expect((build({ type: "radio", id: "b", name: "pick", checked: true }).control as HTMLInputElement).checked).toBe(true);
  });

  it("renders a select with its placeholder and options", () => {
    const { control } = build(
      { type: "select", id: "size", options: ["S", "M"] },
      { required: true },
    );
    const options = [...(control as HTMLSelectElement).options].map((o) => o.value);

    expect((control as HTMLSelectElement).required).toBe(true);
    expect(options).toEqual(["", "S", "M"]);
  });

  it("reads the choices from `content.options` and nowhere else", () => {
    const { control } = build({ type: "select", id: "size", options: ["S", "M", "L"] });
    const options = [...(control as HTMLSelectElement).options].map((o) => o.value);

    expect(options).toEqual(["", "S", "M", "L"]);
  });

  it("reads a radio group's options from the field and marks the chosen value", () => {
    const { container, control } = build({
      type: "radio",
      id: "delivery",
      name: "delivery",
      label: "Pengiriman",
      value: "courier",
      options: [
        { value: "pickup", label: "Ambil sendiri" },
        { value: "courier", label: "Kirim kurir" },
      ],
    });
    const inputs = [...container.querySelectorAll<HTMLInputElement>("input[type='radio']")];

    expect(inputs).toHaveLength(2);
    expect(inputs.map((input) => input.name)).toEqual(["delivery", "delivery"]);
    expect(inputs.map((input) => input.checked)).toEqual([false, true]);
    // Every option owns its label, so the text beside a dot is clickable too; the group's
    // caption is not a `<label for>` any more, because there is no single control.
    expect([...container.querySelectorAll(".choice-item")].map((item) => item.textContent)).toEqual([
      "Ambil sendiri",
      "Kirim kurir",
    ]);
    expect(container.querySelector("label")?.hasAttribute("for")).toBe(false);
    expect(container.getAttribute("role")).toBe("radiogroup");
    expect(control).toBe(inputs[0]);
  });

  it("turns the same list into checkboxes for a `checkbox` field", () => {
    const { container } = build({
      type: "checkbox",
      id: "extras",
      label: "Tambahan",
      value: "cheese,sauce",
      options: ["cheese", "sauce", "onion"],
    });
    const inputs = [...container.querySelectorAll<HTMLInputElement>("input[type='checkbox']")];

    expect(inputs.map((input) => input.type)).toEqual(["checkbox", "checkbox", "checkbox"]);
    expect(inputs.map((input) => input.checked)).toEqual([true, true, false]);
    expect(container.getAttribute("role")).toBe("group");
  });

  it("keeps config.attributes as the escape hatch, applied last", () => {
    const { control } = build(
      { type: "text", id: "x" },
      { attributes: [{ name: "data-test", value: "ok" }, { name: "maxlength", value: "3" }] },
    );

    expect(control.getAttribute("data-test")).toBe("ok");
    expect(control.getAttribute("maxlength")).toBe("3");
  });

  it("still renders a hidden field", () => {
    const { control } = build({ type: "hidden", id: "token", value: "abc" });

    expect((control as HTMLInputElement).type).toBe("hidden");
    expect((control as HTMLInputElement).value).toBe("abc");
  });

  it("marks a file field as tabular only when it asks for it", () => {
    // `data-uploader-csv` is the declaration the table module listens for: the input
    // layer flags it and still never parses anything. Without the flag (or with a plain
    // `file` field) a CSV preview would be attached to a photo upload.
    expect(build({ type: "file", id: "a" }).control.hasAttribute("data-uploader-csv")).toBe(false);
    expect(build({ type: "file", id: "b" }, { csv: true }).control.hasAttribute("data-uploader-csv")).toBe(true);
    expect(build({ type: "file", id: "c" }, { csv: true }).control.hasAttribute("data-uploader")).toBe(true);
  });
});

describe("InputRegistry", () => {
  it("has a row for every type it can be asked about", () => {
    for (const [type, definition] of Object.entries(INPUT_TYPE_REGISTRY)) {
      expect(definition, type).toBeDefined();
      expect(Array.isArray(definition.attributes), type).toBe(true);
    }
  });

  it("falls back to text for an unknown type", () => {
    expect(inputTypeOf("nope")).toBe(INPUT_TYPE_REGISTRY.text);
    expect(inputTypeOf(undefined)).toBe(INPUT_TYPE_REGISTRY.text);
  });

  it("separates structural keys from attributes", () => {
    const scan = scanInputAttributes("text", {
      type: "text",
      id: "name",
      label: "Nama",
      placeholder: "Nama lengkap",
      config: {},
      bogus: 1,
    });

    expect(scan.structural).toEqual(["type", "id", "label", "config"]);
    expect(scan.accepted).toEqual(["placeholder"]);
    expect(scan.rejected).toEqual(["bogus"]);
  });
});

describe("InputAttributeBuilder.scan", () => {
  it("rejects at least one key instead of passing on the last one", () => {
    const report = InputAttributeBuilder.scan("text", { placeholder: "ok", bogus: 1 });

    expect(report.ok).toBe(false);
    expect(report.accepted).toEqual(["placeholder"]);
    expect(report.rejected).toEqual(["bogus"]);
  });

  it("accepts a key whitelisted by the caller", () => {
    const report = InputAttributeBuilder.scan("file", { "data-max-upload": 5 }, ["data-max-upload"]);

    expect(report.ok).toBe(true);
    expect(report.accepted).toEqual(["data-max-upload"]);
  });

  it("ignores structural keys", () => {
    const report = InputAttributeBuilder.scan("number", { type: "number", id: "qty", min: 0 });

    expect(report.ok).toBe(true);
    expect(report.structural).toEqual(["type", "id"]);
    expect(report.accepted).toEqual(["min"]);
  });
});

describe("input module registry", () => {
  const withActions = {
    type: "text",
    id: "sku",
    label: "SKU",
    config: { actions: [{ type: "add", label: "Add", onClick: () => undefined }] },
  };

  it("decorates a field with the action set when the controls module is registered", () => {
    const { container } = build({ type: withActions.type, id: withActions.id, label: withActions.label }, withActions.config, { modules: new ModuleLoader("input", INPUT_MODULE_DEFINITIONS) });

    expect(container.classList.contains("actions")).toBe(true);
    expect(container.querySelector("button")).not.toBeNull();
  });

  it("refuses a declared action set when the controls module is not registered", () => {
    // A field that declared buttons and got none is a hole, not a plainer control, so the
    // degradation is a throw with the fix in the message — `Missing.test.ts` pins the wording.
    expect(() => build({ type: withActions.type, id: withActions.id, label: withActions.label }, withActions.config, { modules: new ModuleLoader("input", []) })).toThrow(
      /"controls" module is not in this builder's set/
    );
  });

  it("lets a project module own a field type the registry has never heard of", () => {
    const renderControl = vi.fn((field: any) => {
      if (field.type !== "rating") return null;
      const el = document.createElement("div");
      el.className = "rating-stars";
      return el;
    });

    const loader = new ModuleLoader("input", [
      ...INPUT_MODULE_DEFINITIONS,
      { id: "rating", load: () => ({ renderControl }) },
    ]);
    const { container } = build({ type: "rating", id: "score", label: "Score" }, {}, { modules: loader });

    expect(renderControl).toHaveBeenCalled();
    expect(container.querySelector(".rating-stars")).not.toBeNull();
  });

  it("keeps a plain field free of modules entirely", () => {
    const { container, control } = build(
      { type: "text", id: "name", label: "Nama" },
      {},
      { modules: new ModuleLoader("input", []) },
    );

    expect(control.tagName).toBe("INPUT");
    expect(container.querySelectorAll("label")).toHaveLength(1);
  });
});

describe("InputBuilder toggle style", () => {
  it("renders a radio as a switch when view is toggle", () => {
    const container = new InputBuilder({ modules: [] } as any).create({
      content: { type: "radio", id: "pickup", name: "delivery", label: "Ambil sendiri" },
      config: { view: "toggle" },
    }) as HTMLElement;

    expect((container.querySelector("input") as HTMLInputElement).type).toBe("radio");
    expect(container.querySelector(".switch.control")).not.toBeNull();
    expect(container.querySelector(".slider")).not.toBeNull();
  });

  it("renders a radio as a switch when config.view is toggle", () => {
    const { container, control } = build({ type: "radio", id: "pickup", name: "delivery", label: "Ambil sendiri" }, { view: "toggle" });

    expect((control as HTMLInputElement).type).toBe("radio");
    expect(container.querySelector(".switch.control")).not.toBeNull();
    expect(container.querySelector(".slider")).not.toBeNull();
    expect(container.querySelector("label")?.getAttribute("data-position")).toBe("right");
  });

  it("keeps the native dot for a radio without the toggle view", () => {
    const { container, control } = build({ type: "radio", id: "courier", name: "delivery", label: "Kirim kurir" });

    expect((control as HTMLInputElement).type).toBe("radio");
    expect(container.querySelector(".switch.control")).toBeNull();
  });

  it("does not start a toggle checked unless the schema says so", () => {
    const off = build({ type: "radio", id: "a", name: "g", label: "A" }, { view: "toggle" }).control;
    const on = build({ type: "radio", id: "b", name: "g", label: "B", checked: true }, { view: "toggle" }).control;

    expect((off as HTMLInputElement).checked).toBe(false);
    expect((on as HTMLInputElement).checked).toBe(true);
  });

  it("keeps radio group semantics: same name, one value each", () => {
    const first = build({ type: "radio", id: "a", name: "delivery", value: "pickup", label: "A" }, { view: "toggle" }).control as HTMLInputElement;
    const second = build({ type: "radio", id: "b", name: "delivery", value: "courier", label: "B" }, { view: "toggle" }).control as HTMLInputElement;

    expect(first.name).toBe("delivery");
    expect(second.name).toBe("delivery");
    expect(first.value).toBe("pickup");
    expect(second.value).toBe("courier");
  });
});

describe("input schema door (content / config)", () => {
  const full = (schema: any) => new InputBuilder({ modules: INPUT_MODULE_DEFINITIONS } as any).create(schema) as HTMLElement;

  it("renders a split schema: content is the field, config is its behaviour", () => {
    const container = full({
      content: { type: "text", id: "email", label: "Email", placeholder: "you@example.com" },
      config: { required: true, maxlength: 40 },
    });
    const control = container.querySelector("input") as HTMLInputElement;

    expect(container.querySelector("label")?.textContent).toBe("Email");
    expect(container.querySelector("label")?.getAttribute("for")).toBe("email");
    expect(control.required).toBe(true);
    expect(control.getAttribute("maxlength")).toBe("40");
  });

  it("accepts one shape only: a flat node is not a field anymore", () => {
    // Before stage 3 the builder lifted `config.options` and the `title` label alias out
    // of a flat node. Both are gone: the only place a field's choices and caption live is
    // `content`, so a node that puts them elsewhere renders without them.
    const container = full({ content: { type: "select", id: "city", config: { options: ["Bandung"], label: "Kota" } } });

    expect(container.querySelector("label")).toBeNull();
    expect(container.querySelectorAll("option[value='Bandung']")).toHaveLength(0);
  });

  it("narrows the variant: a chooser key is refused where the type has no choices", () => {
    // The narrowing lives in the schema type, which is exactly why the check is pinned on
    // a typed variable rather than at the (loosely shaped) call site.
    // @ts-expect-error — `options` only exists on a chooser (select/dropdown/picker/checkbox/radio)
    const withOptions: InputSchema<"text"> = { content: { type: "text", options: ["a"] } };
    // @ts-expect-error — `column` feeds a picker panel, nothing else
    const withColumn: InputSchema<"text"> = { content: { type: "text" }, config: { column: 3 } };
    // @ts-expect-error — `checked` is a toggle's state, not a text field's
    const withChecked: InputSchema<"text"> = { content: { type: "text", checked: true } };

    expect("options" in withOptions.content).toBe(true);
    expect(withColumn.content.type).toBe("text");
    expect(withChecked.content.type).toBe("text");
  });

  it("narrows the module bag: an uploader key is refused on a text field", () => {
    const uploader: InputSchema<"file"> = {
      content: { type: "file", id: "cv", label: "CV" },
      config: { maxUpload: 3, csv: true, onFileSelected: () => undefined },
    };
    // @ts-expect-error — `maxUpload` is an uploader key; a text field offers no uploader
    const wrong: InputSchema<"text"> = { content: { type: "text" }, config: { maxUpload: 3 } };
    // @ts-expect-error — `apiUrl` only reaches a dropdown's fetch
    const alsoWrong: InputSchema<"text"> = { content: { type: "text" }, config: { apiUrl: "/cities" } };

    expect(uploader.config?.maxUpload).toBe(3);
    expect(wrong.content.type).toBe("text");
    expect(alsoWrong.content.type).toBe("text");
  });

  it("keeps the wrapper-level action set on every type", () => {
    const text: InputSchema<"text"> = {
      content: { type: "text", id: "a" },
      config: { actions: ["editor"], popover: "<b>x</b>" },
    };

    expect(text.config?.actions).toEqual(["editor"]);
  });

  it("maps `view` onto the owner's own setting (dropdown → data-style)", () => {
    const container = full({
      content: { type: "dropdown", id: "city", label: "Kota", options: ["Bandung"] },
      config: { view: "datalist" },
    });

    expect(container.querySelector(".dropdown")?.getAttribute("data-style")).toBe("datalist");
  });

  it("maps `view` and `column` onto the picker", () => {
    const container = full({
      content: { type: "picker", id: "tone", label: "Tone", options: ["#ffffff"] },
      config: { view: "swatch", column: 4 },
    });
    const picker = container.querySelector(".picker") as HTMLElement;

    expect(picker.dataset.kind).toBe("swatch");
    expect(picker.style.getPropertyValue("--picker-columns")).toBe("4");
  });
});

describe("InputBuilder field state", () => {
  const full = (schema: any) => new InputBuilder({ modules: INPUT_MODULE_DEFINITIONS } as any).create(schema) as HTMLElement;

  it("puts `loading` on the control, the marker `className` used to carry", () => {
    const container = full({ content: { type: "text", id: "name", label: "Nama" }, config: { loading: true } });
    const control = container.querySelector("input") as HTMLElement;

    expect(control.classList.contains("loading")).toBe(true);
  });

  it("renders an error message as its own child, before the help text", () => {
    const container = full({
      content: { type: "text", id: "name", label: "Nama", info: "Help" },
      config: { error: "Nama wajib diisi" },
    });
    const children = Array.from(container.children);

    expect(container.getAttribute("data-error")).toBe("Nama wajib diisi");
    expect((children.at(-2) as HTMLElement).classList.contains("error")).toBe(true);
    expect((children.at(-2) as HTMLElement).textContent).toBe("Nama wajib diisi");
    expect((children.at(-1) as HTMLElement).classList.contains("info")).toBe(true);
  });

  it("marks the field invalid for `error: true` without printing a message", () => {
    const container = full({ content: { type: "text", id: "name", label: "Nama" }, config: { error: true } });

    expect(container.getAttribute("data-error")).toBe("true");
    expect(container.querySelector(".error")).toBeNull();
  });
});

describe("input sheet", () => {
  const sheet = readFileSync(resolve(process.cwd(), "packages/components/input/Input.css"), "utf8");

  it("styles the choice group, so an option row is not the text-field skin", () => {
    // A `radio` input falls into the shared text-control rule; the choice group restores
    // the native control and lays the options out as rows.
    expect(sheet).toContain("&:is(.choice) {");
    expect(sheet).toContain("& > .choice-item > input {");
  });

  it("gives the help text its own full-width line, never inline", () => {
    // `& > .info` is a block that spans every column of a grid field, so it can never sit
    // beside the control.
    expect(sheet).toContain("& > .info {");
    expect(sheet).toContain("grid-column: 1 / -1;");
  });

  it("gives the error message the same full-width line as the help text", () => {
    expect(sheet).toContain("& > .error {");
    expect(sheet).toContain("color: var(--input-error-color);");
  });

  it("flips the popup above the trigger when there is no room below", () => {
    // The surface used to say `position-try-fallbacks: none`, which clipped the list at
    // the viewport edge. A try rule may only place and size, never restyle.
    expect(sheet).toContain("position-try-fallbacks: --flip-top, flip-block;");
    expect(sheet).toMatch(/@position-try --flip-top \{/);
    expect(sheet).toContain("bottom: calc(anchor(top) - 1px);");
  });

  it("scopes the anchor to the field, so no id has to be generated", () => {
    expect(sheet).toContain("anchor-scope: --field-dropdown-anchor;");
  });
});

describe("InputBuilder help text (info)", () => {
  it("is the last child of the field, after the control", () => {
    const { container } = build({ type: "text", id: "name", label: "Nama", info: "Helper text" });
    const last = container.lastElementChild as HTMLElement;

    expect(last.tagName).toBe("SMALL");
    expect(last.classList.contains("info")).toBe(true);
    expect(last.textContent).toBe("Helper text");
  });

  it("stays last for a choice group (radio + options)", () => {
    const { container } = build({
      type: "radio",
      id: "pick",
      label: "Pick",
      options: [{ value: "a", label: "A" }, { value: "b", label: "B" }],
      info: "Pick one",
    });

    expect((container.lastElementChild as HTMLElement).classList.contains("info")).toBe(true);
  });

  it("comes after the label and after the control, never between them", () => {
    const { container, control } = build({ type: "text", id: "name", label: "Nama", info: "Help" });
    const children = Array.from(container.children);
    const labelIndex = children.findIndex((child) => child.tagName === "LABEL");
    const controlIndex = children.indexOf(control);
    const infoIndex = children.findIndex((child) => child.classList.contains("info"));

    expect(infoIndex).toBeGreaterThan(labelIndex);
    expect(infoIndex).toBeGreaterThan(controlIndex);
    expect(infoIndex).toBe(children.length - 1);
  });
});
