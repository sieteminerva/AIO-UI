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

<!-- install:begin -->

## Install

Version — `0.2.5` (tag `v0.2.5`)

    npm install https://github.com/sieteminerva/AIO-UI/raw/releases/v0.2.5/aio-ui-input-0.2.5.tgz

CDN (ES module, no build step) — `https://cdn.jsdelivr.net/gh/sieteminerva/AIO-UI@v0.2.5/packages/components/input/dist/index.js`
Stylesheet — `https://cdn.jsdelivr.net/gh/sieteminerva/AIO-UI@v0.2.5/packages/components/input/dist/input.css`

<!-- install:end -->

## Payload

A field is two blocks: **`content`** is what the field _is_, **`config`** is how it
_behaves_. `InputSchema<T>` narrows both to the chosen `content.type`, so a `file` field
never sees a picker's view word and a text field never sees `options`.

```ts
{
  content: {
    type: "text",            // text | number | email | password | textarea | select | …
    id: "email",
    label: "Email address",
    placeholder: "you@example.com",
  },
  config: {
    required: true,
    maxlength: 40,
  },
}
```

`content` — identity (`type`, `id`, `name`), readable text (`label`, `placeholder`, `info`),
the value (`value`, `checked`) and the choices (`options`, on a chooser only).

`config` — constraints (`required`, `min`/`max`/`step`, `minlength`/`maxlength`, `pattern`,
`accept`, `inputmode`, `rows`/`cols`, `multiple`), state (`disabled`, `readonly`, `editable`,
`loading`, `error`), layout (`position`, `useLabel`, `display`, `wide`, `attributes`,
`view`, `shape`, `column`), callbacks (`onFileSelected`, `calculator`) and module settings
(`actions`, `popover`, `apiUrl`, `debounceDelay`, `onSelect`, `onMultiChange`, `expanded`,
`searchable`, `thumbnail`, `maxUpload`, `maxFileSize`, `groupUnallowed`, `csv`).

`error` is the host's validation state: `true` marks the field invalid, a string marks it
invalid **and** prints the message as a `@field>error` line just above `info`. `loading` puts
the `loading` class on the control — it replaced the old `className: "loading"` shortcut.

A field has exactly one spelling on each side. `label` is the caption — the old `title`
alias is gone, and choices live in `content.options` only (a `config.options` bag is no
longer read). `@aio-ui/form` sends this same shape: its adapter splits a flat form node into
`content` and `config` before it calls `create()`.

`config.view` is the one visual-variant word, typed per field type: `toggle` (checkbox/
radio), `select`/`datalist` (dropdown), `icon`/`image`/`media`/`swatch` (picker) and
`list`/`thumbnails` (file). It replaced the old `style` (dropdown/toggle) and the uploader's
own `view`.

### Width — `wide` is a percentage of the row

`config.wide` is the **only** width knob: `20`, `"40%"`, `0.5` (fraction) or `"auto"` / `100`
(the whole row); absent means the whole row. The old `span` key is **gone** — a column span
cannot express `20 / 40 / 40`, so the form lays a 100-unit grid out from the percentage
(`@aio-ui/form` owns the placement; see its README).

### Action set — `config.actions`

`config.actions` takes names (`"editor"` = edit+save, `"repeater"` = add+delete) or objects
`{ type, label?, icon?, onClick, … }`. Two flags belong to the **`delete`** of a repeater:

| Flag           | Default | Meaning                                                                         |
| -------------- | ------- | ------------------------------------------------------------------------------- |
| `removable`    | `true`  | Whether the **source** row (index 0, the one Add was first clicked from) may be deleted. `false` locks it; clones are always free. |
| `hideOnSource` | `false` | Hide the source's delete button (a look; `removable: false` is what locks it).   |

The old `minItems` / `atMin` pair is gone: counting rows could not say "keep index 0".

### Choices — one door for every chooser

`options` is content and `multiple` is a constraint, so they sit on opposite sides of the
same field: `content.options` feeds `select`, `dropdown`, `picker` and a `radio`/`checkbox`
group, and `config.multiple` means the same thing in all four:

```ts
{ content: { type: "select", id: "size", options: ["S", "M", "L"] } }
{ content: { type: "dropdown", id: "city", options: [{ value: "jkt", label: "Jakarta" }] }, config: { multiple: true } }
{ content: { type: "picker", id: "icon", options: ["gear", "user"] }, config: { multiple: true } }
{ content: { type: "radio", id: "ship", name: "ship", options: ["pickup", "courier"], value: "courier" } }
```

