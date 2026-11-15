# Framework — status (`packages/**`, `examples/demo/**`)

Band rules: `packages/AGENTS.md` → `examples/demo/AGENTS.md`.
Why / stages: `.guidance/plan-framework.md`. Engineering rules:
`docs/framework/COMPONENT-CONVENTIONS.md`. Index: `STATUS.md`.

## Active (max 3)

| #   | Task                      | State       | Gate                                                                                              |
| --- | ------------------------- | ----------- | ------------------------------------------------------------------------------------------------- |
| 1   | Theme console view (fab)  | in progress | `examples/demo/src/ThemeConsole/TASKS.md` — panels compose inside a 24rem popover; ≤380px no overflow |

## Next

- Observe the mockup path in a real browser (cold sheet): throttled network or a disabled HTTP
  cache — Vite resolves the loader in one microtask, so dev never shows the hold.
- Masonry column distribution.
- Audit remaining `TemplateRegistry` and page-registration references.
- jsdom regression test for the file-adapter mount order (adapter must see its `.field` parent).
- A real form in the browser through the CORE preset and the manifest presets.
- Notify collaborators on form reset so held state (CSV table, address detail) is cleared.
- Typed `TemplateRegistry` / `PageRegistry` adapters; `ComponentRegistry` adapter coverage (jsdom).
- `AppRegistry` as the application composition container; migrate Form optional features through
  `FormModuleRegistry`.

## Landed

- **Batch 38** — `fab-menu` accepts an `HTMLElement` payload; `ThemeConsole` docks the colouriser
  into the fab and writes tokens to `<html>`; the `#theme` route, page and nav leaf are gone.
- **Batch 37** — recursive menu (`config.multilevel`), class-based branch state, compact strip.
- **Batch 36** — masonry lightbox is declared selectors (`@masonry>modal>…`), built by `template()`.

## Open questions

- Generated-site hosting (GitHub Pages vs Cloudflare Pages) — deployment only, not the preset
  contract.
