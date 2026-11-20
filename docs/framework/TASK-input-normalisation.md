# TASK — input normalisation (schema door, content-once)

**Status:** batches A, B, C, D and E landed 2026-11-21. The task is closed.
Superseded `packages/components/DISCUSSION_ANALYSIS.md` (scratch, deleted 2026-11-21).

## Landed — batch A (2026-11-21)

- `Builder.create(schema?)` with `iBuilderSchema = { content?, config? }`. `content ?? {}` is the
  single default, so `create()` / `create({})` still render an empty state, not `undefined.x`.
- `prepare()` / `initialize()` / `loading()` receive `schema.content`; the proxy wraps that value.
- `mergeBuildConfig(theme, emitter, schemaConfig)` — three layers. `iComponentManifest.config` is
  deleted; the registry recognises a node by `builder` and hands the builder one schema. A bare
  payload is the content.
- Demo and gallery manifests now carry loading facts only; demo call sites pass real nodes
  (`{ builder, content, config }`) and the gallery attaches one emitter through
  `registry.useEmitter()` instead of merging `emit` per registration. Batch B's first and last
  bullets were pulled forward: A cannot compile against a manifest that still carries data.
- ~40 call sites updated (base tests first). Two wrappers remain where a builder still reads its
  own `{ content }` envelope — `accordion`, `input-controls` — and batch C/D remove them.
- Proof: `npm run verify` green; browser measurements on the demo dev server — `#kitchen` badge
  rendered, `#kitchen/accordion` 2 sections, `#form` 1 form / 42 fields, `#product` 6 cards with
  variants, no `.error` panel on any route.

## Landed — batch B (2026-11-21)

- `examples/gallery/src/content/wizard.ts` passes a node: `{ builder: "form", content, config }`.
  The old `{ config, schema }` was not a node, so the registry handed the whole object to
  `prepare()` and no field could render.
- Gallery registrations carry loading facts only (`path`, `stylesheet`, `export`, `modules`); the
  host no longer re-derives `schema` from the node.
- Found while proving it: the gallery form had no adapter stack and no `export`, so it threw
  "No modules configured" before reaching the payload. Fixed in the host: `export: "FormBuilder"`,
  `FORM_ADAPTER_MANIFEST` + the table adapter in `modules`, their specifiers in
  `registry.assets.ts`, and `@aio-ui/input` declared in `examples/gallery/package.json`.
- Proof: `npm run verify` green; gallery `#form` measured in the browser — 1 form, 5 groups,
  21 fields, 0 error panels. Demo `#form` was measured in A (42 fields).

## Landed — batch C (2026-11-21)

- The compensation unwraps are gone: `menu` (`Menu.ts`), `product` (`ProductBuilder`,
  `ProductDetail.engine`, `ProductGrid.engine`), `section` (`Section.engine`), `accordion`
  (`Accordion.ts`), `form` (`Form.ts`) all receive the payload directly. `pricing-card` was
  already clean.
- `section` root identity moved to config: `iSectionConfig.id` added; `@section` stamps
  `config.id` / `config.className`, never the content payload. Demo row flattened to the column
  array with `config: { id: "demo-section", className: "demo" }`.
- Demo rows flattened to the payload itself (`section` column array, `accordion` item array).
  Tests lock the negative: a `{ content }` key is a field now, not an envelope.
- `input-controls` payload keeps its real `content` field (its rename is D), so its double
  wrapper in `InputControls.InputModule.ts` is unchanged.
- Proof: `npm run verify` → 86 files / 874 passed, 15 skipped. `Section.test.ts` asserts 2
  `.section-column` nodes and root id/className from config.

## Landed — batch D (2026-11-21)

- Every payload-level `content` is gone from the 15 listed components. Whole-payload cases became
  the payload (`article`, `badge`, `carousel`, `footer`, `input-controls`, `tab` top-level);
  one-field cases were renamed: `masonry` → `items`, `section` column → `blocks`, `tab` item →
  `panel`, `table` adapter spec → `data`, and `pricing-card` dropped its `body` alias.
- Legacy unwraps deleted: `CodeBlock` `{ content }`, `ProductCard` `content?.content`, `Article`,
  `Carousel` (payload and `totalSlides`), `Tab` top-level.
- Docs updated: each touched README `## Payload`, `docs/agent/handbook.md` word table, and
  `docs/framework/COMPONENT-DATA.md` (whose broken table was repaired).
