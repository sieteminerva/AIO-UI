# Logbook — the cards

> Orientation only: read the cards, report them, ask which card. Open a card's detail doc
> **only** after the user picks it — never "to orient" (`AGENT_RULES.md` §13). Rewritten each
> session, newest on top. One card = one line + one pointer.
>
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

### 1. Rajutan app — published site — next

Batch 57 landed **hosting**: `action:"deploy"` (`orchestrator/apps-script/Deploy.js`) commits the
emitted files to GitHub and enables Pages, so a job returns a **hosted** `data.live` and a
`data.repo`. Proof: real job (deepseek, 1 model call) → sheet `kriya-b57` +
`https://sieteminerva.github.io/test_site_rajutan/` serving `Kriya B57`; `#/result` shows Live,
Sheets and GitHub rows. Also proved: the Test deployment was pinned (`@2`) and every earlier `push`
was inert until `clasp update-deployment` moved it to `@4`.
Next: per-site repos (token with Administration) + `data[].endpoint`; then auth.
Open: `/exec` is unauthenticated (`CLIENT_TOKEN` unset, `public/sw.js` never registered).
→ `.guidance/project/generator.md` §Next · memory `/memories/session/rajutan-app.md`

### 2. Generator — tarball install probe

b48/b49 landed `answers.ts` and `retry.ts`. Next: prove the published tree is consumable —
`npm i <tarball>` in a clean bundler folder plus a Node ESM import — then `layout.json` inside
the release workflow.
→ `.guidance/project/generator.md`

### 3. Release — publish is LAST (deferred by the owner)

`releases/v0.2.4` was regenerated locally after the surface refactor (37 packages / 76 rows) and is
**not committed or published**; `@v0.2.4` still serves the 39-package tree.
**Owner decision (2026-11-22): publish sits at the END of the task order — it is worked on only
after the orchestrator band is finished, or when the owner asks for it. Do not raise it, do not
propose it, do not ask about publishing before one of those two conditions is true.**
The official release also waits for the `store`, `profile`, `blog` reference apps.
→ `docs/releases/v0.2.4.md` · `docs/live-cdn-repo.md` §9

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
