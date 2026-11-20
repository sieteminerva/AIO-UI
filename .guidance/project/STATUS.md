# Logbook — one card

> Orientation only: read the cards, report them, ask which card. Open a card's detail doc
> **only** after the user picks it — never "to orient" (`AGENT_RULES.md` §13). Rewritten each
> session, newest on top. One card = one line + one pointer.
>
> Batch 41 (2026-11-21): binding seam and the ViewFactory port are done and dropped from here.

### 1. `union` in `iContentSpec` — live (do this first)

Seven builders still use the `{ t: "any" }` escape, so only their `example` is validated. **Open:**
add `union` + `element` to `iContentSpec`, make `check()` pick the first fitting branch, narrow
`code-block`, `fab-menu`, `markdown`, `masonry`, `modal`, `product`, `rating`, and extend both
contract tests. Gate `npm run verify`; the detail doc ends with the release hand-off.
→ `docs/framework/TASK-content-union.md`

### 2. Release 0.2.4 — after the union card

Restructure at 0.2.4 landed (`07126a0`+): 39 packages, `@aio-ui/dom-renderer` ships alone, folders
match their builder word. `0.2.3` is live on `releases` (jsDelivr 200). **Open:** the bundled rewrite
(doc §2) and the four bundle artefacts — `release.mjs` / `publish-cdn.mjs` must place
`aio-ui{,.min}.{js,css}` at the branch root and name them in `registry.json`; then §5 +
`version.mjs --apply --version 0.2.4` → `verify:pkgs` → `release.mjs` → `publish-releases.mjs` →
`publish-cdn.mjs`. Implement up to `verify:pkgs`, then **stop and ask** — the owner cuts it.
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
