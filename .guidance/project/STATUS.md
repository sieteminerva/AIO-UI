# Logbook — top three

> Read this file only at orientation, beside `git log --oneline -8`. Cards are rewritten every
> session, never appended: each is a summary plus the link to the real detail, which is opened only
> after the user picks a card (`AGENT_RULES.md` §13).
>
> Rewritten 2026-11-17: the theme-console, menu and masonry cards were dropped on request and the
> three below took their place. Card 1 is a **defect report from a real `.tgz` consumer**, card 2 is
> a **spec handed over by the user**, card 3 is the queue that survived the rewrite.

### 1. Form — modules that never get loaded without a shell

A consumer installs the `.tgz` set by hand, skips `AioApp`, renders through `DOMRenderer` and calls
`new FormBuilder({ modules: new ModuleLoader("form", FORM_ADAPTER_MANIFEST) })`. Every field throws
`[FormBuilder] No module rendered the field`. Cause is a **shape mismatch, not missing behaviour**:
`ModuleLoader` takes `iModuleDefinition` (`{ id, load }`); what is being handed to it is
`iComponentModuleRef` (`{ id, path, export }`), which only `ComponentRegistry` can resolve. Nothing
in the public surface says which is which, and `ModuleRegistry.register()` does not validate.
**Plan:** guard at the door + one `resolveModuleDefinitions()` helper + the missing README recipe.
→ `.guidance/project/TASK-form-modules.md`

### 2. Release — one-command offline installs from an orphan branch

`main` stays source-only; each release folder goes to an orphan `releases` branch so
`npm install <raw-github-url>/aio-ui-form-0.2.2.tgz` works in one command with **no**
`registry.npmjs.org` call for the `@aio-ui/*` peers. Tarballs become self-contained by staging the
package, moving internal peers into exact `dependencies` + `bundledDependencies`, and copying the
built dependency dirs into `<stage>/node_modules/@aio-ui/`. Workspace manifests are never touched.
**Open decisions:** bundle size (measure first), and whether the staged `package.json` keeps the
`development` export condition that would ship raw `.ts` out of `node_modules`.
→ `.guidance/project/TASK-releases-branch.md`

### 3. Carried queue — the small fixes that keep §16 honest

`scripts/proof.mjs --report` (per-package `inspect()` coverage — the ratchet that makes §16
mechanical), the dead `ElementCreatedEventBus.relay` call plus two leftover `console.log` in
`DOMRenderer`, and `#cleanupMap` never being reset per `render()`.
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

Last updated: 2026-11-17

## Cross-project

- **Official release** waits for all four manual model references (`gallery` exists; `store`,
  `profile`, `blog` do not). The tree is at `0.2.1`; the last published tag is `v0.2.1`
  (pre-release, 2026-11-16). Lane: `gallery.md`.
- **Rules**: process `.guidance/AGENT_RULES.md`; engineering + environment
  `docs/framework/COMPONENT-CONVENTIONS.md` (§12 CSS, §13 anti-patterns, §15 env/gates/harness).
- **Memory**: `/memories/` holds state + pointers only — preferences, a band outline per repo, and
  at most three CPs per task file (`AGENT_RULES.md` §12).
