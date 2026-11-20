# Input (`@aio-ui/input`)

Input renders **one form field** — label, control, info line — and the shell around it
(switch, file chip, action buttons, popover). A field is a field with or without a form
around it, so nothing in this package is scoped under `.form`; rows, fieldsets and
multistep layout belong to `@aio-ui/form`.

Sub-modules extend the field without changing the builder: `dropdown` (select/search),
`picker` (a grid of icons, swatches or images), `file-uploader`, `controls` (action buttons)
and `popover`. Each one is an `iInputAdapter` that the builder resolves once per `prepare()`
and disposes on teardown.

<!-- part: id=payload -->

**The builder is an element factory.** It assembles the markup below, and `input.css` only targets
those classes and tokens. The CSS therefore behaves like a plain CSS library: the same nesting and
class names written by hand are styled identically. Customise it by overriding a selector, or
retheme it without touching markup by redeclaring a `--app-*` token on an ancestor (or one
`--input-*` token for this component only). Nothing here is scoped under `.form`.

## Payload

```ts
{
  type: "text",            // text | number | email | password | textarea | select | …
  id: "email",
  title: "Email address",  // `label` wins over `title` when both are present
  placeholder: "you@example.com",
  required: true,
}
```

The payload is a **single record** (`iBasicInputNode`), not a list. Useful fields:
`value`, `rows`/`cols` (textarea), `step` (numeric increment, defaults to `"any"`),
`multiple`, `disabled`, `readonly`, `editable` (skips the automatic read-only lock when
action buttons are present), `info`, `position` (`top | left | right | bottom`),
`dropdown` (forwarded to the dropdown module), `popover`, `onFileSelected`,
`onValueChange` and `calculator` (calculation strategy for a readonly total).

`useLabel`, `view`, `thumbnail`, `maxUpload`, `maxFileSize`, `groupUnallowed` and
`createEventListener` are consumed by the file module.

<!-- part: id=config role=contract -->

## Config

| Option      | Default                | Meaning                                                             |
| ----------- | ---------------------- | ------------------------------------------------------------------- |
| `modules`   | none                   | `ModuleLoader`, preset array, or already-resolved `iInputAdapter[]` |
| `selectors` | see `defaultSelectors` | Per-key tag/class override                                          |
| `namespace` | `null`                 | Prefix for generated ids                                            |
| `themeId`   | `"default"`            | Passed through to the theme provider                                |
| `emit`      | `() => {}`             | Publish channel for the owning form                                 |

`modules: null` is a complete field: a plain labelled control. The four sub-modules are an
enhancement, not a precondition — see below. Pass an already-resolved adapter array when a
parent already loaded the set: the field then never loads or unloads modules the host owns
(that is what `Form` does).

<!-- part: id=modules -->

### Modules — load only what you use

Five sub-modules hang off the field: `dropdown` (a whole builder), `picker` (a grid behind
one control), `file` (the uploader), `controls` (the action set) and `popover`. **None of them
is compiled into the package root** since `0.2.2` — `scripts/bundle-probe.mjs` proves it
against the parsed module graph. Ask for all five with one import:

```ts
import { InputBuilder } from "@aio-ui/input";
import { INPUT_MODULE_DEFINITIONS } from "@aio-ui/input/modules";

new InputBuilder({ modules: INPUT_MODULE_DEFINITIONS });
```

A `picker` field is one grid behind one control — icons, swatches or images. The settings
are flat on `config`, next to `options`, in the same vocabulary the rest of a schema uses:

```ts
{
  type: "picker",
  id: "featureIcon",
  title: "Pilih ikon",
  value: "gear",
  config: {
    // The choices are the field's own `options` (`{ value, label }` plus `icon` / `src` /
    // `color`), exactly the shape a select uses. A string option is `{ value, label }`.
    options: ["gear", "user", "checkmark"],
    style: "icon",      // icon | image | media | swatch — what a cell draws
    column: 6,          // grid tracks, the same word a row layout uses
    expanded: false,    // true = print the grid inline, no trigger/popover
    searchable: true,   // adds the filter box
    isMultiple: false,  // several cells at once
  },
}
```

