# TASK — input schema (content / config split)

**Band:** Framework · **Claim:** board row `copilot b72` (this file is its checkpoint) ·
**Brief:** `packages/components/input/TASK.md`

## Handoff — read this first

**State:** stage 1 (`a05d408`, committed) and stage 2 (b72, **edited, not committed**) are done.
Tree: 19 files modified + `packages/components/input/TASK.md` untracked (the owner's brief — commit
it with the batch). Last gate run: `npm run verify` **green** (91 files, 992 pass, 1 skip).

**First action of the next session:** `git status --short`, then commit b72 with the shape in
`AGENT_RULES.md` §15 if it is still uncommitted — the message already sketched:

    feat(input): narrow the field schema per type and wire view/error/loading

**Then** §Stage 3. Do **not** re-read the package: every anchor below is current.

**Traps proven in this batch (do not rediscover):**

- `create()` has two overloads. The base-shaped one (`{ content?: any }`) accepts *anything*, so a
  bad call silently picks it. Type proofs therefore assert on `InputSchema<T>` variables, never on
  `create(...)` arguments — and an unused `@ts-expect-error` fails `tsc`.
- `view` keeps a `(string & {})` tail, so a wrong word for the wrong owner is *autocomplete-wrong*,
  not rejected. Closing that is stage 3 step 1.
- `resolvePayload` mirrors the config bag onto the payload **fill-only**. A flat default
  (`required: false`) shadows `config.required` — that bug was live in the first draft.
- `packages/components/input/input.css` is tracked **lowercase**; on Windows `Input.css` is the same
  file, on CI it is not.
- `dist/**` was not rebuilt (releases rebuild).
- `docs/framework/api-map.json` and `docs/framework/catalogue.json` are generated:
  `node scripts/api.mjs --write` · `node scripts/catalogue.mjs --apply`.

## Stage 3 — execute in order

### 3.1 Strict per-type module keys

`InputSchema.ts` only narrows `options`/`checked`/`view`/`shape`/`column`/`inputmode`. The brief
(`packages/components/input/TASK.md` §2) wants the *module* bag split too, so a `file` config
offers only uploader keys.

1. Split `iInputModuleConfig` into owner types in `InputSchema.ts`:
   `iInputActionsSettings` (`actions`, `popover`), `iInputDropdownSettings` (`apiUrl`,
   `debounceDelay`, `onSelect`, `onMultiChange`, deprecated `dropdown` blob),
   `iInputPickerSettings` (`expanded`, `searchable`), `iInputFileSettings` (`thumbnail`,
   `maxUpload`, `maxFileSize`, `groupUnallowed`, `csv`, and move `onFileSelected` here from
   `iInputEvents`).
2. Compose them per type in `iInputConfigOf<T>`:
   `T extends "file" ? iInputFileSettings : T extends "dropdown" ? iInputDropdownSettings :
   T extends "picker" ? iInputPickerSettings : {}` plus `iInputActionsSettings` only where the
   controls module can act (`actions` is legal on every type today — decide: keep it universal or
   restrict to `actions`/`text`/`number`; **ask the owner before narrowing `actions`**).
3. Readers are already `field.config.*` in all four modules — no runtime change expected; only
   `FileUploader` needs `onFileSelected` moved from `config.onFileSelected` (unchanged key).
4. Proof: extend `packages/components/input/__tests__/Input.test.ts`,
   describe `input schema door (content / config)` with `@ts-expect-error` on
   `InputSchema<"text">` carrying `maxUpload`, and a positive `InputSchema<"file">` with it.

### 3.2 Drop the legacy door

1. `packages/components/form/Input.FormAdapter.ts:~55` is the only in-repo caller sending a flat
   node (`create({ content: input })` with `input` = a form field node). Rewrite it to send
   `{ content: { type, id, name, label, placeholder, value, checked, options }, config: { …behaviour } }`;
   `condition` / `then` stay on the form side (locked decision above).
2. `packages/components/input/Input.ts`: delete the base-shaped `create` overload, the
   `config: schema.config ?? content.config` fallback, the `config.options` lift and the `title`
   label alias in `resolvePayload`; drop the fill-only mirror loop and read `this.#input.config`
   only. Keep `iInputField` as `iInputContentNode & { config?: iInputConfigNode }`.
