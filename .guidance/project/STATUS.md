# Logbook — the cards

> Orientation only: read the cards, report them, ask which card. Open a card's detail doc
> **only** after the user picks it — never "to orient" (`AGENT_RULES.md` §13). Rewritten each
> session, newest on top. One card = one line + one pointer.
>
> Recent batches (newest first): **b76** core drops the input node types + docs say `content.options`
> · **b74** stage 3.3: form schema = input schema, examples migrated
> · **b73** input schema stage 3 (strict module keys + legacy door
> gone) · **b72** input schema stage 2 (per-type union +`create()` wiring) ·
> **b71** input schema split (stage 1 grouping) ·
> **b70** control set: idle edit/save half rebuilt + repeater delete floor ·
> **b69** v0.2.5 published to CDN · **b68** the eight missing package
> READMEs · **b67** publish-side followers · **b65–b66** per-package versions · **b64** registry regen to 37
> packages · **b63** this task doc · **b60–b62** session prompt opt-in, `release-doc.mjs`, `## Install`
> in every package README · **b57** Apps Script hosting · **b52–b59** shell mount point, tab seams.
> Older history: `git log --oneline`.

### 1. Input & form polish — not started; three defects before the release (framework band)

Owner-reported after b74/b76: **(A)** a form field's `.wide` / `span` share of a row is not
honoured in full (`FormLayout.ts` + `Form.css:38-63`); **(B)** `config.footer` is appended
(`Form.ts:661-666`, `@form>footer` → `.form-footer`) and no rule styles it; **(C)** the
`select`/`dropdown` popup is clipped near the viewport edge or inside `overflow: hidden` — fix by
CSS Anchor Positioning + Native Popover (`input.css` §5.2 line 440 `position-try-fallbacks: none`,
§10.3 `:1067`, `Dropdown/Dropdown.ts`), keeping `::picker(select)` and `.menu` visually identical.
Each item needs a measurement, not an eyeball.
**Open:** nothing started; the release waits for all three.
→ `docs/framework/TASK-INPUT-POLISH.md`

### 2. Input schema + legacy sweep — done, one release note owed (framework band)

b74 (`bf5b40c`) made a form field node the input schema `{ content, config }`; b76 closed the seams
it left: rajutan committed in its own repo (`1008e4f`), `API.md`/`FIELD-TYPES.md` now say
`content.options`, and `@aio-ui/core` no longer declares a field node — `iBasicInputNode`, its
duplicate `iFormGroupNode` and `InputBuilderConfigOptions` are gone, the four registry payloads
following the existing `input: any` door rule. `range` stays an attribute, pinned by
`FieldTypes.test.ts`. Gate: check + verify green (92 files, 997 pass, 1 skip).
**Open:** the three removed types were public — the next minor release note must list them.
→ `docs/framework/TASK-INPUT-LEGACY.md` · `docs/framework/TASK-INPUT-SCHEMA.md`

### 3. Release — the next minor waits on the polish (tooling band)

v0.2.5 is published and probed (`docs/releases/v0.2.5.md`). The next release is the one that ships
the polish above **and** the breaking note from b76 (three types removed from `@aio-ui/core`).
Owner orders the publish; `docs/live-cdn-repo.md` is the ritual.
→ `docs/releases/v0.2.5.md` · `.guidance/project/framework.md` §Next

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

- **v0.2.5 was published on the owner's order** (2026-11-24): branch `releases` and tag `v0.2.5`
  are pushed and probed 6/6. Only the optional GitHub Release asset upload needs `GITHUB_TOKEN`.
- Scratch is `temp/` (deletable whole); `releases/` is the branch worktree, not scratch.
