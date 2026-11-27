# Core (`@aio-ui/core`)

The runtime every other package builds against: the registry kernel, the DOM renderer, the
stylesheet injector, the app shell and the inspection surface. Curated exports, never `export *`.

<!-- install:begin -->
## Install

Version — `0.2.9` (tag `v0.2.9`)

    npm install https://github.com/sieteminerva/AIO-UI/raw/releases/v0.2.9/aio-ui-core-0.2.9.tgz

CDN (ES module, no build step) — `https://cdn.jsdelivr.net/gh/sieteminerva/AIO-UI@v0.2.9/packages/core/dist/index.js`
<!-- install:end -->

## Runtime

| Export                                                                                                                                                          | Role                                                                               |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `AioApp`, `AppStorage`                                                                                                                                          | The app shell: modules, slots, page documents, teardown                            |
| `blockToNode`, `pageToNode`, `isPageDocument`                                                                                                                   | Page document → node tree                                                          |
| `ComponentRegistry`, `mergeBuildConfig`                                                                                                                         | The registry a route declares its components in, and config merging                |
| `Registry`, `RegistryError`, `assertValidId`, `assertValidScope`, `qualifyId`, `splitQualifiedId`                                                               | The id kernel: qualified ids are the coordinate system of the DOM                  |
| `DOMRenderer`                                                                                                                                                   | Builds a node tree into elements; `isRoot` lets a builder root replace its host    |
| `ensureStylesheet`, `injectLazyCss`, `replaceLazyCss`, `isStyleInjected`, `isStylesheetPending`, `normalizeStylesheetPath`, `styleTagId`, `useStylesheetAssets` | One injector, one tag per sheet, one promise per URL                               |
| `TemplateRegistry`, `getTemplates`, `setTemplates`                                                                                                              | Named templates a builder resolves through                                         |
| `getBuilderAdapter`, `setBuilderAdapter`                                                                                                                        | The port `@aio-ui/base` registers its `Builder` on                                 |
| `releaseBuilders`                                                                                                                                               | Drops the per-name instance bookkeeping when an app tears down                     |
| `inspectPage`                                                                                                                                                   | The page-level counterpart of `inspect()`: one payload for the whole rendered page |

Two rules the renderer depends on:

- The import map needs the `"imports"` wrapper, and every package root **and** exact `exports`
  subpath must be mapped — a prefix cannot add `.js`.
- A builder root is recognised by its `getMetadata`, so `isRoot` is the only switch a host needs.

## Types

The contract modules (`iBasicNode`, `iComponentEvents`, `iBuilderRegistry`, `iPageDefinition`, …)
live under `src/types/`. They are types only — a host that wants types without the runtime pays
nothing at runtime.

## Nodes

None — `core` builds nodes, it does not ship one.

## Tokens

None. The shared sheets come from `@aio-ui/styles`; this package only injects what a component
asks for.
