import { InputBuilder, type InputType } from "./Input";
import type { iInputConfigNode, iInputContentNode } from "./InputSchema";
import { scanInputAttributes } from "./FieldTypes";

export interface iAttributeProperty {
  name: string;
  type: InputType;
  label?: string;
  value: string | number | boolean;
  config?: { view?: string; position?: "left" | "right" }
  /** Choices an editor control offers, when it is a chooser (`content.options`). */
  options?: Array<string>;
}

export type InputAttributeType =
  | "value"
  | "label"
  | "name"
  | "placeholder"
  | "required"
  | "disabled"
  | "min"
  | "max"
  | "minlength"
  | "maxlength"
  | "step"
  | "rows"
  | "cols"
  | "accept"
  | "multiple"
  | "checked"
  | "orient"
  | "pattern"
  | "form"
  // Custom for google sheets range
  | "range"
  // Custom for file uploader
  | "data-max-upload"
  | "data-max-file-size"
  | "data-group-unallowed"
  | "data-thumbnail"
  | "data-view"
  | "view"
  | "thumbnail";

/**
 * A field node as a caller hands it over: `{ content, config }` with a partial `content`.
 *
 * `iFieldNode` (`InputSchema.ts`) is the resolved contract; this is its loose door. `type`
 * is optional because a note may predate the contract — the builder defaults it to `text`
 * — and `config` stays open, so a sheet note can carry any host metadata (`sheet`, `cell`,
 * `skipped`, …) without the matrix knowing its name.
 *
 * Note that `iInputField` is NOT this shape — it is the *flat* payload that
 * `InputBuilder.create()` folds a node into, with content keys at the root.
 */
export interface iFieldSeed {
  content: Partial<iInputContentNode>;
  config?: iInputConfigNode & Record<string, any>;
}

/** One editable control of the attribute matrix — already a living element. */
export interface iAttributeRow {
  /** Control type the row renders as (resolved per field type for `min` / `max`). */
  input: InputType;
  value: string | number | boolean;
  config?: Record<string, any>;
  template: HTMLElement;
}

/**
 * Everything an editor needs for one field.
 *
 * `field` is the node untouched — render it, persist it, post it back. `template` is that
 * same node already rendered once, so a preview never has to reconstruct it. `typeControl`
 * is the chooser over every type in {@link InputAttributeBuilder.inputs}, pre-selected to
 * the field's own type — the matrix owns both the list and the control. `attributes` holds
 * one editor control per editable key.
 */
export interface iAttributeSchema {
  field: Required<iFieldSeed>;
  template: HTMLElement;
  typeControl: HTMLElement;
  attributes: Partial<Record<InputAttributeType, iAttributeRow>>;
  type: InputType;
  id: string;
  label: string;
}

// Base config applied to every input
const baseInputConfig = {
  label: "",
  name: "",
  value: "",
  required: false,
  disabled: false,
};

export class InputAttributeBuilder {

  /**
   * Type-specific overrides (minimal defaults per type).
   *
   * `config` is the one non-attribute slot. A type whose content *is* a declaration rather
   * than a value — `actions` — carries it here, so a field of that type is born with an
   * action set instead of an empty control row. Every other type leaves it out.
   */
  static inputs: Record<
    InputType,
    Partial<Record<InputAttributeType, string | number | boolean>> & { config?: Record<string, unknown> }
  > = {
      text: { placeholder: "Enter text", maxlength: 255 },
      textarea: { placeholder: "Enter your message", rows: 3, cols: 30 },
      number: { placeholder: "Enter a number", value: 50, min: 0, max: 100, step: 1 },
      select: { placeholder: "Select an option", range: "sheet_range", form: "form_id", multiple: false },
      dropdown: { placeholder: "Select an option", range: "sheet_range", form: "form_id", multiple: false },
      picker: { placeholder: "Select an option", multiple: false },
      checkbox: { value: "default_value", checked: false },
      radio: { value: "default_value", range: "sheet_range" },
      range: { value: 50, min: 0, max: 100, step: 1, orient: "horizontal" },
      // The field *is* its buttons: `editor` (edit + save) is the pair the old action input
      // always carried, and the lock policy comes with it.
      actions: { config: { actions: ["editor"] } },
      date: { min: "yyyy-MM-dd", max: "yyyy-MM-dd" },
      time: {},
      "datetime-local": { min: "YYYY-MM-DDTHH:mm", max: "YYYY-MM-DDTHH:mm" },
      file: {
        accept: "image/*,.pdf",
        multiple: false,
        "data-max-upload": 10,
        "data-max-file-size": 5,
        "data-group-unallowed": true,
        "data-thumbnail": true,
        "data-view": "thumbnails",
      },
      color: { value: "#000000" },
      email: { placeholder: "Enter email" },
      password: { placeholder: "Enter password", minlength: 8, maxlength: 255 },
      url: { placeholder: "Enter URL", pattern: "https://.*" },
      tel: { placeholder: "Enter phone number", pattern: "" },
      hidden: { value: "hidden_value" },
    };

