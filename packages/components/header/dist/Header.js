import { Builder } from "@aio-ui/base";
import { Skeleton } from "@aio-ui/skeleton";
import { DEFAULT_SELECTORS } from "./Header.kit.js";
import { DEFAULT_SIZE, headingFor, isElementValue, isPairValue, itempropFor, metaEntries, textOf, } from "./Header.engine.js";
/** The component token each `config.color` field retunes. */
const COLOR_TOKEN = {
    title: "--header-title-color",
    subtitle: "--header-subtitle-color",
    icon: "--header-accent-color",
    metadata: "--header-meta-color",
    block: "--header-surface-bg",
    border: "--header-surface-border",
};
export class HeaderBuilder extends Builder {
    builderId = "header";
    name = "header";
    stylesheet = "./Header.css";
    /** A heading block is one record, not a list. `metadata` is the only open map. */
    static contract = {
        schema: {
            t: "record",
            open: true,
            of: {
                title: { t: "string", req: true },
                subtitle: { t: "string" },
                icon: { t: "string" },
                // Values are scalars, `{ textContent, className }` pairs or live elements; `open`
                // keeps the map unconstrained (a DOM node is an object and must not be inspected).
                metadata: { t: "record", open: true },
            },
        },
        example: {
            title: "Merawat kaos katun agar tidak melar",
            subtitle: "Example subtitle",
            icon: "user",
            metadata: {
                author: { textContent: "Oleh: Rina", className: "author" },
                date: "12 Januari 2026",
            },
        },
    };
    config;
    /**
     * 🪶 LOADING MOCKUP — an icon block, a headline, a subtitle line and the meta row.
     */
    loading() {
        return Skeleton.create({
            shape: "stack",
            children: [
                {
                    shape: "row",
                    gap: "0.5rem",
                    children: [
                        { shape: "circle", width: "1.5rem" },
                        { shape: "bone", width: "60%", height: "2rem" },
                    ],
                },
                { shape: "line", width: "40%" },
                { shape: "line", width: "70%" },
            ],
        });
    }
    constructor(config = {}) {
        super();
        // The heading tag is decided once, at construction: `render()` reads `tagName` from
        // the selector map. A caller that overrides `@header>title.tagName` keeps its choice.
        const selectors = {
            ...DEFAULT_SELECTORS,
            "@header>title": {
                ...DEFAULT_SELECTORS["@header>title"],
                tagName: headingFor(config.size),
            },
        };
        const defaultConfig = {
            themeId: "default",
            namespace: null,
            emit: () => { },
            selectors,
            useDivider: false,
            size: DEFAULT_SIZE,
            appearance: "normal",
            alignment: "left",
            iconPosition: "top",
            structuredData: false,
            color: {},
        };
        this.config = this.resolveConfig(defaultConfig, config);
    }
    /**
     * Build the block in reading order: icon → title → subtitle → meta → divider.
     * An absent part is not appended at all (no empty `<p>`, no empty `.meta`).
     */
    prepare(data) {
        const content = (data ?? {});
        const root = this.render("@header", content);
        if (!root)
            throw new Error('[Builder:header] selector "@header" is missing');
        if (content.icon) {
            const icon = this.render("@header>icon", content);
            if (icon)
                root.appendChild(icon);
        }
        if (content.title) {
            const title = this.render("@header>title", content);
            if (title)
                root.appendChild(title);
        }
        if (content.subtitle) {
            const subtitle = this.render("@header>subtitle", content);
            if (subtitle)
                root.appendChild(subtitle);
        }
        const entries = metaEntries(content.metadata);
        if (entries.length) {
            const meta = this.render("@header>meta", content);
            if (meta) {
                for (const [key, value] of entries) {
                    if (isElementValue(value)) {
                        // Caller-owned markup: it brings its own class, text and attributes.
                        meta.appendChild(value);
                        continue;
                    }
                    const item = this.render("@header>meta>item", { key, value });
                    if (item)
                        meta.appendChild(item);
                }
                root.appendChild(meta);
            }
        }
        // The divider is the closing line of the block — a sibling *after* `.meta`.
        if (this.config.useDivider) {
            const divider = this.render("@header>divider", content);
            if (divider)
                root.appendChild(divider);
        }
        return this.load("@header");
    }
    /**
     * Hydration valve: text and attributes only. Children are their own keys, appended by
     * `prepare()`.
     */
    template(typeKey, el, payload) {
        switch (typeKey) {
            case "@header":
                // Size, appearance and alignment drive the sheet through attributes — no inline style.
                el.dataset.size = this.config.size;
                el.dataset.appearance = this.config.appearance;
                el.dataset.alignment = this.config.alignment;
                if (this.config.structuredData) {
                    el.setAttribute("itemscope", "");
                    el.setAttribute("itemtype", "https://schema.org/Article");
                }
                // Ink is a runtime value, so it lands as a token on the root; the sheet still owns
                // how each part reads that token. An absent field writes nothing.
                for (const [part, ink] of Object.entries(this.config.color ?? {})) {
                    if (!ink)
                        continue;
                    el.style.setProperty(COLOR_TOKEN[part], ink);
                }
                break;
            case "@header>icon":
                // Decoration: the title already names the block, so the ligature must not reach the
                // accessible name. `focusable` is for old IE; harmless elsewhere.
                el.setAttribute("aria-hidden", "true");
                el.setAttribute("focusable", "false");
                // Placement is a config hint the sheet reads (`i.icon[data-position]`), never an
                // order change: the DOM stays icon → title → subtitle → meta → divider.
                el.dataset.position = this.config.iconPosition;
                if (payload?.icon)
                    el.className = `${payload.icon} icon`;
                break;
            case "@header>title":
                el.textContent = payload?.title ?? "";
                if (this.config.structuredData)
                    el.setAttribute("itemprop", "headline");
                break;
            case "@header>subtitle":
                el.textContent = payload?.subtitle ?? "";
                break;
            case "@header>meta>item": {
                const key = String(payload?.key ?? "");
                const value = payload?.value;
                // The property is the identity; the pair may add a display class on top.
                if (key)
                    el.classList.add(key);
                if (isPairValue(value) && value.className)
                    el.classList.add(value.className);
                el.textContent = textOf(value);
                if (this.config.structuredData) {
                    const itemprop = itempropFor(key);
                    if (itemprop)
                        el.setAttribute("itemprop", itemprop);
                }
                break;
            }
            case "@header>divider":
                el.setAttribute("aria-hidden", "true");
                break;
        }
    }
    /** No interaction: a heading block is content. */
    initialize() { }
}
//# sourceMappingURL=Header.js.map