import { Builder } from "@aio-ui/base";
import { collectFormValues } from "../FormValues.js";
import { INPUT_MODULE_IDS } from "../InputModuleTypes.js";
/** Every control a set may act on, in document order. */
const CONTROL_SELECTOR = "input, select, textarea";
/** Types `readOnly` does not apply to — those lock through `disabled` instead. */
const READONLY_TYPES = new Set([
    "text", "search", "url", "tel", "email", "password", "number",
    "date", "month", "week", "time", "datetime-local",
]);
/** Controls that are never part of a set's data (buttons, hidden inputs). */
const NOT_DATA_TYPES = new Set(["button", "submit", "reset", "image", "hidden"]);
export class InputControlsBuilder extends Builder {
    builderId = "input-controls";
    name = "input-controls";
    /** Matches the host's key (`@aio-ui/input/InputControls.css`): resolution is by basename. */
    stylesheet = "./InputControls.css";
    /** Lock state per control as it was before the set locked it, restored on save. */
    #editableState = new WeakMap();
    /** Scopes already listening for Enter-to-search. */
    #searchBound = new WeakSet();
    constructor(config) {
        super();
        const defaultSelectors = {
            "@controls": { tagName: "div", className: "controls" },
            "@controls>add": { tagName: "button", className: "add", icon: "icon plus" },
            "@controls>delete": { tagName: "button", className: "delete", icon: "icon trash" },
            "@controls>save": { tagName: "button", className: "save", icon: "icon checkmark" },
            "@controls>edit": { tagName: "button", className: "edit", icon: "icon edit" },
            "@controls>copy": { tagName: "button", className: "copy", icon: "icon copy file" },
            "@controls>search": { tagName: "button", className: "search", icon: "icon search" },
            "@controls>custom": { tagName: "button", className: "custom" },
        };
        const defaultConfig = {
            themeId: "default",
            namespace: null,
            selectors: defaultSelectors,
            emit: null,
        };
        this.config = this.resolveConfig(defaultConfig, config);
    }
    /**
     * 🧱 METODE PREPARE
     */
    prepare(payload) {
        // The payload is the control spec directly; there is no `{ content }` wrapper.
        const content = payload;
        const actions = content.actions ?? [];
        const position = content.position;
        const input = content.input ?? null;
        const scope = (content.scope ?? content.parentElement ?? null);
        // 1. Buat kontainer utama pembungkus tombol aksi
        const container = this.render("@controls", position);
        container.__payload = { actions, scope, input };
        // A repeater's scope is marked while it is still unstyled: the host adds `actions`
        // right after this call, so every sibling would otherwise compute a different key.
        if (scope)
            this.#markRepeat(scope, actions);
        for (const action of actions) {
            // `remove` is an alias of `delete` and only `delete` has a selector: without the
            // alias `render()` returns nothing and `appendChild` throws — the button never
            // appeared at all.
            const key = action.type === "remove" ? "delete" : action.type;
            const Templatekey = `@controls>${key}`;
            const button = this.render(Templatekey, { scope, parentElement: scope, input, action });
            container.appendChild(button);
        }
        // 2. A control set lives inside a form: a button without an explicit type submits it.
        container.querySelectorAll("button").forEach((button) => { button.type = "button"; });
        return container;
    }
    template(typeKey, el, payload, props) {
        switch (typeKey) {
            case "@controls":
                // Only a real position becomes an attribute. `setAttribute("position", undefined)`
                // writes the string "undefined", which no `[position="left"]` / `[position="right"]`
                // rule matches — the single-control radius then has nothing to key off.
                if (typeof payload === "string" && payload)
                    el.setAttribute("position", payload);
                break;
            default:
                const button = el;
                const { action } = payload;
                button.title = "Click to " + action.label;
                button.type = "button";
                if (action?.label) {
                    button.textContent = action.label;
                }
                if (props?.icon) {
                    const icon = document.createElement("i");
                    icon.className = props.icon;
                    button.appendChild(icon);
                }
                button.__payload = payload;
                break;
        }
    }
    /**
     * 🧱 METODE INITIALIZE
     *
     * Applies the edit policy for the scope, then wires every button. Safe to call twice on
     * the same controls (a duplicated group does), because buttons are re-bound by
     * assignment and the Enter listener is bound once per scope.
     */
    initialize(controls, _payload) {
        if (!controls)
            return;
        const actions = (_payload?.content?.actions ?? controls.__payload?.actions ?? []);
        const scope = (_payload?.content?.scope
            ?? _payload?.content?.parentElement
            ?? controls.__payload?.scope
            ?? controls.__payload?.parentElement);
        if (!scope)
            return;
        this.#applyEditPolicy(scope, actions);
        controls.querySelectorAll("button").forEach((button) => {
            this.bindButton(button, controls, actions);
        });
        if (actions.some((action) => action.type === "search"))
            this.#bindEnterToSearch(scope, controls);
        // A set that declares both sides of the toggle leaves only `edit` in the row.
        this.#openOnEdit(controls, actions);
        // The delete floor is a property of the family: a clone that just landed has to wake
        // the survivor's button, and a scope rendered at the floor must start inert.
        this.#markRepeat(scope, actions);
        if (actions.some((action) => action.type === "delete" || action.type === "remove")) {
            this.#refreshDelete(this.#family(scope), { scope, controls });
        }
    }
    bindButton(button, controls, actions) {
        button.onclick = async (event) => {
            event.preventDefault();
            const payload = button.__payload;
            const scope = (payload?.scope ?? payload?.parentElement);
            const action = payload?.action;
            if (!scope || !action)
                return;
            const elements = this.#controls(scope);
            const context = {
                parentElement: scope,
                input: payload?.input ?? null,
                action: action.type,
                button,
                element: elements[0] ?? null,
                value: this.#valueOf(scope, elements),
                values: this.#query(scope),
                event,
            };
            switch (action.type) {
                case "copy":
                    await this.copy(context.values ?? context.value);
                    context.result = context.values ?? context.value;
                    break;
                case "edit":
                    this._unlock(scope);
                    context.result = true;
                    this.toggleEdit(button, controls, "save", actions);
                    break;
                case "save":
                    context.result = this.update(scope);
                    this.toggleEdit(button, controls, "edit", actions);
                    break;
                case "add":
                    context.result = this.duplicate(scope, actions);
                    break;
                case "search":
                    context.result = this.search(scope);
                    break;
                case "delete":
                case "remove":
                    context.result = this.delete(scope, action);
                    break;
            }
            this.emit(action.type, context);
            // The consumer's own handler runs last, and may be async (a search is a request).
            if (action.type === "search")
                this.#setSearching(scope, true);
            const outcome = action.onClick(scope, context);
            if (action.type === "search") {
                try {
                    await outcome;
                }
                finally {
                    this.#setSearching(scope, false);
                }
            }
        };
    }
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
    toggleEdit(currentButton, controls, actionType, actions) {
        const next = this.#pairButton(controls, actions, actionType);
        if (!next)
            return;
        const hadFocus = document.activeElement === currentButton;
        currentButton.replaceWith(next);
        this.bindButton(next, controls, actions);
        if (hadFocus)
            next.focus();
    }
    /**
     * Renders one side of an edit/save pair from the set's own declarations.
     *
     * @param controls - The set the button will join.
     * @param actions - Declared action set (already normalised).
     * @param type - Which side to build.
     * @returns The button, or `undefined` when its selector is missing.
     *
     * @summary A declared action keeps its label, icon and `onClick`; only when the set never
     * declared the other side (`actions: ["edit"]`) is a no-op stand-in built, so the swap
     * cycle still has somewhere to go.
     */
    #pairButton(controls, actions, type) {
        const payload = controls.__payload ?? {};
        const action = (actions.find((entry) => entry.type === type)
            ?? { type, label: type, onClick: () => { } });
        return this.render(`@controls>${type}`, {
            scope: payload.scope ?? payload.parentElement ?? null,
            parentElement: payload.scope ?? payload.parentElement ?? null,
            input: payload.input ?? null,
            action,
        });
    }
    /**
     * Leaves the pair on its `edit` half.
     *
     * @param controls - The set just initialised: a fresh one, or a duplicate's copy.
     * @param actions - Declared action set.
     *
     * @summary A duplicate clones the DOM as it stands, so a copy taken while the source was
     * being edited arrives with `save` only; this puts `edit` back instead of leaving the copy
     * permanently in edit mode. A set that never declared `edit` keeps whatever it has.
     */
    #openOnEdit(controls, actions) {
        if (!actions.some((action) => action.type === "edit"))
            return;
        const save = controls.querySelector("button.save");
        const edit = controls.querySelector("button.edit");
        if (edit) {
            save?.remove();
            return;
        }
        const rebuilt = this.#pairButton(controls, actions, "edit");
        if (!rebuilt)
            return;
        if (save)
            save.replaceWith(rebuilt);
        else
            controls.appendChild(rebuilt);
        this.bindButton(rebuilt, controls, actions);
    }
    emit(action, context) {
        this.config.emit?.("elementChanged", {
            builder: this.builderId,
            type: `@controls>${action}`,
            element: context.parentElement,
            data: {
                action,
                value: context.value,
                values: context.values,
                input: context.input,
                result: context.result,
            },
        });
    }
    async copy(payload) {
        try {
            const text = typeof payload === "string" ? payload : JSON.stringify(payload);
            await navigator.clipboard.writeText(text);
        }
        catch (err) {
            console.error("Gagal menyalin teks: ", err);
        }
    }
    /**
     * Clones the whole scope — a field or an entire group — under a fresh index.
     *
     * @param scope - Element to duplicate.
     * @param actions - Action set the clone receives.
     * @returns The clone.
     */
    duplicate(scope, actions) {
        const clone = scope.cloneNode(true);
        const owner = scope.parentElement ?? scope;
        const index = this.#duplicateIndex(scope, owner);
        const suffix = `-${index}`;
        const labelSuffix = ` ${index}`;
        if (clone.id)
            clone.id += suffix;
        clone.querySelectorAll("[id]").forEach((element) => { element.id += suffix; });
        clone.querySelectorAll("label").forEach((label) => {
            if (label.textContent?.trim())
                label.textContent += labelSuffix;
        });
        clone.querySelectorAll("input,select,textarea").forEach((element) => {
            if (element.name)
                element.name += suffix;
            if (element instanceof HTMLInputElement && (element.type === "checkbox" || element.type === "radio"))
                element.checked = false;
            else
                element.value = "";
        });
        scope.after(clone);
        // The clone carries the *locked* DOM, not the state the source started in. Left alone,
        // its snapshot would record "readonly/disabled" as the baseline and Edit could never
        // open it — which is exactly what a repeated group showed. The source keeps the
        // pre-lock state, so the clone is reset from it (by position) before initialising.
        const sourceControls = this.#controls(scope);
        this.#controls(clone).forEach((control, index) => {
            const state = this.#editableState.get(sourceControls[index]);
            const valueInput = this.#dropdownValue(control);
            if (state) {
                control.disabled = state.disabled;
                if (this.#supportsReadOnly(control))
                    control.readOnly = state.readonly;
                if (valueInput)
                    valueInput.disabled = state.valueDisabled ?? false;
            }
            else if (!this.#isEditable(control)) {
                control.disabled = false;
                if (this.#supportsReadOnly(control))
                    control.readOnly = false;
                if (valueInput)
                    valueInput.disabled = false;
            }
        });
        clone.removeAttribute("data-locked");
        clone.classList.remove("locked");
        clone.querySelectorAll("[data-locked]").forEach((element) => element.removeAttribute("data-locked"));
        // Marks the copy as its own instance: the cascade resolves a conditional field inside
        // the copy that owns it (`sku` → `sku-1`) instead of the first one in the document.
        clone.setAttribute("data-instance", "true");
        const clonedControls = clone.querySelector(".controls");
        const sourceButtons = scope.querySelectorAll(".controls button");
        clonedControls?.querySelectorAll("button").forEach((button, index) => {
            const sourcePayload = sourceButtons[index]?.__payload;
            if (sourcePayload) {
                // The clone's own scope, never the original's: a duplicated group acts on itself.
                button.__payload = {
                    ...sourcePayload,
                    scope: clone,
                    parentElement: clone,
                };
            }
        });
        if (clonedControls) {
            clonedControls.__payload = {
                actions,
                scope: clone,
                parentElement: clone,
                input: sourceButtons[0]?.__payload?.input ?? null,
            };
            this.initialize(clonedControls, { content: { actions, scope: clone } });
        }
        // A new scope is new DOM the engines have not seen: it copied whatever state the
        // source was in (a visible conditional field, a locked control). Announcing it lets
        // the cascade re-evaluate the copy against the copy's own (empty) values.
        clone.dispatchEvent(new CustomEvent("scopeAdded", { bubbles: true, detail: { scope: clone } }));
        // The sibling that was the last item now has company: its delete button has to come
        // back before anyone clicks it.
        this.#refreshDelete(this.#family(clone));
        return clone;
    }
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
    delete(scope, action) {
        if (scope.tagName === "FORM")
            return false;
        const repeat = Boolean(scope.dataset.repeat);
        const family = repeat ? this.#family(scope) : [scope];
        if (repeat) {
            const isSource = family[0] === scope;
            const removable = action?.removable ?? true;
            // A stale button (a sibling removed outside the set) still reaches this guard, which
            // is why the warning lives here and not only in the refresh.
            if (isSource && !removable) {
                console.warn("[input-controls] delete refused: this repeater's source row declares removable: false.");
                this.#refreshDelete(family);
                return false;
            }
        }
        scope.remove();
        if (repeat)
            this.#refreshDelete(family);
        return true;
    }
    /** Saving: every control returns to the lock state it had before `edit`, then reports. */
    update(scope) {
        this._lock(scope);
        for (const control of this.#controls(scope)) {
            control.dispatchEvent(new Event("change", { bubbles: true }));
        }
        return true;
    }
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
    search(scope) {
        const query = this.#query(scope);
        scope.dispatchEvent(new CustomEvent("search", { detail: { query, scope }, bubbles: true }));
        return query;
    }
    /**
     * Applies the edit policy for a scope.
     *
     * @param scope - Field or group.
     * @param actions - Declared action set.
     *
     * @summary Two sides of one rule: with an `edit` action the scope starts **locked**
     * (a record viewer until the visitor asks to edit), and without one it must not be
     * left locked — nothing could unlock it. "Locked by this set" is answered by the set's
     * own bookkeeping (`data-locked` + the per-control snapshot), never by looking at
     * `readonly`/`disabled`: those properties reflect to attributes, so an author's lock
     * and one of ours look identical in the DOM.
     */
    #applyEditPolicy(scope, actions) {
        if (actions.some((action) => action.type === "edit")) {
            this._lock(scope);
            return;
        }
        const lockedBySet = scope.getAttribute("data-locked") === "true"
            || this.#controls(scope).some((control) => this.#editableState.has(control));
        if (lockedBySet)
            this._unlock(scope, true);
    }
    /** Locks every control in the scope, remembering what it looked like. */
    _lock(scope) {
        for (const control of this.#controls(scope)) {
            // A field the schema marked editable is not the set's to lock.
            if (this.#isEditable(control))
                continue;
            const dropdown = this.#dropdownRoot(control);
            const valueInput = dropdown ? this.#dropdownValue(control) : null;
            if (!this.#editableState.has(control)) {
                this.#editableState.set(control, {
                    readonly: this.#supportsReadOnly(control) ? control.readOnly : false,
                    disabled: control.disabled,
                    valueDisabled: valueInput?.disabled,
                });
            }
            if (dropdown) {
                // A dropdown is two inputs and a menu: locking the visible box alone leaves the
                // popover open and the submitted value live. Disabled is the only state that
                // actually stops the interaction, and it also stops the menu from opening.
                control.disabled = true;
                if (valueInput)
                    valueInput.disabled = true;
                dropdown.setAttribute("data-locked", "true");
            }
            else if (control instanceof HTMLSelectElement) {
                // A select has no readOnly: disabled is the only lock the platform offers.
                control.disabled = true;
            }
            else if (this.#supportsReadOnly(control)) {
                control.readOnly = true;
            }
            else {
                control.disabled = true;
            }
        }
        scope.setAttribute("data-locked", "true");
        scope.classList.add("locked");
    }
    /**
     * The `div.dropdown` a control belongs to, when it is a custom dropdown.
     *
     * @param control - Control being locked or unlocked.
     * @returns The dropdown container, or `null` for a plain control.
     *
     * @summary `closest()` matches the element itself and the visible box is itself
     * `input.dropdown`, so the walk starts at the parent — otherwise the "container" would
     * be the box and the hidden value would never be found.
     */
    #dropdownRoot(control) {
        const root = control.parentElement?.closest(".dropdown") ?? null;
        return root && root !== control ? root : null;
    }
    /** The hidden input of a dropdown: the value that actually submits. */
    #dropdownValue(control) {
        return this.#dropdownRoot(control)?.querySelector("input[type='hidden']") ?? null;
    }
    /**
     * Whether the schema gave this control to the visitor permanently.
     *
     * @param control - Control being considered for a lock.
     * @returns `true` when the field (or an ancestor scope) declares `editable`.
     *
     * @summary `editable: true` outranks the edit policy: a record viewer with an `edit`
     * action may still expose one field that is always live (a comment box, a quantity).
     * `InputBuilder` writes the marker on the field wrapper, so an ancestor lookup covers a
     * group whose fields each decide for themselves.
     */
    #isEditable(control) {
        return Boolean(control.closest("[data-editable='true']"));
    }
    /**
     * Restores every control in the scope.
     *
     * @param scope - Field or group.
     * @param force - Open controls that carry no snapshot. Used when the scope is known to
     *   have been locked by this set (a duplicate, a re-render) — leaving them locked would
     *   reproduce exactly the trap the policy exists to avoid.
     */
    _unlock(scope, force = false) {
        for (const control of this.#controls(scope)) {
            const state = this.#editableState.get(control);
            const dropdown = this.#dropdownRoot(control);
            const valueInput = dropdown ? this.#dropdownValue(control) : null;
            if (state) {
                control.disabled = state.disabled;
                if (this.#supportsReadOnly(control))
                    control.readOnly = state.readonly;
                if (valueInput)
                    valueInput.disabled = state.valueDisabled ?? false;
                this.#editableState.delete(control);
            }
            else if (force) {
                control.disabled = false;
                if (this.#supportsReadOnly(control))
                    control.readOnly = false;
                if (valueInput)
                    valueInput.disabled = false;
            }
            dropdown?.removeAttribute("data-locked");
        }
        scope.removeAttribute("data-locked");
        scope.classList.remove("locked");
    }
    /** Enter inside a text control of a searching set runs the search. */
    #bindEnterToSearch(scope, controls) {
        if (this.#searchBound.has(scope))
            return;
        this.#searchBound.add(scope);
        scope.addEventListener("keydown", (event) => {
            if (event.key !== "Enter")
                return;
            const target = event.target;
            // Enter is a newline in a textarea, and a button already does its own thing.
            if (!(target instanceof HTMLElement) || target instanceof HTMLTextAreaElement)
                return;
            if (!this.#controls(scope).includes(target))
                return;
            const button = controls.querySelector("button.search");
            if (!button)
                return;
            event.preventDefault();
            button.click();
        });
    }
    #setSearching(scope, searching) {
        scope.classList.toggle("searching", searching);
        if (searching)
            scope.setAttribute("aria-busy", "true");
        else
            scope.removeAttribute("aria-busy");
    }
    /** Controls of a scope that carry data, in document order. */
    #controls(scope) {
        return Array.from(scope.querySelectorAll(CONTROL_SELECTOR))
            .filter((control) => !(control instanceof HTMLInputElement && NOT_DATA_TYPES.has(control.type)));
    }
    /** One control's value, or every value of a group, for `context.value`. */
    #valueOf(scope, elements) {
        if (elements.length === 1)
            return elements[0].value;
        const query = this.#query(scope);
        return Object.entries(query)
            .map(([key, value]) => `${key}=${Array.isArray(value) ? value.join(",") : String(value)}`)
            .join("&");
    }
    /**
     * The scope's values, in submit vocabulary.
     *
     * @param scope - Field, fieldset or form.
     * @returns Payload keyed by control name.
     */
    #query(scope) {
        const collectable = scope instanceof HTMLFormElement
            || (typeof HTMLFieldSetElement !== "undefined" && scope instanceof HTMLFieldSetElement);
        // `collectFormValues` walks the `elements` of a form/fieldset; a `.field` wrapper has
        // none, and its single control is named, so it is read directly.
        if (collectable)
            return collectFormValues(scope, { excludeEmpty: true });
        const control = this.#controls(scope)[0];
        if (!control?.name)
            return {};
        if (control instanceof HTMLInputElement && (control.type === "checkbox" || control.type === "radio")) {
            return control.checked ? { [control.name]: true } : {};
        }
        return control.value === "" ? {} : { [control.name]: control.value };
    }
    /** Whether `readOnly` actually locks this control. */
    #supportsReadOnly(control) {
        if (control instanceof HTMLSelectElement)
            return false;
        if (control instanceof HTMLTextAreaElement)
            return true;
        return READONLY_TYPES.has(control.type);
    }
    /**
     * The next free `<base>-<n>` suffix for a clone of `scope`.
     *
     * @param scope - Element being duplicated.
     * @param owner - Parent whose children share the naming space.
     * @returns The first suffix not already used by a sibling clone.
     *
     * @summary Only ids that extend the same base are counted, so `rec-1` yields
     * `rec-1-1` (not `rec-1-2`): the suffix belongs to the clone chain, not to whatever
     * number the author put at the end of the original id.
     */
    #duplicateIndex(scope, owner) {
        const base = scope.id || scope.tagName.toLowerCase();
        const taken = new Set();
        Array.from(owner.children).forEach((child) => {
            const id = child.id;
            if (!id || !id.startsWith(`${base}-`))
                return;
            const suffix = Number(id.slice(base.length + 1));
            if (Number.isInteger(suffix) && suffix >= 1)
                taken.add(suffix);
        });
        let index = 1;
        while (taken.has(index))
            index += 1;
        return index;
    }
    /**
     * Marks a repeater's scope so its siblings can be counted.
     *
     * @param scope - Field or group the set acts on.
     * @param actions - Declared action set.
     *
     * @summary Only a set with **both** `add` and `delete` is a repeater: `add` is what makes
     * a second item possible, so it is what makes a floor meaningful.
     *
     * The mark is a stable signature (`tag.class…`), never a per-instance token: siblings
     * rendered from one schema must land in one family, and a clone copies the attribute
     * with `cloneNode`. It is written in `prepare`, before the host adds its state classes
     * (`actions`, `locked`), so every sibling computes the same value. Two repeaters of the
     * same shape directly under one parent are therefore one family — the alternative would
     * be a schema-level group key, which the input layer does not have.
     */
    #markRepeat(scope, actions) {
        const isRepeater = actions.some((action) => action.type === "add")
            && actions.some((action) => action.type === "delete" || action.type === "remove");
        if (!isRepeater || scope.dataset.repeat)
            return;
        scope.dataset.repeat = `${scope.tagName.toLowerCase()}.${[...scope.classList].sort().join(".")}`;
    }
    /**
     * The scopes that share a repeater with `scope`, in document order.
     *
     * @param scope - A member of the family.
     * @returns The siblings carrying the same `data-repeat`, or `[scope]` when it is not a
     *   repeater.
     */
    #family(scope) {
        const key = scope.dataset.repeat;
        const owner = scope.parentElement;
        if (!key || !owner)
            return [scope];
        return Array.from(owner.children).filter((child) => child instanceof HTMLElement && child.dataset.repeat === key);
    }
    /** The delete button of a scope's own set, when it declares one. */
    #deleteButton(scope) {
        return scope.querySelector(":scope > .controls > button.delete, :scope > .controls > button.remove");
    }
    /**
     * The delete button of a set that is still being built.
     *
     * @param controls - The `.controls` node `initialize` is wiring.
     * @returns Its delete/remove button, or `null`.
     *
     * @summary `initialize` runs before the host appends the node, so the first state pass
     * cannot find the button under the scope yet.
     */
    #pendingDelete(controls) {
        return controls.querySelector(":scope > button.delete, :scope > button.remove");
    }
    /**
     * Makes every delete button of a family agree on which rows may go.
     *
     * @param members - Scopes of the family; a just-removed one may still be listed.
     * @param pending - The set `initialize` is wiring, not yet inside its scope.
     *
     * @summary A guard that only the clicked button knows about is not a guard: every
     * sibling has to learn the same rule. The **source** (first in the family) is always
     * blocked; clones follow the action's `removable`, and `hideOnSource` takes the source's
     * button out of the row instead of leaving it greyed out.
     */
    #refreshDelete(members, pending) {
        const family = members.filter((member) => member.isConnected);
        for (const member of family) {
            const button = this.#deleteButton(member)
                ?? (pending && member === pending.scope ? this.#pendingDelete(pending.controls) : null);
            if (!button)
                continue;
            const action = button.__payload?.action;
            const repeat = Boolean(member.dataset.repeat);
            const isSource = repeat && member === family[0];
            const locked = isSource && action?.removable === false;
            button.hidden = isSource && (action?.hideOnSource ?? false);
            button.disabled = locked;
            button.title = locked
                ? "The source row is locked (removable: false)"
                : `Click to ${action?.label ?? "delete"}`;
        }
    }
}
/**
 * Action controls module.
 *
 * A field that declares `config.actions` gets a button set beside it (add/remove/edit/
 * save/…), and a group that declares `actions` gets the same set on its `<fieldset>`.
 * The button markup and its click behaviour belong to `InputControlsBuilder`; this module
 * is the only thing that knows that, so `InputBuilder` and `FormBuilder` stay renderers.
 */
