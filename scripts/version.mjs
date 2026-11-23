#!/usr/bin/env node
/**
 * RAJUTAN — VERSION WRITER (one tag, per-package versions)
 *
 * The release **tag** is one number (`v0.2.5`); a **package version** may sit below it, so a
 * patch release does not have to re-number 37 packages. The rules that make that safe live in
 * `inspect()` below and are the same rules `release.mjs` enforces when it writes artefacts:
 *
 *   1. every package version ≤ the tag (the tag is the *next* release, so it is always ahead);
 *   2. no package version went backwards against the newest `releases/v<tag>/registry.json`;
 *   3. every internal range equals `^<that dependency's own version>`;
 *   4. the tag is not older than the newest released tag.
 *
 * Usage:
 *   node scripts/version.mjs                                   # report only
 *   node scripts/version.mjs --check                           # exit 1 on a broken invariant
 *   node scripts/version.mjs --apply --tag 0.2.5               # tag only (no package moves)
 *   node scripts/version.mjs --apply --bump input --level patch --tag 0.2.5
 *                                                              # one package + the tag
 *   node scripts/version.mjs --apply --version 0.2.5           # the whole family at 0.2.5
 *
 * Everything is reversible: `--apply` only edits `package.json` files, which git tracks.
 * Undo with `git restore packages package.json`.
 */
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { compare, next, parse } from "./semver.mjs";

const ROOT = process.cwd();
const SCOPE = "@aio-ui/";
const DEP_FIELDS = ["dependencies", "peerDependencies", "optionalDependencies"];
const SECTIONS = ["packages/components", "packages/modules", "packages/themes", "packages/kits", "packages/utilities", "packages/styles"];

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const valueOf = (name) => {
  const index = args.indexOf(name);
  return index === -1 ? undefined : args[index + 1];
};
/** `--bump a,b --bump c` — repeatable, comma-split, de-duplicated. */
const listOf = (name) => {
  const out = [];
  for (let index = 0; index < args.length; index += 1) {
    if (args[index] !== name) continue;
    for (const item of String(args[index + 1] ?? "").split(",")) if (item.trim()) out.push(item.trim());
  }
  return [...new Set(out)];
};
const fail = (message) => {
  console.error(`[version] ${message}`);
  process.exit(1);
};

const targetVersion = valueOf("--version");
const tag = valueOf("--tag");
const bumps = listOf("--bump");
const level = valueOf("--level") ?? "patch";
const apply = flag("--apply");
const check = flag("--check");

/** Every publishable package directory: workspace sections + `packages/*`. */
function packageDirs() {
  const dirs = new Set();

  const add = (dir) => {
    try {
      if (statSync(join(dir, "package.json")).isFile()) dirs.add(dir);
    } catch {
      // No manifest here.
    }
  };

  add(ROOT);
  add(join(ROOT, "packages"));
  for (const section of ["packages", ...SECTIONS]) {
    const base = join(ROOT, section);
    try {
      for (const entry of readdirSync(base, { withFileTypes: true })) {
        if (entry.isDirectory()) add(join(base, entry.name));
      }
    } catch {
      // Section absent in this checkout.
    }
  }

  return [...dirs];
}

/** Reads one manifest. */
function read(dir) {
  const path = join(dir, "package.json");
  return { dir, path, manifest: JSON.parse(readFileSync(path, "utf8")) };
}

const rootPath = join(ROOT, "package.json");
const rootManifest = JSON.parse(readFileSync(rootPath, "utf8"));

const packages = packageDirs()
  .map(read)
  // Examples are apps, not published packages: they keep their own version.
  .filter((entry) => String(entry.manifest.name ?? "").startsWith(SCOPE));
const byName = new Map(packages.map((entry) => [entry.manifest.name, entry]));

/** Peer/dependency entries that point at a sibling package. */
function internalRefs(manifest) {
  const refs = [];
  for (const field of DEP_FIELDS) {
    const bag = manifest[field];
    if (!bag) continue;
    for (const [name, range] of Object.entries(bag)) {
      if (name.startsWith(SCOPE)) refs.push({ field, name, range });
    }
  }
  return refs;
}

/** Released registries under `releases/`, oldest tag first; the newest drives the invariants. */
function released() {
  const dir = join(ROOT, "releases");
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && parse(entry.name.slice(1)))
    .filter((entry) => existsSync(join(dir, entry.name, "registry.json")))
    .map((entry) => ({ tag: entry.name.slice(1), registry: JSON.parse(readFileSync(join(dir, entry.name, "registry.json"), "utf8")) }))
    .sort((one, two) => compare(one.tag, two.tag));
}
const latest = released().at(-1);

/** The four invariants of Option A. Returns the broken ones; never throws. */
function inspect(candidateTag) {
  const problems = [];
  const advisories = [];
  const tagIsVersion = Boolean(parse(candidateTag));
  if (!tagIsVersion) problems.push(`tag "${candidateTag}" is not semver`);

  for (const entry of packages) {
    const name = entry.manifest.name;
    const version = String(entry.manifest.version ?? "0.0.0");
    if (!parse(version)) {
      problems.push(`${name}: version "${version}" is not semver`);
      continue;
    }
    if (tagIsVersion && compare(version, candidateTag) > 0) {
      problems.push(`${name}: ${version} is newer than the tag ${candidateTag} — raise the tag with --tag`);
    }
    for (const ref of internalRefs(entry.manifest)) {
      const dependency = byName.get(ref.name);
      if (!dependency) {
        problems.push(`${name}: ${ref.field}.${ref.name} is not a workspace package`);
        continue;
      }
      // An exact `^<own version>` range: a forgotten dependency bump then cannot ship stale peers.
      const want = `^${dependency.manifest.version}`;
      if (ref.range !== want) problems.push(`${name}: ${ref.field}.${ref.name} = ${ref.range}, want ${want}`);
    }
  }

  if (!latest) {
    advisories.push("no releases/v*/registry.json — released-version invariants skipped");
  } else {
    if (tagIsVersion && compare(candidateTag, latest.tag) < 0) {
      problems.push(`tag ${candidateTag} is older than the released ${latest.tag}`);
    }
    for (const [name, entry] of Object.entries(latest.registry.packages ?? {})) {
      // Older registries carry no per-package version; the tag is the release they shipped in.
      const shipped = entry.version ?? latest.registry.version;
      const current = byName.get(name);
      if (!current) {
        advisories.push(`${name}: released in ${latest.tag} but no longer in the workspace`);
        continue;
      }
      if (parse(shipped) && compare(current.manifest.version, shipped) < 0) {
        problems.push(`${name}: ${current.manifest.version} is older than the released ${shipped} (${latest.tag})`);
      }
    }
  }
  return { problems, advisories };
}

