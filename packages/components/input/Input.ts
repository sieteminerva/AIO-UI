import type { iElementProperty, iBuilderConfig, iBuilderRegistry, iContentContract } from "@aio-ui/core";
import { Builder } from "@aio-ui/base";
import type { iModuleDefinition } from "@aio-ui/module-loader";
import { Skeleton } from "@aio-ui/skeleton";
import { ModuleLoader } from "@aio-ui/module-loader";
import { inputTypeOf } from "./FieldTypes";
import {
  type iInputAdapter,
  type iInputModuleContext,
  type InputModuleItem,
  type InputModulePreset,
} from "./InputRegistry";
import { INPUT_MODULE_IDS } from "./InputModuleTypes";
import { reportMissing } from "./Missing";
import type { InputSchema, iInputConfigNode, iInputField } from "./InputSchema";

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
] as const;

/** Attributes whose presence is the value: `required`, `disabled`, `multiple`, … */
const BOOLEAN_ATTRIBUTES = new Set(["required", "disabled", "readonly", "multiple"]);

export type InputType =
  | "text"
  | "textarea"
  | "number"
  | "select"
  | "dropdown"
  | "picker"
  | "actions"
  | "checkbox"
  | "radio"
  | "range"
  | "date"
  | "time"
  | "datetime-local"
  | "file"
  | "color"
  | "email"
  | "password"
  | "url"
  | "tel"
  | "hidden";

export interface iBasicSelectOption {
  value?: string;
  label?: string;
  icon?: string;
  /**
   * Swatch colour for a `picker` in `view: "swatch"`.
   *
   * Read by `PickerBuilder` as `--picker-swatch` on the cell, so a swatch option can show a
   * colour the label cannot say. Ignored by every other view and by a plain `<select>`.
   */
  color?: string;
}

export type InputElementType =
  | "@field"
  | "@field>label"
  | "@field>input"
  | "@field>textarea"
  | "@field>select"
  | "@field>select>option"
  | "@field>checkbox"
  | "@field>radio"
  | "@field>toggle"
  | "@field>file"
  | "@field>error"
  | "@field>info";

export type iActionType =
  | "add" | "remove" | "delete" | "save" | "edit" | "copy" | "search" | "custom"
  // Composite presets: "editor" is edit+save, "repeater" is add+delete. They exist so a
  // schema can ask for the pair with one word (`actions: ["editor"]`); normalisation
  // expands them into the two buttons and the pair toggle, so nothing downstream sees them.
  | "editor" | "repeater";

export interface iInputActionDefinition {
  type: iActionType;
  selector?: Record<string, iElementProperty>;
  label?: string;
  icon?: string;
  /**
   * `delete` only, on a repeater's **source** row (index 0). Default `true`.
   *
   * `false` locks that row: the record the clones copy stays. Clones are always free to
   * go — this flag never applies to them.
   */
  removable?: boolean;
  /**
   * `delete` only: hide the source's button (a `removable: false` lock is what makes it
   * inert; hiding is a look, not a rule).
   */
  hideOnSource?: boolean;
  onClick: iInputActionHandler;
}

export interface iInputActionContext {
  parentElement: HTMLElement;
  /** Field the set belongs to; `null` when the scope is a group. */
  input: iInputField | null;
  action: iActionType;
  button: HTMLButtonElement;
  /** First control of the scope, kept for single-field sets. */
  element: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null;
  /** One control's value, or a serialized summary for a group. */
  value: string;
  /** Every value of the scope, in submit vocabulary (that is what `search` reports). */
  values?: Record<string, any>;
  event: MouseEvent;
  result?: unknown;
}

export type iInputActionHandler = (parentElement: HTMLElement, context: iInputActionContext) => void | Promise<void>;

