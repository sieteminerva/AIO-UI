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

- **v0.2.6 is the published tag** (2026-11-25): branch `releases` at `f255d82`, `check:live` 6/6.
  Package versions already read `0.2.7`; `v0.2.7` has **not** been published yet.
- Scratch is `temp/` (deletable whole); `releases/` is the branch worktree, not scratch.
