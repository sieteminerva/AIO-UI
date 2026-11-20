/**
 * Input module registry — **data and helpers only, zero implementations.**
 *
 * The input layer has its own sub-modules — controls nobody should pay for unless the
 * field asks for them: a dropdown (a whole builder), the uploader (~1.8k lines), the
 * action button set, and popovers. This file declares them as **refs** (`InputModuleManifest`,
 * strings) and offers the helpers that walk a preset; the live definitions
 * (`INPUT_MODULE_DEFINITIONS`, `{ id, load }`) live in `./InputModules`, behind the
 * `@aio-ui/input/modules` subpath.
 *
 * That split is deliberate: importing `@aio-ui/input` must not compile the four modules.
 * `scripts/bundle-probe.mjs` proves it against the parsed module graph — which is also why
 * no helper here may name a default preset: a default parameter is an import edge.
 *
 * The helpers therefore take an **optional** preset and do nothing without one. There is
 * nothing to mount, read or offer when the host declared no modules — that is a capability,
 * not an error.
 *
 * This is *not* the field-type matrix — that is `FieldTypes.ts`. This file decides who is
 * allowed to touch a field while it is being built.
 */
import { ModuleLoader } from "@aio-ui/module-loader";
export { INPUT_MODULE_IDS } from "./InputModuleTypes.js";
/** Whether a preset item is a definition (needs loading) or a live adapter. */
function isDefinition(item) {
    return typeof item.load === "function";
}
/**
 * Turns any accepted preset into adapters, plus a disposer for the ones it created.
 *
 * @param preset - Definitions, live adapters, or a mix of both.
 * @param context - Host configuration handed to freshly loaded modules.
 * @returns The adapters to use and the matching cleanup.
 */
function adaptersOf(preset, context) {
    const definitions = preset.filter(isDefinition);
    const live = preset.filter((item) => !isDefinition(item));
    if (!definitions.length) {
        // Everything was already resolved by the caller (a parent's manifest): never re-load.
        return { adapters: live, dispose: () => { } };
    }
    const loader = new ModuleLoader("input", definitions);
    return { adapters: [...loader.resolveAll(context), ...live], dispose: () => loader.unloadAll() };
}
/**
 * The stack as manifest refs, so a parent component can declare it without importing
 * classes and the registry can resolve one entry at a time.
 *
 * @summary `scope` is deliberately absent here: these are input-layer modules, and it is
 * the *nesting* component (`form`) that labels them `scope: "input"` when it re-declares
 * the list in its own manifest.
 */
export const INPUT_MODULE_MANIFEST = [
    { id: "dropdown", path: "@aio-ui/input/dropdown/module", export: "dropdownInputModule" },
    { id: "picker", path: "@aio-ui/input/picker/module", export: "pickerInputModule" },
    { id: "file", path: "@aio-ui/input/file-uploader/module", export: "fileUploaderInputModule" },
    { id: "controls", path: "@aio-ui/input/controls/module", export: "inputControlsInputModule" },
    { id: "popover", path: "@aio-ui/input/popover/module", export: "popoverInputModule" },
];
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
export function mountInputModules(root, preset) {
    if (!preset?.length)
        return;
    const { adapters, dispose } = adaptersOf(preset, { builderConfig: { themeId: "default" } });
    for (const module of adapters)
        module.mount?.(root);
    dispose();
}
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
export function mountControls(scope, actions, position = "right", preset) {
    if (!preset?.length)
        return null;
    const { adapters, dispose } = adaptersOf(preset, { builderConfig: { themeId: "default" } });
    const module = adapters.find((m) => typeof m.renderActions === "function");
    const node = module?.renderActions?.(scope, { actions, position }) ?? null;
    dispose();
    return node;
}
/**
 * The files currently selected inside a form, keyed by input name.
 *
 * @param formId - Id of the form that owns the file inputs.
 * @param preset - Definitions to resolve. Omit it and the answer is "no files", because
 *   no module can read them.
 * @returns Raw files; empty when the preset has no module that can read them.
 */
export function inputFilesOf(formId, preset) {
    if (!preset?.length)
        return {};
    const { adapters, dispose } = adaptersOf(preset, { builderConfig: { themeId: "default" } });
    const module = adapters.find((m) => typeof m.getFiles === "function");
    const files = module?.getFiles ? module.getFiles(formId) : {};
    dispose();
    return files;
}
//# sourceMappingURL=InputRegistry.js.map