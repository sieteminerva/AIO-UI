# Logbook — the cards

> Orientation only: read the cards, report them, ask which card. Open a card's detail doc
> **only** after the user picks it — never "to orient" (`AGENT_RULES.md` §13). Rewritten each
> session, newest on top. One card = one line + one pointer.
>
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

### 1. Generator — AI retry loop — next

The orchestrator band is the active queue. b48 landed `orchestrator/src/answers.ts`
(`modelFromWebType`, `validateAnswers`, `answersToBase`) per
`docs/generator/TASK-answers-contract.md` §3–§5, 17 tests. Next: feed `parseAiContent()` /
`parsePreset()` issues back to the model verbatim (max 2 retries, §8 step 6), then the tarball
install probe and `layout.json` inside the release workflow.
→ `.guidance/project/generator.md`

### 2. Optional hardening — one surface generator

A CDN-surface change still edits 37 `package.json` export maps, then `api-map.json`, `catalogue.ts`
and the registry. The planned `scripts/surface.mjs --write/--check` (same shape as `api.mjs`) is
unwritten; it would also fail a subpath pointing at a file `files[]` excludes — a silent 404 today.
Optional, not a blocker.
→ `packages/TASKS.md` open item 4

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