  // Generic attribute definitions
  static attributes: Partial<Record<InputAttributeType, iAttributeProperty>> = {
    value: { name: "value", type: "text", value: "" },
    placeholder: { name: "placeholder", type: "text", value: "" },
    required: { name: "required", type: "checkbox", config: { view: "toggle", position: "left" }, value: false },
    disabled: { name: "disabled", type: "checkbox", config: { view: "toggle", position: "left" }, value: false },
    min: { name: "min", type: "number", value: "" },
    max: { name: "max", type: "number", value: "" },
    minlength: { name: "minlength", type: "number", value: "" },
    maxlength: { name: "maxlength", type: "number", value: "" },
    step: { name: "step", type: "number", value: 1 },
    rows: { name: "rows", type: "number", value: 3 },
    cols: { name: "cols", type: "number", value: 30 },
    accept: { name: "accept", type: "text", value: "" },
    multiple: { name: "multiple", type: "checkbox", config: { view: "toggle", position: "left" }, value: false },
    checked: { name: "checked", type: "checkbox", config: { view: "toggle", position: "left" }, value: false },
    orient: { name: "orient", type: "text", value: "horizontal" },
    pattern: { name: "pattern", type: "text", value: "" },
    // Custom
    ["data-max-upload"]: { name: "data-max-upload", label: "max upload", type: "number", value: 10 },
    ["data-max-file-size"]: { name: "data-max-file-size", label: "max file size", type: "number", value: 5 },
    ["data-view"]: {
      name: "data-view",
      type: "select",
      value: "thumbnails",
      options: ["thumbnails", "list"],
    },
    ["data-group-unallowed"]: {
      name: "data-group-unallowed",
      label: "group unallowed",
      type: "checkbox",
      config: { view: "toggle", position: "left" },
      value: false,
    },
    ["data-thumbnail"]: { name: "data-thumbnail", label: "display thumbnail", type: "checkbox", config: { view: "toggle", position: "left" }, value: false },
  };
  // resolve correct attr type for min/max
  static resolveMinMaxType(inputType: InputType, key: InputAttributeType) {
    if (!["min", "max"].includes(key)) return null;
    switch (inputType) {
      case "date":
        return "date";
      case "time":
        return "time";
      case "datetime-local":
        return "datetime-local";
      default:
        return "number";
    }
  }

