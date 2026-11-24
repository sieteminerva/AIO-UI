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
 *
 * Anything in {@link iInputDiscardedKeys} is listed on purpose: it exists in the old node
 * but does not belong to a field. Keeping it in one interface makes the deletion reviewable.
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
 * `label` is the preferred caption; `title` was its legacy shorthand (see the discarded
 * block). `placeholder` is the empty-state hint; `info` is help text rendered as the last,
 * full-width child of the field.
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
 * Callbacks the field owns.
 *
 * `onFileSelected` fires with the raw picked files (only when the file module is
 * registered). `calculator` attaches a calculation strategy (usually a readonly total).
 *
 * Read by: `FileUploaderInputModule.decorate`, the calculation engine in `@aio-ui/form`.
 */
export interface iInputEvents {
  /** Raw files picked in a `file` field, in browser order. */
  onFileSelected?: (files: File[], field: iInputField) => void | Promise<void>;
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
 * Settings consumed by the optional sub-modules.
 *
 * `actions`/`popover` belong to the controls and popover modules; the dropdown keys are
 * forwarded to `DropdownBuilder`; the picker keys feed `PickerBuilder`; the uploader keys
 * drive the `@field>file` markup and the uploader instance.
 *
 * Read by: `InputControlsInputModule`, `PopoverInputModule`, `DropdownInputModule`,
 * `PickerInputModule`, `FileUploaderInputModule`, `InputBuilder.template` (`@field>file`).
 */
export interface iInputModuleConfig {
  /** Button set declared on the field. Presets (`"editor"`, `"repeater"`) or definitions. */
  actions?: Array<iActionType | iInputActionDefinition> | Partial<Record<iActionType, Omit<iInputActionDefinition, "type">>> | null;
  /** HTML string or element attached by the popover module. */
  popover?: string | HTMLElement;

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

  /** Picker panel settings. The cell visual lives in `layout.view`. */
  expanded?: boolean;
  searchable?: boolean;

  /** Uploader limits and extras (presentation lives in `layout.view`). */
  thumbnail?: boolean;
  maxUpload?: number;
  maxFileSize?: number;
  groupUnallowed?: boolean;
  /** Mark the field's file as tabular so a table owner may preview it. */
  csv?: boolean;
}

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

/** The behaviour block for one type. */
export type iInputConfigOf<T extends InputType> = iInputConstraintOf<T> &
  iInputState &
  iInputLayoutOf<T> &
  iInputEvents &
  iInputModuleConfig;

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
 * `create({ content, config })` folds the two blocks into this one object (content's keys
 * at the top level plus a `config` bag), so the render pipeline and every module keep
 * reading a single flat field. The behaviour keys are also declared flat for the
 * compatibility window: a legacy node parked them at the top level, and the readers still
 * check both places. It is the internal shape, never the public schema.
 */
export type iInputField = iInputContentNode & iInputConfigNode & { config?: iInputConfigNode };

/* ============================================================================
 * DISCARDED — present in the old flat node, not part of a field
 * ==========================================================================*/

/**
 * Keys that exist on the old `iBasicInputNode` but do not describe a field.
 *
 * Kept together so the removal is one reviewable block. Reasons:
 *
 * - **Form containers** (`group`, `row`, `column`, `table`, `legend`, `description`,
 *   `infos`) are read by `FormBuilder`, not `InputBuilder`. A field cannot be a container,
 *   so they belong to the form schema, not here.
 * - **Multistep** (`steps`, `isLast`) are read by the form's multistep engine.
 * - **Cascade** (`condition`, `then`) are read by the form's cascade adapter and are
 *   **relocated, not dropped**: the form owns `iFormField = InputSchema & { condition?;
 *   then? }`, reads them there, then calls `create({ content, config })` without them.
 * - **Builder-level** (`modules`, `themeId`, `namespace`, `selectors`, `emit`, `formId`)
 *   are the *constructor* configuration, never field data — they leak in today because
 *   the old node extended `iBuilderConfig`.
 * - **Aliases / dead keys** (`title`, `class`, `range`, `createEventListener`, `icon`,
 *   `textContent`, `field`, `picker`) are either a second spelling of a live key or
 *   declared and never read.
 *
 * Typed loosely on purpose: nothing should consume this interface; it exists to be deleted.
 */
export interface iInputDiscardedKeys {
  /** @deprecated Form container — `FormBuilder`. */
  group?: unknown;
  /** @deprecated Form container — `FormBuilder`. */
  row?: unknown;
  /** @deprecated Form container — `FormBuilder`. */
  column?: unknown;
  /** @deprecated Form container — `FormBuilder` (`renderTable`). */
  table?: unknown;
  /** @deprecated Form group caption — `FormBuilder`. */
  legend?: string;
  /** @deprecated Form group note — `FormBuilder`. */
  description?: string;
  /** @deprecated Form group notes — `FormBuilder`. */
  infos?: unknown;

  /** @deprecated Multistep engine — not a field property. */
  steps?: number;
  /** @deprecated Multistep engine — not a field property. */
  isLast?: boolean;

  /**
   * @deprecated Relocated to the form schema. The form reads it from its own
   * `iFormField` (`InputSchema & { condition?; then? }`) and never forwards it here.
   */
  condition?: unknown;
  /** @deprecated Relocated to the form schema (see `condition`). */
  then?: unknown;

  /** @deprecated Builder configuration — pass `modules` to the constructor. */
  modules?: unknown;
  /** @deprecated Builder configuration — constructor only. */
  themeId?: string;
  /** @deprecated Builder configuration — constructor only. */
  namespace?: string | null;
  /** @deprecated Builder configuration — constructor only. */
  selectors?: unknown;
  /** @deprecated Builder configuration — constructor only. */
  emit?: unknown;
  /** @deprecated Builder configuration — the form passes `formId` to the constructor. */
  formId?: string | null;

  /**
   * @deprecated Second spelling of `content.label`. Read today by
   * `InputBuilder.prepare` (`label ?? title`); migrate consumers to `label`.
   */
  title?: string;
  /** @deprecated Second spelling of the old `className`; both are gone — use `config.selectors`. */
  class?: string;
  /**
   * @deprecated Relocated to `config.selectors["@field"].className`. Each field is its own
   * builder instance, so a per-field skin belongs on that instance's selectors.
   */
  className?: string;
  /** @deprecated Google-sheet named range — resolved outside this layer. */
  range?: string;
  /** @deprecated Declared on the old node and never read by `InputBuilder`. */
  createEventListener?: boolean;
  /** @deprecated Declared on the old node and never read by `InputBuilder`. */
  icon?: string;
  /** @deprecated Declared on the old node and never read by `InputBuilder`. */
  textContent?: string | Record<string, unknown>;
  /** @deprecated Declared on the old node and never read by `InputBuilder`. */
  field?: string;
  /** @deprecated A picker setting bag that no module reads (settings are flat in config). */
  picker?: unknown;

  /**
   * @deprecated Choices belong to `content.options`. Today the only reader is the legacy
   * lift in `InputBuilder.resolvePayload`; remove it once consumers are migrated.
   */
  configOptions?: Array<string | iBasicSelectOption>;
}
