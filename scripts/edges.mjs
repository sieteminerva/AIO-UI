#!/usr/bin/env node
/**
 * EDGES — what a package imports is what its manifest must declare.
 *
 * A tarball installed from GitHub keeps only the promises its manifest makes: `release.mjs`
 * mode B rewrites *declared* internal edges into tarball URLs, so an import with no matching
 * `dependencies`/`peerDependencies` entry survives the publish and breaks the consumer. This
 * script closes the gap — it scans each package's source, derives the real `@aio-ui/*` edges,
 * and compares them with the manifest.
 *
 * Two kinds, because the failure modes differ:
 *   - `core` and `base` are singletons (two copies = two registries, two builder ports) → peer
 *   - everything else is a plain install requirement                                → dependency
 *
 * Usage:
 *   node scripts/edges.mjs            # report: missing edges, wrong kind, declared-but-unused
 *   node scripts/edges.mjs --apply    # rewrite dependencies/peerDependencies from source
 *   node scripts/edges.mjs --check    # exit 1 when a manifest disagrees with its source
 *
 * `--check` joins `npm run check`: a new import that is not declared fails the gate.
 * Dry run by default — only `--apply` writes.
 */
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SCOPE = "@aio-ui/";
const SECTIONS = [
  "packages",
  "packages/components",
  "packages/modules",
  "packages/themes",
  "packages/kits",
  "packages/utilities",
  "packages/styles",
];
const SOURCE = /\.(ts|tsx|mts|js|mjs)$/;
const SKIP = new Set(["node_modules", "dist", "__tests__", "temp"]);
const PEER = new Set(["core", "base"]);
/** Edges that arrive through another package's install edge, never repeated per package. */
const PROVIDED = { skeleton: "base" };
/** Install-only edges: declared so a consumer cannot forget them, never imported by JS. */
const INSTALL_ONLY = { base: ["skeleton"], core: ["styles"] };
/** Manifest key order, so a rewrite never reshuffles a file for no reason. */
const ORDER = [
  "name",
  "version",
  "type",
  "files",
  "dependencies",
  "peerDependencies",
  "optionalDependencies",
  "exports",
  "scripts",
];

const args = process.argv.slice(2);
const apply = args.includes("--apply");
const check = args.includes("--check");

/** Every package directory — the same walk `closure.mjs` and `bounds.mjs` use. */
function dirs() {
  const found = [];
  for (const section of SECTIONS) {
    const base = join(ROOT, section);
    if (!existsSync(base)) continue;
    if (section === "packages" && existsSync(join(base, "package.json"))) found.push(base);
    for (const entry of readdirSync(base, { withFileTypes: true })) {
      const dir = join(base, entry.name);
      if (entry.isDirectory() && existsSync(join(dir, "package.json")) && !found.includes(dir)) found.push(dir);
    }
  }
  return found;
}

/** Source files under one package, tests excluded (a test may import anything it likes). */
function* files(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(entry.name)) continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* files(path);
    else if (SOURCE.test(entry.name)) yield path;
  }
}

/** Prose must never be mistaken for code. */
const strip = (text) => text.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

/** `@aio-ui/base/BaseAdapters/x` → `base`. */
const target = (specifier) => specifier.slice(SCOPE.length).split("/")[0] || null;