`style` decides what a cell draws: `icon` (a global `i.icon.<name>` class, the option value
by default), `image` / `media` (`src`), `swatch` (`color`). The value reaches the form through
a hidden input named after the field, joined with commas when `isMultiple` is on.

Each has its own `*/module` entry too, so a consumer can take one without instantiating the
other four:

```ts
import { dropdownInputModule } from "@aio-ui/input/dropdown/module";
import { pickerInputModule } from "@aio-ui/input/picker/module";
import { inputControlsInputModule } from "@aio-ui/input/controls/module";

new InputBuilder({ modules: [dropdownInputModule, pickerInputModule, inputControlsInputModule] });
```

The two shapes, and what each is for:

- `INPUT_MODULE_DEFINITIONS` (`@aio-ui/input/modules`) — what `modules` and `ModuleLoader` take:
  `{ id, load }`.
- `INPUT_MODULE_MANIFEST` (root) — the same list as `{ id, path, export }` refs, for an AST whose
  host lets `ComponentRegistry` (or `resolveModuleDefinitions()`) resolve them. Strings only, which
  is why the root can export it without pulling a single module in.

**A ref is not a definition.** Handing a ref to a loader now throws
`RegistryError` / `INVALID_DEFINITION` at registration instead of failing later as a field with
no control. Order is decorate order (`controls` before `popover`); a trimmed preset that keeps
`popover` but drops `controls` still works, it just anchors to the field wrapper instead.

**What a missing module costs — and says.** A field is never a hole, and a degradation is
never silent. `packages/components/input/Missing.ts` is the single voice:

| Capability missing | What the field does                            | Signal                                                       |
| ------------------ | ---------------------------------------------- | ------------------------------------------------------------ |
| `dropdown`         | native `<select>` over the same options        | **warn**, once per builder + capability                      |
| `picker`           | native `<select>` over the same options        | **warn**, once per builder + capability                      |
| `popover`          | `config.popover` ignored, no anchor attached   | **warn**, same dedupe (ids the preset declared, not a guess) |
| `file`             | plain file input, `onFileSelected` never fires | **warn**                                                     |
| `controls`         | the field renders, the buttons never exist     | **throw** at the declaration site                            |

Every warning is one `console.warn` **and** a `moduleMissing` event through `config.emit`
(`{ builder, capability, module, fix, consequence, severity }`), so an app can surface it in
its own UI instead of reading a console. The throws name the capability, the module id and the
one subpath that fixes it — a declared action set that renders no buttons is a hole, not a
plainer control, so a warning would not be enough. `__tests__/Modules.test.ts` walks every
declared type with `modules: []` and asserts a control still exists; `__tests__/Missing.test.ts`
pins the sentences.

<!-- part: id=nodes role=contract -->

## Nodes

| Key               | Default tag | Class / note                                  |
| ----------------- | ----------- | --------------------------------------------- |
| `@field`          | `div`       | `field`                                       |
| `@field>label`    | `label`     | linked with `for` to the control id           |
| `@field>input`    | `input`     | text-like types                               |
| `@field>textarea` | `textarea`  | `type: "textarea"`                            |
| `@field>select`   | `select`    | plus `@field>select>option`                   |
| `@field>checkbox` | `input`     | `type=checkbox`, wrapped in `.switch.control` |
| `@field>radio`    | `input`     | `type=radio`                                  |
| `@field>toggle`   | `input`     | same switch shell, opt in with `config.style` |
| `@field>file`     | `input`     | `type=file`                                   |
| `@field>info`     | `small`     | `info`                                        |

<!-- part: id=tokens role=contract -->

### Structure

The control element follows `type`; `label`, the control and the `small.info` line are appended
only when the payload supplies them, and action buttons add `div.controls`.

```html
<div class="field">
  <label>Email address</label>
  <input id="email" type="text" placeholder="you@example.com" />
</div>
```

## Tokens

Every token is declared **once**, on `:root, [data-theme]`, in `input.css`. `[data-theme]`
is required: a theme puts `--app-*` on the shell element, and a custom property is
substituted where it is _declared_. Never redeclare these per `.field` — the whole subtree
would inherit the copy and any ancestor override would be shadowed.

