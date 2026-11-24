// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from "vitest";

import { INPUT_MODULE_IDS } from "@aio-ui/input";
import type { iInputAdapter } from "@aio-ui/input";
import { inspectPage } from "@aio-ui/core";
import { ModuleLoader, resolveModuleDefinitions } from "@aio-ui/module-loader";

import type { iFormModuleContext } from "../FormModuleTypes";
import { FormBuilder } from "../Form";
import { inputFormAdapter } from "../Input.FormAdapter";
import { FORM_ADAPTER_DEFINITIONS, FORM_ADAPTER_IDS } from "../FormAdapters";
import { FORM_ADAPTER_MANIFEST } from "../FormRegistry";

/**
 * A form nests another builder, so one manifest carries two layers of modules: the form's
 * own adapters, and the input sub-modules that only `@aio-ui/input` knows how to mount.
 *
 * Two things have to hold, and both used to fail silently:
 *
 * - the manifest and the definitions describe the same stack (a drift here means the
 *   registry resolves one set while `new FormBuilder()` defaults to another);
 * - `scope: "input"` entries actually reach the fields — before this, `renderField()`
 *   built its `InputBuilder` with no `modules` at all, so every field fell back to
 *   `INPUT_MODULE_DEFINITIONS` and a host could never trim the input layer.
 */

beforeEach(() => {
  document.body.replaceChildren();
});

/**
 * A form on the one adapter every field needs.
 *
 * Since `0.2.2` there is no default stack, so a test states its contract by naming one: a
 * plain-field test needs `inputFormAdapter` and nothing else.
 */
function stack(): FormBuilder {
  return new FormBuilder({ modules: new ModuleLoader("form", [inputFormAdapter]) });
}

/** Minimal adapter that proves it was used: it owns a marker type. */
function markerAdapter(): iInputAdapter & { seen: string[] } {
  const seen: string[] = [];
  return {
    seen,
    renderControl: (field) => {
      if (field.type !== "text") return null;
      seen.push(String(field.id));
      const el = document.createElement("input");
      el.type = "text";
      el.id = String(field.id);
      el.dataset.marker = "inherited";
      return el;
    },
  };
}

describe("form adapter manifest", () => {
  it("declares exactly the adapters the definitions provide", () => {
    const inputIds = new Set<string>(Object.values(INPUT_MODULE_IDS));
    const formScoped = FORM_ADAPTER_MANIFEST.filter((ref) => (ref.scope ?? "form") === "form").map((ref) => ref.id);

    // The form scope is the definitions minus the field layer's ids — one stack, two layers.
    expect(formScoped).toEqual(FORM_ADAPTER_IDS.filter((id) => !inputIds.has(id)));
    expect(new Set(FORM_ADAPTER_IDS).size).toBe(FORM_ADAPTER_IDS.length);
  });

  it("marks every input sub-module as input-scoped, and nothing else", () => {
    const inputScoped = FORM_ADAPTER_MANIFEST.filter((ref) => ref.scope === "input").map((ref) => ref.id);

    expect(inputScoped.sort()).toEqual(Object.values(INPUT_MODULE_IDS).sort());
    // Every input-scoped entry must point at the input package, not at the form.
    for (const ref of FORM_ADAPTER_MANIFEST.filter((r) => r.scope === "input")) {
      expect(ref.path, `${ref.id} → ${ref.path}`).toMatch(/^@aio-ui\/input(\/|$)/);
    }
  });

  it("keeps the manifest's form scope at the five, and the definitions at the full nine", () => {
    // Two lists, two jobs. The manifest is *what a registry may resolve* and keeps the form
    // scope at five (the input four are re-declared with `scope: "input"`); the definitions
    // are *what one import means*, and that is the whole form — engines plus field modules.
    const inputIds = Object.values(INPUT_MODULE_IDS);

    expect(FORM_ADAPTER_IDS).toHaveLength(5 + inputIds.length);
    for (const id of inputIds) expect(FORM_ADAPTER_IDS).toContain(id);

    const formScoped = FORM_ADAPTER_MANIFEST.filter((ref) => (ref.scope ?? "form") === "form").map((ref) => ref.id);
    expect(formScoped).toHaveLength(5);
  });

  it("routes the input ids to the fields instead of loading them as form features", () => {
    // The stack is one list, but not one layer: a loader carrying all nine must leave the
    // form with five features and hand the other four to the field preset. Doing it by id
    // (not by `scope`) is what keeps a manifest written before `scope` existed working.
    const loader = new ModuleLoader("form", FORM_ADAPTER_DEFINITIONS);
    const form = new FormBuilder({ modules: loader });

    const el = form.create({ content: [{ type: "text", id: "routed-field", label: "Field" }] }) as HTMLElement;
    document.body.appendChild(el);

    const loaded = loader.loadedIds();
    expect(loaded).toContain("input");
    for (const id of Object.values(INPUT_MODULE_IDS)) {
      // Never loaded as a form feature: the field layer instantiates its own copy.
      expect(loaded, `${id} must not be loaded by the form loader`).not.toContain(id);
    }
  });
});

