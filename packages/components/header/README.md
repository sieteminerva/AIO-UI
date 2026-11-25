# Header (`@aio-ui/header`)

An article-style heading block: an icon, a title, a subtitle and one metadata line.
The root is a real `<header>`, so the markup is the page's SEO surface — one heading,
machine-readable dates, and decoration that never enters the accessible name.

## Payload

```ts
{
  content: {
    title: "Merawat kaos katun agar tidak melar",
    subtitle: "Example subtitle",
    icon: "user",
    metadata: {
      author: { textContent: "Oleh: Rina", className: "author" },
      date: "<time datetime=\"2026-01-12\">12 Januari 2026</time>", // an HTMLElement
    },
  },
  config: { useDivider: true, size: "huge", alignment: "left", iconPosition: "left", appearance: "block" },
}
```

| Field      | Type                                                   | Rule                                                                 |
| ---------- | ------------------------------------------------------ | -------------------------------------------------------------------- |
| `title`    | `string`                                               | Required. Rendered verbatim as the single heading — never truncated. |
| `subtitle` | `string`                                               | Optional. A `<p>`; no `<h*>` lives here but the title.               |
| `icon`     | `string`                                               | Optional glyph class; `icon` is appended (`"user"` → `user icon`).   |
| `metadata` | `Record<string, string \| iHeaderMeta \| HTMLElement>` | One entry per property, in the object's own order.                   |

A metadata value is one of:

- a `string` — a `<span class="{key}">` with that text (`textContent`);
- `{ textContent, className }` — a `<span class="{key} {className}">` with that text;
- an `HTMLElement` — appended as-is into `.meta`. The caller owns its class, text and
  attributes. This is the only way to ship a machine-readable date: pass a
  `<time datetime="…">`, built by the caller, so the value comes from the schema and is
  never parsed out of a prose label.

The builder never writes HTML from a string: text is always `textContent`, and markup is
either a builder-owned span or an element you constructed.

## Config

| Option           | Default                 | Meaning                                                                                           |
| ---------------- | ----------------------- | ------------------------------------------------------------------------------------------------- |
| `useDivider`     | `false`                 | Append the closing line after `.meta` (a boolean; the sheet draws it).                            |
| `size`           | `"normal"`              | `huge \| normal \| medium \| small`; also picks the heading level (see `## Nodes`).               |
| `appearance`     | `"normal"`              | The block's shape: `normal \| bordered \| block \| editorial` (see `## Appearance`).              |
| `alignment`      | `"left"`                | `center \| left \| right \| justify`, as `data-alignment` on the root.                            |
| `iconPosition`   | `"top"`                 | `top \| left \| right \| bottom`, as `data-position` on `i.icon` (the reading order never moves). |
| `structuredData` | `false`                 | Opt-in `itemscope itemtype="https://schema.org/Article"` + `itemprop` on title/meta.              |
| `color`          | `{}`                    | Per-part ink `{ title, subtitle, icon, metadata, block, border }`; each field writes one token.   |
| `selectors`      | see `DEFAULT_SELECTORS` | Per-key tag/class **and `color`** override (see `## Ink`).                                         |
| `themeId`        | `"default"`             | Passed through to the theme.                                                                      |
| `namespace`      | `null`                  | Prefix for generated ids.                                                                         |

`size` decides the heading tag: `huge → h2`, `normal → h3`, `medium → h4`, `small → h5`.
Two `<h1>`s on one page is an SEO defect, so the page picks the size that matches its
outline. A caller that needs a level the size map does not offer overrides
`selectors["@header>title"].tagName` directly.

`iconPosition` is a placement, not a re-order: the DOM keeps icon → title → subtitle → meta
→ divider, and the sheet reads `i.icon[data-position]`. `top` (the default) is that order
as-is; `left`/`right` stand the glyph beside the text stack as a block as tall as the
title, subtitle **and** meta it centres on; `bottom` puts it under the subtitle, above the
meta line. Beside the glyph the text column holds the title, the subtitle **and** the meta
line, so `.meta` starts on the title's left edge; only `.divider` stays a full-width line of
the block.

`color` is ink, not a theme: an omitted field keeps the sheet's `--header-*` token (which
still derives from `--app-*`), so `{}` is "exactly what the theme says". Each given field
is written as a custom property on the root — a theme or an ancestor rule can still
override it, which an inline `color` on a child could not express.

## Appearance

`appearance` is the block's **shape**, not its palette. `glass`, `brutalist`, `cyberpunk`,
gradient/aura are **themes**: they retune tokens for the whole page. An appearance only
decides how the stack sits, and every colour it paints still comes from a `--header-*`
token — so a theme retunes the result and `themeId` can still target this component alone.

| Appearance  | Shape                                                                                     |
| ----------- | ----------------------------------------------------------------------------------------- |
| `normal`    | Plain stack, no surface (the default).                                                    |
| `bordered`  | The stack inside an outline box — `1px` stroke, no fill, the page shows through.           |
| `block`     | The stack on a filled theme surface, lifted by the theme's soft shadow.                    |
| `editorial` | Magazine column: a rule opens the block, the formal face, the meta line as an uppercase byline. |

`bordered` and `block` share one padding (`--header-surface-pad`) and one radius
(`--header-surface-radius`); only the fill and the stroke differ. `editorial` reads
`--header-editorial-font`, which a theme can point at its own formal face; when the theme
has none, the component falls back to a serif stack — it never breaks, it only loses the
flavour.

## Ink

Two doors, in two orders of specificity:

