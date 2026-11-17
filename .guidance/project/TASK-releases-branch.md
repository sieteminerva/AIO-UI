# TASK — self-contained `.tgz` on an orphan `releases` branch

Recorded 2026-11-17. Not started. Owner band: **Tooling** (`scripts/release.mjs`,
`scripts/publish-cdn.mjs`, new `scripts/publish-releases.mjs`).

## Goal

`main` stays source-only (no binaries, fast clone), and there is no manual web-UI upload:
each release folder is committed to an orphan `releases` branch, so
`npm install https://github.com/sieteminerva/AIO-UI/raw/releases/v0.3.0/aio-ui-form-0.3.0.tgz`
works in one command and **offline** — no `@aio-ui/*` fetch from `registry.npmjs.org`.

Rooted in a user report: installing A pulls B, B pulls C, C pulls D, and every manual
`npm install <a>.tgz` fails with E404 because none of the peers are in a registry. The closure has
to be resolved by the tooling, not by the reader of a README.

## What exists today (so the plan subtracts instead of rewriting)

- `scripts/release.mjs --apply --version X` → `.draft/release/vX/`: 40 tarballs,
  `registry.json`, `layout.json`, `checksums.txt`. Packs with
  `npm pack "./<pkg>" --pack-destination …` straight from the workspace (`release.mjs:170`), so
  `peerDependencies: { "@aio-ui/base": "^0.2.1", … }` stay unresolved for a bare consumer — the
  `E404` this task removes.
- `scripts/publish-cdn.mjs --apply` → assembles `.draft/cdn-tree`, commits it to the orphan `cdn`
  branch through a git worktree under `.draft/cdn-worktree`, moves the version tag. The worktree
  pattern is the one to mirror.
- Two gates already guard the front of the pipeline: every package at the target version, and
  `dist` present for every root export.

## Plan

### The real problem is a graph, not a tarball

> "install module A dia butuh module B … manual install module B dapat error juga karena module B
> butuh module C, dimana C butuh D. dah siklus saling terkait ini harus diresolve secara otomatis."

Every internal edge today is a **peer dependency**, which is correct for the workspace and fatal for
a consumer without a registry: npm will not fetch a peer it cannot find. Resolving that closure is
one computation, and there are only two honest ways to ship the answer:

| Mode | Mechanism | Consumer experience | Cost |
| ---- | --------- | ------------------- | ---- |
| **A — embed** | materialise the whole closure under `<stage>/node_modules/@aio-ui/` and declare `bundledDependencies` | `npm install <one-url>.tgz` — **one command, offline** | closure duplicated into every tarball |
| **B — declare** | publish `closure.json` + one generated `npm install url1 url2 …` line | one command, offline, npm resolves in a single pass | no duplication, but more than one URL |

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

1. Per package, stage under `.draft/release/.stage/<name>/`:
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
npm install https://github.com/sieteminerva/AIO-UI/raw/releases/v0.3.0/aio-ui-core-0.3.0.tgz \
            https://github.com/…/aio-ui-base-0.3.0.tgz \
            https://github.com/…/aio-ui-input-0.3.0.tgz \
            https://github.com/…/aio-ui-form-0.3.0.tgz --no-audit --no-fund
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

1. Refuse to run without `.draft/release/vX/registry.json`.
2. Worktree at `.draft/releases-worktree`:
   - if `origin/releases` exists → `git worktree add .draft/releases-worktree origin/releases`;
   - else → `git worktree add --detach …`, then `git checkout --orphan releases`, empty the index
     (`git rm -rf --cached .`), so history starts once and never carries `main`'s tree.
3. Write `vX/` with the tarballs + `registry.json` + `layout.json` + `checksums.txt` +
   `closure.json` + `install/*.txt`. **Never delete older `vX/` directories** — a published URL is a
   contract.
4. Render `README.md` at the branch root from `templates/releases/README.md.tpl`: version table,
   per-package install command, self-contained vs. closure badge. Generated data, not prose.
5. `--apply` → `git add -A && git commit -F <msg> && git push origin releases`. Dry run prints the
   file list and total bytes; undo line printed (`git worktree remove --force .draft/releases-worktree`).
6. `publish-cdn.mjs` keeps publishing **unpacked** packages (jsDelivr import maps) and must never see
   the staged `node_modules`: add one assertion — a tarball that unpacks a `node_modules/` directory
   into the cdn tree fails the run.

### 6. Version + release gate

`node scripts/version.mjs --apply --version 0.3.0` → `npm run verify:pkgs` (build + verify + build;
§4 release tier) → `release.mjs --apply` → `publish-releases.mjs --apply` →
`publish-cdn.mjs --apply`.

### Order of batches

| Batch | Content                                                  | Depends on |
| ----- | -------------------------------------------------------- | ---------- |
| B53   | form/input default opt-in + `bundle-probe` proof (§form)  | —          |
| B54   | `closure.mjs` + `exports.mjs` + `check:exports` gate      | B53 (exits/sizes) |
| B55   | `release.mjs --bundle` + `publish-releases.mjs`           | B54        |
| B56   | `0.3.0` bump + full release verification                  | B53–B55    |


## Decisions

**Taken (2026-11-17):**

1. **Mode A is the default**, mode B is generated anyway and is the fallback when the size gate
   trips. One command must be enough for the common case.
2. **The `development` export condition is stripped from staged manifests** in the tarball and in
   every bundled copy. `files[]` ships root `*.ts`, so leaving it in lets a consumer's bundler pull
   TypeScript sources out of `node_modules`.
3. **Separate branches** — `cdn` keeps the unpacked tree for jsDelivr import maps, `releases` holds
   only `vX/` folders. Neither may carry the other's content.
4. **The graph is computed once** (`closure.mjs`) and every consumer reads it; no script re-walks
   dependencies by hand.

**Still open — needs the owner:**

1. **Size budget.** Proposed: refuse to publish above **25 MB total** for the 40 tarballs, and print
   the heaviest five closures in the dry run. A budget chosen after measuring is not a budget.
2. **Whether `form` → `input` stays a peer on `main`.** Bundling makes it work for a consumer, but a
   `dependencies` entry would let npm resolve it for a plain `npm install @aio-ui/form` from the CDN
   registry — a different distribution story (fase 7), not this batch.

## Verification (the honest one)

From a scratch directory **outside** the repo:

```
npm install <abs>/aio-ui-form-0.3.0.tgz --no-audit --no-fund \
  --cache /tmp/npm-cache-empty --offline
```

- `--cache` on an empty dir + `--offline` is the only combination that proves nothing is fetched
  from the registry. A plain `npm install` passes from the local cache and proves nothing.
- Then a Node smoke import: `@aio-ui/form`, `@aio-ui/form/validation-adapter`,
  `@aio-ui/input/dropdown/module` — the three shapes a submission app actually uses.
- Also assert the installed tree has **no** `@aio-ui` package outside
  `node_modules/@aio-ui/form/node_modules/` (i.e. nothing leaked to the root).
- Repeat once in mode B (`npm install $(cat install/aio-ui-form.txt | cut -d' ' -f3-)`) to prove the
  declared closure is complete: if a URL is missing, npm fails with E404 and the file is wrong.

Gate: `npm run verify` on `main` before the run (source-only, ~54 s).
