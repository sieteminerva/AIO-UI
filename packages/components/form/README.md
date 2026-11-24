# Form (`@aio-ui/form`)

Form renders a schema of groups and fields into a real `form`, and owns the parts a plain form does
not: multi-step gating, cascading (conditional) fields, live calculation, validation messages, and
the submit payload.

Fields themselves are components. The form builds the layout and calls the field adapters, so a
field's look still belongs to `@aio-ui/input`; the form only positions it.

<!-- part: id=payload -->

**The builder is an element factory.** It assembles the markup below, and `Form.css` only targets
those classes and tokens. The CSS therefore behaves like a plain CSS library: the same nesting and
class names written by hand are styled identically. Customise it by overriding a selector, or
retheme it without touching markup by redeclaring a `--app-*` token on an ancestor (or one
`--form-*` token for this component only). A field's own markup belongs to `@aio-ui/input`.

<!-- install:begin -->

## Install

Version — `0.2.5` (tag `v0.2.5`)

    npm install https://github.com/sieteminerva/AIO-UI/raw/releases/v0.2.5/aio-ui-form-0.2.5.tgz

CDN (ES module, no build step) — `https://cdn.jsdelivr.net/gh/sieteminerva/AIO-UI@v0.2.5/packages/components/form/dist/index.js`
Stylesheet — `https://cdn.jsdelivr.net/gh/sieteminerva/AIO-UI@v0.2.5/packages/components/form/dist/Form.css`

<!-- install:end -->

## Payload

```ts
[
  {
    id: "group-1",
    title: "Data pengiriman",
    description: "…",
    group: [{ content: { type: "text", id: "name", label: "Nama" } }],
  },
];
```

An array of groups, each with an optional `group` array of field nodes (or nested rows). The shape of
a field node is the input package's contract, not this one.

<!-- part: id=group-row-keys -->

### Group and row keys

| Key               | On         | Meaning                                                                     |
| ----------------- | ---------- | --------------------------------------------------------------------------- |
| `id`              | group, row | Identity; cascade paths and the submit payload use it                       |
| `legend`          | group      | Text of the `<legend>` (`title` is the fallback)                            |
| `title`           | group, row | Heading; on a group it doubles as the legend when `legend` is absent        |
| `description`     | group      | Paragraph under the legend                                                  |
| `group`           | group      | Fieldset children                                                           |
| `row`             | row        | Inline children — layout, not a fieldset                                    |
| `label`           | row        | Title rendered above the row (`@form>row>title`)                            |
| `column`          | group, row | Line cap: how many children one line holds                                  |
| `actions`         | group, row | Action words rendered in the corner: `search`, `copy`, `editor`, `repeater` |
| `actionsPosition` | group, row | Where those buttons sit (`config.position` is the older spelling)           |

A field node **is** the input schema — `{ content, config }` — so its keys (`content.type`,
`content.label`, `config.required`, `config.wide`, `config.csv`, …) belong to `@aio-ui/input`;
this package adds only the cascade rule `condition` beside the two blocks. It reads `config.wide`
whenever it lays a container out: a **row** always grids, a **group** only when it declares
`column`. `wide` is a **percentage of the row** and the only way to size a field — `20`, `"40%"`,
`0.5` (fraction), `"auto"` / `100` (the whole row); **absent means the whole row**. `column` is
only the line cap, so the fourth child of a `column: 3` row starts the next line.

<!-- part: id=config role=contract -->

## Config