1. **`config.color`** — the component's own vocabulary. Each field (`title`, `subtitle`,
   `icon`, `metadata`, `block`, `border`) writes one `--header-*` token on the root, so a
   descendant can still restyle around it and a theme can retune the rest.
2. **`config.selectors[key].color`** — the general door every builder offers. It writes an
   inline `color` on that exact element, so it beats the sheet (and the token) — an escape
   hatch for one instance, not a palette. `selectors["@header"].color` repaints the block's
   base ink; the subtitle and the meta line read `currentColor`, so they follow it unless
   `config.color.subtitle` / `.metadata` names them explicitly.

## Nodes

| Key                 | Default tag | Class      | Note                                                                               |
| ------------------- | ----------- | ---------- | ---------------------------------------------------------------------------------- |
| `@header`           | `header`    | `header`   | Root; carries `data-size`, `data-appearance`, `data-alignment`.                    |
| `@header>icon`      | `i`         | `icon`     | `aria-hidden`, `focusable="false"`; carries `data-position`; glyph class appended. |
| `@header>title`     | `h3`        | `title`    | Tag rewritten from `config.size` at construction.                                  |
| `@header>subtitle`  | `p`         | `subtitle` | Rendered only when `content.subtitle` is set.                                      |
| `@header>meta`      | `div`       | `meta`     | Rendered only when `metadata` has at least one property.                           |
| `@header>meta>item` | `span`      | key name   | Class comes from the metadata key; a pair adds its `className`.                    |
| `@header>divider`   | `span`      | `divider`  | `aria-hidden`; appended last when `useDivider` is true.                            |

An `HTMLElement` metadata value is not wrapped: it is appended straight into `.meta`, so
it does not use `@header>meta>item`.

### Structure

```html
<header class="header" data-size="normal" data-appearance="normal" data-alignment="left">
  <i class="user icon" data-position="top" aria-hidden="true" focusable="false"></i>
  <h3 class="title">Merawat kaos katun agar tidak melar</h3>
  <p class="subtitle">Example subtitle</p>
  <div class="meta">
    <span class="author">Oleh: Rina</span>
    <time datetime="2026-01-12">12 Januari 2026</time>
  </div>
  <span class="divider" aria-hidden="true"></span>
</header>
```

## Tokens

Colours are declared once on `:root, [data-theme]` in `Header.css`; each derives from an app
token with a literal fallback, so a theme retunes the app token and this sheet follows.
Redeclare a `--header-*` colour token on an ancestor to retheme this component alone.

The sizes that follow the type scale — `--header-gap`, `--header-icon-block`,
`--header-surface-pad` — are computed on the block itself from `--header-title-measure` (the
title size in use, so `data-size` moves them). They cannot live in the `:root` layer: a
`var()` there would resolve against the root's title size and every `data-size` would keep
the default gap. Retune them on the block (a selector at least as specific as
`header.header`).

| Token                      | Derives from                            | Used for                                                               |
| -------------------------- | --------------------------------------- | ---------------------------------------------------------------------- |
| `--header-gap`             | `--header-title-measure` × 0.35         | Stack spacing, clamped to `0.35rem`–`0.5rem`; rows stack at half of it |
| `--header-title-color`     | `--app-text-heading-color`              | Title ink                                                              |
| `--header-text-color`      | `--app-text-accent-color`               | Base ink for subtitle and meta                                         |
| `--header-subtitle-color`  | `currentColor` (root ink)               | Subtitle ink (`config.color.subtitle` writes it)                       |
| `--header-meta-color`      | `currentColor` (root ink)               | Meta ink (`config.color.metadata` writes it)                           |
| `--header-accent-color`    | `--app-primary-color`                   | Icon ink (`config.color.icon` writes it)                               |
| `--header-divider-color`   | `--app-border-color`                    | Closing line; the `editorial` top rule                                  |
| `--header-surface-bg`      | `--app-surface-strong`                  | `block` fill (`config.color.block` writes it)                          |
| `--header-surface-border`  | `--app-border-color`                    | `bordered` stroke (`config.color.border` writes it)                    |
| `--header-surface-radius`  | `--app-component-border-radius`         | `bordered` / `block` corner radius                                      |
| `--header-surface-shadow`  | `--app-shadow-soft`                     | `block` lift                                                            |
| `--header-surface-pad`     | `--header-gap` × 2                      | Inner padding of `bordered` / `block`, and the editorial top space     |
| `--header-editorial-font`  | `--app-font-heading-formal`             | `editorial` face (serif fallback when the theme has none)              |
| `--header-title-size`      | `--app-font-size-2xl`                   | Title size                                                             |
| `--header-title-size-huge` | `--app-font-size-3xl`                   | `data-size="huge"`                                                     |
| `--header-title-measure`   | `--header-title-size` (per `data-size`) | The title size actually in use; the gap and the icon block read it     |
| `--header-subtitle-size`   | `--app-font-size-base`                  | Subtitle size                                                          |
| `--header-meta-size`       | `--app-font-size-sm`                    | Meta size                                                              |
| `--header-icon-size`       | literal `1.5rem`                        | Icon glyph size (top/bottom placement)                                 |
| `--header-icon-block`      | `--header-title-measure` × 2.5          | Icon block beside the heading pair (`left`/`right`)                    |

## Wiring checklist

1. Add `"header"` to `iBuilderRegistry` in `packages/core/src/types/registry.ts`.
2. Add a loader for `@aio-ui/header` to the host's asset map.
3. Add a `stylesheet` loader for `@aio-ui/header/Header.css` if you ship CSS.
4. List it in the host's route plan: `registerModule(components, [{ route, components: ["header"] }])`.
