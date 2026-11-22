# CDN surface — target map

Status: **stage 1 + stage 2 landed**, 76 rows, 37 packages. v4, 2026-11-22. Derived from the published
`v0.2.4` registry (`releases/registry.json`) and `docs/releases/v0.2.4.md`.

| Stage | Rows | State                                                         |
| ----- | ---- | ------------------------------------------------------------- |
| 1     | 92   | landed — `49b3b45`, gates green (938 tests)                   |
| 2     | 76   | landed — input restructure, `rating` + `modules` kit deletion |

Stage 1 covered: core, utilities, styles, base, form, product, id-address, table, message,
animations. Stage 2 is the list below minus those packages.

## Rules

1. **One root per package.** `@aio-ui/x` is the specifier a consumer names.
2. **A component owns its adapter.** `@aio-ui/table` ships `tableFormAdapter`; a host that imports
   the component has the adapter. No `/adapters/FormAdapter` door.
3. **A component owns its module.** `@aio-ui/input/dropdown` exports `DropdownBuilder` **and**
   `dropdownInputModule`; no `X/module` door.
4. **A non-root subpath must carry runtime value.** Type-only modules live in the root barrel.
   Evidence: `verbatimModuleSyntax` is on, every core-type import is `import type`, and the 189
   built `dist/**/*.js` files import core types through the root.
5. **An alias is not a contract.** A subpath exposing exactly what the root exports is removed.
6. **CSS stays a file.** One sheet per component, never inlined into JS. `<link>` is discovered in
   parallel before JS runs; CSS rows never enter the import map (`emit.ts` → `exact()` skips
   non-`.js`).

## Counts

| Row kind                | v0.2.4 | target |
| ----------------------- | ------ | ------ |
| Registry rows           | 131    | **76** |
| Import-map rows (exact) | 90     | 44     |
| Wildcard patterns       | 3      | 3      |
| CSS rows                | 38     | 29     |
| Packages                | 39     | **37** |

## Removed (55 rows, 2 packages)

| Package           | Removed                                                                                                 | Why                                                                       |
| ----------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `@aio-ui/rating`  | whole package (`.` + `./Rating.css`)                                                                    | Rebuilt later as an input adapter; no second door in the meantime         |
| `@aio-ui/modules` | whole package (`.` — the kit)                                                                           | A kit that only says "install me" adds a hop; see the open item below     |
| `core`            | `./interface ./node ./builder ./registry ./events ./content ./page ./renderer ./api`                    | Type-only                                                                 |
| `core`            | `./app`                                                                                                 | Alias; root already exports `AioApp`, `AppStorage`, `blockToNode`, …      |
| `utilities`       | `./Metadata ./SelectorToTree ./AttributeUtils ./DomUtils ./color.utils ./helper ./parseTableFile`       | Alias; root re-exports every public name (verified in `index.ts`)         |
| `styles`          | `.` + `./variables.css ./typography.css ./components.css ./layout.css ./icon.css`                       | One published sheet: `./index.css`. The five parts stay source-only       |
| `form`            | `./FormRegistry`                                                                                        | Root already exports `FORM_ADAPTER_MANIFEST` + `FormModuleDefinition`     |
| `form`            | `./FormLayout`                                                                                          | Internal layout helper; `Form.ts` imports it relatively                   |
| `form`            | `./Input.FormAdapter`                                                                                   | Same class is element 5 of `FORM_ADAPTER_DEFINITIONS` behind `./adapters` |
| `input`           | `./InputRegistry ./InputModuleTypes ./CalculationTypes ./Missing ./FormValues ./FieldTypes ./Attribute` | Value + type surface moves to the root                                    |
| `input`           | `./modules`                                                                                             | The definitions become `INPUT_MODULE_DEFINITIONS` in the root             |
| `input`           | `./dropdown/module ./file-uploader/module ./controls/module ./popover/module ./picker/module`           | Each module is exported from its component subpath                        |
| `id-address`      | `./adapter ./adapter.native ./adapter.base ./adapter.aio ./form`                                        | Adapters become defaults; the package is root + css                       |
| `table`           | `./adapters/FormAdapter`                                                                                | Exported from `@aio-ui/table`                                             |
| `message`         | `./adapters/FormAdapter`                                                                                | Exported from `@aio-ui/message`                                           |

