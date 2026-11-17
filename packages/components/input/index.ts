/** Public surface of `@aio-ui/input` — curated, never `export *`. */

export { InputBuilder } from "./Input";
export type {
  InputType, iActionType, iBasicInputConfig, iBasicInputNode, iBasicSelectOption, iInputActionContext,
  iInputActionDefinition, iInputActionHandler, iInputConfig,
} from "./Input";

/**
 * The input layer's own sub-modules, in both shapes a host may need.
 *
 * `INPUT_MODULE_DEFINITIONS` is what a `ModuleLoader` takes (`{ id, load }`) — the full stack,
 * one import. `INPUT_MODULE_MANIFEST` is the same list as manifest refs (`{ id, path, export }`)
 * for an AST that lets `ComponentRegistry` resolve them. A consumer that wants **only some** of
 * them imports the individual definition from its own subpath, so the rest is never instantiated:
 *
 * ```ts
 * import { dropdownInputModule } from "@aio-ui/input/dropdown/module";
 * new InputBuilder({ modules: [dropdownInputModule] });
 * ```
 *
 * Order is decorate order (`controls` before `popover`): the preset is a list, not a set.
 */
export {
  INPUT_MODULE_DEFINITIONS, INPUT_MODULE_DEFINITION_IDS, INPUT_MODULE_IDS, INPUT_MODULE_MANIFEST,
  inputFilesOf, mountInputModules,
} from "./InputRegistry";
export type {
  InputModuleDefinition, InputModuleId, InputModuleItem, InputModulePreset, iInputAdapter, iInputModuleContext,
} from "./InputRegistry";
