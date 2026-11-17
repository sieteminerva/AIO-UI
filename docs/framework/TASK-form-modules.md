# TASK — form modules without a shell (manifest refs vs. definitions)

Recorded 2026-11-17. **A1–A4 landed in batch 52**; **the opt-in split and its graph proof landed in
batch 53**; **the warn/throw policy, the form's full stack and the dependency move landed in b53b**
(see the end of this file). **`0.2.3` is published** (B55/B56, 2026-11-18).

**Status:** `check:bundle` green (152 parsed modules) · `verify` → 83 files, 757 passed, 1 skipped.
**Next:** B54 remainder — `scripts/exports.mjs` + `check:exports`
(`docs/framework/TASK-releases-branch.md`).

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

## Decision taken (owner, 2026-11-17): option 2 — and it must be _proved_

> "saya setuju opsi 2, tapi pastikan juga untuk benar-benar tidak ikut ter-compile saat build."

So the batch is not "move the import"; it is "**move the import and prove the graph**". A doc claim
is not proof (§16), and a green suite proves nothing about a module that was in the graph before and
after.

### B53.1 — Split each registry so data and implementations live in different modules

| Package | Keep (data only, zero adapter imports)                              | Move out (imports implementations)                        | New entry               |
| ------- | ------------------------------------------------------------------- | --------------------------------------------------------- | ----------------------- |
| form    | `FormModuleTypes.ts` (`FORM_MODULE_IDS`, context/types), refs array | `FORM_ADAPTER_DEFINITIONS`, `FORM_ADAPTER_IDS`            | `@aio-ui/form/adapters` |
| input   | `InputModuleTypes.ts` (ids/types), refs array                       | `INPUT_MODULE_DEFINITIONS`, `INPUT_MODULE_DEFINITION_IDS` | `@aio-ui/input/modules` |

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

1. Three probe entries under `temp/bundle-probe/src/`:
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
   - **positive (the probe is not vacuous):** `form-full` _does_ parse all five; `form-root` _does_
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
- Version: `0.2.2` (third digit only while pre-release — D4). The release batch (B55/B56) publishes
  whatever the tree says.

### B53.5 — What would make this batch fail

- The probe asserting on **string content** of the bundle instead of parsed module ids (a minifier,
  a comment, or a coincidental identifier makes it lie).
- Proving only the positive direction (the full entry pulls everything) and calling it done.
- Leaving `preset = INPUT_MODULE_DEFINITIONS` as a default parameter somewhere in `input` — the
  graph edge survives the move and the probe should then fail, which is the point.

## The input modules default — analysis (owner's question, 2026-11-17)

> "...untuk input ini yang saya masih bimbang, apakah dropdown, file-uploader, controls itu baiknya
> memang auto included atau defaultnya terpisah ... kalau orang yang cuma butuh input text kan ga
> guna build codenya jadi besar."

Three options, stated with what each costs:

| Option                                 | Who is happy                        | Who pays                                                                                                                                                                         |
| -------------------------------------- | ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **A — all four auto-included** (today) | a form developer, zero imports      | everyone rendering one text field compiles the dropdown builder, the uploader, the action set and the popover: `@aio-ui/input` dist is **591 KB**, and those four are most of it |
| **B — none by default** (B53)          | one text field costs one text field | a payload that relies on dropdown/file/popover _behaviour_ loses it silently unless the host declares the modules                                                                |
| **C — a third "essential" preset**     | nobody in particular                | a preset to keep in sync forever, and a second thing to explain; only worth it if B proves harmful                                                                               |

**The deciding fact is an asymmetry we already have:** the _declarative_ path is unaffected.
`FORM_ADAPTER_MANIFEST` lists the four input refs with `scope: "input"`, so every AST / registry app
— the shell path, the demo, anything built through `ComponentRegistry` — keeps all four with **no
import at all**. Only the hand-wired JS consumer becomes explicit, and that consumer is exactly the
one who complained about bundle size.

