# Agent Rules

Working agreement for every agent in this repository. Optimise for **maximal result at minimal token cost** — execute in parallel batches and keep context small.

## 1. Ask before building

A design question costs ~200 tokens; a wrong implementation costs a rebuild.

- When a request has more than one reasonable shape, reply with a short table or 5-line sketch first and wait for go-ahead.
- Never start a refactor while a design decision is still open.

## 2. Batch reads & edits (Zero sequential loops)

Every single tool turn re-sends the entire prompt history. Minimize round-trips:

- **Use semantic_search or symbol search first** to locate definitions; never crawl directories with `list_dir`
- **Parallel reads only:** Batch all initial `read_file` and `grep_search` calls into **one single parallel turn**. Never fetch files one by one.
- **Read wide once:** Read a file once with a wide line range instead of multiple narrow reads.
- **Single edit pass:** Plan all changes for a file and apply them in one `multi_replace_string_in_file` call. Never re-read a file after editing to confirm.
- **Bounded search:** Always pipe searches (`grep -n … | head -n 30`). Never dump entire files.

## 3. Keep tool & terminal output tiny

- **CLI over browser tools:** Run Playwright via terminal (`npx playwright test <file> --reporter=line`) instead of interactive browser tools, which inject ~10 KB DOM snapshots per turn. Use browser tools only for explicit visual/geometry claims.
- **Minimal stdout:** Use `git --no-pager`, `| head`, or `| tail`. Never read lockfiles (`*-lock.*`), `dist/`, or generated artifacts.

## 4. Verify once per batch

- Run the narrowest single test file while iterating; run `npm run verify` **once** at the end of a batch.
- Never re-run a gate that already passed without code changes.

## 5. Write only what was asked

- No new docs unless requested; extend existing docs in 3–5 lines max.
- Changelog lives in the commit message, not in a file: **finding → fix → evidence**.
- Commit messages: 1 summary line + 3–6 bullets.
- **Chat replies:** No code blocks in chat after making edits; summarize what changed in 1–2 sentences.

## 6. Architecture & proof standards

- **Modules own capabilities; components only render.** If wiring feels wrong, fix the seam, not the abstraction.
- **Stylesheets:** Never `import "./X.css"` in a builder — load via `@aio-ui/core/Stylesheets` (see `docs/framework/COMPONENT-CONVENTIONS.md`).
- **Framework-agnostic components:** Publish via `config.emit?.(…)`; never import the app.
- **Objective proof:** Prove changes at the highest affected level (unit test, CLI test, or build gate). For CSS geometry claims, measure `getBoundingClientRect` / `getComputedStyle` and report exact numbers.

## 7. Session lifecycle & context budget

Long transcripts and VS Code auto-compaction trigger massive cache-miss penalties. The budget is
measured against the **model window** (200k here), not a fixed number:

- **Single-file startup:** read **only** the logbook `.guidance/project/STATUS.md` (§13). Do **not**
  crawl `.guidance/mandatory/` or `plan*.md` unless the picked card needs them.
- **State plan briefly:** after the single read turn, state the plan in 2–3 lines and execute.
- **~60k = wrap the batch** — finish the edit in flight, run the gate, commit.
- **~80k = run the handoff (§14)** and tell the user to compact.** The agent signals; the user
  presses the button — no agent can trigger compaction itself.
- **~100k = stop work.** Only §14 may run: a half-written batch is worse than an untouched one.
- **During & finish:** preserve unrelated user edits; record architectural decisions in
  `.guidance/project/DECISIONS.md`; report honestly what was proven and what remains unproven.

## 8. Language

- Conversation matches the user's language (Indonesian or English).
- All repo artifacts stay **English** (source, identifiers, comments, JSDoc, docs, copy) unless explicitly requested otherwise.

## 9. Work tracking: plan → queue → status

One item lives in **exactly one** file. Never duplicate, never append history.

| File                             | Holds                                                   | Shape                                                                                        |
| -------------------------------- | ------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `.guidance/plan*.md`             | **why** — objective, decisions, stages, long-term order | `plan.md` index (§0/§4) + `plan-{framework,gallery,generator}.md`                            |
| `.guidance/project/<project>.md` | **what now + what next**, one file per project          | `## Active` (max 3) / `## Next` / `## Landed` — `framework.md`, `gallery.md`, `generator.md` |
| `.guidance/project/STATUS.md`    | **logbook** — top 3 cards + where the rest lives        | ≤ 50 lines, rewritten every session                                                          |

