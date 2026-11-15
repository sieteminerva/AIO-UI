# TASK — theme console (docked in the fab menu)

Status: **in progress** (2026-11-16). Batch 39 landed and is committed: the view is composed for
its container and `npm run verify` passes. One follow-up is open (see `## Next`).

The colouriser started as a `#theme` route, then became host chrome: one fab panel that carries
theme style, theme mode and theme colour, with the page behind it as the live preview. The route,
its page, its `componentRoutes` entry and its nav leaf are gone.

## What exists (committed `6ace4d2`, `FabMenu.css` tokens in batch 39)

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

## Batch 39 — the composition

Three controls on two rows and ONE drawer at a time:

```
mode switch        always visible — the one setting worth a click at any moment
Mixer | Report     a rail, `justify-content: space-evenly`
the open drawer    the colouriser's `aside.configurator` / `aside.output`
```

- **The drawers are the popover** (option 1 of the two that were on the table):
  `background: transparent`, `border: 0`, `border-radius: 0`, `padding: 0`, so a page card is no
  longer drawn inside a card.
- **No `max-block-size`.** The old 52vh cap gave every drawer its own scrollbar inside a popover
  that was already scrolling. One scroll area now: the popover.
- **One drawer at a time.** Two open drawers were ~900px of content inside a ~660px popover.
- **`grid-template-columns: minmax(0, 1fr)`** — the old auto column was sized by the report's token
  block, so the panels leaned ~7px out of the popover.
- The welded class is `drawer`, not `panel`: `.panel` is the fab's own class, and a host rule aimed
  at the popover was sizing the drawers too.
- The mode label reads the real mode again: `ColorThemeKit.syncModeControl` looked for `.field`
  *inside* its scope, but an attached key's scope **is** the `.field`.

## The page and the panel are one theme

Every route render re-creates the console, so it came back on its construction defaults while the
page kept the last broadcast — a `gum` panel over a `chocolaris` page, with every interaction
painting the defaults back over what the visitor had chosen. The state moved out of the panel:

1. `theme-config.ts` stores `{ preset, primary, accent, mode, tokens }` under `demo:theme-config`.
2. `main.ts` calls `bootTheme()` before the first render, so the app default never flashes first.
3. The console seeds `ColorThemeBuilder` from that entry — `preset` is config now, not a constant.
4. The token bridge is wired in `prepare()`, **before** the child exists, so the colouriser's
   first-paint announcement is caught instead of dispatched into an empty window.
5. Every broadcast is applied to `<html>` and written back, so the next render starts where the
   visitor stopped.

## Next

1. The configurator still carries page-only preview content (the primary ramps, the palette strip).
   In the popover they are why one drawer is ~887px tall inside a ~690px panel — trim them behind a
   disclosure, or let the popover grow.
2. Mixer and per-token overrides are not persisted (only `preset`/`primary`/`accent`/`mode` are).
3. Decide whether `ThemeConsole` belongs in `packages/components/` instead of the demo.
4. `ColorTheme.css` keeps `&`-nesting and page-only selectors: the `select` / `range` styling is
   shared with the console and could not be dropped.

## Traps

- Projected panels keep `width: 100%` + padding + border from the component sheet, so the popover
  grows ~42px without `box-sizing: border-box` on the console subtree.
- A `.colorizer .output …` rule is scoped to page mode; a slot panel inherits the box and the
  `--input-*` tokens only. The console therefore guards `pre` overflow itself.
- `Builder.#active` is a construction-time window: constructing the colouriser inside the host's
  `prepare()` is what gives it a caller, and therefore a slot.
- The fab panel had no `box-sizing`, so a host's `inline-size` got padding and border added on top
  and the panel ran off the left edge at 380px. It is `border-box` now.
