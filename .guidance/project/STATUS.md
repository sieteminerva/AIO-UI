# Logbook — the cards

> Orientation only: read the cards, report them, ask which card. Open a card's detail doc
> **only** after the user picks it — never "to orient" (`AGENT_RULES.md` §13). Rewritten each
> session, newest on top. One card = one line + one pointer.

### 1. Icon channel + the note contract + one tab id pair (b112/b113, landed)

The `<i>` behaviour lives in `src/components.css` and `icons.css` is links only (112 glyphs,
`close` retired for `cross`); the field schema is one name again — `iFieldNode`, with
`AnyInputSchema` gone — and the Apps Script note is public as `iAppsScriptFieldNode` (`range`
is a named range, allowed only on the types that choose; `config.sheet`/`cell`/`skipped` are the
storage address). A tab's button and panel now share one id pair, `onTabChanged`/
`onContentLoaded` are fed, `active` falls back to the first tab, and a button carries ONE
`btn-label` span with the record's `title` as its tooltip (the second span was always empty).
`copy` copies a one-control scope's value (not its payload), and `config.minHeight` finally lands
on the form as `--form-min-height` instead of a `@container` wrapper that is never rendered.
→ `packages/styles/icons/README.md` · `docs/framework/FIELD-TYPES.md` ·
`packages/components/tab/README.md` · `docs/framework/INPUT-ACTIONS.md`

### 2. v0.2.8 published — the glyphs sit beside the bundled CSS (b110, landed)

The bundled sheet links its 107 glyphs (`url("./imgs/x.svg")`) instead of inlining them, so `imgs/`
travels with the four bundle files and `registry.bundle.imgs` records it. Two defects were in the
way: every Vite asset was named `aio-ui.css`, so the last SVG overwrote the stylesheet (the artefact
was 8 kB of raw `<svg>`), and `base: "/"` rewrote links to the domain root. Proved: `npm run verify`
→ 1137 pass / 1 skip; `aio-ui.css` 328.4 kB / `min.css` 173.7 kB (was 530.1 / 379.2) with 107 links;
the published CSS answers `200` with 107 relative links and `imgs/add-cart.svg` `200
image/svg+xml`; `check:live` **7/7**. Also learned: a partial version bump repacks every dependent at
the old number (the dependency URL carries the tag), so 0.2.8 shipped as a whole-family bump.
**Open:** package README `install` blocks still say `0.2.6` — `release-doc --readme --apply` was
never run for 0.2.7/0.2.8.
→ `docs/releases/v0.2.8.md` · `scripts/build-bundle.mjs`

### 3. Open task notes — the queue b111 left behind

Everything landed through b111, so the debt now lives in five `TASK.md` files rather than here:
`scripts/TASK.md` (surface generator + the last two wildcard rows), `packages/styles/TASK.md`
(**T3 taste pass — owner reviews the colours**, plus the picker-upward re-check),
`packages/components/header/TASK.md` (demo control for `appearance`, `selectors[key].color` audit),
`packages/components/id-address/TASK.md` (confirm the native → base → aio pick order before the
next change), `examples/demo/src/ThemeConsole/TASK.md` (drawer height, mixer persistence, 2 more).
Plus the one item card 1 carries: package README `install` blocks still say `0.2.6`.
→ `scripts/TASK.md` (the rest are beside their package)

### 4. Form multistep + action seam + icon channel (b109, landed)

Multistep no longer assumes a step sits at schema index 0 (`attach()` mounts the smallest held
index, `isFirst`/`isLast` come from the steps that exist, one-step form gets Submit); the input +
actions composite keeps one hairline at the seam and its outer radius. `packages/styles/icons` is a
real channel: `icons.css` links `imgs/*.svg`, the folder ships, `src/icon.css` dropped its 83
duplicate inline glyphs (238 kB → 13 kB). Proved: `npm run verify` → 1136 pass / 1 skip; measured
input radii `9.68/0/9.68/0` px with a `rgba(0,0,0,0)` seam.
→ `packages/styles/icons/README.md` · `packages/components/form/adapters/Multistep.ts`

### No landed card without a pointer

A card leaves this page only when its detail doc carries the rest. To start a card, take the
owner's request (or a `TASK.md` above), record it here as one summary line plus a link that
resolves in the commit that lands it.

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

- **`v0.2.8` is published** (2026-11-27): 38 packages, branch `releases` @ `be9be5b`, tag
  `v0.2.8`, mode B, 1.44 MB, `check:live` 7/7. The branch root now carries `imgs/` beside
  `aio-ui.css`. → `docs/releases/v0.2.8.md`
- Scratch is `temp/` (deletable whole); `releases/` is the branch worktree, not scratch.
