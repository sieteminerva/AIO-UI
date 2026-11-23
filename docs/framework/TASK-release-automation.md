# TASK — session ritual fix + release automation

Recorded 2026-11-21 (batch 44). Band: **Tooling** (`scripts/**` + `docs/`).
Prior art: `packages/TASKS.md`, `docs/live-cdn-repo.md` §9.

**Status:** b60–b62 landed (2026-11-24). Scope was three batches: **b60** job 1 (§1), **b61**
`release-doc.mjs` (§2), **b62** `## install` blocks in every package README (§3) — all committed.
**b64** (2026-11-24) regenerated the local `releases/v0.2.4` artefacts from the 37-package tree
(was 39): 37 tarballs + 4 loose bundle files, `orchestrator/__test__/release.test.ts` 14/14 green.
Nothing published — card 3 still rules.
**b65–b66** (2026-11-24) built Option A: `scripts/semver.mjs`; `version.mjs` gains
`--bump/--tag/--level` and checks the four invariants against the newest released registry;
`release.mjs` names each tarball by its package version, records `version`/`deps`/`tree` per
package plus `registry.mode`, copies the previous bytes for an unchanged package, and `--strict`
refuses an unbumped source change. Proofs: `--bump @aio-ui/input --tag 0.2.5` moved one version,
one dependent range and the tag; a 0.2.5 rehearsal against a copy of 0.2.4 produced **identical
checksums**; the same rehearsal with one appended line in `packages/base/src/index.ts` was
refused. `npm run verify`: 970 passed, 1 skipped.
**b67** (2026-11-24) finished the publish-side followers: the two publishers derive their example
asset name from `registry.packages[…].tarball`, the README `## Install` block prints `entry.version`
beside the tag, and `release.test.ts` asserts the filename rule plus reuse-copy byte identity
(**972 passed**, 1 skipped). 29 of 37 packages carry a README; the 8 without one (`base`, `core`,
`styles`, `utilities`, the three themes, `kits/themes`) still print no install block.
**b68** (2026-11-24) wrote those eight READMEs — facts taken from each barrel and class doc block —
and `--readme --apply` now writes 37 blocks. `npm run check` green; tree clean, `e5c7098`.

Owner decisions 2026-11-24: **Q7 reversed** — the CDN stays versioned (`@v<x>`), no versionless
alias, because breaking changes are expected and a silent moving alias is the bigger risk;
**Q5 parked** — aggregate tarballs (`@aio-ui/bundle`, `@aio-ui/iife`) are not designed now;
**Q6 answered** — versioned filenames only, no root `.tgz` alias when they land;
**Option A accepted for design** — per-package versions under one global tag (§Per-package releases).

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
// 76 rows for v0.2.4 (74 exact + 2 wildcards)
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

| Question                         | Answer                                                                                                                                                                                                                           |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Is there a tarball for the pair? | **No.** `releases/v0.2.4/` holds 37 `.tgz`, none named `*bundle*`.                                                                                                                                                               |
| Is it a registry package?        | **No.** `registry.json.bundle` is metadata (`files`, `base`, `usage`); there is no `packages["@aio-ui/bundle"]` and no `exports` entry, so `release.mjs`'s pack loop never sees it.                                              |
| Is it on the CDN?                | **Yes.** All four files return `200` at the branch root under `@v0.2.4/`.                                                                                                                                                        |
| Is it in the note's CDN table?   | **No** — the generated table has 76 package rows (131 before the surface refactor) and zero bundle rows; the note mentions the pair only in prose. A prose-only URL is exactly the kind of "complete list" that is not complete. |

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
   - `@aio-ui/bundle` — the umbrella: `dependencies` are the 37 package tarball URLs (mode B), so
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
install to `node_modules/@aio-ui/bundle` and `node_modules/@aio-ui/iife`, beside the 37 hoisted
packages, so everything still sits under `node_modules/@aio-ui/`.

