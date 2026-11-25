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
  config: { useDivider: true, size: "huge", alignment: "left" },
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
| `appearance`     | `"normal"`              | Room for more words later; `normal` is the only one now.                                          |
| `alignment`      | `"left"`                | `center \| left \| right \| justify`, as `data-alignment` on the root.                            |
| `iconPosition`   | `"top"`                 | `top \| left \| right \| bottom`, as `data-position` on `i.icon` (the reading order never moves). |
| `structuredData` | `false`                 | Opt-in `itemscope itemtype="https://schema.org/Article"` + `itemprop` on title/meta.              |
| `selectors`      | see `DEFAULT_SELECTORS` | Per-key tag/class override.                                                                       |
| `themeId`        | `"default"`             | Passed through to the theme.                                                                      |
| `namespace`      | `null`                  | Prefix for generated ids.                                                                         |

`size` decides the heading tag: `huge → h1`, `normal → h3`, `medium → h4`, `small → h5`.
Two `<h1>`s on one page is an SEO defect, so the page picks the size that matches its
outline. A caller that needs a level the size map does not offer overrides
`selectors["@header>title"].tagName` directly.

`iconPosition` is a placement, not a re-order: the DOM keeps icon → title → subtitle → meta
→ divider, and the sheet reads `i.icon[data-position]`. `top` (the default) is that order
as-is; `left`/`right` stand the glyph beside the title + subtitle as a block as tall as
both, glyph centred on that block's middle line; `bottom` puts it under the subtitle, above
the meta line. `.meta` and `.divider` always stay full-width lines of the block.

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

The sizes that follow the type scale — `--header-gap`, `--header-icon-block` — are computed on
the block itself from `--header-title-measure` (the title size in use, so `data-size` moves
them). They cannot live in the `:root` layer: a `var()` there would resolve against the root's
title size and every `data-size` would keep the default gap. Retune them on the block (a
selector at least as specific as `header.header`).

| Token                      | Derives from                        | Used for                                                                      |
| -------------------------- | ----------------------------------- | ----------------------------------------------------------------------------- |
| `--header-gap`             | `--header-title-measure` × 0.35     | Stack spacing, clamped to `0.35rem`–`0.5rem`; rows stack at half of it         |
| `--header-title-color`     | `--app-text-heading-color`          | Title ink                                                                     |
| `--header-text-color`      | `--app-text-accent-color`           | Subtitle/meta ink                                                             |
| `--header-accent-color`    | `--app-primary-color`               | Icon ink                                                                      |
| `--header-divider-color`   | `--app-border-color`                | Closing line                                                                  |
| `--header-title-size`      | `--app-font-size-2xl`               | Title size                                                                    |
| `--header-title-size-huge` | `--app-font-size-3xl`               | `data-size="huge"`                                                            |
| `--header-title-measure`   | `--header-title-size` (per `data-size`) | The title size actually in use; the gap and the icon block read it        |
| `--header-subtitle-size`   | `--app-font-size-base`              | Subtitle size                                                                 |
| `--header-meta-size`       | `--app-font-size-sm`                | Meta size                                                                     |
| `--header-icon-size`       | literal `1.5rem`                    | Icon glyph size (top/bottom placement)                                        |
| `--header-icon-block`      | `--header-title-measure` × 2.5      | Icon block beside the heading pair (`left`/`right`)                           |

## Wiring checklist

1. Add `"header"` to `iBuilderRegistry` in `packages/core/src/types/registry.ts`.
2. Add a loader for `@aio-ui/header` to the host's asset map.
3. Add a `stylesheet` loader for `@aio-ui/header/Header.css` if you ship CSS.
4. List it in the host's route plan: `registerModule(components, [{ route, components: ["header"] }])`.
