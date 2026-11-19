# Logbook — one card

> Orientation only: read the cards, report them, ask which card. Open a card's detail doc
> **only** after the user picks it — never "to orient" (`AGENT_RULES.md` §13). Rewritten each
> session, newest on top. One card = one line + one pointer.

### 1. Restructure P0 — manifests tell the truth (uncommitted)

`scripts/edges.mjs` derives every `@aio-ui/*` edge from source and joins `npm run check` as
`check:edges`: 85 edges over 40 packages, `core`/`base` peer, `skeleton` never repeated. Proof: an
accordion tarball alone installed its whole closure in `temp/consumer` and type-checked.
**Open:** the rest of the restructure — P1 DOMRenderer folder + kit, P2 `app`→`core` at 0.2.4,
P3 styles as core dependency, P4 one-file `AioUI` bundle. Nothing is committed yet.
→ `docs/framework/TASK-restructure.md`

### 2. Release — separate modules from an orphan branch

`0.2.3` is live: tag, `v0.2.3/` on branch `releases` (checked out at `./releases`), jsDelivr 200;
`release.mjs` ships mode B by default — one tarball installs 8 separate modules (1.18 MB).
**Open:** release-page assets (owner, manual), `install/<pkg>.txt`.
→ `docs/framework/TASK-releases-branch.md`

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
