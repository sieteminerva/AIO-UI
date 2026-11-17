#!/usr/bin/env node
/**
 * CLOSURE — the internal dependency graph, computed once.
 *
 * Every `@aio-ui/*` edge in a package manifest is a promise the consumer has to keep
 * by hand today: install A, discover it needs B, then that B needs C. This script
 * answers the only question that removes the guessing — *what does one package need,
 * in load order, and how big is that set* — and every other script reads its answer
 * instead of re-walking `dependencies` by hand.
 *
 * Edges are read from `dependencies`, `peerDependencies` and `optionalDependencies`,
 * because all three are install requirements from the consumer's side.
 *
 * Usage:
 *   node scripts/closure.mjs                  # graph summary + the 5 heaviest closures
 *   node scripts/closure.mjs --json           # the whole document on stdout
 *   node scripts/closure.mjs --out <file>     # write the document (for release.mjs)
 *   node scripts/closure.mjs --check          # exit 1 on an unknown @aio-ui/* name
 *
 * Cycles are reported, not fatal: `@aio-ui/form` ↔ `@aio-ui/message` peer-depend on each
 * other today, and a bundle can represent that (the tarball carries both, so node's
 * upward lookup finds the one that is already installed). `release.mjs --bundle`
 * breaks the recursion at the repeated name instead of nesting forever.
 *
 * Read-only: no manifest is ever written. `release.mjs --bundle` is the writer.
 */
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const SCOPE = "@aio-ui/";
const SECTIONS = [
  "packages/components",
  "packages/modules",
  "packages/themes",
  "packages/kits",
  "packages/utilities",
  "packages/styles",
];
const EDGE_FIELDS = ["dependencies", "peerDependencies", "optionalDependencies"];

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const valueOf = (name) => {
  const index = args.indexOf(name);
  return index === -1 ? undefined : args[index + 1];
};

const check = flag("--check");
const asJson = flag("--json");
const outFile = valueOf("--out");

/** Every publishable package directory — the same walk `release.mjs` and `bounds.mjs` use. */
function packageDirs() {
  const dirs = [];
  const add = (dir) => {
    try {
      if (existsSync(join(dir, "package.json"))) dirs.push(dir);
    } catch {
      // Unreadable directory.
    }
  };

  add(join(ROOT, "packages"));
  for (const section of ["packages", ...SECTIONS]) {
    const base = join(ROOT, section);
    try {
      for (const entry of readdirSync(base, { withFileTypes: true })) {
        if (entry.isDirectory()) add(join(base, entry.name));
      }
    } catch {
      // Section does not exist.
    }
  }
  return dirs;
}

const byName = new Map();
for (const dir of packageDirs()) {
  const manifest = JSON.parse(readFileSync(join(dir, "package.json"), "utf8"));
  const name = String(manifest.name ?? "");
  if (!name.startsWith(SCOPE)) continue;
  byName.set(name, { name, dir, manifest });
}

/** `@aio-ui/*` names this package declares in any install-requirement field. */
function edgesOf(manifest) {
  const names = new Set();
  for (const field of EDGE_FIELDS) {
    for (const key of Object.keys(manifest[field] ?? {})) {
      if (key.startsWith(SCOPE)) names.add(key);
    }
  }
  return [...names].sort();
}

/** Bytes of the files a consumer actually receives: `dist/` when built, `src/` otherwise. */
function builtSize(dir) {
  const base = existsSync(join(dir, "dist")) ? join(dir, "dist") : join(dir, "src");
  if (!existsSync(base)) return 0;
  let total = 0;
  const walk = (current) => {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const path = join(current, entry.name);
      if (entry.isDirectory()) walk(path);
      else total += statSync(path).size;
    }
  };
  walk(base);
  return total;
}

// ---- 1. Validate the edges before sorting anything -------------------------
const problems = [];
for (const [name, entry] of byName) {
  for (const dep of edgesOf(entry.manifest)) {
    if (!byName.has(dep)) problems.push(`${name} → ${dep}: not a workspace package`);
  }
}

