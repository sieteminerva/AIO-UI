/**
 * The form schema — the shapes one `form` payload accepts, as types.
 *
 * Why this file exists: a schema is the first thing a consumer writes, and until now it was
 * `any`. A field that kept the pre-split spelling (`title`, `config.options`) still rendered —
 * without a caption and without choices — because nothing typed it. Declare a set as
 * `readonly FormNode[]` and the compiler names the key that is wrong.
 *
 * One field, one shape, everywhere: a field node **is** the input schema
 * (`{ content, config }`), passed through untouched to `InputBuilder.create()`. The only keys
 * the form adds are its own — the cascade rule `condition` and its `then` payload. A layout
 * node (`group` / `row`) is the form's vocabulary, not a field, and keeps its own shape.
 *
 * `legend` / `label` on a group or row is a heading, never the input caption — a caption
 * belongs to a field and lives in that field's `content`.
 */

import type { iElementProperty } from "@aio-ui/core";
import type { iFieldNode, iInputActionsSettings, iInputLayout } from "@aio-ui/input";
import type { iFormCondition } from "./FormModuleTypes";

/** Layout a `group` or `row` node may declare. The form reads it; a field never does. */
export interface iFormNodeLayout {
  id?: string;
  /** Fieldset legend — the `group` heading. */
  legend?: string;
  /** Row heading. Kept beside `legend` because a row renders a label, not a legend. */
  label?: string;
  description?: string;
  /** Line cap: how many children one line holds. A row always grids, a group only when it says so. */
  column?: number | string;
  className?: string;
  wide?: number | string | null;
  /** Control buttons the group/row owns (a control set acts on the container). */
  actions?: iInputActionsSettings["actions"];
  actionsPosition?: iInputLayout["position"];
}

/**
 * One field: the input schema as written — `{ content, config }` — plus the form's own keys.
 *
 * The union is the input package's, distributed member by member, so a field stays narrowed by
 * its `content.type`: `options` only reaches a chooser, `checked` only a toggle, `maxUpload`
 * only a `file`. The form adds nothing to the two blocks except `config.selectors`, which is
 * builder config the field's own `InputBuilder` instance reads (every field is its own builder).
 */
type FormVariant<T> = T extends { content: infer C }
  ? {
    content: C;
    config?:
    | ((T extends { config?: infer G } ? G : never) & {
      /**
       * Element overrides for this field's own builder instance — `selectors["@field"]`
       * is the per-field skin. The adapter lifts this key into the `InputBuilder`
       * constructor, which is where the framework reads selectors.
       */
      selectors?: Record<string, iElementProperty>;
    })
    | undefined;
    /** Cascade rule the form engine evaluates; never forwarded to `InputBuilder`. */
    condition?: iFormCondition;
    /** Value the form writes into the field once `condition` passes. */
    then?: unknown;
  }
  : never;

/** One field node — the distributed input schema, plus the form's cascade keys. */
export type FormField = FormVariant<iFieldNode>;

/** `group` — a fieldset with a legend. Children render in source order. */
export interface iFormGroupNode extends iFormNodeLayout {
  group: FormNode[];
}

/** `row` — layout only: a CSS grid, no fieldset and no field data. */
export interface iFormRowNode extends iFormNodeLayout {
  row: FormNode[];
}

/** One schema entry: a field, a group, a row, raw markup, or an element the host made. */
export type FormNode = FormField | iFormGroupNode | iFormRowNode | string | HTMLElement;
