# Logbook — top three

> Read this file only at orientation, beside `git log --oneline -8`. Cards are rewritten every
> session, never appended: each is a summary plus the link to the real detail, which is opened only
> after the user picks a card (`AGENT_RULES.md` §13).
>
> Rewritten 2026-11-17: card 1 is a **defect report from a real `.tgz` consumer**, card 2 a **spec
> handed over by the user**, card 3 the queue that survived the rewrite.

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
**Next:** B54 — `closure.mjs` + `exports.mjs`. The frozen `.draft/release/v0.2.1` snapshot was
removed (its layout predates `@aio-ui/input/Missing`), so 14 release checks are skipped until
B55/B56 writes `v0.2.2` artefacts — open work, not a green.
→ `.guidance/project/TASK-form-modules.md`

### 2. Release — one-command offline installs from an orphan branch

`main` stays source-only; each release folder goes to an orphan `releases` branch so
`npm install <raw-github-url>/aio-ui-form-0.2.2.tgz` works in one command with **no**
`registry.npmjs.org` call for the `@aio-ui/*` peers. Tarballs become self-contained by staging the
package, moving internal peers into exact `dependencies` + `bundledDependencies`, and copying the
built dependency dirs into `<stage>/node_modules/@aio-ui/`.
**Plan (2026-11-17):** the closure is a graph computed once by `scripts/closure.mjs`, then shipped
two ways — embedded (mode A, one URL) or declared (`install/<pkg>.txt`, mode B). `scripts/exports.mjs`
+ a `check:exports` gate end the four-way export-map recomputation and catch a subpath whose file
`files[]` excludes. **Budget measured:** mode A = 6.1 MB raw ≈ 2.2 MB gz (heaviest closure `form`
1.17 MB), so the gates are per tarball ≤ 2 MB, per version ≤ 8 MB, repo growth ≤ 3 MB gz.
**Numbering (owner):** third digit only while pre-release — next is `0.2.2`, not `0.3.0`.
**Next:** B54 — `closure.mjs` + `exports.mjs` + `check:exports`.
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
  `profile`, `blog` do not). The tree is at `0.2.1`; the last published tag is `v0.2.1`
  (pre-release, 2026-11-16). Lane: `gallery.md`.
- **Rules**: process `.guidance/AGENT_RULES.md`; engineering + environment
  `docs/framework/COMPONENT-CONVENTIONS.md` (§12 CSS, §13 anti-patterns, §15 env/gates/harness).
- **Memory**: `/memories/` holds state + pointers only — preferences, a band outline per repo, and
  at most three CPs per task file (`AGENT_RULES.md` §12).
