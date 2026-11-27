# TASK — pick order, confirm before the next change

Moved out of `packages/TASK.md` (b45 surface refactor, landed 2026-11-22). One live constraint,
nothing else pending.

## Open

- **Adapter pick order is runtime-detected.** The agreed order is **native → base → aio**. Confirm
  it before the next change inside this package; do not "improve" the detection order in passing.

## Context

The three flavours plus the form adapter were folded into the package root by the b45 refactor —
there is no `/adapters/*` door for the outside any more. Surface rules: `docs/framework/PUBLIC-API.md`.
