# Logbook — top three

> Read this file only at orientation, beside `git log --oneline -8`. Cards are rewritten every
> session, never appended: each is a summary plus the link to the real detail, which is opened only
> after the user picks a card (`AGENT_RULES.md` §13).
>
> Rewritten 2026-11-18: card 1 is the form stack, card 2 the release pipeline that now ships
> `0.2.3`, card 3 the queue that survived.

### 1. Form — modules that never get loaded without a shell

A consumer installs the `.tgz` set by hand, skips `AioApp`, renders through `DOMRenderer` and calls
`new FormBuilder({ modules: new ModuleLoader("form", FORM_ADAPTER_MANIFEST) })`. Every field threw
`[FormBuilder] No module rendered the field`. Cause was a **shape mismatch, not missing behaviour**:
`ModuleLoader` takes `iModuleDefinition` (`{ id, load }`); a manifest carries
`iComponentModuleRef` (`{ id, path, export }`), which only `ComponentRegistry` resolves.
**Landed (b52/b53):** the door refuses a ref with `INVALID_DEFINITION` and names both shapes; the
stack is opt-in and **proved** — the definitions live behind `@aio-ui/form/adapters` and
`@aio-ui/input/modules`, a builder with no modules throws on the first `create()` naming the import,
and `check:bundle` asserts on parsed module ids that both roots pull in none of the nine
implementations while both opt-in entries pull in all of them.
**Landed (b53b, 2026-11-17):** every degraded capability **speaks** — `input/Missing.ts` warns once
per builder and capability (plus a `moduleMissing` emit) for `dropdown`/`file`/`popover`, and throws
where a warning would leave a hole (declared `actions` with no `controls` module, `config.files` with
no `file` module). `FORM_ADAPTER_DEFINITIONS` is **nine**, `prepare()` routes the input four to the
field preset while the manifest keeps its five, and `@aio-ui/form` now depends on `@aio-ui/input` —
proof: **152** parsed modules, a dropdown rendered from the one default import (`inspectPage`).
**Next:** B54 remainder — `scripts/exports.mjs` + `check:exports`.
→ `.guidance/project/TASK-form-modules.md`

### 2. Release — one-command offline installs from an orphan branch

`main` stays source-only; one orphan branch, **`releases`**, carries both halves so
`npm install <raw-github-url>/releases/v0.2.2/aio-ui-form-0.2.2.tgz` works with **no**
`registry.npmjs.org` call for the `@aio-ui/*` peers: the unpacked tree at the root (jsDelivr import
maps) and `v<version>/*.tgz` beside it (installs; `registry.json` points at `raw/releases/…`).
**Landed (B54a, 2026-11-18):** the branch is checked out at **`<repo>/releases`** (a git worktree,
created on demand by `scripts/releases-worktree.mjs`), `release.mjs --apply` writes `releases/vX/`
there, `publish-releases.mjs` gates registry ⇄ tarballs and pushes the folder, `publish-cdn.mjs`
replaces only the branch root and moves the tag, `.draft/` is scratch-only, and `cdn` was renamed
to `releases` (tag `v0.2.1` untouched).
**Landed (B54a–B56, 2026-11-18):** `scripts/closure.mjs` is the graph (40 packages, 51 edges, 21
leaves, one real cycle `form ⇄ message`); `release.mjs` ships **mode B by default** — every internal
edge is a tarball URL on the branch, so `npm i aio-ui-form` pulls **8 separate modules** (proved in
an empty project; 1.18 MB for the whole family). `--bundle` stays as mode A (closure embedded,
6.27 MB). `publish-releases.mjs` gates registry ⇄ tarballs and pushes the folder; `publish-cdn.mjs`
replaces only the branch root and moves the tag. **`0.2.3` is published**: tag, `v0.2.3/` on the
branch, jsDelivr `@v0.2.3` 200.
**Open — the last manual step is the owner's:** the Releases _page_ (release object + 40 assets)
needs a token, so it is
`GITHUB_TOKEN=… node scripts/publish-release-assets.mjs --tag v0.2.3 --body .draft/release-body.md --apply`
(no `gh`/token on this machine; nothing else in the pipeline needs it).
**Next:** `scripts/exports.mjs` + `check:exports` (the B54 remainder), then mode B
`install/<pkg>.txt`.
**Numbering (owner):** third digit only while pre-release.
→ `.guidance/project/TASK-releases-branch.md`

### 3. Carried queue — the small fixes that keep §16 honest

`scripts/proof.mjs --report` (per-package `inspect()` coverage — the ratchet that makes §16 mechanical),
the dead `ElementCreatedEventBus.relay` call plus two leftover `console.log` in `DOMRenderer`, and
`#cleanupMap` never being reset per `render()`.
→ `.guidance/project/framework.md` (`## Next`)

## Where everything else lives

| Need                            | File                                      |
| ------------------------------- | ----------------------------------------- |
| Framework queue + landed        | `.guidance/project/framework.md`          |
| Gallery queue + landed          | `.guidance/project/gallery.md`            |
| Generator queue + landed        | `.guidance/project/generator.md`          |
| Rules — process                 | `.guidance/AGENT_RULES.md`                |
| Rules — component + environment | `docs/framework/COMPONENT-CONVENTIONS.md` |
| Live writers (lock)             | `.guidance/project/AGENTS.md`             |
| An agent building WITH it       | `docs/agent/handbook.md`                  |
| Release + publish               | `docs/live-cdn-repo.md`                   |
| Live demo / Pages               | `docs/framework/DEMO.md`                  |
| Architecture decisions          | `.guidance/project/DECISIONS.md`          |

## Cross-project

- **Official release** waits for all four manual model references (`gallery` exists; `store`,
  `profile`, `blog` do not). The tree and the published tag are at `0.2.3` (pre-release,
  2026-11-18). Lane: `gallery.md`.
- **Rules**: process `.guidance/AGENT_RULES.md`; engineering + environment
  `docs/framework/COMPONENT-CONVENTIONS.md` (§12 CSS, §13 anti-patterns, §15 env/gates/harness).
- **Memory**: `/memories/` holds state + pointers only — preferences, a band outline per repo, and
  at most three CPs per task file (`AGENT_RULES.md` §12).
