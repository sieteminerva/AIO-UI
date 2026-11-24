/**
 * 🧩 INPUT ADAPTER — interactive control set for `InputBuilder` and for a group of inputs.
 *
 * Owned by the input layer, not by `FormBuilder`: a field that declares actions — and a
 * group (`<fieldset>`) that declares them — delegates its button set and click behaviour
 * to this builder.
 *
 * The unit of work is a **scope**, not a control: a `.field` wrapper (one control) or a
 * `<fieldset class="form-group">` (many). Everything below reads the scope, so `edit`
 * locks every control in the group, `search` collects every value in it, and `add`
 * duplicates the group rather than a single input. `<form>` is deliberately not a scope:
 * a control set that can delete or clone the whole form is a footgun, not a feature.
 */
import type { iActionType, iInputActionContext, iInputActionDefinition } from "../Input";
import type { iInputField } from "../InputSchema";
import type { iBuilderConfig, iElementProperty } from "@aio-ui/core";
import { Builder } from "@aio-ui/base";
import type { iModuleDefinition } from "@aio-ui/module-loader";
import { type iInputAdapter, type iInputModuleContext } from "../InputModuleTypes";
export type InputControlsElementType = "@controls" | "@controls>add" | "@controls>delete" | "@controls>save" | "@controls>edit" | "@controls>copy" | "@controls>search" | "@controls>custom";
/** Payload handed to the controls builder by whoever owns the scope. */
export interface iInputControlsConfig {
    position?: "left" | "right";
    actions: iInputActionDefinition[];
    input?: iInputField | null;
    /** Element the set acts on: a `.field` wrapper or a `<fieldset>` group. */
    scope?: HTMLElement | null;
    /** Legacy name for `scope`; still honoured so old call sites keep working. */
    parentElement?: HTMLElement | null;
}
export declare class InputControlsBuilder extends Builder<InputControlsElementType> {
    #private;
    readonly builderId = "input-controls";
    readonly name = "input-controls";
    /** Matches the host's key (`@aio-ui/input/controls.css`): resolution is by basename. */
    readonly stylesheet: string;
    constructor(config: iBuilderConfig<InputControlsElementType>);
    /**
     * 🧱 METODE PREPARE
     */
    prepare(payload: any): HTMLElement;
    protected template(typeKey: InputControlsElementType, el: HTMLElement, payload?: any, props?: iElementProperty): void;
    /**
     * 🧱 METODE INITIALIZE
     *
     * Applies the edit policy for the scope, then wires every button. Safe to call twice on
     * the same controls (a duplicated group does), because buttons are re-bound by
     * assignment and the Enter listener is bound once per scope.
     */
    initialize(controls: HTMLElement, _payload?: any): void;
    private bindButton;
    /**
     * Swaps one half of the edit/save pair for the other.
     *
     * @param currentButton - The button just pressed.
     * @param controls - The set it belongs to.
     * @param actionType - The side to show next.
     * @param actions - Declared action set.
     *
     * @summary The pair is **one button that changes identity**: the idle half is detached and
     * rebuilt on demand. Hiding it in place would leave a `display: none` node that the sheet's
     * `:first-child`/`:last-child` border rules still count, so the visible button would take
     * a square edge meant for its absent neighbour; a detached node also carries a stale
     * `__payload` that a duplicate copies by index.
     */
    protected toggleEdit(currentButton: HTMLButtonElement, controls: HTMLElement, actionType: iActionType, actions: iInputActionDefinition[]): void;
    protected emit(action: iActionType, context: iInputActionContext): void;
    protected copy(payload: string | HTMLElement | Object): Promise<void>;
    /**
     * Clones the whole scope — a field or an entire group — under a fresh index.
     *
     * @param scope - Element to duplicate.
     * @param actions - Action set the clone receives.
     * @returns The clone.
     */
    protected duplicate(scope: HTMLElement, actions: iInputActionDefinition[]): HTMLElement;
    /**
     * Removes a scope, unless it is the source of a repeater or the set is fixed.
     *
     * @param scope - Field or group.
     * @param action - The `delete` definition, which may set `removable`.
     * @returns `false` when the scope is a form, the repeater's source, or a fixed set.
     *
     * @summary Never a whole form: a control set edits records, it does not delete the
     * container the visitor is filling in.
     *
     * A **repeater** (a set that declares `add` too) has one **source** instance — the row
     * the first Add was clicked from, index 0 of the family. It carries the record the clones
     * copy, so `removable: false` locks it. Clones are always free; the flag never applies to
     * them. Outside a repeater the old remove-the-scope behaviour stays.
     */
    protected delete(scope: HTMLElement, action?: iInputActionDefinition): boolean;
    /** Saving: every control returns to the lock state it had before `edit`, then reports. */
    protected update(scope: HTMLElement): boolean;
    /**
     * Collects the scope's values and tells everyone who listens.
     *
     * @param scope - Field or group the set belongs to.
     * @returns The query, already handed to `onClick` as `context.result`.
     *
     * @summary `search` is a **read**, not a submit: it takes the same vocabulary a submit
     * would (`collectFormValues`), dispatches a bubbling `search` CustomEvent on the scope
     * so the owning page can react without knowing this builder, and leaves the payload in
     * `context.result` for `onClick`. The scope is marked `searching` (and `aria-busy`) while
     * `onClick`'s promise is pending, so an async query shows a state without this layer
     * knowing what a request is.
     */
    protected search(scope: HTMLElement): Record<string, any>;
    /** Locks every control in the scope, remembering what it looked like. */
    private _lock;
    /**
     * Restores every control in the scope.
     *
     * @param scope - Field or group.
     * @param force - Open controls that carry no snapshot. Used when the scope is known to
     *   have been locked by this set (a duplicate, a re-render) — leaving them locked would
     *   reproduce exactly the trap the policy exists to avoid.
     */
    private _unlock;
}
/**
 * Accepts both action shapes — an array (mixed names and objects) or `{ [type]: definition }`.
 *
 * @param configured - Declared actions.
 * @returns Array form, with composite presets expanded and `type` filled in.
 *
 * @example
 * normaliseActions(["editor", { type: "copy", label: "Copy", onClick }])
 * // → edit, save, copy
 */
export declare function normaliseActions(configured: any): Array<Record<string, any> & {
    type: string;
}>;
/**
 * Action controls module definition.
 *
 * @example
 * // registered by INPUT_MODULE_DEFINITIONS; drop it and `config.actions` silently renders nothing
 */
export declare const inputControlsInputModule: iModuleDefinition<iInputModuleContext, iInputAdapter>;
//# sourceMappingURL=InputControls.d.ts.map