  /**
   * One field node in, one editor-ready descriptor out.
   *
   * `field` keeps `content` / `config` untouched — it is the value a caller persists and
   * re-renders. `template` is that node rendered through the same `InputBuilder` door a page
   * uses, so a preview shows the real field instead of a reconstruction of it. `typeControl`
   * is the type chooser (the matrix owns the type list). `attributes` reads ONE merged key
   * space: a behaviour key that lives in `config` (`multiple`, `range`, `data-*`) still
   * becomes an editable row, and `config` wins a collision because behaviour belongs to it.
   */
  static buildSchemaForType(
    node: iFieldSeed = { content: {} },
    options: { modules?: unknown[] } = {},
  ): iAttributeSchema {
    const content = { ...(node.content || {}) };
    const config = { ...(node.config || {}) };
    const type = (content.type || "text") as InputType;
    content.type = type;

    // Every control is built through the caller's module stack, so a `dropdown` is a real
    // dropdown (not a native select) the first time it renders.
    const build = () => new InputBuilder({ modules: options.modules } as any);

    const merged: Record<string, any> = {
      ...baseInputConfig,
      ...this.inputs[type],
      ...content,
      ...config,
      type,
    };

    const id = String(content.id || content.name || content.label || type);
    const slug = id.toLowerCase().replace(/[\s_]+/g, "-");
    const attributes: Partial<Record<InputAttributeType, iAttributeRow>> = {};

    // now generate attribute editors
    for (const attrKey in this.attributes) {
      const key = attrKey as InputAttributeType;
      const schemaDef = this.attributes[key];
      if (!schemaDef) continue;

      // skip attributes irrelevant to this type
      if (!(key in merged)) continue;

      const value = merged[key];
      let attrType = schemaDef.type;

      // special case: min/max type resolution
      if (["min", "max"].includes(key)) {
        const resolved = this.resolveMinMaxType(type, key);
        if (resolved) attrType = resolved;
      }

      // One editor control, through the same door a project uses: identity + value in
      // `content`, the type's own settings in `config`.
      const attrConfig: Record<string, any> = {
        type: attrType,
        id: `${slug}-${schemaDef.name}`,
        label: schemaDef.label ?? schemaDef.name,
        value,
      };
      if (schemaDef.options) attrConfig.options = schemaDef.options;

      attributes[key] = {
        input: attrType,
        value,
        ...(schemaDef.config ? { config: schemaDef.config } : {}),
        template: build().create({
          content: attrConfig,
          config: schemaDef.config,
        } as any),
      };
    }

    return {
      field: { content, config },
      template: build().create({ content, config } as any),
      // The chooser is the matrix's own first row: it owns the type list, so a caller never
      // has to know `inputs` to offer a type switch.
      typeControl: build().create({
        content: {
          type: "select",
          id: `${slug}-type`,
          name: "type",
          label: "type",
          value: type,
          options: Object.keys(this.inputs),
        },
      } as any),
      attributes,
      type,
      id,
      label: String(content.label ?? id),
    };
  }

  /**
   * Checks a field schema against the registry matrix for its type.
   *
   * One source of truth: the same rows `InputBuilder` renders with decide what may be
   * accepted, so the editor and the renderer can never disagree. The previous version
   * kept its own copy of the matrix and returned `true` as soon as *any* key was
   * allowed — one bad key next to one good key passed silently.
   *
   * @param type - Field type the schema claims.
   * @param schema - Field schema (`{ type, id, label, placeholder, config, … }`).
   * @param customAllowed - Extra keys this project allows beyond the matrix.
   * @returns Accepted/rejected/structural keys; `ok` is true when nothing was rejected.
   */
  static scan(type: InputType, schema: Record<string, any>, customAllowed: string[] = []) {
    const result = scanInputAttributes(type, schema);
    const extra = result.rejected.filter((key) => customAllowed.includes(key));
    const rejected = result.rejected.filter((key) => !customAllowed.includes(key));

    return {
      type,
      accepted: [...result.accepted, ...extra],
      rejected,
      structural: result.structural,
      ok: rejected.length === 0,
    };
  }

  /**
   * Boolean form of {@link scan}, kept for callers that only need a pass/fail.
   *
   * @param type - Field type.
   * @param config - Field schema.
   * @param customAllowed - Extra keys this project allows.
   * @returns `true` when every non-structural key is valid for the type.
   */
  static scanUnallowedAttrs(type: InputType, config: Record<string, any>, customAllowed: string[] = []) {
    return this.scan(type, config, customAllowed).ok;
  }

  /**
   * @param nodes - One `{ content, config }` field node per header, in sheet order.
   * @param options - `modules` is the input module stack every control is built with.
   * @returns One descriptor per node, in the same order.
   */
  static create(nodes: iFieldSeed[] = [], options: { modules?: unknown[] } = {}): iAttributeSchema[] {
    return nodes.map((node) => this.buildSchemaForType(node, options));
  }

}
