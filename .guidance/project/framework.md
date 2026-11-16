# Framework — status (`packages/**`, `examples/demo/**`)

Band rules: `packages/AGENTS.md` → `examples/demo/AGENTS.md`.
Why / stages: `.guidance/plan-framework.md`. Engineering rules:
`docs/framework/COMPONENT-CONVENTIONS.md`. Index: `STATUS.md`.

## Active (max 3)

| #   | Task                     | State       | Gate                                                                                                                       |
| --- | ------------------------ | ----------- | -------------------------------------------------------------------------------------------------------------------------- |
| 1   | Theme console view (fab) | in progress | `examples/demo/src/ThemeConsole/TASKS.md` — view composed, gate green; open: page-only sections in the popover             |
| 2   | Inspect surface (b43)    | in progress | `inspect()` + `inspectPage()` landed and green; open: dead relay removal, `#cleanupMap` reset, Topik A (`iComponentInput`) |

## Next

- `scripts/proof.mjs --report`: list every component package and whether it carries an `inspect()`
  assertion. Report-only at first (the gap list is the ratchet); make it a `verify` gate once the 20
  packages are covered, so §16 stops depending on discipline.
- Retire the dead `ElementCreatedEventBus.relay` call in `DOMRenderer.buildStructure` and the
  two leftover `console.log` calls in `attachMetadata` / `mountHandler` — the relay has had no
  writer since `AioApp` replaced `LandingPageBuilder`, and a snapshot surface must stay quiet.
- Reset `#cleanupMap` per `render()`, not only on `unmount()`.
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

- **Batch 45** — `docs/agent/handbook.md`: the **consumer** loop, written for an agent building a
  web app *with* the framework rather than changing it — preconditions, five steps (plan → content →
  payload → render → report), the AST grammar with its three failure rules, a 23-word builder table
  marked by whether the payload shape is verified or README-only, verification recipes, a
  failure → action table, seven hard rules, and a "known gaps" table so nobody assumes an automation
  that does not exist. §16 gained a two-audience note; README and the STATUS pointer table link it.
- **Batch 44** — the inspection ritual is now protocol, not advice: `AGENT_RULES.md` §16
  (trigger, the three proof levels, the cheapest-sufficient-fact rule, the negative case, what does
  **not** count, and the two boundaries to say out loud); a hard-rule line in the root router; a
  worked example in `packages/AGENTS.md`; §16 added to the STEP 0 pointer list of all six band
  files; `PROMPTS.md` §5 for "prove what you built".
- **Batch 43** — inspection surface, proved before built: five probes (`Base.inspect.test.ts`,
  `DOMRenderer.metadata.test.ts`) pinned determinism, the one-record builder root, the
  idempotent key inventory and a skeleton-free hold, all green on the first run. Then
  `Builder.inspect()` + `inspectPage()` landed with their own tests. Findings: the anti-FOUC
  markers are builder-only (the renderer never holds), `getMetadata()` context is optional
  by implementation and is now optional in the type, and `dist/*.d.ts` must be rebuilt before
  typecheck reads a changed global augmentation.
- **Batch 39** — theme console composed: mode row + evenly spread rail + one drawer at a time, drawers
  flattened onto the popover, one persisted theme config (`theme-config.ts`) so page and panel agree;
  `--fab-*` token layer; `#form`/`#modules` sidebars use `position: "left sticky"` + branch headings.
- **Batch 38** — `fab-menu` accepts an `HTMLElement` payload; `ThemeConsole` docks the colouriser
  into the fab and writes tokens to `<html>`; the `#theme` route, page and nav leaf are gone.
- **Batch 37** — recursive menu (`config.multilevel`), class-based branch state, compact strip.
- **Batch 36** — masonry lightbox is declared selectors (`@masonry>modal>…`), built by `template()`.

## Open questions

- Generated-site hosting (GitHub Pages vs Cloudflare Pages) — deployment only, not the preset
  contract.
