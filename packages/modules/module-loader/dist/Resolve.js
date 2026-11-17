import { RegistryError } from "@aio-ui/core";
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
export async function resolveModuleDefinitions(refs, options = {}) {
    const load = options.import ?? ((specifier) => import(specifier));
    // Step 1: Import in parallel, then pick the named symbol — one failed ref must not hide another.
    const resolved = await Promise.all(refs.map(async (ref) => {
        if (!ref.export) {
            throw new RegistryError("INVALID_DEFINITION", `Module ref "${ref.id}" names no "export". A ref must say which symbol it wants ` +
                `(for example export: "validationFormAdapter") — this resolver does not guess.`, { scope: "module-loader", id: ref.id });
        }
        if (!ref.path) {
            throw new RegistryError("MISSING_ENTRY", `Module ref "${ref.id}" names no "path" — there is nothing to import.`, { scope: "module-loader", id: ref.id });
        }
        let namespace;
        try {
            namespace = await load(ref.path);
        }
        catch (error) {
            throw new RegistryError("MISSING_ENTRY", `Module ref "${ref.id}" could not import "${ref.path}": ${error?.message ?? error}`, { scope: "module-loader", id: ref.id });
        }
        const symbol = namespace?.[ref.export];
        if (symbol === undefined || symbol === null) {
            throw new RegistryError("MISSING_ENTRY", `Module ref "${ref.id}" → "${ref.path}" has no exported object "${ref.export}".`, { scope: "module-loader", id: ref.id });
        }
        return { ref, symbol };
    }));
    // Step 2: Only a definition can be registered. Say so here rather than inside the loader.
    return resolved.map(({ ref, symbol }) => {
        const definition = symbol;
        if (typeof definition.load !== "function") {
            throw new RegistryError("INVALID_DEFINITION", `Module ref "${ref.id}" → "${ref.path}" exports "${ref.export}", which is not a module ` +
                `definition (no load()). Export the definition itself — every adapter in this repo ` +
                `does, for example "validationFormAdapter".`, { scope: "module-loader", id: ref.id });
        }
        return definition;
    });
}
//# sourceMappingURL=Resolve.js.map