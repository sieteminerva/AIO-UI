# AIO-UI — agent handbook

> **Audience:** an agent that must build a working web app **using** `@aio-ui`, measured and
> repeatable, with no human reviewing every screen.
>
> **Not this document:** the protocol for _changing_ this repository (logbook, claim board, commit
> shape, proof of render). That is `AGENTS.md` and `.guidance/AGENT_RULES.md`. This file is for the
> agent on the other side — the one consuming the framework.

`AIO` = **Automating Input Output.** The loop below exists so that "automated" is measurable and not
a claim: every step ends with something you can print.

---

## 0. Get the files

| What                       | Where                                                                         |
| -------------------------- | ----------------------------------------------------------------------------- |
| This handbook              | `https://cdn.jsdelivr.net/gh/sieteminerva/AIO-UI@main/docs/agent/handbook.md` |
| Import map + package table | `https://cdn.jsdelivr.net/gh/sieteminerva/AIO-UI@v<x.y.z>/registry.json`      |
| How a release is published | `docs/live-cdn-repo.md`                                                       |

Pin the **exact** version in the import map. A site loads the release it was generated against, so a
later release can never break it.

---

## 1. The contract in three sentences

1. You write **data**, never DOM: one content AST per page, where each key is a CSS-selector string
   and each value says what that node is.
2. A **builder** turns the part of that data it owns into elements; you name the builder, you never
   construct it.
3. You then **read the result back** (`inspectPage`) and compare it to what you claimed. That read is
   the measurement. Without it, "done" is an opinion.

---

## 2. Preconditions — check these before writing anything

| #   | Precondition                                                                    | If missing                                        |
| --- | ------------------------------------------------------------------------------- | ------------------------------------------------- |
| 1   | A pinned `@aio-ui` version and an import map built from its `registry.json`     | stop; do not invent URLs                          |
| 2   | The list of builder words you will use (Reference B)                            | read the package README, do not guess             |
| 3   | A route per page, all starting with `/`, all unique                             | the app refuses to render                         |
| 4   | The payload shape for **each** builder you named (Reference B / package README) | validation catches it — do not proceed on a guess |
| 5   | A way to run the app (`vite`, a static server, or a test with a DOM)            | you cannot verify, so you cannot claim            |

**Do not** proceed with a precondition missing. A wrong package name is not a small mistake: the
import map resolves to a 404 and the page renders blank with one console line.

---

## 3. The loop

Five steps, in order. Each has a **produce** and a **verify** — never skip the verify.

| #   | Step               | Produce                                     | Verify                                      | Pass looks like                        |
| --- | ------------------ | ------------------------------------------- | ------------------------------------------- | -------------------------------------- |
| 1   | **Plan**           | table: route → builder words → capability   | every word exists in Reference B            | 0 unknown words                        |
| 2   | **Write content**  | one AST per page (§4)                       | every `builder` word was declared in step 1 | 0 undeclared words                     |
| 3   | **Write payloads** | one payload per builder, matching its shape | package README `## Payload`                 | shape matches, no wrapper guessing     |
| 4   | **Render**         | the app, or a test with a DOM               | `inspectPage(root)`                         | `nodeCount > 0`, expected keys present |
| 5   | **Report**         | what you built, with the numbers            | quote the actual counts                     | a reader can re-run it                 |

### Why the loop is in this order

Steps 1–3 are **pure data** and cost nothing to redo. Step 4 is the expensive one. An agent that
writes markup first and checks last discovers its mistakes only after the expensive part — which is
exactly the behaviour this loop removes.

---

## 4. Reference — the content AST

A node is one entry: `"<selector>": { …node }`.

