/**
 * Input field schema — the `content` / `config` split, **grouping stage**.
 *
 * Why this file exists: an input today receives one flat node in which data, rules,
 * layout, events and module settings are mixed. The refactor separates them into two
 * blocks — `content` (what the field *is*) and `config` (how it *behaves*) — and then
 * makes the blocks a per-`type` discriminated union.
 *
 * The rule used to sort every property (see `Attribute.ts` for the vocabulary):
 *
 * - **content** — instance data: identity, value, choices, and the text the visitor reads.
 *   Two fields of the same `type` may differ here without changing behaviour.
 * - **config** — rules and wiring: constraints, state, layout, callbacks, module settings.
 *
 * The groups below are the *inventory* of properties that actually exist in `Input.ts`,
 * `Attribute.ts` and the four modules, each with the code that reads it; the union
 * (`AnyInputSchema` / `InputSchema<T>`) is assembled from them at the bottom of this file.
 */

import type { InputType, iBasicSelectOption, iActionType, iInputActionDefinition } from "./Input";
import type { iCalculationFormula } from "./CalculationTypes";

/** A value a control can hold. `readonly string[]` is a multi-choice selection. */
export type InputValueType = string | number | boolean | readonly string[] | null;

/* ============================================================================
 * CONTENT — the data the field is
 * ==========================================================================*/

/**
 * Identity — what the field is and how it is addressed.
 *
 * `type` is the discriminator: it selects the variant and, through `FieldTypes.ts`,
 * the control and the attribute matrix. `id` feeds the label's `for` and the control's
 * `id`; `name` becomes the submitted name (and the shared name of a radio/checkbox group).
 *
 * Read by: `InputBuilder.resolvePayload` / `applyAttributes`, `renderChoices`.
 */
export interface iInputIdentity {
  type: InputType;
  id?: string;
  name?: string;
}

/**
 * Text the visitor reads.
 *
 * `label` is the caption. `placeholder` is the empty-state hint; `info` is help text
 * rendered as the last, full-width child of the field.
 *
 * Read by: `InputBuilder.prepare` (label + `@field>label`), `@field>info`.
 */
export interface iInputText {
  label?: string;
  placeholder?: string;
  info?: string;
}

/**
 * The data the control holds.
 *
 * `value` is the current value; `checked` is the toggle state for `checkbox`/`radio`.
 * For a choice group, `value` may be a comma string or an array of chosen values.
 *
 * Read by: `InputBuilder.applyAttributes` (`value`, `checked`), `renderChoices`,
 * `choiceValues`.
 */
export interface iInputValue {
  value?: InputValueType;
  checked?: boolean;
}

/**
 * The choices offered by a chooser.
 *
 * One spelling for `select`, `dropdown`, `picker` and a `radio`/`checkbox` group: a bare
 * string is `{ value, label }`.
 *
 * Read by: `InputBuilder` (`@field>select` option loop, `renderChoices`),
 * `DropdownInputModule`, `PickerInputModule`.
 */
export interface iInputChoices {
  options?: Array<string | iBasicSelectOption>;
}

/** Everything the field *is*: identity, text, value and choices. */
export interface iInputContentNode extends iInputIdentity, iInputText, iInputValue, iInputChoices { }

/* ============================================================================
 * CONFIG — how the field behaves
 * ==========================================================================*/

/**
 * Rules a value must satisfy and limits on the control.
 *
 * Exactly these are the native validation attributes, filtered per type by
 * `INPUT_TYPE_REGISTRY` (a type that does not list an attribute drops it):
 * `number`/`range` → `min`, `max`, `step`; textual types → `maxlength`, `minlength`,
 * `pattern`, `autocomplete`, `inputmode`; `textarea` → `rows`, `cols`; `file` → `accept`;
 * `select`/`dropdown`/`picker`/`file` → `multiple`.
 *
 * Read by: `InputBuilder.applyAttributes` (`ATTRIBUTE_ORDER`), the `@field>textarea`
 * template (`rows`), and the module readers for `multiple`.
 */
export interface iInputConstraint {
  required?: boolean;
  min?: number | string;
  max?: number | string;
  /** Numeric increment; `"any"` lets decimals pass native validation. `number`/`range`. */
  step?: number | "any";
  minlength?: number;
  maxlength?: number;
  pattern?: string;
  accept?: string;
  autocomplete?: string;
  /**
   * Native virtual-keyboard hint. Kept: it costs nothing and helps on mobile.
   *
   * `INPUT_TYPE_REGISTRY` must list it for `email`, `url`, `tel` and `number` as well —
   * today only `text` accepts it, so the hint is silently dropped on those types.
   */
  inputmode?: "none" | "text" | "decimal" | "numeric" | "tel" | "search" | "email" | "url";
  rows?: number;
  cols?: number;
  multiple?: boolean;
}

