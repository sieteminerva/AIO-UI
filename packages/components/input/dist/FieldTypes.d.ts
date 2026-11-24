/**
 * Field types — one row per type.
 *
 * A field type answers three questions, and they are answered here once instead of
 * three times in three places (the render `switch`, the attribute applier, and the
 * schema validator in `Attribute.ts`):
 *
 * 1. **which selector renders the control** — `@field>textarea`, `@field>checkbox`, …
 * 2. **which DOM attributes the type accepts** — the matrix, so an attribute that means
 *    nothing for a type is dropped instead of silently landing in the markup;
 * 3. **which keys are structural** — consumed by the builder (`group`/`condition` belong
 *    to the form engine), so they never become attributes.
 *
 * Adding a field type is one row here plus, when it needs custom markup, one selector.
 */
import type { InputType, InputElementType } from "./Input";
/**
 * One row of the registry.
 *
 * `control` is the selector key the builder renders; `null` means another builder owns
 * the markup (`dropdown` is rendered by `DropdownBuilder`, not by an `@field>` selector).
 */
export interface iInputTypeDefinition {
    /** Selector key used to render the control, or `null` when a sibling builder owns it. */
    readonly control: InputElementType | null;
    /** DOM attributes this type accepts, in no particular order. */
    readonly attributes: readonly string[];
}
/**
 * Keys the builder itself consumes and must never forward to the DOM.
 *
 * Identity and text (`id`, `name`, `label`, `placeholder`, `info`) live in `content`;
 * every behaviour key lives in the `config` bag and is listed here so the attribute scan
 * classifies it before the matrix is asked. A key that no reader owns is simply absent —
 * the scan then reports it as rejected, which is the signal a stale consumer needs.
 */
export declare const INPUT_STRUCTURAL_KEYS: readonly string[];
/** The matrix. Every `InputType` must appear, so a new type cannot be half-added. */
export declare const INPUT_TYPE_REGISTRY: Record<InputType, iInputTypeDefinition>;
/** The `text` row: the fallback for an unknown or missing type. */
export declare function inputTypeOf(type?: string | null): iInputTypeDefinition;
/** Whether a DOM attribute is meaningful for this field type. */
export declare function isInputAttributeAllowed(type: string | null | undefined, attribute: string): boolean;
/**
 * Splits a schema into the attributes a type accepts and the ones it does not.
 *
 * Used by `Attribute.ts` as the validator, and the reason the matrix lives in one place:
 * the renderer and the validator can never disagree about what a type may carry.
 *
 * @param type - Field type (`"checkbox"`, `"number"`, …).
 * @param schema - Keys to check; structural keys are ignored, not reported.
 * @returns `accepted` and `rejected` attribute names, plus the structural keys found.
 */
export declare function scanInputAttributes(type: string | null | undefined, schema: Record<string, any>): {
    accepted: string[];
    rejected: string[];
    structural: string[];
};
//# sourceMappingURL=FieldTypes.d.ts.map