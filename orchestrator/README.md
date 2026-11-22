# Preset & Generator Engine (`orchestrator/`)

Server-side site generator for **Rajutan**. Intentionally kept outside `packages/` so the engine stays framework-agnostic and portable to **Google Apps Script (GAS)**.

## Layout

```text
orchestrator/
  src/                     engine — pure, zero Node/DOM (bundles to Apps Script as-is)
    types.ts               the data contract
    catalogue.ts           vocabulary → package
    plan.ts                preset → plan
    parse.ts               preset → validated preset
    answers.ts             wizard answers → validated answers + preset base
    ai.ts                  AI contract + assemblePreset
    emit.ts                plan → assets/import map
    runtime.ts             plan → index.html + app.js
    generate.ts            the five files
    prompt.content.md      Gemini prompt (locked to the catalogue by prompt.test.ts)
  __test__/                everything that may use Node APIs
    fixtures.ts            deterministic presets
    scenarios.ts           reference flows (gallery-static, store-dynamic)
    *.test.ts              plan, parse, ai, emit, runtime, generate, prompt, release
  layout.mjs               workspace scanner → layout.json
  layout.json              generated map of all 37 @aio-ui/* packages
```

`src/` is the bundle boundary: a file there must never import `node:*`, call `fetch`, or
touch the filesystem. Test data and Node-only checks live in `__test__/`.

## Files

| File                       | Purpose                                                                                                   |
| :------------------------- | :-------------------------------------------------------------------------------------------------------- |
| `src/types.ts`             | `iWebPreset` v1, `PresetPlan`, `PresetIssue`, `PresetAsset`, and data bindings                            |
| `src/catalogue.ts`         | Builder vocabulary → package/module/style resolution; theme & capability maps                             |
| `src/plan.ts`              | `plan(preset)` / `assetsOf(preset)` — derives modules, bindings, refs, and assets                         |
| `src/parse.ts`             | `parsePreset()`, `assertPreset()`, `validatePages()` — schema & closed-vocabulary checks                  |
| `src/answers.ts`           | `modelFromWebType()`, `validateAnswers()`, `answersToBase()` — wizard answers → server-owned base          |
| `src/ai.ts`                | AI contract `iAiSiteContent` v1, `parseAiContent()`, `assemblePreset()`, `aiResponseSchema()`             |
| `src/emit.ts`              | `emitPlan()` → `{ links, importMap, table, bindings, moduleRefs }`; `createCdnResolver()`                 |
| `src/runtime.ts`           | `emitRuntime()` → build-free `index.html` + `app.js` (import map + registrations + `mount()`)             |
| `src/generate.ts`          | `generateSite()` → complete 5-file static site output                                                     |
| `__test__/scenarios.ts`    | Reference flows (`gallery-static`, `store-dynamic`)                                                       |
| `layout.mjs`               | Workspace scanner → `layout.json` (`dir`, `entry`, `stylesRoot`, `bare`, `subpaths`)                      |
| `layout.json`              | Generated map of all **37** `@aio-ui/*` packages                                                          |
| `src/prompt.content.md`    | Gemini prompt locked to `Object.keys(BUILDER_CATALOGUE)`                                                  |
| `__test__/fixtures.ts`     | Deterministic presets for plan/emit tests                                                                 |
| `__test__/release.test.ts` | Validates release artefacts, checksums, closed import map, and `temp/smoke/`                              |
| `__test__/*.test.ts`       | Unit & integration suite across `plan`, `parse`, `ai`, `emit`, `runtime`, `generate`, `prompt`, `release` |

## Architecture Invariants

1. **AI writes intent, `plan()` resolves packages:** Gemini outputs `pages`, `theme`, and `data` intents (`iAiSiteContent`). Unknown builder words surface as `PresetIssue` items, never broken imports.
2. **Additive & deterministic:** Signals only accumulate across pages; assets and stylesheets are deduplicated and sorted so identical presets yield byte-identical diffs.
3. **Dual version pinning:** `presetSchema` versions the preset format; `engine.resolved` pins the exact immutable CDN tag (`@v0.2.4+`) in the generated import map.
4. **Zero-node core for Apps Script:** Core engine files (`types`, `catalogue`, `plan`, `parse`, `answers`, `ai`, `emit`, `runtime`, `generate`) are pure functions with zero Node.js or DOM dependencies, ready to be bundled into Google Apps Script.

## Physical Output (`temp/results/`)

Running `__test__/generate.test.ts` emits test sites under `temp/results/<scenario>_v1/`:

- **Production static files:** `preset.json`, `index.html`, `app.js`, `server/adapter.json`, `FLOW.md`
- **Local Vite copy (`dev/`):** Resolves `@aio-ui/*` directly from workspace packages for instant local preview (`cd temp/results/gallery-static_v1/dev && npx vite --port 5199`).

## Next Milestones

- **Apps Script Engine Bundle:** Bundle the pure core modules into a single GAS-ready artefact for serverless site generation from `TableBuilderService`.
- **AI Retry Loop:** Feed `parsePreset()` / `parseAiContent()` validation issues back into Gemini automatically.
- **Automated `layout.json` Gate:** Ensure `layout.json` freshness is verified inside the release pipeline.