describe("Form.provideModules", () => {
  it("hands input-scoped modules to the fields instead of letting them default", () => {
    const adapter = markerAdapter();
    const form = stack();
    form.provideModules({ [INPUT_MODULE_IDS.dropdown]: adapter });

    const el = form.create({ content: [{ type: "text", id: "inherited-field", label: "Field" }] }) as HTMLElement;
    document.body.appendChild(el);

    const input = el.querySelector<HTMLInputElement>("#inherited-field");
    expect(adapter.seen).toEqual(["inherited-field"]);
    expect(input?.dataset.marker).toBe("inherited");
  });

  it("renders a plain field when no input module was provided", () => {
    const form = stack();

    const el = form.create({ content: [{ type: "text", id: "default-field", label: "Field" }] }) as HTMLElement;
    document.body.appendChild(el);

    const input = el.querySelector<HTMLInputElement>("#default-field");
    expect(input).not.toBeNull();
    expect(input?.dataset.marker).toBeUndefined();
  });

  it("renders fields with no wiring at all, and brings the dropdown module along", () => {
    // The default floor: no `modules`, no `inputModules`. A text field must render and a
    // dropdown must be the real one (its `.dropdown` box), not a bare `<select>`.
    const form = new FormBuilder();

    const el = form.create({
      content: [
        { type: "text", id: "floor-text", label: "Field" },
        {
          type: "dropdown",
          id: "floor-dropdown",
          label: "Pilih",
          options: [
            { value: "a", label: "A" },
            { value: "b", label: "B" },
          ],
        },
      ],
    }) as HTMLElement;
    document.body.appendChild(el);

    expect(el.querySelector<HTMLInputElement>("#floor-text")).not.toBeNull();
    expect(el.querySelector("#floor-dropdown")).not.toBeNull();
    expect(el.querySelector(".dropdown")).not.toBeNull();
  });

  it("fails at the door when the host passes an explicitly empty loader", () => {
    // An empty loader is a declaration of "no adapter", not an omission: the default is
    // replaced, so the form says why instead of failing one field at a time.
    const form = new FormBuilder({ modules: new ModuleLoader("form", []) });

    expect(() => form.create({ content: [{ type: "text", id: "orphan", label: "Field" }] })).toThrow(
      /inputFormAdapter/
    );
  });

  it("runs the initialize phase on a module handed over by a loader", () => {
    // A manifest-provided loader used to skip `resolveAll("initialize")` entirely, so a
    // DOM-reading module (calculation) never attached when the form came from the registry.
    const phases: string[] = [];
    const form = new FormBuilder();

    form.provideModules({
      // A manifest always carries the input adapter; the probe only adds the phase case.
      input: inputFormAdapter,
      probe: {
        id: "probe",
        matches: (context: any) => context.phase === "initialize",
        load: (context: any) => {
          phases.push(String(context.phase));
          return { probe: true };
        },
        destroy: () => phases.push("destroy"),
      },
    } as any);

    const el = form.create({ content: [{ type: "text", id: "probe-field", label: "Field" }] }) as HTMLElement;
    document.body.appendChild(el);

    expect(phases).toEqual(["initialize"]);
  });
});

/**
 * A consumer outside the registry — `npm i` a `.tgz`, `new FormBuilder({ modules })` by hand —
 * has to pick a shape for `modules`. The two shapes look alike and only one is a loader input,
 * so these cases pin the boundary the docs and the README recipes now state.
 */
