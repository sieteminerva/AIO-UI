# Generator — status (`orchestrator/**`)

Band rules: `orchestrator/AGENTS.md`. Why: `.guidance/plan-generator.md`.
Index: `STATUS.md`.

## Active (max 3)

| #   | Task                           | State | Gate                                                                                        |
| --- | ------------------------------ | ----- | ------------------------------------------------------------------------------------------- |
| 1   | `mount()` emits `isRoot: true` | next  | `gallery` probed in a browser: one wrapper per block, metadata tree walks, `onDestroy` runs |

> The original gate named `gallery` **and `store`**; `store` is still one of the three missing
> reference apps, so the gate runs on `gallery` until that app exists.

## Next

- GitHub release workflow: tag → `verify` → `release.mjs` → `publish-cdn.mjs` → upload assets.
- Verify `npm i <tarball>` from a clean folder (bundler project) and a Node ESM import.
- Feed `parsePreset()` / `parseAiContent()` issues back to the model verbatim (retry loop).
- Regenerate `layout.json` inside the release workflow so the map cannot describe a moved package.

## Landed

- **v0.2.4 surface (2026-11-22)** — `orchestrator/layout.json` regenerated to **37 packages**;
  the emitted import map uses one door per package (`@aio-ui/input/dropdown`, not
  `@aio-ui/input/modules`). `release.test.ts` reads the regenerated `releases/v0.2.4/` and passes
  (76 rows). Engine suite: 8 files / 108 passed / 1 skipped (live CDN smoke).
- **`v0.2.4` published (2026-11-21)** — mode B, 39 packages at the time, bundled pair at the
  branch root; the post-refactor tree is regenerated but **not published**.
- **v0.2.1 patch (2026-11-16)** — tag `v0.2.1` on the orphan `cdn` branch, 43 release assets, CDN
  base `https://cdn.jsdelivr.net/gh/sieteminerva/AIO-UI@v0.2.1/`. Release order and the `gh`-absent
  workaround: `docs/live-cdn-repo.md`.