class InputControlsInputModule {
    #context;
    constructor(context) {
        this.#context = context;
    }
    /**
     * Appends the action set to a field that asked for one.
     *
     * @param wrapper - The `.field` element.
     * @param _control - The rendered control (unused: actions attach to the wrapper).
     * @param field - Resolved field payload.
     */
    decorate(wrapper, _control, field) {
        const cfg = field.config ?? {};
        if (!cfg.actions)
            return;
        const controls = this.renderActions(wrapper, {
            actions: cfg.actions,
            position: cfg.position || "right",
            input: field,
        });
        if (!controls)
            return;
        wrapper.classList.add("actions");
        wrapper.appendChild(controls);
    }
    /**
     * Builds the button set for any scope: a single field wrapper or a whole group.
     *
     * @param scope - Element the set acts on (`.field` or `<fieldset>`).
     * @param spec - Actions, position, and the field when there is one.
     * @returns The controls node, or `null` when nothing was declared.
     */
    renderActions(scope, spec) {
        // One normalisation point: groups, rows and fields all arrive here, so a bare preset
        // name (`"editor"`) is expanded before any selector is asked to render it.
        const actions = normaliseActions(spec.actions);
        if (!actions.length)
            return null;
        return new InputControlsBuilder(this.#context.builderConfig).create({
            content: {
                scope,
                parentElement: scope,
                position: spec.position || "right",
                actions,
                input: spec.input ?? null,
            },
        });
    }
}
/**
 * Composite presets: one word for a pair of buttons.
 *
 * @summary `editor` is edit+save and `repeater` is add+delete — the two pairs a control set
 * almost always needs together. Expanding them before rendering means the DOM, the pair
 * toggle and every consumer only ever see the four real types.
 */