Overriding is the third layer: redeclare `--input-*` on any ancestor, leave the package
alone.

**Colour** (derived from `--app-*`)

| Token                              | Derives from                                              |
| ---------------------------------- | --------------------------------------------------------- |
| `--input-primary-color`            | `--app-primary-color`                                     |
| `--input-accent-color`             | `--app-accent-color`                                      |
| `--input-border-color`             | `--input-primary-color` (dark: `--app-border-color`)      |
| `--input-text-color`               | mix of accent + primary (dark: `--app-text-color`)        |
| `--input-label-color`              | `--input-accent-color` (dark: `--app-text-accent-color`)  |
| `--input-text-color-light`         | mix of primary + white                                    |
| `--input-text-color-hover`         | mix of primary + black                                    |
| `--input-placeholder-color`        | mix of grey + `--input-text-color`                        |
| `--input-background-color`         | mix of accent + white (dark: `transparent`)               |
| `--input-background-color-hover`   | mix of accent + white                                     |
| `--input-picker-background`        | `--input-background-color` (dark: `--app-surface-strong`) |
| `--input-popover-background-color` | `--app-surface-strong`                                    |
| `--input-tag-background`           | `--app-surface-muted`                                     |
| `--input-tag-text-color`           | `--app-text-color`                                        |
| `--input-error-color`              | `--app-status-error`                                      |
| `--input-error-text-color`         | `--app-status-error-soft`                                 |
| `--input-error-background-color`   | `--app-status-error-surface`                              |
| `--input-text-on-primary`          | `--app-text-on-primary`                                   |

Dark mode re-derives seven of them in the same file, because the palette inverts the field
(solid border becomes translucent, tinted surface becomes flat) and no single formula
covers both modes.

**File module** (`FileUploader/FileUploader.css`)

| Token                          | Derives from              |
| ------------------------------ | ------------------------- |
| `--input-file-allowed-color`   | `--app-status-success`    |
| `--input-file-unallowed-color` | `--app-status-error-fill` |
| `--input-file-warning-color`   | `--app-status-warning`    |

**Picker module** (`InputPicker/InputPicker.css`) — declared on `:root, [data-theme]`, every
one derived from the field layer so a theme retunes the picker with the field:

| Token                       | Derives from                        |
| --------------------------- | ----------------------------------- |
| `--picker-surface`          | `--input-picker-background`         |
| `--picker-border-color`     | `--input-border-color`              |
| `--picker-accent-color`     | `--input-primary-color`             |
| `--picker-text-color`       | `--input-text-color`                |
| `--picker-muted-color`      | `--input-placeholder-color`         |
| `--picker-radius`           | `--input-border-radius`             |
| `--picker-duration`         | `--input-popup-duration`            |
| `--picker-gap`              | literal 0.35rem (component-private) |
| `--picker-panel-max-height` | literal 16rem (component-private)   |

**Metrics and motion** (`input.css`)

`--input-font-size`, `--input-label-size` (`0.75 × font-size`), `--input-border-radius`,
`--input-line-height`, `--input-icon-size`, `--input-min-height`, `--input-picker-height`
(`3 × line-height`), `--input-dropdown-arrow-content` (SVG data URI),
`--input-dropdown-transition-delay`, `--input-popup-duration`, `--input-popup-easing`,
`--input-popup-distance`.

The loading spinner is **not** an input token: it is shared with the form package and lives
in the app layer as `--app-spinner-content`.

<!-- part: id=wiring role=contract -->

## Wiring checklist

1. `"input"` is already in `iBuilderRegistry` (`packages/core/src/types/registry.ts`).
2. Map `@aio-ui/input`, `@aio-ui/input/input.css` and every sub-module subpath you use
   (`./dropdown`, `./dropdown.css`, `./picker`, `./picker.css`, `./controls`, `./controls.css`,
   `./file-uploader`, `./file-uploader.css`, `./popover/module`) in the host asset map — every
   exact `exports` key, since a prefix cannot add `.js`.
3. List it in the host's route plan: `registerModule(components, [{ route, components: ["input"] }])`.