| Syntax                    | Meaning                                                                   | Example                     |
| ------------------------- | ------------------------------------------------------------------------- | --------------------------- |
| `tag`                     | element name; omit for `div`                                              | `main`, `section`           |
| `#id`                     | id                                                                        | `div#hero`                  |
| `.class`                  | one class per dot                                                         | `section.ui.wide`           |
| `[attr='v']`              | attribute                                                                 | `div[data-mode="dark"]`     |
| `a>b>c`                   | **flat lineage** — child keys written on one line, absorbed into the tree | `@section>content>title`    |
| `content`                 | child nodes, a string (HTML), or an element                               | `content: "<p>hi</p>"`      |
| `builder`                 | the component this node **is** (§5)                                       | `builder: "accordion"`      |
| `isRoot`                  | the builder root replaces the host element                                | `isRoot: true`              |
| `attrs`                   | attribute dictionary                                                      | `attrs: { role: "region" }` |
| `config`                  | per-instance configuration                                                | `config: { emoji: false }`  |
| `onCreated` / `onDestroy` | lifecycle hooks                                                           | avoid in autopilot          |
| `isArray`                 | mark the parent of a repeating block                                      | `isArray: true`             |

These keys are **reserved** and never become elements: `content`, `onCreated`, `onDestroy`,
`builder`, `attrs`, `attributes`, `isRoot`, `isArray`, `config`, `selectors`, `options`.

### Three rules that cause most failures

1. **`builder` owns its content.** A node carrying `builder` has its `content` consumed by that
   component; its child nodes are **not** rendered. Put the declaration on an empty host node, never
   on a node that must keep children.
2. **Only declared names are preloaded.** A `builder` word that never appeared in the plan throws
   `module was not preloaded` at render time.
3. **A key must be a real tag.** `div#masonry` is a node; `masonry` alone is a mystery box.

---

## 5. Reference — builder words

Payload shapes below are the ones **verified by rendering** in this repository. Where the shape is
not listed, the package README `## Payload` is the only authority — read it, do not infer it.

| Word                | Package                         | Payload                                                                                       |
| ------------------- | ------------------------------- | --------------------------------------------------------------------------------------------- |
| `accordion`         | `@aio-ui/accordion`             | `{ content: [{ title, description }] }`                                                       |
| `article`           | `@aio-ui/article`               | see README                                                                                    |
| `badge`             | `@aio-ui/badge`                 | see README                                                                                    |
| `carousel`          | `@aio-ui/carousel`              | `{ content: [{ title, description, image }] }`                                                |
| `dropdown`          | `@aio-ui/input/dropdown/module` | see README                                                                                    |
| `fab-menu`          | `@aio-ui/fabmenu`               | `{ title, actions: [{ label }] }` — **no** `content` wrapper                                  |
| `footer`            | `@aio-ui/footer`                | `{ content: { company, columns: [{ title?, description?, actions?: [{ label, href? }] }] } }` |
| `form`              | `@aio-ui/form`                  | `{ config: { fields: [...] } }` — see README for field types                                  |
| `input`             | `@aio-ui/input`                 | see README                                                                                    |
| `input-controls`    | `@aio-ui/input/controls/module` | see README                                                                                    |
| `masonry`           | `@aio-ui/masonry`               | see README                                                                                    |
| `menu`              | `@aio-ui/menu`                  | `{ content: { navigations: [{ href, label, title }] } }`                                      |
| `message`           | `@aio-ui/message`               | see README                                                                                    |
| `modal`             | `@aio-ui/modal`                 | `{ content }` + `config: { id, title }`                                                       |
| `mode-switcher`     | `@aio-ui/modeswitcher`          | `{}`                                                                                          |
| `pricing-card`      | `@aio-ui/pricingcard`           | **array** of `{ header, body: [{ title }], price, action: { label } }`                        |
| `product-card`      | `@aio-ui/product`               | `{ uid, name, category, title, description, price, colors, artwork }`                         |
| `product-card-grid` | `@aio-ui/product`               | `{ content: { data: [<product-card payload>] } }`                                             |
| `product-detail`    | `@aio-ui/product`               | `{ uid, category, title, description, price, currency, colors, artwork }`                     |
| `rating`            | `@aio-ui/rating`                | see README                                                                                    |
| `section`           | `@aio-ui/section`               | `{ content: [{ content: [{ imageUrl?, eyebrow?, title?, description?, actions? }] }] }`       |
| `tab`               | `@aio-ui/tab`                   | `{ content: { menu: string[], body: any[] } }`                                                |
| `table`             | `@aio-ui/table`                 | see README                                                                                    |