## Merges (code moves, rows disappear)

| From                                                                                 | To                                        | Note                                                               |
| ------------------------------------------------------------------------------------ | ----------------------------------------- | ------------------------------------------------------------------ |
| `input/Dropdown/Dropdown.InputModule.ts`                                             | `input/Dropdown/Dropdown.ts`              | `dropdownInputModule` exports beside `DropdownBuilder`             |
| `input/FileUploader/FileUploader.InputModule.ts`                                     | `input/FileUploader/FileUploader.ts`      | same                                                               |
| `input/InputControls/InputControls.InputModule.ts`                                   | `input/InputControls/InputControls.ts`    | same                                                               |
| `input/InputPicker/InputPicker.inputModules.ts`                                      | `input/InputPicker/InputPicker.ts`        | same                                                               |
| `input/Popover.InputModule.ts`                                                       | `input/Input.ts` (root)                   | No component of its own — it decorates a field                     |
| `input/InputModules.ts`                                                              | `input/index.ts` (root)                   | `INPUT_MODULE_DEFINITIONS`, `INPUT_MODULE_DEFINITION_IDS`          |
| `table/adapters/FormAdapter.ts`                                                      | `table/index.ts` (root)                   | `tableFormAdapter`                                                 |
| `message/adapters/FormAdapter.ts`                                                    | `message/index.ts` (root)                 | `messageFormAdapter`                                               |
| `id-address/id-address-adapter*.ts`, `IdAddress.FormAdapter.ts`                      | `id-address/index.ts` (root)              | `IdAddressBuilder` + the three adapter flavours + the form adapter |
| `styles/variables.css`, `typography.css`, `components.css`, `layout.css`, `icon.css` | unchanged files; `index.css` imports them | Only `index.css` is exported                                       |

Price of rules 2–3, stated honestly: `@aio-ui/input`, `@aio-ui/table`, `@aio-ui/message` and
`@aio-ui/id-address` **roots now pull their own implementations**. `scripts/bundle-probe.mjs`
currently asserts the opposite ("root stays free of the adapter/module stack"), so the probe's
expectations must change in the same commit — the remaining assertion is "a root never pulls
_another package's_ adapters".

## Surface mechanism — one file to edit

Today a CDN-surface change means editing 39 `package.json` files, then `api-map.json`, then
`catalogue.ts`, then the registry — four places that can disagree. Replace it with one generator,
same write/check shape as `api.mjs` and `catalogue.mjs`:

- `scripts/surface.mjs --write` regenerates every `exports` map from a convention:
  - root → `./index.ts`;
  - component subpath → `./<Folder>/<Folder>.ts` and `./<Folder>/<name>.css`;
  - an optional `"surface": { "entries": [...], "css": [...] }` block in `package.json` overrides
    the convention for the packages that do not follow it (`core`, `styles`, `id-address`, …).
- `scripts/surface.mjs --check` runs inside `npm run check` and fails on drift, plus the two new
  invariants: no type-only subpath, and every `exports` target exists in `files[]`.
- `release.mjs` keeps deriving `subpaths` from `exports`, so `registry.json` and the release note
  follow for free.

Result: shrinking the CDN again = delete a folder or one array entry, then `npm run surface:write`.

## Surviving list — authoritative copy: `docs/releases/v0.2.4.md`

The pre-refactor 82-row snapshot below is kept only as the planning record; the live 76-row list
(37 packages, 45 exact JS + 29 CSS + 2 wildcard) is generated from `releases/registry.json` and
lives in the release note. Open that, not this block, for the current URLs.

<!-- pre-refactor snapshot (82 rows) -->

Base `https://cdn.jsdelivr.net/gh/sieteminerva/AIO-UI@v0.2.5/` — planned tag.

**`@aio-ui/base`** — `packages/base/` (2)

