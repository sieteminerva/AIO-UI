// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from "vitest";

import { INPUT_MODULE_IDS } from "@aio-ui/input/InputRegistry";
import type { iInputAdapter } from "@aio-ui/input/InputModuleTypes";
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
 * Since `0.3.0` there is no default stack, so a test states its contract by naming one: a
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
    const formScoped = FORM_ADAPTER_MANIFEST.filter((ref) => (ref.scope ?? "form") === "form").map((ref) => ref.id);

    expect(formScoped).toEqual(FORM_ADAPTER_IDS);
    expect(new Set(FORM_ADAPTER_IDS).size).toBe(FORM_ADAPTER_IDS.length);
  });

  it("marks every input sub-module as input-scoped, and nothing else", () => {
    const inputScoped = FORM_ADAPTER_MANIFEST.filter((ref) => ref.scope === "input").map((ref) => ref.id);

    expect(inputScoped.sort()).toEqual(Object.values(INPUT_MODULE_IDS).sort());
    // Every input-scoped entry must point at the input package, not at the form.
    for (const ref of FORM_ADAPTER_MANIFEST.filter((r) => r.scope === "input")) {
      expect(ref.path?.startsWith("@aio-ui/input/"), `${ref.id} → ${ref.path}`).toBe(true);
    }
  });

  it("keeps the definition list free of input modules", () => {
    const inputIds = new Set<string>(Object.values(INPUT_MODULE_IDS));
    const leaked = FORM_ADAPTER_DEFINITIONS.filter((definition) => inputIds.has(String(definition.id)));

    expect(leaked).toEqual([]);
  });
});

describe("Form.provideModules", () => {
  it("hands input-scoped modules to the fields instead of letting them default", () => {
    const adapter = markerAdapter();
    const form = stack();
    form.provideModules({ [INPUT_MODULE_IDS.dropdown]: adapter });

    const el = form.create([{ type: "text", id: "inherited-field", title: "Field" }] as any) as HTMLElement;
    document.body.appendChild(el);

    const input = el.querySelector<HTMLInputElement>("#inherited-field");
    expect(adapter.seen).toEqual(["inherited-field"]);
    expect(input?.dataset.marker).toBe("inherited");
  });

  it("renders a plain field when no input module was provided", () => {
    const form = stack();

    const el = form.create([{ type: "text", id: "default-field", title: "Field" }] as any) as HTMLElement;
    document.body.appendChild(el);

    const input = el.querySelector<HTMLInputElement>("#default-field");
    expect(input).not.toBeNull();
    expect(input?.dataset.marker).toBeUndefined();
  });

  it("fails at the door when the builder has no modules at all", () => {
    // The fix is one import, so the message names it — and it fires before any field is
    // built, not once per field halfway through the schema.
    const form = new FormBuilder();

    expect(() => form.create([{ type: "text", id: "orphan", title: "Field" }] as any)).toThrow(
      /@aio-ui\/form\/adapters/
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

    const el = form.create([{ type: "text", id: "probe-field", title: "Field" }] as any) as HTMLElement;
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

    const el = form.create([{ type: "text", id: "picked-field", title: "Field" }] as any) as HTMLElement;
    document.body.appendChild(el);

    const input = el.querySelector<HTMLInputElement>("#picked-field");
    expect(input).not.toBeNull();

    // Proof of the negative: the cascade engine was never loaded, so `cascading: true` is inert
    // rather than throwing "no module rendered the field".
    expect(loader.loadedIds()).toEqual(["input"]);
    expect(loader.ids()).toEqual(["input"]);
  });

  it("resolves the manifest into the same stack the definitions describe", async () => {
    // The manifest also carries the input layer (`scope: "input"`); those are field presets and
    // must not be handed to the form's own loader — `provideModules()` is the door for them.
    const formRefs = FORM_ADAPTER_MANIFEST.filter((ref) => (ref.scope ?? "form") === "form");
    const definitions = await resolveModuleDefinitions<iFormModuleContext, any>(formRefs);

    expect(definitions.map((definition) => String(definition.id))).toEqual(FORM_ADAPTER_IDS);

    const form = new FormBuilder({
      modules: new ModuleLoader<iFormModuleContext, any>("form", definitions),
    });
    const el = form.create([{ type: "text", id: "resolved-field", title: "Field" }] as any) as HTMLElement;
    document.body.appendChild(el);

    expect(el.querySelector<HTMLInputElement>("#resolved-field")).not.toBeNull();
  });

  it("routes input-scoped definitions through provideModules, not through the loader", async () => {
    // A host that resolves the whole manifest by hand has both layers in one list. This is the
    // split `Form.provideModules()` performs for a registry-built form, done explicitly.
    const definitions = await resolveModuleDefinitions(FORM_ADAPTER_MANIFEST);
    const form = stack();
    form.provideModules(Object.fromEntries(definitions.map((definition) => [String(definition.id), definition])));

    const el = form.create([{ type: "text", id: "routed-field", title: "Field" }] as any) as HTMLElement;
    document.body.appendChild(el);

    expect(el.querySelector<HTMLInputElement>("#routed-field")).not.toBeNull();
  });
});