Reserved-but-unimplemented words — using one is a defect, not a shortcut: `color-theme`, `editor`,
`form-editor`.

> **The payload envelope is not uniform.** `fab-menu` reads `content.actions`; `product-card` reads
> its record directly; `pricing-card` takes an array. This is the single largest source of agent
> error, which is why the table exists and why a normalised envelope is planned.

### The same table, machine-readable

Don't want to read this file out of date? Fetch the compiled catalogue instead — it is generated
from the 23 component READMEs, so it cannot drift from them:

```
https://cdn.jsdelivr.net/gh/sieteminerva/AIO-UI@main/docs/framework/catalogue.json
```

Per package it carries the title, the lead paragraph, and **every H2** with its prose, its fenced
examples and its tables as `columns` + `rows`. A `see README` cell above is a table row there.

```jsonc
{
  "packages": {
    "accordion": {
      "package": "@aio-ui/accordion",
      "sections": {
        "Payload": { "examples": [{ "lang": "ts", "code": "[{ title: \"…\" }];" }], "tables": [] },
        "Config": {
          "tables": [
            {
              "columns": ["Option", "Default", "Meaning"],
              "rows": [{ "option": "`selectors`", "meaning": "Per-key tag/class override" }],
            },
          ],
        },
      },
    },
  },
}
```

**What it is not:** the catalogue is an _index_, not a schema. It tells you what the README says, in
machine shape — it cannot tell you that a payload is valid. That needs a per-component contract
(§9).

### Wiring modules by hand — two shapes, one rule

`form` and `input` each ship optional sub-modules. They are described in **two shapes that look
alike**, and only one of them can be registered:

| Shape          | Looks like                                                                   | Consumed by                                       |
| -------------- | ---------------------------------------------------------------------------- | ------------------------------------------------- |
| **ref**        | `{ id, path: "@aio-ui/form/cascade-adapter", export: "cascadeFormAdapter" }` | `ComponentRegistry`, `resolveModuleDefinitions()` |
| **definition** | `{ id, load: (context) => … }`                                               | `ModuleLoader`, `config.modules`                  |

A ref handed to a loader now throws `RegistryError` with code `INVALID_DEFINITION` — it used to be
accepted and surface much later as `No module rendered the field`.

```ts
import { ModuleLoader, resolveModuleDefinitions } from "@aio-ui/module-loader";
import { FormBuilder, FORM_ADAPTER_MANIFEST } from "@aio-ui/form";
import { inputFormAdapter } from "@aio-ui/form/Input.FormAdapter";

// Want everything: one import of the definitions — note the subpath, not the root.
// Nine entries: four engines, `input`, and the four field modules. A form built this way
// has a real dropdown, a real uploader and a real action set.
import { FORM_ADAPTER_DEFINITIONS } from "@aio-ui/form/adapters";
new FormBuilder({ modules: new ModuleLoader("form", FORM_ADAPTER_DEFINITIONS) });

// Want less: each adapter is its own subpath, so the rest is never loaded.
new FormBuilder({ modules: new ModuleLoader("form", [inputFormAdapter]) });

// Have refs (an AST, a manifest)? Resolve them once, before anything is built.
const refs = FORM_ADAPTER_MANIFEST.filter((ref) => (ref.scope ?? "form") === "form");
new FormBuilder({ modules: new ModuleLoader("form", await resolveModuleDefinitions(refs)) });

// A trimmed stack that still needs dropdown/file/controls/popover declares the input layer
// separately — same four definitions, the form just has to know they are field presets.
import { INPUT_MODULE_DEFINITIONS } from "@aio-ui/input/modules";
new FormBuilder({ modules: loader, inputModules: INPUT_MODULE_DEFINITIONS });
```

Why the subpath: since `0.2.2` the builder ships **no** stack of its own, so importing
`@aio-ui/form` compiles no engine — `scripts/bundle-probe.mjs` fails the `check` gate if that ever
stops being true. A builder with no modules throws on the first `create()` and names the import.

Two traps, in order of how often they bite:

