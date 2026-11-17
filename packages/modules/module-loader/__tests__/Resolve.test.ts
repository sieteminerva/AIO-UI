import { describe, expect, it } from "vitest";
import { RegistryError } from "@aio-ui/core";

import { ModuleLoader } from "../ModuleLoader";
import { ModuleRegistry } from "../ModuleRegistry";
import type { iModuleDefinition } from "../ModuleRegistry";
import { resolveModuleDefinitions } from "../Resolve";

interface iTestContext {
  formId: string;
}

interface iTestInstance {
  id: string;
}

/** Builds a passive definition; these tests never rely on the loaded value. */
function createDefinition(id: string): iModuleDefinition<iTestContext, iTestInstance> {
  return { id, load: () => ({ id }) };
}

/** The shape a manifest declares — a specifier plus the symbol to pick, and no `load`. */
const refs = [
  { id: "validation", path: "@fake/form/validation", export: "validationFormAdapter" },
  { id: "cascade", path: "@fake/form/cascade", export: "cascadeFormAdapter" },
];

describe("ModuleRegistry door", () => {
  it("refuses a manifest ref and names the shape it was handed", () => {
    const registry = new ModuleRegistry<iTestContext, iTestInstance>("form");

    // The defect this guard exists for: a ref used to register cleanly, then failed three
    // layers later inside the form as "No module rendered the field".
    let caught: unknown;
    try {
      registry.register(refs[0] as any);
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(RegistryError);
    const error = caught as RegistryError;
    expect(error.code).toBe("INVALID_DEFINITION");
    expect(error.id).toBe("validation");
    expect(error.message).toContain("manifest ref");
    expect(error.message).toContain("resolveModuleDefinitions");
    expect(registry.ids()).toEqual([]);
  });

  it("refuses a plain object too, instead of storing something that cannot load", () => {
    const registry = new ModuleRegistry<iTestContext, iTestInstance>("form");

    expect(() => registry.register({ id: "mystery" } as any)).toThrow(/is not a definition/);
  });

  it("still accepts a real definition", () => {
    const registry = new ModuleRegistry<iTestContext, iTestInstance>("form");

    expect(() => registry.register(createDefinition("validation"))).not.toThrow();
    expect(registry.ids()).toEqual(["validation"]);
  });
});

describe("resolveModuleDefinitions", () => {
  it("turns refs into definitions, in order, sharing the imported symbol", async () => {
    const validation = createDefinition("validation");
    const cascade = createDefinition("cascade");
    const modules: Record<string, unknown> = {
      "@fake/form/validation": { validationFormAdapter: validation },
      "@fake/form/cascade": { cascadeFormAdapter: cascade },
    };

    const definitions = await resolveModuleDefinitions<iTestContext, iTestInstance>(refs, {
      import: async (specifier) => modules[specifier],
    });

    expect(definitions).toHaveLength(2);
    expect(definitions.map((definition) => definition.id)).toEqual(["validation", "cascade"]);
    // The definition *is* the exported symbol — no wrapper, no second instance.
    expect(definitions[0]).toBe(validation);

    // And a loader built from them resolves the same instances.
    const loader = new ModuleLoader<iTestContext, iTestInstance>("form", definitions);
    expect(loader.ids()).toEqual(["validation", "cascade"]);
  });

  it("rejects a ref that names no export instead of guessing one", async () => {
    await expect(
      resolveModuleDefinitions([{ id: "validation", path: "@fake/form/validation" }], {
        import: async () => ({ validationFormAdapter: createDefinition("validation") }),
      }),
    ).rejects.toThrow(/names no "export"/);
  });

  it("reports an unresolved specifier with the id that asked for it", async () => {
    await expect(
      resolveModuleDefinitions(refs, {
        import: async () => {
          throw new Error("Failed to resolve module specifier");
        },
      }),
    ).rejects.toThrow(/\["validation"\]|"validation" could not import/);
  });

  it("rejects a symbol that is not a definition", async () => {
    await expect(
      resolveModuleDefinitions([refs[0]], {
        import: async () => ({ validationFormAdapter: class NotADefinition { } }),
      }),
    ).rejects.toThrow(/is not a module definition/);
  });
});
