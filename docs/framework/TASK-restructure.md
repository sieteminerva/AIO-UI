# TASK — Package restructure: one core, honest edges, one bundle

**Status:** P0 landed (edge manifests, `check:edges`) · next P1 (DOMRenderer folder + kit) · branch `main` @ `af9e364` + uncommitted batch
**Queue entry:** `packages/components/TASKS.md` §0 · **Band:** `packages/**` (Framework)

## Goal

Three install surfaces, each with one job:

| Surface                                | Who uses it         | Looks like                                                              |
| -------------------------------------- | ------------------- | ----------------------------------------------------------------------- |
| `@aio-ui/core`                         | app authors         | `import { AioApp, DOMRenderer, ComponentRegistry } from "@aio-ui/core"` |
| `@aio-ui/<component>`                  | app authors         | one component, its edges declared and reachable                         |
| `aio-ui.js` / `aio-ui.min.js` + `.css` | CDN / no build step | `<script>` → `globalThis.AioUI.*`                                       |

`@aio-ui/app`, `@aio-ui/kits/frameworks` and the notion of "the framework is three packages" go away.

## Reality today (measured, not assumed)

- 23 component packages, 40 total. A scan of every `src` import versus every manifest says:
  19 of 23 components import `base`/`core`/`skeleton` and **declare nothing**; `core` imports
  `@aio-ui/utilities` at runtime and declares nothing; `base` imports utilities and declares
  only `core` (peer) + `skeleton` (dependency).
- `scripts/release.mjs` mode B only rewrites **declared** internal edges into tarball URLs.
  That — not skeleton — is why a single `.tgz` from GitHub fails: its manifest promises no closure.
- `packages/app` (1735 source lines) imports **types only** from `core`, so folding it in cannot
  create a runtime cycle. Nothing in `packages/**` imports `@aio-ui/app` except the frameworks kit.
- `packages/styles` is CSS-only, referenced by hosts through `orchestrator/catalogue.ts`
  `BASE_STYLES`; no package imports it.
- No `esbuild` at the root; `vite` is (the bundle gate already drives it programmatically).

## Decided (user, this session)

