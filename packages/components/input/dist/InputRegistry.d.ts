/**
 * Input module registry — **data and helpers only, zero implementations.**
 *
 * The input layer has its own sub-modules — controls nobody should pay for unless the
 * field asks for them: a dropdown (a whole builder), the uploader (~1.8k lines), the
 * action button set, and popovers. This file declares them as **refs** (`InputModuleManifest`,
 * strings) and offers the helpers that walk a preset; the live definitions
 * (`INPUT_MODULE_DEFINITIONS`, `{ id, load }`) are re-exported from `./index`, which
 * provides them from each component subpath.
 *
 * The root pulls the four modules (one door), but they are also published beside their own
 * component subpaths, so a bundler that only imports a field keeps the other builders out.
 * No helper here may name a default preset: a default parameter is an import edge, and the
 * helpers must stay usable without one.
 *
 * The helpers therefore take an **optional** preset and do nothing without one. There is
 * nothing to mount, read or offer when the host declared no modules — that is a capability,
 * not an error.
 *
 * This is *not* the field-type matrix — that is `FieldTypes.ts`. This file decides who is
 * allowed to touch a field while it is being built.
 */
import type { iComponentModuleRef } from "@aio-ui/core";
import type { InputModulePreset } from "./InputModuleTypes";
export { INPUT_MODULE_IDS } from "./InputModuleTypes";
export type { InputModuleId, InputModuleItem, InputModulePreset, iInputAdapter, iInputModuleContext, InputModuleDefinition, } from "./InputModuleTypes";
/**
 * The stack as manifest refs, so a parent component can declare it without importing
 * classes and the registry can resolve one entry at a time.
 *
 * @summary `scope` is deliberately absent here: these are input-layer modules, and it is
 * the *nesting* component (`form`) that labels them `scope: "input"` when it re-declares
 * the list in its own manifest.
 */
export declare const INPUT_MODULE_MANIFEST: iComponentModuleRef[];
/**
 * Offers a subtree to every module in the preset.
 *
 * This is the only entry point a host needs for "fields that were not built by
 * `InputBuilder`" (raw HTML in a form, a multistep step that was just mounted): the
 * registry walks its own set, so the caller never names `FileUploader` — or any other
 * adapter — and a preset without the `file` module simply has nothing to mount.
 *
 * @param root - Subtree to scan.
 * @param preset - Definitions to resolve. Omit it and nothing is mounted: without a
 *   declared preset there is no module to run, and guessing one would undo the split.
 */
export declare function mountInputModules(root: Document | HTMLElement, preset?: InputModulePreset): void;
/**
 * Builds a control set for a scope — a field wrapper or a whole group.
 *
 * @param scope - Element the set acts on.
 * @param actions - Declared actions; the module normalises the shape.
 * @param position - Where the buttons sit relative to the scope.
 * @param preset - Definitions to resolve. Omit it and there is no controls module to ask.
 * @returns The controls node, or `null` when the preset has no controls module.
 *
 * @summary The group-level entry point: `FormBuilder` offers a `<fieldset>` here and never
 * learns that buttons exist, and a preset without the `controls` module simply has no
 * capability rather than a dead button set.
 */
export declare function mountControls(scope: HTMLElement, actions: any, position?: "left" | "right", preset?: InputModulePreset): HTMLElement | null;
/**
 * The files currently selected inside a form, keyed by input name.
 *
 * @param formId - Id of the form that owns the file inputs.
 * @param preset - Definitions to resolve. Omit it and the answer is "no files", because
 *   no module can read them.
 * @returns Raw files; empty when the preset has no module that can read them.
 */
export declare function inputFilesOf(formId: string, preset?: InputModulePreset): Record<string, File[]>;
//# sourceMappingURL=InputRegistry.d.ts.map