/**
 * Whether the control is interactive.
 *
 * `disabled` and `readonly` map to the native attributes. `editable` is the framework
 * flag: keep this field writable while a control set (`InputControls`) locks its scope;
 * it becomes `data-editable` on the field wrapper.
 *
 * Read by: `InputBuilder.applyAttributes` / `prepare`, `InputControls` (`editable`).
 */
export interface iInputState {
  disabled?: boolean;
  readonly?: boolean;
  editable?: boolean;
  /**
   * Data for this field is still arriving: the control carries the `loading` class while
   * true. It replaces the old `className: "loading"` shortcut, which cost the whole
   * `className` key for one boolean.
   */
  loading?: boolean;
  /**
   * Validation state from the host.
   *
   * `true` marks the field invalid with no message; a string marks it invalid and is the
   * message to show. An `Error` object is deliberately not accepted — the reader would
   * only stringify it, so the host passes `error.message` instead. Rendered as
   * `data-error` on the wrapper, plus an `@field>error` child for a string (wired in the
   * implementation stage).
   */
  error?: boolean | string;
}

/**
 * Per-owner view vocabularies.
 *
 * Each set belongs to exactly one field type. Keeping them as separate named types (not
 * one flat union) is what lets the discriminated schema show only the valid words for the
 * chosen `content.type`: a `file` field offers `"list" | "thumbnails"`, never `"icon"`.
 * The grouping stage keeps the union only so {@link iInputLayout} can describe the internal
 * resolved field; each per-type `InputSchema<T>` narrows it back to its own member type.
 */

/** `file` — a row list or a thumbnail grid. */
export type InputFileViewType = "list" | "thumbnails";
/** `dropdown` — a popover menu or a native datalist. */
export type InputDropdownViewType = "select" | "datalist";
/**
 * `picker` — the cell visual. No `"letter"`: the initial-letter preview is a runtime
 * fallback inside the cell (`PickerBuilder#letter`), not a view the schema chooses.
 */
export type InputPickerViewType = "icon" | "image" | "media" | "swatch";
/** `checkbox` / `radio` — the switch shell. */
export type InputToggleViewType = "toggle";
/** Slider shell shape for a toggle. */
export type InputToggleShapeType = "round" | "square";

/** Any view word — for the internal resolved field; each variant narrows it. */
export type InputViewType = InputFileViewType | InputDropdownViewType | InputPickerViewType | InputToggleViewType;

/**
 * Presentation and layout.
 *
 * `position` (`data-position` on the label) and `useLabel` shape the caption; `display`
 * becomes `data-display` on the wrapper; `attributes` is the declared escape hatch applied
 * last; `shape` is the toggle slider shape.
 *
 * `view` is the one visual-variant word for every type: `"toggle"` (checkbox/radio),
 * `"select"`/`"datalist"` (dropdown), `"icon"`/`"image"`/`"media"`/`"swatch"` (picker)
 * and `"list"`/`"thumbnails"` (file). It replaces both the old `style` (which clashed with
 * `HTMLElement.style`) and the uploader-only `view`, so one key serves every type.
 *
 * `column` is a grid track count, used by the picker panel. A form row also has a
 * `column`, but the two never share an interface (a field is not a row), so the name is
 * deliberate: one word, one job, and never two spellings of the same idea.
 *
 * `wide` / `span` are a field's share of a form row — read by **`FormBuilder`**, not by
 * `InputBuilder`, but they travel on the field so they stay grouped here.
 *
 * `className` is gone: each field is its own builder instance, so a per-field skin is
 * `config.selectors["@field"].className` on that instance. (Implementation must keep the
 * `"loading"` marker, which used to ride on `className`, on its own path.)
 *
 * Read by: `InputBuilder.prepare` / `template` / `applyAttributes`,
 * `DropdownInputModule`, `PickerInputModule`, `FileUploader`, `FormBuilder` layout.
 */
export interface iInputLayout {
  position?: "top" | "left" | "right" | "bottom";
  useLabel?: boolean;
  display?: "block" | "inline";
  wide?: number | string | null;
  span?: number | string | null;
  attributes?: Array<{ name: string; value: string }>;
  /**
   * Visual variant. Each value belongs to one owner (see the named types above); the
   * per-`type` schema variant narrows this to that owner's set, so a `file` field only
   * ever sees `InputFileViewType`.
   */
  view?: InputViewType | (string & {});
  /** Slider shell shape. Only a `checkbox`/`radio` in `"toggle"` view renders a slider. */
  shape?: InputToggleShapeType | (string & {});
  /** Grid track count for a picker panel. */
  column?: number;
}