// ---- 2. Topological order; a back-edge is a reported cycle, not a crash ---
const order = [];
const state = new Map(); // name → "visiting" | "done"
const cycles = [];
const reported = new Set();

function visit(name, trail) {
  const current = state.get(name);
  if (current === "done") return;
  if (current === "visiting") {
    const at = trail.indexOf(name);
    const cycle = [...trail.slice(at), name];
    const key = [...cycle].sort().join("|");
    if (!reported.has(key)) {
      reported.add(key);
      cycles.push(cycle);
    }
    return;
  }
  state.set(name, "visiting");
  for (const dep of edgesOf(byName.get(name)?.manifest ?? {})) {
    if (byName.has(dep)) visit(dep, [...trail, name]);
  }
  state.set(name, "done");
  order.push(name);
}

for (const name of [...byName.keys()].sort()) visit(name, []);

// ---- 3. Per-package closure, sizes, reverse map ---------------------------
const document = { version: 1, generatedAt: new Date().toISOString(), packages: {}, reverse: {} };

for (const name of [...byName.keys()].sort()) {
  const direct = edgesOf(byName.get(name).manifest);
  const seen = new Set();
  const closure = [];
  // Depth-first in manifest order, children before parents — the order a loader wants.
  const walk = (dep) => {
    if (seen.has(dep)) return;
    seen.add(dep);
    for (const child of edgesOf(byName.get(dep).manifest)) walk(child);
    closure.push(dep);
  };
  for (const dep of direct) walk(dep);

  const files = new Set();
  let closedSize = 0;
  for (const dep of closure) {
    const sized = builtSize(byName.get(dep).dir);
    closedSize += sized;
    files.add(dep);
  }
  document.packages[name] = {
    dir: relative(ROOT, byName.get(name).dir).replace(/\\/g, "/"),
    version: byName.get(name).manifest.version,
    direct,
    closure,
    closedSize: closedSize + builtSize(byName.get(name).dir),
    selfSize: builtSize(byName.get(name).dir),
  };

  for (const dep of direct) {
    (document.reverse[dep] ??= []).push(name);
  }
}

document.order = [...order].filter((name) => byName.has(name));
document.cycles = cycles;

if (outFile) {
  writeFileSync(outFile, `${JSON.stringify(document, null, 2)}\n`, "utf8");
}

if (check && problems.length) {
  problems.slice(0, 20).forEach((problem) => console.error(`  - ${problem}`));
  console.error(`[closure] ${problems.length} unknown @aio-ui/* name(s)`);
  process.exit(1);
}

if (asJson) {
  process.stdout.write(`${JSON.stringify(document, null, 2)}\n`);
  process.exit(problems.length ? 1 : 0);
}

const names = [...byName.keys()];
console.log(
  `[closure] ${names.length} package(s), ${Object.values(document.reverse).flat().length} internal edge(s), ${cycles.length} cycle(s)`,
);
if (outFile) console.log(`[closure] wrote ${relative(ROOT, outFile)}`);
for (const cycle of cycles) console.log(`  cycle   ${cycle.join(" → ")}`);

const heaviest = names
  .map((name) => [name, document.packages[name]])
  .sort((a, b) => b[1].closedSize - a[1].closedSize)
  .slice(0, 5);
for (const [name, entry] of heaviest) {
  const mb = (entry.closedSize / 1024 / 1024).toFixed(2);
  console.log(`  ${name.padEnd(28)} ${String(entry.closure.length).padStart(2)} dep(s)  ${mb} MB  (self ${(entry.selfSize / 1024).toFixed(0)} kB)`);
}

const leaves = names.filter((name) => document.packages[name].direct.length === 0);
console.log(`[closure] ${leaves.length} leaf package(s): ${leaves.join(", ")}`);

if (problems.length) {
  problems.slice(0, 20).forEach((problem) => console.error(`  - ${problem}`));
  console.error(`[closure] ${problems.length} unknown @aio-ui/* name(s)`);
  process.exit(1);
}
