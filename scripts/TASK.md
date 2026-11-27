# TASK — surface generator + the last wildcard rows

Moved out of `packages/TASK.md` (b45 surface refactor, landed 2026-11-22) — this is the tooling
half that is still open. The refactor itself and its rules are recorded in
`docs/framework/PUBLIC-API.md`; the current surface is `docs/framework/api-map.json`.

## Next

1. **`scripts/surface.mjs --write/--check`** — one generator for the 38 export maps. Today a surface
   change edits 38 `package.json` files by hand, then `docs/framework/api-map.json`,
   `catalogue.ts` and the registry. Same shape as `api.mjs` / `catalogue.mjs`: dry run by default,
   `--write`, `--check` inside `npm run check`. It must also fail a subpath whose target is excluded
   by `files[]` — a silent 404 today. Optional, not a blocker.
2. **Wave 2 — the last wildcard rows.** `packages/base/BaseAdapters/*` and
   `packages/modules/animations/canvas/*` are still wildcard registry rows and still called
   internal by the policy. Give each a named subpath (or declare it intentionally pattern-shaped),
   so the registry has no unnamed door left.

## Not open (kept so they are not re-litigated)

- `@aio-ui/modules` → **not** absorbed (DECIDED 2026-11-22): `core` keeps the inti, the six modules
  stay standalone, `dom-renderer` stays independently consumable.
- Form adapters stay **optional** subpaths — importing one must not drag the other three.
- CSS into JS / a single-file IIFE — **rejected** (`<link>` parallelism, no FOUC, no
  `style-src 'unsafe-inline'`).

## Gates

`npx vitest run orchestrator` → `npm run check` → `npm run verify` once at the end of a batch.
