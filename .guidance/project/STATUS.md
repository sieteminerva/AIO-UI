# Logbook — the cards

> Orientation only: read the cards, report them, ask which card. Detail docs open only after the
> user picks (`AGENT_RULES.md` §13). Newest on top; one card = one line + one pointer.

### 1. Open task notes — the queue b111 left behind

The only open card: everything through b111 landed, so the debt sits in five `TASK.md` files —
`scripts/TASK.md` (surface generator + the last two wildcard rows), `packages/styles/TASK.md`,
`packages/components/header/TASK.md` (demo control for `appearance`, `selectors[key].color`
audit), `packages/components/id-address/TASK.md` (native → base → aio pick order), and
`examples/demo/src/ThemeConsole/TASK.md` (drawer height, mixer persistence, 2 more).

**The one item that needs a person, not an agent:** finalising the CSS tokens per component.
T1–T5 already shipped in `v0.2.6` (b82–b94): one `light-dark()` root, two brand strengths (fill
vs `-ui` stroke), a 4.5:1 ink floor, and a lint test that fails on any raw colour literal. So the
plumbing works — every sheet reads `--app-*` and nothing hardcodes a hex any more. What is left is
not code. Nobody has actually sat with each component and said "this grey is right" or "this one
is off". That verdict cannot be tested, only looked at, and the eyes are the owner's. Until then
the tokens are _technically_ final but not _agreed_ — which is exactly why they stay on this
queue instead of the landed list.
→ `packages/styles/TASK.md` (the others sit beside their package)

### Landed — one line each, prose in `.guidance/project/framework.md`

- **v0.2.9** published — the b112/b113 tree on the CDN, `v0.2.8` left as served → `docs/releases/v0.2.9.md`
- **b112/b113** icon channel + `iFieldNode` + one tab id pair → `packages/styles/icons/README.md` · `docs/framework/FIELD-TYPES.md`
- **v0.2.8** published, glyphs beside the bundled sheet → `docs/releases/v0.2.8.md`
- **b109** form multistep + action seam → `packages/components/form/adapters/Multistep.ts`

_No landed card without a pointer: the prose lives in its doc and the commit that landed it._

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

- **`v0.2.9` is published** (2026-11-28): 38 packages, branch `releases` @ `0282f4e`, tag
  `v0.2.9`, mode B, 1.44 MB, `check:live` 7/7. `v0.2.8` stays as served (jsDelivr immutable).
  → `docs/releases/v0.2.9.md`
- Scratch is `temp/` (deletable whole); `releases/` is the branch worktree, not scratch.