- Deviation from "one commit per component": the demo/gallery rows share one
  `examples/demo/src/manifest.ts`, so D landed as one batch commit rather than 15.
- Proof: `npm run verify` → 86 files / 873 passed, 15 skipped. Negative tests lock the removal —
  badge/carousel/masonry assert a `{ content }` payload renders nothing or yields `[]`.

## Decision (approved 2026-11-21)

1. The builder door is `create(schema)`; `schema = { content, config }`.
2. `iComponentManifest.config` is deleted. `manifest.schema` stays, as the rare payload override.
3. The registry is the wrapper: it turns a node into a schema and never guesses payload shape.
   A node is recognised by `builder` — the same discriminator `DOMRenderer` already uses.
4. `content` appears exactly once: inside `schema`. **No payload field may be named `content`.**
   Inner keys use domain words.
5. A builder never sees the node (`builder`, `isRoot`, `attrs`, `onCreated`, host element). It
   assembles elements; the renderer mounts them — as root (`isRoot`) or as a child of the
   element it declared.
6. `prepare(schema.content, this.config)`; the config argument stays optional and defaults to
   `this.config`, so a future `create()` that mutates config still reaches `prepare()`.

Out of scope by the owner's decision: `id-address`'s internal `this.schema`, event
`emit(event, payload)`.

## Vocabulary — one word per layer

| Layer                    | Word        | Anchor                                                                      |
| ------------------------ | ----------- | --------------------------------------------------------------------------- |
| page entry               | **node**    | `iBasicBuilderNode` (`core/types/node.ts:124-131`) = schema + directives    |
| builder door             | **schema**  | `create(schema)`, `manifest.schema` override                                |
| component payload        | **content** | `schema.content`, typed by `iBuilderRegistry[K]` (`core/types/registry.ts`) |
| content after processing | **payload** | proxy, `template(typeKey, el, payload)`, `iNodeRecordItem.payload`          |

`schema` may also mean "specification" (a field spec in `input/Attribute.ts`, `contract.schema`);
it never means a value at the page-tree layer.

## Ownership

| Owner             | Knows                                            | Must not know                                  |
| ----------------- | ------------------------------------------------ | ---------------------------------------------- |
| DOMRenderer       | node, host element, `isRoot`, attrs, lifecycle   | content                                        |
| ComponentRegistry | node → schema, `theme < emitter < schema.config` | the shape of a payload                         |
| Builder           | `schema.content`, `schema.config`                | node, host element, root identity from content |

Quick test for "who owns this key": changes what is rendered → content; changes the host/root →
node or config; comes from theme/emitter/app → config; describes a shape → `contract.schema`.

## Batches

### A — door and registry ✅ landed 2026-11-21

- `Builder.create(schema)`; `prepare(schema.content, this.config)` (`base/src/Base.ts:590`).
- Registry (`core/src/ComponentRegistry.ts:563-620`):
  `isNode = isPlainRecord(data) && typeof data.builder === "string"`;
  `schema = manifest.schema ?? { content: isNode ? data.content : data, config: isNode ? data.config : undefined }`;
  `config = mergeBuildConfig(theme, emitter, schema.config)`; `instance.create(schema)`.
- Delete `manifest.config`; `mergeBuildConfig` loses its `manifest` argument (4 layers → 3).
- Update ~35 `.create(` call sites across 15 files (base tests first). `create({})` becomes an
  empty schema — every builder must tolerate `content === undefined`; the tests will say which
  do not.
- Rewrite `core/src/__tests__/ComponentRegistry.test.ts:143,156,161-180` — they encode the two
  old guesses (`{content}` unwrap, config from a non-node object) and the manifest-config layer.
- Proof: `inspect().html` per demo route (kitchen, form, product) and gallery page identical
  before/after, then `npm run verify`.

### B — upstream carries no data ✅ landed 2026-11-21

- `examples/demo/src/manifest.ts:525` → `{ path, stylesheet }` only; move `entry.config` to the
  build call (`pages/docs-panels.ts`, `previewPanel`).
- `examples/demo/src/theme-switcher.ts:63` → `{ content: { … } }`.
- `examples/demo/src/form/panels.ts:64` → `{ content: schema, config }`.
- `examples/gallery/src/content/wizard.ts:464` → `{ content: formContent, config: formConfig }`.
- `examples/gallery/src/main.ts:99-140` → `schema: { content: data?.content ?? data, config }`;
  replace the manual `emit` merge with `registry.useEmitter(emitter)` — the registry already
  merges it (`ComponentRegistry.ts:263`).
