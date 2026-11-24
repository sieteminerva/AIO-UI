# Logbook — the cards

> Orientation only: read the cards, report them, ask which card. Open a card's detail doc
> **only** after the user picks it — never "to orient" (`AGENT_RULES.md` §13). Rewritten each
> session, newest on top. One card = one line + one pointer.
>
> Recent batches (newest first): **b84** UI-safe stroke · **b83** inline-code chip ·
> **b82** text contrast · **b81** popup flip + form footer · **b80** repeater
> `removable`/`hideOnSource` · **b79** `wide` is a percentage of the row · **b78** a container
> honours the share (group + cascade) · **b76** core drops the input node types
> · **b74** stage 3.3: form schema = input schema, examples migrated
> · **b73** input schema stage 3 (strict module keys + legacy door
> gone) · **b72** input schema stage 2 (per-type union +`create()` wiring) ·
> **b71** input schema split (stage 1 grouping) ·
> **b70** control set: idle edit/save half rebuilt + repeater delete floor ·
> **b69** v0.2.5 published to CDN · **b68** the eight missing package
> READMEs · **b67** publish-side followers · **b65–b66** per-package versions · **b64** registry regen to 37
> packages · **b63** this task doc · **b60–b62** session prompt opt-in, `release-doc.mjs`, `## Install`
> in every package README · **b57** Apps Script hosting · **b52–b59** shell mount point, tab seams.
> Older history: `git log --oneline`.

### 1. Colour tokens — top priority before v0.2.6 (framework band)

Root + per-component colour is being rebuilt so light / dark / colour-theme all read: one
`light-dark()` root, a UI-stroke strength (`--app-primary-ui` / `--app-accent-ui`), ink-derived
chips. Landed b82–b84 (text cap, inline-code chip, 3:1 stroke). **Open:** T1 root rewrite, T2 form
path, T3 Article/Table/Message, T4 theme `data-mode`, T5 literal lint. Restore checkpoint: tag
`color-pre-full-2026-11-25` / branch `color-restore-pre-full` (547973e).
→ `docs/framework/TASK-color-tokens.md`

### 2. Release — everything landed, waiting on the owner's order (tooling band)

Input & form work is closed (b76/b78/b79/b80/b81). **Open:** the next minor lists the removed
`@aio-ui/core` types and the `span` removal; owner orders the publish. Colour tokens must land
first (card 1). Owner orders; `docs/live-cdn-repo.md` is the ritual.
→ `.guidance/project/framework.md` §Next · `docs/releases/v0.2.5.md`

### 3. Theme console view (fab) — in progress (framework band)

View composed, gate green; open: page-only popover sections.
→ `examples/demo/src/ThemeConsole/TASKS.md`

_Retired from the logbook (batch 57 landed, still live): rajutan hosting → `orchestrator/mechanism.md`
§1–§11 · `.guidance/project/generator.md` §Next._

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

- **v0.2.5 was published on the owner's order** (2026-11-24): branch `releases` and tag `v0.2.5`
  are pushed and probed 6/6. Only the optional GitHub Release asset upload needs `GITHUB_TOKEN`.
- Scratch is `temp/` (deletable whole); `releases/` is the branch worktree, not scratch.
