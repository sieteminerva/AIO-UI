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

## Done =

- `session.mjs end` runs to completion with no human input, proven by the four acceptance probes.
- `release-doc.mjs` regenerates `docs/releases/v0.2.4.md`'s CDN section byte-identically (same 131
  rows), and `--probe` reports 200 for the registry, both minified files and one tarball.
- `docs/live-cdn-repo.md` §9's release-note line points at the generator instead of a `node -e`.
- This file is deleted and the logbook card drops.
