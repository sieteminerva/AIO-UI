/**
 * Public surface of `@aio-ui/input` — curated, never `export *`.
 *
 * One door: the builder, the field-type matrix, the module stack and the helpers all come
 * from the root. The module *implementations* ship beside their own component subpath
 * (`@aio-ui/input/dropdown`, `@aio-ui/input/picker`, …) as well, so a tree-shaking
 * bundler can still drop the dropdown builder for a text-only form — but a host never
 * needs a second specifier to register one.
 */

import { dropdownInputModule } from "./Dropdown/Dropdown";
import { fileUploaderInputModule } from "./FileUploader/FileUploader";
import { inputControlsInputModule } from "./InputControls/InputControls";
import { pickerInputModule } from "./InputPicker/InputPicker";
import { popoverInputModule } from "./Input";
import type { InputModuleDefinition } from "./InputModuleTypes";

export { InputBuilder, popoverInputModule } from "./Input";
export type {
  InputType, iActionType, iBasicSelectOption, iInputActionContext,
  iInputActionDefinition, iInputActionHandler, iInputConfig,
} from "./Input";

/**
 * The field schema: `create({ content, config })`, narrowed per `content.type`.
 *
 * `InputSchema<T>` is the public door; `iInputField` is the folded payload the render
 * pipeline and the modules read. `iInputDiscardedKeys` stays internal — it exists to be
 * deleted, not to be consumed.
 */
export type {
  AnyInputSchema, InputChooserType, InputModeOf, InputSchema, InputValueType, InputViewOf,
  InputDropdownViewType, InputFileViewType, InputPickerViewType, InputToggleShapeType,
  InputToggleViewType, InputViewType,
  iInputChoices, iInputConfigNode, iInputConfigOf, iInputConstraint, iInputConstraintOf,
  iInputContentNode, iInputContentOf, iInputEvents, iInputField, iInputIdentity, iInputIdentityOf,
  iInputLayout, iInputLayoutOf, iInputModuleConfig, iInputState, iInputText, iInputValue,
  iInputValueOf,
} from "./InputSchema";

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
export const INPUT_MODULE_DEFINITIONS: InputModuleDefinition[] = [
  dropdownInputModule,
  pickerInputModule,
  fileUploaderInputModule,
  inputControlsInputModule,
  popoverInputModule,
];

/** Ids of the definitions above, so a test can pin the two shapes together. */
export const INPUT_MODULE_DEFINITION_IDS: string[] = INPUT_MODULE_DEFINITIONS.map((definition) => String(definition.id));

export {
  INPUT_MODULE_IDS, INPUT_MODULE_MANIFEST, inputFilesOf, mountInputModules, mountControls,
} from "./InputRegistry";
export type {
  InputModuleDefinition, InputModuleId, InputModuleItem, InputModulePreset, iInputAdapter,
  iInputActionsSpec, iInputModuleContext,
} from "./InputModuleTypes";

export {
  INPUT_STRUCTURAL_KEYS, INPUT_TYPE_REGISTRY, inputTypeOf, isInputAttributeAllowed, scanInputAttributes,
} from "./FieldTypes";
export type { iInputTypeDefinition } from "./FieldTypes";

export { reportMissing } from "./Missing";
export type { iMissingModuleOptions, iMissingModuleReport, iModuleMissingDetail } from "./Missing";

export { collectFormValues } from "./FormValues";
export type { iCollectValuesOptions } from "./FormValues";

export { InputAttributeBuilder } from "./Attribute";
export type { iAttributeProperty, InputAttributeType } from "./Attribute";

export type {
  CalculationPrimitive, CalculationValues, iCalculationContext, iCalculationFormula, iCalculationLineItem,
} from "./CalculationTypes";
