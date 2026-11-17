# TASK — self-contained `.tgz` on an orphan `releases` branch

Recorded 2026-11-17. Partially landed 2026-11-18 (the branch, the worktree, the two publishers).
Owner band: **Tooling** (`scripts/release.mjs`, `scripts/releases-worktree.mjs`,
`scripts/publish-releases.mjs`, `scripts/publish-cdn.mjs`).

## Goal

`main` stays source-only (no binaries, fast clone), and there is no manual web-UI upload:
each release folder is committed to an orphan `releases` branch, so
`npm install https://github.com/sieteminerva/AIO-UI/raw/releases/v0.2.2/aio-ui-form-0.2.2.tgz`
works in one command and **offline** — no `@aio-ui/*` fetch from `registry.npmjs.org`.

Rooted in a user report: installing A pulls B, B pulls C, C pulls D, and every manual
`npm install <a>.tgz` fails with E404 because none of the peers are in a registry. The closure has
to be resolved by the tooling, not by the reader of a README.

## What exists today (so the plan subtracts instead of rewriting)

- **One orphan branch, one checkout.** `releases` carries both halves: `v<version>/*.tgz` (what
  `npm i` installs) and the unpacked tree at the root (what jsDelivr serves). It is checked out at
  `<repo>/releases` — a git worktree created on first use by `scripts/releases-worktree.mjs`,
  ignored on `main`, never a scratch folder. The old `cdn` branch was renamed into it on
  2026-11-18; the tag `v0.2.1` still points at the commit it was renamed from.
- `scripts/release.mjs --apply --version X` → `releases/vX/`: 40 tarballs, `registry.json`,
  `layout.json`, `checksums.txt`. Each registry `tarball` is
  `https://github.com/<repo>/raw/releases/vX/<name>.tgz`, so no GitHub release asset has to exist.
- `scripts/publish-releases.mjs --apply` gates the folder (registry ⇄ tarballs, both directions)
  and commits `vX/` to the branch. `scripts/publish-cdn.mjs --apply` stages the unpacked tree at
  `releases/.stage/cdn`, replaces only the branch root, and moves the version tag. Both share the
  same worktree, so nothing is copied between checkouts.
- Two gates already guard the front of the pipeline: every package at the target version, and
  `dist` present for every root export.

## Plan

### The real problem is a graph, not a tarball

> "install module A dia butuh module B … manual install module B dapat error juga karena module B
> butuh module C, dimana C butuh D. dah siklus saling terkait ini harus diresolve secara otomatis."

Every internal edge today is a **peer dependency**, which is correct for the workspace and fatal for
a consumer without a registry: npm will not fetch a peer it cannot find. Resolving that closure is
one computation, and there are only two honest ways to ship the answer:

| Mode            | Mechanism                                                                                             | Consumer experience                                    | Cost                                  |
| --------------- | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------ | ------------------------------------- |
| **A — embed**   | materialise the whole closure under `<stage>/node_modules/@aio-ui/` and declare `bundledDependencies` | `npm install <one-url>.tgz` — **one command, offline** | closure duplicated into every tarball |
| **B — declare** | publish `closure.json` + one generated `npm install url1 url2 …` line                                 | one command, offline, npm resolves in a single pass    | no duplication, but more than one URL |

Both come out of the same graph, so the work is: **build the graph once, then choose per package.**
Recommendation: A as the default (it is what was asked for), B generated for free and used as the
fallback when the size gate trips.

### 1. `scripts/closure.mjs` — the shared primitive (do this first)

1. Read every publishable `package.json` (the same walk `release.mjs` already does), then build a
   directed graph over keys starting with `@aio-ui/` in both `dependencies` and `peerDependencies`.
2. Topological sort with explicit cycle reporting — an internal cycle is a design error, so name the
   cycle and exit 1 instead of recursing.
3. Output, per package: `direct` deps, `closure` in load order, `closedSize` (bytes of every dist
   file in the closure, de-duplicated), and the reverse map (who needs me).
