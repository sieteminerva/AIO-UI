# Logbook — one card

> Orientation only: read the cards, report them, ask which card. Open a card's detail doc
> **only** after the user picks it — never "to orient" (`AGENT_RULES.md` §13). Rewritten each
> session, newest on top. One card = one line + one pointer.

### 1. Restructure landed at 0.2.4 (`07126a0`, unpushed)

`@aio-ui/app` and `kits/frameworks` are gone: `AioApp` lives in `core/src/app/` (+ `@aio-ui/core/app`),
`core` installs `styles`, manifests are derived from source by `check:edges`, and
`npm run build:bundle` emits the two-link `aio-ui{,.min}.{js,css}` pair (105 names / 37 packages).
Gate: `verify:pkgs` → 861 pass / 15 skip, 37 built, both example builds green.
**Open:** P1 (DOMRenderer folder + kit) deferred to P5; bundle artefacts are not wired into
`release.mjs`/`publish-cdn.mjs`; nothing is pushed.
→ `docs/framework/TASK-restructure.md` · `docs/releases/v0.2.4.md`

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
