# Logbook — the cards

> Orientation only: read the cards, report them, ask which card. Open a card's detail doc
> **only** after the user picks it — never "to orient" (`AGENT_RULES.md` §13). Rewritten each
> session, newest on top. One card = one line + one pointer.
>
> Recent batches (newest first): **b106** header polish closed — `appearance` shapes + two ink
> doors · **b105** header icon placement (`iconPosition`) · **b104** toggle field geometry ·
> **b100** `@aio-ui/header` landed — family bumped to 0.2.7 · **b99** row layout, equal column
> shares · **b96–b98** PascalCase class files, catalogue drift · **b95** v0.2.6 published ·
> **b86–b94** colour token pass · **b76–b84** input schema + form ink. Older: `git log --oneline`.

### 1. Header — polish queue closed (framework band)

b106: `config.appearance` = `normal | bordered | block | editorial` (a shape, never a palette);
`config.color` grew `block`/`border` and now writes six `--header-*` tokens; `.meta` shares the
title column beside a `left`/`right` icon and the glyph centres on the 3-line stack. The general
door `config.selectors[key].color` lives in `Base._applyNodeAttributes` (inline `color`, beats
the sheet). **Open:** no browser measurement of the three new shapes, and the demo has no
`appearance` control yet.
→ `docs/framework/TASK-header.md`

### 2. Row layout — toggle shell + equal column shares (framework band)

b99: `Form.css` splits `display` off the row's child block, so a toggle child keeps
`display: grid` and its label sits beside the switch; `Input.css` §8 matches a direct
`:has(> .switch.control)` (a row holding a toggle no longer becomes a grid) and restores the
grid for a toggle nested in a group. `column` is now the default share too: an undeclared
`wide` takes an equal slice of its line. **b104:** a toggle field no longer pins its own height.
**b106:** the header's own polish queue is closed.
→ `docs/framework/TASK-header.md` · `docs/framework/TASK-color-tokens.md`

### 3. Class files are PascalCase — sheets, specifiers, builder (framework band)

`Input.css`, `InputControls.css`, `IdAddress.css` and `IdAddressBuilder.ts` replaced the kebab
names, and every sheet specifier mirrors its file. The Linux-only failures are closed (b96 test
literal, b98 catalogue drift). **Open:** v0.2.7 must carry the migration note (v0.2.6 still
serves the lowercase names) and `examples/rajutan` needs its own commit.
→ `docs/framework/COMPONENT-CONVENTIONS.md` (naming table) · `docs/live-cdn-repo.md` §3.4

_Retired from the logbook (batch 57 landed, still live): rajutan hosting → `orchestrator/mechanism.md`
§1–§11 · `.guidance/project/generator.md` §Next._

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

- **v0.2.6 was published** (2026-11-25): branch `releases` at `f255d82`, tag `v0.2.6`,
  `check:live` 6/6. Only the optional GitHub Release asset upload needs `GITHUB_TOKEN`. Open:
  the T3 colour taste pass (`docs/releases/v0.2.6.md`) and the picker-upward re-check.
- **Pages is green** (run #53, `6a33045`): red since #46 on a Windows-only path difference
  (b96), then a formatter blank line (b98). `temp/case-guard.cjs` replays the case-sensitive FS.
- Scratch is `temp/` (deletable whole); `releases/` is the branch worktree, not scratch.
