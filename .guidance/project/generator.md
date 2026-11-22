# Generator — status (`orchestrator/**`)

Status: batch 53 complete (Apps Script orchestrator entry: `ask` over Gemini/DeepSeek, `sheet`
template copy). Gate: `node --check` on 3 files ok, `temp/probe-ai.mjs` dispatch proven.
Band rules: `orchestrator/AGENTS.md`. Why: `.guidance/plan-generator.md`.
Index: `STATUS.md`.

## Active (max 3)

| #   | Task                                                             | State      | Gate                                                    |
| --- | ---------------------------------------------------------------- | ---------- | ------------------------------------------------------- |
| 1   | App → orchestrator wiring (`answersToBase` → `retry` → envelope) | landed b55 | client `ask` hits `/exec`, result renders `data.preset` |
| 2   | Stage C — sheet copy + generated app (`live` url)                | landed b56 | one job returns a sheet url **and** a live url          |
| 3   | Stage C — repo create + deploy (`data.repo`, real hosting)       | next       | `live` is a hosted url, not a `blob:`                   |

> `data[].endpoint` rides with row 3: it needs the per-site deployment that hosting creates.
> The original gate named `gallery` **and `store`**; `store` is still one of the three missing
> reference apps, so browser gates run on `gallery` until that app exists. `store` was probed in
> b47 for the form preload race and renders 1 form / 2 fieldset / 7 input with a clean console.

## Next

- **Stage C, row 3** (next): repo create + deploy, so `live` becomes a hosted URL. Needs an owner
  decision (account/org + where the token lives); `data[].endpoint` follows the per-site deployment.
  Sheet copy and the generated-app preview are done (b56) — the preview is a `blob:` for the session.
- **Tarball install probe**: verify `npm i <tarball>` from a clean folder (a bundler project) plus a
  Node ESM import, so the published tree is proven consumable.
- Regenerate `layout.json` inside the release workflow so the map cannot describe a moved package.
  Note: the repo's `layout.json` (37 packages) and the published `v0.2.4` tag's (39) are **different
  trees** — the app therefore reads `layout.json` from the CDN tag it points at (b56).