/** Builder-level configuration for the input layer. */
export interface iInputConfig extends iBuilderConfig<InputElementType> {
  /**
   * Optional loader that supplies the input sub-modules (dropdown, file, controls, popover).
   *
   * Leave it `null` and the field is a plain labelled control: the modules are an
   * enhancement, never a precondition. Pass `INPUT_MODULE_DEFINITIONS` from
   * `@aio-ui/input` (the `INPUT_MODULE_DEFINITIONS` export) for the full layer, a subset, or your own module. Since
   * `0.3.0` nothing is compiled into the package root, so an omitted option costs no
   * bytes rather than silently shipping all four.
   *
   * An already-resolved `iInputAdapter[]` is accepted too: that is what a parent
   * component hands over when its own manifest resolved the set — the field must not
   * load or unload modules its host owns.
   */
  modules?: ModuleLoader<iInputModuleContext, iInputAdapter> | InputModulePreset | null;
}

export class InputBuilder extends Builder<InputElementType, iInputConfig> {
  readonly builderId: keyof iBuilderRegistry = "input";
  readonly name: keyof iBuilderRegistry = "input";
  readonly stylesheet: string = "./Input.css";

  /** One field node. The vocabulary itself lives in `InputSchema.ts`; this stays open. */
  static readonly contract: iContentContract = {
    schema: {
      t: "record",
      open: true,
      of: {
        type: { t: "string" },
        id: { t: "string" },
        name: { t: "string" },
        label: { t: "string" },
        placeholder: { t: "string" },
        required: { t: "boolean" },
      },
    },
    example: { type: "text", id: "email", label: "Email address", placeholder: "you@example.com" },
  };

  #input: iInputField = { type: "text" };

  /** Owns the lifecycle of the input sub-modules: one resolve per prepare. */
  readonly #loader: ModuleLoader<iInputModuleContext, iInputAdapter> | null;

  /** Adapters that arrived already live (host-owned); never loaded or disposed here. */
  readonly #live: iInputAdapter[];

  /**
   * Ids the preset declared — definitions carry one, live adapters do not.
   *
   * This is the only signal a capability with no distinguishable hook has (the popover only
   * *decorates*): a preset built from definitions names every module it contains, and an
   * empty set means an empty preset. A preset of live adapters names none, and then the
   * builder stays quiet rather than guess — the host that handed instances owns them.
   */
  readonly #declared: Set<string>;

  /** Capabilities already reported, so one schema prints one line per kind. */
  #warned = new Set<string>();

  /** Modules resolved for the field being built. */
  #modules: iInputAdapter[] = [];

