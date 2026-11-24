# TASK — input schema (content / config split)

**Band:** Framework · **Claim:** board row `copilot b74` (this file is its checkpoint) ·
**Brief:** `packages/components/input/TASK.md`

**Status:** done — stages 1, 2, 3 and 3.3 landed (`86124cd`, `9d79f9f`, `bf5b40c`). Gate:
`npm run check` + `npm run verify` green (91 files, 996 pass, 1 skip); `npm run build:demo` green.

## Handoff — read this first

**State:** stages 1–3.3 are done and committed. b72 (stage 2) landed as `86124cd`, stage 3 as
`9d79f9f`, stage 3.3 as its own commit (b74). The tree is clean. Last gate: `npm run verify`
**green** (91 files, 994 pass, 1 skip).

**Remaining:** nothing in this task. The next input work is a new card, not a continuation.

**Traps proven in this batch (do not rediscover):**

- `create()` **must keep** the base-shaped overload: a narrower parameter cannot override
  `Builder.create`. It exists for assignability only; the fold above it is the only door and
  no legacy behaviour survives in it.
- `content.options` accepts a bare string; `resolvePayload` still maps it to
  `{ value, label }`. That is the declared content type, not a legacy door — without the map
  a `<select>` renders `undefined` values.
- The form adapter is the only place a flat form node becomes a field: it splits on two
  explicit key lists (`FIELD_CONTENT_KEYS`, `FORM_OWNED_KEYS`). Add a content key there when
  the input content block grows.
