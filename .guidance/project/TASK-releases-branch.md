# TASK — self-contained `.tgz` on an orphan `releases` branch

Recorded 2026-11-17. Not started. Owner band: **Tooling** (`scripts/release.mjs`,
`scripts/publish-cdn.mjs`, new `scripts/publish-releases.mjs`).

## Goal

`main` stays source-only (no binaries, fast clone), and there is no manual web-UI upload:
each release folder is committed to an orphan `releases` branch, so
`npm install https://github.com/sieteminerva/AIO-UI/raw/releases/v0.2.2/aio-ui-form-0.2.2.tgz`
works in one command and **offline** — no `@aio-ui/*` fetch from `registry.npmjs.org`.

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

### 1. Bundle inside the staging dir (`release.mjs`)

1. Build the internal graph once: for every workspace package, `dependencies` +
   `peerDependencies` keys starting with `@aio-ui/`. Topological walk with cycle detection
   (`RegistryError`-style named failure, never a stack overflow).
2. Per package, under `.draft/release/.stage/<name>/`:
   - copy the package dir (honouring `files[]` — `npm pack` in the stage decides, but copying the
     whole dir is cheaper and the `files` filter still applies at pack time);
   - rewrite the staged `package.json` only: internal `peerDependencies` → exact
     `dependencies: { "@aio-ui/x": "X" }`, then `"bundledDependencies": ["@aio-ui/x", …]`;
   - fill `<stage>/node_modules/@aio-ui/<dep>/` with the **already-built** dependency dir
     (recursive, so a bundled dep carries its own bundle). Memoise: stage each package once,
     hard-link or copy from the cache.
3. `npm pack .` inside the stage; keep the same filename convention
   (`aio-ui-<name>-<version>.tgz`) so `registry.json` needs no change beyond `size`/`integrity`.
4. `main`'s `package.json` files are read, never written — `scripts/bounds.mjs` and the workspace
   links stay clean. State this as a hard rule in the script header.

**Cost to measure before committing to it:** duplication is real — bundle size grows with the
closure, and 40 tarballs × their closure can be large. Dry-run must print per-tarball size and the
total; if the total is unacceptable, the fallback is a `--no-bundle` flag plus a README that
installs the full set (40 URLs), which still needs no registry.

### 2. Publish the folder to `releases` (`scripts/publish-releases.mjs`)

1. Refuse to run without `.draft/release/vX/registry.json` (same guard as `publish-cdn.mjs:40`).
2. Worktree at `.draft/releases-worktree`:
   - if `origin/releases` exists → `git worktree add .draft/releases-worktree origin/releases`;
   - else → `git worktree add --detach …` then `git checkout --orphan releases`, empty index
     (`git rm -rf --cached .`), so history starts once and never carries `main`'s tree.
3. Write `vX/` with the 40 tarballs + `registry.json` + `layout.json` + `checksums.txt`.
   **Never delete older `vX/` directories** — a published URL is a contract.
4. Render `README.md` at the branch root from `templates/releases/README.md.tpl`: version table,
   the exact install command per package, and the "install the one you need" note. Generated data,
   not prose, so it cannot drift.
5. `--apply` → `git add -A && git commit -F <msg> && git push origin releases`. Dry run prints the
   file list and total bytes. Undo line printed: `git worktree remove --force .draft/releases-worktree`.
6. `publish-cdn.mjs` keeps publishing **unpacked** packages (jsDelivr import maps) — it must not
   see the staged `node_modules`, so it keeps reading `.draft/release/vX/` only. Add one
   assertion: a tarball that unpacks a `node_modules/` directory into the cdn tree is a failure.

### 3. Version + release gate

`node scripts/version.mjs --apply --version 0.2.2` → `npm run verify:pkgs` (build + verify +
build; §4 says release tier) → `node scripts/release.mjs --apply --version 0.2.2` →
`node scripts/publish-releases.mjs --apply` → `node scripts/publish-cdn.mjs --apply`.

## Decisions to take before coding

1. **`development` export condition inside the tarball.** The export maps ship
   `{"development": "./index.ts", …}` and `files[]` includes root `*.ts`, so a consumer whose
   bundler enables the `development` condition will pull **TypeScript sources out of
   `node_modules`**. Either strip the condition from the staged `package.json` (recommended —
   the tarball is a published artefact, not the workspace) or document loudly that consumers must
   not enable it. Do not leave it implicit.
2. **Bundle or not** — see the size measurement above.
3. **Branch name** — `releases` (chosen) vs. reusing `cdn` with a `tarballs/` folder. Separate
   branch keeps jsDelivr's tree small; keep them separate.

## Verification (the honest one)

From a scratch directory **outside** the repo:

```
npm install <abs>/aio-ui-form-0.2.2.tgz --no-audit --no-fund \
  --cache /tmp/npm-cache-empty --offline
```

- `--cache` on an empty dir + `--offline` is the only combination that proves nothing is fetched
  from the registry. A plain `npm install` passes from the local cache and proves nothing.
- Then a Node smoke import: `@aio-ui/form`, `@aio-ui/form/validation-adapter`,
  `@aio-ui/input/dropdown/module` — the three shapes a submission app actually uses.
- Also assert the installed tree has **no** `@aio-ui` package outside
  `node_modules/@aio-ui/form/node_modules/` (i.e. nothing leaked to the root).

Gate: `npm run verify` on `main` before the run (source-only, ~54 s).
