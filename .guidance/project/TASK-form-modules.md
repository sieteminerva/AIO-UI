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
  (`packages/components/form/FormRegistry.ts:63`). That shape is a _manifest ref_: only
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
message says: _a manifest ref (`path`/`export`) belongs to `ComponentRegistry`; a loader takes
definitions (`FORM_ADAPTER_DEFINITIONS`) or `{ id, load }`._ Cost: ~15 lines + one test. Turns a
TypeError / a delayed field error into one sentence naming the fix.

**A2 — One helper that converts refs to definitions.**
`resolveModuleDefinitions(refs)` in **`@aio-ui/module-loader`** (not in `form`, not in `core`):
async map over refs → `{ id, load: () => import(ref.path).then((m) => m[ref.export]) }`, `scope`
ignored. Boundary to state out loud: **a builder never awaits module I/O** — the helper is called
by the consumer _before_ `create()`, because `prepare()` is synchronous and must stay that way.
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

| Claim                           | Proof                                                                                                                                                               |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| a loader from definitions works | test: `new FormBuilder({ modules: new ModuleLoader("form", FORM_ADAPTER_DEFINITIONS) })` → `inspect().html` contains N field elements (not just "it did not throw") |
| refs are refused at the door    | test: refs registered → `RegistryError` with code `INVALID_DEFINITION`, message cites both shapes                                                                   |
| the helper closes the gap       | test: `await resolveModuleDefinitions(FORM_ADAPTER_MANIFEST)` → 9 definitions, all with `load`; a form built from them renders the same N fields                    |
| the negative                    | test: no `renderField` feature → still the explicit field error (do not lose the loud failure)                                                                      |

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
   then only prevent _duplicate_ copies and allow _behavioural_ trimming.
2. **Make the default opt-in** — `@aio-ui/form` ships `FormBuilder` with no adapters (the error
   already tells you what to pass), and the full stack moves to an explicit entry
   (`@aio-ui/form/adapters`, `@aio-ui/input/modules`). That is a breaking change: 12 test files and
   every README example rely on `new FormBuilder({ schema })` working, and a payload with
   `cascading: true` would silently stop cascading for anyone who forgot the import.

Recommendation: (2) as a `0.3.0` item, done in one batch with the tests rewritten to inject the
stack, **not** silently. Until then the docs must not promise "unused modules are not compiled" —
they currently promise exactly that, in the two new sections, which is why this decision is not
cosmetic.

## Decision taken (owner, 2026-11-17): option 2 — and it must be *proved*

> "saya setuju opsi 2, tapi pastikan juga untuk benar-benar tidak ikut ter-compile saat build."

So the batch is not "move the import"; it is "**move the import and prove the graph**". A doc claim
is not proof (§16), and a green suite proves nothing about a module that was in the graph before and
after.

### B53.1 — Split each registry so data and implementations live in different modules

| Package | Keep (data only, zero adapter imports)                        | Move out (imports implementations)      | New entry                |
| ------- | ------------------------------------------------------------- | --------------------------------------- | ------------------------ |
| form    | `FormModuleTypes.ts` (`FORM_MODULE_IDS`, context/types), refs array | `FORM_ADAPTER_DEFINITIONS`, `FORM_ADAPTER_IDS` | `@aio-ui/form/adapters`  |
| input   | `InputModuleTypes.ts` (ids/types), refs array                  | `INPUT_MODULE_DEFINITIONS`, `INPUT_MODULE_DEFINITION_IDS` | `@aio-ui/input/modules` |

The manifest refs stay in the light module (they are strings), which is what makes
`FORM_ADAPTER_MANIFEST` still harmless to import from the root.

Two files need more than a move:

- `InputRegistry.ts` currently carries **both** the definitions and the helpers
  (`adaptersOf`, `mountInputModules`, `inputFilesOf`, `inputFilesOf`). The helpers take
  `preset = INPUT_MODULE_DEFINITIONS` as a **default parameter**, which is itself a static edge to
  the four modules. The default has to go: a helper with no preset does nothing (there is nothing
  loaded to mount), and `InputFormAdapter` already threads its own preset through.
- `Input.FormAdapter.ts` passes `this.#preset` (possibly `undefined`) into `mountInputModules()`.
  With the default gone, `undefined` must mean "skip", not "use the full set".

### B53.2 — The default becomes an error, once, with the fix in it

`FormBuilder` / `InputBuilder` with no `modules` must fail at the earliest possible moment with a
message that names the entry (`@aio-ui/form/adapters`, `@aio-ui/input/modules`) and the minimal
option (`[inputFormAdapter]`). It must **not** degrade to "renders nothing useful" and must not
throw halfway through a schema.

### B53.3 — Proof: `scripts/bundle-probe.mjs`

The claim to prove is about **module identity in a real bundle**, so the probe must run the real
bundler and record which files it parsed:

1. Three probe entries under `.draft/bundle-probe/src/`:
   - `form-root.ts` → `import { FormBuilder } from "@aio-ui/form"` (nothing else);
   - `input-root.ts` → `import { InputBuilder } from "@aio-ui/input"`;
   - `form-full.ts` → also imports `@aio-ui/form/adapters`.
2. Build each with Vite (`build.lib` or `build.rollupOptions.input`) in a custom plugin whose
   `moduleParsed(id)` hook collects every resolved module id.
3. Assertions, in both directions:
   - **negative (the point of the batch):** `form-root` never parses `adapters/Cascade.ts`,
     `adapters/Multistep.ts`, `adapters/Calculation.ts`, `adapters/Validation.ts`;
     `input-root` never parses `Dropdown/Dropdown.InputModule.ts`,
     `FileUploader/FileUploader.InputModule.ts`, `InputControls/InputControls.InputModule.ts`,
     `Popover.InputModule.ts`.
   - **positive (the probe is not vacuous):** `form-full` *does* parse all five; `form-root` *does*
     parse `Form.ts`, `Input.FormAdapter.ts`, `Input.ts`.
   - A probe that passes because the build failed must be impossible: exit non-zero on a missing
     chunk, and print the parsed list on failure.
4. Cost target ≤ ~6 s for the three builds; it runs in **`check`** (contract tier), not in the test
   suite, because it is a build-shape fact, not a behaviour fact. If it cannot fit the ~12 s budget,
   it goes to `verify` and the tier table in §4 is updated in the same commit.

### B53.4 — Migration the decision implies

- 12 test files construct `new FormBuilder()`/`new InputBuilder()` with no modules. Each gets an
  explicit stack — and the choice of stack is the test's contract: a cascade test must import the
  cascade adapter, a plain field test only `inputFormAdapter`.
- README examples that show `new FormBuilder({ schema })` must show what to pass.
- `examples/demo` already declares `FORM_ADAPTER_MANIFEST` in its schema, so it is unaffected — that
  is the check that we are not breaking the shell path.
- `docs/framework/api-map.json` gains the two new subpath entries; `catalogue.json` regenerated.
- Version: `0.3.0`. Do not sneak it into `0.2.2`; the release batch (B55) publishes whatever the
  tree says.

### B53.5 — What would make this batch fail

- The probe asserting on **string content** of the bundle instead of parsed module ids (a minifier,
  a comment, or a coincidental identifier makes it lie).
- Proving only the positive direction (the full entry pulls everything) and calling it done.
- Leaving `preset = INPUT_MODULE_DEFINITIONS` as a default parameter somewhere in `input` — the
  graph edge survives the move and the probe should then fail, which is the point.

