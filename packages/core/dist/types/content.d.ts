/**
 * Content item shapes.
 *
 * Data contracts for the item arrays that a component accepts. Kept in `core`
 * while `iBuilderRegistry` still declares every component by name; they move to
 * their owning component package once the registry becomes augmentable.
 */
/**
 * One entry of a selector map, and the single vocabulary for "properties of an element".
 *
 * This used to be two types — `iElementProperty` (structure) and `iActionProperty`
 * (structure + label/href/onClick) — that were the same shape in practice, so every
 * consumer wrote a union or `any` and the checker learned nothing. One type, superset of
 * both, is what the renderer actually accepts.
 */
export interface iElementProperty {
    /** Element identity. */
    id?: string;
    className?: string;
    tagName?: string;
    /** Raw HTML attributes. */
    attrs?: Record<string, string>;
    /** Same attributes in list form, for callers that build them dynamically. */
    attributes?: Array<{
        name: string;
        value: string;
    }>;
    isArray?: boolean;
    /** Wrapper chain, e.g. `.switch.control` or `div.col>span`. */
    wrapper?: string;
    icon?: string;
    textContent?: string;
    /** Content commonly carried by an action/CTA node. */
    label?: string;
    href?: string;
    src?: string;
    isActive?: boolean;
    isRoot?: boolean;
    type?: "button" | "submit" | "reset" | InputType | InputControlsType;
    onClick?: (event: MouseEvent) => void;
}
export interface iHeaderProperty extends iElementProperty {
    title?: string;
    eyebrow?: string;
    description?: string;
}
export interface iBuilderContent extends iElementProperty {
    title?: string;
    description?: string;
    image?: string;
    actions?: iElementProperty[];
    category?: string;
}
export interface iCardProperty extends iElementProperty {
    header: string;
    body: {
        name: string;
        className: string;
    }[];
    action?: iElementProperty;
}
export interface iElementAnimation {
    in?: string;
    out?: string;
}
export type InputType = "text" | "textarea" | "number" | "select" | "dropdown" | "checkbox" | "radio" | "range" | "date" | "time" | "datetime-local" | "file" | "color" | "email" | "password" | "url" | "tel" | "hidden";
export type InputControlsType = "add" | "remove" | "edit" | "save";
export interface InputBuilderSelectorOption {
    value?: string;
    label?: string;
    icon?: string;
}
/**
 * One node of a content contract.
 *
 * A contract is a *declaration*, not code: the shape of the payload a builder accepts,
 * written next to the builder that owns it. `@aio-ui/base` reads it in `create()` and
 * reports issues instead of guessing — and `inspect()` surfaces the same issues.
 *
 * The spec is deliberately small. A facet (`items`, `fields`, `structure`) is a fact about
 * the component, so it is **derived** from `t` rather than written into a document.
 */
export type iContentSpec = {
    t: "string";
    req?: boolean;
} | {
    t: "number";
    req?: boolean;
} | {
    t: "boolean";
    req?: boolean;
} | {
    t: "enum";
    of: readonly (string | number)[];
    req?: boolean;
}
/** An object. `of` names the fields it may carry; `open` allows extra keys silently. */
 | {
    t: "record";
    of?: Record<string, iContentSpec>;
    req?: boolean;
    open?: boolean;
}
/**
 * An array. `single` accepts one lone record and wraps it, which is how most
 * list-shaped payloads stay usable with a single item.
 */
 | {
    t: "list";
    of?: iContentSpec;
    min?: number;
    max?: number;
    req?: boolean;
    single?: boolean;
}
/**
 * Several shapes, one payload. `check()` takes the **first** branch that fits and
 * normalises with it, so `list.single` still wraps. Nothing fits → one `INPUT_SHAPE`
 * issue listing the branches. Put `element` before `record`: an element *is* an object.
 */
 | {
    t: "union";
    of: readonly iContentSpec[];
    req?: boolean;
}
/** A live DOM element (`HTMLElement`), passed through untouched. */
 | {
    t: "element";
    req?: boolean;
}
/** No shape check at all — for payloads the builder passes through (nodes, DOM, specs). */
 | {
    t: "any";
    req?: boolean;
};
/**
 * What one builder accepts as `schema.content`.
 *
 * - `schema`  the declared shape.
 * - `example` the smallest legal payload; CI validates it, so it is a runnable sample.
 * - `legacy`  old spellings still accepted, each normalised and reported as a warning.
 *   A legacy entry never becomes required, and a value is never dropped silently.
 */
export interface iContentContract {
    schema: iContentSpec;
    example: unknown;
    legacy?: readonly {
        from: string;
        to: string;
        reason: string;
    }[];
}
/** One problem found while normalising a payload. Never thrown — always collected. */
export interface iContentIssue {
    code: "INPUT_SHAPE" | "INPUT_MISSING_FIELD" | "INPUT_WRONG_TYPE" | "INPUT_UNKNOWN_FIELD" | "INPUT_BAD_ENUM" | "INPUT_TOO_FEW" | "INPUT_TOO_MANY" | "INPUT_LEGACY_USED";
    /** Always rooted at the payload: `content[2].title`. */
    path: string;
    expected: string;
    received: string;
    allowed?: readonly (string | number)[];
    message: string;
    severity: "error" | "warning";
}
//# sourceMappingURL=content.d.ts.map