# Logbook — the cards

> Orientation only: read the cards, report them, ask which card. Open a card's detail doc
> **only** after the user picks it — never "to orient" (`AGENT_RULES.md` §13). Rewritten each
> session, newest on top. One card = one line + one pointer.
>
> Batch 44 (2026-11-21): `v0.2.4` note carries the full live CDN table (131 rows) and the step is
> now mandatory; `session.mjs end` hang diagnosed. Batch 43: `v0.2.4` published, mode B.

### 1. Fix `session.mjs end` + design release automation — next

`session.mjs end` blocks forever because the `node` alias (winpty) makes `isTTY` true, so six
prompts wait for a human that is not there; proven — non-TTY runs exit in 1 s, winpty blocks until
Enter is pressed six times. **Open:** make prompts opt-in plus a 2 s escape, print steps 1–9 before
asking, then co-design `scripts/release-doc.mjs` so every release note generates its CDN table and
probes it; §2.1 adds the bundled pair (live but no tarball, no table row — the note's block is
hand-written until the generator exists).
→ `docs/framework/TASK-release-automation.md`

### 2. Official release — `v0.2.4` live, waiting on three references

`v0.2.4` is live (39 packages, mode B, jsDelivr 200 on registry + both minified files, raw tarball
200, checksums match). **Open:** the official release waits for the `store`, `profile`, `blog`
reference apps (`gallery` exists); GitHub release assets are cut by the owner with a token.
→ `docs/releases/v0.2.4.md` · `docs/live-cdn-repo.md` §9

### 3. Optional hardening — `check:exports`

`release.mjs` still derives subpaths with its own `subpathsOf()`. The planned `exports.json` +
`check:exports` gate (a subpath pointing at a file `files[]` excludes is a silent 404 today) is
unwritten; it is an improvement, not a blocker.
→ `docs/framework/TASK-releases-branch.md` §4

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