- **One project, one file.** A session reads its own project file plus its band's `AGENTS.md`;
  nothing else. Shared files are `AGENTS.md` (claim board) and `STATUS.md` (index).
- **Promote:** plan item → a `## Next` line when it is the next thing; `## Next` line → an
  `## Active` row when work starts.
- **Done = delete the line.** Evidence goes to the commit message (`finding → fix → evidence`) or
  `DECISIONS.md`; there is no "Completed" section.
- **Blocked:** stays in `## Active` only while the blocker fits in one line, then returns to
  `## Next`.
- **Edit one file per state change.** Touch the index only when the project list changes.

## 10. Checkpoint protocol (CP-3)

Context loss (compaction, new chat, second agent) is the default failure mode. Every action
category ends with **exactly three lines**, each line a **pointer** — never prose:

```
CP <n> <YYYY-MM-DD HH:mm> <band>
CHANGED → <path>:<line|symbol> (<test or command>)
PROVED  → <command> → <measured result>
NEXT    → <one action> | blocks: <none|item>
```

| Trigger (category done) | Sink                                                                     |
| ----------------------- | ------------------------------------------------------------------------ |
| probe / read batch      | `/memories/session/<task>.md` — overwrite the CP block                   |
| edit batch              | same file + the detail doc's `Status:` line                              |
| `verify` / test gate    | git commit of the batch (§15) + the `Gate` cell in the band file          |
| handoff / pre-compact   | run §14 in full — the CP alone is not a handoff                          |

- **Never add a fourth line.** If it matters and does not fit, it belongs in a file — write
  the pointer instead.
- **Keep only the last 3 CPs** in the memory file (overwrite, do not append); older history
  lives in commits.
- **Commits are the only lossless trail.** A batch that passed a gate must be committed with
  `finding → fix → evidence` bullets; nothing else survives compaction intact.
- **Recovery (new chat, ≤ 3 turns):** `git log --oneline -8` + `git status --short` → read the
  logbook `.guidance/project/STATUS.md` → report its three cards and ask which one to continue
  (§13). Detail docs open only after that answer.
- **Prefix:** the same `STEP 0` block sits at the top of **all 6** band `AGENTS.md` files
  (root router + 5 bands). Edit all six or none — a band opened standalone must still carry it.
  The block also reads the claim board (§11), so a session cannot start on an owned scope.

## 11. One owner per session

A second writer is the largest source of lost work: the tree changes under you, docs go stale,
and a commit drags in someone else's half-finished batch.

- **One session owns the task until it is done.** Refactors finish in the owning session; the
  next session starts from `git log`, never from a half-finished tree.
- **Override is allowed, blind override is not.** Before touching files another agent edited,
  prove it is idle: `git status --short` twice a few minutes apart, or compare `mtime`. Still
  changing → stop and ask the user. Once proven idle, override freely — no merge archaeology.
- **Claim the tree** at the first edit: one `## Active` row in `.guidance/project/<band>.md` naming
  the task, **plus a row on the claim board** `.guidance/project/AGENTS.md`. Clear both at handoff.
- **The claim board is the only shared lock.** One row per live writer: agent identity, band,
  task, write scope (paths/globs), start date, checkpoint file, state (`active|blocked|handoff`).
  A `STATUS.md` line says _what_ is running; the board says _who owns which paths_ — needed
  because two sessions can work the same task name in different bands.
- **Overlapping scope is a stop sign.** If a live row's write scope intersects yours, do not
  edit: quote both rows to the user and ask. Overlap is allowed only when the owner's row says
  `handoff` **and** two `git status --short` checks prove the tree is idle.
- **Keep your row current.** Rewrite it at every checkpoint (state, plus the task line when the
  detail changes). A row untouched for more than a day with no matching `git status` movement is
  dead: prove idleness twice, then take it over by rewriting the row — never leave two rows for
  one scope.
- **Commit per gate, before compaction.** Compaction is lossy by design; an uncommitted batch
  cannot be recovered from memory files alone.
- **Budget:** ~60k tokens / ~15 turns per batch (§7). At ~80k: finish the edit, run the gate,
  write the CP, commit, then run the handoff (§14) and ask the user to compact. **The agent
  signals; the user presses the button.**

### Reply footer (every reply)

End every reply with one line so both sides can track the budget without guessing:

