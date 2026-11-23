# Logbook — the cards

> Orientation only: read the cards, report them, ask which card. Open a card's detail doc
> **only** after the user picks it — never "to orient" (`AGENT_RULES.md` §13). Rewritten each
> session, newest on top. One card = one line + one pointer.
>
> Recent batches (newest first): **b68** the eight missing package READMEs · **b67** publish-side
> followers · **b65–b66** per-package versions · **b64** registry regen to 37
> packages · **b63** this task doc · **b60–b62** session prompt opt-in, `release-doc.mjs`, `## Install`
> in every package README · **b57** Apps Script hosting · **b52–b59** shell mount point, tab seams.
> Older history: `git log --oneline`.

### 1. Release v0.2.5 — ordered by the owner, chain ready (tooling band)

b65–b68 landed: one tag with a version per package, both publishers reading the registry, and the
eight package READMEs that never existed (**37/37** now carry an install block). **Owner ordered
release + publish v0.2.5** (2026-11-24). No `packages/**/src` moved since 0.2.4, so the chain bumps
the **whole family** (`version.mjs --apply --version 0.2.5`) — `--tag` alone would reuse-copy the
tarballs and the new READMEs would never ship. Next: the chain in the task doc §Next.
→ `docs/framework/TASK-release-automation.md` §Next · `.guidance/project/framework.md` §Next

### 2. Rajutan app — published site

Batch 57 landed **hosting**: `action:"deploy"` (`orchestrator/apps-script/Deploy.js`) commits the
emitted files and enables Pages, so a job returns a hosted `data.live` + `data.repo` (proof:
`https://sieteminerva.github.io/test_site_rajutan/` serving `Kriya B57`). Next: per-site repos
(token with Administration) + `data[].endpoint`; then auth.
Open: `/exec` is unauthenticated (`CLIENT_TOKEN` unset, `public/sw.js` never registered).
→ `orchestrator/mechanism.md` §1–§11 · `.guidance/project/generator.md` §Next

### 3. Publish — ordered for v0.2.5 (no longer deferred)

The owner ordered publish on 2026-11-24, which is the condition this card used to wait for. Order:
`publish-releases` → `publish-cdn` → `publish-assets` (the only step needing `GITHUB_TOKEN`) →
`git push origin main`. `releases/v0.2.4` stays uncommitted history; v0.2.5 is the release that
lands. It is a **pre-release**: `store` / `profile` / `blog` do not exist yet.
Open: tarball-consumption probe (`npm i <tarball>` + Node ESM import) still unrun.
→ `docs/releases/v0.2.5.md` · `docs/live-cdn-repo.md` §9 · `.guidance/project/generator.md`

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
- Official releordered for v0.2.5\*\* (owner, 2026-11-24) — the deferred rule is satisfied; nothing
  else gates it except the `GITHUB_TOKEN` step and `git push origin main`.
- The official release stilld of `origin/main`\*\* — the release branch and tag are pushed, the source branch
  is not. One command when the owner wants it: `git push origin main`.
- Scratch is `temp/` (deletable whole); `releases/` is the branch worktree, not scratch.
