# Styles (`@aio-ui/styles`)

The shared stylesheet layer: the `--app-*` token system, typography, the surfaces components
share, layout primitives and iconography. CSS only — there is no build script and no JavaScript,
so a host links it (or lets `ensureStylesheet` request it) and every component that reads the
tokens restyles itself.

<!-- install:begin -->
## Install

Version — `0.2.6` (tag `v0.2.6`)

    npm install https://github.com/sieteminerva/AIO-UI/raw/releases/v0.2.6/aio-ui-styles-0.2.6.tgz

CDN (no build step) — `https://cdn.jsdelivr.net/gh/sieteminerva/AIO-UI@v0.2.6/packages/styles/src/index.css`
<!-- install:end -->

## Sheets

`index.css` imports the five sheets in presentation order — tokens first, then type, then shared
component surfaces, then layout, then iconography:

| Sheet            | Contents                                                              |
| ---------------- | --------------------------------------------------------------------- |
| `variables.css`  | `:root` `--app-*` tokens: colour, spacing, radius, type scale, motion |
| `typography.css` | Base type, headings, measure                                          |
| `components.css` | Surfaces more than one component draws on (focus ring, scrollbar)     |
| `layout.css`     | Section, container and spacing composition                            |
| `icon.css`       | Icon sizing and alignment                                             |

## Token rule

Component tokens are `--<component>-*` and must derive from an `--app-*` token:

```css
--input-text-color: var(--app-text-color);
```

Never extend a component sheet to change a colour — change the `--app-*` value it inherits. That
is what makes a theme a data change instead of a fork.

## When to use it

- A host that builds its own page: link the sheet and read `--app-*` in its own CSS.
- A component: do not import this package. `ensureStylesheet` requests the sheet the component
  names, and the tokens are already on `:root`.