const ACTION_PRESETS = {
    editor: ["edit", "save"],
    repeater: ["add", "delete"],
};
/** Human label for a button that was asked for by name only. */
const ACTION_LABELS = {
    add: "Add", delete: "Delete", remove: "Remove", edit: "Edit", save: "Save",
    copy: "Copy", search: "Search", custom: "Custom",
};
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
export function normaliseActions(configured) {
    if (!configured)
        return [];
    const entries = Array.isArray(configured)
        ? configured.filter(Boolean)
        : Object.entries(configured).map(([type, action]) => ({ ...action, type }));
    const resolved = [];
    for (const entry of entries) {
        // A bare name is a preset: built-in behaviour, label from the type, no callback.
        const preset = typeof entry === "string"
            ? (ACTION_PRESETS[entry] ?? [entry]).map((type) => ({ type, label: ACTION_LABELS[type] ?? type, onClick: () => { } }))
            : (ACTION_PRESETS[entry.type] ?? [entry.type]).map((type) => ({ ...entry, type, label: entry.label ?? ACTION_LABELS[type] ?? type }));
        resolved.push(...preset);
    }
    return resolved;
}
/**
 * Action controls module definition.
 *
 * @example
 * // registered by INPUT_MODULE_DEFINITIONS; drop it and `config.actions` silently renders nothing
 */
export const inputControlsInputModule = {
    id: INPUT_MODULE_IDS.controls,
    load: (context) => new InputControlsInputModule(context),
};
//# sourceMappingURL=InputControls.js.map