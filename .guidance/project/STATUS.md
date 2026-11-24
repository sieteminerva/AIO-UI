# Logbook — the cards

> Orientation only: read the cards, report them, ask which card. Open a card's detail doc
> **only** after the user picks it — never "to orient" (`AGENT_RULES.md` §13). Rewritten each
> session, newest on top. One card = one line + one pointer.
>
> Recent batches (newest first): **b72** input schema stage 2 (per-type union +`create()` wiring) ·
> **b71** input schema split (stage 1 grouping) ·
> **b70** control set: idle edit/save half rebuilt + repeater delete floor ·
> **b69** v0.2.5 published to CDN · **b68** the eight missing package
> READMEs · **b67** publish-side followers · **b65–b66** per-package versions · **b64** registry regen to 37
> packages · **b63** this task doc · **b60–b62** session prompt opt-in, `release-doc.mjs`, `## Install`
> in every package README · **b57** Apps Script hosting · **b52–b59** shell mount point, tab seams.
> Older history: `git log --oneline`.

### 1. Input schema refactor — stage 2 done, **uncommitted**; stage 3 next (framework band)

b72 (2026-11-24): `InputSchema<T>` union + per-type narrowing (`options`/`checked`/`view`/
`shape`/`column`/`inputmode`), `create()` overloaded and folding `{ content, config }`,
`iBasicInputNode` deleted, `config.loading` / `config.error` wired (`@field>error` + CSS),
`view` feeding dropdown/picker, `inputmode` widened in the matrix. Gate: check + verify green
(992 tests). **19 files still uncommitted — commit first**, then stage 3 (per-type module keys,
legacy-door removal, form/example migration). The doc carries the handoff, the traps and the
executable steps. Claim row `copilot b72` is `handoff`.
→ `docs/framework/TASK-INPUT-SCHEMA.md`

### 2. Release v0.2.5 — published (tooling band)

b69 shipped v0.2.5 (2026-11-24): 37 packages at `0.2.5`, branch `releases` + tag `v0.2.5` pushed,
`check:live` **6/6 → 200**. The note name is a pre-release (`store` / `profile` / `blog` absent).
Remaining: only the optional GitHub Release asset upload (`GITHUB_TOKEN`).
→ `docs/releases/v0.2.5.md` · `.guidance/project/framework.md` §Next

### 3. Rajutan app — published site

Batch 57 landed **hosting**: `action:"deploy"` (`orchestrator/apps-script/Deploy.js`) commits the
emitted files and enables Pages, so a job returns a hosted `data.live` + `data.repo` (proof:
`https://sieteminerva.github.io/test_site_rajutan/` serving `Kriya B57`). Next: per-site repos
(token with Administration) + `data[].endpoint`; then auth.
Open: `/exec` is unauthenticated (`CLIENT_TOKEN` unset, `public/sw.js` never registered).
→ `orchestrator/mechanism.md` §1–§11 · `.guidance/project/generator.md` §Next

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

- **v0.2.5 was published on the owner's order** (2026-11-24): branch `releases` and tag `v0.2.5`
  are pushed and probed 6/6. Only the optional GitHub Release asset upload needs `GITHUB_TOKEN`.
- Scratch is `temp/` (deletable whole); `releases/` is the branch worktree, not scratch.
