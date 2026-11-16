# AIO UI

Monorepo for **AIO UI** (the `@aio-ui/*` frontend framework) and **Rajutan** (the
orchestrator that turns a business profile into a generated website). One repository,
two roles, one source of truth.

- **Version:** `0.1.0` — fixed versioning across all packages.
- **Gate:** `npm run verify` (build 37 packages → typecheck → boundaries → version check →
  tests → example builds).
- **Distribution:** GitHub releases only. No npm registry.

## Why this exists

AIO UI is a UI framework written in plain JavaScript — no third-party dependency at runtime, no
framework layer, nothing standing between your code and the browser.

It exists because I grew tired of where front-end frameworks have ended up. The setup alone eats
weeks before a single feature is written. Then comes the part that really hurts: you spend months
on custom templates, custom components and clever logic, and one day the framework is outdated —
it no longer supports the Node you have, its dependencies are abandoned, its APIs are deprecated —
and the work is junk. Trapped behind a version you cannot move, or rewritten from scratch.

Web components were supposed to solve that. They do give you isolation, but they bring their own
trouble as an application grows: state management gets harder, and CSS keeps failing to reach the
element it is meant for. You end up inventing long chains of classes and attributes to poke at
internals, and the markup turns ugly.

So this framework keeps everything where it belongs: HTML, CSS and JavaScript, arranged like an
ordinary website.

## What makes it different

- **A component is a plain JavaScript library.** It runs on its own; no wrapper required. The
  `AioApp` shell adds routing, preloading and module slots — it is not what makes a component
  work.
- **Shallow markup, clean selectors.** One word on average, modifiers carried by `data-*`
  attributes, and every selector can be overridden to your own taste.
- **Theme switching that can overhaul a page.** A selector stands for a `@templateKey`, so one
  theme swap repaints everything — no per-component theming API to learn.
- **A static site needs nothing but `DOMRenderer`.** Write HTML, JavaScript and CSS selectors.
- **Prototyping is instant, and the style stays yours.** Take a markup snippet you already like,
  split it into `@templateKey` selectors, and you have a component.

*Author: YMGH.*

---

## Quick start

```bash
npm install
npm run dev            # examples/gallery  (http://localhost:5175)
npm run dev:demo       # examples/demo
npm run verify         # the full gate — run before claiming anything works
```

| Task                                         | Command                                                   |
| -------------------------------------------- | --------------------------------------------------------- |
| Build every package (`dist` + `.d.ts` + CSS) | `npm run build:pkgs`                                      |
| Typecheck the workspace                      | `npm run typecheck`                                       |
| Dependency-edge check                        | `npm run check:bounds`                                    |
| Public-surface check                         | `npm run check:api` (snapshot: `scripts/api.mjs --write`) |
| Tests                                        | `npm test` (`vitest run`)                                 |
| Version report / check                       | `npm run version:report` · `npm run version:check`        |
| Bump all packages                            | `node scripts/version.mjs --apply --version 0.1.1`        |
| Release artefacts (local, dry-run first)     | `node scripts/release.mjs --version 0.1.1`                |
| Publish CDN tree + move the version tag      | `node scripts/publish-cdn.mjs --apply`                    |

## Repository structure

```
.
├── package.json            workspaces + the scripts above (private root)
├── tsconfig.base.json      compiler rules every package extends
├── tsconfig.json           workspace typecheck entry
├── vitest.config.ts        tests in packages/** and orchestrator/**
│
├── packages/               the framework — one publishable package per folder
│   ├── base/               Builder core: create/prepare/initialize, adapters
│   ├── core/               DOMRenderer, ComponentRegistry, Stylesheets, contracts
│   ├── app/                AioApp: routing, preload, render, module slots
│   ├── styles/             global CSS (reset, variables, layout, typography)
│   ├── utilities/          Metadata, selectors, attributes, color helpers
│   ├── modules/            router, http-service, event-emitter, module-loader,
│   │                       theme, animations
│   ├── themes/             default, cyberpunk, horizontal
│   ├── kits/               aggregators — re-exports only, no logic
│   │   ├── frameworks/     @aio-ui/frameworks = core + base + app
│   │   ├── modules/        @aio-ui/modules = module-loader + the runtime modules
│   │   └── themes/         @aio-ui/themes = the three themes
│   └── components/         accordion article badge carousel fabmenu footer form
│                           id-address input masonry menu message modal
│                           modeswitcher pricingcard product rating section tab table
│
├── examples/               host applications that prove the framework
│   ├── gallery/            gallery/profile model (routes, content, assets)
│   └── demo/               component kitchen, form, product, article
│
├── scripts/                build & release tooling (node, dry-run by default)
│   ├── build-pack.mjs      per-package dist build in dependency order
│   ├── bounds.mjs          dependency-edge enforcement
│   ├── version.mjs         fixed versioning across all packages
│   ├── release.mjs         tarballs + registry.json + layout.json + checksums
│   └── new-component.mjs   scaffold a component package
│
├── templates/              scaffolds used by new-component
│
├── orchestrator/           generator engine (preset → site): plan, emit, runtime, generate
│
├── docs/                   documentation: framework/ + generator/ (see the index below)
│
└── .guidance/              how to work here — rules, plan, architecture guide
    ├── AGENT_RULES.md      hard rules: session start/finish, language, tracking (§9)
    ├── plan.md             index: shared objective + final gate
    ├── plan-framework.md   §1 framework long-term plan
    ├── plan-gallery.md     §2 gallery long-term plan
    ├── plan-generator.md   §3 generator long-term plan (incl. `isRoot` §3.11)
    ├── RAJUTAN.md          system guide: concept, infrastructure, contracts,
    │                       mechanism, outputs, status, roadmap, agent playbook
    ├── rules.md            house conventions (markup, CSS, tokens)
    ├── mandatory/          architecture, coding principles, design, docs, style
    └── project/            per-project decisions + one status file per project
        ├── STATUS.md       logbook: top 3 cards, each with the link to its detail
        ├── framework.md    active / next / landed — packages + examples/demo
        ├── gallery.md      active / next / landed — examples/gallery
        └── generator.md    active / next / landed — orchestrator
```

