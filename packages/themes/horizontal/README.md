# Horizontal theme (`@aio-ui/theme-horizontal`)

Pages laid out as horizontally scrolling panels. The scroll engine already existed as
`HorizontalScrollingPage` — a standalone module with `activate(shell, elements)` and
`deactivate(shell)` — so this package is a thin adapter that makes it a first-class theme without
duplicating a line of the scroll logic.

<!-- install:begin -->

## Install

Version — `0.2.4` (tag `v0.2.4`)

    npm install https://github.com/sieteminerva/AIO-UI/raw/releases/v0.2.4/aio-ui-theme-horizontal-0.2.4.tgz

CDN (ES module, no build step) — `https://cdn.jsdelivr.net/gh/sieteminerva/AIO-UI@v0.2.4/packages/themes/horizontal/dist/index.js`

<!-- install:end -->

## Hooks

| Hook                                    | What it does here                                 |
| --------------------------------------- | ------------------------------------------------- |
| `beforePageRender(pages, menu, footer)` | Returns the tree untouched — panels stay authored |
| `activate(shell, elements, context)`    | Wires the scroll engine to the live page          |
| `deactivate(shell)`                     | Unwires it                                        |

The constructor takes a partial `HorizontalScrollingConfig`, so a host can tune the engine:

```js
const theme = new HorizontalTheme({
  /* HorizontalScrollingConfig */
});
```

## `HorizontalScrollingPage` is exported too

A horizontal layout is unusable with a keyboard without that behaviour, so it is public: a host
that builds its own page (the gallery home page does) imports it directly.

> A theme applies to **every** route — that is the point of a layout theme. A page that also calls
> `new HorizontalScrollingPage().activate(...)` inside `onCreated` double-applies it; that call
> belongs to the theme.

## Tokens

None of its own. The panels read the standard `--app-*` spacing and type tokens.
