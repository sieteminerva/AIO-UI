// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ModuleLoader, resolveModuleDefinitions } from "@aio-ui/module-loader";

import type { iInputAdapter, iInputModuleContext } from "../InputModuleTypes";
import { INPUT_MODULE_DEFINITION_IDS, INPUT_MODULE_DEFINITIONS } from "../InputModules";
import { INPUT_MODULE_IDS, INPUT_MODULE_MANIFEST } from "../InputRegistry";
import { INPUT_TYPE_REGISTRY } from "../FieldTypes";
import { InputBuilder } from "../Input";

/**
 * The input layer declares its adapters twice on purpose: definitions (loaded through a
 * `ModuleLoader`) and manifest refs (resolved lazily by `ComponentRegistry`). A drift
 * between them is invisible at runtime — a manifest that names a module the definitions
 * do not have simply loads a second, unreferenced instance.
 */

describe("input module registry", () => {
  it("declares exactly the adapters the definitions provide", () => {
    const manifestIds = INPUT_MODULE_MANIFEST.map((ref) => ref.id);

    expect(manifestIds).toEqual(INPUT_MODULE_DEFINITION_IDS);
    expect(new Set(manifestIds).size).toBe(manifestIds.length);
  });

  it("covers every documented module id", () => {
    // Copy before sorting: `sort()` mutates, and this array is the exported registry constant —
    // sorting it in place silently reorders the preset for every later test in this file.
    expect([...INPUT_MODULE_DEFINITION_IDS].sort()).toEqual(Object.values(INPUT_MODULE_IDS).sort());
    expect(INPUT_MODULE_DEFINITIONS).toHaveLength(Object.values(INPUT_MODULE_IDS).length);
  });

  it("points each ref at this package's `*/module` entry, exporting one named binding", () => {
    for (const ref of INPUT_MODULE_MANIFEST) {
      expect(ref.path, `${ref.id} → ${ref.path}`).toMatch(/^@aio-ui\/input\/[a-z-]+\/module$/);
      expect(ref.export, `${ref.id} has no named export`).toBeTruthy();
    }
  });

  it("resolves every ref to a real definition, so a typo cannot hide behind a string compare", async () => {
    // The string comparisons above prove the two lists *look* alike. This proves the paths and
    // export names actually exist — the failure a hand-wired consumer hits first.
    const definitions = await resolveModuleDefinitions<iInputModuleContext, iInputAdapter>(INPUT_MODULE_MANIFEST);

    expect(definitions.map((definition) => String(definition.id))).toEqual(INPUT_MODULE_DEFINITION_IDS);
    for (const definition of definitions) expect(typeof definition.load).toBe("function");
    // Same objects, not copies: a module is instantiated once, however it was declared.
    expect(definitions).toEqual(INPUT_MODULE_DEFINITIONS);
  });

  it("refuses a manifest ref where a definition is expected", () => {
    // The door exists so this mistake fails at registration, not inside a field later.
    expect(() => new ModuleLoader("input", INPUT_MODULE_MANIFEST as any)).toThrow(/is not a definition/);
  });
});

/**
 * The price of an opt-in stack, measured instead of promised.
 *
 * These four modules are an **enhancement**: a field must exist without them, in a plainer
 * shape, because otherwise "no modules by default" would be a trap for every schema that
 * happens to declare a dropdown. This matrix is the condition the default hangs on — if a
 * type ever renders a hole here, either the type moves into `Input.ts` natively or the
 * default changes back.
 */
describe("degradation without modules", () => {
  const types = Object.keys(INPUT_TYPE_REGISTRY) as Array<keyof typeof INPUT_TYPE_REGISTRY>;

  // This matrix renders every degraded field on purpose, so the layer says so out loud.
  // The sentences themselves are asserted in `Missing.test.ts`; here they are noise.
  beforeEach(() => {
    vi.spyOn(console, "warn").mockImplementation(() => { });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function render(type: string): HTMLElement {
    return new InputBuilder({ modules: [] }).create({
      type,
      id: `f-${type}`,
      title: type,
      config: { options: [{ value: "a", label: "A" }] },
    } as any) as HTMLElement;
  }

  it("covers the whole declared matrix", () => {
    expect(types.length).toBeGreaterThan(10);
  });

  for (const type of types) {
    it(`${type} still renders a control`, () => {
      const element = render(type);
      const control = element.querySelector("input, textarea, select, button");

      expect(control, `${type} rendered a hole instead of a plainer control`).not.toBeNull();
    });
  }

  it("degrades a dropdown to a native select built from the same options", () => {
    const element = render("dropdown");
    const select = element.querySelector("select");

    expect(select).not.toBeNull();
    // Placeholder first, then the declared options — the `@field>select` template owns that order.
    expect([...select!.querySelectorAll("option")].map((option) => option.value)).toEqual(["", "a"]);
  });
});
