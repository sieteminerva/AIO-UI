# Framework — status (`packages/**`, `examples/demo/**`)

Band rules: `packages/AGENTS.md` → `examples/demo/AGENTS.md`.
Why / stages: `.guidance/plan-framework.md`. Engineering rules:
`docs/framework/COMPONENT-CONVENTIONS.md`. Index: `STATUS.md`.

## Active (max 3)

| #   | Task                     | State       | Gate                                                                                                    |
| --- | ------------------------ | ----------- | ------------------------------------------------------------------------------------------------------- |
| 1   | Theme console view (fab) | in progress | `examples/demo/src/ThemeConsole/TASKS.md` — view composed, gate green; open: page-only popover sections |
| 2   | Inspect surface (b43)    | in progress | `inspect()` + `inspectPage()` green; open: dead relay removal, `#cleanupMap` reset                      |
| 3   | Release automation (b44) | next        | `docs/framework/TASK-release-automation.md` — `session.mjs end` hang fix, then `release-doc.mjs`        |

## Next

- **Release automation** — make `session.mjs end` prompts opt-in (the winpty `node` alias makes
  `isTTY` true and blocks agents), then build `scripts/release-doc.mjs` so every release note
  generates and probes its CDN table. → `docs/framework/TASK-release-automation.md`
- **Official release** — waits for the `store` / `profile` / `blog` reference apps (`gallery` is
  the only one). `v0.2.4` itself is live; the post-refactor 37-package tree is regenerated and
  **not published** (STATUS card #2).
- **Surface generator** — `scripts/surface.mjs --write/--check` to replace 37 hand-edited export
  maps and fail a subpath excluded by `files[]`. Optional, not a blocker. → `packages/TASKS.md`
- **Proof reports** — `scripts/proof.mjs --report` lists every component package and whether it
  carries an `inspect()` assertion (report-only first, gate once covered).

## Landed (newest first)

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
