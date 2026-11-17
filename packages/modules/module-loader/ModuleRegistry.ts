import { Registry, RegistryError } from "@aio-ui/core";
import type { RegistryDuplicatePolicy } from "@aio-ui/core";

/**
 * A loadable module definition.
 *
 * @summary Definitions are data, not behaviour: `load()` receives a host context
 * and returns the live object the caller keeps, and `destroy()` receives that same
 * object so teardown stays with the module that produced it.
 *
 * Naming follows the repository convention: `create` is reserved for declarations
 * that produce DOM (`Base.create`), and `activate` is reserved for page/shell
 * controllers (`iHorizontalPage.activate`). A module *loads* itself.
 */
export interface iModuleDefinition<TContext = unknown, TResult = unknown> {
  /** Stable module identifier inside the registry scope. */
  id: string;

  /** Ids that must be loaded before this module. Checked by `ModuleLoader`. */
  requires?: string[];

  /**
   * Optional predicate used by `ModuleLoader.resolveAll()` to decide whether this
   * module applies to the supplied context.
   */
  matches?: (context: TContext) => boolean;

  /**
   * Loads the module and returns the live object owned by the caller.
   *
   * @param context - Host context supplied by the consumer (form, page, app).
   * @returns The live module object.
   */
  load: (context: TContext) => TResult;

  /**
   * Releases the object previously returned by `load()`.
   *
   * @param instance - The exact object returned by `load()` for this module.
   */
  destroy?: (instance: TResult) => void;
}

/** Construction options for `ModuleRegistry`. */
export interface iModuleRegistryOptions {
  /** Duplicate policy for module ids. Defaults to `"warn"`. */
  duplicate?: RegistryDuplicatePolicy;
}

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
export class ModuleRegistry<TContext = unknown, TResult = unknown> {
  /** Definition storage delegated to the registry kernel. */
  readonly #definitions: Registry<iModuleDefinition<TContext, TResult>>;

  /**
   * @param scope - Namespace label, for example `"form"` or `"animation"`.
   * @param options - Duplicate policy for module ids.
   * @throws {RegistryError} With code `INVALID_SCOPE` when the scope label is malformed.
   */
  constructor(scope: string, options: iModuleRegistryOptions = {}) {
    this.#definitions = new Registry<iModuleDefinition<TContext, TResult>>(scope, {
      duplicate: options.duplicate ?? "warn",
    });
  }

  /** Scope label that isolates this registry from other module registries. */
  public get scope(): string {
    return this.#definitions.scope;
  }

  /** Number of registered definitions. */
  public get size(): number {
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
  public register(definition: iModuleDefinition<TContext, TResult>): this {
    // Step 1: Refuse anything that cannot load itself, and say which shape was expected.
    if (typeof (definition as { load?: unknown } | null)?.load !== "function") {
      const ref = definition as unknown as { id?: string; path?: string; export?: string };
      const shape = ref && (ref.path || ref.export)
        ? `it looks like a manifest ref ({ path: "${ref.path ?? "?"}", export: "${ref.export ?? "?"}" })`
        : "it has no load() function";
      throw new RegistryError(
        "INVALID_DEFINITION",
        `[${this.scope}] module "${String(ref?.id ?? "?")}" is not a definition — ${shape}. ` +
        `A loader takes definitions (in this package: FORM_ADAPTER_DEFINITIONS, or one adapter ` +
        `exported from its own subpath). Manifest refs belong to ComponentRegistry, or can be ` +
        `resolved first with resolveModuleDefinitions().`,
        { scope: this.scope, id: String(ref?.id ?? "?") },
      );
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
  public resolve(id: string): iModuleDefinition<TContext, TResult> | null {
    return this.#definitions.resolve(id);
  }

  /**
   * Checks whether a module definition is registered.
   *
   * @param id - Module identifier.
   * @returns `true` when registered.
   */
  public has(id: string): boolean {
    return this.#definitions.has(id);
  }

  /**
   * Lists registered module ids in registration order.
   *
   * @returns A new array that is safe to mutate.
   */
  public ids(): string[] {
    return this.#definitions.ids();
  }
}