Filenames are ours (`npm pack --pack-destination` + rename): use
`aio-ui-bundle-<version>.tgz` / `aio-ui-iife-<version>.tgz`, plus unversioned aliases
`aio-ui-bundle.tgz` / `aio-ui-iife.tgz` at the branch root. **Do not** use
`@aio-ui.bundle.tgz` / `@aio-ui.iife.tgz`: a leading `@` makes npm read a local path as a scope
specifier, and jsDelivr reads `@` as the version separator.

#### Duplication — the owner's reading is right

npm keys a dependency by its resolved specifier, so `@aio-ui/bundle` and a direct
`npm i aio-ui-core-0.2.4.tgz` of the same version share one installed copy; only _different
versions_ nest a second copy. The duplication that actually costs bytes is mode A (closure embedded
in every tarball), a different axis that is already gated.

#### Work this creates (for the implementing session)

| File                           | Change                                                                                                                                                                                                                                      |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `scripts/release.mjs`          | stage two synthetic packages from a template (`@aio-ui/bundle` = `dependencies` of 37 URLs; `@aio-ui/iife` = `files` of the four artefacts), `npm pack`, rename, hash into `checksums.txt`, record `registry.aggregates` (`bundle`, `iife`) |
| `scripts/publish-releases.mjs` | the orphan-tarball gate must read `registry.aggregates` too, or two extra `.tgz` fail the run                                                                                                                                               |
| `scripts/publish-cdn.mjs`      | copy both tarballs to the branch root under the unversioned names (the `iife` files are already there as loose files)                                                                                                                       |
| `templates/cdn/README.md.tpl`  | rows for `@aio-ui/bundle` and `@aio-ui/iife`, with the `<script>`-not-`import` warning                                                                                                                                                      |
| `docs/live-cdn-repo.md` §9     | checklist gains the two install URLs and their probes                                                                                                                                                                                       |
| `release-doc.mjs`              | _Bundled pair_ block gains the two tarball URLs                                                                                                                                                                                             |

Done when the note's _Bundled pair_ block is generator output, `--probe` covers the four loose
files plus both tarballs, and `npm i <url>/aio-ui-bundle-0.2.4.tgz` in a scratch consumer creates
`node_modules/@aio-ui/{bundle,iife}` together with the 37 packages.

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
7. ~~**The CDN must not be versioned**~~ — **REVERSED by the owner on 2026-11-24.** Many breaking
   changes are expected, so a versionless alias would silently move consumers; the CDN stays on
   the version tag (`@v0.2.4`) and `publish-cdn.mjs` keeps moving that tag. Every generated URL
   (import map, `CDN_BASE`, the `## install` block) prints `registry.base` **as it is** — the
   generator never composes a versionless URL, so re-deciding later is one `--apply`.

## 3. `## install` in every package README (owner addition, 2026-11-24)

A package README never shows how to get the package: the tarball URL and the CDN paths already
exist in `registry.json`, they are just never printed where a reader looks.

Shape — idempotent, marker-bounded, one block per README:

```md
<!-- install:begin -->

## Install

    npm install <registry.packages[name].tarball>

CDN (ES module, no build step) — `<registry.base><entry.dir>/<entry.subpaths["."]>`
Stylesheet — `<registry.base><entry.dir>/<stylesheet subpath>`

<!-- install:end -->
```

Rules:

- **Placement.** After the lead paragraph, before the first hand-written `##`, so `## Install` is
  the first section of every package README and re-running the generator never moves it.
- **Source of truth.** Only `releases/v<x>/registry.json`. Every URL is copied from
  `registry.base`, `entry.dir`, `entry.subpaths` and `entry.tarball`; the generator never composes
  a base (that is what makes the versioned-CDN decision a one-line change).
- **Non-builder packages** (`core`, `base`, `utilities`, `styles`, `themes`, `kits/*`) print their
  tarball plus the CDN URL of the map a host actually loads (`layout.json` / `index.css`), never a
  fake `import`.