4. Modes: dry-run (default, prints the graph + the 5 heaviest closures), `--json` (one document, for
   `aio-kit` and for `release.mjs` to consume), `--check` (fail when a `@aio-ui/*` key is missing
   from the workspace, i.e. a typo'd dependency name).

This is the piece that answers "resolved automatically": nothing downstream re-walks dependencies
by hand.

### 2. `release.mjs` gains `--bundle` (mode A)

1. Per package, stage under `releases/.stage/<name>/`:
   - copy the package dir;
   - rewrite **only the staged** `package.json`: internal `peerDependencies` → exact
     `dependencies` + `"bundledDependencies"`, and drop the `development` export condition (the
     tarball is a published artefact; a consumer bundler must not pull `.ts` out of `node_modules`);
   - materialise the closure under `<stage>/node_modules/@aio-ui/<dep>/`, each copy rewritten the
     same way **recursively** — a bundled dependency that still declares internal peers will make
     npm fetch them again, which is exactly the E404 being removed;
   - hard-link the built dependency directories where the filesystem allows it, copy otherwise
     (Windows NTFS supports `linkSync`; a copy is the fallback, not the default).
2. `npm pack .` inside the stage, keeping the filename convention so `registry.json` needs no change
   beyond `size`/`integrity`.
3. `registry.json` gains `order` (topological index) and `selfContained: true|false` per package, so
   the branch README can tell the truth per package instead of globally.
4. **Size gate, before anything is published:** dry-run prints per-tarball and total bytes. If the
   total exceeds the agreed budget (propose: 25 MB for the whole 40-package set), the run refuses to
   publish and points at `--no-bundle` (mode B). A number decided after the fact is not a gate.
5. `main`'s `package.json` files are read, never written — `scripts/bounds.mjs` and the workspace
   links stay clean. State this as a hard rule in the script header, not a comment.

### 3. Mode B is generated, never hand-written

From `closure.json`, `publish-releases.mjs` renders `vX/install/<package>.txt` — one line, the
closure in topological order, e.g.

```
npm install https://github.com/sieteminerva/AIO-UI/raw/releases/v0.2.2/aio-ui-core-0.2.2.tgz \
            https://github.com/…/aio-ui-base-0.2.2.tgz \
            https://github.com/…/aio-ui-input-0.2.2.tgz \
            https://github.com/…/aio-ui-form-0.2.2.tgz --no-audit --no-fund
```

and the same command inside the branch `README.md` per package. If mode A is on, the README says
"one URL is enough"; if mode B is on, it says "paste this line". Either way the consumer never
guesses.

### 4. `scripts/exports.mjs` — stop recomputing the export map in four places

The user's other note — the export indexing is spread out — is the same defect from the other side.
Today `release.mjs` derives subpaths with `subpathsOf()`, `api.mjs` holds `api-map.json`, `bounds.mjs`
reads entry points, and `catalogue.mjs` reads READMEs. Four readers, four chances to disagree.

- One generated `docs/framework/exports.json`: package → `dir`, `subpaths` (specifier → published
  file), `conditions` (`development`/`types`/`default`), `files` coverage verdict.
- **`check:exports` gate (the new, cheap value):** for every subpath, the published file must be
  present **in the tarball**, i.e. survive `files[]`. A subpath pointing at an excluded file is a
  silent 404 at install time and nothing checks it today. Compute `files[]` membership without
  packing (gitignore-style matcher over the package dir) so the gate costs ~1 s.
- `release.mjs` and `publish-cdn.mjs` then read `exports.json` instead of recomputing; `api.mjs`
  cross-checks its symbol list against it.

### 5. Publish the folder to `releases` (`scripts/publish-releases.mjs`)

Landed 2026-11-18 for the plain (non-bundled) tarballs; the bundled rewrite is §2 and still open.

1. Refuse to run without `releases/vX/registry.json`, and refuse a folder where a tarball named in
   the registry is missing **or** a tarball exists that the registry does not name.
2. Worktree at `<repo>/releases` (`ensureWorktree`): reuse the checkout → local branch → remote
   branch → a fresh orphan. Never a throwaway worktree under `temp`.
3. Commit `vX/` as it stands. **Never delete older `vX/` directories** — a published URL is a
   contract, and `publish-cdn.mjs` replaces only the branch root.
4. `--apply` → commit + force-push `releases`. Dry run prints the file list and total bytes.
5. `publish-cdn.mjs` keeps publishing **unpacked** packages (jsDelivr import maps) and must never
   see the staged `node_modules`: add one assertion — a tarball that unpacks a `node_modules/`
   directory into the cdn tree fails the run. (Still open, lands with §2.)

### 6. Version + release gate

`node scripts/version.mjs --apply --version 0.2.2` → `npm run verify:pkgs` (build + verify + build;
§4 release tier) → `release.mjs --apply` → `publish-releases.mjs --apply` →
`publish-cdn.mjs --apply`.

### Order of batches

| Batch | Content                                                     | Depends on         |
| ----- | ----------------------------------------------------------- | ------------------ |
| B53   | form/input default opt-in + `bundle-probe` proof (§form)    | —                  |
| B53b  | missing-module warnings/throws + form owns the full stack   | B53                |
| B54a  | `releases` branch + `./releases` worktree + both publishers   | ✅ 2026-11-18      |
| B54   | `closure.mjs` ✅ · `exports.mjs` + `check:exports` open        | B53b (exits/sizes) |
| B55   | `release.mjs` two modes ✅ (B default, A via `--bundle`)        | B54                |
| B56   | `0.2.3` bump + verify:pkgs + publish ✅                        | B53b–B55           |
| B57   | manual: Releases-page assets (`publish-release-assets.mjs`)   | B56                |

## Decisions

**Taken (2026-11-17):**

1. **Mode A is the default**, mode B is generated anyway and is the fallback when the size gate
   trips. One command must be enough for the common case.
2. **The `development` export condition is stripped from staged manifests** in the tarball and in
   every bundled copy. `files[]` ships root `*.ts`, so leaving it in lets a consumer's bundler pull
   TypeScript sources out of `node_modules`.
3. ~~**Separate branches**~~ — **superseded 2026-11-18 (owner): one orphan branch, `releases`.**
   It carries the unpacked tree at the root **and** `vX/` beside it; the old `cdn` branch was
   renamed into it and the tag `v0.2.1` still points at the renamed commit. The checkout lives at
   `<repo>/releases` (a worktree), not in `temp`.
4. **The graph is computed once** (`closure.mjs`) and every consumer reads it; no script re-walks
   dependencies by hand.
5. **`form` → `input` becomes a real `dependencies` entry, not a peer** (owner, 2026-11-17): the
   form ships with its field layer, so one `npm i` of the form tarball is enough. Every other
   internal edge stays a peer until B55 decides per package from the graph.
6. **Numbering: third digit only while pre-release** (owner, 2026-11-17) — `0.2.2`, `0.2.3`, … until
   the digit saturates. Breaking notes go in the release body, not in the number.

**Still open — needs the owner:**

1. ~~Size budget~~ — **measured, see below. The proposed single 25 MB number is withdrawn.**
2. ~~`form` → `input` as peer or dependency~~ — **decided: dependency** (see 5). B53b does the move;
   the closure graph (B54) then confirms it costs one edge, not a second copy.

## Size budget — measured, not guessed (2026-11-17)

Throwaway measurement over the built tree (35 internal packages, `dist` + `src`):

| Fact                                        | Value                                                                                           |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| all internal `dist` combined                | **4.5 MB**                                                                                      |
| mode A total (Σ of every package's closure) | **6.1 MB raw ≈ 2.2 MB gzipped**                                                                 |
| heaviest closure                            | `@aio-ui/form` 1.17 MB / 6 packages                                                             |
| next                                        | `table` 1.07, `id-address` 1.06, `message` 0.89, `input` 0.49 (2 pkgs), `modules` 0.29 (7 pkgs) |
| single packages                             | `input` 591 KB, `core` 410 KB, `form` 403 KB, `base` 211 KB                                     |

**A 25 MB total budget is ~11× reality, so it would never fire — it is a wish, not a gate.** A gate
that cannot trip is worse than none: it documents a limit nobody is near and hides the moment a
staging bug doubles a tarball.

Three numbers instead, each catching a different failure:

| Gate              | Number                                          | Catches                                                                                            | When it trips                                  |
| ----------------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| per tarball       | **≤ 2.0 MB raw** (heaviest measured 1.17)       | a staging bug that copies the tree twice (source + dist + node_modules), or a new heavy dependency | refuse to pack that package; print its closure |
| per version total | **≤ 8.0 MB raw** (measured 6.1, +30 % headroom) | slow growth spread across many packages                                                            | refuse to publish; list the five heaviest      |
| repo growth       | **≤ 3 MB gzipped per version** (measured 2.2)   | the only _permanent_ cost — every `vX/` stays in git forever                                       | warn and require an explicit `--allow-growth`  |

Why each direction is bad:

- **Too tight** (say 6 MB): the honest build trips the gate on the very first run, the natural
  response is to raise the number without measuring, and the gate loses its meaning. It also pushes
  everyone to mode B for no reason — mode B is not smaller, it is _deduped_, and its cost is
  correctness of a generated line rather than bytes.
- **Too loose** (25 MB): a 4× regression stays invisible, and the branch grows by up to 25 MB per
  release forever. Git never forgets, so `git clone --branch releases` degrades for every future
  contributor.
- **Right size**: the number moves only when someone _decides_ to grow, and the diff that made it
  grow is named in the failure message.

Mode B costs nothing in this budget (`install/*.txt` is a few KB); its risk is completeness of the
generated line, which is why the verification section installs from `install/<pkg>.txt` once.

## Verification (the honest one)

From a scratch directory **outside** the repo:

```
npm install <abs>/aio-ui-form-0.2.2.tgz --no-audit --no-fund \
  --cache /tmp/npm-cache-empty --offline
```

- **Today the answer is no**, and it is not a packaging detail: `v0.2.1` assets predate B53, every
  internal edge is a peer, and `@aio-ui/core` declares **no** dependency although its `dist` imports
  `@aio-ui/utilities/*`. So `npm install <aio-ui-core-0.2.1.tgz>` alone succeeds and then fails on
  first import. B54–B56 is what turns this section into a green check.
- After B53b, `@aio-ui/form` declares `@aio-ui/input` as a real dependency, so the form tarball is the
  first one whose single-URL story can be true; the rest follow the same rule per package.

- `--cache` on an empty dir + `--offline` is the only combination that proves nothing is fetched
  from the registry. A plain `npm install` passes from the local cache and proves nothing.
- Then a Node smoke import: `@aio-ui/form`, `@aio-ui/form/validation-adapter`,
  `@aio-ui/input/dropdown/module` — the three shapes a submission app actually uses.
- Also assert the installed tree has **no** `@aio-ui` package outside
  `node_modules/@aio-ui/form/node_modules/` (i.e. nothing leaked to the root).
- Repeat once in mode B (`npm install $(cat install/aio-ui-form.txt | cut -d' ' -f3-)`) to prove the
  declared closure is complete: if a URL is missing, npm fails with E404 and the file is wrong.

Gate: `npm run verify` on `main` before the run (source-only, ~54 s).
