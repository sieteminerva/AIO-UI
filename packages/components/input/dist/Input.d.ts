import type { iElementProperty, iBuilderConfig, iBuilderRegistry, iContentContract } from "@aio-ui/core";
import { Builder } from "@aio-ui/base";
import type { iModuleDefinition } from "@aio-ui/module-loader";
import { ModuleLoader } from "@aio-ui/module-loader";
import { type iInputAdapter, type iInputModuleContext, type InputModulePreset } from "./InputRegistry";
import type { InputSchema, iInputField } from "./InputSchema";
export type InputType = "text" | "textarea" | "number" | "select" | "dropdown" | "picker" | "actions" | "checkbox" | "radio" | "range" | "date" | "time" | "datetime-local" | "file" | "color" | "email" | "password" | "url" | "tel" | "hidden";
export interface iBasicSelectOption {
    value?: string;
    label?: string;
    icon?: string;
    /**
     * Swatch colour for a `picker` in `view: "swatch"`.
     *
     * Read by `PickerBuilder` as `--picker-swatch` on the cell, so a swatch option can show a
     * colour the label cannot say. Ignored by every other view and by a plain `<select>`.
     */
    color?: string;
}
export type InputElementType = "@field" | "@field>label" | "@field>input" | "@field>textarea" | "@field>select" | "@field>select>option" | "@field>checkbox" | "@field>radio" | "@field>toggle" | "@field>file" | "@field>error" | "@field>info";
export type iActionType = "add" | "remove" | "delete" | "save" | "edit" | "copy" | "search" | "custom" | "editor" | "repeater";
export interface iInputActionDefinition {
    type: iActionType;
    selector?: Record<string, iElementProperty>;
    label?: string;
    icon?: string;
    /**
     * `delete` only, on a repeater's **source** row (index 0). Default `true`.
     *
     * `false` locks that row: the record the clones copy stays. Clones are always free to
     * go — this flag never applies to them.
     */
    removable?: boolean;
    /**
     * `delete` only: hide the source's button (a `removable: false` lock is what makes it
     * inert; hiding is a look, not a rule).
     */
    hideOnSource?: boolean;
    onClick: iInputActionHandler;
}
export interface iInputActionContext {
    parentElement: HTMLElement;
    /** Field the set belongs to; `null` when the scope is a group. */
    input: iInputField | null;
    action: iActionType;
    button: HTMLButtonElement;
    /** First control of the scope, kept for single-field sets. */
    element: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null;
    /** One control's value, or a serialized summary for a group. */
    value: string;
    /** Every value of the scope, in submit vocabulary (that is what `search` reports). */
    values?: Record<string, any>;
    event: MouseEvent;
    result?: unknown;
}
export type iInputActionHandler = (parentElement: HTMLElement, context: iInputActionContext) => void | Promise<void>;
/** Builder-level configuration for the input layer. */
export interface iInputConfig extends iBuilderConfig<InputElementType> {
    /**
     * Optional loader that supplies the input sub-modules (dropdown, file, controls, popover).
     *
     * Leave it `null` and the field is a plain labelled control: the modules are an
     * enhancement, never a precondition. Pass `INPUT_MODULE_DEFINITIONS` from
     * `@aio-ui/input` (the `INPUT_MODULE_DEFINITIONS` export) for the full layer, a subset, or your own module. Since
     * `0.3.0` nothing is compiled into the package root, so an omitted option costs no
     * bytes rather than silently shipping all four.
     *
     * An already-resolved `iInputAdapter[]` is accepted too: that is what a parent
     * component hands over when its own manifest resolved the set — the field must not
     * load or unload modules its host owns.
     */
    modules?: ModuleLoader<iInputModuleContext, iInputAdapter> | InputModulePreset | null;
}
export declare class InputBuilder extends Builder<InputElementType, iInputConfig> {
    #private;
    readonly builderId: keyof iBuilderRegistry;
    readonly name: keyof iBuilderRegistry;
    readonly stylesheet: string;
    /** One field node. The vocabulary itself lives in `InputSchema.ts`; this stays open. */
    static readonly contract: iContentContract;
    /**
     * 🪶 LOADING MOCKUP — one label and one control box, drawn with the mandatory
     * `@aio-ui/skeleton` primitive. The control type (select, textarea, switch) changes the
     * skin, never the box: a field reserves one line plus one control.
     */
    protected loading(): HTMLElement;
    constructor(config?: Partial<iInputConfig>);
    private resolvePayload;
    /**
     * The one door.
     *
     * `{ content, config }` is folded into the flat payload the pipeline reads — content keys
     * at the top level, behaviour in one bag. Those are the only two blocks a field has, so
     * the schema is the only shape this builder accepts.
     *
     * @param schema - `InputSchema<T>` when the type is known, the whole union otherwise.
     * @returns The field's root element.
     */
    create<const T extends InputType>(schema?: InputSchema<T>): HTMLElement;
    /**
     * Assignability only: `Builder.create` takes the base shape, and a narrower parameter
     * cannot override it. Nothing in this package calls it — the fold above is the door.
     *
     * @internal
     */
    create(schema?: {
        content?: any;
        config?: Partial<iInputConfig>;
    }): HTMLElement;
    prepare(inputObj: Partial<iInputField> & Record<string, any>, _config?: Required<iInputConfig> | undefined): HTMLElement | Record<string, any | HTMLElement>;
    protected template(typeKey: InputElementType, el: HTMLElement, payload?: any): void;
    initialize(_el?: HTMLElement, _payload?: any, _context?: any): void;
    /**
     * A `radio`/`checkbox` field given `options` is a group: one control per option, all on
     * the field's `name`. `radio` is exclusive by nature, `checkbox` takes several — the
     * field type decides, exactly the way `select` decides through its own type.
     *
     * The caption above the group names it, and every control owns a
     * `<label class="choice-item">`, so the text next to a dot is clickable too.
     */
    private renderChoices;
    /** The chosen values of a choice group: an array, a comma string, or one scalar. */
    private choiceValues;
    /**
     * Applies a schema to a live control.
     *
     * The registry decides what a type may carry: an attribute that means nothing for the
     * type is dropped instead of landing in the markup (`maxlength` on a `checkbox`, a
     * `min` on a `file`). `id` and `name` are structural and always set; `config.attributes`
     * is applied last, so an escape hatch still wins.
     */
    private applyAttributes;
    private _sanitizeId;
}
/**
 * Popover module definition.
 *
 * @example
 * // registered by INPUT_MODULE_DEFINITIONS; drop it and `config.popover` is ignored
 */
export declare const popoverInputModule: iModuleDefinition<iInputModuleContext, iInputAdapter>;
//# sourceMappingURL=Input.d.ts.map