3. `InputSchema.ts`: delete `iInputDiscardedKeys` (and the stage-1 header paragraph that explains
   it). `FieldTypes.ts`: drop the legacy entries from `INPUT_STRUCTURAL_KEYS` that no longer exist
   (`title`, `class`, `className`, `style`, `range`, `createEventListener`, `icon`, `textContent`,
   `field`, `picker`) once nothing reads them.
4. Tests: `__tests__/*` still call `.create({ content: flat })` in helpers — migrate them, and the
   legacy-flat pin in `Input.test.ts` ("still renders a legacy flat node") becomes the new shape.

### 3.3 Examples (separate batch)

`examples/demo/**`, `examples/gallery/**`, `examples/rajutan/**` are outside `tsconfig`; migrate
them last, after 3.2 lands, in one batch of their own.

## Done (stage 1)

`packages/components/input/InputSchema.ts` (type-only, not imported yet):

- CONTENT: `iInputIdentity`, `iInputText`, `iInputValue`, `iInputChoices` → `iInputContent`.
- CONFIG: `iInputConstraint`, `iInputState`, `iInputLayout`, `iInputEvents`, `iInputModuleConfig`
  → `iInputConfig`; resolved internal shape `iInputField = iInputContent & iInputConfig`.
- Named view types: `InputFileViewType`, `InputDropdownViewType`, `InputPickerViewType`,
  `InputToggleViewType`, `InputToggleShapeType`, `InputViewType`.
- `iInputDiscardedKeys` — keys that leave the field schema, each with `@deprecated` + reason.

## Decisions (locked — do not re-open)

- **Rule:** content = instance data (identity, value, choices, readable text); config = rules,
  state, layout, callbacks, module settings.
- **`view`** replaces old `style` (dropdown/toggle) + uploader `view`; one word per type. Each
  per-type schema variant narrows it to its owner type.
- **`className`** removed → per-field `config.selectors["@field"].className` (each field is its
  own builder instance). Keep the `"loading"` marker on its own path.
- **`column`** lives in `iInputLayout` (picker grid tracks). A form row's `column` never shares
  an interface with a field, so the shared name is fine.
- **`error?: boolean | string`** in `iInputState`. `true` = invalid, string = message. Render
  `data-error` on the wrapper and an `@field>error` child (suggest `<small class="error">`)
  before `@field>info`. No `Error` object — host passes `error.message`.
- **picker `"letter"`** is NOT a `view`; it is the runtime fallback in `PickerBuilder#letter`.
- **`calculator`** stays (renaming to `formula` gives `formula.formula`).
- **`dropdown`** blob is `@deprecated`; prefer named keys.
- **`condition` / `then`** are relocated to the form layer: `iFormField = InputSchema<InputType>
& { condition?; then? }`, read by `FormBuilder`, never forwarded to `create()`.
- **`iBuilderRegistry.input`** (core, `packages/core/src/types/registry.ts`): type it `any` with a
  one-line comment. Core cannot import the input package; the concrete type is enforced at the
  input package boundary. Low risk — do not stall on it.
- **Examples** (demo/rajutan) are NOT migrated in this batch. `tsconfig` excludes `examples`, and
  the `create()` translation keeps a flat node working at runtime via
  `config: schema.config ?? content.config`. Migrate examples later, separately.

## Done (stage 2 — b72)

- **Union** in `InputSchema.ts`: `iInputContentOf<T>` / `iInputConfigOf<T>`, `AnyInputSchema`,
  `InputSchema<T>`; `iInputField` is now `iInputContentNode & iInputConfigNode & { config? }`
  (the folded payload, flat behaviour keys included for the compatibility window).
  Narrowed per type: `options` (chooser only), `checked` (toggle only), `view` (that type's
  words), `shape` (toggle only), `column` (picker only), `inputmode` (where the matrix carries it).
  The two blocks are named `iInputContentNode` / `iInputConfigNode` — `iInputConfig` stays the
  **builder** config, which is the repo-wide `i<Name>Config extends iBuilderConfig` convention.
