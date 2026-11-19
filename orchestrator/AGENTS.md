> **Session Start (Fast Path):**
>
> - If the user gave a specific task: check `git status --short`, claim your row in `.guidance/project/AGENTS.md` (stop if overlapping), and start immediately.
> - If no specific task was given: run `git log --oneline -5`, read **only** `.guidance/project/STATUS.md` (3 cards), report them without opening detail files, and ask which card to continue.
> - End every finished action category with **3 pointer lines**: `CHANGED →`, `PROVED →`, `NEXT →`. See `.guidance/AGENT_RULES.md` (§10–§16) only when committing, handing off at ~80k tokens, or running proof-of-render.

# AGENTS.md — Generator Band (`orchestrator/**`)

Rajutan: turns a business profile into `preset.json`, then a **build-free** website whose framework code loads from a pinned CDN tag (plus an optional local Vite `dev/` copy).

## Pipeline

```text
wizard → orchestrator (Apps Script, engine bundled) → preset.json
      → plan() → emit() / runtime() / generate() → 5 static files
      → GitHub repo → Pages/Cloudflare; data stays in client's Sheets `/exec`
```

- **Engine modules:** `types` → `catalogue` → `plan` → `parse` → `ai` → `emit` → `runtime` → `generate` (plus `scenarios` and `*.test.ts`).
- **Generated output:** `preset.json`, `index.html`, `app.js`, `server/adapter.json`, `FLOW.md`. Framework assets load via CDN tag, never copied into client repos.

## Hard Rules (Do Not Regress)

1. **Apps Script portability:** `plan`, `parse`, `ai`, `emit`, `runtime`, and `generate` must never import `node:*`, call `fetch`, or touch the filesystem (data in → file map out). Only `*.test.ts` and `layout.mjs` may use Node APIs.
2. **Import map wrapper:** `runtime.ts` must serialise `{ "imports": site.importMap }`, never a bare map object.
3. **Exact subpaths + prefixes:** Map every package root, every exact `exports` subpath (`emit.ts` `exact()`), and directory prefixes (`@aio-ui/utilities/`). CSS subpaths prefer `dist/`.
4. **Real HTML tag keys:** A builder node key must be a real tag (`div#masonry`); `parsePreset()` rejects custom-element builder keys (`<masonry>`).
5. **Explicit symbol exports:** Form sub-module refs require `export: "<symbol>"` so `multistep` and adapters resolve cleanly.
6. **Runtime mounts builders:** `mount()` walks `preset.pages`; `DOMRenderer` never builds builder nodes automatically.
7. **Browser-ready `app.js`:** Zero `import type` or TypeScript annotations in emitted `app.js` (guarded by `runtime.test.ts`).
8. **Computed preload list:** `pageRequires()` derives `pageDefinitions = [{ route, requires }]` from `preset.pages` (excluding `input`, `dropdown`, `input-controls`).
9. **Strict shape validation:** `parsePreset()` emits `INVALID_SHAPE` for non-string `builder` values.
10. **Tag immutability:** Never force-move a version tag jsDelivr has already served; bump the version for any fix. Never push `main` to the legacy `rajutan` remote.

## Commands

```bash
npx vitest run orchestrator                         # run generator test suite
npx tsc -p orchestrator/tsconfig.json               # isolated typecheck
node orchestrator/layout.mjs --out orchestrator/layout.json
node scripts/release.mjs --version <ver> --apply    # build release tarballs + metadata
node scripts/publish-cdn.mjs --apply                # publish unpacked tree to `cdn` + tag
SMOKE_BASE=https://jsdelivr.net \
  npx vitest run orchestrator/release.test.ts       # live CDN smoke test
node .draft/smoke/serve.mjs 5300                    # preview /.draft/cdn-smoke/store/#checkout
```

## Context Routing (Read Only When Needed)

- **Apps Script / Sheets / Gemini flow:** `docs/generator/apps-script-integration.md`
- **Release & CDN walkthrough:** `docs/live-cdn-repo.md` and `.guidance/project/generator.md`
- **Component contracts:** Do **not** read `packages/components/**` unless the task modifies framework contracts.
