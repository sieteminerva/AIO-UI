# TASK — session ritual fix + release automation

Recorded 2026-11-21 (batch 44). Band: **Tooling** (`scripts/**` + `docs/`).
Prior art: `docs/framework/TASK-releases-branch.md`, `docs/live-cdn-repo.md` §9.

**Status:** open — nothing implemented yet. Two jobs, in this order.

## 1. `session.mjs end` blocks forever under the winpty alias

### Symptom

`node scripts/session.mjs end` never finishes. The user reported it as "hang"; the process prints
the checklist step by step and then waits.

### Evidence (measured 2026-11-21)

| Probe                                                 | Result                                                                                                            |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `node.exe scripts/session.mjs end --no-prompt > file` | exits in **1 s**, full report written                                                                             |
| `type node`                                           | `node is aliased to 'winpty node.exe'` (documented in `scripts/README.md` "Notes")                                |
| `winpty node.exe -e "…process.stdin.isTTY"`           | the alias allocates a console, so stdin reports **TTY** even when the caller is not a human                       |
| `winpty node.exe scripts/session.mjs end`             | printed `2. Gate result (or …):` and **blocked**; it only finished after six `Enter` keypresses were sent by hand |

### Cause

`openPrompt()` (`scripts/session.mjs:164`) decides interactivity with
`process.stdin.isTTY`. Under the winpty alias that is **always true**, so `openPrompt()` returns a
readline interface and every `ask()` (`:155`) awaits `rl.question()`. An agent, a task runner or a
redirected shell has nobody to press Enter, so the six questions (`--gate`, `--doc`, `--task`,
`--proved`, `--unproved`, `--next`) wait forever.

Two secondary defects found while reproducing:

- **Prompt/output interleave.** `end()` asks question 2 before steps 3–9 are printed, so a human
  sees only step 1 plus a question, then the remaining checklist appears after the answer. Print
  all nine steps first, then ask.
- **No escape hatch.** `--no-prompt` exists but is undocumented in the door list and is not implied
  when the flags already answer everything.

### Fix (proposed — keep it small)

1. Interactivity becomes **opt-in**: prompt only when `--interactive` is passed (or
   `AIO_SESSION_INTERACTIVE=1`), never from `isTTY` alone. `--no-prompt` stays as the explicit
   override; agent usage is then deterministic.
2. If a prompt would be needed and stdin has not produced a line within ~2 s, print the skeleton
   with placeholders and exit 0 instead of blocking (`AbortSignal.timeout` on the question, or
   `rl.question(…, { signal })`).
3. Print steps 1–9 before the first question.
4. Release the stream in `finally`: `rl?.close(); process.stdin.pause();` — harmless today, and it
   removes the "close is not enough" class of hang.

### Acceptance

- `node scripts/session.mjs end` on a non-TTY stdin → exit 0 in < 2 s (already true).
- `winpty node.exe scripts/session.mjs end` with **no** `--interactive` → exit 0 in < 2 s, skeleton
  with placeholders.
- `winpty node.exe scripts/session.mjs end --interactive` → all nine steps printed, then six
  prompts, then the report.
- `node scripts/session.mjs end --json --no-prompt` → unchanged JSON shape (`door: "end"`).
- `npm run verify` stays green; `scripts/README.md` row for `session.mjs` documents `--interactive`.

## 2. Release automation — design it together (owner co-design)

### What is already manual and must stop being manual

1. `wip` of the release note: today `docs/releases/v<x>.md` is written by hand and the **full live
   CDN path table** was appended by a one-off command in batch 44.
2. Probing: four `curl` calls are typed by hand while the truth is in `registry.json`.
3. The release chain lives in `scripts/README.md` prose and in a human's memory.

### Seeds already in the repo

- `scripts/release.mjs` writes `releases/v<x>/registry.json` + `layout.json` + `checksums.txt`
  and copies the bundled pair — everything the table needs.
- `scripts/build-bundle.mjs` produces the four artefacts the note lists.
- `scripts/publish-cdn.mjs` renders `templates/cdn/README.md.tpl` from the registry. **Same trick,
  different destination**: a release note is another template over `registry.json`.

### The one-off used in batch 44 (reproduce it, then replace it)