- **`create()`** overloaded: `create<const T>(schema: InputSchema<T>)` plus the base-shaped
  call; the implementation folds `{ content, config }` into `{ ...content, config }`.
- **Types:** `iBasicInputNode` / `iBasicInputConfig` deleted; `iInputField` used by the
  builder, `InputModuleTypes`, `InputControls`, `Attribute`. `index.ts` exports the union and
  drops the old node; `docs/framework/api-map.json` accepted with `api.mjs --write`.
- **Wiring:** `view` → `DropdownBuilder.style` / `PickerBuilder.kind`, `column` →
  `PickerBuilder.columns`, toggle shell reads `view` (legacy `style` still read);
  `config.loading` puts `loading` on the control (replaces `className: "loading"`);
  `config.error` sets `data-error` on the wrapper and renders `@field>error` before `info`
  (new selector + `& > .error` rule in `Input.css`); `className` removed from the templates.
- **Matrix:** `inputmode` added to `email`/`url`/`tel`/`number`; every behaviour key added to
  `INPUT_STRUCTURAL_KEYS` so the attribute scan never reports one.
- **Core:** `iBuilderRegistry.input` is `any`, with the reason in one line.
- **Proof of render** (`__tests__/Input.test.ts`): split schema renders (`label`/`for`/
  `required`/`maxlength`), legacy flat node still renders, `InputSchema<"text">` refuses
  `options`/`column`/`checked` at compile time, `view` reaches the dropdown (`data-style`) and
  the picker (`data-kind`, `--picker-columns`), `loading` class, error child order.

## Steps as executed (stage 2 — record, no action)

1. **Union** in `InputSchema.ts`: per-type `iInputContentOf<T>` / `iInputConfigOf<T>`, then
   `AnyInputSchema = { [T in InputType]: { content: iInputContentOf<T>; config?: iInputConfigOf<T> } }[InputType]`
   and `InputSchema<T extends InputType = InputType> = Extract<AnyInputSchema, { content: { type: T } }>`
   (`const T` is not allowed on a type alias — only on functions/classes).
2. **`InputBuilder.create()`** (`Input.ts`): two overloads — typed `create<const T extends
   InputType>(schema: InputSchema<T>)` and base-shaped `create(schema?: { content?: any;
   config?: Partial<iInputConfig> })` (needed for assignability to `Builder.create`; the impl
   signature alone does not count). Impl folds to `super.create({ content: { ...content, config:
   schema?.config ?? content?.config } })`.
3. **Types:** `iBasicInputNode` / `iBasicInputConfig` replaced by `iInputField`; `index.ts`
   exports the union; `iBasicInputNode` gone from the public surface.
4. **Wiring:** `Input.ts` reads `view` / `column` / `error` / `loading`; `className` gone from the
   wrapper template and from `@field>select`. Modules: `Dropdown` (`view` → `DropdownBuilder.style`),
   `Picker` (`view` → `kind`, `column` → `columns`, legacy `style` kept **after** `view` in
   `SETTINGS` so `view` wins), `FileUploader` (`view` via `data-view` in the template),
   `InputControls` (`actions`, `position`). `Attribute.ts` builds
   `create({ content: { type, id, label, value }, config: schemaDef.config })`.
5. **Tests:** helper `build()` in `Input.test.ts` passes `content: schema as any` (the loose
   legacy overload), `Modules.test.ts` passes `type: type as any`.

## Files touched by b72

`packages/components/input/{InputSchema,Input,Attribute,FieldTypes,index,InputModuleTypes,Input.test}.ts`,
`input.css`, `README.md`, `__tests__/{Input,Modules}.test.ts`,
`Dropdown/Dropdown.ts`, `InputPicker/InputPicker.ts`, `InputControls/InputControls.ts`,
`packages/core/src/types/registry.ts`, `docs/framework/{api-map,catalogue}.json`,
`.guidance/project/{STATUS.md,AGENTS.md}`.

## Gate status

Stage 1: `npm run typecheck` green.
Stage 2: `npm run check` green (api-map + catalogue refreshed) and `npm run verify` green —
91 files, 992 tests passed, 1 skipped. **Not committed.**
