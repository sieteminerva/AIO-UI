# TASK — input schema (content / config split)

**Band:** Framework · **Claim:** board row `copilot b71` (state `handoff`) · **Brief:** `packages/components/input/TASK.md`

Stage 1 (grouping) is landed. Stage 2 (per-type union + `create()` wiring) executes directly
from this file — no need to re-read the package first.

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

## Next — execute in order

1. **Union** in `InputSchema.ts`: per-type `iInputContentOf<T>` / `iInputConfigOf<T>`, then
   `AnyInputSchema = { [T in InputType]: { content: iInputContentOf<T>; config?: iInputConfigOf<T> } }[InputType]`
   and `InputSchema<const T extends InputType = InputType> = Extract<AnyInputSchema, { content: { type: T } }>`.
   Narrow `view`/`shape` per type; `inputmode` only where the matrix allows it.
2. **`InputBuilder.create()`** (`Input.ts`): overload
   `create<const T extends InputType>(schema: InputSchema<T>): HTMLElement;`
   impl `create(schema?: any)` translates `{ content, config }` → payload
   `{ ...(content ?? {}), config: config ?? content?.config }` then `super.create({ content: payload })`.
   Builder config stays constructor-only (`iInputConfig`).
3. **Types:** replace `iBasicInputNode` / `iBasicInputConfig` with `iInputField`; export the new
   types from `index.ts`; drop `iBasicInputNode` from the public surface.
4. **Wiring:** `Input.ts` read `view` / `column` / `error`; remove `className` + `"loading"`
   shortcut. Modules: `Dropdown` (`view` → `DropdownBuilder.style`), `Picker` (`view` → `kind`,
   `column` → `columns`), `FileUploader` (`view`), `InputControls` (`actions`, `position`).
   `Attribute.ts`: split its `.create({ content, config })` call (content = identity/data,
   config = `schemaDef.config`).
5. **Tests:** update `__tests__` to the new call shape. Gates: `npm run check` then
   `npm run verify` once.

## Files

- Edit: `packages/components/input/{Input.ts,Attribute.ts,FieldTypes.ts,index.ts,InputSchema.ts}`
- Edit modules: `Dropdown/Dropdown.ts`, `InputPicker/InputPicker.ts`,
  `FileUploader/FileUploader.ts`, `InputControls/InputControls.ts`
- Edit: `packages/core/src/types/registry.ts` (`input: any`)
- Tests: `packages/components/input/__tests__/*`

## Gate status

Stage 1: `npm run typecheck` green.