- Proof: `npm run verify` + the demo form route actually renders fields (today `wizard`'s
  `{ config, schema }` reaches `prepare()` intact, so it likely renders none — prove it).

### C — delete the compensation code ✅ landed 2026-11-21

- 7 sites `data?.content ?? data`: `accordion/Accordion.ts:70-71`, `menu/Menu.ts:107`,
  `pricing-card/PricingCard.ts:108`, `product/ProductBuilder.ts:94`,
  `product/ProductDetail.engine.ts:12`, `product/ProductGrid.engine.ts:12-13`,
  `section/Section.engine.ts:26`.
- `Form.prepare` unwrap `form/Form.ts:449-454`.
- Root identity from payload: `section/Section.ts:143-145` (`@section` id/className) → comes from
  `config.id` / `config.className` or the node, never from content.
- Proof: `npm run verify`; snapshots identical.

### D — `content` appears once (one commit per component) ✅ landed 2026-11-21

Payloads carrying a `content` field today: `accordion`, `article`, `badge`, `carousel`,
`code-block`, `footer`, `form`, `input-controls`, `masonry`, `menu`, `pricing-card`, `product`,
`section`, `tab`, `table`.

Rule: a `content` that **is** the whole payload → the value becomes the payload itself; a
`content` that is **one field among others** → rename to a domain word.

`section` (proven shape): `{ columns: [{ className?, blocks: [...] }] }` —
`iNormalizedColumn` already uses those words (`Section.engine.ts:5-13`); the flat block list stays
as `legacy`. Then update `iBuilderRegistry` (`core/types/registry.ts:47-84`; `section` is currently
`iBuilderContent[]`), the README payload sections, and `npm run catalogue:apply`.

### E — contract ✅ landed 2026-11-21

- `iContentSpec` / `iContentContract` / `iContentIssue` live in `core/src/types/content.ts` (types
  only, no component table in core).
- `normalize(contract, content)` in `base/src/BaseAdapters/ContentContract.ts`: total (never
  throws), idempotent, legacy spellings resolved once, unknown fields warned **and kept**.
  `validate()` is the verdict-only form.
- `Builder.contract` (static, optional) is read by `create()`; `inspect()` returns `issues`.
- 22 builders declare a contract. `@aio-ui/id-address` is a plugin, not a builder, so it takes no
  content payload.
  - `list.single` wraps one record, which is how `accordion`, `badge`, `form`, `menu`,
    `pricing-card`, `section` and `tab` stay usable with a single entry.
  - `badge` keeps `{ items }` as a declared `legacy` spelling (warning, not an error).
  - Payloads that are a union of shapes or may carry a DOM element (`code-block`, `fab-menu`,
    `markdown`, `masonry`, `modal`, `product`, `rating`) use `{ t: "any" }` with a validated
    `example`.
- CI: `packages/components/contracts.test.ts` validates every declared `example` (0 issues) and
  proves `normalize` is idempotent on it.
- Proof: `npm run verify` green; `ContentContract.test.ts` pins 0 issues for a valid payload and 1
  for a broken one through `inspect().issues`.

## Traps (verified, do not rediscover)

- `core/src/DOMRenderer/index.ts:569-572` already discriminates with `value.builder`; the registry
  is the only component that does not. Aligning them adds no per-component knowledge.
- Root id/className are config-only now (`Section.ts` `@section`); a payload `id`/`className` is
  ignored on purpose.
- `FormAdapters.ts:15,29` JSDoc shows `new FormBuilder({ modules, schema })`; nothing reads it.
- `manifest.ts` comment above `manifestFor` (the "two authoring modes" paragraph) becomes obsolete
  in B.
- `theme-switcher.ts:60` `new ThemeConsoleBuilder({}).create({})` stays valid only if the builder
  tolerates `content === undefined`; check it in A.
- `examples/gallery/src/content/wizard.ts:468` calls `builderFn("form", wizard)` directly from
  `onCreated` — it bypasses any host adapter, which is why B must fix the node, not the adapter.

## Closed

All five batches landed 2026-11-21. `packages/components/DISCUSSION_ANALYSIS.md` (scratch) was
deleted in the same batch; this file is the durable record.

Gate was `npm run verify`; proof was `inspect().issues` — 0 for a valid shape, ≥1 for a
deliberately bad one, plus one validated `example` per builder in `packages/components/contracts.test.ts`.