**Recommendation: B, with two conditions.**

1. **Measure the degradation matrix before committing to it.** For every declared field type, build
   it with `modules: []` and assert an element still exists. If a type renders a _hole_ rather than a
   plainer control, that type belongs in `Input.ts` natively — the module should be an enhancement,
   never a precondition. Any type that cannot move (because it _is_ the module, e.g. `dropdown`) is
   the one case where "auto-include" is the honest answer, and that would become a per-module
   decision rather than a per-layer one.
2. **One obvious full-stack import.** `@aio-ui/input/modules` = all four, `@aio-ui/form/adapters` =
   all five, each as the _first_ line of its README section, so "saya mau semua" is one import
   rather than four — the ergonomic cost of B is one line, and it is visible in a diff, unlike an
   invisible 591 KB.

If the owner later disagrees, the switch back is one export in one file: nothing else in the design
depends on which default wins.

## Landed (batch 53) — opt-in, and proved by the module graph

| Claim (B53)                              | What actually shipped                                                                                                                                                                                                                                                                                                                                                                                               |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| B53.1 split: data vs. implementations    | `FormRegistry.ts` keeps `FORM_ADAPTER_MANIFEST` + `FormModuleDefinition`; new `FormAdapters.ts` holds `FORM_ADAPTER_DEFINITIONS`/`FORM_ADAPTER_IDS`. `InputRegistry.ts` keeps the manifest + helpers; new `InputModules.ts` holds `INPUT_MODULE_DEFINITIONS`/`INPUT_MODULE_DEFINITION_IDS`. Both roots dropped the definition arrays (manifest/ids/types stay).                                                     |
| B53.2 the default becomes an error, once | `FormBuilder` with no modules and no `provideModules()` throws at the top of `prepare()`: _"No modules configured, so not one field can be rendered. Pass the stack: new ModuleLoader(\"form\", FORM_ADAPTER_DEFINITIONS) — those definitions are exported by @aio-ui/form/adapters …"_. `InputBuilder` deliberately does **not** throw: a field without modules is a complete, plainer field (see the matrix).     |
| B53.3 `scripts/bundle-probe.mjs`         | Four Vite builds (`form-root`, `input-root`, `form-full`, `input-full`) with ids collected from Vite's `transform`/`load` hooks — Vite 8 no longer fires Rollup's `moduleParsed`, and asserting on bundle text was ruled out up front. Both directions asserted; an empty parse is a failure; failure prints the parsed list. ≈1.3 s, wired as `check:bundle` inside `check`.                                       |
| B53.4 migration                          | Each test now names its stack: `[inputFormAdapter]` for plain-field cases, the full stack for cascade/multistep, `inputModules` for the action set. `FormConfig`, `FormRow`, `FormSubmit`, `FormModules`, `Cascade`, `Input.test`, `InputControls`, `FileModule`, `Modules` touched. READMEs, `docs/agent/handbook.md`, `api-map.json` and `catalogue.json` updated; the demo's asset map gained both new subpaths. |
| B53.5 what would make it fail            | Checked rather than assumed: pointing `form-root` at the adapters produced five findings; `preset = INPUT_MODULE_DEFINITIONS` default parameters are gone from every helper (`mountInputModules`, `mountControls`, `inputFilesOf` now do nothing without a preset).                                                                                                                                                 |

**New surface, one line each:** `FormBuilder` gained `config.inputModules` (the field-level preset
the manifest path used to fill in invisibly), and `Input.ts` renders a native `<select>` for a type
whose matrix row names no control — so `dropdown` without its module is plainer, not a hole.

**Not done here, on purpose:** the version bump (B56 publishes what the tree says) and the
`releases` branch work (B54–B56).

## Owner decisions (2026-11-17, after b53) — warnings, full stack, numbering

