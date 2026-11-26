# Logbook — the cards

> Orientation only: read the cards, report them, ask which card. Open a card's detail doc
> **only** after the user picks it — never "to orient" (`AGENT_RULES.md` §13). Rewritten each
> session, newest on top. One card = one line + one pointer.

### 1. Form multistep + action seam + icon channel (b109, landed)

Multistep no longer assumes a step sits at schema index 0 (`attach()` mounts the smallest held
index, `isFirst`/`isLast` come from the steps that exist, one-step form gets Submit); the input +
actions composite keeps one hairline at the seam and its outer radius (radius/seam tokens declared,
blanket `border-radius: 0 !important` gone). `packages/styles/icons` is now a real channel:
`@aio-ui/styles/icons.css` links `imgs/*.svg` instead of inlining, `files` ships the folder so it
has its own CDN path, and `src/icon.css` dropped its 83 duplicate inline glyphs (238 kB → 13 kB).
Proved: `npm run verify` → 1136 pass; browser numbers 9.68px/0/9.68px/0 with a `rgba(0,0,0,0)`
seam. **Open:** a release still has to prove the bundle carries `imgs/`.
→ `packages/styles/README.md` · `packages/components/form/adapters/Multistep.ts`

### 2. Icons page + compact code panel (b108, landed)

New `#icons` docs route (tab Display · Usage · API) driven by `packages/styles/README.md`;
Display is 89 square tiles, each a compact `code-block` with a copy action. `CodeBlock` gained
`config.appearance = normal | compact`, and its root now resets the global `section` padding it
inherited from `@aio-ui/styles`. Proved: `npm run verify` → 1114 pass; measured 89/89 tiles square,
`spinner` stays static inside its tile, Usage/API render the README. **Open:** none.
→ `packages/components/code-block/README.md` · `packages/styles/README.md`

### No other open cards

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
