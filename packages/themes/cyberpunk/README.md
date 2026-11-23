# Cyberpunk theme (`@aio-ui/theme-cyberpunk`)

A **tokens-only** theme: it flips one marker attribute and lets `CyberpunkTheme.css` override the
`--app-*` tokens, so every component that reads the tokens restyles itself. No listeners, no DOM
surgery, no per-component code — the cheapest possible theme, and the template for a new one.

<!-- install:begin -->
## Install

Version — `0.2.5` (tag `v0.2.5`)

    npm install https://github.com/sieteminerva/AIO-UI/raw/releases/v0.2.5/aio-ui-theme-cyberpunk-0.2.5.tgz

CDN (ES module, no build step) — `https://cdn.jsdelivr.net/gh/sieteminerva/AIO-UI@v0.2.5/packages/themes/cyberpunk/dist/index.js`
Stylesheet — `https://cdn.jsdelivr.net/gh/sieteminerva/AIO-UI@v0.2.5/packages/themes/cyberpunk/dist/src/CyberpunkTheme.css`
<!-- install:end -->

## Hooks

| Hook                                    | What it does here                        |
| --------------------------------------- | ---------------------------------------- |
| `beforePageRender(pages, menu, footer)` | Returns the tree untouched               |
| `activate(shell, elements, context)`    | Sets `shell.dataset.theme = "cyberpunk"` |
| `deactivate(shell)`                     | Removes that attribute                   |

`themeId` is `"cyberpunk"`, `name` is `"Cyberpunk"`.

## The stylesheet is the theme

The host imports the sheet once — it is a separate subpath, `./CyberpunkTheme.css`, because a
theme's look is data, not code:

```js
import "@aio-ui/theme-cyberpunk/CyberpunkTheme.css";
```

Register the class as a module (or hand it to the app's theme slot) and the attribute plus the
sheet do the rest.

## Tokens

Overrides `--app-*` only, and only the ones the look needs. A component token is never touched
here — it inherits.