- **Accepted cost (owner, 2026-11-24):** 37 READMEs change on every release, so
  `docs/framework/catalogue.json` must be regenerated (`node scripts/catalogue.mjs --apply`) or
  `check:catalogue` fails. Versioned URLs are the reason; a versionless CDN was rejected.
- **Gate.** `npm run check` plus a diff assertion that only text between `install:begin/end`
  changed (a hand-written section must never be touched).

## Per-package releases (open, 2026-11-24)

A small bug fix should be shippable without re-releasing the whole framework. What the current
pipeline allows, and what it does not:

- **Works today — tarball patch.** Bump one package's `version`, `npm pack` it, and put the `.tgz`
  on the `releases` branch (or as a GitHub Release asset). `npm install <tarball-url>` consumers
  get the patch; no CDN tag moves.
- **Does not work — moving one package inside an old CDN tag.** jsDelivr tags the whole repo and
  tags are immutable (`publish-cdn.mjs`): a patched package needs a _new_ tag, and `@v<x>` serves
  the whole tree. The versionless alias was cancelled (Q7), so consumers on `@v0.2.4` never move.
- **Needs a structural change — true per-package semver.** `version.mjs` fixes one number for the
  family ("34 numbers that must agree"), `release.mjs` Gate 1 requires every package to equal
  `--version`, and mode-B `dependencies` pin a _specific_ tarball version, so patching a package
  others depend on requires repacking those dependents (or switching edges to ranges).
  `registry.base` is a single tag; per-package tags would mean a per-package base and import map.

### Option A — accepted for design (2026-11-24), not yet built

One monotonically increasing global **tag** per release; a **package version that may differ from
it**. A patch release bumps only the changed package(s), writes a new `v<tag>/` folder, and
`release.mjs` / `version.mjs` relax "every package == global version" to "changed ≥ previous".
Option B (a tag per package, e.g. `input-v0.2.5`) stays rejected: a per-package base means a
per-package import map and publish loop for a case nobody has asked for.

**Rules**

- `registry.version` keeps meaning the **tag**; `registry.packages[name]` now also records
  `version`, `deps` (each internal edge's version) and `tree` (a hash of the shipped files), and the
  document records `registry.mode` (`"A"`/`"B"`). Additive: an older registry without them is read
  with the tag as each package's version, and simply repacks once.
- Tarball **filename** carries the package version (`aio-ui-input-0.2.5.tgz`); the **folder**
  carries the tag (`v0.2.5/`).
- Internal edges are already rewritten to the sibling's own version (`release.mjs`'s
  `tarballUrl(dep, depVersion)`), so a patched package points at its siblings correctly with no
  change to that code.
- A package whose version did not change is **not repacked**: its previous bytes are copied into
  the new folder, so one version keeps exactly one byte identity and one checksum. Repacking
  would produce the same version twice with different bytes (mtime, zlib) — an integrity trap.
  The copy is allowed only when version, dependency versions **and** mode all match; a changed
  dependency URL forces a repack, because the tarball's manifest embeds those URLs.
- The bump is **declared** (`version.mjs --apply --bump <name> --tag <x.y.z>`); a forgotten bump is
  caught by `release.mjs`, which compares each package's `tree` hash — the files `files[]` ships,
  minus the generated `package.json`/`README.md` — against the previous registry: source moved but
  version did not is a **warning**, and `--strict` turns it into an error.

**Invariants `version.mjs --check` asserts** (against the newest `releases/v*/registry.json` it can
find, so a clean checkout without artefacts skips them and says so):

1. every `packages[x].version` ≤ the root tag (semver, pre-release allowed);
2. no package version decreased against the previous registry;
3. every internal range on `@aio-ui/*` equals `^<that package's own version>`;
4. the tag is not older than the previous tag (equal is the normal state between releases).

**Changes — b65–b67 landed**

