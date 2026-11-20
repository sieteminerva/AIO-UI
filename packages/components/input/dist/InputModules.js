/**
 * The input layer's default sub-module stack — the one import the hand-wired path needs.
 *
 * @summary This module exists so that `@aio-ui/input` **root** can stay free of the
 * module implementations. The root exports the manifest (`INPUT_MODULE_MANIFEST`, plain
 * strings), the ids and the builders; the classes live here, behind the
 * `@aio-ui/input/modules` subpath. A consumer that never imports this file never compiles
 * the dropdown builder, the uploader, the control set or the popover —
 * `scripts/bundle-probe.mjs` proves exactly that, in the parsed module graph.
 *
 * @example
 * import { InputBuilder } from "@aio-ui/input";
 * import { INPUT_MODULE_DEFINITIONS } from "@aio-ui/input/modules";
 *
 * new InputBuilder({ modules: INPUT_MODULE_DEFINITIONS, type: "dropdown", options });
 */
import { dropdownInputModule } from "./Dropdown/Dropdown.InputModule.js";
import { fileUploaderInputModule } from "./FileUploader/FileUploader.InputModule.js";
import { inputControlsInputModule } from "./InputControls/InputControls.InputModule.js";
import { pickerInputModule } from "./InputPicker/InputPicker.inputModules.js";
import { popoverInputModule } from "./Popover.InputModule.js";
/**
 * Every adapter the input layer itself provides.
 *
 * @summary Registration order is decorate order, so `controls` (the action set) runs
 * before `popover`, which anchors to a wrapper the controls may have changed. Named
 * "definitions" because that is what the items are: nothing here is instantiated until
 * a field, a form or a helper asks for it.
 *
 * Nothing in this layer is mandatory: without it a field is a plain labelled control
 * (`text`, `select`, `checkbox`, `file` … all still render), which is why the stack is an
 * opt-in import rather than a default.
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
//# sourceMappingURL=InputModules.js.map