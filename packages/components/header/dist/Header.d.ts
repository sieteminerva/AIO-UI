import type { iBuilderConfig, iBuilderRegistry, iContentContract } from "@aio-ui/core";
import { Builder } from "@aio-ui/base";
import type { HeaderElementType } from "./Header.kit";
import type { HeaderSize } from "./Header.engine";
/**
 * Header — an article-style heading block: icon, title, subtitle and one metadata line.
 *
 * The markup is the page's SEO surface, so the rules are part of the contract, not taste:
 *
 *   - a real `<header>` (inside `<article>`/`<section>` it is that section's header, not a
 *     page banner), one heading, and the level comes from `size` so a page can avoid two
 *     `<h1>`s;
 *   - a metadata value may be a live element — that is how a machine-readable
 *     `<time datetime>` (or an `<strong>` name) reaches the DOM, and the element is the
 *     schema, never parsed out of a prose label;
 *   - the icon and the divider are decoration (`aria-hidden`), never content.
 */
/** The classed-text form of a metadata value: the builder creates the `<span>` from it. */
export interface iHeaderMeta {
    textContent: string;
    className: string;
}
/**
 * One metadata value:
 *
 *   - `string` — a `<span class="{key}">` with that text;
 *   - `{ textContent, className }` — a `<span class="{key} {className}">` with that text;
 *   - `HTMLElement` — appended as-is (the caller owns its class, text and attributes, which
 *     is the only way a `<time datetime>` or a `<strong>` arrives without innerHTML).
 */
export type iHeaderMetaValue = string | iHeaderMeta | HTMLElement;
/**
 * Where the icon stands relative to the heading pair. A CSS hint, written as `data-position`
 * on the `<i>` — the sheet reads the glyph, the markup keeps its reading order.
 */
export type HeaderIconPosition = "top" | "left" | "right" | "bottom";
/**
 * Per-part ink. Each field retunes one component token on the root; an omitted field keeps
 * the sheet's own default (`--header-*` → `--app-*`), so `{}` is "exactly as the theme says".
 * `block` is the filled block's surface, `border` the outline block's stroke.
 */
export interface iHeaderColor {
    title?: string;
    subtitle?: string;
    icon?: string;
    metadata?: string;
    block?: string;
    border?: string;
}
export interface iHeaderContent {
    title?: string;
    subtitle?: string;
    /** A glyph class, e.g. `"user"` or `"fas fa-user"`; `icon` is appended by the builder. */
    icon?: string;
    /** One entry per property, in the object's own order. */
    metadata?: Record<string, iHeaderMetaValue>;
}
export interface iHeaderConfig extends iBuilderConfig<HeaderElementType> {
    /** Draw the closing line after the metadata (boolean, so the sheet owns the look). */
    useDivider?: boolean;
    /** Also picks the heading level: huge → h1, normal → h3, medium → h4, small → h5. */
    size?: HeaderSize;
    /**
     * The block's shape — never its palette (glass/brutalist/cyberpunk are themes, not
     * appearances):
     *
     *   - `normal`    — plain stack, no surface (the default);
     *   - `bordered`  — the stack inside an outline box (`--header-surface-border`);
     *   - `block`     — the stack on a filled surface (`--header-surface-bg` + soft shadow);
     *   - `editorial` — magazine treatment: top rule, formal face, meta as a byline.
     *
     * Written as `data-appearance` on the root; every variant reuses theme tokens, so a theme
     * can still retune the result.
     */
    appearance?: "normal" | "bordered" | "block" | "editorial";
    alignment?: "center" | "left" | "right" | "justify";
    /**
     * Where the icon sits: `top` (above the title, the default), `left`/`right` (beside the
     * title + subtitle, its block as tall as both) or `bottom` (under the subtitle, above the
     * meta line). Written as `data-position` on `i.icon`.
     */
    iconPosition?: HeaderIconPosition;
    /** Opt-in schema.org microdata (`itemscope itemtype=Article` + `itemprop`). */
    structuredData?: boolean;
    /**
     * Per-part ink, written as the matching `--header-*` token on the root. Any field left
     * out falls back to the sheet's token (the themed default), never to a hard-coded colour.
     */
    color?: Partial<iHeaderColor>;
}
export declare class HeaderBuilder extends Builder<HeaderElementType, iHeaderConfig> {
    readonly builderId: keyof iBuilderRegistry;
    readonly name: keyof iBuilderRegistry;
    readonly stylesheet: string;
    /** A heading block is one record, not a list. `metadata` is the only open map. */
    static readonly contract: iContentContract;
    config: Required<iHeaderConfig>;
    /**
     * 🪶 LOADING MOCKUP — an icon block, a headline, a subtitle line and the meta row.
     */
    protected loading(): HTMLElement;
    constructor(config?: Partial<iHeaderConfig>);
    /**
     * Build the block in reading order: icon → title → subtitle → meta → divider.
     * An absent part is not appended at all (no empty `<p>`, no empty `.meta`).
     */
    prepare(data: any): HTMLElement;
    /**
     * Hydration valve: text and attributes only. Children are their own keys, appended by
     * `prepare()`.
     */
    protected template(typeKey: HeaderElementType, el: HTMLElement, payload?: any): void;
    /** No interaction: a heading block is content. */
    initialize(): void;
}
//# sourceMappingURL=Header.d.ts.map