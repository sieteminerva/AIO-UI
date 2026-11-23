import { Builder } from "@aio-ui/base";
import { Skeleton } from "@aio-ui/skeleton";
import { ModuleLoader } from "@aio-ui/module-loader";
import { inputTypeOf } from "./FieldTypes.js";
import {} from "./InputRegistry.js";
import { INPUT_MODULE_IDS } from "./InputModuleTypes.js";
import { reportMissing } from "./Missing.js";
/**
 * Attributes `applyAttributes` knows how to map, in application order.
 *
 * A key not listed here is not applied by the builder (it can still be passed through
 * `config.attributes`), and a key listed here is still dropped for a type whose registry
 * row does not accept it.
 */
const ATTRIBUTE_ORDER = [
    "value",
    "checked",
    "placeholder",
    "required",
    "disabled",
    "readonly",
    "multiple",
    "accept",
    "min",
    "max",
    "minlength",
    "maxlength",
    "step",
    "pattern",
    "rows",
    "cols",
    "autocomplete",
    "inputmode",
];
/** Attributes whose presence is the value: `required`, `disabled`, `multiple`, … */
const BOOLEAN_ATTRIBUTES = new Set(["required", "disabled", "readonly", "multiple"]);
export class InputBuilder extends Builder {
    builderId = "input";
    name = "input";
    stylesheet = "./input.css";
    /** One field node. The full field vocabulary belongs to `iBasicInputNode`, so it stays open. */
    static contract = {
        schema: {
            t: "record",
            open: true,
            of: {
                type: { t: "string" },
                id: { t: "string" },
                name: { t: "string" },
                title: { t: "string" },
                label: { t: "string" },
                placeholder: { t: "string" },
                required: { t: "boolean" },
            },
        },
        example: { type: "text", id: "email", title: "Email address", placeholder: "you@example.com" },
    };
    #input = {};
    /** Owns the lifecycle of the input sub-modules: one resolve per prepare. */
    #loader;
    /** Adapters that arrived already live (host-owned); never loaded or disposed here. */
    #live;
    /**
     * Ids the preset declared — definitions carry one, live adapters do not.
     *
     * This is the only signal a capability with no distinguishable hook has (the popover only
     * *decorates*): a preset built from definitions names every module it contains, and an
     * empty set means an empty preset. A preset of live adapters names none, and then the
     * builder stays quiet rather than guess — the host that handed instances owns them.
     */
    #declared;
    /** Capabilities already reported, so one schema prints one line per kind. */
    #warned = new Set();
    /** Modules resolved for the field being built. */
    #modules = [];
    /** Host data a module may read: the builder's own configuration. */
    get #moduleContext() {
        return { builderConfig: this.config };
    }
    /**
     * Whether any resolved adapter implements a hook.
     *
     * Method sniffing, never id matching: a project may ship its own uploader under another
     * id, and "can this set read files" is the question — not "is the built-in one here".
     *
     * @param hook - Adapter method that *is* the capability.
     * @returns `true` when at least one module offers it.
     */
    #offers(hook) {
        return this.#modules.some((module) => typeof module[hook] === "function");
    }
    /**
     * Whether the popover module is provably absent.
     *
     * The popover is the one capability with no hook to sniff — it only *decorates*. So the
     * answer comes from the ids the preset declared: nothing declared and nothing live means
     * there is nothing to attach a popover with. A host that hands live adapters is not
     * second-guessed; the builder cannot see inside an instance.
     */
    get #popoverMissing() {
        if (this.#declared.size > 0)
            return !this.#declared.has(INPUT_MODULE_IDS.popover);
        return this.#modules.length === 0;
    }
    /**
     * Reports one degraded capability through `Missing.ts`.
     *
     * @param capability - Schema vocabulary (`dropdown`, `file`, `actions`, `popover`).
     * @param module - Module id that would have provided it.
     * @param fix - Subpath and export that fix it.
     * @param consequence - What the visitor gets instead, in one clause.
     * @param severity - `warn` (default) keeps the field, `error` throws.
     * @throws {Error} For `severity: "error"`, with the module id and the fix in the message.
     */
    #missing(capability, module, fix, consequence, severity = "warn") {
        reportMissing({ capability, module, fix, consequence, severity }, {
            owner: "InputBuilder",
            seen: this.#warned,
            emit: this.config.emit,
        });
    }
    /**
     * 🪶 LOADING MOCKUP — one label and one control box, drawn with the mandatory
     * `@aio-ui/skeleton` primitive. The control type (select, textarea, switch) changes the
     * skin, never the box: a field reserves one line plus one control.
     */
    loading() {
        return Skeleton.create({
            shape: "stack",
            children: [
                { shape: "line", width: "25%" },
                { shape: "bone", height: "2.75rem" },
            ],
        });
    }
    constructor(config = {}) {
        super();
        const defaultSelectors = {
            "@field": { tagName: "div", className: "field" },
            "@field>label": { tagName: "label" },
            "@field>input": { tagName: "input" },
            "@field>textarea": { tagName: "textarea" },
            "@field>select": { tagName: "select" },
            "@field>select>option": { tagName: "option" },
            "@field>checkbox": { tagName: "input", type: "checkbox", wrapper: ".switch.control" },
            "@field>radio": { tagName: "input", type: "radio" },
            // Same switch shell for a radio: `config.style: "toggle"` opts into it.
            "@field>toggle": { tagName: "input", wrapper: ".switch.control" },
            "@field>file": { tagName: "input", type: "file" },
            "@field>info": { tagName: "small", className: "info" }
        };
        const defaultConfig = {
            themeId: "default",
            selectors: defaultSelectors,
            namespace: null,
            emit: () => { },
            modules: null,
        };
        this.config = this.resolveConfig(defaultConfig, config);
        // Two ways to get an adapter set: a loader (host-owned lifecycle), a preset whose
        // definitions this builder loads itself while live adapters are used as-is, or nothing
        // at all — and "nothing" is a complete field, just a plainer one. The definitions the
        // layer ships with live behind `@aio-ui/input/modules`, so no import here may name them.
        if (Array.isArray(this.config.modules)) {
            const preset = this.config.modules;
            const definitions = preset.filter((item) => typeof item.load === "function");
            this.#live = preset.filter((item) => typeof item.load !== "function");
            this.#loader = definitions.length
                ? new ModuleLoader("input", definitions)
                : null;
        }
        else {
            this.#live = [];
            this.#loader = this.config.modules
                ?? new ModuleLoader("input", []);
        }
        this.#declared = new Set(this.#loader?.ids() ?? []);
    }
    resolvePayload(inputObj) {
        // Generate ID unik generik untuk keperluan atribut 'id' dan 'for' pada label
        const elementId = this._sanitizeId(inputObj.id || inputObj.title || `input-${Math.random().toString(36).slice(2, 10)}`);
        const defaultPayload = {
            type: "text",
            id: elementId,
            title: "",
            placeholder: "",
            rows: 3,
            multiple: false,
            disabled: false,
            readonly: false,
            required: false,
            checked: false,
            config: {
                attributes: [],
                style: "",
                className: "",
                useLabel: true,
                display: undefined,
                createEventListener: false,
                popover: undefined,
                actions: undefined
            }
        };
        const inputPayload = { ...defaultPayload, ...inputObj, config: { ...defaultPayload.config, ...inputObj.config } };
        if (!inputPayload.placeholder && inputPayload.title) {
            inputPayload.placeholder = (inputPayload.type === "select" || inputPayload.type === "textarea") ? `Pilih ${inputPayload.title}` : `Isi ${inputPayload.title}`;
        }
        // 🧩 `options` is the field's own list — the one place `select`, `dropdown`, `picker`
        // and a `radio`/`checkbox` group read from. The legacy `config.options` spelling is
        // still lifted onto the field so an older sheet keeps working, but nothing downstream
        // ever reads the config bag for choices again.
        const rawOptions = inputObj.options ?? inputObj.config?.options;
        if (Array.isArray(rawOptions)) {
            inputPayload.options = rawOptions.map((option) => typeof option === "string" ? { value: option, label: option } : option);
        }
        return inputPayload;
    }
    prepare(inputObj, _config) {
        this.#input = this.resolvePayload(inputObj);
        const cfg = this.#input.config;
        const definition = inputTypeOf(this.#input.type);
        // 🧩 Modules are resolved once per prepare, after the payload exists: a module decides
        // from the field what it wants to do, and `InputBuilder` never learns their names.
        this.#modules = [...(this.#loader?.resolveAll(this.#moduleContext) ?? []), ...this.#live];
        // 🚪 A declared action set is a promise of buttons. Without the controls module the
        // field itself would render perfectly and the buttons would simply never exist — that
        // is a hole, not a plainer control, so this one throws at the declaration site.
        if (cfg?.actions && !this.#offers("renderActions")) {
            this.#missing("actions", INPUT_MODULE_IDS.controls, "@aio-ui/input/controls (inputControlsInputModule)", "the declared action buttons would never render.", "error");
        }
        const wrapper = this.render("@field", this.#input);
        // 🔘 A `radio`/`checkbox` field given `options` is a group, not one lone control: every
        // option becomes a control on the field's `name`, and `value` marks the chosen one(s).
        // `radio` stays exclusive, `checkbox` takes several — the type decides, the same way
        // a `select` decides through `multiple`. With no `options` the plain single control
        // below is still what renders, so nothing that worked before changes shape.
        const choices = Array.isArray(this.#input.options) ? this.#input.options : [];
        const isChoiceGroup = (this.#input.type === "radio" || this.#input.type === "checkbox") && choices.length > 0;
        // 🏷️ One label, one place. `useLabel` is an on/off switch (default on, set in
        // `resolvePayload`); `position` is a CSS hint (`data-position`), never an order change.
        //
        // Both spellings are accepted — `{ position }` on the field and `config.position` —
        // because the schema shape predates the config bag. A toggle (`checkbox`/`radio`) has
        // no sensible "above the control" layout, so it defaults to `right`; without any
        // `data-position` its `:has(> label[…])` grid rules never match and the label stacks
        // on top of the switch.
        const labelText = this.#input.label ?? this.#input.title;
        const isToggle = this.#input.type === "checkbox" || this.#input.type === "radio";
        const labelPosition = this.#input.config?.position
            ?? this.#input.position
            ?? (isToggle ? "right" : undefined);
        const label = labelText && this.#input.config?.useLabel !== false
            ? this.render("@field>label", {
                text: labelText,
                position: isChoiceGroup ? "top" : labelPosition,
                // A group has no single control to point at; the caption names the group instead.
                id: isChoiceGroup ? undefined : this.#input.id,
            })
            : null;
        if (label)
            wrapper.appendChild(label);
        // 🧩 Precedence: a registered module may own any type (that is how a project swaps in
        // its own picker), then the field-type matrix picks the selector, then the plain
        // `<input>` fallback. `InputBuilder` never names a adapter.
        let inputEl = null;
        if (isChoiceGroup) {
            this.renderChoices(wrapper);
        }
        else {
            for (const module of this.#modules) {
                const rendered = module.renderControl?.(this.#input, this.#moduleContext);
                if (rendered) {
                    inputEl = rendered;
                    break;
                }
            }
        }
        // A toggle renders the same switch shell a checkbox has. `style: "toggle"` is the
        // opt-in for a radio, whose default is the native dot: a group of options should not
        // turn into a wall of switches unless the schema asks for it.
        const controlKey = !isChoiceGroup && this.#input.type === "radio" && this.#isToggleStyle()
            ? "@field>toggle"
            : definition.control;
        if (!isChoiceGroup && !inputEl && controlKey) {
            inputEl = this.render(controlKey, this.#input);
        }
        if (!isChoiceGroup && !inputEl) {
            // A matrix row with no control of its own is a type owned by a module (`dropdown`,
            // `picker`). A module may only *enhance* a field, never be the only way it exists:
            // without the module the same options render as a native `<select>` — plainer, not a
            // hole. That is what makes "no modules by default" an honest default instead of a trap.
            inputEl = controlKey
                ? this.render("@field>input", this.#input)
                : this.render("@field>select", this.#input);
            // Falling back is the degradation made visible: this branch only runs when the type
            // has no control of its own, so the fact is reported from here instead of being
            // inferred later. The message names the type that was asked for, not one module.
            if (!controlKey) {
                const type = String(this.#input.type ?? "");
                const module = INPUT_MODULE_IDS[type] ?? type;
                this.#missing(type, module, `@aio-ui/input/${module} (${module}InputModule)`, "the field falls back to a native select over the same options.");
            }
            if ((this.#input.type === "text" || this.#input.type === "number") && (cfg?.className === "loading")) {
                inputEl.classList.add("loading");
            }
        }
        // 📎 An uploader is additive: the field still opens the file dialog, it just stops
        // there. `onFileSelected` never fires and nothing is previewed, so say it once.
        if (this.#input.type === "file" && !this.#offers("getFiles")) {
            this.#missing("file", INPUT_MODULE_IDS.file, "@aio-ui/input/file-uploader (fileUploaderInputModule)", "the field is a plain file input: no preview, and onFileSelected never fires.");
        }
        if (inputEl) {
            this.applyAttributes(inputEl, this.#input);
        }
        // `editable: true` is a promise to the visitor: this field stays writable even when the
        // control set locks everything else (its buttons are `edit`/`save`). The marker goes on
        // the wrapper because that is the scope a set reads, and it is one attribute instead of
        // every control kind having to know about the lock.
        if (this.#input.editable === true || cfg?.editable === true) {
            wrapper.setAttribute("data-editable", "true");
        }
        // C. Render Info Tambahan di bagian bawah jika ada
        if (this.#input.info) {
            const info = this.render("@field>info", this.#input.info);
            wrapper.appendChild(info);
        }
        // Dropdown mencetak root `.dropdown` sendiri, jadi root itu yang ditempel apa adanya.
        if (inputEl)
            inputEl.__outer ? wrapper.appendChild(inputEl.__outer) : wrapper.appendChild(inputEl);
        // 🧩 Decoration runs after the control is in the wrapper: the uploader, the action set
        // and the popover all need a mounted control (and, for the uploader, its `.field`).
        if (inputEl) {
            for (const module of this.#modules)
                module.decorate?.(wrapper, inputEl, this.#input, this.#moduleContext);
            // Purely additive: the control is untouched and `config.popover` is simply not
            // attached. Worth a line, never worth a throw.
            if (cfg?.popover && this.#popoverMissing) {
                this.#missing("popover", INPUT_MODULE_IDS.popover, "@aio-ui/input (popoverInputModule)", "config.popover is ignored and no anchor attaches to the control.");
            }
        }
        return wrapper;
    }
    template(typeKey, el, payload) {
        if (!payload)
            return;
        const cfg = payload.config; // ini merujuk ke 'payload' utuh yang dioper dari case @field
        switch (typeKey) {
            case "@field":
                // console.log(el)
                // Gaya kelas & atribut kosmetik wrapper utama
                if (payload?.className && payload?.className !== "loading") {
                    el.classList.add(...payload.className.split(" ").filter(Boolean));
                }
                if (payload?.display)
                    el.setAttribute("data-display", payload.display ?? cfg.display);
                break;
            case "@field>label":
                // A choice group's caption names the group; there is no control to point at.
                if (payload.id)
                    el.setAttribute("for", payload.id);
                el.textContent = payload.text;
                if (payload.position)
                    el.setAttribute("data-position", payload.position);
                break;
            case "@field>checkbox":
                el.type = "checkbox";
                const slider = document.createElement("div");
                slider.className = "slider";
                slider.setAttribute("data-shape", "round");
                el.__outer.appendChild(slider);
                break;
            case "@field>input":
                el.type = payload.type || "text";
                el.autocomplete = "off";
                break;
            case "@field>textarea":
                el.rows = payload.rows;
                break;
            case "@field>select":
                if (cfg?.className === "loading")
                    el.classList.add("loading");
                // Buat baris placeholder awal untuk select
                const placeholderOpt = document.createElement("option");
                placeholderOpt.value = "";
                placeholderOpt.textContent = payload.placeholder || "Pilih Opsi...";
                placeholderOpt.disabled = true;
                placeholderOpt.selected = true;
                el.appendChild(placeholderOpt);
                // Render barisan opsi anak secara rekursif/looping
                const options = (payload.options || []);
                for (const option of options) {
                    const optionEl = this.render("@field>select>option", { option, parentValue: payload.value });
                    el.appendChild(optionEl);
                    if (placeholderOpt.selected && optionEl.hasAttribute("selected")) {
                        placeholderOpt.selected = false;
                    }
                }
                break;
            case "@field>radio":
                el.type = payload.type;
                // Only a field that asks for it starts checked; a radio group is several fields,
                // so defaulting to true put every option in the group in the checked state.
                el.checked = payload.checked === true;
                break;
            case "@field>toggle": {
                // Serves checkbox and radio: the type comes from the field, the shell is shared.
                const toggle = el;
                toggle.type = payload.type === "radio" ? "radio" : "checkbox";
                toggle.checked = payload.checked === true;
                const slider = document.createElement("div");
                slider.className = "slider";
                slider.setAttribute("data-shape", payload.config?.shape ?? "round");
                el.__outer.appendChild(slider);
                break;
            }
            case "@field>file":
                el.type = "file";
                el.setAttribute("data-uploader", "");
                el.setAttribute("data-view", `${cfg?.view || "list"}`);
                el.setAttribute("data-render-thumbnail", `${cfg?.thumbnail ?? "true"}`);
                // Opt-in, and only declarative: this field's file is tabular, so whatever owns
                // tables may preview it. The input layer still never parses anything itself.
                if (cfg?.csv === true)
                    el.setAttribute("data-uploader-csv", "");
                break;
            case "@field>select>option":
                const option = el;
                option.value = payload.option.value;
                option.textContent = payload.option.label;
                if (payload.parentValue !== undefined && String(payload.option.value) === String(payload.parentValue)) {
                    option.setAttribute("selected", "selected");
                }
                break;
            case "@field>info":
                el.textContent = payload;
                break;
        }
    }
    initialize(_el, _payload, _context) {
        if (this.#input.config?.popover) {
            if (this.#input.config?.popover instanceof HTMLElement) {
                _el?.appendChild(this.#input.config?.popover);
            }
            else if (typeof this.#input.config?.popover === "string") {
                _el?.insertAdjacentHTML("beforeend", this.#input.config?.popover);
            }
        }
    }
    /**
     * A `radio`/`checkbox` field given `options` is a group: one control per option, all on
     * the field's `name`. `radio` is exclusive by nature, `checkbox` takes several — the
     * field type decides, exactly the way `select` decides through its own type.
     *
     * The caption above the group names it, and every control owns a
     * `<label class="choice-item">`, so the text next to a dot is clickable too.
     */
    renderChoices(wrapper) {
        const field = this.#input;
        const name = String(field.name || field.id);
        const chosen = this.choiceValues();
        wrapper.classList.add("choice");
        wrapper.setAttribute("role", field.type === "radio" ? "radiogroup" : "group");
        (field.options ?? []).forEach((option, index) => {
            const value = typeof option === "string" ? option : String(option.value ?? "");
            const caption = typeof option === "string" ? option : (option.label ?? value);
            const id = `${field.id}-${index}`;
            const input = this.render("@field>radio", { type: field.type, checked: chosen.includes(value) });
            input.type = field.type === "checkbox" ? "checkbox" : "radio";
            input.id = id;
            input.name = name;
            input.value = value;
            input.checked = chosen.includes(value);
            if (field.disabled)
                input.disabled = true;
            if (field.required)
                input.required = true;
            const item = document.createElement("label");
            item.className = "choice-item";
            item.setAttribute("for", id);
            const text = document.createElement("span");
            text.className = "choice-label";
            text.textContent = caption;
            item.append(input, text);
            wrapper.appendChild(item);
        });
    }
    /** The chosen values of a choice group: an array, a comma string, or one scalar. */
    choiceValues() {
        const value = this.#input.value;
        if (Array.isArray(value))
            return value.map(String);
        if (typeof value === "string")
            return value ? value.split(",").map((entry) => entry.trim()).filter(Boolean) : [];
        if (value === undefined || value === null || value === "")
            return [];
        return [String(value)];
    }
    /** Whether this field asked for the switch shell (`config.style: "toggle"`). */
    #isToggleStyle() {
        const style = String(this.#input.config?.style ?? "").toLowerCase();
        return style === "toggle";
    }
    /**
     * Applies a schema to a live control.
     *
     * The registry decides what a type may carry: an attribute that means nothing for the
     * type is dropped instead of landing in the markup (`maxlength` on a `checkbox`, a
     * `min` on a `file`). `id` and `name` are structural and always set; `config.attributes`
     * is applied last, so an escape hatch still wins.
     */
    applyAttributes(el, payload) {
        const cfg = payload.config ?? {};
        const allowed = inputTypeOf(payload.type).attributes;
        el.id = payload.id;
        el.name = payload.name ? String(payload.name) : payload.id;
        const read = (key) => payload[key] !== undefined ? payload[key] : cfg[key];
        for (const key of ATTRIBUTE_ORDER) {
            if (!allowed.includes(key))
                continue;
            const value = read(key);
            if (key === "value") {
                // The live property after options exist — cascade re-renders rely on this.
                if (value !== undefined && value !== null && "value" in el) {
                    el.value = String(value);
                }
                continue;
            }
            if (key === "checked") {
                if (el instanceof HTMLInputElement)
                    el.checked = Boolean(value);
                continue;
            }
            if (BOOLEAN_ATTRIBUTES.has(key)) {
                // Presence is the value: `false` must leave the attribute absent, never render
                // an empty or `"false"` one — an attribute that exists is still an enabled toggle.
                if (!value)
                    continue;
                el.setAttribute(key, "");
                if (key in el)
                    el[key] = true;
                continue;
            }
            if (value === undefined || value === null || value === "")
                continue;
            el.setAttribute(key, String(value));
        }
        // A number input without a step snaps to integers; the browser default is 1.
        if (el instanceof HTMLInputElement && el.type === "number" && !el.getAttribute("step")) {
            el.step = "any";
        }
        // Tancapkan custom inline attributes bawaan array schema Anda (jika ada)
        if (cfg?.attributes && Array.isArray(cfg.attributes)) {
            cfg.attributes.forEach((attr) => {
                if (attr?.name) {
                    if (typeof attr.value === "function" && attr.name.startsWith("on")) {
                        el[attr.name] = attr.value;
                    }
                    else {
                        el.setAttribute(attr.name, attr.value);
                    }
                }
            });
        }
    }
    _sanitizeId(value) {
        return value
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9_-]+/g, "-")
            .replace(/^-+|-+$/g, "");
    }
}
/**
 * Popover module.
 *
 * `config.popover` may be an HTML string or a ready element (a date picker, a search
 * panel). The focus/blur plumbing and the value sync-back live here, not in
 * `InputBuilder`, so the field renderer never learns about popovers.
 */
class PopoverInputModule {
    /**
     * Attaches the configured popover to the control.
     *
     * @param _wrapper - The `.field` element.
     * @param control - The rendered control, used as the anchor.
     * @param field - Resolved field payload.
     */
    decorate(_wrapper, control, field) {
        const target = field.config?.popover;
        if (!target)
            return;
        const popover = typeof target === "string" ? this.#parse(target) : target;
        if (!popover)
            return;
        if (!popover.hasAttribute("popover"))
            popover.setAttribute("popover", "manual");
        const anchor = control.id ? `--anchor-${control.id}` : null;
        if (anchor) {
            control.style.setProperty("anchor-name", anchor);
            popover.style.setProperty("position-anchor", anchor);
        }
        // Sits right after the control, so the anchor connection is also a DOM neighbour.
        control.insertAdjacentElement("afterend", popover);
        control.addEventListener("focus", () => {
            if (typeof HTMLElement.prototype.showPopover === "function")
                popover.showPopover();
        });
        control.addEventListener("blur", (event) => {
            const related = event.relatedTarget;
            // Focus moved *into* the popover: wait for it to leave before closing, and copy
            // whatever the user picked back into the control — that is the whole point of
            // attaching a picker to a field.
            if (related && popover.contains(related)) {
                popover.addEventListener("blur", (inner) => {
                    const next = inner.relatedTarget;
                    if (popover.contains(next) || next === control)
                        return;
                    const innerField = popover.querySelector("textarea, input, select");
                    if (innerField && "value" in control) {
                        control.value = innerField.value;
                        control.dispatchEvent(new Event("input", { bubbles: true }));
                        control.dispatchEvent(new Event("change", { bubbles: true }));
                    }
                    if (typeof HTMLElement.prototype.hidePopover === "function")
                        popover.hidePopover();
                }, { capture: true, once: true });
                return;
            }
            if (typeof HTMLElement.prototype.hidePopover === "function")
                popover.hidePopover();
        });
    }
    /** Parses an HTML string into a single element. */
    #parse(html) {
        const holder = document.createElement("div");
        holder.innerHTML = html.trim();
        return holder.firstElementChild;
    }
}
/**
 * Popover module definition.
 *
 * @example
 * // registered by INPUT_MODULE_DEFINITIONS; drop it and `config.popover` is ignored
 */
export const popoverInputModule = {
    id: INPUT_MODULE_IDS.popover,
    load: () => new PopoverInputModule(),
};
//# sourceMappingURL=Input.js.map