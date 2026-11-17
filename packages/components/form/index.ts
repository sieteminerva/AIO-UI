/** Public surface of `@aio-ui/form` — curated, never `export *`. */

export { DEFAULT_FORM_MESSAGES, FormBuilder, composeMessage, messageDraft, resolveStyle } from "./Form";
export type {
  iFormConfig, iFormMessage, iFormMessageCategory, iFormMessageCompose, iFormMessageField,
  iFormMessageParams, iFormMessages, iFormMessageStyle,
} from "./Form";

/**
 * The adapter stack, in both shapes a host may need.
 *
 * `FORM_ADAPTER_DEFINITIONS` is what a `ModuleLoader` takes (`{ id, load }`) — the full stack,
 * one import. `FORM_ADAPTER_MANIFEST` is the same list as manifest refs (`{ id, path, export }`)
 * for an AST that lets `ComponentRegistry` resolve them. A consumer that wants **only some**
 * engines imports the individual adapter from its own subpath instead, so the others are never
 * instantiated:
 *
 * ```ts
 * import { validationFormAdapter } from "@aio-ui/form/validation-adapter";
 * import { inputFormAdapter } from "@aio-ui/form/Input.FormAdapter";
 * new FormBuilder({ modules: new ModuleLoader("form", [inputFormAdapter, validationFormAdapter]) });
 * ```
 */
export { FORM_ADAPTER_DEFINITIONS, FORM_ADAPTER_IDS, FORM_ADAPTER_MANIFEST } from "./FormRegistry";
export type { FormModuleDefinition } from "./FormRegistry";
export { FORM_MODULE_IDS } from "./FormModuleTypes";
export type { iFormModuleContext, iFormAdapter, FormModulePhase } from "./FormModuleTypes";
