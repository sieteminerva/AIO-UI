# Logbook — one card

> Orientation only: read the cards, report them, ask which card. Open a card's detail doc
> **only** after the user picks it — never "to orient" (`AGENT_RULES.md` §13). Rewritten each
> session, newest on top. One card = one line + one pointer.
>
> Batch 43 (2026-11-21): `v0.2.4` published on `releases` + tag, mode B, bundle pair at the branch
> root. Batch 42: `union` + `element` landed in `iContentSpec`.

### 1. Official release — live, waiting on three references

`v0.2.4` is live (39 packages, mode B, jsDelivr 200 on registry + both minified files, raw tarball
200, checksums match). **Open:** the official release waits for the `store`, `profile`, `blog`
reference apps (`gallery` exists); the only manual pipeline step left is
`publish-release-assets.mjs` when the owner wants GitHub release assets. Facts, numbers and the
updated pre-flight checklist are in the release doc.
→ `docs/releases/v0.2.4.md` · `docs/live-cdn-repo.md` §9

### 2. Optional hardening — `check:exports`

`release.mjs` still derives subpaths with its own `subpathsOf()`. The planned `exports.json` +
`check:exports` gate (a subpath pointing at a file `files[]` excludes is a silent 404 today) is
unwritten; it is an improvement, not a blocker.
→ `docs/framework/TASK-releases-branch.md` §4

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
