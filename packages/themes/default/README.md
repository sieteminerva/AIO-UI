# Default theme (`@aio-ui/theme-default`)

The reference implementation of `iThemeModule`, kept deliberately small: **no classes, no
overrides, no listeners**. Every other theme is a diff against this one, so anything a page shows
under `default` comes from `@aio-ui/styles` and the components themselves.

<!-- install:begin -->
## Install

Version — `0.2.9` (tag `v0.2.9`)

    npm install https://github.com/sieteminerva/AIO-UI/raw/releases/v0.2.9/aio-ui-theme-default-0.2.9.tgz

CDN (ES module, no build step) — `https://cdn.jsdelivr.net/gh/sieteminerva/AIO-UI@v0.2.9/packages/themes/default/dist/index.js`
<!-- install:end -->

## Hooks

| Hook                                    | What it does here                                          |
| --------------------------------------- | ---------------------------------------------------------- |
| `beforePageRender(pages, menu, footer)` | Returns the tree untouched — no structural hook needed     |
| `activate(shell, elements, context)`    | Sets `display: block` and `overflow: initial` on the shell |
| `deactivate(shell)`                     | Removes that inline style                                  |

`themeId` is `"default"`, `name` is `"Default"`.

## When to use it

Use it as the baseline a theme is written against: if `default` looks wrong, the bug is in a
component or a token, not in the theme. Use `@aio-ui/themes` when the host wants the three themes
from one import.

## Tokens

None of its own — it reads whatever `@aio-ui/styles` defines.
