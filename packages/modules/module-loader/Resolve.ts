import { RegistryError } from "@aio-ui/core";
import type { iModuleDefinition } from "./ModuleRegistry";

/**
 * The part of a manifest ref (`iComponentModuleRef`) this resolver needs.
 *
 * @summary Duplicated structurally on purpose: `module-loader` cannot import `core`'s
 * manifest type without depending on the component layer, and a ref is data — id, specifier,
 * exported symbol, layer label.
 */
export interface iModuleRef {
  /** Stable module identifier inside the registry scope. */
  id: string;

  /** Package specifier to import, for example `@aio-ui/form/validation-adapter`. */
  path?: string;

  /** Exported symbol that carries the definition. Required — no guessing. */
  export?: string;

  /** Layer label a host may use to route the module (`form`, `input`, …). Ignored here. */
  scope?: string;
}

/** Options for {@link resolveModuleDefinitions}. */
export interface iResolveModuleRefsOptions {
  /**
   * Importer used to load a specifier. Defaults to the platform `import()`.
   *
   * @summary Injectable so a test can resolve refs without a bundler, and so a host can
   * swap in its own loader (import maps, a CDN shim) without patching this package.
   */
  import?: (specifier: string) => Promise<unknown>;
}

/**
 * 🧩 Turns manifest refs into module definitions a `ModuleLoader` accepts.
 *
 * @summary Two shapes describe the same module and nothing used to say which was which:
 * a **manifest ref** (`{ id, path, export }`, what an AST declares and `ComponentRegistry`
 * resolves) and a **definition** (`{ id, load }`, what a `ModuleLoader` takes). This is the
 * explicit bridge — async, called by the consumer **before** it builds anything, because a
 * builder's render is synchronous and must never own module I/O.
 *
 * @param refs - Manifest refs, in the order the modules should load.
 * @param options - Importer override.
 * @returns One definition per ref, in the same order. Each `load()` returns the very symbol the
 *   ref named, so a module is instantiated once and shared.
 * @throws {RegistryError} `INVALID_DEFINITION` when a ref names no `export`, when the import
 *   fails, or when the exported symbol is not a definition (no `load`) — a class or a live
 *   instance cannot be registered without knowing how to construct it.
 *
 * @example
 * import { ModuleLoader, resolveModuleDefinitions } from "@aio-ui/module-loader";
 * import { FORM_ADAPTER_MANIFEST } from "@aio-ui/form/FormRegistry";
 *
 * const definitions = await resolveModuleDefinitions(FORM_ADAPTER_MANIFEST);
 * const form = new FormBuilder({ modules: new ModuleLoader("form", definitions) });
 */
export async function resolveModuleDefinitions<TContext = unknown, TResult = unknown>(
  refs: readonly iModuleRef[],
  options: iResolveModuleRefsOptions = {},
): Promise<iModuleDefinition<TContext, TResult>[]> {
  const load = options.import ?? ((specifier: string) => import(specifier));

  // Step 1: Import in parallel, then pick the named symbol — one failed ref must not hide another.
  const resolved = await Promise.all(
    refs.map(async (ref) => {
      if (!ref.export) {
        throw new RegistryError(
          "INVALID_DEFINITION",
          `Module ref "${ref.id}" names no "export". A ref must say which symbol it wants ` +
          `(for example export: "validationFormAdapter") — this resolver does not guess.`,
          { scope: "module-loader", id: ref.id },
        );
      }

      if (!ref.path) {
        throw new RegistryError(
          "MISSING_ENTRY",
          `Module ref "${ref.id}" names no "path" — there is nothing to import.`,
          { scope: "module-loader", id: ref.id },
        );
      }

      let namespace: unknown;
      try {
        namespace = await load(ref.path);
      } catch (error) {
        throw new RegistryError(
          "MISSING_ENTRY",
          `Module ref "${ref.id}" could not import "${ref.path}": ${(error as Error)?.message ?? error}`,
          { scope: "module-loader", id: ref.id },
        );
      }

      const symbol = (namespace as Record<string, unknown> | null)?.[ref.export];
      if (symbol === undefined || symbol === null) {
        throw new RegistryError(
          "MISSING_ENTRY",
          `Module ref "${ref.id}" → "${ref.path}" has no exported object "${ref.export}".`,
          { scope: "module-loader", id: ref.id },
        );
      }

      return { ref, symbol } as const;
    }),
  );

  // Step 2: Only a definition can be registered. Say so here rather than inside the loader.
  return resolved.map(({ ref, symbol }) => {
    const definition = symbol as iModuleDefinition<TContext, TResult>;
    if (typeof (definition as { load?: unknown }).load !== "function") {
      throw new RegistryError(
        "INVALID_DEFINITION",
        `Module ref "${ref.id}" → "${ref.path}" exports "${ref.export}", which is not a module ` +
        `definition (no load()). Export the definition itself — every adapter in this repo ` +
        `does, for example "validationFormAdapter".`,
        { scope: "module-loader", id: ref.id },
      );
    }
    return definition;
  });
}
