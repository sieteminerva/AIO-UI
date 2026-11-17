# TASK — form modules without a shell (manifest refs vs. definitions)

Recorded 2026-11-17. **A1–A4 landed in batch 52**; the compile-level question in §Decision is still open.
Owner band: **Framework** (`packages/components/form`, `packages/components/input`,
`packages/modules/module-loader`), docs touch `docs/agent/handbook.md`.

## The report

A consumer installs the `.tgz` set by hand, imports nothing from `AioApp`, and renders a form
through `DOMRenderer` + `new FormBuilder({ modules: loader })`. The modules never come alive:
`prepare()` throws

```
[FormBuilder] No module rendered the field. Register the input module in the loader preset.
```

(`packages/components/form/Form.ts:717`, raised by `_renderField()` when no loaded feature
exposes `renderField`.)

## Root cause (verified in source, not guessed)

`FormBuilder` resolves sub-modules through exactly one door: `#activeLoader`, which is
`config.modules` when the consumer passes one, otherwise the built-in loader seeded with
`FORM_ADAPTER_DEFINITIONS` (`Form.ts:352`, `#resolved()` at `Form.ts:216`).

- `ModuleLoader` / `ModuleRegistry` accept **`iModuleDefinition`** — `{ id, requires?, matches?,
  load(context), destroy? }` (`packages/modules/module-loader/ModuleRegistry.ts:15`).
  `ModuleRegistry.register()` stores whatever it is handed without validating, and
  `ModuleLoader.#load()` calls `definition.load(context)` unconditionally
  (`ModuleLoader.ts:229`).
- `FORM_ADAPTER_MANIFEST` is **`iComponentModuleRef[]`** — `{ id, path, export, scope }`
  (`packages/components/form/FormRegistry.ts:63`). That shape is a *manifest ref*: only
  `ComponentRegistry.loadModules()` knows how to turn it into a live object, by
  `import(path)` and picking `export` (`packages/core/src/ComponentRegistry.ts:519-556`).
  It has no `load`, so a `ModuleLoader` built from it can never yield an adapter.

So there are two shapes that "must say the same thing" — and nothing in the public surface says
which one a `ModuleLoader` wants. A consumer reading the manifest (the shape every doc and
README quotes, because it is what an AST declares) reaches for the wrong one, and the only
failure signal is the field message three layers later.

The consumer's own `definitions` array — `{ id: "input", load: () => inputFormAdapter }` — was
already the correct shape; it was simply not the array passed to the constructor. That is the
tell that this is a **surface** defect, not missing behaviour.

## Proposal (recommended: guard + helper + recipe, not a new resolution path)

**A1 — Guard the wrong shape (fail at the door, name both shapes).**
`ModuleRegistry.register()` throws
`RegistryError("INVALID_DEFINITION", …)` when `typeof definition.load !== "function"`, and the
message says: *a manifest ref (`path`/`export`) belongs to `ComponentRegistry`; a loader takes
definitions (`FORM_ADAPTER_DEFINITIONS`) or `{ id, load }`.* Cost: ~15 lines + one test. Turns a
TypeError / a delayed field error into one sentence naming the fix.

**A2 — One helper that converts refs to definitions.**
`resolveModuleDefinitions(refs)` in **`@aio-ui/module-loader`** (not in `form`, not in `core`):
async map over refs → `{ id, load: () => import(ref.path).then((m) => m[ref.export]) }`, `scope`
ignored. Boundary to state out loud: **a builder never awaits module I/O** — the helper is called
by the consumer *before* `create()`, because `prepare()` is synchronous and must stay that way.
This reuses `ComponentRegistry`'s knowledge of the ref shape without duplicating its loader.

**A3 — Document the no-shell path where a consumer looks.**
- `packages/components/form/README.md`: a five-line "no registry, no shell" recipe using
  `FORM_ADAPTER_DEFINITIONS` (this is already all it takes; nobody wrote it down).
- `docs/agent/handbook.md`: same recipe under the form row, plus the one sentence about the two
  shapes. Then regenerate `docs/framework/catalogue.json` (`npm run catalogue:apply`).

**A4 — Pin the two shapes in CI.**
Extend `packages/components/form/__tests__/FormModules.test.ts`: for every id in
`FORM_ADAPTER_MANIFEST` there is a definition in `FORM_ADAPTER_DEFINITIONS` with
`typeof load === "function"`, and the input-scoped ids equal `Object.values(INPUT_MODULE_IDS)`.
Directly encodes "the two shapes must say the same thing".

## Rejected

- **Let `FormBuilder` accept refs and import them itself.** `prepare()` is sync; making the
  builder own module I/O duplicates `ComponentRegistry`'s job and breaks BOUNDARIES §1.
