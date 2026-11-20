/**
 * Picker input module.
 *
 * `type: "picker"` is a grid of choices — icons, swatches, images — owned by
 * `PickerBuilder`, not by an `@field>` selector. Keeping the builder out of `InputBuilder`
 * means a project that never declares a picker never compiles it.
 *
 * Settings live flat on the field's `config`, next to `options`, using the same vocabulary
 * the rest of the schema already speaks:
 *
 *   `style`     — `icon | image | media | swatch` (the cell visual)
 *   `column`    — grid track count, like a row's `column`
 *   `expanded`  — print the grid inline instead of behind the trigger's popover
 *   `searchable`, `isMultiple`, `placeholder`
 */
import type { iModuleDefinition } from "@aio-ui/module-loader";
import { type iInputAdapter, type iInputModuleContext } from "../InputModuleTypes";
/** Field-level settings are not DOM attributes; keep them out of the attribute pass. */
export declare const PICKER_SETTING_KEYS: readonly string[];
/**
 * Picker module definition.
 *
 * @example
 * // registered by INPUT_MODULE_DEFINITIONS; omit it from a custom preset and a
 * // `picker` field degrades to a native select over the same options.
 */
export declare const pickerInputModule: iModuleDefinition<iInputModuleContext, iInputAdapter>;
//# sourceMappingURL=InputPicker.inputModules.d.ts.map