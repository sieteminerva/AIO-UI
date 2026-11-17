# Prompt templates

Short, copy-paste. The repo carries the rest: `.guidance/AGENT_RULES.md` §13 (logbook ritual),
§14 (pre-compact handoff), §15 (commit shape).

## 1. Start a session

```
Status kita sekarang?
```

That is enough — STEP 0 reads the logbook and answers with three cards. `node scripts/session.mjs start`
prints exactly what to report; `--json` returns the same facts as one document. Then pick one:

```
Lanjut #2.
```

## 2. Start a new batch

```
Batch baru: <one-line goal>. Band: <Framework|Gallery|Generator|Tooling>.
Jadikan kartu #1 dan sebutkan kartu mana yang keluar dari logbook.
Ambil claim row dulu, lalu kerjakan. Gate: `npm run check` (~12 s) sebelum commit; `verify` sekali di akhir batch.
```

A second pass on work that already has a card:

```
Batch baru di kartu #<n>: <one-line goal>. Perbarui TASKS.md-nya, jangan buat file baru.
```

## 3. Hand the context to a brand-new agent

```
Kamu agent baru di repo ini.
1. Baca AGENTS.md di root — STEP 0 wajib.
2. Baca .guidance/project/STATUS.md (logbook): laporkan 3 kartunya, jangan buka detail.
3. Aturan proses: .guidance/AGENT_RULES.md §10–§15 (checkpoint, claim, logbook, handoff, commit).
Konteks terakhir: commit <sha>, branch main. Tugas: <one line>.
Jangan crawl .guidance/mandatory/, .archives/, plan*.md, atau band lain.
```

With a batch left unfinished:

```
Lanjutkan batch yang belum selesai: <folder>/TASKS.md (`## Next`) + /memories/session/<task>.md.
Commit terakhir <sha>; `git status --short` harus bersih sebelum edit pertama.
```

## 4. Cut a release

```
Rilis <x.y.z>: bump, gate, release, cdn, assets.
```

The chain, in order. Every step is dry-run by default and reversible; run them in this order or the
artefacts describe a tree that never existed.

1. `node scripts/version.mjs --apply --version <x.y.z>`, then `npm install --package-lock-only`
   (the lockfile carries the versions too, and CI installs with `npm ci`).
2. `npm run verify:pkgs` — build, then the source gate, then the example builds.
3. `node scripts/release.mjs --version <x.y.z> --apply` → `releases/v<x.y.z>/` (40 tarballs +
   `registry.json` + `layout.json` + `checksums.txt`, written inside the orphan-branch worktree).
4. `node scripts/publish-releases.mjs --apply` → commits `v<x.y.z>/` to the orphan `releases`
   branch and pushes it; then `node scripts/publish-cdn.mjs --apply` → the unpacked tree for the
   import map, and force-tags `v<x.y.z>`.
5. Nothing to upload: `registry.json` points at `raw/releases/v<x.y.z>/…`, so a tarball URL
   resolves the moment the branch is pushed. Legacy tags keep their uploaded assets; new ones
   need none.
6. Verify live: `registry.json` names the right repository and `@v<x.y.z>`, and one
   `packages/*/dist/*.js` returns `200`.

Never re-tag a version jsDelivr has already served — it pins the content it first saw, so a fix
ships as a new patch (`docs/live-cdn-repo.md` §8).

## 5. Prove what you built (ritual §16)

```
Batch ini mengubah output. Jalankan ritual §16: satu assertion inspect()/inspectPage()
di test paketnya, lalu sebutkan angkanya di commit. Jangan klaim "sudah jalan".
```

For component work the shape is fixed — presence, shape, one value, plus the negative:

```ts
const { keys, hierarchy, html } = builder.inspect(); // @aio-ui/base
expect(keys).toContain("@mine>row"); // presence
expect(hierarchy["@mine"].elements).toEqual(["p.row"]); // shape
expect(html).toContain("alpha"); // value
expect(html).not.toContain("data-skeleton"); // the negative
```

For page work, `inspectPage(root)` and assert `nodeCount` + one record key. For a preset, the proof
is `parsePreset()` + `plan()` reporting **zero** issues on the changed fixture.

## Notes

- One line of intent beats a paragraph of history — the history is `git log` (§15).
- Never paste the logbook into the prompt; ask for it (§13).
- If an answer starts with "sepertinya…", the agent is guessing — point it at the detail doc.
- "It works" needs a number beside it — `inspect()` output, a test name, or a measured pixel (§16).
- Every `session.mjs` door takes `--json` (`start` · `cp` · `end`): the prose is for reading, the
  document is for wiring — a wrapper such as `aio-kit` parses it instead of scraping the report.
- Remotes: **`origin`** is `sieteminerva/AIO-UI` — push here. `legacy` is the old repository and
  `rajutan` is a different project; push to neither.
