/**
 * Public surface of `@aio-ui/input` — curated, never `export *`.
 *
 * One door: the builder, the field-type matrix, the module stack and the helpers all come
 * from the root. The module *implementations* ship beside their own component subpath
 * (`@aio-ui/input/dropdown`, `@aio-ui/input/picker`, …) as well, so a tree-shaking
 * bundler can still drop the dropdown builder for a text-only form — but a host never
 * needs a second specifier to register one.
 */
import { dropdownInputModule } from "./Dropdown/Dropdown.js";
import { fileUploaderInputModule } from "./FileUploader/FileUploader.js";
import { inputControlsInputModule } from "./InputControls/InputControls.js";
import { pickerInputModule } from "./InputPicker/InputPicker.js";
import { popoverInputModule } from "./Input.js";
export { InputBuilder, popoverInputModule } from "./Input.js";
/**
 * The input layer's default sub-module stack, as data a `ModuleLoader` takes.
 *
 * Registration order is decorate order, so `controls` (the action set) runs before
 * `popover`, which anchors to a wrapper the controls may have changed. Nothing is
 * instantiated until a field, a form or a helper asks for it, so a host that omits the
 * stack still renders plain labelled controls.
 *
 * ```ts
 * import { InputBuilder, INPUT_MODULE_DEFINITIONS } from "@aio-ui/input";
 * new InputBuilder({ modules: INPUT_MODULE_DEFINITIONS, type: "dropdown", options });
 * ```
 */
export const INPUT_MODULE_DEFINITIONS = [
    dropdownInputModule,
    pickerInputModule,
    fileUploaderInputModule,
    inputControlsInputModule,
    popoverInputModule,
];
/** Ids of the definitions above, so a test can pin the two shapes together. */
export const INPUT_MODULE_DEFINITION_IDS = INPUT_MODULE_DEFINITIONS.map((definition) => String(definition.id));
export { INPUT_MODULE_IDS, INPUT_MODULE_MANIFEST, inputFilesOf, mountInputModules, mountControls, } from "./InputRegistry.js";
export { INPUT_STRUCTURAL_KEYS, INPUT_TYPE_REGISTRY, inputTypeOf, isInputAttributeAllowed, scanInputAttributes, } from "./FieldTypes.js";
export { reportMissing } from "./Missing.js";
export { collectFormValues } from "./FormValues.js";
export { InputAttributeBuilder } from "./Attribute.js";
//# sourceMappingURL=index.js.map