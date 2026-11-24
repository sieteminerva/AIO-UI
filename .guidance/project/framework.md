# Framework — status (`packages/**`, `examples/demo/**`)

Band rules: `packages/AGENTS.md` → `examples/demo/AGENTS.md`.
Why / stages: `.guidance/plan-framework.md`. Engineering rules:
`docs/framework/COMPONENT-CONVENTIONS.md`. Index: `STATUS.md`.

## Active (max 3)

| #   | Task                     | State       | Gate                                                                                                    |
| --- | ------------------------ | ----------- | ------------------------------------------------------------------------------------------------------- |
| 1   | Theme console view (fab) | in progress | `examples/demo/src/ThemeConsole/TASKS.md` — view composed, gate green; open: page-only popover sections |
| 2   | Inspect surface (b43)    | in progress | `inspect()` + `inspectPage()` green; open: dead relay removal, `#cleanupMap` reset                      |
| 3   | Colour tokens (b82)      | in progress | one `light-dark()` root + per-component text contrast; code-block ink is the reported defect      |

## Next

- **Release the input breaking change.** b76 removed `iBasicInputNode`, `iFormGroupNode` and
  `InputBuilderConfigOptions` from `@aio-ui/core` (type-only, but public), b79 removed `span` from
  `iInputLayout`, and the repeater flags replaced `minItems`/`atMin`: the next minor must list all
  three. The contracts live in `packages/components/{form,input}/README.md`; owner orders the
  publish.
- **Release v0.2.5 — published (b69, 2026-11-24).** Branch `releases` + tag `v0.2.5` pushed and
  probed 6/6 → 200; CDN stays **versioned**. Only the optional GitHub Release asset upload
  (`GITHUB_TOKEN`) remains → `docs/releases/v0.2.5.md`. The official release still waits for the
  `store` / `profile` / `blog` references.
- **Surface generator** — `scripts/surface.mjs --write/--check` to replace 37 hand-edited export
  maps and fail a subpath excluded by `files[]`. Optional, not a blocker. → `packages/TASKS.md`
- **Proof reports** — `scripts/proof.mjs --report` lists every component package and whether it
  carries an `inspect()` assertion (report-only first, gate once covered).

## Landed (newest first)

- **Batch 81 (2026-11-24)** — the two remaining owner-reported defects. **Footer:**
  `.form > .form-footer` gets the note-line rule it never had (`--form-footer-*` from the app
  layer), measured 704px right-aligned under `#form/layout`. **Popup:** `position-try-fallbacks:
none` → `--flip-top, flip-block` (surface + picker panel), one `--field-dropdown-anchor` with
  `anchor-scope` on `.field` (generated anchor ids gone), and a probe proving the menu opens
  upward and stays inside the viewport. The trigger-border mirror is not reachable (try rules
  take placing/sizing only; `anchored()` does not match the anchor), documented instead. `span`
  leaves `iInputLayout`. Proof: `check` (api-map + catalogue refreshed) + `verify` green.
- **Batch 80 (2026-11-24)** — a repeater's first row is its **source** and is never deletable
  (it carries the record the clones copy); clones follow `removable` (default `true`) and
  `hideOnSource` hides the source's button instead of leaving it disabled. `minItems`/`atMin`
  are gone (the count-based floor could not express "keep index 0"). Tests, `INPUT-ACTIONS.md`,
  `InputControls.css` comments and the demo label follow. Proof: `InputControls.test.ts` 28/28,
  `check` + `verify` green (92 files, 1011 pass, 1 skip).
- **Batch 79 (2026-11-24)** — one way to size a field: `wide` is a percentage of the row (20/40/40 is
  exactly 20/40/40), absent = the whole row, the integer `span` and the 16-grid are retired, and
  `column` is only the line cap (the 4th child of `column: 3` starts the next line). Placement is
  explicit (`arrangeRow` writes `grid-row`/`grid-column`), the gutter sits inside each share, and a
  share that would pass 100 wraps instead of creating implicit tracks that shrink the row. Proof:
  `#form/layout` 704px → 352/352/704/352/352; calc group 700px → 323/323/646; `types-choice` full
  lines; `check` + `verify` green.
- **Batch 78 (2026-11-24)** — the `.wide`/`span` share is honoured by every container, not only a
  row. `FormLayout` keeps one contract (`spanOf` + `clampSpan` + `declaredColumns`), `renderGroup`
  lays out a `column` group with the same writer a row uses, the cascade stamps a late-built
  child's share (both hold modes), and `@property --span { inherits: false }` stops a share leaking
  into a nested container; `Form.css` gained the `7c. Group Grid` block. Proof: browser numbers on
  the demo (calc group 700 → 314/314/646; layout row 704 → 343/343/704), `check` green, `verify`
  1012 pass / 1 skip.
