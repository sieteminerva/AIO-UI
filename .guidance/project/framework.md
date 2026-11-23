# Framework — status (`packages/**`, `examples/demo/**`)

Band rules: `packages/AGENTS.md` → `examples/demo/AGENTS.md`.
Why / stages: `.guidance/plan-framework.md`. Engineering rules:
`docs/framework/COMPONENT-CONVENTIONS.md`. Index: `STATUS.md`.

## Active (max 3)

| #   | Task                     | State       | Gate                                                                                                    |
| --- | ------------------------ | ----------- | ------------------------------------------------------------------------------------------------------- |
| 1   | Release automation (b60) | next        | `docs/framework/TASK-release-automation.md` §Next — b60 `session.mjs --interactive`, b61 `release-doc.mjs`, b62 `## install` per README |
| 2   | Theme console view (fab) | in progress | `examples/demo/src/ThemeConsole/TASKS.md` — view composed, gate green; open: page-only popover sections |
| 3   | Inspect surface (b43)    | in progress | `inspect()` + `inspectPage()` green; open: dead relay removal, `#cleanupMap` reset                      |

## Next

- **Release automation — b60 first** (`scripts/session.mjs` `openPrompt()`), then b61
  `scripts/release-doc.mjs` (marker-bounded note blocks + `check:live` probe), then b62 the
  `## install` block in every package README (+ `catalogue.mjs --apply`). CDN stays **versioned**
  (owner, 2026-11-24; versionless cancelled). → `docs/framework/TASK-release-automation.md`
- **Publish — owner's order: LAST.** The post-refactor 37-package tree is regenerated and not
  published; it is worked on only after the orchestrator band is finished, or when the owner asks.
  Do not raise it unprompted (STATUS card #3). The official release also waits for the `store` /
  `profile` / `blog` reference apps.
- **Surface generator** — `scripts/surface.mjs --write/--check` to replace 37 hand-edited export
  maps and fail a subpath excluded by `files[]`. Optional, not a blocker. → `packages/TASKS.md`
- **Proof reports** — `scripts/proof.mjs --report` lists every component package and whether it
  carries an `inspect()` assertion (report-only first, gate once covered).

## Landed (newest first)

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
