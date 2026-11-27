import { InputBuilder } from "./Input.js";
import { scanInputAttributes } from "./FieldTypes.js";
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
    static inputs = {
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
    static attributes = {
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
    static resolveMinMaxType(inputType, key) {
        if (!["min", "max"].includes(key))
            return null;
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
    static buildSchemaForType(node = { content: {} }, options = {}) {
        const content = { ...(node.content || {}) };
        const config = { ...(node.config || {}) };
        const type = (content.type || "text");
        content.type = type;
        // Every control is built through the caller's module stack, so a `dropdown` is a real
        // dropdown (not a native select) the first time it renders.
        const build = () => new InputBuilder({ modules: options.modules });
        const merged = {
            ...baseInputConfig,
            ...this.inputs[type],
            ...content,
            ...config,
            type,
        };
        const id = String(content.id || content.name || content.label || type);
        const slug = id.toLowerCase().replace(/[\s_]+/g, "-");
        const attributes = {};
        // now generate attribute editors
        for (const attrKey in this.attributes) {
            const key = attrKey;
            const schemaDef = this.attributes[key];
            if (!schemaDef)
                continue;
            // skip attributes irrelevant to this type
            if (!(key in merged))
                continue;
            const value = merged[key];
            let attrType = schemaDef.type;
            // special case: min/max type resolution
            if (["min", "max"].includes(key)) {
                const resolved = this.resolveMinMaxType(type, key);
                if (resolved)
                    attrType = resolved;
            }
            // One editor control, through the same door a project uses: identity + value in
            // `content`, the type's own settings in `config`.
            const attrConfig = {
                type: attrType,
                id: `${slug}-${schemaDef.name}`,
                label: schemaDef.label ?? schemaDef.name,
                value,
            };
            if (schemaDef.options)
                attrConfig.options = schemaDef.options;
            attributes[key] = {
                input: attrType,
                value,
                ...(schemaDef.config ? { config: schemaDef.config } : {}),
                template: build().create({
                    content: attrConfig,
                    config: schemaDef.config,
                }),
            };
        }
        return {
            field: { content, config },
            template: build().create({ content, config }),
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
            }),
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
    static scan(type, schema, customAllowed = []) {
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
    static scanUnallowedAttrs(type, config, customAllowed = []) {
        return this.scan(type, config, customAllowed).ok;
    }
    /**
     * @param nodes - One `{ content, config }` field node per header, in sheet order.
     * @param options - `modules` is the input module stack every control is built with.
     * @returns One descriptor per node, in the same order.
     */
    static create(nodes = [], options = {}) {
        return nodes.map((node) => this.buildSchemaForType(node, options));
    }
}
//# sourceMappingURL=Attribute.js.map