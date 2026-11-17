import { Registry, RegistryError } from "@aio-ui/core";
/**
 * 🧩 MODULE REGISTRY — storage for module definitions.
 *
 * Owns one concern: which definitions exist, keyed by id. It never loads,
 * instantiates, or destroys anything; that is `ModuleLoader`'s job. Keeping the
 * two apart means a definition store can be shared or inspected without creating
 * live objects.
 *
 * @example
 * const modules = new ModuleRegistry<iFormModuleContext>("form");
 * modules.register(validationFormAdapter);
 * modules.has("validation"); // true
 */
export class ModuleRegistry {
    /** Definition storage delegated to the registry kernel. */
    #definitions;
    /**
     * @param scope - Namespace label, for example `"form"` or `"animation"`.
     * @param options - Duplicate policy for module ids.
     * @throws {RegistryError} With code `INVALID_SCOPE` when the scope label is malformed.
     */
    constructor(scope, options = {}) {
        this.#definitions = new Registry(scope, {
            duplicate: options.duplicate ?? "warn",
        });
    }
    /** Scope label that isolates this registry from other module registries. */
    get scope() {
        return this.#definitions.scope;
    }
    /** Number of registered definitions. */
    get size() {
        return this.#definitions.size;
    }
    /**
     * Registers a module definition.
     *
     * @summary A definition is `{ id, load }`. A **manifest ref** — `{ id, path, export }`, the
     * shape an AST declares — is not a definition: only `ComponentRegistry` (or
     * `resolveModuleDefinitions()`) can turn a specifier into a live module. Registering a ref used
     * to succeed silently and fail three layers later inside a consumer's form, so the door now
     * names the mistake instead of storing it.
     * @param definition - Definition to register; its `id` becomes the lookup key.
     * @returns The current registry instance, for fluent registration chains.
     * @throws {RegistryError} With code `INVALID_ID` for a malformed id, `INVALID_DEFINITION` when
     *   `load` is missing, or `DUPLICATE_ID` when the policy is `"error"` and the id exists.
     * @example
     * modules.register(validationFormAdapter);
     */
    register(definition) {
        // Step 1: Refuse anything that cannot load itself, and say which shape was expected.
        if (typeof definition?.load !== "function") {
            const ref = definition;
            const shape = ref && (ref.path || ref.export)
                ? `it looks like a manifest ref ({ path: "${ref.path ?? "?"}", export: "${ref.export ?? "?"}" })`
                : "it has no load() function";
            throw new RegistryError("INVALID_DEFINITION", `[${this.scope}] module "${String(ref?.id ?? "?")}" is not a definition — ${shape}. ` +
                `A loader takes definitions (in this package: FORM_ADAPTER_DEFINITIONS, or one adapter ` +
                `exported from its own subpath). Manifest refs belong to ComponentRegistry, or can be ` +
                `resolved first with resolveModuleDefinitions().`, { scope: this.scope, id: String(ref?.id ?? "?") });
        }
        // Step 2: Delegate storage to the kernel using the definition id.
        this.#definitions.register(definition.id, definition);
        return this;
    }
    /**
     * Resolves a registered definition.
     *
     * @param id - Module identifier.
     * @returns The definition, or `null` when the module is not registered.
     * @example
     * modules.resolve("validation")?.requires;
     */
    resolve(id) {
        return this.#definitions.resolve(id);
    }
    /**
     * Checks whether a module definition is registered.
     *
     * @param id - Module identifier.
     * @returns `true` when registered.
     */
    has(id) {
        return this.#definitions.has(id);
    }
    /**
     * Lists registered module ids in registration order.
     *
     * @returns A new array that is safe to mutate.
     */
    ids() {
        return this.#definitions.ids();
    }
}
//# sourceMappingURL=ModuleRegistry.js.map