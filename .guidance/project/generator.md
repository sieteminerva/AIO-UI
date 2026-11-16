# Generator — status (`orchestrator/**`)

Band rules: `orchestrator/AGENTS.md`. Why: `.guidance/plan-generator.md`.
Index: `STATUS.md`.

## Active (max 3)

| #   | Task                           | State | Gate                                                                                                  |
| --- | ------------------------------ | ----- | ----------------------------------------------------------------------------------------------------- |
| 1   | `mount()` emits `isRoot: true` | next  | `gallery` + `store` probed in a browser: one wrapper per block, metadata tree walks, `onDestroy` runs |

## Next

- GitHub release workflow: tag → `verify` → `release.mjs` → `publish-cdn.mjs` → upload assets.
- Verify `npm i <tarball>` from a clean folder (bundler project) and a Node ESM import.
- Feed `parsePreset()` / `parseAiContent()` issues back to the model verbatim (retry loop).
- Regenerate `layout.json` inside the release workflow so the map cannot describe a moved package.

## Landed

- **v0.2.1 patch (2026-11-16)** — tag `v0.2.1` on the orphan `cdn` branch of
  `sieteminerva/AIO-UI`, 43 release assets, CDN base
  `https://cdn.jsdelivr.net/gh/sieteminerva/AIO-UI@v0.2.1/`. Release order and the `gh`-absent
  workaround: `docs/live-cdn-repo.md`.
