# Builder (`@aio-ui/base`)

The abstract foundation every component builder extends: one lifecycle that resolves config,
mints a stable namespace, creates the reactive DOM records, and tears the instance down without
leaving state behind. `@aio-ui/core` renders whatever a builder returns; this package is where a
builder becomes one.

<!-- install:begin -->
## Install

Version — `0.2.6` (tag `v0.2.6`)

    npm install https://github.com/sieteminerva/AIO-UI/raw/releases/v0.2.6/aio-ui-base-0.2.6.tgz

CDN (ES module, no build step) — `https://cdn.jsdelivr.net/gh/sieteminerva/AIO-UI@v0.2.6/packages/base/dist/index.js`
<!-- install:end -->

## Builder

`Builder` is abstract. A component supplies a `selectors` map, a `config`, optional templates and
an `onCreated` hook, and gets back a root element from `create()` plus `destroy()` for the inverse.
Two instance-level guarantees:

- **One namespace per payload.** The same content yields the same ids on a re-render, so bindings
  and anchors survive a page swap.
- **No stylesheet, no flash.** `create()` holds the root until its sheet lands (`holdUntilStyled`),
  showing the mockup — a component's `loading()` built from `@aio-ui/skeleton`, or the generic
  shimmer skin — instead of unstyled markup.

`inspect()` returns an `iBuilderInspection`: the serialized `html`, the selector `keys`, the
per-key `hierarchy` (what each key actually rendered), the `namespace`, the root `records` and the
`issues` the last `create()` found through the component's `static contract`.

## Adapter pieces

Published from the root, because `Builder` already pulls them:

| Export                              | Role                                                                    |
| ----------------------------------- | ----------------------------------------------------------------------- |
| `Binding`                           | Turns config entries into record fields and back                        |
| `BuilderProxy`, `isReactive`        | The reactive wrapper a builder's config reads through                   |
| `ReactiveGraph`, `EffectFn`         | The dependency graph behind a proxy — effects re-run when a key changes |
| `holdUntilStyled`, `releaseMarkers` | The anti-FOUC hold and the markers it leaves in the DOM                 |
| `normalize`, `validate`             | Content contract: coercion and issue collection (`iNormalizedContent`)  |
| `GLOBAL_INSTANCE_COUNTER`           | Per-name instance counter, used for stable namespaces                   |

`Builder` registers its adapter into `@aio-ui/core` through `setBuilderAdapter`, so the renderer
builds components without importing this package at runtime.

## Tokens

None. `base` ships no CSS: a builder never imports a sheet, it requests one through
`ensureStylesheet` from `@aio-ui/core`.