  /** Host data a module may read: the builder's own configuration. */
  get #moduleContext(): iInputModuleContext {
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
  #offers(hook: "getFiles" | "renderActions"): boolean {
    return this.#modules.some((module) => typeof (module as any)[hook] === "function");
  }

  /**
   * Whether the popover module is provably absent.
   *
   * The popover is the one capability with no hook to sniff — it only *decorates*. So the
   * answer comes from the ids the preset declared: nothing declared and nothing live means
   * there is nothing to attach a popover with. A host that hands live adapters is not
   * second-guessed; the builder cannot see inside an instance.
   */
  get #popoverMissing(): boolean {
    if (this.#declared.size > 0) return !this.#declared.has(INPUT_MODULE_IDS.popover);
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
  #missing(
    capability: string,
    module: string,
    fix: string,
    consequence: string,
    severity: "warn" | "error" = "warn"
  ): void {
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
  protected loading(): HTMLElement {
    return Skeleton.create({
      shape: "stack",
      children: [
        { shape: "line", width: "25%" },
        { shape: "bone", height: "2.75rem" },
      ],
    });
  }

  constructor(config: Partial<iInputConfig> = {}) {
    super();

    const defaultSelectors = {
      "@field": { tagName: "div", className: "field" },
      "@field>label": { tagName: "label" },
      "@field>input": { tagName: "input" },
      "@field>textarea": { tagName: "textarea" },
      "@field>select": { tagName: "select" },
      "@field>select>option": { tagName: "option" },
      "@field>checkbox": { tagName: "input", type: "checkbox" as InputType, wrapper: ".switch.control" },
      "@field>radio": { tagName: "input", type: "radio" as InputType },
      // Same switch shell for a radio: `config.style: "toggle"` opts into it.
      "@field>toggle": { tagName: "input", wrapper: ".switch.control" },
      "@field>file": { tagName: "input", type: "file" as InputType },
      "@field>error": { tagName: "small", className: "error" },
      "@field>info": { tagName: "small", className: "info" }
    };

    const defaultConfig: Required<iInputConfig> = {
      themeId: "default",
      selectors: defaultSelectors as any,
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
      const preset = this.config.modules as InputModuleItem[];
      const definitions = preset.filter((item) => typeof (item as any).load === "function");
      this.#live = preset.filter((item) => typeof (item as any).load !== "function") as iInputAdapter[];
      this.#loader = definitions.length
        ? new ModuleLoader<iInputModuleContext, iInputAdapter>("input", definitions as any)
        : null;
    } else {
      this.#live = [];
      this.#loader = this.config.modules
        ?? new ModuleLoader<iInputModuleContext, iInputAdapter>("input", []);
    }

    this.#declared = new Set(this.#loader?.ids() ?? []);

  }

  private resolvePayload(schema: Record<string, any>): iInputField {
    const inputObj = (schema ?? {}) as Record<string, any>;

    // 🆔 The label's `for` and the control's `id` share one value.
    const elementId = this._sanitizeId(inputObj.id || `input-${Math.random().toString(36).slice(2, 10)}`);

    // Content defaults only. Behaviour defaults live in the config bag, because that is the
    // only place the schema writes them.
    const payload: iInputField = {
      type: "text",
      placeholder: "",
      ...inputObj,
      id: elementId,
      label: inputObj.label ?? "",
      config: { attributes: [], useLabel: true, ...(inputObj.config ?? {}) },
    };

    // 🧩 `options` accepts a bare string as `{ value, label }` — the declared content type
    // says so, and the select template reads one shape. Choices live here and nowhere else.
    if (Array.isArray(payload.options)) {
      payload.options = payload.options.map((option) =>
        typeof option === "string" ? { value: option, label: option } : option
      );
    }

    if (!payload.placeholder && payload.label) {
      payload.placeholder = (payload.type === "select" || payload.type === "textarea")
        ? `Pilih ${payload.label}`
        : `Isi ${payload.label}`;
    }

    return payload;
  }



  /**
   * The one door.
   *
   * `{ content, config }` is folded into the flat payload the pipeline reads — content keys
   * at the top level, behaviour in one bag. Those are the only two blocks a field has, so
   * the schema is the only shape this builder accepts.
   *
   * @param schema - `InputSchema<T>` when the type is known, the whole union otherwise.
   * @returns The field's root element.
   */
  public create<const T extends InputType>(schema?: InputSchema<T>): HTMLElement;
  /**
   * Assignability only: `Builder.create` takes the base shape, and a narrower parameter
   * cannot override it. Nothing in this package calls it — the fold above is the door.
   *
   * @internal
   */
  public create(schema?: { content?: any; config?: Partial<iInputConfig> }): HTMLElement;
  public create(schema?: any): HTMLElement {
    const content = schema?.content;
    const config = schema?.config;
    return super.create({ content: { ...content, config } });
  }

  public prepare(inputObj: Partial<iInputField> & Record<string, any>, _config?: Required<iInputConfig> | undefined): HTMLElement | Record<string, any | HTMLElement> {

    this.#input = this.resolvePayload(inputObj);

    const cfg: iInputConfigNode = this.#input.config ?? {};
    const definition = inputTypeOf(this.#input.type);

    // 🧩 Modules are resolved once per prepare, after the payload exists: a module decides
    // from the field what it wants to do, and `InputBuilder` never learns their names.
    this.#modules = [...(this.#loader?.resolveAll(this.#moduleContext) ?? []), ...this.#live];

    // 🚪 A declared action set is a promise of buttons. Without the controls module the
    // field itself would render perfectly and the buttons would simply never exist — that
    // is a hole, not a plainer control, so this one throws at the declaration site.
    if (cfg.actions && !this.#offers("renderActions")) {
      this.#missing(
        "actions",
        INPUT_MODULE_IDS.controls,
        "@aio-ui/input/controls (inputControlsInputModule)",
        "the declared action buttons would never render.",
        "error"
      );
    }

    const wrapper = this.render("@field", this.#input)!;

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
    const labelText = this.#input.label;
    const isToggle = this.#input.type === "checkbox" || this.#input.type === "radio";
    const labelPosition =
      cfg.position
      ?? (isToggle ? "right" : undefined);

    const label = labelText && cfg.useLabel !== false
      ? this.render("@field>label", {
        text: labelText,
        position: isChoiceGroup ? "top" : labelPosition,
        // A group has no single control to point at; the caption names the group instead.
        id: isChoiceGroup ? undefined : this.#input.id,
      }) as HTMLElement
      : null;

    if (label) wrapper.appendChild(label);

    // 🧩 Precedence: a registered module may own any type (that is how a project swaps in
    // its own picker), then the field-type matrix picks the selector, then the plain
    // `<input>` fallback. `InputBuilder` never names a adapter.
    let inputEl: (HTMLInputElement | HTMLSelectElement | HTMLElement | null) = null;

    if (isChoiceGroup) {
      this.renderChoices(wrapper);
    } else {
      for (const module of this.#modules) {
        const rendered = module.renderControl?.(this.#input, this.#moduleContext);
        if (rendered) {
          inputEl = rendered;
          break;
        }
      }
    }

    // A toggle renders the same switch shell a checkbox has. `view: "toggle"` is the
    // opt-in for a radio, whose default is the native dot: a group of options should not
    // turn into a wall of switches unless the schema asks for it.
    const controlKey: InputElementType | null = !isChoiceGroup && this.#input.type === "radio" && this.#isToggleView()
      ? "@field>toggle"
      : definition.control;

    if (!isChoiceGroup && !inputEl && controlKey) {
      inputEl = this.render(controlKey, this.#input) as HTMLElement;
    }

    if (!isChoiceGroup && !inputEl) {
      // A matrix row with no control of its own is a type owned by a module (`dropdown`,
      // `picker`). A module may only *enhance* a field, never be the only way it exists:
      // without the module the same options render as a native `<select>` — plainer, not a
      // hole. That is what makes "no modules by default" an honest default instead of a trap.
      inputEl = controlKey
        ? this.render("@field>input", this.#input)!
        : this.render("@field>select", this.#input)!;

      // Falling back is the degradation made visible: this branch only runs when the type
      // has no control of its own, so the fact is reported from here instead of being
      // inferred later. The message names the type that was asked for, not one module.
      if (!controlKey) {
        const type = String(this.#input.type ?? "");
        const module = (INPUT_MODULE_IDS as Record<string, string>)[type] ?? type;

        this.#missing(
          type,
          module,
          `@aio-ui/input/${module} (${module}InputModule)`,
          "the field falls back to a native select over the same options."
        );
      }
    }

    // 📎 An uploader is additive: the field still opens the file dialog, it just stops
    // there. `onFileSelected` never fires and nothing is previewed, so say it once.
    if (this.#input.type === "file" && !this.#offers("getFiles")) {
      this.#missing(
        "file",
        INPUT_MODULE_IDS.file,
        "@aio-ui/input/file-uploader (fileUploaderInputModule)",
        "the field is a plain file input: no preview, and onFileSelected never fires."
      );
    }

    if (inputEl) {
      this.applyAttributes(inputEl, this.#input);
    }

    // 🕒 `config.loading` replaces the old `className: "loading"` shortcut: one boolean,
    // one class on the control, whatever control the type resolved to.
    if (inputEl && cfg.loading === true) inputEl.classList.add("loading");

    // `editable: true` is a promise to the visitor: this field stays writable even when the
    // control set locks everything else (its buttons are `edit`/`save`). The marker goes on
    // the wrapper because that is the scope a set reads, and it is one attribute instead of
    // every control kind having to know about the lock.
    if (cfg.editable === true) {
      wrapper.setAttribute("data-editable", "true");
    }

    // Dropdown mencetak root `.dropdown` sendiri, jadi root itu yang ditempel apa adanya.
    if (inputEl) inputEl.__outer ? wrapper.appendChild(inputEl.__outer) : wrapper.appendChild(inputEl);

    // 🧩 Decoration runs after the control is in the wrapper: the uploader, the action set
    // and the popover all need a mounted control (and, for the uploader, its `.field`).
    if (inputEl) {
      for (const module of this.#modules) module.decorate?.(wrapper, inputEl, this.#input, this.#moduleContext);

      // Purely additive: the control is untouched and `config.popover` is simply not
      // attached. Worth a line, never worth a throw.
      if (cfg.popover && this.#popoverMissing) {
        this.#missing(
          "popover",
          INPUT_MODULE_IDS.popover,
          "@aio-ui/input (popoverInputModule)",
          "config.popover is ignored and no anchor attaches to the control."
        );
      }
    }

    // 🚦 Host validation state: `data-error` on the wrapper (the scope a skin reads) plus
    // one `@field>error` child when the schema carried a message. No `Error` object — the
    // host passes `error.message`.
    if (cfg.error) {
      wrapper.setAttribute("data-error", typeof cfg.error === "string" ? cfg.error : "true");
      if (typeof cfg.error === "string") wrapper.appendChild(this.render("@field>error", cfg.error)!);
    }

    // Help text is always the last child: appended after the control and after every
    // module decoration (uploader/action set/popover), so it never sits between the label
    // and the control.
    if (this.#input.info) {
      const info = this.render("@field>info", this.#input.info)!;
      wrapper.appendChild(info);
    }

    return wrapper!;
  }


  protected template(typeKey: InputElementType, el: HTMLElement, payload?: any): void {
    if (!payload) return;

    const cfg = payload.config; // ini merujuk ke 'payload' utuh yang dioper dari case @field

    switch (typeKey) {
      case "@field":
        // Cosmetic wrapper attributes. `className` left the schema: a per-field skin is
        // this instance's `config.selectors["@field"].className`.
        if (cfg.display) el.setAttribute("data-display", cfg.display);
        break;

      case "@field>label":
        // A choice group's caption names the group; there is no control to point at.
        if (payload.id) el.setAttribute("for", payload.id);
        el.textContent = payload.text;
        if (payload.position) el.setAttribute("data-position", payload.position)
        break;

      case "@field>checkbox":
        (el as HTMLInputElement).type = "checkbox";
        const slider = document.createElement("div");
        slider.className = "slider";
        slider.setAttribute("data-shape", "round")
        el.__outer.appendChild(slider);
        break;

      case "@field>input":
        (el as HTMLInputElement).type = payload.type || "text";
        (el as HTMLInputElement).autocomplete = "off";
        break;

      case "@field>textarea":
        // `rows` is a constraint (`iInputConstraint.rows`), defaulted here.
        (el as HTMLTextAreaElement).rows = cfg.rows ?? 3;
        break;

      case "@field>select":
        // Buat baris placeholder awal untuk select
        const placeholderOpt = document.createElement("option");
        placeholderOpt.value = "";
        placeholderOpt.textContent = payload.placeholder || "Pilih Opsi...";
        placeholderOpt.disabled = true;
        placeholderOpt.selected = true;
        el.appendChild(placeholderOpt);

        // Render barisan opsi anak secara rekursif/looping
        const options = (payload.options || []) as any[];
        for (const option of options) {
          const optionEl = this.render("@field>select>option", { option, parentValue: payload.value })!;
          el.appendChild(optionEl);
          if (placeholderOpt.selected && optionEl.hasAttribute("selected")) {
            placeholderOpt.selected = false;
          }
        }
        break;

      case "@field>radio":
        (el as HTMLInputElement).type = payload.type;
        // Only a field that asks for it starts checked; a radio group is several fields,
        // so defaulting to true put every option in the group in the checked state.
        (el as HTMLInputElement).checked = payload.checked === true;
        break;

      case "@field>toggle": {
        // Serves checkbox and radio: the type comes from the field, the shell is shared.
        const toggle = el as HTMLInputElement;
        toggle.type = payload.type === "radio" ? "radio" : "checkbox";
        toggle.checked = payload.checked === true;

        const slider = document.createElement("div");
        slider.className = "slider";
        slider.setAttribute("data-shape", payload.config?.shape ?? "round");
        el.__outer.appendChild(slider);
        break;
      }

      case "@field>file":
        (el as HTMLInputElement).type = "file";
        el.setAttribute("data-uploader", "");
        // `view` is the one visual word for every type; `list` is the uploader default.
        el.setAttribute("data-view", `${cfg.view || "list"}`);
        el.setAttribute("data-render-thumbnail", `${cfg.thumbnail ?? "true"}`);
        // Opt-in, and only declarative: this field's file is tabular, so whatever owns
        // tables may preview it. The input layer still never parses anything itself.
        if (cfg.csv === true) el.setAttribute("data-uploader-csv", "");
        break;

      case "@field>select>option":
        const option = el as HTMLOptionElement;
        option.value = payload.option.value;
        option.textContent = payload.option.label;
        if (payload.parentValue !== undefined && String(payload.option.value) === String(payload.parentValue)) {
          option.setAttribute("selected", "selected");
        }
        break;

      case "@field>error":
        el.textContent = payload;
        break;

      case "@field>info":
        el.textContent = payload;
        break;
    }
  }

  public initialize(_el?: HTMLElement, _payload?: any, _context?: any): void {
    const popover = this.#input.config?.popover;
    if (!popover || !_el) return;
    // The popover module already anchors an element; this path only covers a host that
    // built the field without it, so the content still arrives somewhere.
    if (_el.querySelector("[popover]")) return;
    if (popover instanceof HTMLElement) _el.appendChild(popover);
    else if (typeof popover === "string") _el.insertAdjacentHTML("beforeend", popover);
  }

  /**
   * A `radio`/`checkbox` field given `options` is a group: one control per option, all on
   * the field's `name`. `radio` is exclusive by nature, `checkbox` takes several — the
   * field type decides, exactly the way `select` decides through its own type.
   *
   * The caption above the group names it, and every control owns a
   * `<label class="choice-item">`, so the text next to a dot is clickable too.
   */
  private renderChoices(wrapper: HTMLElement): void {
    const field = this.#input;
    const cfg = field.config ?? {};
    const name = String(field.name || field.id);
    const chosen = this.choiceValues();

    wrapper.classList.add("choice");
    wrapper.setAttribute("role", field.type === "radio" ? "radiogroup" : "group");

    (field.options ?? []).forEach((option, index) => {
      const value = typeof option === "string" ? option : String(option.value ?? "");
      const caption = typeof option === "string" ? option : (option.label ?? value);
      const id = `${field.id}-${index}`;

      const input = this.render("@field>radio", { type: field.type, checked: chosen.includes(value) }) as HTMLInputElement;
      input.type = field.type === "checkbox" ? "checkbox" : "radio";
      input.id = id;
      input.name = name;
      input.value = value;
      input.checked = chosen.includes(value);
      if (cfg.disabled) input.disabled = true;
      if (cfg.required) input.required = true;

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
  private choiceValues(): string[] {
    const value = this.#input.value;
    if (Array.isArray(value)) return value.map(String);
    if (typeof value === "string") return value ? value.split(",").map((entry) => entry.trim()).filter(Boolean) : [];
    if (value === undefined || value === null) return [];
    return [String(value)];
  }

  /**
   * Whether this field asked for the switch shell (`config.view: "toggle"`).
   *
   * `view` replaced the old `style` because `style` collided with `HTMLElement.style` and
   * meant a different thing per type.
   */
  #isToggleView(): boolean {
    const bag = (this.#input.config ?? {}) as Record<string, any>;
    return String(bag.view ?? "").toLowerCase() === "toggle";
  }

  /**
   * Applies a schema to a live control.
   *
   * The registry decides what a type may carry: an attribute that means nothing for the
   * type is dropped instead of landing in the markup (`maxlength` on a `checkbox`, a
   * `min` on a `file`). `id` and `name` are structural and always set; `config.attributes`
   * is applied last, so an escape hatch still wins.
   */
  private applyAttributes(el: HTMLInputElement | HTMLSelectElement | HTMLElement, payload: any) {
    const cfg = payload.config ?? {};
    const allowed = inputTypeOf(payload.type).attributes;

    el.id = payload.id;
    (el as HTMLInputElement).name = payload.name ? String(payload.name) : payload.id;

    const read = (key: string) => payload[key] !== undefined ? payload[key] : cfg[key];

    for (const key of ATTRIBUTE_ORDER) {
      if (!allowed.includes(key)) continue;

      const value = read(key);

      if (key === "value") {
        // The live property after options exist — cascade re-renders rely on this.
        if (value !== undefined && value !== null && "value" in el) {
          (el as HTMLInputElement | HTMLSelectElement).value = String(value);
        }
        continue;
      }

      if (key === "checked") {
        if (el instanceof HTMLInputElement) el.checked = Boolean(value);
        continue;
      }

      if (BOOLEAN_ATTRIBUTES.has(key)) {
        // Presence is the value: `false` must leave the attribute absent, never render
        // an empty or `"false"` one — an attribute that exists is still an enabled toggle.
        if (!value) continue;
        el.setAttribute(key, "");
        if (key in el) (el as any)[key] = true;
        continue;
      }

      if (value === undefined || value === null || value === "") continue;
      el.setAttribute(key, String(value));
    }

    // A number input without a step snaps to integers; the browser default is 1.
    if (el instanceof HTMLInputElement && el.type === "number" && !el.getAttribute("step")) {
      el.step = "any";
    }

    if (el instanceof HTMLSelectElement) watchPickerPlacement(el);

    // Tancapkan custom inline attributes bawaan array schema Anda (jika ada)
    if (cfg?.attributes && Array.isArray(cfg.attributes)) {
      cfg.attributes.forEach((attr: any) => {
        if (attr?.name) {
          if (typeof attr.value === "function" && (attr.name as string).startsWith("on")) {
            (el as any)[attr.name as string] = attr.value;
          } else {
            el.setAttribute(attr.name, attr.value);
          }
        }
      });
    }

  }


  private _sanitizeId(value: string): string {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

}

/**
 * The native picker's SIDE is chosen by the platform, but its size is readable:
 * `getComputedStyle(select, "::picker(select)").height` is the laid-out picker box (Chrome
 * resolves it even before it opens, because it is used to size the popup). With the real
 * height there is no estimate left — the comparison below is the same one the platform
 * makes (fits below, else above), so the mirrored seam lands on the right edge at every
 * scroll position. The result is written as `data-placement`, the same contract `.menu`
 * uses, and read by `select[data-placement="above"]` in `Input.css`.
 */
const watchedPickers = new WeakSet<HTMLSelectElement>();

function pickerHeight(select: HTMLSelectElement): number {
  const measured = parseFloat(getComputedStyle(select, "::picker(select)").height);
  if (Number.isFinite(measured) && measured > 0) return measured;
  // Fallback for engines that do not resolve it: mirror `--input-popup-max-height`
  // (4 rows + 10px) with the item padding from §5.3.
  const style = getComputedStyle(select);
  const size = parseFloat(style.fontSize) || 16;
  const row = size * (1.6 + 0.62);
  return Math.min(Math.max(select.options.length, 1) * row, size * 1.6 * 4 + 10);
}

function watchPickerPlacement(select: HTMLSelectElement): void {
  if (watchedPickers.has(select)) return;
  watchedPickers.add(select);

  const place = () => {
    const box = select.getBoundingClientRect();
    const spaceBelow = window.innerHeight - box.bottom;
    select.dataset.placement = spaceBelow < pickerHeight(select) && box.top > spaceBelow ? "above" : "below";
  };

  // Before the platform opens it: a pointer click, the keys that open it, or focus.
  select.addEventListener("pointerdown", place, { passive: true });
  select.addEventListener("focus", place);
  select.addEventListener("keydown", (event) => {
    const key = (event as KeyboardEvent).key;
    if (key === " " || key === "Enter" || key.startsWith("Arrow")) place();
  });
}

/**
 * Popover module.
 *
 * `config.popover` may be an HTML string or a ready element (a date picker, a search
 * panel). The focus/blur plumbing and the value sync-back live here, not in
 * `InputBuilder`, so the field renderer never learns about popovers.
 */
class PopoverInputModule implements iInputAdapter {
  /**
   * Attaches the configured popover to the control.
   *
   * @param _wrapper - The `.field` element.
   * @param control - The rendered control, used as the anchor.
   * @param field - Resolved field payload.
   */
  public decorate(_wrapper: HTMLElement, control: HTMLElement, field: any): void {
    const target = field.config?.popover;
    if (!target) return;

    const popover = typeof target === "string" ? this.#parse(target) : target;
    if (!popover) return;

    if (!popover.hasAttribute("popover")) popover.setAttribute("popover", "manual");

    // Same shared, field-scoped anchor name the CSS expects (see `.field` in Input.css).
    const anchor = "--field-dropdown-anchor";
    if (anchor) {
      control.style.setProperty("anchor-name", anchor);
      popover.style.setProperty("position-anchor", anchor);
    }

    // Sits right after the control, so the anchor connection is also a DOM neighbour.
    control.insertAdjacentElement("afterend", popover);

    control.addEventListener("focus", () => {
      if (typeof HTMLElement.prototype.showPopover === "function") popover.showPopover();
    });

    control.addEventListener("blur", (event: FocusEvent) => {
      const related = event.relatedTarget as HTMLElement | null;

      // Focus moved *into* the popover: wait for it to leave before closing, and copy
      // whatever the user picked back into the control — that is the whole point of
      // attaching a picker to a field.
      if (related && popover.contains(related)) {
        popover.addEventListener("blur", (inner: FocusEvent) => {
          const next = inner.relatedTarget as HTMLElement | null;
          if (popover.contains(next) || next === control) return;

          const innerField = popover.querySelector("textarea, input, select") as HTMLInputElement | null;
          if (innerField && "value" in control) {
            (control as HTMLInputElement).value = innerField.value;
            control.dispatchEvent(new Event("input", { bubbles: true }));
            control.dispatchEvent(new Event("change", { bubbles: true }));
          }

          if (typeof HTMLElement.prototype.hidePopover === "function") popover.hidePopover();
        }, { capture: true, once: true });
        return;
      }

      if (typeof HTMLElement.prototype.hidePopover === "function") popover.hidePopover();
    });
  }

  /** Parses an HTML string into a single element. */
  #parse(html: string): HTMLElement | null {
    const holder = document.createElement("div");
    holder.innerHTML = html.trim();
    return holder.firstElementChild as HTMLElement | null;
  }
}

/**
 * Popover module definition.
 *
 * @example
 * // registered by INPUT_MODULE_DEFINITIONS; drop it and `config.popover` is ignored
 */
export const popoverInputModule: iModuleDefinition<iInputModuleContext, iInputAdapter> = {
  id: INPUT_MODULE_IDS.popover,
  load: () => new PopoverInputModule(),
};
