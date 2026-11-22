# Generator — status (`orchestrator/**`)

Status: batch b47 complete (isRoot + form preload + folder split + answers contract). Gate green:
`npx vitest run orchestrator` → 111 pass / 1 skip, `npx tsc -p orchestrator/tsconfig.json` clean.

Band rules: `orchestrator/AGENTS.md`. Why: `.guidance/plan-generator.md`.
Index: `STATUS.md`.

## Active (max 3)

| #   | Task                                | State | Gate                                                             |
| --- | ----------------------------------- | ----- | ---------------------------------------------------------------- |
| 1   | `answers` module (`src/answers.ts`) | next  | one test per wizard set + unknown `web-type` + confirmation gate |

> The original gate named `gallery` **and `store`**; `store` is still one of the three missing
> reference apps, so browser gates run on `gallery` until that app exists. `store` was probed in
> b47 for the form preload race and renders 1 form / 2 fieldset / 7 input with a clean console.

## Next

- **`orchestrator/src/answers.ts`** (next): `modelFromWebType()`, `validateAnswers()`,
  `answersToBase()` implementing `docs/generator/TASK-answers-contract.md` §3–§5. Keys stay
  dashed-case verbatim; unknown `web-type` is an issue, never a guess. Tests in
  `orchestrator/__test__/answers.test.ts`.
- Then split the folder tree of `orchestrator/src/` if it grows past the eight engine modules;
  the bundle boundary is `src/`, not a sub-folder name.
- Verify `npm i <tarball>` from a clean folder (bundler project) and a Node ESM import.
- Feed `parsePreset()` / `parseAiContent()` issues back to the model verbatim (retry loop).
- Regenerate `layout.json` inside the release workflow so the map cannot describe a moved package.
- **Not this band:** publishing the `releases` branch is the last item in the whole queue
  (STATUS card #3). Do not raise it until the orchestrator work is done or the owner asks.

## Landed

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