```
ctx ~<n>k / 200k · turn <n> · batch: <name> · CP <n> · gate: <green|red|not run>
```

- `<n>k` is an **estimate** — no agent can read its own token counter. State it as `~`, and say
  so once if the user asks for precision.
- **Ground truth is the user's log line**, not the estimate:
  `tokens: model=… prompt=<n> completion=<n> cache: hit=<n> miss=<n> rate=<n>%`. It lives in the
  VS Code output channel, not on disk — the agent cannot read it, so at a threshold
  (60k/80k/100k) the agent **asks the user for the current `prompt=` value** instead of guessing.
- An estimate may be >15% off in either direction. Never report it without `~`, and never let a
  threshold decision rest on it alone — confirm before signalling compaction.
- Turns to the next threshold: 60k = wrap the batch, 80k = commit + signal compaction, 100k = stop.
- Never pad the footer with prose; one line, same position, every time.

## 12. Memory contract (state + pointers, never a library)

`/memories/` is a **cache of state and pointers**. A fact that needs a paragraph belongs in the
repo, where it is versioned, diffable and readable by the next agent without a memory dump.

| Scope                         | Holds                                                             | Cap      |
| ----------------------------- | ----------------------------------------------------------------- | -------- |
| `/memories/preferences.md`    | user preferences that survive every project (naming, tone, gates) | 15 lines |
| `/memories/repo/<band>.md`    | the **outline**: where things live, commands, non-negotiables     | 25 lines |
| `/memories/session/<task>.md` | the **last 3 CPs** (§10) + one `Next:` line + the task-doc path   | 15 lines |

**Nothing else goes in memory.** No `Landed`, `Shape`, `Traps`, `Done/Remaining` sections, no
history, no prose. Those are repo artifacts:

| What                                    | Where                                                   |
| --------------------------------------- | ------------------------------------------------------- |
| why / objective / stages                | `.guidance/plan.md` + `.guidance/plan-<project>.md`     |
| what now + what next (per project)      | `.guidance/project/<project>.md`                        |
| which project file to read              | `.guidance/project/STATUS.md` (logbook, ≤ 50 lines)     |
| the live task's detail, traps, gotchas  | `docs/<band>/TASK-<name>.md`                            |
| durable engineering + environment rules | `docs/framework/COMPONENT-CONVENTIONS.md` (§12/§13/§15) |
| architecture decisions                  | `.guidance/project/DECISIONS.md`                        |

- **One narrative home per fact.** If a `.guidance/` or `docs/` file already says it, memory keeps
  the pointer, not a copy.
- **Memory never holds a rule that the repo holds.** `/memories/working-agreement.md` is a pointer to
  this file, not a second copy of it.
- **Prune at handoff.** A batch that is committed leaves at most three CPs behind; a memory file
  older than the last three batches is dead — delete it. Commits are the only lossless trail.
- **Recovery reads four things, in this order:** `git log --oneline -8`, `git status --short`, the
  logbook `STATUS.md`, then the session memory file. Detail docs only after the user picks a card
  (§13).

## 13. Two document types — outline vs detail

A session pays for every file it opens, so each document is one of two things: **outline** (read at
orientation, tiny) or **detail** (opened only for the thing being worked on).

### Outline — read at orientation

| File                          | Holds                                               | Cap      |
| ----------------------------- | --------------------------------------------------- | -------- |
| `AGENTS.md` ×6 + `README.md`  | rules, scope, where to look — **never a task list** | as is    |
| `.guidance/project/STATUS.md` | **logbook**: three cards, each one line + a link    | 50 lines |
| `.guidance/project/<band>.md` | `## Active` (max 3) / `## Next` / `## Landed` (3)   | 40 lines |
| `/memories/`                  | preferences, band outline, last 3 CPs               | §12      |

### Detail — opened only for the current task

| File                                      | Holds                                             |
| ----------------------------------------- | ------------------------------------------------- |
| `<folder>/TASKS.md`                       | one folder's live work: what, next, its own traps |
| `docs/<band>/TASK-<name>.md`              | a task that spans more than one package           |
| `.guidance/plan-<project>.md`             | why / stages / long-term order                    |
| `docs/framework/COMPONENT-CONVENTIONS.md` | engineering + environment rules                   |
| `.guidance/project/DECISIONS.md`          | architecture decisions, append-only               |

