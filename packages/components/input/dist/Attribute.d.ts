import { type InputType } from "./Input";
import type { iInputConfigNode, iInputContentNode } from "./InputSchema";
export interface iAttributeProperty {
    name: string;
    type: InputType;
    label?: string;
    value: string | number | boolean;
    config?: {
        view?: string;
        position?: "left" | "right";
    };
    /** Choices an editor control offers, when it is a chooser (`content.options`). */
    options?: Array<string>;
}
export type InputAttributeType = "value" | "label" | "name" | "placeholder" | "required" | "disabled" | "min" | "max" | "minlength" | "maxlength" | "step" | "rows" | "cols" | "accept" | "multiple" | "checked" | "orient" | "pattern" | "form" | "range" | "data-max-upload" | "data-max-file-size" | "data-group-unallowed" | "data-thumbnail" | "data-view" | "view" | "thumbnail";
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
export declare class InputAttributeBuilder {
    /**
     * Type-specific overrides (minimal defaults per type).
     *
     * `config` is the one non-attribute slot. A type whose content *is* a declaration rather
     * than a value — `actions` — carries it here, so a field of that type is born with an
     * action set instead of an empty control row. Every other type leaves it out.
     */
    static inputs: Record<InputType, Partial<Record<InputAttributeType, string | number | boolean>> & {
        config?: Record<string, unknown>;
    }>;
    static attributes: Partial<Record<InputAttributeType, iAttributeProperty>>;
    static resolveMinMaxType(inputType: InputType, key: InputAttributeType): "number" | "date" | "time" | "datetime-local" | null;
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
    static buildSchemaForType(node?: iFieldSeed, options?: {
        modules?: unknown[];
    }): iAttributeSchema;
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
    static scan(type: InputType, schema: Record<string, any>, customAllowed?: string[]): {
        type: InputType;
        accepted: string[];
        rejected: string[];
        structural: string[];
        ok: boolean;
    };
    /**
     * Boolean form of {@link scan}, kept for callers that only need a pass/fail.
     *
     * @param type - Field type.
     * @param config - Field schema.
     * @param customAllowed - Extra keys this project allows.
     * @returns `true` when every non-structural key is valid for the type.
     */
    static scanUnallowedAttrs(type: InputType, config: Record<string, any>, customAllowed?: string[]): boolean;
    /**
     * @param nodes - One `{ content, config }` field node per header, in sheet order.
     * @param options - `modules` is the input module stack every control is built with.
     * @returns One descriptor per node, in the same order.
     */
    static create(nodes?: iFieldSeed[], options?: {
        modules?: unknown[];
    }): iAttributeSchema[];
}
//# sourceMappingURL=Attribute.d.ts.map