- **Batch 76 (2026-11-24)** — input legacy sweep closed. `@aio-ui/core` no longer declares a field
  node: `iBasicInputNode`, its duplicate `iFormGroupNode` and `InputBuilderConfigOptions` are gone,
  and the four registry payloads follow the existing `input: any` door rule. Docs stop claiming
  `config.options` (`API.md`, `FIELD-TYPES.md`) and state that `range` is echoed as a control
  attribute. `FieldTypes.test.ts` pins that decision. Rajutan committed in its own repo
  (`1008e4f`). Proof: `check` green (api-map + catalogue refreshed), `verify` 92 files / 997 pass /
  1 skip.
- **Batch 74 (2026-11-24)** — one schema shape for input and form: a form field node is the input
  schema `{ content, config }` (form-owned `condition`/`then` beside the blocks); the adapter's
  flat split is gone and `config.selectors` is lifted into the field's own builder. `@aio-ui/form`
  publishes `FormField`/`FormNode`, so a stale key is a compile error; demo, gallery and the
  rajutan app migrated, `typecheck:examples` joined `check`. Proof: `verify` 996 pass / 1 skip,
  `build:demo` green, render test in `FormModules.test.ts`. Commit `bf5b40c`.
- **Batch 69 (2026-11-24)** — v0.2.5 published: 37 packages at `0.2.5`, branch `releases` + tag
  `v0.2.5` pushed, `check:live` 6/6 → 200; every package README carries an install block; the
  release-automation task doc deleted (§13). Proof: `verify:pkgs` 956 pass / 17 skip, `check`
  green, probe 6/6.
- **Batch 59 (2026-11-24)** — three seams closed. (1) **Tab nesting**: lookups are scoped to the
  instance's own menu/body children and ids come from a per-instance `uid`, so a nested tab no
  longer answers the parent's menu nor collides on `tabpanel-gen-*`. (2) **Message root**: the
  form adapter already leaves from `@aio-ui/message`; a surface test pins it, and the gallery
  asset map now carries the module (it only had the sheet). (3) **Chooser contract**: `options`
  - `multiple` are the field's, for `select`/`dropdown`/`picker`/`radio`/`checkbox`;
    `config.options` is a deprecated lift, `config.isMultiple` is gone, and a `radio`/`checkbox`
    field with `options` now renders a group. Proof: `npm run verify` → 961 pass / 1 skip / 9
    pre-existing release-artefact failures (`orchestrator/__test__/release.test.ts` reads the
    stale `releases/` map, which still names `modules`/`rating`).

- **Batch 52 (2026-11-23)** — the mount point **is** the shell: `AioApp` paints `menu + page roots
  - footer`as direct children of the container and marks it`aio-shell`; every page top-level
entry is rendered and mounted as its own root, so `main.page`+`footer`stay siblings (no bare`div`). `#frame`releases builders per root;`destroy()`clears the host's children. Proof:`npm run verify`→ 954 pass / 1 skip; rajutan probe → 0 bare divs, 1`main` per route.
- **Batch 45 (2026-11-22)** — CDN surface refactor: 131 → 76 rows, 39 → 37 packages. Input modules
  merged into their builders, `table`/`message`/`id-address` adapters into their roots, `rating` and
  the `@aio-ui/modules` kit deleted, core type-only subpaths collapsed. `v0.2.4` artefacts
  regenerated locally. Contract and open items: `packages/TASKS.md`.
- **Batch 42–44 (2026-11-21)** — `union` + `element` in `iContentSpec` (7 builders narrowed);
  `v0.2.4` published on `releases` + tag in mode B (39 tarballs, 1.29 MB) with the bundled pair at
  the branch root.
- **Batch 53–56** — the release is a real pipeline: `closure.mjs`, `release.mjs` in two modes (B
  default), the `releases` orphan-branch worktree, `publish-releases.mjs`, `publish-cdn.mjs`,
  `publish-release-assets.mjs`. The form and input presets became opt-in (their live definitions
  moved to subpaths, proved by `check:bundle`).
- **Batch 46–49** — `scripts/catalogue.mjs` compiles every component README into
  `docs/framework/catalogue.json`; gates tiered by cost (`check` 12 s / `verify` 54 s /
  `verify:pkgs` 2 m 23 s, §4); `scripts/session.mjs` freezes the session rituals (`start`, `cp`,
  `end`).
- **Batch 36–43** — masonry lightbox via declared selectors, recursive menu, fab-menu accepts an
  element, theme console composed (`--fab-*` tokens), inspection surface `inspect()` /
  `inspectPage()` landed and proved.

## Open questions

- Generated-site hosting (GitHub Pages vs Cloudflare Pages) — deployment only, not the preset
  contract.