- `@aio-ui/base` → `dist/index.js`
- `@aio-ui/base/BaseAdapters/*` → `src/BaseAdapters/*`

**`@aio-ui/core`** — `packages/core/` (1)

- `@aio-ui/core` → `dist/index.js`

**`@aio-ui/styles`** — `packages/styles/` (1)

- `@aio-ui/styles/index.css` → `src/index.css`

**`@aio-ui/utilities`** — `packages/utilities/` (1)

- `@aio-ui/utilities` → `dist/index.js`

**`@aio-ui/accordion`** — `packages/components/accordion/` (2)

- `@aio-ui/accordion` → `dist/index.js`
- `@aio-ui/accordion/Accordion.css` → `dist/Accordion.css`

**`@aio-ui/article`** — `packages/components/article/` (2)

- `@aio-ui/article` → `dist/index.js`
- `@aio-ui/article/Article.css` → `dist/Article.css`

**`@aio-ui/badge`** — `packages/components/badge/` (2)

- `@aio-ui/badge` → `dist/index.js`
- `@aio-ui/badge/Badge.css` → `dist/Badge.css`

**`@aio-ui/carousel`** — `packages/components/carousel/` (2)

- `@aio-ui/carousel` → `dist/index.js`
- `@aio-ui/carousel/Carousel.css` → `dist/Carousel.css`

**`@aio-ui/code-block`** — `packages/components/code-block/` (2)

- `@aio-ui/code-block` → `dist/index.js`
- `@aio-ui/code-block/CodeBlock.css` → `dist/CodeBlock.css`

**`@aio-ui/fab-menu`** — `packages/components/fab-menu/` (2)

- `@aio-ui/fab-menu` → `dist/index.js`
- `@aio-ui/fab-menu/FabMenu.css` → `dist/FabMenu.css`

**`@aio-ui/footer`** — `packages/components/footer/` (2)

- `@aio-ui/footer` → `dist/index.js`
- `@aio-ui/footer/Footer.css` → `dist/Footer.css`

**`@aio-ui/form`** — `packages/components/form/` (9)

- `@aio-ui/form` → `dist/index.js`
- `@aio-ui/form/adapters` → `dist/FormAdapters.js`
- `@aio-ui/form/Form.css` → `dist/Form.css`
- `@aio-ui/form/FormMessages` → `dist/FormMessages.js`
- `@aio-ui/form/FormModuleTypes` → `dist/FormModuleTypes.js`
- `@aio-ui/form/calculation-adapter` → `dist/adapters/Calculation.js`
- `@aio-ui/form/cascade-adapter` → `dist/adapters/Cascade.js`
- `@aio-ui/form/multistep-adapter` → `dist/adapters/Multistep.js`
- `@aio-ui/form/validation-adapter` → `dist/adapters/Validation.js`

**`@aio-ui/id-address`** — `packages/components/id-address/` (2)

- `@aio-ui/id-address` → `dist/index.js`
- `@aio-ui/id-address/id-address.css` → `dist/id-address.css`

**`@aio-ui/input`** — `packages/components/input/` (10)

- `@aio-ui/input` → `dist/index.js`
- `@aio-ui/input/input.css` → `dist/input.css`
- `@aio-ui/input/dropdown` → `dist/Dropdown/Dropdown.js`
- `@aio-ui/input/dropdown.css` → `dist/Dropdown/Dropdown.css`
- `@aio-ui/input/file-uploader` → `dist/FileUploader/FileUploader.js`
- `@aio-ui/input/file-uploader.css` → `dist/FileUploader/FileUploader.css`
- `@aio-ui/input/controls` → `dist/InputControls/InputControls.js`
- `@aio-ui/input/controls.css` → `dist/InputControls/inputControls.css`
- `@aio-ui/input/picker` → `dist/InputPicker/InputPicker.js`
- `@aio-ui/input/picker.css` → `dist/InputPicker/InputPicker.css`

**`@aio-ui/markdown`** — `packages/components/markdown/` (2)

- `@aio-ui/markdown` → `dist/index.js`
- `@aio-ui/markdown/Markdown.css` → `dist/Markdown.css`

