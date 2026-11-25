# Themes kit (`@aio-ui/themes`)

The aggregator for the three themes: `export *` from `@aio-ui/theme-default`,
`@aio-ui/theme-cyberpunk` and `@aio-ui/theme-horizontal`, so a host has one specifier to map.

```js
import { DefaultTheme, CyberpunkTheme, HorizontalTheme } from "@aio-ui/themes";
```

<!-- install:begin -->
## Install

Version — `0.2.6` (tag `v0.2.6`)

    npm install https://github.com/sieteminerva/AIO-UI/raw/releases/v0.2.6/aio-ui-themes-0.2.6.tgz

CDN (ES module, no build step) — `https://cdn.jsdelivr.net/gh/sieteminerva/AIO-UI@v0.2.6/packages/kits/themes/dist/index.js`
<!-- install:end -->

## Why an aggregator

An import map needs an exact entry per bare specifier. Mapping this package once is cheaper than
mapping three, and it keeps the theme names in one place. The cost is the usual one for a barrel:
every mapped import the sheet re-exports must also be mapped — the release test proves that
closure instead of trusting it.

## Packages

| Package                    | Look                                                    |
| -------------------------- | ------------------------------------------------------- |
| `@aio-ui/theme-default`    | Reference theme — no classes, no overrides              |
| `@aio-ui/theme-cyberpunk`  | Tokens only, plus `./CyberpunkTheme.css` the host links |
| `@aio-ui/theme-horizontal` | Horizontal panels, keyboard scrolling included          |

## Tokens

None of its own — it re-exports classes, not CSS.
