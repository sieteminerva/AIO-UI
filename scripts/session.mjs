#!/usr/bin/env node
/**
 * AIO UI — SESSION RITUAL RUNNER
 *
 * The rituals in `.guidance/AGENT_RULES.md` (§10 checkpoint, §11 claims, §13 logbook, §14
 * pre-compact handoff) used to be prose an agent had to read, remember, and then re-derive the
 * state of the repo to execute. This script is that ritual **frozen** into an order of operations:
 * it gathers the facts the ritual needs, asks only for the judgements only a human/agent can make,
 * and prints the exact block to paste.
 *
 * Three doors, plus help:
 *
 *   node scripts/session.mjs start     # STEP 0 — what to read, what to report, what not to touch
 *   node scripts/session.mjs cp        # CP-3 — one checkpoint block, three pointers
 *   node scripts/session.mjs end       # §14 — the pre-compact handoff, all nine steps
 *   node scripts/session.mjs --help
 *
 * Interactive by default: it prompts for the free-text fields and falls back to the flags when
 * stdin is not a TTY, so the same command works from a terminal and from an agent with `--args`.
 *
 * Read-only by design. It never edits a file: writing the handoff is the agent's last decision,
 * and a script that silently rewrote the logbook would be the one thing nobody could review.
 */
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createInterface } from "node:readline/promises";

const ROOT = process.cwd();
const STATUS = join(".guidance", "project", "STATUS.md");
const BOARD = join(".guidance", "project", "AGENTS.md");

const argv = process.argv.slice(2);
const command = argv.find((arg) => !arg.startsWith("--")) ?? "help";
const flag = (name) => argv.includes(name);
const valueOf = (name) => {
  const index = argv.indexOf(name);
  return index === -1 ? undefined : argv[index + 1];
};

const USAGE = `
AIO session ritual runner — read-only, no flags required.

  node scripts/session.mjs start     STEP 0: tree, git log, the 3 logbook cards, live claims,
                                     and exactly what to report and what not to read yet
  node scripts/session.mjs cp        CP-3: one checkpoint block, three pointer lines
  node scripts/session.mjs end       §14: the pre-compact handoff, all nine steps, plus the
                                     report, the memory skeleton and the logbook skeleton

Fields are prompted when stdin is a TTY; pass them as flags otherwise:

  --band --changed --proved --next --blocks --n         (cp)
  --gate --doc --task --proved --unproved --next        (end)
  --no-prompt        never prompt, print the skeleton with placeholders
  --ignore-dirty     do not treat uncommitted work as a blocker
  --committed        the batch is committed even though the tree is dirty
`;

if (flag("--help") || command === "help") {
  console.log(USAGE);
  process.exit(0);
}