- Form **group/row** captions are still `title` (the form's own vocabulary). Only a node with
  `type` is a field, and only a field uses `label`.
- `docs/framework/api-map.json` and `docs/framework/catalogue.json` are generated:
  `node scripts/api.mjs --write` · `node scripts/catalogue.mjs --apply`.

## Stage 3 — done

### 3.1 Strict per-type module keys

`InputSchema.ts`: `iInputModuleConfig` split into `iInputActionsSettings` (`actions`,
`popover`), `iInputDropdownSettings` (`dropdown`, `apiUrl`, `debounceDelay`, `onSelect`,
`onMultiChange`), `iInputPickerSettings` (`expanded`, `searchable`) and `iInputFileSettings`
(`onFileSelected` moved here from `iInputEvents`, plus `thumbnail`, `maxUpload`,
`maxFileSize`, `groupUnallowed`, `csv`).

`iInputModuleSettingsOf<T>` composes one owner set per type via `iInputModuleSettingsFor<T>`
and closes every foreign key with `never` (`Omit<iInputForeignModuleKeys, keyof …>`, so an
owned key is never intersected with `never`). **Decision (owner, this session): `actions` /
`popover` stay on every type** — a button set acts on the wrapper, whatever the field is.

Proof (`__tests__/Input.test.ts`): `InputSchema<"file">` accepts `maxUpload` / `csv` /
`onFileSelected`; `@ts-expect-error` on `maxUpload` and `apiUrl` for `InputSchema<"text">`;
a text field still accepts `actions` + `popover`.

### 3.2 The legacy door is gone

- `form/Input.FormAdapter.ts`: `renderField()` splits the form node into `content`
  (`type`, `id`, `name`, `label`, `placeholder`, `info`, `value`, `checked`, `options`) and
  `config` (everything else), dropping the form-owned `condition` / `then`.
- `Input.ts`: `resolvePayload` no longer reads `title`, no longer mirrors the config bag onto
  the top level, no longer lifts `config.options`; the `rows: 3` default moved into the
  `@field>textarea` template (`cfg.rows ?? 3`); readers use `cfg.position`, `cfg.editable`,
  `cfg.disabled`, `cfg.required`, `cfg.view`; `#isToggleView` reads `config.view` only.
- `InputSchema.ts`: `iInputDiscardedKeys` deleted; `iInputField` is now
  `iInputContentNode & { config?: iInputConfigNode }`.
- `FieldTypes.ts`: `INPUT_STRUCTURAL_KEYS` lost `title`, `class`, `className`, `style`,
  `range`, `createEventListener`, `icon`, `textContent`, `field`, `picker`; gained `label`.
- Modules: `Dropdown`/`Picker` read `cfg.multiple` and `field.label`; the picker `SETTINGS`
  table lost the legacy `style` row; `Attribute.ts` editors use `label`, `view` and
  `options`-as-content.
- Tests: input + form suites migrated to the split schema; the "legacy flat node still
  renders" pin became "a flat node is not a field anymore" (no label, no choices).
- Docs: `input/README.md` and `form/README.md` show the split shape; field captions are
  `label`, constraints sit in `config`.

## Stage 3.3 — done (b74)

**One shape, everywhere.** The form field node is now the input schema itself —
`{ content, config }` — plus the form's own `condition` / `then` beside the two blocks. The adapter
no longer splits a flat node (`splitField()` and its two key lists are gone); it reads the blocks
and lifts `config.selectors` into the field's own `InputBuilder` constructor.

- **Types:** `packages/components/form/FormSchema.ts` exports `FormField` (the input union
  distributed per `content.type`, plus `config.selectors`, `condition`, `then`), `FormNode`,
  `iFormGroupNode`, `iFormRowNode`, `iFormNodeLayout`. Exported from `@aio-ui/form`.
- **Compiler proof:** `iFormTopicDemo.schema` is `readonly FormNode[]`; the demo schemas, both
  wizards and the form test suites are annotated, so a stale key (`title`, `config.options`,
  `style`) is a compile error. `npm run typecheck:examples` (demo + gallery) joined `check`.
- **Input API:** `iBasicSelectOption.color` added — `PickerBuilder` already painted it.
- **Examples migrated:** `examples/demo` (form schemas, action handlers, duplicate registry keys),
  `examples/gallery` (wizard sets), `examples/rajutan` (wizard + `FormEditor`, which now builds
  `{ content, config }` payloads; that repo carries its own commit).
- **Render proof:** `FormModules.test.ts` — a split field renders caption, choices and `required`,
  and a flat node renders no field at all.
- Gate: `check` green (api-map + catalogue refreshed) and `verify` green — 91 files, 994 pass, 1 skip.

## Stage 3.3 — next (separate batch)

`examples/demo/**`, `examples/gallery/**`, `examples/rajutan/**` are outside `tsconfig`, so the
compiler never saw them during stages 1–3. Migrate them in one batch of their own: `title` →
`label` on fields, flat behaviour keys into `config`, `config.options` → `content.options`,
`style: "toggle"` → `view: "toggle"`, and wrap every field in `{ content, config }`. Then add
the example folders to the typecheck scope (or a dedicated `tsc -p examples/tsconfig.json`) so
the compiler, not a browser, proves the migration.

## Done (stage 1)

`packages/components/input/InputSchema.ts` (type-only, not imported yet):

- CONTENT: `iInputIdentity`, `iInputText`, `iInputValue`, `iInputChoices` → `iInputContent`.
- CONFIG: `iInputConstraint`, `iInputState`, `iInputLayout`, `iInputEvents`, `iInputModuleConfig`
  → `iInputConfig`; resolved internal shape `iInputField = iInputContent & iInputConfig`.
- Named view types: `InputFileViewType`, `InputDropdownViewType`, `InputPickerViewType`,
  `InputToggleViewType`, `InputToggleShapeType`, `InputViewType`.
- `iInputDiscardedKeys` — keys that leave the field schema, each with `@deprecated` + reason.
  **Deleted in stage 3.**

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
- **A form field node is the input schema** (`{ content, config }`) with `condition` / `then`
  beside the blocks. b74 replaced the temporary flat form node; there is one shape for both
  layers, so an example never teaches two spellings.
- **Examples** (demo/gallery/rajutan) are migrated in stage 3.3 and typechecked from then on:
  `readonly FormNode[]` on a schema makes a stale key a compile error, and
  `npm run typecheck:examples` keeps the demo and the gallery in the gate.

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
91 files, 992 tests passed, 1 skipped. Committed as `86124cd`.
Stage 3: `npm run check` green (api-map + catalogue refreshed) and `npm run verify` green —
91 files, 994 passed, 1 skipped.
Stage 3.3: `npm run check` green (api-map + catalogue refreshed), `npm run verify` green — 91
files, 996 passed, 1 skipped; `npm run build:demo` green. Committed as `bf5b40c`.

## Next

Nothing left in this task. The seams the refactor left outside itself are written down, with
file:line evidence and the release decision they need, in **`docs/framework/TASK-INPUT-LEGACY.md`**:
the rajutan commit, the four stale `config.options` doc stops, core's `iBasicInputNode` /
`iFormGroupNode` duplicate, and where `range` should live.
