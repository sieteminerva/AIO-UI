# TASK — input legacy sweep (core type · stale docs · `range`)

**Band:** Framework · **Claim:** board row `copilot b75` until the first code edit, then its own row ·
**Brief:** this file · **Status:** not started — a cold session can begin at Item 0.

## Why this file exists

b74 closed the input/form refactor: a field node **is** the input schema `{ content, config }`
(plus form-owned `condition` / `then`), the form adapter splits nothing, and `@aio-ui/form`
publishes `FormField` / `FormNode`. Gate: `verify` 996 pass / 1 skip (`bf5b40c`).

Three seams were outside that batch. They are small, independent, and each one still teaches the
old shape to somebody. Do them in this order.

## Item 0 — commit the rajutan app (other repository, not this one)

`examples/rajutan/` is its own repository (`.gitignore:15`), so the b74 migration sits in its
working tree uncommitted:

- `src/content/wizard.ts` — four group sets typed `iFormGroupNode`, fields wrapped in
  `{ content, config }`, `onClick: (_parent: HTMLElement, context: iInputActionContext)` handlers
  typed, plus the `style → view`, `className: "loading" → loading: true` and
  `data-max-upload: "1"` fixes.
- `src/Components/form-editor/FormEditor.ts` — `EditorField` (`{ content, config }`) replaced
  `iBasicInputNode`, `_toPayload` builds the two blocks, `#flattenPayload` reads both,
  `disableDefault` (a key nothing reads since b72) is gone.

Proof already taken: `npx tsc --noEmit -p examples/rajutan/tsconfig.json` → clean.
Commit there with its own message; nothing about it belongs in an AIO-UI commit.

## Item 1 — docs still say `config.options` (docs-only, ~10 minutes)

**Facts.** `packages/components/input/Attribute.ts:217` writes the resolved choice list into
`attrConfig.options`, and line ~224 passes `attrConfig` as `content` — so since b72 the list lands
in **`content.options`**. Three places still claim otherwise:

| File                                | Line | Says                                                    |
| ----------------------------------- | ---- | ------------------------------------------------------- |
| `docs/framework/API.md`             | 51   | `` `range` is echoed … resolved into `config.options` `` |
| `docs/framework/FIELD-TYPES.md`     | 38   | `range?: "SegmentRange", // … resolved into config.options` |
| `docs/framework/FIELD-TYPES.md`     | 60   | table row: `range` … whose values become `config.options` |
| `docs/framework/FIELD-TYPES.md`     | 62   | table row: `config.options` — resolved option list       |

**Do.** Rewrite those four spots to `content.options`; keep the `range` wording (Item 3 decides
where `range` itself lives — do not pre-empt it, just say the list lands beside the field's data).

**Acceptance.** `grep -rn "config.options" docs packages --include=*.md` matches only the one
historical sentence in `packages/components/input/README.md:70` (which says the bag is *gone*).
Gate: `md-only` — no build.

## Item 2 — retire `iBasicInputNode` from `@aio-ui/core` (API change — decide first)

**Facts (file:line).**

- `packages/core/src/types/content.ts:137` — the flat node (`type`, `title`, `range`,
  `[key: string]: unknown`), a second truth next to `InputSchema` from `@aio-ui/input`.
- `packages/core/src/index.ts:120` — re-exported publicly.
- `packages/core/src/types/registry.ts:7` (import), `:49` (`form`), `:66` (`input-controls`),
  `:68` (`dropdown`), `:69` (`input-picker`).
- `packages/core/src/types/content.ts:73` — `iNodeContent.group: Array<iBasicInputNode | …>`.
- `packages/core/src/types/content.ts:67` — core also declares its **own** `iFormGroupNode`,
  duplicating the one `@aio-ui/form` now exports.

**The precedent already in the file.** `registry.ts:57-58` types `input` as `any` with a one-line
reason ("core cannot import a component package; the concrete type is enforced at that package's
door"). The same argument applies to every field payload.

**Options.**

- **A (recommended).** Mirror the `input: any` precedent for the four registry entries, retype
  `iNodeContent.group`, then delete `iBasicInputNode` **and** core's `iFormGroupNode` from
  `content.ts` and `index.ts`. Type-only removal, no runtime change, but it is a public API
  removal → it needs a version decision (release note under whatever minor follows `0.2.5`).
- **B (cheapest).** Keep both interfaces with `@deprecated` + a pointer to `InputSchema<InputType>`.
  Removes the confusion for a reader, not for the compiler — two truths remain.

**Decide before editing:** A or B, and if A, which release carries it.

**Acceptance (A).** `grep -rn "iBasicInputNode" packages docs examples --include=*.ts --include=*.md`
is empty outside this task file; `node scripts/api.mjs --write` + `node scripts/catalogue.mjs
--apply` regenerated; `npm run check` green; `npm run verify` green once.

**Traps.** `iNodeContent.group` is the *page* node shape — check who passes form fields into it
(`examples/demo`, gallery) before changing its type, or an example breaks in the browser while the
compiler stays quiet. Core never imports a component package: keep the `any` + reason comment.

## Item 3 — decide where `range` lives (needs one read of `orchestrator/`)

**Facts.** `InputAttributeType` still offers `"range"` (`Attribute.ts:36`) for the Google-Sheets
header pipeline. b73 removed `range` from `INPUT_STRUCTURAL_KEYS`, so a header `range` now lands in
`config.attributes` as a plain DOM attribute (`range="…"`), and nothing in the renderer reads it.

**Do this first.** `grep -rn "\.range\b\|sheetRange" orchestrator packages --include=*.ts`.

- If the generator reads it → declare it: `content.range?: string` (it is data — a sheet column
  set — not behaviour), then add it to `INPUT_STRUCTURAL_KEYS` and to `iInputContentNode`.
- If nothing reads it → keep it an attribute and say so in `FIELD-TYPES.md` (`range` is echoed onto
  the control, not resolved), or remove the property from the attribute editor.

**Acceptance.** One of the two paths lands with a test in `packages/components/input/__tests__/`
that builds the header → schema and asserts where `range` ended up.

## Traps paid for already (do not rediscover)

- `config.selectors` on a form field is **builder** config: `Input.FormAdapter.renderField()`
  lifts it into the `InputBuilder` constructor. Never add `selectors` to `iInputConfigNode`.
- `INPUT_STRUCTURAL_KEYS` decides what the attribute scan ignores — a behaviour key missing from it
  will be reported as a stray attribute.
- `npm run typecheck:examples` covers **demo + gallery only**. `examples/rajutan` is its own repo;
  run `npx tsc --noEmit -p examples/rajutan/tsconfig.json` by hand.
- `temp/*.mjs` (the codemods from b74) is scratch, deletable whole. Never cite it as a build step.

## Gate ladder

Item 1 → `md-only`. Item 2 → `npm run check` (API surface + api-map + catalogue) then `verify`
once. Item 3 → `check` + the new test file. A release only when the owner orders it.