```js
// node.exe -e … — reads releases/v0.2.4/registry.json, emits a markdown table
// rows: one per entry of packages[name].subpaths, URL = registry.base + entry.dir + file
// specifier: "." → the package name; otherwise name + subpath.slice(1)
// 131 rows for v0.2.4 (128 exact + 3 wildcards)
```

### Proposal (for agreement, not yet built)

| Piece                           | Shape                                                                                                                                                                                                                                                           |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `scripts/release-doc.mjs`       | `--version <x> --apply` renders `docs/releases/v<x>.md` from `releases/v<x>/registry.json` + a template, replacing only the block between `<!-- cdn-paths:begin -->` and `<!-- cdn-paths:end -->` (idempotent, diff-stable). Dry run prints the table + counts. |
| `templates/release/note.md.tpl` | the human half (breaking / migration / added) stays hand-written; the generated half is the CDN table + the artefacts table (mode, sizes, bundle files, checksum of one tarball).                                                                               |
| Probe step                      | `release-doc.mjs --probe` fetches the published URLs from `registry.base` + the branch README and **fails** on a non-200, so "published" stops being a claim.                                                                                                   |
| Marker convention               | every generated doc section gets `<!-- name:begin -->` / `<!-- name:end -->`; `docs/releases/v0.2.4.md` gets them in the same commit that lands the generator.                                                                                                  |
| Chain                           | `version.mjs --apply` → `verify:pkgs` → `build:bundle` → `release.mjs --apply` → `publish-releases` → `publish-cdn` → `release-doc.mjs --apply --probe` → `main` push. One `npm run release <x.y.z>` wrapper only if the owner wants it.                        |

### 2.1 Sub-task — the bundled pair is neither a tarball nor a table row

Measured 2026-11-21 (v0.2.4 artefacts):

| Question                         | Answer                                                                                                                                                                                                          |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Is there a tarball for the pair? | **No.** `releases/v0.2.4/` holds 39 `.tgz`, none named `*bundle*`.                                                                                                                                              |
| Is it a registry package?        | **No.** `registry.json.bundle` is metadata (`files`, `base`, `usage`); there is no `packages["@aio-ui/bundle"]` and no `exports` entry, so `release.mjs`'s pack loop never sees it.                             |
| Is it on the CDN?                | **Yes.** All four files return `200` at the branch root under `@v0.2.4/`.                                                                                                                                       |
| Is it in the note's CDN table?   | **No** — until batch 45 the generated table had 131 package rows and zero bundle rows; the note mentioned the pair only in prose. A prose-only URL is exactly the kind of "complete list" that is not complete. |

So the pair is published but **unlisted and unpackaged**: a consumer can use it only if they read
the prose. Three decisions, all for the owner:

1. **Table rows (do this regardless).** `release-doc.mjs` emits a separate _Bundled pair_ block
   above the package table: `aio-ui.js`, `aio-ui.min.js`, `aio-ui.css`, `aio-ui.min.css`, marked as
   "not a package — branch root". Batch 45 already added that block by hand to
   `docs/releases/v0.2.4.md`; the generator must reproduce it, not the reverse.
2. **Tarball — decided 2026-11-21 (owner): yes, two of them.** The packages will never be on the
   npm registry, so a tarball URL is the only way `npm install` puts files on disk; "the pair is not
   an ES module" is a documentation problem, not a reason to refuse. Both tarballs must live under
   the `@aio-ui` scope so one `node_modules/@aio-ui/` holds everything:
   - `@aio-ui/bundle` — the umbrella: `dependencies` are the 39 package tarball URLs (mode B), so
     one URL installs the whole framework.
   - `@aio-ui/iife` — the four `aio-ui{,.min}.{js,css}` files, documented as `<script>`/`<link>`,
     never `import`.
3. **Probe coverage.** `--probe` must fetch all four bundle URLs plus `registry.json` and one
   package tarball; today the checklist names only the two minified files.

#### Naming — `"name": "@aio-ui"` is rejected by npm (measured 2026-11-21)

```text
$ npm install ../name-probe/aio-ui-0.2.4.tgz
npm error code EINVALIDPACKAGENAME
npm error Invalid package name "@aio-ui" of package "@aio-ui@file:...": name can only contain
URL-friendly characters.
```

