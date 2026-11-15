# Prompt templates

Short, copy-paste. The repo carries the rest: `.guidance/AGENT_RULES.md` §13 (logbook ritual),
§14 (pre-compact handoff), §15 (commit shape).

## 1. Start a session

```
Status kita sekarang?
```

That is enough — STEP 0 reads the logbook and answers with three cards. Then pick one:

```
Lanjut #2.
```

## 2. Start a new batch

```
Batch baru: <one-line goal>. Band: <Framework|Gallery|Generator|Tooling>.
Jadikan kartu #1 dan sebutkan kartu mana yang keluar dari logbook.
Ambil claim row dulu, lalu kerjakan. Gate: tsc saja; verify di akhir batch.
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

## Notes

- One line of intent beats a paragraph of history — the history is `git log` (§15).
- Never paste the logbook into the prompt; ask for it (§13).
- If an answer starts with "sepertinya…", the agent is guessing — point it at the detail doc.
