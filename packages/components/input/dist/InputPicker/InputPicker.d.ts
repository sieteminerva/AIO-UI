/**
 * InputPicker — a grid of choices behind one control (an icon picker, a swatch board,
 * an image/media gallery).
 *
 * The field type is owned by `InputPicker.inputModules.ts`; this file is the builder
 * the module instantiates. Two looks, one tree:
 *
 *   - `expanded: false` — trigger + a native `popover` panel, anchored to the trigger.
 *     Used where the field sits in a cramped form.
 *   - `expanded: true` — the grid is part of the page: the search box and the cells are
 *     always visible, no popover, no trigger.
 *
 * `#selected` is the single source of truth; `#paint()` pushes it into the DOM. Every
 * write goes through `#paint()` so a caller, a filter and a click can never disagree.
 */
import type { iBuilderConfig } from "@aio-ui/core/interface";
import { Builder } from "@aio-ui/base";
/** Every node this component can render. Order is documentation, not behaviour. */
export declare const PICKER_KEYS: readonly ["@picker", "@picker>trigger", "@picker>trigger>preview", "@picker>trigger>label", "@picker>panel", "@picker>panel>search", "@picker>panel>grid", "@picker>panel>grid>option", "@picker>panel>grid>option>preview", "@picker>panel>grid>option>name", "@picker>panel>empty", "@picker>value", "@picker>visual>icon", "@picker>visual>image", "@picker>visual>swatch"];
export type PickerElementType = (typeof PICKER_KEYS)[number];
/** Which visual a cell draws. */
export type PickerKind = "icon" | "image" | "media" | "swatch";
/** One choice. `icon` is a global icon name (`gear`, `user.settings`), `src` an image URL. */
export interface iPickerOption {
    value: string;
    label?: string;
    /** Global `i.icon.<name>` class from `@aio-ui/styles` — `kind: "icon"`. */
    icon?: string;
    /** Image URL — `kind: "image"` / `"media"`. */
    src?: string;
    /** Any CSS colour — `kind: "swatch"`. */
    color?: string;
}
/** What the module hands the builder. */
export interface iPickerPayload {
    id?: string;
    title?: string;
    name?: string;
    placeholder?: string;
    value?: string | string[] | null;
    options?: Array<iPickerOption | string>;
}
export interface iPickerConfig extends iBuilderConfig<PickerElementType> {
    /** What a cell previews: an icon class, an image, or a colour chip. */
    kind?: PickerKind;
    /** `true` prints the grid inline instead of behind the trigger's popover. */
    expanded?: boolean;
    /** Adds the filter box above the grid. */
    searchable?: boolean;
    /** Grid columns. */
    columns?: number;
    /** Lets the visitor pick more than one cell. */
    isMultiple?: boolean;
    placeholder?: string;
}
/** Default shape per key; a theme overrides it through `config.selectors`. */
export declare const PICKER_SELECTORS: iBuilderConfig<PickerElementType>["selectors"];
export declare class PickerBuilder extends Builder<PickerElementType, iPickerConfig> {
    #private;
    readonly builderId = "input-picker";
    readonly name = "input-picker";
    /** Short specifier the package maps to `InputPicker.css` — the file-uploader pattern. */
    readonly stylesheet = "./picker.css";
    config: Required<iPickerConfig>;
    constructor(config?: Partial<iPickerConfig>);
    /** The selection as plain strings — what the hidden input and the form see. */
    get value(): string[];
    /** Adds (or replaces) a selection without a pointer: `multiple` decides which. */
    select(value: string | string[]): void;
    prepare(data?: iPickerPayload): HTMLElement;
    protected template(typeKey: PickerElementType, el: HTMLElement, payload?: any): void;
    initialize(): void;
    /** Opens the popover panel. No-op in the expanded look. */
    open(): void;
    /** Closes the popover panel. No-op in the expanded look. */
    close(): void;
}
//# sourceMappingURL=InputPicker.d.ts.map