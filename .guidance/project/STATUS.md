# Logbook — the cards

> Orientation only: read the cards, report them, ask which card. Open a card's detail doc
> **only** after the user picks it — never "to orient" (`AGENT_RULES.md` §13). Rewritten each
> session, newest on top. One card = one line + one pointer.
>
> Batch 45 (2026-11-22): **CDN surface refactor landed** (stages `49b3b45` + `b55b5aa`) — 131 →
> 76 rows, 39 → 37 packages; `@aio-ui/rating` + `@aio-ui/modules` kit deleted; `v0.2.4` release
> artefact regenerated locally (76 rows) but **not published**; docs CDN list rewritten.
> Batch 44 (2026-11-21): `v0.2.4` note carries the full live CDN table and the step is mandatory;
> `session.mjs end` hang diagnosed. Batch 43: `v0.2.4` published, mode B.

### 1. Fix `session.mjs end` + design release automation — next

`session.mjs end` blocks forever because the `node` alias (winpty) makes `isTTY` true, so six
prompts wait for a human that is not there; proven — non-TTY runs exit in 1 s, winpty blocks until
Enter is pressed six times. **Open:** make prompts opt-in plus a 2 s escape, print steps 1–9 before
asking, then co-design `scripts/release-doc.mjs` so every release note generates its CDN table and
probes it; §2.1 is now **decided** — two aggregate tarballs `@aio-ui/bundle` (umbrella, 39 deps) and
`@aio-ui/iife` (the four files), because `"name": "@aio-ui"` is rejected by npm as measured.
→ `docs/framework/TASK-release-automation.md`

### 2. Release — surface refactor landed, publish pending

`v0.2.4` is live (39 packages, mode B, jsDelivr 200). **Since then** the CDN surface was refactored to
**76 rows / 37 packages** (`49b3b45` + `b55b5aa`): input modules merged into their builders, `rating`
and the `modules` kit removed, `core` **does not** absorb the module packages (decided — modules stay
modular; `dom-renderer` stays standalone). `releases/v0.2.4` (branch worktree) was regenerated locally,
**not committed/published**. **Open:** publish the `releases` branch when ready; the official release
still waits for the `store`, `profile`, `blog` reference apps.
→ `docs/releases/v0.2.4.md` · `docs/live-cdn-repo.md` §9 · `packages/TASKS.md`

### 3. Optional hardening — one surface generator

A CDN-surface change still edits 37 `package.json` export maps, then `api-map.json`, `catalogue.ts`
and the registry. The planned `scripts/surface.mjs --write/--check` (same shape as `api.mjs`) is
unwritten; it would also fail a subpath pointing at a file `files[]` excludes — a silent 404 today.
Optional, not a blocker.
→ `packages/TASKS.md` open item 4

## Map

| Need                      | File                                            |
| ------------------------- | ----------------------------------------------- |
| Framework queue + landed  | `.guidance/project/framework.md`                |
| Gallery / generator queue | `.guidance/project/gallery.md` · `generator.md` |
| Process rules             | `.guidance/AGENT_RULES.md`                      |
| Component + env rules     | `docs/framework/COMPONENT-CONVENTIONS.md`       |
| Release + publish ritual  | `docs/live-cdn-repo.md`                         |
| Live writers (lock)       | `.guidance/project/AGENTS.md`                   |

## Cross-project

- Official release waits for the `store`, `profile`, `blog` references (`gallery` exists).
- Tree, packages and last tag are at **`0.2.4`** (pre-release, tag `v0.2.4` = branch `5eeee94`).
- `main` is **28 commits ahead of `origin/main`** — the release branch and tag are pushed, the
  source branch is not. One command when the owner wants it: `git push origin main`.
- Scratch is `temp/` (deletable whole); `releases/` is the branch worktree, not scratch.