/**
 * Callbacks the field owns regardless of its type.
 *
 * `calculator` attaches a calculation strategy (usually a readonly total). The uploader's
 * `onFileSelected` is not here: it only means anything on a `file` field, so it lives in
 * {@link iInputFileSettings} and is refused on every other type.
 *
 * Read by: the calculation engine in `@aio-ui/form`.
 */
export interface iInputEvents {
  /**
   * Calculation strategy attached to this input (usually a readonly total).
   *
   * Kept as `calculator`, not `formula`: the type is `iCalculationFormula`, which already
   * has its own `formula` function, so the rename would read `config.formula.formula`.
   * Read by `form/adapters/Calculation.ts` (`item.config?.calculator`).
   */
  calculator?: iCalculationFormula<any>;
}

/**
 * Settings consumed by the optional sub-modules — one owner type per module.
 *
 * Splitting them is what makes a per-type schema honest: a `file` config offers uploader
 * keys and nothing else, a `dropdown` offers its fetch/callback keys, a `picker` its panel
 * keys. {@link iInputModuleSettingsOf} composes exactly one owner set per `content.type`.
 *
 * `actions`/`popover` are the exception: a button set or a popover acts on the field
 * wrapper, whatever the type is, so {@link iInputActionsSettings} is on every variant.
 */

/** Action buttons and popover content — legal on every type (a wrapper-level concern). */
export interface iInputActionsSettings {
  /** Button set declared on the field. Presets (`"editor"`, `"repeater"`) or definitions. */
  actions?: Array<iActionType | iInputActionDefinition> | Partial<Record<iActionType, Omit<iInputActionDefinition, "type">>> | null;
  /** HTML string or element attached by the popover module. */
  popover?: string | HTMLElement;
}

/** Keys forwarded to `DropdownBuilder` (`dropdown` type). */
export interface iInputDropdownSettings {
  /**
   * @deprecated Escape hatch forwarded wholesale to `DropdownBuilder`. The named keys
   * below (`apiUrl`, `debounceDelay`, `onSelect`, `onMultiChange`) already cover the
   * documented surface; add a named key instead of reaching through this blob, so the
   * field type stays strict.
   */
  dropdown?: Record<string, any>;
  apiUrl?: string | null;
  debounceDelay?: number;
  onSelect?: (value: string, id: string | null) => void;
  onMultiChange?: (items: Array<{ id: string | number; label: string }>) => void;
}

/** Panel behaviour of a `picker` field. The cell visual lives in `layout.view`. */
export interface iInputPickerSettings {
  expanded?: boolean;
  searchable?: boolean;
}

/** Uploader limits, callback and extras (`file` type). Presentation lives in `layout.view`. */
export interface iInputFileSettings {
  /** Raw files picked in a `file` field, in browser order. */
  onFileSelected?: (files: File[], field: iInputField) => void | Promise<void>;
  thumbnail?: boolean;
  maxUpload?: number;
  maxFileSize?: number;
  groupUnallowed?: boolean;
  /** Mark the field's file as tabular so a table owner may preview it. */
  csv?: boolean;
}

/**
 * Every module key, as the internal resolved field carries them (all owners at once).
 *
 * This is the union a module reader may touch; a *schema* narrows it per type through
 * {@link iInputModuleSettingsOf}.
 */
export type iInputModuleConfig = iInputActionsSettings &
  iInputDropdownSettings &
  iInputPickerSettings &
  iInputFileSettings;

/** Every behaviour the field has: constraints, state, layout, events and module settings. */
export interface iInputConfigNode
  extends iInputConstraint,
  iInputState,
  iInputLayout,
  iInputEvents,
  iInputModuleConfig { }

/* ============================================================================
 * THE UNION — one variant per `content.type`
 * ==========================================================================*/

/**
 * Types that offer a list of choices.
 *
 * `select`/`dropdown`/`picker` read it through their own control; `checkbox`/`radio` turn
 * every option into a control on the field's `name`.
 */
export type InputChooserType = "select" | "dropdown" | "picker" | "checkbox" | "radio";

/** Identity, with the discriminator pinned so the variant can be extracted. */
export interface iInputIdentityOf<T extends InputType> {
  type: T;
  id?: string;
  name?: string;
}

/**
 * The data block, narrowed by type: only a toggle carries `checked`, and only a chooser
 * carries `options` (declared `never` elsewhere so a wrong key is a compile error, not a
 * silently ignored one).
 */