describe("hand-wired modules (no registry, no shell)", () => {
  it("throws a named error when a manifest ref is registered instead of a definition", () => {
    // Exactly the consumer's bug: `new ModuleLoader("form", FORM_ADAPTER_MANIFEST)`.
    expect(() => new ModuleLoader("form", FORM_ADAPTER_MANIFEST as any)).toThrow(/is not a definition/);
  });

  it("renders fields from a hand-picked stack, with the engines left out", () => {
    // `input` is the only adapter a field needs; the four engines are optional by design.
    const loader = new ModuleLoader("form", [inputFormAdapter]);
    const form = new FormBuilder({ modules: loader });

    const el = form.create({ content: [{ type: "text", id: "picked-field", label: "Field" }] }) as HTMLElement;
    document.body.appendChild(el);

    const input = el.querySelector<HTMLInputElement>("#picked-field");
    expect(input).not.toBeNull();

    // Proof of the negative: the cascade engine was never loaded, so `cascading: true` is inert
    // rather than throwing "no module rendered the field".
    expect(loader.loadedIds()).toEqual(["input"]);
    expect(loader.ids()).toEqual(["input"]);
  });

  it("renders a dropdown as a dropdown from the one default import", () => {
    // The end-to-end proof of the routing: without it the field would fall back to a native
    // `<select>` — the exact degradation the layer warns about.
    const form = new FormBuilder({ modules: new ModuleLoader("form", FORM_ADAPTER_DEFINITIONS) });

    const el = form.create({
      content: [
        { type: "dropdown", id: "pick", label: "Pick", options: [{ value: "a", label: "A" }] },
      ],
    }) as HTMLElement;
    document.body.appendChild(el);

    expect(el.querySelector("#pick")).not.toBeNull();
    expect(el.querySelector("select")).toBeNull();

    // Proof of render, not "it looks right": the tree reports what it built, and the
    // dropdown root — the module's own markup — is in it instead of a native select.
    const built = inspectPage(el);
    expect(built.nodeCount).toBeGreaterThan(0);
    expect(built.html).toContain("dropdown");
    expect(built.html).not.toContain("<select");
  });

  it("refuses a group that declared buttons when nothing can render them", () => {
    // A warning is not enough: the fieldset would render and the buttons would never exist.
    const form = stack();

    expect(() =>
      form.create({
        content: [
          { id: "group", title: "Group", actions: ["editor"], group: [{ type: "text", id: "in-group", label: "Field" }] },
        ],
      })
    ).toThrow(/"controls" module is not in this builder's set/);
  });

  it("refuses a files policy that would receive no files", () => {
    // Directly on the adapter: `beforeSubmit` is where the bytes either arrive or are lost,
    // and a submit event cannot be asserted for a rejection without swallowing it.
    const adapter = inputFormAdapter.load({
      config: { files: async () => ({ uploaded: true }) },
      form: { id: "policy-form" },
      builderConfig: {},
      inputModules: [],
    } as any) as any;

    return expect(adapter.beforeSubmit({})).rejects.toThrow(/@aio-ui\/input\/file-uploader/);
  });

  it("resolves the manifest into the same stack the definitions describe", async () => {
    // The manifest also carries the input layer (`scope: "input"`); those are field presets and
    // must not be handed to the form's own loader — `provideModules()` is the door for them.
    const formRefs = FORM_ADAPTER_MANIFEST.filter((ref) => (ref.scope ?? "form") === "form");
    const definitions = await resolveModuleDefinitions<iFormModuleContext, any>(formRefs);

    const inputIds = new Set<string>(Object.values(INPUT_MODULE_IDS));
    expect(definitions.map((definition) => String(definition.id))).toEqual(
      FORM_ADAPTER_IDS.filter((id) => !inputIds.has(id))
    );

    const form = new FormBuilder({
      modules: new ModuleLoader<iFormModuleContext, any>("form", definitions),
    });
    const el = form.create({ content: [{ type: "text", id: "resolved-field", label: "Field" }] }) as HTMLElement;
    document.body.appendChild(el);

    expect(el.querySelector<HTMLInputElement>("#resolved-field")).not.toBeNull();
  });

  it("routes input-scoped definitions through provideModules, not through the loader", async () => {
    // A host that resolves the whole manifest by hand has both layers in one list. This is the
    // split `Form.provideModules()` performs for a registry-built form, done explicitly.
    const definitions = await resolveModuleDefinitions(FORM_ADAPTER_MANIFEST);
    const form = stack();
    form.provideModules(Object.fromEntries(definitions.map((definition) => [String(definition.id), definition])));

    const el = form.create({ content: [{ type: "text", id: "routed-field", label: "Field" }] }) as HTMLElement;
    document.body.appendChild(el);

    expect(el.querySelector<HTMLInputElement>("#routed-field")).not.toBeNull();
  });
});
