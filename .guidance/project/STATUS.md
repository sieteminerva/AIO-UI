# Logbook — three cards

> Orientation only: read the three lines, report them, ask which card. Open a card's detail doc
> **only** after the user picks it — never "to orient" (`AGENT_RULES.md` §13). Rewritten each
> session, newest on top. One card = one line + one pointer.

### 1. Release — separate modules from an orphan branch

`0.2.3` is live: tag, `v0.2.3/` on branch `releases` (checked out at `./releases`), jsDelivr 200;
`release.mjs` ships mode B by default — one tarball installs 8 separate modules (1.18 MB).
**Open:** release-page assets (owner, manual), `install/<pkg>.txt`.
→ `docs/framework/TASK-releases-branch.md`

### 2. Form — modules that never load without a shell

Landed b52–b53b: opt-in stack behind `@aio-ui/form/adapters`, degraded capabilities warn/throw with
a fix, `@aio-ui/form` depends on `@aio-ui/input`.
**Open:** nothing — kept only as the record behind card 1's bundle decision.
→ `docs/framework/TASK-form-modules.md`

### 3. Carried queue — the small fixes that keep §16 honest

`scripts/proof.mjs --report`; dead `ElementCreatedEventBus.relay` + stray `console.log` in
`DOMRenderer`; `#cleanupMap` never reset per `render()`.
→ `.guidance/project/framework.md` (`## Next`)

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