- **Ship a bundled preset entry** (`@aio-ui/form/preset`). `FORM_ADAPTER_DEFINITIONS` is already
  exported from `@aio-ui/form/FormRegistry` and is one line away. A second entry point only adds
  a subpath to keep in sync.

## Proof of render (§16)

| Claim                          | Proof                                                                                     |
| ------------------------------ | ----------------------------------------------------------------------------------------- |
| a loader from definitions works | test: `new FormBuilder({ modules: new ModuleLoader("form", FORM_ADAPTER_DEFINITIONS) })` → `inspect().html` contains N field elements (not just "it did not throw") |
| refs are refused at the door    | test: refs registered → `RegistryError` with code `INVALID_DEFINITION`, message cites both shapes |
| the helper closes the gap       | test: `await resolveModuleDefinitions(FORM_ADAPTER_MANIFEST)` → 9 definitions, all with `load`; a form built from them renders the same N fields |
| the negative                    | test: no `renderField` feature → still the explicit field error (do not lose the loud failure) |

Gate: `npm run check` before the commit, `npm run verify` once at the end of the batch.

## Landed (batch 52)

- **A1** — `RegistryError` gained the code `INVALID_DEFINITION`; `ModuleRegistry.register()` now
  refuses anything without a `load()` and names the shape it was handed ("it looks like a manifest
  ref (`path`/`export`)"), pointing at `FORM_ADAPTER_DEFINITIONS` or `resolveModuleDefinitions()`.
- **A2** — `resolveModuleDefinitions(refs, { import? })` in `@aio-ui/module-loader`: async, parallel,
  order-preserving, returns the **exported symbol itself** (no wrapper, one instance). Rejects a ref
  with no `export` (it does not guess), an unimportable specifier, and a symbol that is not a
  definition.
- **A3** — the surface now says which shape is which:
  - `@aio-ui/form` root exports `FORM_ADAPTER_DEFINITIONS`, `FORM_ADAPTER_IDS`,
    `FORM_ADAPTER_MANIFEST`, `FORM_MODULE_IDS` + types (previously reachable only through the
    undiscoverable `@aio-ui/form/FormRegistry` subpath);
  - `@aio-ui/input` root exports `INPUT_MODULE_DEFINITIONS`, `INPUT_MODULE_DEFINITION_IDS`,
    `INPUT_MODULE_IDS`, `INPUT_MODULE_MANIFEST`, `mountInputModules`, `inputFilesOf` + types.
    Parity with form was missing, even though `input` had the same two-shape split;
  - `packages/components/form/README.md` gained "Without a shell (direct `new FormBuilder`)",
    `packages/components/input/README.md` gained "Modules — pay only for what you use", and
    `docs/agent/handbook.md` gained "Wiring modules by hand — two shapes, one rule".
- **A4** — pinned in tests: refs are refused at the door; a two-adapter stack renders fields with
  the engines genuinely absent (`loadedIds()` proves it); every manifest ref resolves to a real
  definition (`input/__tests__/Modules.test.ts`) so a typo in `path`/`export` can no longer hide
  behind a string comparison; input-scoped definitions route through `provideModules()`.
- **Side finding, fixed:** `input/__tests__/Modules.test.ts` called `.sort()` on the exported
  `INPUT_MODULE_DEFINITION_IDS` constant, silently reordering the preset for every later test in
  the file. Copy-then-sort now.

Result: `verify` → 82 files, 723 passed, 1 skipped.

## Decision still open — compile-level on-demand

Per-adapter subpaths make a module **instantiable** on demand, but not yet **skippable at compile
time**, because each package's own builder statically imports its full default preset:

- `Form.ts:11` → `FORM_ADAPTER_DEFINITIONS` → all five adapters (cascade, multistep, calculation,
  validation, input);
- `Input.ts:7` → `INPUT_MODULE_DEFINITIONS` → all four (dropdown builder, uploader, controls,
  popover).

A synchronous `create()` cannot lazily `import()`, so the default must be reachable statically. Two
ways out, both needing a call from the owner:

1. **Keep the default, accept the cost** — every app that imports `@aio-ui/form` compiles the five
   adapters, every app that imports `@aio-ui/input` compiles the four modules. The subpath exports
   then only prevent *duplicate* copies and allow *behavioural* trimming.
2. **Make the default opt-in** — `@aio-ui/form` ships `FormBuilder` with no adapters (the error
   already tells you what to pass), and the full stack moves to an explicit entry
   (`@aio-ui/form/adapters`, `@aio-ui/input/modules`). That is a breaking change: 12 test files and
   every README example rely on `new FormBuilder({ schema })` working, and a payload with
   `cascading: true` would silently stop cascading for anyone who forgot the import.

Recommendation: (2) as a `0.3.0` item, done in one batch with the tests rewritten to inject the
stack, **not** silently. Until then the docs must not promise "unused modules are not compiled" —
they currently promise exactly that, in the two new sections, which is why this decision is not
cosmetic.
