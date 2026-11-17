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

- **B53b — missing sub-modules speak, and the form owns the full stack** — `reportMissing()` in
  `packages/components/input/Missing.ts`: warn once per builder+capability (plus a `moduleMissing`
  emit) for `dropdown`/`popover`, throw at the declaration site for a declared `actions` set with no
  `controls` module and in `beforeSubmit` for a `config.files` policy with no `file` module.
  `@aio-ui/form/adapters` re-includes the four input definitions and `Form.prepare()` routes ids in
  `INPUT_MODULE_IDS` into `#inputModules`; `@aio-ui/form` moves `@aio-ui/input` to a real dependency.
  The probe's `form-full` must then show nine implementations, `form-root` still none.
  → `.guidance/project/TASK-form-modules.md` (D1–D3)
- **B54 — one closure graph, one export index** — `scripts/closure.mjs` (topological closure from
  `dependencies` + `peerDependencies`, `--json`, cycle report, size per closure) and
  `scripts/exports.mjs` → `docs/framework/exports.json` + a `check:exports` gate that fails when a
  subpath's file is excluded by `files[]` (today's silent 404 at install time). Four scripts stop
  recomputing the export map. → `.guidance/project/TASK-releases-branch.md`
- **B55 — release: embed the closure, publish the folder** — `release.mjs --bundle` materialises the
  closure under `<stage>/node_modules/@aio-ui/` with rewritten manifests (exact internal
  `dependencies`, `bundledDependencies`, no `development` condition), size gate before publish, then
  `publish-releases.mjs` writes `vX/` to an orphan `releases` branch via a worktree and renders
  `install/<pkg>.txt` (mode B) from the same graph. → `.guidance/project/TASK-releases-branch.md`
- **B56 — `0.2.2`** — version bump (third digit only while pre-release), `verify:pkgs`, release +
  publish, then the offline install proof from a scratch dir with an empty npm cache.
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

- **Batch 53** — the form and input presets are **opt-in, and the module graph proves it**: the two
  registries keep only data (manifest refs, ids, helpers) while the live definitions moved to
  `@aio-ui/form/adapters` and `@aio-ui/input/modules`; both builders lost their default stack, so
  `FormBuilder` with no modules throws on the first `create()` naming the import it wants, and a
  field without input modules is a plainer control, never a hole (`dropdown` degrades to a native
  `<select>` built from the same options). `scripts/bundle-probe.mjs` runs four real Vite builds and
  asserts on **parsed module ids** in both directions — the two roots parse none of the nine
  implementations, the two opt-in entries parse all of them — wired as `check:bundle` inside `check`
  (~1.3 s). Measured: `verify` → 82 files, 745 passed, 1 skipped. The probe was proved able to fail
  (an entry pulling the adapters produced five findings), and `orchestrator/release.test.ts` stopped
  reading doc blocks as import edges.
- **Batch 49** — `scripts/session.mjs` freezes the session rituals into an order of operations
  instead of prose an agent re-reads: `start` (STEP 0 — tree, last 8 commits, the three cards, live
  claims, and what to report versus what not to read yet), `cp` (CP-3, auto-numbered), `end` (§14's
  nine steps gathered and printed with the report, memory skeleton, logbook skeleton and §15 commit
  shape). Prompts on a TTY, takes flags otherwise, never writes. Two output bugs found and fixed
  while testing: card headings carried their own ordinal (`1. 1. …`) and porcelain status codes
  leaked into the report.
- **Batch 48** — the gates are tiered by cost, not run by habit: `check` (~12 s: typecheck + bounds +
  api + catalogue + version), `verify` (~54 s: `check` + tests), `verify:pkgs` (~2 m 23 s: + build +
  example builds), and the inner loop is `dev`/`build` with no gate at all. Measured per step before
  splitting: typecheck 7.3 s, the four contract scripts ~1.1 s each, the suite ~43 s. §4 of
  `AGENT_RULES.md` now carries the table, and CI runs `npm run verify` on every push — it previously
  ran no test at all.
- **Batch 47** — the gate is split by what it reads. `verify` = typecheck → bounds → api → catalogue
  → version → tests, **source only**: measured 55 s (`npm run verify`) against 2 m 23 s
  (`verify:pkgs`, of which `build:pkgs` is 1 m 25 s). The build left the dev loop, not the release.
  This was only safe after one root fix: `tsc` was resolving `@aio-ui/*` through the `types`
  condition, i.e. reading `dist/*.d.ts`, which is why a global type change used to need a rebuild
  (and why the duplicate-augmentation error appeared). `tsconfig.base.json` now sets
  `customConditions: ["development"]`, so tsc reads `src/**` like Vitest and Vite already did —
  proven with `--traceResolution`: `@aio-ui/core` → `packages/core/src/index.ts`.
- **Batch 46** — `scripts/catalogue.mjs` compiles all 23 component READMEs into
  `docs/framework/catalogue.json` (217.6 kB): title, lead, and every H2 with its prose, fenced
  examples and **every table** as `columns` + `rows`, keyed by camelCase of the header. Dry-run by
  default, `--apply` writes, `--check` runs inside `verify`. The staleness test compares **content**,
  not bytes, so a formatter pass cannot red the gate; proven both ways (clean → pass, mutated title →
  exit 1). It immediately found two real doc bugs: `fabmenu` and `pricingcard` READMEs named
  `@aio-ui/fab-menu` / `@aio-ui/pricing-card`, packages that do not exist — both H1s fixed, and the
  compiler now takes `package.json` as the authority and warns on disagreement.
- **Batch 45** — `docs/agent/handbook.md`: the **consumer** loop, written for an agent building a
  web app _with_ the framework rather than changing it — preconditions, five steps (plan → content →
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
