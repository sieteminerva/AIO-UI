/** Public surface of `@aio-ui/input` — curated, never `export *`. */
export { InputBuilder } from "./Input";
export type { InputType, iActionType, iBasicInputConfig, iBasicInputNode, iBasicSelectOption, iInputActionContext, iInputActionDefinition, iInputActionHandler, iInputConfig, } from "./Input";
/**
 * The input layer's own sub-modules **as data** — the root stays free of the implementations.
 *
 * `INPUT_MODULE_MANIFEST` is the stack as manifest refs (`{ id, path, export }`) for an AST
 * that lets `ComponentRegistry` resolve them; `mountInputModules()` / `inputFilesOf()` walk
 * whatever preset a host hands them and do nothing without one. The live list a
 * `ModuleLoader` takes (`INPUT_MODULE_DEFINITIONS`, `{ id, load }`) lives in
 * `@aio-ui/input/modules`, so an app that only needs text fields never compiles the
 * dropdown builder, the uploader, the control set or the popover — proved by
 * `scripts/bundle-probe.mjs` against the parsed module graph:
 *
 * ```ts
 * import { InputBuilder } from "@aio-ui/input";
 * import { INPUT_MODULE_DEFINITIONS } from "@aio-ui/input/modules";
 *
 * new InputBuilder({ modules: INPUT_MODULE_DEFINITIONS, type: "dropdown", options });
 * ```
 *
 * For one module only, import it from its own subpath (`@aio-ui/input/dropdown/module`, …).
 * Order in the full stack is decorate order (`controls` before `popover`).
 */
export { INPUT_MODULE_IDS, INPUT_MODULE_MANIFEST, inputFilesOf, mountInputModules, } from "./InputRegistry";
export type { InputModuleDefinition, InputModuleId, InputModuleItem, InputModulePreset, iInputAdapter, iInputModuleContext, } from "./InputRegistry";
//# sourceMappingURL=index.d.ts.map