- **Not this band:** publishing the `releases` branch is the last item in the whole queue
  (STATUS card #3). Do not raise it until the orchestrator work is done or the owner asks.

## Landed

- **batch 56 (2026-11-23)** — Rajutan **generated app**: `src/lib/app.ts` (`plan → emitPlan →
emitRuntime`, layout read from the CDN tag, `app.js` inlined into a `blob:` document) and
  `runJob` now fills `data.live`; `ask.ts` gained `copySheet()` (`action:"sheet"`) and `runJob` fills
  `data.sheet`, reporting `status:"partial"` when a side effect fails. Proof: one real job returned
  sheet `uji-b56-live` **and** a live `blob:` url; the generated site booted from the CDN import map
  (home heading + hero + 3 sections) and routed `#portofolio` on click. Found and fixed: emitted
  content links by path (`/portofolio`) left the document (`#blocked`), so `runtime.ts` now maps
  those clicks to hashes. `AI.js` DeepSeek gained `max_tokens: 8192` and both providers
  `temperature: 0.2` (clasp pushed). **Correction:** the failures are **malformed JSON**
  (a stray `}` / trailing text right before `"notes"`), **not** truncation — the 8192 guess
  stands only as a guard, and 9 of 9 profile runs still failed after the push, so `/exec`
  may serve a pinned version rather than head. Engine 139 pass / 1 skip; app `tsc` +
  `vite build` clean; `npm run check` clean.
- **batch 55 (2026-11-23)** — Rajutan **client half** (`examples/rajutan`): `src/lib/{ask,prompt,job}.ts`
  run `answersToBase → retryAsync → assemblePreset` and build the `{status, meta, data}` envelope;
  the wizard submits the job (no more `mockBuildResult()`), `#/result` renders `data.preset` +
  `data.issues`. `retryAsync` added to the engine (same budget, verbatim issues; 139 tests). The app
  reaches the engine through an `@engine` alias, not a copy. Wizard `config.address` now points at
  the region endpoint with `useAdapter: "aio"`, so `[data-level]` loads and cascades. Proof: real
  `/exec` runs produced `tenun-lestari` (store, 5 routes) and `ruang-karya-sri` (profile, 4 routes);
  `#preset` 5 rows; provinces 34 → cities 7 after a pick; app `tsc` + `vite build` clean.

- **batch 53 (2026-11-23)** — Apps Script orchestrator entry (`orchestrator/apps-script/`):
  `doPost` routes `ask` (one model call; `AI_PROVIDER` = gemini|deepseek, keys in Script
  Properties) and `sheet` (`TEMPLATE_SHEET_ID` copy via Drive). `appsscript.json` trimmed to
  external_request + drive + userinfo.email; unused CRM library removed. Two API keys had been
  pasted into `AI.js` → restored to property lookups (keys must be rotated). Proof: `node --check`
  ×3 ok; `temp/probe-ai.mjs` reaches the missing-Property guard for both providers.

- **batch 51 (2026-11-23)** — Rajutan shell wiring (`examples/rajutan`, app commit `b51`):
  `src/content/nav.ts` keeps one `BAR` + `menuFor(route)` (home-only `#how/#features/#faq`,
  live entry `is-active`); `main.ts` folds `pages` + `componentRoutes` + the controller loop into
  one `iRoute[]` and registers `registerPage({ route, requires })`; `RajutanPage.attachMenu()`
  returns `menuFor(route)`; all seven page trees root at `.page`. Proof: app `tsc` clean,
  `vite build` ok, browser probe `.aio-shell` 1 / `nav.nav[data-position=top]` 1 / `#app` 1 /
  active entry = route; `#how` click scrolls 0 → 1270 with the hash still `#home`.

- **batch 50 (2026-11-23)** — Rajutan app migrated (`examples/rajutan`, own repo): `src/lib`
  deleted, `AioApp` wiring + registry manifests, `menu`/`accordion` builders, icons in
  `src/style.css`. Proof: app `tsc` clean, `vite build` ok, nav `.nav`/`data-position=top`,
  `.accordion` 5 details, all routes render.

- **b49 (2026-11-22)** — `orchestrator/src/retry.ts`: `retry(ask, max = 2)` calls the model through
  an injected `ask(issues)`, rejects with `parseAiContent()`, and re-asks with the issue list
  verbatim; `issueLines()` renders `CODE: detail (at where)`. Pure — the caller owns `fetch`/
  `UrlFetchApp`. 7 new tests → suite 135 pass / 1 skip, `tsc` clean.

- **b48 (2026-11-22)** — `orchestrator/src/answers.ts`: `modelFromWebType()` (§3 map, no guess),
  `validateAnswers()` (§8 gates 1–4 in order, dashed-case keys kept), `answersToBase()` (§5 base:
  slugged `id`, engine pin, theme/locale, `web-reason` tagline fallback, `data[]` only with an
  endpoint + sheets). `PresetAssembly.site.tagline` added so the fallback can travel; the AI
  tagline still wins. 17 new tests → suite 128 pass / 1 skip, `tsc` clean.

- **b47 (2026-11-22)** — `mount()` emits `isRoot: true` (opt out with `isRoot: false`); emitted app
  preloads the union of `pageDefinitions.requires` once before `render()` and names
  `export: "FormBuilder"`, closing the `[FormBuilder] No modules configured` race. Engine moved to
  `orchestrator/src/`, checks to `orchestrator/__test__/`, `layout.mjs`/`layout.json` at the root.
  Answers contract frozen in `docs/generator/TASK-answers-contract.md`. Gallery proof: `#masonry`
  is a `SECTION` with 3 children, 0 empty wrapper divs.
- **v0.2.4 surface (2026-11-22)** — `orchestrator/layout.json` regenerated to **37 packages**;
  the emitted import map uses one door per package (`@aio-ui/input/dropdown`, not
  `@aio-ui/input/modules`). `release.test.ts` reads the regenerated `releases/v0.2.4/` and passes
  (76 rows). Engine suite: 8 files / 108 passed / 1 skipped (live CDN smoke).
- **`v0.2.4` published (2026-11-21)** — mode B, 39 packages at the time, bundled pair at the
  branch root; the post-refactor tree is regenerated but **not published**.
- **v0.2.1 patch (2026-11-16)** — tag `v0.2.1` on the orphan `cdn` branch, 43 release assets, CDN
  base `https://cdn.jsdelivr.net/gh/sieteminerva/AIO-UI@v0.2.1/`. Release order and the `gh`-absent
  workaround: `docs/live-cdn-repo.md`.