| Option                              | Default          | Meaning                                                                   |
| ----------------------------------- | ---------------- | ------------------------------------------------------------------------- |
| `id`, `name`                        | `""`             | Form identity; the id is derived from `id` (`form-<slug>`)                |
| `title`                             | `""`             | Heading above the first group                                             |
| `description`                       | `""`             | Paragraph under the heading                                               |
| `method`, `action`                  | `"post"`, `""`   | Native form attributes                                                    |
| `className`                         | `""`             | Extra classes, de-duplicated                                              |
| `submitButton`                      | `true`           | Render the submit button                                                  |
| `buttonText`                        | `"Submit"`       | Submit label                                                              |
| `buttonClass`                       | `""`             | Extra classes on the submit button                                        |
| `resetOnSubmit` / `resetOnComplete` | `false` / `true` | Clear before sending / after success                                      |
| `multistep`                         | `false`          | Split groups into steps with gating                                       |
| `cascading`                         | `false`          | Honour each field's `condition`                                           |
| `cascadeMode`                       | `"template"`     | `template` plants a `<template>`; `hidden` builds then hides              |
| `onCascade`                         | `null`           | Called with every cascade mount / unmount / gate                          |
| `calculation`                       | `false`          | Enable formula fields                                                     |
| `messages`                          | built-in         | Every sentence the form says back (validation, gate, submit)              |
| `files`                             | `"ignore"`       | `"ignore"` keeps files out of the payload; a function opts in             |
| `excludeEmpty`                      | `false`          | Drop `""`, `false` and empty arrays from the submit payload               |
| `onSubmit`                          | `null`           | Called with the assembled payload                                         |
| `footer`                            | `null`           | Element or string appended after the actions                              |
| `minHeight`                         | `"400px"`        | Reserved height for lazily loaded groups                                  |
| `createEventListener`               | `true`           | Bind the form's own submit/reset listeners                                |
| `autoDisableNextStep`               | `false`          | Disable `next` until the current step validates                           |
| `address`                           | `null`           | `{ loader, url, service, geocode, useAdapter }` for `[data-level]` fields |
| `modules`                           | `null`           | Optional `ModuleLoader` replacing any built-in feature handler            |

`address.loader` wins over `url`/`service`; `useAdapter` picks the picker markup (`"aio"` for
this framework, `"native"` for platform controls, default `"native"`).

`cascadeMode: "hidden"` exists because a chained field (an address picker feeding the next select)
needs a live element to inject into; a `<template>` gives it nothing.

## Supported syntax

Four behaviour engines, one flag each. A flag only opens the door: the engine itself is a module,
and when it is absent the form degrades to a no-op instead of throwing. The form never imports an
engine or a sibling package — `FORM_ADAPTER_MANIFEST` is the default stack, and the host composes
the rest.

<!-- part: id=register -->

### Registering the form

```ts
import { FORM_ADAPTER_MANIFEST } from "@aio-ui/form";

// 1. The adapter stack: the form's own engines, then whatever the host adds.
const modules = [
  ...FORM_ADAPTER_MANIFEST,
  { id: "idAddress", path: "@aio-ui/id-address", export: "idAddressFormAdapter" },
  { id: "table", path: "@aio-ui/table", export: "tableFormAdapter" },
  { id: "message", path: "@aio-ui/message", export: "messageFormAdapter" },
];

// 2. The registry entry. `export` is required: the package publishes more than one builder.
components.register("form", () => ({
  path: "@aio-ui/form",
  stylesheet: "@aio-ui/form/Form.css",
  modules,
  export: "FormBuilder",
  schema,
  config,
}));

// 3. The route plan. A builder called inside `onCreated` is invisible to the node collector,
//    so a cold load fails before it is fetched unless the route names it.
registerModule(components, [{ route: "checkout", components: ["form", "input", "menu"] }]);

// 4. Use it. `config` is optional; every key in the table above has a default.
const element = build("form", { schema, config: { id: "checkout" } });
element.addEventListener("formSubmit", (event) => console.log(event.detail.data));
```

<!-- part: id=direct -->

### Without a shell (direct `new FormBuilder`)

No registry, no `AioApp`: build the form yourself and hand it the modules it may use. Three
shapes, and only one of them is a loader input. **The builder ships no stack of its own** since
`0.2.2`: the adapters live behind `@aio-ui/form`, so importing `@aio-ui/form` does not
compile a single engine.

```ts
import { ModuleLoader, resolveModuleDefinitions } from "@aio-ui/module-loader";
import { FormBuilder, FORM_ADAPTER_MANIFEST } from "@aio-ui/form";
import { FORM_ADAPTER_DEFINITIONS } from "@aio-ui/form";

// 1. Everything — one import, the whole stack: five form adapters + four field modules.
new FormBuilder({ modules: new ModuleLoader("form", FORM_ADAPTER_DEFINITIONS) });

// 2. Only what this form uses. Each adapter is its own subpath, so the rest is never loaded.
import { inputFormAdapter } from "@aio-ui/form";
import { validationFormAdapter } from "@aio-ui/form/validation-adapter";
new FormBuilder({ modules: new ModuleLoader("form", [inputFormAdapter, validationFormAdapter]) });

// 3. From manifest refs (the shape an AST declares), resolved once, before anything is built.
const refs = FORM_ADAPTER_MANIFEST.filter((ref) => (ref.scope ?? "form") === "form");
const definitions = await resolveModuleDefinitions(refs);
new FormBuilder({ modules: new ModuleLoader("form", definitions) });
```

