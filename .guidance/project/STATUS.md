# Logbook — one card

> Orientation only: read the cards, report them, ask which card. Open a card's detail doc
> **only** after the user picks it — never "to orient" (`AGENT_RULES.md` §13). Rewritten each
> session, newest on top. One card = one line + one pointer.
>
> Batch 41 (2026-11-21): binding seam and the ViewFactory port are done and dropped from here.

### 1. Input normalisation — `create(schema)` + content-once

**A + B + C + D landed** (2026-11-21): the door is `create(schema)`, the registry wraps node→schema
by `builder`, the compensation unwraps are gone, no payload carries a `content` field any more, and
`section` root id/className come from config. **Open:** E — a declared content contract per builder;
start at the doc's `## Next — batch E`.
→ `docs/framework/TASK-input-normalisation.md`

### 2. Release 0.2.4 — HELD until normalisation lands

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
