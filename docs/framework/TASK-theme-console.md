# TASK — theme console (docked in the fab menu)

Status: **in progress** (2026-11-16). Batch 38 landed and is committed; the view is not finished.

The colouriser started as a `#theme` route, then became host chrome: one fab panel that carries
theme style, theme mode and theme colour, with the page behind it as the live preview. The route,
its page, its `componentRoutes` entry and its nav leaf are gone.

## What exists (committed `6ace4d2`)

- `packages/components/fabmenu/FabMenu.ts` — an `actions` entry **or** the whole payload may be an
  `HTMLElement`, mounted as-is. Same contract `tab`/`form`/`modal` already had; README documents it
  under `### Element payload`.
- `examples/demo/src/ThemeConsole/` — `ThemeConsoleBuilder` owns the chrome. `config.slots`
  (`@console>color-configurator`, `@console>color-report`, `@console>mode`) + `attach()`, i.e. the
  `.archives/Editor/Editor.ts` arrangement without an iframe. `prepare()` constructs the
  `ColorThemeBuilder` and attaches its three projections; `initialize()` wires the rail switches and
  writes every broadcast token to `documentElement`; `destroy()` destroys the colouriser.
- `examples/demo/src/ColorTheme/` — engine + kit + presets + builder (~2k lines). Publishes
  `THEME_TOKENS_EVENT` (`editor:theme-tokens`) instead of importing the archive's module.
- Rail controls are the **input primitive's switch** — `.field` > `label[data-position="right"]` +
  `.switch.control` > `input[type=checkbox]` + `.slider[data-shape="round"]`. No bespoke pills and no
  local sheet for an input surface.
- `main.ts` host links: `@aio-ui/input/input.css` **and** `@aio-ui/input/controls.css` (the
  colouriser hand-builds primitive classes, so both sheets must be on the page) +
  `./ColorTheme/ColorTheme.css`. `registry.assets.ts` carries only the console sheet.

## Open question — the view reads odd

The panels are the colouriser's **page sections folded into a 24rem popover**: two 100%-wide columns
of a page grid, a tabular report and a token `<pre>` inside a floating panel. Rail and panel widths,
vertical rhythm, and behaviour below ~640px all need a pass. Nothing is broken; it is composed for
the wrong container.

## Next

1. Decide the panel composition — one scrolling column per panel, or a rail + body split?
2. Cap the report/token block by its own container, not by the fab width.
3. Check ≤380px: the rail wraps to two rows, panels stay inside the viewport, no horizontal scroll.
4. `npm run verify` has **not** run since batch 35 while `fabmenu` and core types changed.

## Traps

- Projected panels keep `width: 100%` + padding + border from the component sheet, so the popover
  grows ~42px without `box-sizing: border-box` on the console subtree.
- A `.colorizer .output …` rule is scoped to page mode; a slot panel inherits the box and the
  `--input-*` tokens only. The console therefore guards `pre` overflow itself.
- `Builder.#active` is a construction-time window: constructing the colouriser inside the host's
  `prepare()` is what gives it a caller, and therefore a slot.
