# Logbook — the cards

> Orientation only: read the cards, report them, ask which card. Open a card's detail doc
> **only** after the user picks it — never "to orient" (`AGENT_RULES.md` §13). Rewritten each
> session, newest on top. One card = one line + one pointer.
>
> Recent batches (newest first): **b98** catalogue drift from a formatter blank line ·
> **b97** class files are PascalCase — CSS specifiers renamed ·
> **b96** Pages workflow red on Linux — `Input.css` vs `input.css` ·
> **b95** v0.2.6 published (colour pass + closed input surface) ·
> **b94** colour-literal lint (T5) · **b93** cyberpunk theme pins
> dark mode · **b92** Article/Table/Message/Tab palettes → `--app-*` · **b91** select rests on the
> input border hue · **b90** picker
> stops guessing its side · **b89** one source for popup + field box · **b88** popup = one sheet ·
> **b87** form ink 4.5:1 + theme-aware code paper · **b86** one `light-dark()` root · **b84**
> UI-safe stroke · **b83** inline-code chip · **b82** text contrast · **b81** popup flip +
> form footer · **b80** repeater `removable`/`hideOnSource` · **b79** `wide` is a percentage of the
> row · **b78** a container honours the share (group + cascade) · **b76** core drops the input node
> types · **b74** stage 3.3: form schema = input schema, examples migrated · **b73** input schema
> stage 3 (strict module keys + legacy door gone) · **b72** input schema stage 2 (per-type union +`create()` wiring) · **b71** input schema split (stage 1 grouping) · **b70** control set: idle
> edit/save half rebuilt + repeater delete floor · **b69** v0.2.5 published to CDN · **b68** the
> eight missing package READMEs · **b67** publish-side followers · **b65–b66** per-package versions.
> Older history: `git log --oneline`.

### 1. Class files are PascalCase — sheets, specifiers, builder (framework band)

`Input.css`, `InputControls.css`, `IdAddress.css` and `IdAddressBuilder.ts` replaced the kebab
names, and every sheet specifier mirrors its file (`@aio-ui/input/{Input,Dropdown,FileUploader,
InputControls,InputPicker}.css`, `@aio-ui/id-address/IdAddress.css`). The Linux-only failures are
closed: b96 fixed the test literal, b98 the catalogue drift. **Open:** v0.2.7 must carry the
migration note (v0.2.6 still serves the lowercase names) and `examples/rajutan` needs its own
commit. → `docs/framework/COMPONENT-CONVENTIONS.md` (naming table) · `docs/live-cdn-repo.md` §3.4

### 2. Colour tokens — T1–T5 shipped in v0.2.6 (framework band)

T1 (one `light-dark()` root + mask spinner + derived skeleton), T2 (form path ink/border,
theme-aware code paper, popup = one sheet with the control), T3 (Article/Table/Message/Tab
palettes → app tokens, Carousel overlays marked), T4 (cyberpunk pins dark; horizontal stays
neutral as a layout-only theme) and T5 (colour-literal lint + fab-menu shade fix) landed b86–b94
and shipped in **v0.2.6** (b95). **Open:** only the **T3 taste pass** (owner points at colours —
taste, not algorithm) and a picker-upward re-check when a tab is visible; the
`masonry/README.md` spinner snippet is fixed (b95). Restore checkpoint: tag
`color-pre-full-2026-11-25` / branch `color-restore-pre-full` (547973e).
→ `docs/framework/TASK-color-tokens.md`

### 3. Release — `v0.2.6` published (tooling band)

**Published 2026-11-25** (b95): whole family at `0.2.6`, branch `releases` at `f255d82`, tag
`v0.2.6`, `check:live` 6/6 → `200`, package probes `200`, checksums byte-identical. The note lists
the three breaking removals (core field node types, `span`, repeater floor). **Open:** only the
optional GitHub Release asset upload (needs `GITHUB_TOKEN`), and the official release still waits
for `store` / `profile` / `blog`. → `docs/releases/v0.2.6.md` · `docs/live-cdn-repo.md`

**Pages is green again** (run #53, `6a33045`): red since #46 on a Windows-only path difference
(b96), then on a formatter blank line inside the install block (b98). `temp/case-guard.cjs`
replays a case-sensitive FS locally; promote it to `scripts/` if the class of failure returns.

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

- **v0.2.6 was published on the owner's order** (2026-11-25): branch `releases` at `f255d82` and tag
  `v0.2.6` are pushed; `check:live` 6/6. Only the optional GitHub Release asset upload needs
  `GITHUB_TOKEN`.
- **v0.2.5 was published** (2026-11-24): branch `releases` and tag `v0.2.5` pushed and probed 6/6.
- Scratch is `temp/` (deletable whole); `releases/` is the branch worktree, not scratch.