> "fallback ke select oke … tapi untuk semuanya yang butuh submodule tapi ga di install sebaiknya
> kasih warn, tapi kalau yang ga cukup warn kasih throw error yang jelas alasan-nya … untuk form
> tetap otomatis menginstall input dan untuk submodule input diaktifkan semua … sebaiknya increment
> di digit ke 3 saja"

### D1 — every degraded capability speaks; the ones that cannot be warned about throw

| Capability missing | What the field does                                       | Signal                                                                                                                                              |
| ------------------ | --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `dropdown`         | native `<select>` from the same options                   | **warn** — a plainer control, same answer                                                                                                           |
| `popover`          | no anchor; the control is unchanged                       | **warn** — purely additive                                                                                                                          |
| `controls`         | no button set                                             | **throw at the declaration site** when the schema declares `actions` — a group that asked for buttons and got none is a hole, not a plainer control |
| `file`             | plain `<input type="file">`, `onFileSelected` never fires | **warn** on the field; **throw in `beforeSubmit`** when the form declares `config.files` — that policy would silently drop the bytes                |
| `inputFormAdapter` | no field can be built                                     | **throw** on `create()` (already, b53)                                                                                                              |

Mechanism — one helper, not four call sites: `packages/components/input/Missing.ts` exports
`reportMissing({ capability, module, fix, severity })`.

- `severity: "warn"` → `console.warn` **once per builder instance and capability** (a 40-field
  schema must not print 40 lines) and `emit("moduleMissing", { capability, module })` when the host
  passed an emitter, so an app can surface it in its own UI.
- `severity: "error"` → throw naming the capability, the module id and the exact import that fixes
  it — the same shape as the b53 message, which is why a consumer can act on it without the source.

Proof: one test per table row (`vi.spyOn(console, "warn")`), one that the warn fires **once** for
two degraded fields, and one per throw asserting the module id and the subpath appear in the message.

### D2 — the form stack owns the input layer again, at the _entry_ level

`@aio-ui/form/adapters` exports `FORM_ADAPTER_DEFINITIONS` **including** the four input definitions,
and `Form.prepare()` routes every loader id in `INPUT_MODULE_IDS` into `#inputModules` — the same
id-based rule `provideModules()` has always used — instead of loading it as a form feature. One
import means everything on; the roots stay empty, so `form-root` is still proved clean while
`form-full` now proves the five adapters **and** the four modules are in the graph.

A standalone `InputBuilder` stays opt-in (`@aio-ui/input/modules`): a bare text field should not pay
for a dropdown builder. "All four on" is a **form** default, not an input one.

### D3 — `@aio-ui/form` installs `@aio-ui/input` automatically

Move that internal edge from `peerDependencies` to `dependencies` so installing the form tarball
brings its field layer without a second URL. The range stays a caret (`^0.2.x`) like every other
internal edge: `scripts/version.mjs` rewrites them all to `^<version>` at bump time and its
`--check` fails on anything that is not `^x.y.z`, so a literal pin would break the version gate for
a distinction nobody can observe inside one fixed-version family. Every other internal edge stays a
peer until B55 decides per package from the closure graph — that decision only becomes measurable
once the graph exists.

### D4 — numbering: third digit only while pre-release

`0.3.0` is withdrawn. This batch and the release that follows are `0.2.2`, then `0.2.3`, … until the
third digit saturates. Breaking notes live in the release body, not in the number.

## Next

1. **B54 remainder** — `scripts/exports.mjs` + `check:exports`. `closure.mjs` and both release modes
   are landed; the export index is the last piece. `orchestrator/release.test.ts` already reads
   `releases/v<version>/` and runs 14 checks against `v0.2.3` — regenerate the folder with
   `release.mjs --version <v> --apply` whenever a subpath is added, or the suite starts skipping.
2. **B57** — the Releases page: `GITHUB_TOKEN=… node scripts/publish-release-assets.mjs --tag v0.2.3
--body temp/release-body.md --apply`. Owner's manual step; nothing else needs a token.
