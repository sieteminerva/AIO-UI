# Logbook — one card

> Orientation only: read the cards, report them, ask which card. Open a card's detail doc
> **only** after the user picks it — never "to orient" (`AGENT_RULES.md` §13). Rewritten each
> session, newest on top. One card = one line + one pointer.

### 1. Binding seam: `model()` + `paint()` + `data-bind` mirror

A builder declares `model()` once; the base wires every scope it hands to `initialize()`.
`BaseAdapters/Binding.ts` owns `wire`/`unwire`/`rescan`/`dispose` — one delegated listener pair
per scope, one effect per instance — and `data-bind` is the only binding attribute (a plain
non-proxy model is refused with one warning). `ColorTheme` migrated, Guide › Data Binding added.
**Open:** input normalisation (`model()` defaults to `data`), `data-bind` path validation,
`bindState()` has no consumer left. Release 0.2.4 waits for normalisation.
→ `packages/base/src/BaseAdapters/Binding.ts` · `examples/demo/src/pages/data-binding.ts`

### 2. ViewFactory (Semantic UI) ported to `@aio-ui` — scratch only

`.archives/ViewFactoryAio.js` (gitignored) mirrors `.archives/ViewFactory.js` method for method;
`generateInputAttributes()` is `InputAttributeBuilder.create()`. `config.style: "action"` →
`"actions"` + `config.actions`; `Attribute.ts` declares `actions` as a config-bearing row
(committed). Only the auto-translate listener is `[TODO]` (`condition` + `cascading`).
→ `/memories/session/c61.md` · `temp/vf-aio.smoke.test.js`

### 3. Release 0.2.4 — HELD until normalisation lands

Restructure landed at 0.2.4 (`07126a0`+): 39 packages, `@aio-ui/dom-renderer` ships alone,
component folders match their builder word; `0.2.3` is live on the `releases` branch with
jsDelivr 200. **Open:** the four bundle artefacts are not wired into `release.mjs` /
`publish-cdn.mjs`; release-page assets stay owner-manual.
→ `docs/framework/TASK-releases-branch.md` · `docs/releases/v0.2.4.md`

## Map

| Need                      | File                                            |
| ------------------------- | ----------------------------------------------- |
| Framework queue + landed  | `.guidance/project/framework.md`                |
| Gallery / generator queue | `.guidance/project/gallery.md` · `generator.md` |
| Process rules             | `.guidance/AGENT_RULES.md`                      |
| Component + env rules     | `docs/framework/COMPONENT-CONVENTIONS.md`       |
| Release + publish ritual  | `docs/live-cdn-repo.md`                         |
| Live writers (lock)       | `.guidance/project/AGENTS.md`                   |

## Cross-project

- Official release waits for the `store`, `profile`, `blog` references (`gallery` exists).
- Tree, packages and last tag are at **`0.2.3`** (pre-release).
- Scratch is `temp/` (deletable whole); `releases/` is the branch worktree, not scratch.