| File                                    | Change                                                                                                                                                                                                                                                                                                                           |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `scripts/semver.mjs` (new)              | `parse` / `compare` / `next`, pre-release aware, no dependency: a release tool that cannot install its own dependency is not a release tool.                                                                                                                                                                                     |
| `scripts/version.mjs`                   | **landed b65** — single-version drift stops being an error; `--check` loads the newest released registry and asserts the four invariants; `--bump <name…> [--level patch\|minor\|major]` bumps those packages and follows their internal ranges; `--tag <x.y.z>` writes only the root manifest version.                          |
| `scripts/release.mjs`                   | **landed b66** — Gate 1 is per-package (version ≤ tag, ≥ previous); `tarballName()` takes the package version; `version`, `deps`, `tree` and `registry.mode` are recorded; unchanged packages copy the previous tarball instead of repacking; the drift report runs before anything is written and `--strict` refuses the write. |
| `scripts/publish-releases.mjs`          | **landed b67** — the closing `verify:` line derives a real asset name from the last registry entry instead of `${version}`.                                                                                                                                                                                                      |
| `scripts/publish-release-assets.mjs`    | **landed b67** — `fallbackBody` reads `registry.json` and names a real entry; the body says package versions may differ from the tag.                                                                                                                                                                                            |
| `scripts/publish-cdn.mjs`               | no change: it unpacks by `entry.tarball.split("/").pop()` and the branch README already prints the asset name.                                                                                                                                                                                                                   |
| `scripts/release-doc.mjs`               | **landed b67** — the `## Install` block prints `Version — \`<entry.version>\` (tag \`v<registry.version>\`)`; `--readme --apply`+`catalogue.mjs --apply` rewritten (29 READMEs; a third pass is byte-identical).                                                                                                                 |
| `orchestrator/__test__/release.test.ts` | **landed b67** — the filename rule (`aio-ui-<scope-stripped>-<version>.tgz`, 37/37) and the reuse-copy hash against the previous `v*/` folder.                                                                                                                                                                                   |
| `docs/live-cdn-repo.md` §9              | **landed b67** — chain gains `--bump` and `--strict`, plus the "one tag per release; package versions may differ" line.                                                                                                                                                                                                          |

**Downsides, stated**

- Every release still copies the whole tree into a new tag, because jsDelivr resolves per tag;
  unchanged bytes are duplicated in git. The 3 MB gzip budget and `--allow-growth` stay the guard.
- The same package version can be reachable from two folders. Reuse-copy makes the bytes identical,
  so integrity does not depend on which URL a consumer picked — but the URL count still grows.
- Two consumers pinning different sibling versions of the same package still get a second nested
  copy under `node_modules`; mode B already behaves that way today.

**Done when**

- `version.mjs --apply --bump input --tag 0.2.5` moves `@aio-ui/input` to 0.2.5, the one dependent's
  range to `^0.2.5`, and the tag — every other package stays at 0.2.4, and `version:check` is green.
  (The tag travels with the bump because invariant 1 says no package may outrun it.)
- `release.mjs --version 0.2.5 --apply --strict` writes a folder holding `aio-ui-input-0.2.5.tgz`
  beside `aio-ui-form-0.2.4.tgz`, records both versions, and passes strict because the unchanged
  bytes match `v0.2.4/`.
- A consumer installing `aio-ui-input-0.2.5.tgz` from `v0.2.5/` resolves its siblings to the
  copied 0.2.4 tarballs in the same folder.

### Release blockers to clear before the next publish

1. ~~Stale committed registry~~ — **cleared locally 2026-11-24 (b64):** `releases/v0.2.4` was
   regenerated from the 37-package tree (37 `.tgz` + 4 loose files); `release.test.ts` is 14/14.
   The worktree is **not committed**: committing the folder is the publish step (card 3).
2. Aggregate tarballs `@aio-ui/bundle` / `@aio-ui/iife` (§2.1) are not built; the bundled pair is
   loose files only, so `npm install` of the pair is impossible and the "Bundled pair" block has no
   tarball rows.
