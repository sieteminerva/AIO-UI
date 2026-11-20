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
import { PickerBuilder } from "./InputPicker.js";
import { INPUT_MODULE_IDS } from "../InputModuleTypes.js";
/** Field-level settings and the builder key each one feeds. */
const SETTINGS = [
    ["style", "kind"],
    ["column", "columns"],
    ["expanded", "expanded"],
    ["searchable", "searchable"],
    ["isMultiple", "isMultiple"],
    ["placeholder", "placeholder"],
];
class PickerInputModule {
    #context;
    constructor(context) {
        this.#context = context;
    }
    /**
     * Builds the picker for a `picker` field.
     *
     * @param field - Resolved field payload.
     * @returns The picker root, or `null` for any other type.
     */
    renderControl(field) {
        if (field.type !== "picker")
            return null;
        const cfg = field.config ?? {};
        const settings = {};
        // Flat only: `config.style` / `config.column` are the same words a row and a dropdown
        // already use, so a schema copied from a sheet needs no second spelling.
        for (const [from, to] of SETTINGS) {
            const value = cfg[from];
            if (value !== undefined)
                settings[to] = value;
        }
        const payload = {
            id: field.id,
            title: field.label ?? field.title,
            name: field.name || field.id,
            placeholder: field.placeholder,
            value: field.value,
            options: cfg.options ?? [],
        };
        const builder = new PickerBuilder({
            ...settings,
            themeId: this.#context.builderConfig.themeId || "default",
            namespace: this.#context.builderConfig.namespace,
            emit: this.#context.builderConfig.emit,
        });
        return builder.create({ content: payload });
    }
}
/** Field-level settings are not DOM attributes; keep them out of the attribute pass. */
export const PICKER_SETTING_KEYS = SETTINGS.map(([from]) => from);
/**
 * Picker module definition.
 *
 * @example
 * // registered by INPUT_MODULE_DEFINITIONS; omit it from a custom preset and a
 * // `picker` field degrades to a native select over the same options.
 */
export const pickerInputModule = {
    id: INPUT_MODULE_IDS.picker,
    load: (context) => new PickerInputModule(context),
};
//# sourceMappingURL=InputPicker.inputModules.js.map