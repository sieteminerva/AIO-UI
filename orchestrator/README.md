# Preset & Generator Engine (`orchestrator/`)

Server-side site generator for **Rajutan**. Intentionally kept outside `packages/` so the engine stays framework-agnostic and portable to **Google Apps Script (GAS)**.

## Files

| File                | Purpose                                                                                                   |
| :------------------ | :-------------------------------------------------------------------------------------------------------- |
| `types.ts`          | `iWebPreset` v1, `PresetPlan`, `PresetIssue`, `PresetAsset`, and data bindings                            |
| `catalogue.ts`      | Builder vocabulary → package/module/style resolution; theme & capability maps                             |
| `plan.ts`           | `plan(preset)` / `assetsOf(preset)` — derives modules, bindings, refs, and assets                         |
| `parse.ts`          | `parsePreset()`, `assertPreset()`, `validatePages()` — schema & closed-vocabulary checks                  |
| `ai.ts`             | AI contract `iAiSiteContent` v1, `parseAiContent()`, `assemblePreset()`, `aiResponseSchema()`             |
| `emit.ts`           | `emitPlan()` → `{ links, importMap, table, bindings, moduleRefs }`; `createCdnResolver()`                 |
| `runtime.ts`        | `emitRuntime()` → build-free `index.html` + `app.js` (import map + registrations + `mount()`)             |
| `generate.ts`       | `generateSite()` → complete 5-file static site output                                                     |
| `scenarios.ts`      | Reference flows (`gallery-static`, `store-dynamic`)                                                       |
| `layout.mjs`        | Workspace scanner → `layout.json` (`dir`, `entry`, `stylesRoot`, `bare`, `subpaths`)                      |
| `layout.json`       | Generated map of all **40** `@aio-ui/*` packages                                                          |
| `prompt.content.md` | Gemini prompt locked to `Object.keys(BUILDER_CATALOGUE)`                                                  |
| `fixtures.ts`       | Deterministic presets for plan/emit tests                                                                 |
| `release.test.ts`   | Validates release artefacts, checksums, closed import map, and `.draft/smoke/`                            |
| `*.test.ts`         | Unit & integration suite across `plan`, `parse`, `ai`, `emit`, `runtime`, `generate`, `prompt`, `release` |

## Architecture Invariants

1. **AI writes intent, `plan()` resolves packages:** Gemini outputs `pages`, `theme`, and `data` intents (`iAiSiteContent`). Unknown builder words surface as `PresetIssue` items, never broken imports.
2. **Additive & deterministic:** Signals only accumulate across pages; assets and stylesheets are deduplicated and sorted so identical presets yield byte-identical diffs.
3. **Dual version pinning:** `presetSchema` versions the preset format; `engine.resolved` pins the exact immutable CDN tag (`@v0.2.1+`) in the generated import map.
4. **Zero-node core for Apps Script:** Core engine files (`types`, `catalogue`, `plan`, `parse`, `ai`, `emit`, `runtime`, `generate`) are pure functions with zero Node.js or DOM dependencies, ready to be bundled into Google Apps Script.

## Physical Output (`.draft/results/`)

Running `generate.test.ts` emits test sites under `.draft/results/<scenario>_v1/`:

- **Production static files:** `preset.json`, `index.html`, `app.js`, `server/adapter.json`, `FLOW.md`
- **Local Vite copy (`dev/`):** Resolves `@aio-ui/*` directly from workspace packages for instant local preview (`cd .draft/results/gallery-static_v1/dev && npx vite --port 5199`).

## Next Milestones

- **Apps Script Engine Bundle:** Bundle the pure core modules into a single GAS-ready artefact for serverless site generation from `TableBuilderService`.
- **AI Retry Loop:** Feed `parsePreset()` / `parseAiContent()` validation issues back into Gemini automatically.
- **Automated `layout.json` Gate:** Ensure `layout.json` freshness is verified inside the release pipeline.