Work tracking has two layers, and **one item lives in exactly one file**:

- **Outline** — read at orientation. `.guidance/project/STATUS.md` is the logbook: three cards,
  one line each, plus a link. `.guidance/project/<band>.md` holds `## Active` / `## Next` /
  `## Landed`. An `AGENTS.md` carries rules only, never a task list.
- **Detail** — opened only for the current task. `<folder>/TASKS.md` for work inside one folder;
  `docs/<band>/TASK-<name>.md` when it spans packages. Done = delete the doc, the commit is the record.

Working areas — `orchestrator/` is tracked; `.draft/` and `.archives/` are local-only:

| Folder          | Purpose                                                                                       |
| --------------- | --------------------------------------------------------------------------------------------- |
| `orchestrator/` | the generator engine (tracked): `plan` → `emit` → `runtime` → `generate`, tests, AI prompt    |
| `.draft/`       | throwaway scratch: generated sites (`results/`), release artefacts (`release/`), smoke copies |
| `.archives/`    | old implementations kept for reference (e.g. `wizard.ts`, the legacy address API)             |

## Where to look

| I need…                                      | Read                                                                                                                  |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Product vision, market framing               | `docs/generator/presentation0.md`                                                                                     |
| How generated sites are produced (Rajutan)   | `.guidance/RAJUTAN.md`                                                                                                |
| Why / long-term order                        | `.guidance/plan.md`                                                                                                   |
| What is next + what is running (per band)    | `.guidance/project/STATUS.md` (logbook) → `framework.md`, `gallery.md`, `generator.md`                                |
| Rules an agent must follow                   | `.guidance/AGENT_RULES.md`, `.guidance/mandatory/`                                                                    |
| Prompt templates — session / batch / handoff | `.guidance/PROMPTS.md`                                                                                                |
| Renderer internals                           | `docs/framework/DOMRenderer.md`                                                                                       |
| Component conventions / template / data      | `docs/framework/COMPONENT-CONVENTIONS.md`, `docs/framework/COMPONENT-TEMPLATE.md`, `docs/framework/COMPONENT-DATA.md` |
| Input field types & actions                  | `docs/framework/FIELD-TYPES.md`, `docs/framework/INPUT-ACTIONS.md`                                                    |
| App shell (`AioApp`)                         | `docs/framework/APP.md`, `docs/framework/API.md`                                                                      |
| Dependency rules                             | `docs/framework/BOUNDARIES.md` (+ enforced by `scripts/bounds.mjs`)                                                   |
| Import path policy (root barrel vs subpath)  | `docs/framework/PUBLIC-API.md`                                                                                        |
| Events bus                                   | `docs/framework/eventbus.MD`                                                                                          |
| Address picker                               | `docs/framework/idAddress.MD`, `packages/components/id-address/README.MD`                                             |
| Sheets CMS / REST API / deployment           | `docs/generator/GoogleSheets CMS/`                                                                                    |
| Apps Script orchestrator flow                | `docs/generator/apps-script-integration.md`                                                                           |
| Generator engine internals                   | `orchestrator/README.md`                                                                                              |
| The AI prompt that writes content            | `orchestrator/prompt.content.md`                                                                                      |

## Conventions in one screen

- **A capability lives in a module; a component only renders.** No builder imports its
  own CSS — one stylesheet per owner, injected through `@aio-ui/core/Stylesheets`.
- **Definitions + manifest.** `*_DEFINITIONS` are live objects; `*_MANIFEST` lists paths
  and ids. `scope` states intent, **ids decide**.
- **Tokens at `:root`**, themes put `--app-*` on `body[data-theme]`.
- **Boundaries are mechanical** — `npm run check:bounds` fails an undeclared import edge.
- **Barrels are curated** — a package `index.ts` lists its exports; `export *` is only
  allowed in an aggregator, and `npm run check:api` fails when the surface drifts.
- **Fixed versioning** — one number for every package; peers are rewritten together.
- **Reversible tooling** — scripts are dry-run by default; `--apply` writes only
  git-tracked files. Undo with `git restore packages package.json`.

## Status snapshot

Working: 37 packages build and are tested (428 tests, 100 of them the orchestrator generator suite),
the form family (module registry,
messages, animations, address adapters) runs, the generator produces real files
(`.draft/results/`), versioning is fixed at `0.1.0`, and **tag `v0.1.0` is live** on
`sieteminerva/-aio-ui-dev`: jsDelivr serves every import-map URL from the `cdn` branch, and both
generated sites paint from that tag with a clean console.

Open: the **official** release waits until all four webapp models exist as manual references —
`gallery` does, `store` / `profile` / `blog` do not. Generated-site hosting (GitHub Pages vs
Cloudflare Pages) is still open; it does not change the preset contract. Details live in
`.guidance/RAJUTAN.md` §9 and `.guidance/plan.md` §3.10.