/** The `@aio-ui/*` packages one source file imports. */
function imports(file) {
  const text = strip(readFileSync(file, "utf8"));
  const names = new Set();
  const pattern = /(?:from\s*|import\s*\(\s*|import\s+)["'](@aio-ui\/[^"']+)["']/g;
  for (const [, specifier] of text.matchAll(pattern)) {
    const name = target(specifier);
    if (name) names.add(name);
  }
  return names;
}

const packages = new Map();
for (const dir of dirs()) {
  const manifest = JSON.parse(readFileSync(join(dir, "package.json"), "utf8"));
  if (!String(manifest.name ?? "").startsWith(SCOPE)) continue;
  packages.set(manifest.name.slice(SCOPE.length), { dir, manifest, name: manifest.name, version: manifest.version });
}

// ---- 1. What the source imports ------------------------------------------
const used = new Map();
for (const [short, entry] of packages) {
  const names = new Set();
  for (const file of files(entry.dir)) for (const name of imports(file)) names.add(name);
  names.delete(short); // a package never depends on itself
  for (const name of names) if (!packages.has(name)) names.delete(name);
  // `base` installs skeleton, so a package that already needs base needs nothing extra.
  for (const [name, via] of Object.entries(PROVIDED)) if (names.has(via)) names.delete(name);
  used.set(short, names);
}

// ---- 2. Declared edges ---------------------------------------------------
/** The `@aio-ui/*` names one manifest declares, in whichever field (last field wins). */
const FIELD = (short) => {
  const manifest = packages.get(short).manifest;
  const out = new Map();
  for (const field of ORDER.slice(4, 7)) {
    for (const name of Object.keys(manifest[field] ?? {})) {
      if (name.startsWith(SCOPE)) out.set(name.slice(SCOPE.length), field);
    }
  }
  return out;
};

/**
 * The field an edge belongs in. `core`/`base` are singletons, so always peer; an edge a
 * package already declared as peer stays there (peer is the stricter promise, and demoting it
 * would let npm install a second copy beside the app's). Everything else is an install
 * requirement.
 */
const classify = (name, declared) =>
  PEER.has(name) || declared.get(name) === "peerDependencies" ? "peerDependencies" : "dependencies";

/** `short → Map(name → field)` — the edges the manifest should carry. */
const desired = new Map();
for (const [short, names] of used) {
  const declared = FIELD(short);
  const edges = new Map();
  for (const name of [...names].sort()) edges.set(name, classify(name, declared));
  desired.set(short, edges);
}

// ---- 3. Diff -------------------------------------------------------------
/**
 * `missing` = imported, not declared. `wrong` = declared under the wrong field. `provided` = a
 * duplicate install edge that another declared edge already brings. `unused` = declared, never
 * imported (reported, never removed — `base → skeleton` is deliberately unused).
 */
const report = [];
for (const [short, edges] of desired) {
  const declared = FIELD(short);
  const missing = [...edges].filter(([name]) => !declared.has(name));
  const wrong = [...edges].filter(([name, field]) => declared.has(name) && declared.get(name) !== field);
  const provided = [...declared.keys()].filter((name) => PROVIDED[name] && declared.has(PROVIDED[name]));
  const unused = [...declared.keys()].filter(
    (name) => !edges.has(name) && !provided.includes(name) && !(INSTALL_ONLY[short] ?? []).includes(name),
  );
  if (missing.length || wrong.length || provided.length || unused.length)
    report.push({ short, missing, wrong, provided, unused });
}

const kind = (field) => (field === "peerDependencies" ? "peer" : field === "dependencies" ? "dependency" : field);
const plural = (count, word) => `${count} ${word}${count === 1 ? "" : "s"}`;

// ---- 4. Write ------------------------------------------------------------
/**
 * Rebuilds a manifest with the edges derived above, keys in `ORDER`.
 * Declared-but-unused edges survive (they are reported, not rewritten), and an edge that only
 * moves field keeps its range — a rewrite is never a version bump.
 */
function rewrite(short) {
  const { manifest } = packages.get(short);
  const edges = new Map([...FIELD(short)].sort((a, b) => a[0].localeCompare(b[0])));
  for (const [name, field] of desired.get(short)) edges.set(name, field);

  const bags = {
    dependencies: {},
    peerDependencies: {},
    optionalDependencies: { ...(manifest.optionalDependencies ?? {}) },
  };
  for (const field of ["dependencies", "peerDependencies"]) {
    for (const [key, range] of Object.entries(manifest[field] ?? {})) if (!key.startsWith(SCOPE)) bags[field][key] = range;
  }
  for (const [name, field] of edges) {
    if (PROVIDED[name] && edges.has(PROVIDED[name])) continue; // arrives through the provider
    const key = `${SCOPE}${name}`;
    const range =
      manifest.dependencies?.[key] ??
      manifest.peerDependencies?.[key] ??
      `^${packages.get(name)?.version ?? manifest.version}`;
    bags[field][key] = range;
  }

  const order = Object.keys(manifest);
  const isEdge = (key) => key in bags;
  const firstEdge = order.findIndex(isEdge);
  const anchor = ["files", "type", "version"].find((key) => key in manifest);
  const at = firstEdge !== -1 ? firstEdge : anchor ? order.indexOf(anchor) + 1 : 0;

  const next = {};
  for (const key of order.slice(0, at)) if (!isEdge(key)) next[key] = manifest[key];
  for (const key of ORDER) if (key in bags && Object.keys(bags[key]).length) next[key] = bags[key];
  for (const key of order.slice(at)) if (!isEdge(key)) next[key] = manifest[key];
  return next;
}

const written = [];
if (apply) {
  // Every package is rebuilt and compared, so a manifest that already matches keeps its bytes.
  for (const short of desired.keys()) {
    const { dir } = packages.get(short);
    const path = join(dir, "package.json");
    const before = readFileSync(path, "utf8");
    const text = JSON.stringify(rewrite(short), null, 2) + "\n";
    if (text !== before) {
      writeFileSync(path, text);
      written.push(relative(ROOT, path).replace(/\\/g, "/"));
    }
  }
}

// ---- 5. Report -----------------------------------------------------------
const breaks = report.filter((entry) => entry.missing.length || entry.wrong.length || entry.provided.length);
const unused = report.flatMap((entry) => entry.unused.map((name) => `@aio-ui/${entry.short} → @aio-ui/${name}`));

if (breaks.length) {
  console.log(`edges: ${plural(breaks.length, "package")} disagree with their source\n`);
  for (const entry of breaks) {
    console.log(`  @aio-ui/${entry.short}`);
    for (const [name, field] of entry.missing) console.log(`    + ${name}  (${kind(field)})`);
    for (const [name, field] of entry.wrong) console.log(`    ~ ${name}  → ${field}`);
    for (const name of entry.provided) console.log(`    - ${name}  (already installed by ${PROVIDED[name]})`);
  }
  console.log("");
}
if (unused.length) {
  console.log(`edges: declared but never imported (${unused.length}) — review, not rewritten`);
  for (const line of unused) console.log(`  - ${line}`);
  console.log("");
}
if (written.length) {
  console.log(`edges: rewrote ${plural(written.length, "manifest")}`);
  for (const path of written) console.log(`  = ${path}`);
  console.log("");
}

const total = [...desired.values()].reduce((sum, edges) => sum + edges.size, 0);
console.log(
  breaks.length && check
    ? `✖ ${plural(breaks.length, "manifest")} out of date — run node scripts/edges.mjs --apply`
    : `✓ edges clean — ${plural(packages.size, "package")}, ${plural(total, "internal edge")}${unused.length ? `, ${unused.length} unused` : ""}`,
);

if (check && breaks.length) process.exit(1);