**One import is the whole form.** `FORM_ADAPTER_DEFINITIONS` is nine entries: the four engines,
`input`, and the four field modules (`dropdown`, `file`, `controls`, `popover`, imported from their
`@aio-ui/input/<subpath>` entries). `prepare()` routes them by id — ids in `INPUT_MODULE_IDS` become the
field preset, everything else is loaded as a form feature — which is the same rule
`provideModules()` uses for a manifest. So a hand-wired form gets a real dropdown, a real
uploader and a real action set from one line. `bundle-probe` proves all nine are in that graph
and none of them in the root's.

Two rules, both enforced now:

- **A ref is not a definition.** `{ id, path, export }` is data for `ComponentRegistry` or
  `resolveModuleDefinitions()`; a loader takes `{ id, load }`. Registering a ref used to be
  accepted silently and fail later as `No module rendered the field` — it now throws
  `RegistryError` with code `INVALID_DEFINITION` and names both shapes.
- **A missing capability speaks.** Without a module the field keeps working, in a plainer
  shape: a `dropdown` becomes a native `<select>` over the same options, an uploader becomes a
  plain file input, a popover is not attached. None of that is silent any more — each one
  warns once per builder and emits `moduleMissing`, and the two cases a warning cannot cover
  **throw** with the fix in the message: a declared `config.actions` with no `controls` module
  (buttons would never exist), and a `config.files` policy with no `file` module (the policy
  would receive no files and the bytes would be dropped).

`@aio-ui/form` lists `@aio-ui/input` under **`dependencies`**, not peers: installing the form
tarball brings its field layer with it, so the second URL is not something a consumer has to
know about.

A builder with **no** `modules` still renders — that is the floor: `inputFormAdapter` (every
field) plus `dropdownInputModule` (the field module a first schema always reaches for). Passing
`modules` or `inputModules` replaces the set, and a declared module with the same id wins. Only an
**explicitly empty** loader throws on the first `create()`, naming the import that fixes it: a
form told to run on nothing cannot render one field, and failing per field halfway through a
schema would only hide that.

`resolveModuleDefinitions()` is async and must be awaited **before** `create()`: a builder's render
is synchronous and never owns module I/O.

<!-- part: id=validation -->

### Validation

The rules are the fields' own DOM attributes (`required`, `pattern`, `min`, `max`, `minlength`,
`maxlength`). You declare them in the field's `config` bag; the input adapter puts them on the
control. The engine reads the rendered attributes at submit or at `next`, so a message never
appears while the user is still typing.

```ts
const schema = [
  {
    id: "order",
    title: "Order details",
    group: [
      { content: { type: "text", id: "name", label: "Name" }, config: { required: true } },
      { content: { type: "text", id: "invoice", label: "Invoice" }, config: { required: true, pattern: "INV-[0-9]+" } },
      { content: { type: "number", id: "qty", label: "Quantity" }, config: { min: 1, max: 10 } },
    ],
  },
];

const element = build("form", { schema, config: { id: "order-form" } });

element.addEventListener("formValidation", (event) => {
  const { reason, message } = event.detail; // reason: "valid" | "native" | …
  if (reason !== "valid") console.warn(reason, message);
});
```

<!-- part: id=cascade -->

### Cascade

`condition` on a field is the whole declaration: while the condition is false the field is not in
the DOM. `cascadeMode` decides whether it is built and hidden (`"hidden"`) or planted as a
`<template>` (`"template"`, the default). Use `"hidden"` when another engine needs a live element
to inject into — a chained address picker, for example.

```ts
const schema = [
  {
    id: "delivery",
    group: [
      { content: { type: "radio", id: "pickup", name: "delivery", value: "pickup", label: "Pickup" } },
      { content: { type: "radio", id: "courier", name: "delivery", value: "courier", label: "Courier" } },
      {
        content: {
          type: "text",
          id: "courierNote",
          label: "Note for the courier",
        },
        condition: { field: "delivery", equals: "courier" },
      },
    ],
  },
];

build("form", {
  schema,
  config: {
    cascading: true,
    cascadeMode: "hidden",
    onCascade: (state) => console.log("cascade", state),
  },
});
```