A `radio`/`checkbox` field **with `options`** renders a group — one control per option, all
on the field's `name`, `radio` exclusive and `checkbox` taking several — and the group's
caption is not a `<label for>`, because there is no single control. Without `options` the
field is the single control it always was.

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
is compiled into the package root** — `scripts/bundle-probe.mjs` proves it against the parsed
module graph. Ask for all five with one import:

```ts
import { InputBuilder, INPUT_MODULE_DEFINITIONS } from "@aio-ui/input";

new InputBuilder({ modules: INPUT_MODULE_DEFINITIONS });
```

A `picker` field is one grid behind one control — icons, swatches or images. The look is
flat on `config`; the choices and the multiplicity stay on the field:

```ts
{
  content: {
    type: "picker",
    id: "featureIcon",
    label: "Pilih ikon",
    value: "gear",
    // The choices are the field's own `options` (`{ value, label }` plus `icon` / `src` /
    // `color`), exactly the shape a select uses. A string option is `{ value, label }`.
    options: ["gear", "user", "checkmark"],
    multiple: false,    // several cells at once
  },
  config: {
    view: "icon",       // icon | image | media | swatch — what a cell draws
    column: 6,          // grid tracks, the same word a row layout uses
    expanded: false,    // true = print the grid inline, no trigger/popover
    searchable: true,   // adds the filter box
  },
}
```

`view` decides what a cell draws: `icon` (a global `i.icon.<name>` class, the option value
by default), `image` / `media` (`src`), `swatch` (`color`). The value reaches the form through
a hidden input named after the field, joined with commas when `multiple` is on.

Each subpath is a builder **and** its module definition — there is no separate `/module` door
since `0.2.4`. Take one without instantiating the other four:

```ts
import { dropdownInputModule } from "@aio-ui/input/dropdown";
import { pickerInputModule } from "@aio-ui/input/picker";
import { inputControlsInputModule } from "@aio-ui/input/controls";
import { fileUploaderInputModule } from "@aio-ui/input/file-uploader";

new InputBuilder({ modules: [dropdownInputModule, pickerInputModule, inputControlsInputModule] });
```

The two shapes, and what each is for:

- `INPUT_MODULE_DEFINITIONS` (`@aio-ui/input`) — what `modules` and `ModuleLoader` take:
  `{ id, load }`.
- `INPUT_MODULE_MANIFEST` (`@aio-ui/input`) — the same list as `{ id, path, export }` refs, for an
  AST whose host lets `ComponentRegistry` (or `resolveModuleDefinitions()`) resolve them. Strings
  only, which is why the root can export it without pulling a single module in.

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

| Key               | Default tag | Class / note                                           |
| ----------------- | ----------- | ------------------------------------------------------ |
| `@field`          | `div`       | `field`                                                |
| `@field>label`    | `label`     | linked with `for` to the control id                    |
| `@field>input`    | `input`     | text-like types                                        |
| `@field>textarea` | `textarea`  | `type: "textarea"`                                     |
| `@field>select`   | `select`    | plus `@field>select>option`                            |
| `@field>checkbox` | `input`     | `type=checkbox`, wrapped in `.switch.control`          |
| `@field>radio`    | `input`     | `type=radio`                                           |
| `@field>toggle`   | `input`     | same switch shell, opt in with `config.view: "toggle"` |
| `@field>file`     | `input`     | `type=file`                                            |
| `@field>error`    | `small`     | `error`, from a string `config.error`                  |
| `@field>info`     | `small`     | `info`                                                 |

<!-- part: id=tokens role=contract -->

### Structure

The control element follows `type`; `label`, the control, the `small.error` line and the
`small.info` line are appended only when the payload supplies them, and action buttons add
`div.controls`.

```html
<div class="field">
  <label>Email address</label>
  <input id="email" type="text" placeholder="you@example.com" />
</div>
```

## Tokens

### Popup placement

`select::picker(select)`, `.dropdown > .menu` and the picker panel share one surface that is
placed by **CSS Anchor Positioning** and shown by the **Native Popover API** — so they escape
any `overflow: hidden` ancestor and follow the field on scroll and resize without a JS
position calculator. The anchor is the field-scoped name `--field-dropdown-anchor`
(`anchor-scope` on `.field`), never a generated id.

`position-try-fallbacks: --flip-top, flip-block` opens the surface **upward** when there is
no room below; a `@position-try` rule may only carry placing/sizing declarations, so the
mirror is geometric. Anchor positioning and the fallback need Chromium 125+ / Firefox 132+ /
Safari 18+; older engines keep the absolute fallback the surface already declares. The
trigger's own border does not mirror the flip (it is the anchor, not an anchored element, so
it cannot query the chosen fallback); the menu overlaps the trigger by 1px, so the seam
reads as one line in both directions.

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
