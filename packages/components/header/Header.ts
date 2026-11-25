import type { iBuilderConfig, iBuilderRegistry, iContentContract } from "@aio-ui/core";
import { Builder } from "@aio-ui/base";
import { Skeleton } from "@aio-ui/skeleton";

import { DEFAULT_SELECTORS } from "./Header.kit";
import type { HeaderElementType } from "./Header.kit";
import {
  DEFAULT_SIZE,
  headingFor,
  isElementValue,
  isPairValue,
  itempropFor,
  metaEntries,
  textOf,
} from "./Header.engine";
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

/** The component token each `config.color` field retunes. */
const COLOR_TOKEN: Record<keyof iHeaderColor, string> = {
  title: "--header-title-color",
  subtitle: "--header-subtitle-color",
  icon: "--header-accent-color",
  metadata: "--header-meta-color",
  block: "--header-surface-bg",
  border: "--header-surface-border",
};

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

export class HeaderBuilder extends Builder<HeaderElementType, iHeaderConfig> {
  readonly builderId: keyof iBuilderRegistry = "header";
  readonly name: keyof iBuilderRegistry = "header";
  readonly stylesheet: string = "./Header.css";

  /** A heading block is one record, not a list. `metadata` is the only open map. */
  static readonly contract: iContentContract = {
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

  public config: Required<iHeaderConfig>;

  /**
   * 🪶 LOADING MOCKUP — an icon block, a headline, a subtitle line and the meta row.
   */
  protected loading(): HTMLElement {
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

  constructor(config: Partial<iHeaderConfig> = {}) {
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

    const defaultConfig: Required<iHeaderConfig> = {
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
  public prepare(data: any): HTMLElement {
    const content = (data ?? {}) as iHeaderContent;

    const root = this.render("@header", content);
    if (!root) throw new Error('[Builder:header] selector "@header" is missing');

    if (content.icon) {
      const icon = this.render("@header>icon", content);
      if (icon) root.appendChild(icon);
    }

    if (content.title) {
      const title = this.render("@header>title", content);
      if (title) root.appendChild(title);
    }

    if (content.subtitle) {
      const subtitle = this.render("@header>subtitle", content);
      if (subtitle) root.appendChild(subtitle);
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
          if (item) meta.appendChild(item);
        }
        root.appendChild(meta);
      }
    }

    // The divider is the closing line of the block — a sibling *after* `.meta`.
    if (this.config.useDivider) {
      const divider = this.render("@header>divider", content);
      if (divider) root.appendChild(divider);
    }

    return this.load("@header") as HTMLElement;
  }

  /**
   * Hydration valve: text and attributes only. Children are their own keys, appended by
   * `prepare()`.
   */
  protected template(typeKey: HeaderElementType, el: HTMLElement, payload?: any): void {
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
          if (!ink) continue;
          el.style.setProperty(COLOR_TOKEN[part as keyof iHeaderColor], ink);
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
        if (payload?.icon) el.className = `${payload.icon} icon`;
        break;

      case "@header>title":
        el.textContent = payload?.title ?? "";
        if (this.config.structuredData) el.setAttribute("itemprop", "headline");
        break;

      case "@header>subtitle":
        el.textContent = payload?.subtitle ?? "";
        break;

      case "@header>meta>item": {
        const key = String(payload?.key ?? "");
        const value = payload?.value;

        // The property is the identity; the pair may add a display class on top.
        if (key) el.classList.add(key);
        if (isPairValue(value) && value.className) el.classList.add(value.className);

        el.textContent = textOf(value);

        if (this.config.structuredData) {
          const itemprop = itempropFor(key);
          if (itemprop) el.setAttribute("itemprop", itemprop);
        }
        break;
      }

      case "@header>divider":
        el.setAttribute("aria-hidden", "true");
        break;
    }
  }

  /** No interaction: a heading block is content. */
  public initialize(): void { }
}