**`@aio-ui/masonry`** — `packages/components/masonry/` (2)

- `@aio-ui/masonry` → `dist/index.js`
- `@aio-ui/masonry/Masonry.css` → `dist/Masonry.css`

**`@aio-ui/menu`** — `packages/components/menu/` (2)

- `@aio-ui/menu` → `dist/index.js`
- `@aio-ui/menu/Menu.css` → `dist/Menu.css`

**`@aio-ui/message`** — `packages/components/message/` (2)

- `@aio-ui/message` → `dist/index.js`
- `@aio-ui/message/Message.css` → `dist/Message.css`

**`@aio-ui/modal`** — `packages/components/modal/` (2)

- `@aio-ui/modal` → `dist/index.js`
- `@aio-ui/modal/Modal.css` → `dist/Modal.css`

**`@aio-ui/mode-switcher`** — `packages/components/mode-switcher/` (2)

- `@aio-ui/mode-switcher` → `dist/index.js`
- `@aio-ui/mode-switcher/ModeSwitcher.css` → `dist/ModeSwitcher.css`

**`@aio-ui/pricing-card`** — `packages/components/pricing-card/` (2)

- `@aio-ui/pricing-card` → `dist/index.js`
- `@aio-ui/pricing-card/PricingCard.css` → `dist/PricingCard.css`

**`@aio-ui/product`** — `packages/components/product/` (4)

- `@aio-ui/product` → `dist/index.js`
- `@aio-ui/product/ProductCard.css` → `dist/ProductCard.css`
- `@aio-ui/product/ProductDetail.css` → `dist/ProductDetail.css`
- `@aio-ui/product/ProductGrid.css` → `dist/ProductGrid.css`

**`@aio-ui/section`** — `packages/components/section/` (2)

- `@aio-ui/section` → `dist/index.js`
- `@aio-ui/section/Section.css` → `dist/Section.css`

**`@aio-ui/skeleton`** — `packages/components/skeleton/` (2)

- `@aio-ui/skeleton` → `dist/index.js`
- `@aio-ui/skeleton/Skeleton.css` → `dist/Skeleton.css`

**`@aio-ui/tab`** — `packages/components/tab/` (2)

- `@aio-ui/tab` → `dist/index.js`
- `@aio-ui/tab/Tab.css` → `dist/Tab.css`

**`@aio-ui/table`** — `packages/components/table/` (2)

- `@aio-ui/table` → `dist/index.js`
- `@aio-ui/table/Table.css` → `dist/Table.css`

**`@aio-ui/animations`** — `packages/modules/animations/` (5)

- `@aio-ui/animations` → `dist/index.js`
- `@aio-ui/animations/Animations.css` → `dist/Animations.css`
- `@aio-ui/animations/behaviours` → `dist/behaviours/registry.js`
- `@aio-ui/animations/behaviours/*` → `dist/behaviours/*.js`
- `@aio-ui/animations/canvas/*` → `dist/canvas/*.js`

**`@aio-ui/dom-renderer`** — `packages/modules/dom-renderer/` (1)

- `@aio-ui/dom-renderer` → `dist/index.js`

**`@aio-ui/event-emitter`** — `packages/modules/event-emitter/` (1)

- `@aio-ui/event-emitter` → `dist/index.js`

**`@aio-ui/http-service`** — `packages/modules/http-service/` (1)

- `@aio-ui/http-service` → `dist/index.js`

**`@aio-ui/module-loader`** — `packages/modules/module-loader/` (1)

- `@aio-ui/module-loader` → `dist/index.js`

**`@aio-ui/router`** — `packages/modules/router/` (1)

- `@aio-ui/router` → `dist/index.js`

**`@aio-ui/theme`** — `packages/modules/theme/` (1)

- `@aio-ui/theme` → `dist/index.js`

**`@aio-ui/theme-cyberpunk`** — `packages/themes/cyberpunk/` (2)

- `@aio-ui/theme-cyberpunk` → `dist/index.js`
- `@aio-ui/theme-cyberpunk/CyberpunkTheme.css` → `dist/src/CyberpunkTheme.css`

