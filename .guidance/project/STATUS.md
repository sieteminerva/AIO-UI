# Logbook — the cards

> Orientation only: read the cards, report them, ask which card. Open a card's detail doc
> **only** after the user picks it — never "to orient" (`AGENT_RULES.md` §13). Rewritten each
> session, newest on top. One card = one line + one pointer.
>
### No open cards

All previously queued work is closed. To start a card, take the owner's request (or the band
file's `## Next`), record it here as one summary line plus a link that resolves in the commit
that lands it.

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

- **`v0.2.7` is published** (2026-11-26): 38 packages (was 37 — `@aio-ui/header` joins), branch
  `releases` @ `3d15f1a`, tag `v0.2.7`, mode B, 1.39 MB, `check:live` 6/6. Carries the PascalCase
  class-file rename. → `docs/releases/v0.2.7.md`
- Scratch is `temp/` (deletable whole); `releases/` is the branch worktree, not scratch.