1. Skeleton stays under `base` as an **install-only dependency** (done in TASKS #1).
2. `@aio-ui/styles` becomes a **dependency of `core`** — a forgotten styles install is a
   panic-debug, so it must be impossible to forget.
3. `AioApp` lives **inside `core`**, exported from the core barrel (`@aio-ui/core/app` may also
   exist; the barrel is the contract).
4. `@aio-ui/kits/frameworks` is **deleted outright**; version bump **0.2.4** (pre-release, breaking
   is allowed).
5. DOMRenderer kit: whatever is most effective — generated, not hand-copied.
6. Namespace bundle: `AioUI.DOMRenderer`, `AioUI.FormBuilder`, … on `globalThis`; the old two-link
   CDN pattern.

## Target graph (runtime edges; `(i)` = install-only)

```txt
utilities → ∅                     (→ core: type-only, legal)
core      → utilities, styles(i)
base      → core, utilities, skeleton(i)
components→ base (peer) → core/utilities arrive through it
modules/* → core                  (peer)
themes/*  → core                  (peer)
```

No `app`, no `frameworks`. `skeleton ⇄ base` is an **install** cycle, not a module cycle.

## Phases

### P0 — honest manifests (`scripts/edges.mjs`) ✅

- Scan `packages/**/src` imports per package, compare with the manifest, and write the edges:
  `base`/`core` → **peer** (singletons: two copies means two registries and two builder ports),
  `utilities`/`skeleton` → **dependency**.
- Report `declared-but-unused` too (`animations` declares `core`; `router`/`http-service` declare
  `core`+`utilities`; `form` declares `utilities`).
- `--check` joins `npm run check`, so a new import that is not declared fails the gate.
- Prove: build tarballs, install `aio-ui-accordion` alone in `temp/consumer`, import it — the
  closure must resolve through tarball URLs (mode B), and `inspectPage` must produce a tree.

**Landed.** `scripts/edges.mjs` (`--check` inside `npm run check`) derived 85 internal edges across
40 packages; `base`/`core` are peer, an existing peer is never demoted, and `skeleton` is never
repeated on a package that already needs `base` (it arrives through base's install edge).
Proof: `aio-ui-accordion` tarball alone in `temp/consumer` installed its closure (base, core,
utilities, skeleton), `tsc --noEmit` clean, runtime import resolved. `verify` → 875 pass.

### P1 — DOMRenderer becomes self-describing

- `core/src/DOMRenderer/` folder with `index.ts` barrel (pattern: `core/src/Registry/`), the class
  moved verbatim, and a local `types.ts`: `DefaultSelectors`, `iNodeContent`, `iNodeRecordItem`,
  `BuilderName = string` (kills `keyof iBuilderRegistry`, the 115-line type tree).
- `DOMRenderer.kit.ts` **generated** by `scripts/build-renderer-kit.mjs` from the real sources:
  class + the two local helpers + `AttributeUtils` + the two `Metadata` functions + a Map-based
  template store. Zero `@aio-ui/*` imports, no `import.meta.env` (shimmed).
- Guards: `--check` in the gate (kit is up to date) and a **differential test** — one fixture page
  rendered by core's renderer and by the kit, `inspectPage().html` + records must be identical.
- Proof: kit file size, zero-import assertion, identical HTML string.

### P2 — `app` → `core`

1. `packages/app/src/*` → `packages/core/src/app/*`; package specifiers become relative.
2. `core/package.json`: add `"./app"`; core barrel re-exports `AioApp`, `blockToNode`,
   `isPageDocument`, `normalizeRoute`, `pageToNode`, `AppStorage` + the app types.
3. Delete `packages/app` and `packages/kits/frameworks`.
4. Consumers: `examples/demo/src/{main,shell}.ts`, `ColorTheme`, `ThemeConsole`, 6 pages;
   `examples/gallery/src/main.ts` + 2 pages; `Builder` now comes from `@aio-ui/base`.
5. Orchestrator: `catalogue.ts`, `generate.ts`, `plan.test.ts`, regenerate `layout.json`
   (`node orchestrator/layout.mjs --out orchestrator/layout.json`).
6. Version: `node scripts/version.mjs --apply --version 0.2.4`; add `docs/releases/v0.2.4.md`
   with the breaking list (`@aio-ui/app` gone, `@aio-ui/frameworks` gone, import map shape).
7. Proof: `verify:pkgs` (39 → 38 packages), demo build, `node scripts/closure.mjs` shows no
   `app`/`frameworks` node and no new cycle.

### P3 — `styles` is core's dependency

- `core/package.json` → `"dependencies": { "@aio-ui/styles": "^0.2.4" }`; hosts keep linking
  `@aio-ui/styles/index.css` (no file move, no exports change, no import-map churn).
- Nothing imports it from JS — the edge exists so `npm i @aio-ui/core` can never leave the app
  unstyled.

### P4 — one-file namespace bundle

- `scripts/build-bundle.mjs` drives Vite programmatically (same door as `bundle-probe.mjs`, no new
  dependency). Two generated entries in `temp/bundle/`: one imports every public package barrel, one
  `@import`s the sheets in presentation order (`variables → typography → components → layout → icon
→ theme → component sheets → animations`).
- Four artefacts: `aio-ui.js`, `aio-ui.min.js`, `aio-ui.css`, `aio-ui.min.css`.
- Namespace: `globalThis.AioUI` = frozen object of every barrel export, plus `AioUI.version` and a
  per-package sub-object. **Build fails on a duplicate export name** instead of last-writer-wins.
- CSS completeness guard: every `.css` shipped by a package must appear in the bundle entry, or the
  build reports it (a new component cannot be silently unstyled).
- Publish: `publish-cdn.mjs` gains the four files at the branch root; `releases/v<version>/` gains
  them too, and `registry.json` records their names.
- Proof: byte sizes (raw + gzip), module count, and a `temp/` HTML page that loads only the two
  links and renders one route (`inspectPage` output pasted into the report).

### P5 — deferred

- Promote `@aio-ui/dom-renderer` to its own package and let `core` re-export it. Only after P4;
  nothing in P0–P4 depends on it.

## Which manifest system guards what

Three different maps, easy to confuse:

| Map              | File                          | Answers                                                      | Regenerate                                                    |
| ---------------- | ----------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------- |
| Export surface   | `docs/framework/api-map.json` | "is this barrel curated?" (`export *` ban, drift)            | `node scripts/api.mjs --write`                                |
| Import map       | `orchestrator/layout.json`    | "what URL answers `@aio-ui/x/sub`?" — derived from `exports` | `node orchestrator/layout.mjs --out orchestrator/layout.json` |
| Dependency edges | each `package.json`           | "what does this package need installed?" — **missing today** | P0's `scripts/edges.mjs --apply`                              |

`api-map.json` is **not** the dependency contract; it never was. It guards exported names, so it
only changes after P2 (the core barrel gains `AioApp`), and then `--write` is the whole update.

## Gates per phase

| Phase | Gate                                                                     |
| ----- | ------------------------------------------------------------------------ |
| P0    | `npm run check` + `build:pkgs` + real tarball install in `temp/consumer` |
| P1    | `typecheck` + core tests + kit differential test + `--check`             |
| P2    | `npm run verify:pkgs` + demo/gallery build + `closure.mjs`               |
| P3    | `npm run check` (lockfile edge only)                                     |
| P4    | bundle bytes + a browser page loaded from the two links only             |

## Next

Start **P1**: move `DOMRenderer` into `core/src/DOMRenderer/` with a local `types.ts`, then generate
`DOMRenderer.kit.ts` with `scripts/build-renderer-kit.mjs` and guard it with a differential test
(core renderer vs kit, identical `inspectPage().html`).