/** Runs a command in the repo and returns trimmed stdout, or `""` when it fails. */
function sh(line) {
  try {
    return execSync(line, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return "";
  }
}

/** Reads a repo-relative file, or `""` when it does not exist. */
function text(relative) {
  try {
    return readFileSync(join(ROOT, relative), "utf8");
  } catch {
    return "";
  }
}

const useColour = process.stdout.isTTY && !flag("--no-colour");
const dim = (s) => (useColour ? `\x1b[2m${s}\x1b[0m` : s);
const bold = (s) => (useColour ? `\x1b[1m${s}\x1b[0m` : s);

const lines = (value, count) => value.split("\n").filter(Boolean).slice(0, count);

/** Everything the three doors need, gathered once. */
function facts() {
  const status = sh("git status --short");
  // Porcelain prefixes (`??`, ` M`, `A `) are for git, not for a report — keep the path.
  const changed = lines(status, 40).map((line) => line.replace(/^(\?\?|[ MADRCU?!]{1,2})\s+/, ""));
  const staged = changed.filter((line) => !line.startsWith("??")).length;
  const untracked = changed.filter((line) => line.startsWith("??")).length;

  return {
    branch: sh("git rev-parse --abbrev-ref HEAD") || "?",
    head: (() => {
      const sha = sh("git rev-parse --short HEAD");
      return sha ? `${sha} ${sh("git log -1 --pretty=%s")}` : "(no commits)";
    })(),
    recent: lines(sh("git log --oneline -8"), 8),
    dirty: changed.length > 0,
    changed,
    staged,
    untracked,
    cards: lines(text(STATUS), 200)
      .filter((line) => /^###\s/.test(line))
      // The heading carries its own ordinal (`### 1. Theme console`) — drop it, because the
      // runner numbers the list itself and `1. 1. …` is exactly the kind of noise a ritual
      // runner exists to remove.
      .map((line) => line.replace(/^###\s*/, "").replace(/^\d+[.)]\s*/, "").trim()),
    claims: claimRows(),
    stamp: (() => {
      const now = new Date();
      const pad = (n) => String(n).padStart(2, "0");
      return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ` +
        `${pad(now.getHours())}:${pad(now.getMinutes())}`;
    })(),
  };
}

/** Rows of the claim board's "Live claims" table — an empty list means no live writer. */
function claimRows() {
  const board = text(BOARD);
  const start = board.indexOf("## Live claims");
  if (start === -1) return [];
  const end = board.indexOf("## Row shape", start);
  return board
    .slice(start, end === -1 ? undefined : end)
    .split("\n")
    .filter((line) => /^\|\s*`/.test(line))
    .map((line) => line.trim());
}

/** Free-text answer: the flag when given, else a prompt, else the fallback. */
async function ask(rl, question, flagName, fallback = "") {
  const fromFlag = valueOf(flagName);
  if (fromFlag !== undefined) return fromFlag;
  if (!rl) return fallback;
  const answer = (await rl.question(`  ${question}${fallback ? dim(` [${fallback}]`) : ""} `)).trim();
  return answer || fallback;
}

/** Opens a readline only when the session is interactive. */
function openPrompt() {
  if (!process.stdin.isTTY || flag("--no-prompt")) return null;
  return createInterface({ input: process.stdin, output: process.stdout });
}

// ─────────────────────────────────────────────────────────────────────────────
// start — STEP 0
// ─────────────────────────────────────────────────────────────────────────────
function start(f) {
  const gate = f.staged + f.untracked > 0
    ? "code may have changed — `npm run check` (~12 s) before the next commit"
    : "tree clean; a gate was probably already run — do not repeat it";

  console.log(bold(`\nAIO session start — ${f.stamp}`));
  console.log(dim(`  branch ${f.branch} · HEAD ${f.head}\n`));

  console.log(bold("TREE    "), f.dirty ? `${f.changed.length} change(s)` : "clean");
  for (const line of f.changed) console.log(`  ${line}`);

  console.log(bold("\nRECENT  "), `${f.recent.length} commit(s)`, dim("(read: these are the log)"));
  for (const line of f.recent) console.log(`  ${line}`);

  console.log(bold("\nLOGBOOK "), `${STATUS} — ${f.cards.length} card(s)`);
  f.cards.forEach((card, index) => console.log(`  ${index + 1}. ${card}`));

  console.log(bold("\nCLAIMS  "), f.claims.length ? `${f.claims.length} live writer(s)` : "no live writer");
  for (const row of f.claims) console.log(`  ${row}`);

  console.log(bold("\nGATE    "), gate);

  console.log(`\n${bold("REPORT THIS, then stop and ask which card:")}`);
  f.cards.forEach((card, index) => console.log(`  ${index + 1}. ${card}`));
  console.log(dim("  Say the detail is NOT read yet, and that the git commands are unavailable if they are."));

  console.log(`\n${bold("DO NOT read yet:")} the cards' detail docs, plan*.md, other bands, .archives/`);
  console.log(
    dim("  Open a TASKS.md / TASK-*.md / band AGENTS.md only after the user picks a card.\n" +
        "  Take a claim row (this board) before the first edit.\n"),
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// cp — the checkpoint
// ─────────────────────────────────────────────────────────────────────────────
async function checkpoint(f, rl) {
  console.log(bold(`\nCP-3 — ${f.stamp}`));
  console.log(dim("  Three pointer lines. No prose — prose belongs in a file.\n"));

  const band = await ask(rl, "Band (Framework|Gallery|Generator|Tooling):", "--band", "Framework");
  const changedIn = await ask(rl, "CHANGED → <path>:<symbol> (<test|command>):", "--changed", f.changed[0] ?? "");
  const proved = await ask(rl, "PROVED  → <command> → <measured>:", "--proved", "");
  const next = await ask(rl, "NEXT    → <one action>:", "--next", "");
  const blocks = await ask(rl, "blocks (none|item):", "--blocks", "none");

  const n = Number(await ask(rl, "CP number:", "--n", String(Number(sh("git rev-list --count HEAD") || 0))));

  const block = [
    `CP ${Number.isFinite(n) ? n : "?"} ${f.stamp} ${band}`,
    `CHANGED → ${changedIn || "<path>:<symbol> (<test|command>)"}`,
    `PROVED  → ${proved || "<command> → <measured result>"}`,
    `NEXT    → ${next || "<one action>"} | blocks: ${blocks}`,
  ].join("\n");

  console.log(`\n${bold("paste into /memories/session/<task>.md (keep the last 3 only):")}\n`);
  console.log(block);
  console.log("");
}

// ─────────────────────────────────────────────────────────────────────────────
// end — the pre-compact handoff (§14, nine steps)
// ─────────────────────────────────────────────────────────────────────────────
async function end(f, rl) {
  console.log(bold(`\nPre-compact handoff — ${f.stamp}`));
  console.log(dim(`  HEAD ${f.head}\n`));

  const dirty = f.dirty && !flag("--ignore-dirty");
  const step = (n, title, state) => console.log(`${String(n).padStart(2)}. ${title} — ${state}`);

  step(1, "Stop clean", dirty ? `${f.changed.length} uncommitted change(s)` : "nothing in flight");
  if (dirty) for (const line of f.changed) console.log(`      ${line}`);

  const gate = await ask(rl, "2. Gate result (or `md-only`):", "--gate", "");
  step(2, "Gate", gate || "NOT RECORDED");

  step(3, "Commit", dirty && !flag("--committed") ? "UNCOMMITTED — an uncommitted batch does not survive" : "committed");

  const doc = await ask(rl, "4. Detail doc path (TASKS.md / TASK-*.md):", "--doc", "");
  step(4, "Detail doc", doc ? `${doc} — needs Status: and ## Next` : "not named");

  const task = await ask(rl, "5. Session memory file (/memories/session/<task>.md):", "--task", "");
  step(5, "Memory", task ? `${task} — task path + 2 lines + last 3 CPs` : "no memory file");

  step(6, "Logbook", `${f.cards.length} card(s) in ${STATUS} — rewrite, newest on top`);
  step(7, "Band file", "## Active row state; a ## Next line if the next step changed");
  step(8, "Report", "four things, in the chat language");
  step(9, "Claim row", f.claims.length ? "LIVE — drop it" : "already empty");

  const proved = await ask(rl, "PROVED → <command> → <number>:", "--proved", gate);
  const unproved = await ask(rl, "NOT PROVED:", "--unproved", "nothing outstanding");
  const next = await ask(rl, "NEXT → <single action>:", "--next", "");

  console.log(`\n${bold("── report to the user ──")}`);
  console.log(`Sampai di sini.`);
  console.log(`\nCHANGED → ${f.changed.length ? f.changed.slice(0, 6).join(", ") : "nothing pending"}`);
  console.log(`PROVED  → ${proved || "<command> → <number>"}`);
  console.log(`NOT PROVED → ${unproved}`);
  console.log(`NEXT    → ${next || "<one action>"}`);
  console.log(`\nSilakan compact / buka chat baru.`);

  console.log(`\n${bold("── memory skeleton (overwrite, do not append) ──")}`);
  console.log(`Task: ${doc || "<detail doc>"}`);
  console.log(`State: ${f.head}`);
  console.log(`Next: ${next || "<one action>"}`);

  console.log(`\n${bold("── logbook skeleton ──")}`);
  console.log(`### 1. <newest — one line from the last commit>`);
  console.log(`**Open:** ${next || "<what is left>"}`);
  console.log("→ " + (doc || "<detail doc>"));
  console.log(dim("  Cards 2 and 3: the previous #1 and #2, demoted. The old #3 leaves the logbook."));

  console.log(`\n${bold("── commit shape (§15) ──")}`);
  console.log("<type>(<scope>): <imperative summary, <= 72 chars>\n\n- <finding> → <fix> → <evidence>\n");
  if (dirty) console.log(dim("  Uncommitted work is blocking this handoff — commit or revert first.\n"));
}

const f = facts();
const rl = openPrompt();
try {
  if (command === "start") start(f);
  else if (command === "cp" || command === "checkpoint") await checkpoint(f, rl);
  else if (command === "end" || command === "pre-compact") await end(f, rl);
  else {
    console.error(`Unknown door "${command}". Try: start · cp · end · --help`);
    process.exitCode = 1;
  }
} finally {
  rl?.close();
}