<!-- part: id=calculation -->

### Calculation

`calculation: true` turns the engine on; a field opts in with `config.calculator`. The engine walks
the schema, runs each formula against the current values and writes the total into `outputId`.

```ts
const schema = [
  {
    id: "line",
    group: [
      {
        content: {
          type: "number",
          id: "qty",
          label: "Qty",
        },
        // The formula travels with the field that carries the quantity.
        config: {
          min: 0,
          calculator: {
            id: "line-total",
            outputId: "total",
            formula: ({ getNumber }) => ({
              id: "line-total",
              label: "Line",
              quantity: getNumber("qty"),
              unitPrice: getNumber("price"),
              total: getNumber("qty") * getNumber("price"),
            }),
          },
        },
      },
      { content: { type: "number", id: "price", label: "Price" }, config: { min: 0 } },
      { content: { type: "number", id: "total", label: "Total" }, config: { readonly: true } },
    ],
  },
];

build("form", { schema, config: { calculation: true } });
```

<!-- part: id=multistep -->

### Multistep

`multistep: true` turns each group into a step. `prepare()` plants a `<template data-step>` in place
of every step and the fieldset is built when that step is opened, so a heavy step costs nothing
until it is reached. Validation is scanned per step: a step that has not been opened cannot block
the one the user is on.

```ts
const schema = [
  {
    id: "contact",
    title: "Step 1 · Contact",
    group: [{ content: { type: "email", id: "email", label: "Email" }, config: { required: true } }],
  },
  {
    id: "address",
    title: "Step 2 · Address",
    group: [{ content: { type: "text", id: "city", label: "City" }, config: { required: true } }],
  },
  { id: "confirm", title: "Step 3 · Confirm", group: [{ content: { type: "checkbox", id: "agree", label: "I agree" } }] },
];

build("form", {
  schema,
  config: {
    id: "signup",
    multistep: true,
    // Optional: keep `next` disabled until the current step validates.
    autoDisableNextStep: true,
  },
});
```

<!-- part: id=nodes role=contract -->

## Nodes

| Key                          | Default tag | Class                      |
| ---------------------------- | ----------- | -------------------------- |
| `@container`                 | `div`       | `form-widget-wrapper`      |
| `@form`                      | `form`      | `native form`              |
| `@form>group`                | `fieldset`  | `form-group`               |
| `@form>group>legend`         | `legend`    | `title`                    |
| `@form>group>desc`           | `p`         | `desc`                     |
| `@form>title`                | `h2`        | `title`                    |
| `@form>desc`                 | `p`         | `desc`                     |
| `@form>row`                  | `div`       | `field group`              |
| `@form>row>title`            | `p`         | `title`                    |
| `@form>actions`              | `div`       | `form-actions`             |
| `@form>actions>submit`       | `button`    | `submit` (`type="submit"`) |
| `@form>actions>submit-group` | `button`    | `submit` (`type="button"`) |
| `@form>footer`               | `div`       | `form-footer`              |
| `@form>buttons-set`          | `div`       | `buttons set`              |

<!-- part: id=tokens role=contract -->

### Structure

One `fieldset` per group; a row is a `div.row` and a field is the `@aio-ui/input` markup. The id
is derived from config, never from the payload.

```html
<form id="form-…" class="form native">
  <fieldset id="group-1" class="form-group">
    <legend class="title">Shipping</legend>
    <div class="field">
      <label>Name</label>
      <input id="name" type="text" />
    </div>
  </fieldset>
  <button id="btn-form-…" class="submit"><i class="icon checkmark"></i></button>
</form>
```

## Tokens

`Form.css` deliberately consumes `--input-*` (`--input-border-radius`, `--input-label-size`) instead
of declaring a `--form-*` layer: a form has no look of its own, its fields do. If the form is used
without the input module mounted, those tokens need a host-level fallback.

<!-- part: id=wiring role=contract -->

## Wiring checklist

1. Add `"form"` to `iBuilderRegistry` in `packages/core/src/types/registry.ts`.
2. Add a loader for `@aio-ui/form` to the host's asset map **and** the input module it delegates to.
3. Add a `stylesheet` loader for `@aio-ui/form/Form.css`.
4. List it in the host's route plan: `registerModule(components, [{ route, components: ["form", "input"] }])`.
