# Logbook — the cards

> Orientation only: read the cards, report them, ask which card. Open a card's detail doc
> **only** after the user picks it — never "to orient" (`AGENT_RULES.md` §13). Rewritten each
> session, newest on top. One card = one line + one pointer.
>
> Batch 60–62 (2026-11-24): **release automation** — `session.mjs` prompt is opt-in
> (`--interactive`), no more winpty hang; `release-doc.mjs` regenerates a note's CDN tables
> byte-identically and writes `## Install` blocks into every package README; `check:live` probes
> the published CDN. Aggregate tarballs still parked.
> Batch 59 (2026-11-24): **framework seams** — tab lookups scoped to own menu/body + per-instance
> id stem (nested tab no longer drives its parent), `messageFormAdapter` pinned from the package
> root + gallery module map, and `options`/`multiple` moved onto the field for
> select/dropdown/picker/radio/checkbox (radio group renders `.choice` rows).
> Batch 53 (2026-11-23): **Apps Script entry** — `orchestrator/apps-script/` serves `ask`
> (Gemini/DeepSeek) and `sheet` (template copy); the wizard still calls the mock until the client
> half lands.
> Batch 52 (2026-11-23): **shell = mount point** — `AioApp` paints `menu + page roots + footer` as direct children of the container, marks it `aio-shell`, and mounts each page top-level entry as its own root (no bare `div`).
> Batch 51 (2026-11-23): **Rajutan shell wiring** — one menu bar via `source.menu` + `attachMenu`,
> declarative `registerPage({ route, requires })`, pages rooted at `.page` (no nested `#app`).
> Batch 50 (2026-11-23): **Rajutan app migrated** — `rajutan/` → `examples/rajutan/` (its own repo,
> app commits `451454e` + `b0d892a`), `src/lib` (vendored pre-monorepo framework) deleted, entry
> rewired to `AioApp`, `menu`/`accordion` are real builders, icons folded into `src/style.css`.
> Batch 49 (2026-11-22): **generator b49** — `retry.ts` (issues verbatim, max 2 retries). Batch 48:
> **generator b48** — `answers.ts` (model map, §8 gates, server-owned base).
> Batch 47 (2026-11-22): **generator b47** — `mount()` emits `isRoot: true` (host opt-out), the
> emitted app preloads every required component once before `render()` (fixes the
> `[FormBuilder] No modules configured` race), engine moved to `orchestrator/src/` and checks to
> `orchestrator/__test__/`, wizard answers contract frozen in `docs/generator/TASK-answers-contract.md`.
> Batch 46 (2026-11-22): **docs synced to the 37-package / 76-row surface** (`5e5be6c`) — root
> README, both CDN guides, release note, framework docs, handbook, input/form READMEs, catalogue
> regenerated; `TASK-builder-array.md` + `TASK-releases-branch.md` deleted; `packages/TASKS.md`
> condensed to the decision record.
> Batch 45 (2026-11-22): **CDN surface refactor landed** (stages `49b3b45` + `b55b5aa`) — 131 →
> 76 rows, 39 → 37 packages; `@aio-ui/rating` + `@aio-ui/modules` kit deleted; `v0.2.4` release
> artefact regenerated locally (76 rows) but **not published**. Batch 43: `v0.2.4` published, mode B.

### 1. Release automation — b60–b62 landed (tooling band)

**b60** `session.mjs` prompting is opt-in (`--interactive` / `AIO_SESSION_INTERACTIVE=1`); the nine
steps print before the first ask and stdin is released, so the winpty hang is gone. **b61**
`release-doc.mjs` rewrites only the `artefacts` + `cdn-paths` marker blocks of
`docs/releases/v<x>.md` (76 rows + 4 bundle rows, byte-identical on a 37-package fixture) and
`npm run check:live` probes the published CDN (6/6 200). **b62** `--readme` writes a `## Install`
block (tarball + CDN URL + stylesheet) into 29 package READMEs, catalogue regenerated.
**Owner decision (2026-11-24): the CDN stays versioned** — every generated URL copies
`registry.base` verbatim; the versionless alias is cancelled.
**b64 (2026-11-24):** local `releases/v0.2.4` regenerated to the 37-package tree (37 `.tgz` + 4
loose files, `release.test.ts` 14/14 green, nothing published); per-package release **Option A
accepted for design** with the change table in the task doc; Q5 aggregates parked, Q6 = versioned
filenames only.
Open: aggregate tarballs (`@aio-ui/bundle`, `@aio-ui/iife`) parked behind Q5; implement Option A
(b65 `version.mjs` → b66 `release.mjs` → b67 followers); publish is still LAST (card 3).
→ `docs/framework/TASK-release-automation.md` §Next · `.guidance/project/framework.md` §Next

### 2. Rajutan app — published site

Batch 57 landed **hosting**: `action:"deploy"` (`orchestrator/apps-script/Deploy.js`) commits the
emitted files to GitHub and enables Pages, so a job returns a **hosted** `data.live` and a
`data.repo`. Proof: real job (deepseek, 1 model call) → sheet `kriya-b57` +
`https://sieteminerva.github.io/test_site_rajutan/` serving `Kriya B57`. Also proved: the Test
deployment was pinned (`@2`) and every earlier `push` was inert until `clasp update-deployment`
moved it to `@4`. Next: per-site repos (token with Administration) + `data[].endpoint`; then auth.
Open: `/exec` is unauthenticated (`CLIENT_TOKEN` unset, `public/sw.js` never registered).
Mechanism + proposal: `orchestrator/mechanism.md` §1–§11 + `# Proposal` (phases P0–P5).
→ `.guidance/project/generator.md` §Next

### 3. Release — publish is LAST (deferred by the owner)

`releases/v0.2.4` was regenerated locally after the surface refactor (37 packages / 76 rows) and is
**not committed or published**; the checked-in `releases/v0.2.4/registry.json` still describes the
39-package tree. **Owner decision (2026-11-22): publish sits at the END of the task order — only
after the orchestrator band is finished, or when the owner asks. Do not raise it, do not propose
it, do not ask about publishing before one of those two conditions is true.** The official release
also waits for the `store`, `profile`, `blog` reference apps.
Open: generator's tarball-consumption probe (`npm i <tarball>` + Node ESM import) rides on b62.
→ `docs/releases/v0.2.4.md` · `docs/live-cdn-repo.md` §9 · `.guidance/project/generator.md`

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

- **Publish is the last item, on the owner's order** (card 3): only after the orchestrator band is
  finished, or when the owner asks. Never raise it unprompted.
- Official release waits for the `store`, `profile`, `blog` references (`gallery` exists).
- Tree, packages and last tag are at **`0.2.4`** (pre-release, tag `v0.2.4` = branch `5eeee94`).
- `main` is **29 commits ahead of `origin/main`** — the release branch and tag are pushed, the
  source branch is not. One command when the owner wants it: `git push origin main`.
- Scratch is `temp/` (deletable whole); `releases/` is the branch worktree, not scratch.