**`@aio-ui/theme-default`** — `packages/themes/default/` (1)

- `@aio-ui/theme-default` → `dist/index.js`

**`@aio-ui/theme-horizontal`** — `packages/themes/horizontal/` (1)

- `@aio-ui/theme-horizontal` → `dist/index.js`

**`@aio-ui/themes`** — `packages/kits/themes/` (1)

- `@aio-ui/themes` → `dist/index.js`

## Ripple

- **`@aio-ui/rating` deleted** — remove `packages/components/rating/**`, the workspace entry in
  `examples/gallery/package.json`, `manifest.ts` + `registry.assets.ts` in the demo, and the two
  tests that import `RatingBuilder` (`packages/components/contracts.test.ts`,
  `packages/components/skeleton/__tests__/Mockups.test.ts`). `docs/framework/catalogue.json`
  regenerates.
- **`@aio-ui/modules` deleted** — the demo's `main.ts` imports `AnimationsService`, `EventEmitter`,
  `HttpService`, `HashRouter`, `ThemeRenderer` from it; each becomes its own package root.
  `docs/demo` copy and `getting-started.ts` lose the install line.
- **Adapters into roots** — `orchestrator/catalogue.ts` capabilities `id-address`, `table`,
  `message` and `input` stop naming `/form` and `/adapters/FormAdapter`; they name the package root
  and carry `export: "<symbol>"`. `docs/framework/catalogue.json` regenerates.
- **Input modules into components** — `registry.assets.ts` (demo + gallery) maps `./dropdown` …
  instead of `./dropdown/module`; `InputRegistry.ts` (the manifest) and every `input/*` import in
  `packages/components/form` are rewritten.
- **Styles** — `BASE_STYLES` in `catalogue.ts` already uses `@aio-ui/styles/index.css`; nothing else
  names the five part files (they are source-only for `build-bundle.mjs`).
- **Every removed subpath** — `npm run check:bounds` fails per import until rewritten. That is the
  checklist, not a manual search.
- `docs/framework/PUBLIC-API.md` §2/§3/§9, package READMEs with a specifier table, and
  `docs/releases/v0.2.5.md` (breaking section).

## Gates

1. `node scripts/api.mjs --write` — the root barrels grow (adapters, module definitions, core types).
2. `npm run check` — typecheck, bounds, edges, kit, **bundle probe (expectations updated)**, api,
   catalogue, version.
3. `npm run verify` — adds the test suite.
4. `npm run release:plan` — must print **82** rows (31 CSS + 48 exact JS + 3 wildcards).
5. `npm run build:bundle` — the IIFE pair still builds; every shipped `.css` is still in its entry.

## Open before implementation

1. **`@aio-ui/modules` and `core` — DECIDED (2026-11-22): do not absorb.** The kit is deleted and
   `core` does **not** re-export the module packages. Modules (`event-emitter`, `animations`,
   `http-service`, `router`, `theme`, `module-loader`) are deliberately modular — a consumer imports
   each root it uses. Only the inti (core itself) is carried by `@aio-ui/core`; `dom-renderer` can
   still be used standalone. No new core dependencies.
2. **`form` adapters.** Rules 2–3 were stated for `table`/`message`/`id-address`. The form's own four
   engines stay optional subpaths (importing one adapter must not drag the other three). Confirm.
3. **`id-address`.** "Adapter lainnya bawaan default" means the three flavours are chosen by runtime
   detection inside `IdAddressBuilder`; confirm the pick order (native → base → aio).
4. **Gate.** `scripts/surface.mjs --check` (new) vs extending `api.mjs`. Recommendation: new script,
   single responsibility, same `--write/--check` shape as `catalogue.mjs`.
5. **`base/BaseAdapters/*` and `animations/canvas/*`** — still wildcard rows, still called internal
   by the policy. Wave 2.
6. **CSS into JS / single-file IIFE** — rejected earlier: `<link>` parallelism, no FOUC, no
   `style-src 'unsafe-inline'`.