1. **A missing sub-module is never silent.** Omit one and the field keeps working in a plainer
   shape — a dropdown becomes a native `<select>`, a `file` field a plain file input, a popover
   is not attached — but the layer says so: one `console.warn` per builder and capability, plus a
   `moduleMissing` event through `config.emit`. Two cases **throw** instead, because a warning
   would leave a hole: a declared `config.actions` with no `controls` module (the buttons would
   never exist) and a `config.files` policy with no `file` module (the bytes would be dropped).
2. **`resolveModuleDefinitions()` is async and must finish before `create()`.** A builder's render
   is synchronous and never owns module I/O.

---

## 6. Reference — how to verify

### Page level

```ts
import { inspectPage } from "@aio-ui/core";

const root = renderer.render(page, renderFn, buildFn, { scopeId: "home" });
const { html, records, nodeCount } = inspectPage(root);

console.assert(nodeCount > 0, "the page built nothing");
console.assert(
  records.some((r) => r.relations?.key === "div.hero"),
  "hero is missing",
);
```

### Component level

```ts
import { SectionBuilder } from "@aio-ui/section";

const builder = new SectionBuilder(config);
builder.create(payload);
const { keys, hierarchy, html } = builder.inspect();

// presence · shape · value · the negative
console.assert(keys.length > 0);
console.assert(Array.isArray(hierarchy[keys[0]].elements));
console.assert(html.length > 0);
```

### What a pass is allowed to claim

| Claim                       | Needs                                       | Note                           |
| --------------------------- | ------------------------------------------- | ------------------------------ |
| "the structure is right"    | `inspectPage` / `inspect`                   | synchronous, no browser needed |
| "it is styled correctly"    | a real browser + `getComputedStyle`         | never infer it from markup     |
| "the colours meet contrast" | the theme report in the demo's theme editor | never eyeball it               |

`inspect()` is deterministic: the same payload renders the same markup twice, so a diff is a real
diff. A namespace is **not** a unique key (it summarises from the first few items of a value), so
equal ids mean "same seed", not "same content".

---

## 7. Failure → action

| Symptom                                   | Cause                                                | Action                                                                     |
| ----------------------------------------- | ---------------------------------------------------- | -------------------------------------------------------------------------- |
| Blank page, one console line              | import map does not resolve                          | fix the specifier; every package root **and** exact subpath must be mapped |
| `module was not preloaded`                | a `builder` word used but never declared in the plan | add it to the plan, or remove the node                                     |
| `prepare() returned no valid DOM element` | payload shape wrong for that builder                 | re-read the package README `## Payload`                                    |
| `Unknown selector "@x"`                   | the builder's selector map has no such key           | you are using another component's key names                                |
| Node renders but is empty                 | `builder` set on a node that had children            | move the declaration to an empty host                                      |
| Styles missing                            | stylesheet not loaded for that component             | load the CSS subpath from the package                                      |
| Everything renders, nothing is styled     | the base stylesheet is missing                       | link `@aio-ui/styles/index.css`                                            |

---

## 8. Hard rules

1. **Never invent a package name or a builder word.** If it is not in Reference B or a README, it does
   not exist.
2. **Never guess a payload shape.** Read the README. A wrong shape is caught at render, not at write.
3. **One route per page, unique, starting with `/`.**
4. **Pin the version.** Never `@latest` in an import map.
5. **Report numbers, not adjectives.** `nodeCount: 14`, not "looks good".
6. **Never claim appearance from structure.** Markup proves structure only.
7. **One change at a time.** Write the plan, then one page; verify, then the next.

---

## 9. Known gaps in this handbook

Stated so you do not assume automation that does not exist yet:

| Gap                                  | Today                                                                 | Planned                                      |
| ------------------------------------ | --------------------------------------------------------------------- | -------------------------------------------- |
| Per-component payload **schema**     | `catalogue.json` (what the README says) + `inspect()` (what it built) | `static input` contracts validated in `base` |
| Palette / payload validator as a CLI | the generator's `plan()` + `parsePreset()`, inside the repo           | `check-preset` CLI printing coded issues     |
| Runtime error codes                  | prose messages (`module was not preloaded`)                           | `AIOP_nnn` codes with one table              |

Until those land, a payload mistake costs a render cycle rather than a validator run. Budget for it.