- **Placement:** work inside one folder → `TASKS.md` in that folder; more than one package →
  `docs/<band>/TASK-<name>.md`. Never both, never a third place.
- **`AGENTS.md` carries no task list.** A roadmap, queue or "next step" belongs in the logbook or
  the band file; a band file points, it does not plan.
- **Done = delete the detail doc** (or empty it and delete it in the same commit). The commit
  message is the record; a `TASKS.md` left behind for finished work is the new stale doc.
- **A card without a link is a bug**, and a link that does not resolve is worse.
- **`TASKS.md` inside a package is safe:** every `package.json` declares
  `files: ["dist", "*.ts", "*.css"]` and `npm pack` follows it, so the doc never ships.

### Logbook ritual — the first answer of every session

1. Read `.guidance/project/STATUS.md` + `git log --oneline -8`. Nothing else.
2. Answer with the three cards in order — one line each plus its link — then state plainly that
   the detail is **not** read yet and ask which card to continue.
3. After the user picks: open that card's detail doc and the band's `AGENTS.md`, take the claim
   row, then work.
4. **Reorder on pick:** the chosen card becomes #1, the others keep their order, and the tail
   leaves the logbook. The file it pointed at stays; only the card goes.
5. At handoff: update the detail doc's `Status:` line, write the 3 CPs, rewrite the three cards.

## 14. Pre-compact handoff

Trigger: the footer crosses ~80k, or the user says "compact" / "pre-compact" / "new chat". From
that moment **no new editing starts** — this list runs in order and nothing else.

1. **Stop clean.** Finish or revert the edit in flight; never leave a half-written file.
2. **Gate.** If code changed, run the narrowest gate that proves it (`npm run verify` for a whole
   batch, one test file while iterating). Markdown-only → say `md-only`, do not run the build.
3. **Commit** every batch with the shape in §15. An uncommitted batch does not survive compaction
   and cannot be rebuilt from memory.
4. **Detail doc** — the live `TASKS.md` / `TASK-*.md` gets its `Status:` line and a `## Next` list
   precise enough to start from cold (file + symbol, not "continue the work").
5. **Memory** — the session file becomes exactly: task-doc path, two lines of state, the last
   three CPs. Nothing else (§12).
6. **Logbook** — rewrite the three cards: newest on top, one summary line each, a link that
   resolves in the commit you just made, one `Open:` line (`§13`).
7. **Band file** — `## Active` row state, and a `## Next` line if the next step changed.
8. **Report to the user in the chat language, four things and no more:** what changed (paths),
   what was proved (command → number), what was **not** proved, and the single next action. End
   with "silakan compact / buka chat baru".
9. **Drop the claim row.** A stale row blocks the next session.

Never at handoff: a CP without its commit; prose in memory; a card pointing at a file the commit
removed; a fourth CP line; "done" with an unrun gate.

## 15. Commit & git log protocol

`git log` is the only artifact that survives compaction, so a commit has to be readable on its own
by an agent with no context.

```
<type>(<scope>): <imperative summary, ≤ 72 chars, no trailing period>

- <finding> → <fix> → <evidence, one bullet per change, max 6>
```

- **Types:** `feat` new capability · `fix` defect · `style` CSS/formatting only · `refactor` shape
  without behaviour change · `docs` · `test` · `perf` · `chore` deps, config, generated maps.
- **Scopes:** a package (`menu`, `core`, `fabmenu`), a band (`demo`, `generator`, `guidance`), or
  `repo` when it crosses bands. Comma list only when the commit really is one change.
- **Evidence in every bullet:** the command and its number (`npm run verify → 690 pass / 1 skip`),
  or `path:symbol` plus the measured value (`Menu.css → panel 205×86 at 1280px`).
- **Name the symptom, not the patch:** "hover closed at the seam → bridge `::before`".
- **One commit per gate, per logical batch.** Never one mixed commit; never `wip`, `update`,
  `fixes`, or a message that only repeats the diff.
- **Separate the doc batch** when it is bookkeeping: `docs(status): record batch 38`.
- **A logbook card must resolve in the commit that writes it** — `git show --stat` is the check.
- **Never rewrite published history**, never force-move a tag jsDelivr already served (see
  `docs/live-cdn-repo.md`). `main` is the only branch that carries work; `cdn` is generated.
- **The first line is the logbook's raw material:** if the summary line alone cannot tell the next
  agent what changed, the logbook card will be blind too.
