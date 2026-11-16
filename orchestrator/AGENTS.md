> **STEP 0 — logbook, then claim (mandatory, first action of any session):** `git log --oneline -8`,
> then `git status --short`, then read **only** `.guidance/project/STATUS.md` — the logbook: three
> cards, each a one-line summary plus the link to the real detail. Report the three, say the detail
> is **not** read yet, and ask which card to continue. Open `TASKS.md`, `TASK-*.md` or a band file
> only **after** the user picks. Then read the claim board `.guidance/project/AGENTS.md` and take
> your row **before the first edit** — overlapping a live row is a stop-and-ask, not an override.
> Every finished action category leaves **3 pointer lines** (`CHANGED →`, `PROVED →`, `NEXT →`);
> see `.guidance/AGENT_RULES.md` §10 (checkpoint), §11 (claims), §13 (logbook), §14 (pre-compact
> handoff at ~80k) and §15 (commit message shape).

# AGENTS.md — Generator band (`orchestrator/**`)

Rajutan: turns a business profile into a `preset.json`, then a **build-free** website whose
framework code is served from a pinned CDN tag.

## Engine (`orchestrator/`)

`types` → `catalogue` → `plan` → `parse` → `ai` → `emit` → `runtime` → `generate`, plus
`scenarios` and tests. `orchestrator/` is tracked (the rest of `.draft/` is gitignored).

## Pipeline

```
wizard → orchestrator (Apps Script, engine bundled) → preset.json
      → plan() → emit()/runtime()/generate() → 5 static files
      → GitHub repo → Pages/Cloudflare; data stays in the client's Sheets `/exec`
```

Generated output = `preset.json`, `index.html`, `app.js`, `server/adapter.json`, `FLOW.md`.
The framework is licensed via the CDN tag, never copied into the client repo.

## Hard rules (do not regress)

1. **Import map needs the `"imports"` wrapper.** `runtime.ts` serialises `site.importMap`
   (object), not `.imports` (map) — without the wrapper browsers ignore it.
2. **Map every package root + every exact `exports` subpath.** `emit.ts` `exact()` covers this.
3. **CSS subpaths prefer `dist/`.**
4. **A builder node key must be a real tag** (`div#masonry`); `parsePreset()` rejects
   `<masonry>`-style keys.
5. **Form sub-module refs need `export: "<symbol>"`** — otherwise `Form` renders nothing when
   `multistep: true`.
6. **Generated runtime mounts builders itself** (`mount()` over `preset.pages`); `DOMRenderer`
   never builds builder nodes.
7. **`app.js` is served to a browser as-is** — no `import type`, no type annotations: either one is
   a SyntaxError and the whole site never boots, while every unit test stays green.
   `runtime.test.ts` guards `/^import type /m` and `/pageDefinitions:\s/`.
8. **A page's preload list is computed, not written by hand** — `pageRequires()` = the `builder`
   words in that page's content, minus `input` / `dropdown` / `input-controls`, emitted as
   `pageDefinitions = [{ route, requires }]` → `registerPage`. `release.test.ts` proves every word
   has a registration **and** an import-map key.
9. **`parsePreset()` reports `INVALID_SHAPE`** for a non-string `builder` — the array shape fails
   validation instead of being dropped silently.

## Commands

```bash
npx vitest run orchestrator                 # engine suite
node orchestrator/layout.mjs --out orchestrator/layout.json
node scripts/release.mjs --version 0.1.0 --apply
node scripts/publish-cdn.mjs --apply         # cdn branch + move tag (push)
SMOKE_BASE=https://cdn.jsdelivr.net/gh/sieteminerva/AIO-UI@v0.1.0/ \
  npx vitest run orchestrator/release.test.ts
node .draft/smoke/serve.mjs 5300             # open /.draft/cdn-smoke/store/#checkout
```

## Release state

Not tracked here. Facts and dates: `.guidance/project/generator.md` (`## Landed`); the release
walkthrough is `docs/live-cdn-repo.md`. One rule stays: never push `main` to the `rajutan` remote.

## Read when relevant

`docs/generator/apps-script-integration.md` (backend/Sheets/Gemini flow), `orchestrator/README.md`,
`orchestrator/prompt.content.md`. Do **not** read `packages/components/**` docs unless the task
changes the framework contract.
