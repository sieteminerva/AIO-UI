# Logbook — the cards

> Orientation only: read the cards, report them, ask which card. Open a card's detail doc
> **only** after the user picks it — never "to orient" (`AGENT_RULES.md` §13). Rewritten each
> session, newest on top. One card = one line + one pointer.
>
> Recent batches (newest first): **b65–b66** per-package versions · **b64** registry regen to 37
> packages · **b63** this task doc · **b60–b62** session prompt opt-in, `release-doc.mjs`, `## Install`
> in every package README · **b57** Apps Script hosting · **b52–b59** shell mount point, tab seams.
> Older history: `git log --oneline`.

### 1. Release automation — b65–b66 landed, b67 next (tooling band)

Option A is built: one **tag**, one **version per package**. `scripts/semver.mjs`; `version.mjs`
`--bump/--tag` + four invariants; `release.mjs` names tarballs by package version, records
`version`/`deps`/`tree`/`mode`, copies unchanged bytes, `--strict` refuses an unbumped change.
Proved: a bump moved one range and the tag; a 0.2.5 rehearsal on 0.2.4 reproduced **identical
checksums**; an appended line was refused; `npm run verify` 970 passed.
Open: **b67** — five publish-side followers, listed cold in the task doc §Next.
Open: aggregate tarballs parked (Q5); publish is LAST (card 3).
→ `docs/framework/TASK-release-automation.md` §Next · `.guidance/project/framework.md` §Next

### 2. Rajutan app — published site

Batch 57 landed **hosting**: `action:"deploy"` (`orchestrator/apps-script/Deploy.js`) commits the
emitted files and enables Pages, so a job returns a hosted `data.live` + `data.repo` (proof:
`https://sieteminerva.github.io/test_site_rajutan/` serving `Kriya B57`). Next: per-site repos
(token with Administration) + `data[].endpoint`; then auth.
Open: `/exec` is unauthenticated (`CLIENT_TOKEN` unset, `public/sw.js` never registered).
→ `orchestrator/mechanism.md` §1–§11 · `.guidance/project/generator.md` §Next

### 3. Release — publish is LAST (deferred by the owner)

`releases/v0.2.4` is regenerated locally (37 packages, `mode`/`version`/`deps`/`tree`) and is **not
committed or published** — the worktree stays dirty by design. **Owner decision (2026-11-22):
publish sits at the END of the task order — only after the orchestrator band is finished, or when
the owner asks. Do not raise it, do not propose it, do not ask about publishing before one of
those two conditions is true.** The official release also waits for the `store`, `profile`, `blog`
reference apps.
Open: tarball-consumption probe (`npm i <tarball>` + Node ESM import) still unrun.
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
- `main` is **ahead of `origin/main`** — the release branch and tag are pushed, the source branch
  is not. One command when the owner wants it: `git push origin main`.
- Scratch is `temp/` (deletable whole); `releases/` is the branch worktree, not scratch.