3. `publish-release-assets.mjs` needs `GITHUB_TOKEN` — the one manual step.
4. Mode-B installs resolve internal edges over the network (raw `releases` URLs); `--offline` fails
   by design, and the `releases` branch must stay live.
5. Mode-A figures in the note (34.07 MB, heaviest `table`) are hand-typed — not derivable, so the
   artefacts table can never be fully generated.
6. `docs/releases/v0.2.4.md` mixes two snapshots: `## Published` (39, historical) and the CDN table
   (37, regenerated). Keep them clearly labelled when the publish lands.
7. Reference apps `store` / `profile` / `blog` do not exist yet; the official release waits on them.

## Next — start here (cold)

1. **Release v0.2.5 — owner ordered it on 2026-11-24.** b65–b68 touched only scripts, docs and
   READMEs, so `packages/**/src` is unchanged: a `--tag 0.2.5` would reuse-copy every tarball and
   the eight new READMEs would never reach a package file. **Bump the whole family instead**
   (`--version 0.2.5`), which repacks all 37 and makes the READMEs ship:

   ```bash
   node scripts/version.mjs --apply --version 0.2.5
   npm run verify:pkgs                                   # the release tier, ~2 m 23 s
   npm run build:bundle
   node scripts/release.mjs --version 0.2.5 --apply --strict
   node scripts/release-doc.mjs --version 0.2.5 --readme --apply
   node scripts/catalogue.mjs --apply                    # 37 READMEs name the new tag
   # docs/releases/v0.2.5.md — copy the v0.2.4 shape, place both marker pairs, then
   node scripts/release-doc.mjs --version 0.2.5 --apply
   node scripts/publish-releases.mjs --apply             # commit + push `releases`
   node scripts/publish-cdn.mjs --apply                  # branch root + tag + push
   npm run check:live                                    # the probe, meaningful only now
   ```

   Manual last step: `GITHUB_TOKEN=… node scripts/publish-release-assets.mjs --tag v0.2.5
--body docs/releases/v0.2.5.md --apply`. Then `git push origin main` (main is ahead of origin).
   The note must call v0.2.5 a **pre-release**: `store` / `profile` / `blog` still do not exist.

2. **README gap — closed in b68.** All 37 packages carry a README and `--readme --apply` writes
   37 blocks (was 29). `base`, `core`, `styles`, `utilities`, the three themes and `kits/themes`
   were written from their barrels and class doc blocks.
3. **Parked (owner, 2026-11-24)** — §2.1 aggregate tarballs; Q6 answered "versioned filenames
   only", so when they land there is no root `.tgz` alias.
4. **Publish is no longer deferred** — the owner ordered it for v0.2.5 (2026-11-24), which
   satisfies the "only on the owner's word" rule that card 3 carried.

> b60–b62 are done (§1–§3 above); their acceptance probes live there, not here.

## Done =

- `session.mjs end` runs to completion with no human input, proven by the four acceptance probes.
- `release-doc.mjs` regenerates `docs/releases/v0.2.4.md`'s CDN section byte-identically (same 76
  package rows + 4 loose bundle rows), and `--probe` reports 200 for the registry, the four loose
  files and one package tarball.
- Every `packages/**/README.md` carries an `install:begin/end` block naming its tarball and its
  CDN paths, `node scripts/catalogue.mjs --check` is green after the rewrite, and a second
  `--apply` changes no byte.
- **Per-package (Option A):** one package can be patched and installed without moving any other
  package's version; `release.mjs --strict` is green because unchanged bytes were copied, not
  repacked; `version:check` fails on a decreasing version, a package newer than the tag, or a
  range that disagrees with its own version.
- `docs/live-cdn-repo.md` §9's release-note line points at the generator instead of a `node -e`.
- **Not** part of done: aggregate tarballs (§2.1), parked by the owner 2026-11-24 — a scratch
  `npm i aio-ui-bundle-<x>.tgz` check is deferred with them.
- This file is deleted and the logbook card drops.