export type iInputContentOf<T extends InputType> = iInputIdentityOf<T> &
  iInputText &
  iInputValueOf<T> &
  (T extends InputChooserType ? iInputChoices : { options?: never });

/** `checked` belongs to a toggle; `value` to everything. */
export interface iInputValueOf<T extends InputType> {
  value?: InputValueType;
  checked?: T extends "checkbox" | "radio" ? boolean : never;
}

/** The `view` words one type owns; `never` for a type that has no visual variant. */
export type InputViewOf<T extends InputType> = T extends "file"
  ? InputFileViewType
  : T extends "dropdown"
  ? InputDropdownViewType
  : T extends "picker"
  ? InputPickerViewType
  : T extends "checkbox" | "radio"
  ? InputToggleViewType
  : never;

/**
 * Layout narrowed by type: `view` only offers that type's words, `shape` only reaches a
 * toggle, `column` only a picker panel. The `(string & {})` tail keeps a project's own
 * word legal — the compiler suggests the real set without closing the door.
 */
export type iInputLayoutOf<T extends InputType> = Omit<iInputLayout, "view" | "shape" | "column"> & {
  view?: InputViewOf<T> | (string & {});
  shape?: T extends "checkbox" | "radio" ? InputToggleShapeType | (string & {}) : never;
  column?: T extends "picker" ? number : never;
};

/** `inputmode` is only offered where the type matrix carries the attribute. */
export type InputModeOf<T extends InputType> = T extends "text" | "email" | "url" | "tel" | "number"
  ? NonNullable<iInputConstraint["inputmode"]>
  : never;

/** Constraints narrowed by type (today: just `inputmode`). */
export type iInputConstraintOf<T extends InputType> = Omit<iInputConstraint, "inputmode"> & {
  inputmode?: InputModeOf<T>;
};

/** Keys only one module owns — `never` on every other type, so autocomplete stays silent. */
type iInputForeignModuleKeys = {
  dropdown?: never;
  apiUrl?: never;
  debounceDelay?: never;
  onSelect?: never;
  onMultiChange?: never;
  expanded?: never;
  searchable?: never;
  onFileSelected?: never;
  thumbnail?: never;
  maxUpload?: never;
  maxFileSize?: never;
  groupUnallowed?: never;
  csv?: never;
};

/** The module set one type owns; a type without a module offers none. */
type iInputModuleSettingsFor<T extends InputType> = T extends "file"
  ? iInputFileSettings
  : T extends "dropdown"
  ? iInputDropdownSettings
  : T extends "picker"
  ? iInputPickerSettings
  : {};

/**
 * Module settings narrowed by type: the owner's keys stay, every foreign key is `never`.
 *
 * The `Omit` matters — a `never` key must not intersect an owned one, or a `file` field
 * could not declare `maxUpload`.
 */
export type iInputModuleSettingsOf<T extends InputType> = Omit<
  iInputForeignModuleKeys,
  keyof iInputModuleSettingsFor<T>
> &
  iInputActionsSettings &
  iInputModuleSettingsFor<T>;

/** The behaviour block for one type. */
export type iInputConfigOf<T extends InputType> = iInputConstraintOf<T> &
  iInputState &
  iInputLayoutOf<T> &
  iInputEvents &
  iInputModuleSettingsOf<T>;

/**
 * One variant per type, as a discriminated object keyed by `content.type`.
 *
 * `content` is required — a field with no type is not a field; `config` is optional, and
 * `InputBuilder` fills the defaults.
 */
export type AnyInputSchema = {
  [T in InputType]: { content: iInputContentOf<T>; config?: iInputConfigOf<T> };
}[InputType];

/**
 * The public field schema: `create({ content, config })`, narrowed to one type when the
 * caller names it (`InputSchema<"file">`) and the whole union otherwise.
 *
 * @example
 * const field: InputSchema<"dropdown"> = {
 *   content: { type: "dropdown", id: "city", label: "City", options: ["Bandung"] },
 *   config: { view: "datalist", required: true },
 * };
 */
export type InputSchema<T extends InputType = InputType> = Extract<
  AnyInputSchema,
  { content: { type: T } }
>;

/**
 * The resolved payload `InputBuilder` and its modules read.
 *
 * `create({ content, config })` folds the two blocks into this one object: content keys at
 * the top level, behaviour in the `config` bag. That is the whole shape — there is no
 * second spelling of a behaviour key at the top level, so a reader always knows which
 * block it is reading from. It is the internal shape, never the public schema.
 */
export type iInputField = iInputContentNode & { config?: iInputConfigNode };
