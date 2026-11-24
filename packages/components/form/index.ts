/** Public surface of `@aio-ui/form` — curated, never `export *`. */

export { DEFAULT_FORM_MESSAGES, FormBuilder, composeMessage, messageDraft, resolveStyle } from "./Form";
export type {
  iFormConfig, iFormMessage, iFormMessageCategory, iFormMessageCompose, iFormMessageField,
  iFormMessageParams, iFormMessages, iFormMessageStyle,
} from "./Form";
// The schema shapes, so a consumer's field list is checked instead of `any`.
export type { FormField, FormNode, iFormGroupNode, iFormNodeLayout, iFormRowNode } from "./FormSchema";

/**
 * The adapter stack **as data** — the root stays free of the implementations.
 *
 * `FORM_ADAPTER_MANIFEST` is the stack as manifest refs (`{ id, path, export }`) for an AST
 * that lets `ComponentRegistry` resolve them. The live list a `ModuleLoader` takes
 * (`FORM_ADAPTER_DEFINITIONS`, `{ id, load }`) lives in `@aio-ui/form`, so that a
 * project which never imports that subpath never compiles the five adapters — proved by
 * `scripts/bundle-probe.mjs` against the parsed module graph:
 *
 * ```ts
 * import { FormBuilder } from "@aio-ui/form";
 * import { FORM_ADAPTER_DEFINITIONS } from "@aio-ui/form";
 * import { ModuleLoader } from "@aio-ui/module-loader";
 *
 * new FormBuilder({ modules: new ModuleLoader("form", FORM_ADAPTER_DEFINITIONS), schema });
 * ```
 *
 * For one engine only, import the individual adapter from its own subpath
 * (`@aio-ui/form/validation-adapter`, `@aio-ui/form`, …).
 */
export { FORM_ADAPTER_MANIFEST } from "./FormRegistry";
export type { FormModuleDefinition } from "./FormRegistry";
export { FORM_MODULE_IDS } from "./FormModuleTypes";
export type { iFormModuleContext, iFormAdapter, FormModulePhase } from "./FormModuleTypes";

// ---- topic contracts + the stack, published from the root ----------------------
// `FormModuleTypes` and `FormAdapters` used to be their own subpaths. The types are free
// (nothing at runtime); the definitions are what `new FormBuilder({ modules })` needs, so
// a host that imports the form should not need a second specifier for them.
export type {
  iFormCondition,
  iCascadeEventDetail,
  iCascadeState,
  FormCascadeMode,
  CascadeBlockedInfo,
  FormCascadeHost,
  FormModuleId,
  iFormTableTarget,
  iFormMessageTarget,
} from "./FormModuleTypes";
export { FORM_ADAPTER_DEFINITIONS, FORM_ADAPTER_IDS } from "./FormAdapters";
export { inputFormAdapter } from "./Input.FormAdapter";