A package name is either `name` or `@scope/name`; a bare scope is invalid, so "one package called
`@aio-ui`" is not available. The closest honest form is `@aio-ui/bundle` and `@aio-ui/iife`: they
install to `node_modules/@aio-ui/bundle` and `node_modules/@aio-ui/iife`, beside the 39 hoisted
packages, so everything still sits under `node_modules/@aio-ui/`.

Filenames are ours (`npm pack --pack-destination` + rename): use
`aio-ui-bundle-<version>.tgz` / `aio-ui-iife-<version>.tgz`, plus unversioned aliases
`aio-ui-bundle.tgz` / `aio-ui-iife.tgz` at the branch root. **Do not** use
`@aio-ui.bundle.tgz` / `@aio-ui.iife.tgz`: a leading `@` makes npm read a local path as a scope
specifier, and jsDelivr reads `@` as the version separator.

#### Duplication — the owner's reading is right

npm keys a dependency by its resolved specifier, so `@aio-ui/bundle` and a direct
`npm i aio-ui-core-0.2.4.tgz` of the same version share one installed copy; only *different
versions* nest a second copy. The duplication that actually costs bytes is mode A (closure embedded
in every tarball), a different axis that is already gated.

#### Work this creates (for the implementing session)

| File | Change |
| --- | --- |
| `scripts/release.mjs` | stage two synthetic packages from a template (`@aio-ui/bundle` = `dependencies` of 39 URLs; `@aio-ui/iife` = `files` of the four artefacts), `npm pack`, rename, hash into `checksums.txt`, record `registry.aggregates` (`bundle`, `iife`) |
| `scripts/publish-releases.mjs` | the orphan-tarball gate must read `registry.aggregates` too, or two extra `.tgz` fail the run |
| `scripts/publish-cdn.mjs` | copy both tarballs to the branch root under the unversioned names (the `iife` files are already there as loose files) |
| `templates/cdn/README.md.tpl` | rows for `@aio-ui/bundle` and `@aio-ui/iife`, with the `<script>`-not-`import` warning |
| `docs/live-cdn-repo.md` §9 | checklist gains the two install URLs and their probes |
| `release-doc.mjs` | *Bundled pair* block gains the two tarball URLs |

Done when the note's _Bundled pair_ block is generator output, `--probe` covers the four loose
files plus both tarballs, and `npm i <url>/aio-ui-bundle-0.2.4.tgz` in a scratch consumer creates
`node_modules/@aio-ui/{bundle,iife}` together with the 39 packages.

### Questions for the owner (answer before building)

1. Does `release-doc.mjs` **own** `docs/releases/v<x>.md`, or only the generated sections inside a
   hand-written file? (proposal: sections only — the prose is judgement)
2. Should `--probe` be part of the generator (one command) or a separate `check:live` gate that can
   run any time?
3. Is `npm run release <x.y.z>` wanted, or is the explicit six-command chain safer (each step
   reviewable)?
4. The release note currently lives in `docs/releases/`; the branch README lives on `releases`.
   Should the note's CDN table also be published on the branch (it duplicates the README's package
   table)?
5. `@aio-ui/bundle` (decided, §2.1): does it also ship an `index.js` that `export *` from the
   packages — so `import { AioApp } from "@aio-ui/bundle"` works — or is it `dependencies` only?
   (an `export *` needs the duplicate-name handling `build-bundle.mjs` already has)
6. Are the unversioned aliases (`aio-ui-bundle.tgz`, `aio-ui-iife.tgz` at the branch root) part of
   the first implementation, or versioned filenames only until the naming settles?

## Done =

- `session.mjs end` runs to completion with no human input, proven by the four acceptance probes.
- `release-doc.mjs` regenerates `docs/releases/v0.2.4.md`'s CDN section byte-identically (same 131
  package rows + 4 loose bundle rows), and `--probe` reports 200 for the registry, the four loose
  files, both aggregate tarballs and one package tarball.
- A scratch consumer run of `npm i <url>/aio-ui-bundle-0.2.4.tgz` produces
  `node_modules/@aio-ui/bundle`, `node_modules/@aio-ui/iife` and the 39 hoisted packages.
- `docs/live-cdn-repo.md` §9's release-note line points at the generator instead of a `node -e`.
- This file is deleted and the logbook card drops.