/** One line per distinct package version — the report, and the shape a reader expects. */
function report() {
  const groups = new Map();
  for (const entry of packages) {
    const version = String(entry.manifest.version ?? "0.0.0");
    groups.set(version, [...(groups.get(version) ?? []), entry.manifest.name]);
  }
  console.log(`[version] ${packages.length} package(s) · tag ${rootManifest.version}` + (latest ? ` · released ${latest.tag}` : " · no released registry"));
  for (const [version, names] of [...groups].sort((one, two) => compare(two[0], one[0]))) {
    const sample = names.length <= 6 ? ` — ${names.join(", ")}` : "";
    console.log(`  ${version}: ${names.length} package(s)${sample}`);
  }
}

if (check || !apply) {
  report();
  const previewTag = tag ?? targetVersion ?? rootManifest.version;
  const { problems, advisories } = inspect(previewTag);
  for (const line of advisories) console.log(`[version] note: ${line}`);
  for (const line of problems) console.error(`[version] ${line}`);
  if (check && problems.length) fail(`${problems.length} invariant(s) broken`);
  if (!apply) {
    for (const name of bumps) {
      const entry = byName.get(name);
      if (!entry) fail(`--bump ${name}: not a workspace package`);
      console.log(`[version] plan ${name}: ${entry.manifest.version} → ${next(entry.manifest.version, level)}`);
    }
    if (targetVersion) console.log(`[version] plan every package → ${targetVersion}`);
    if (previewTag !== rootManifest.version) console.log(`[version] plan tag ${rootManifest.version} → ${previewTag}`);
    if (!check) console.log("[version] dry run — pass --apply to write");
  }
  process.exit(0);
}

// ---- write ------------------------------------------------------------------

if (targetVersion && bumps.length) fail("--version sets the whole family; --bump sets named packages — pick one");
if (!targetVersion && !bumps.length && !tag) fail("--apply needs --version <x.y.z>, --bump <name…> or --tag <x.y.z>");
if (!["patch", "minor", "major"].includes(level)) fail(`--level ${level} is not patch|minor|major`);

const previousTag = rootManifest.version;
const nextTag = tag ?? targetVersion ?? previousTag;
if (!parse(nextTag)) fail(`--tag ${nextTag} is not semver`);

const before = new Map(packages.map((entry) => [entry.manifest.name, entry.manifest.version]));
const beforeJson = new Map(packages.map((entry) => [entry.manifest.name, JSON.stringify(entry.manifest)]));

if (targetVersion) {
  // The whole family: every package and every internal range move together.
  for (const entry of packages) {
    entry.manifest.version = targetVersion;
    for (const field of DEP_FIELDS) {
      const bag = entry.manifest[field];
      if (!bag) continue;
      for (const name of Object.keys(bag)) if (name.startsWith(SCOPE)) bag[name] = `^${targetVersion}`;
    }
  }
} else {
  for (const name of bumps) {
    const entry = byName.get(name);
    if (!entry) fail(`--bump ${name}: not a workspace package`);
    entry.manifest.version = next(entry.manifest.version, level);
  }
  // Every package that depends on a bumped name follows it, or invariant 3 breaks.
  for (const name of bumps) {
    const version = byName.get(name).manifest.version;
    for (const entry of packages) {
      for (const field of DEP_FIELDS) {
        const bag = entry.manifest[field];
        if (bag && Object.hasOwn(bag, name)) bag[name] = `^${version}`;
      }
    }
  }
}

rootManifest.version = nextTag;

// Validate the in-memory result first: a broken invariant writes nothing.
const { problems, advisories } = inspect(nextTag);
for (const line of advisories) console.log(`[version] note: ${line}`);
if (problems.length) {
  for (const line of problems) console.error(`[version] ${line}`);
  fail("nothing written — fix the lines above");
}

const changed = [];
for (const entry of packages) {
  if (JSON.stringify(entry.manifest) === beforeJson.get(entry.manifest.name)) continue;
  writeFileSync(entry.path, `${JSON.stringify(entry.manifest, null, 2)}\n`, "utf8");
  changed.push(relative(ROOT, entry.path));
}
for (const [name, was] of before) {
  const now = byName.get(name).manifest.version;
  if (now !== was) console.log(`[version] ${name}: ${was} → ${now}`);
}
if (previousTag !== nextTag) {
  writeFileSync(rootPath, `${JSON.stringify(rootManifest, null, 2)}\n`, "utf8");
  changed.push("package.json");
  console.log(`[version] tag ${previousTag} → ${nextTag}`);
}
console.log(`[version] wrote ${changed.length} file(s) — now run: npm run version:check`);
console.log("[version] undo with: git restore packages package.json");
