# Framework surface — decisions and open items

Status: **landed 2026-11-22** (stage 1 `49b3b45`, stage 2 `b55b5aa`). 131 → **76 rows**, 39 → **37
packages**. The authoritative URL list is generated from `releases/v0.2.4/registry.json` and lives
in `docs/releases/v0.2.4.md` — do not keep a second copy here.

## Rules (the contract)

1. **One root per package.** `@aio-ui/x` is the specifier a consumer names.
2. **A component owns its adapter.** `@aio-ui/table` ships `tableFormAdapter`; a host that imports
   the component has the adapter. No `/adapters/FormAdapter` door.
3. **A component owns its module.** `@aio-ui/input/dropdown` exports `DropdownBuilder` **and**
   `dropdownInputModule`; no `X/module` door.
4. **A non-root subpath must carry runtime value.** Type-only modules live in the root barrel
   (`verbatimModuleSyntax` is on; every core-type import is `import type`).
5. **An alias is not a contract.** A subpath exposing exactly what the root exports is removed.
6. **CSS stays a file.** One sheet per component, never inlined into JS. CSS rows never enter the
   import map (`emit.ts` → `exact()` skips non-`.js`).

## Final counts

| Row kind          | Before | Now    |
| ----------------- | ------ | ------ |
| Registry rows     | 131    | **76** |
| Exact JS rows     | 90     | 45     |
| CSS rows          | 38     | 29     |
| Wildcard patterns | 3      | 2      |
| Packages          | 39     | **37** |

## What moved

- **Input modules into their builders:** `Dropdown.InputModule.ts` → `Dropdown.ts`,
  `FileUploader.InputModule.ts` → `FileUploader.ts`, `InputControls.InputModule.ts` →
  `InputControls.ts`, `InputPicker.inputModules.ts` → `InputPicker.ts`, `Popover.InputModule.ts` →
  `Input.ts`. `InputModules.ts` → `input/index.ts` (`INPUT_MODULE_DEFINITIONS`).
- **Adapters into roots:** `tableFormAdapter`, `messageFormAdapter`, `id-address`'s three flavours
  plus its form adapter.
- **`@aio-ui/rating` deleted** (no second door; an input adapter may rebuild it later).
- **`@aio-ui/modules` kit deleted** — the demo imports each module root directly.
- **Core type-only subpaths collapsed** into the root; `styles` publishes one sheet
  (`./index.css`) and the five parts stay source-only.

## Open items

1. **`@aio-ui/modules` → not absorbed (DECIDED 2026-11-22).** `core` keeps only the inti; modules
   (`event-emitter`, `animations`, `http-service`, `router`, `theme`, `module-loader`) stay
   standalone packages, and `dom-renderer` stays independently consumable.
2. **Form adapters** stay optional subpaths — importing one adapter must not drag the other three
   (the four engines are `validation-adapter`, `cascade-adapter`, `calculation-adapter`,
   `multistep-adapter`).
3. **`id-address` pick order** — adapters are chosen by runtime detection; the agreed order is
   native → base → aio. Confirm before the next change there.
4. **`scripts/surface.mjs --write/--check`** — one generator for the 37 export maps (today a surface
   change edits 37 `package.json` files, then `api-map.json`, `catalogue.ts`, the registry). Not
   built; same shape as `api.mjs` / `catalogue.mjs`. It should also fail a subpath whose target is
   excluded by `files[]` — a silent 404 today.
5. **Wave 2** — `base/BaseAdapters/*` and `animations/canvas/*` are still wildcard rows, still
   called internal by the policy.
6. **CSS into JS / single-file IIFE — rejected.** `<link>` parallelism, no FOUC, no
   `style-src 'unsafe-inline'`.
