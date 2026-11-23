#!/usr/bin/env node
/**
 * RAJUTAN — RELEASE PRODUCER (local, dry-run by default)
 *
 * Turns a built workspace into the artefacts a generated site needs, without
 * publishing to npm:
 *
 *   releases/v<tag>/                  (inside the orphan-branch worktree)
 *     aio-ui-<name>-<x.y.z>.tgz       one per package, named by the *package* version
 *     registry.json                   specifier → tarball + integrity + subpaths + version
 *     layout.json                     package → dir/entry/stylesRoot/bare
 *     checksums.txt                   sha256 per tarball
 *
 * Usage:
 *   node scripts/release.mjs --version 0.1.0            # plan only
 *   node scripts/release.mjs --version 0.1.0 --apply    # write artefacts (mode B by default)
 *   node scripts/release.mjs --version 0.1.0 --apply --bundle   # mode A: self-contained
 *   node scripts/release.mjs --version 0.1.0 --apply --strict   # an unbumped change fails
 *   node scripts/release.mjs --version 0.1.0 --previous 0.0.9   # compare against a chosen tag
 *
 * One **tag** per release, one **version per package** (Option A, 2026-11-24). A package whose
 * version did not move is not repacked: its bytes are copied from the previous folder, so one
 * version keeps exactly one identity. A package whose source changed without a bump is reported
 * (and, with `--strict`, refused). The detector is a `tree` hash of the shipped files, kept in
 * the registry; `package.json` and `README.md` are excluded because both are generated.
 *
 * Two modes, same graph:
 *
 *   B — declared (default): every internal edge becomes an exact `dependencies` entry whose
 *       value is the tarball URL on the `releases` branch. Packages stay separate modules, and
 *       `npm install <A>.tgz` pulls B, then C, then D by itself — the modular install.
 *   A — embedded (`--bundle`): the closure is copied into the tarball under `node_modules/` and
 *       declared as `bundledDependencies`, so one URL is enough and nothing else is fetched.
 *
 * Both strip the `development` export condition: the tarball is a published artefact.
 *
 * Every URL is built from the tag (`releases/v<tag>/`) plus the *package* version in the file
 * name, which is why two packages in one folder can legitimately carry different numbers.
 *
 * The output directory is the `releases` worktree (`./releases`, see
 * scripts/releases-worktree.mjs), not a scratch folder: the tarball a consumer
 * installs is a file in that checkout, and `publish-releases.mjs --apply` commits
 * it to the orphan branch. Nothing here talks to the remote.
 */
import { execSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  copyFileSync,
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { join, relative, sep } from "node:path";
import { gzipSync } from "node:zlib";
import { ensureWorktree } from "./releases-worktree.mjs";
import { compare, parse } from "./semver.mjs";

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

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const valueOf = (name) => {
  const index = args.indexOf(name);
  return index === -1 ? undefined : args[index + 1];
};

const version = valueOf("--version");
const apply = flag("--apply");
const bundle = flag("--bundle");
const strict = flag("--strict");
const previousArg = valueOf("--previous");
const allowGrowth = flag("--allow-growth");
const repository = process.env.GITHUB_REPOSITORY || "sieteminerva/AIO-UI";
const outDir = version ? join(ROOT, "releases", `v${version}`) : null;

if (!version || !/^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/.test(version)) {
  console.error("[release] --version <x.y.z> is required (semver, pre-release allowed)");
  process.exit(1);
}

/**
 * Size gates, decided from the 2026-11-17 measurement (see docs/framework/TASK-releases-branch.md).
 * A gate that cannot trip is not a gate, so these are tight on purpose:
 *   per tarball  ≤ 2.0 MB  (heaviest measured 1.17 MB in mode A)
 *   per version  ≤ 8.0 MB  (measured 6.1 MB raw in mode A)
 *   repo growth  ≤ 3.0 MB gzipped (measured 2.2 MB; warn only, `--allow-growth` accepts)
 */
const BUDGET = {
  tarball: 2.0 * 1024 * 1024,
  total: 8.0 * 1024 * 1024,
  growth: 3.0 * 1024 * 1024,
};
const mb = (bytes) => `${(bytes / 1024 / 1024).toFixed(2)} MB`;

/** Every publishable package directory. */
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

const packages = packageDirs()
  .map((dir) => ({ dir, manifest: JSON.parse(readFileSync(join(dir, "package.json"), "utf8")) }))
  .filter((entry) => String(entry.manifest.name ?? "").startsWith(SCOPE));
const byName = new Map(packages.map((entry) => [entry.manifest.name, entry]));

// Gate 1 (per-package): every version is semver, and no package may outrun the tag. The tag is
// the next release; a package above it would be published under a number it does not own.
const invalid = packages.filter((entry) => !parse(entry.manifest.version));
if (invalid.length) {
  console.error(`[release] ${invalid.length} package(s) have no semver version:`);
  invalid.slice(0, 5).forEach((entry) => console.error(`  - ${entry.manifest.name}@${entry.manifest.version}`));
  process.exit(1);
}
const ahead = packages.filter((entry) => compare(entry.manifest.version, version) > 0);
if (ahead.length) {
  console.error(`[release] ${ahead.length} package(s) are newer than the tag ${version}:`);
  ahead.slice(0, 5).forEach((entry) => console.error(`  - ${entry.manifest.name}@${entry.manifest.version}`));
  console.error(`[release] raise the tag: node scripts/version.mjs --apply --tag <x.y.z>`);
  process.exit(1);
}

// Gate 2: `dist` must exist for the packages the generator points at.
const missingDist = packages.filter((entry) => {
  const rootExport = entry.manifest.exports?.["."];
  const entryFile = typeof rootExport === "string" ? rootExport : rootExport?.default;
  if (!entryFile || !entryFile.endsWith(".js")) return false;
  return !existsSync(join(entry.dir, entryFile.replace(/^\.\//, "")));
});

if (missingDist.length) {
  console.error(`[release] ${missingDist.length} package(s) have no built entry. Run: npm run build:pkgs`);
  missingDist.slice(0, 5).forEach((entry) => console.error(`  - ${entry.manifest.name}`));
  process.exit(1);
}

/** Flattens a conditional export value to its published file. */
function fileOf(value) {
  if (typeof value === "string") return value;
  if (value && typeof value === "object") return value.default;
  return undefined;
}

/** `./Form` → `dist/Form.js`; `./Form.css` → `dist/Form.css`; `.` → root entry. */
function subpathsOf(manifest, dir) {
  const map = {};
  const exportsMap = manifest.exports ?? {};

  for (const [key, value] of Object.entries(exportsMap)) {
    const file = fileOf(value);
    if (!file) continue;
    let target = file.replace(/^\.\//, "");
    // CSS always ships under `dist/` (the build copies sheets there); a source
    // file at the package root is not part of the tarball.
    if (target.endsWith(".css") && existsSync(join(dir, "dist", target))) {
      target = `dist/${target}`;
    } else if (!existsSync(join(dir, target)) && existsSync(join(dir, "dist", target))) {
      target = `dist/${target}`;
    }
    map[key === "." ? "." : key] = target;
  }
  return map;
}

console.log(`[release] target v${version} · ${packages.length} package(s) · repo ${repository}`);

/** The newest released folder, or the one named by `--previous <tag|path>`. */
function loadPrevious() {
  const read = (dir) => JSON.parse(readFileSync(join(dir, "registry.json"), "utf8"));
  if (previousArg) {
    const dir = existsSync(join(ROOT, previousArg)) ? join(ROOT, previousArg) : join(ROOT, "releases", `v${previousArg}`);
    if (!existsSync(join(dir, "registry.json"))) {
      console.error(`[release] --previous ${previousArg}: no registry.json at ${relative(ROOT, dir)}`);
      process.exit(1);
    }
    return { tag: previousArg.replace(/^v/, ""), dir, registry: read(dir) };
  }
  const root = join(ROOT, "releases");
  if (!existsSync(root)) return undefined;
  const folder = readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && parse(entry.name.slice(1)) && entry.name.slice(1) !== version)
    .filter((entry) => existsSync(join(root, entry.name, "registry.json")))
    .sort((one, two) => compare(one.name.slice(1), two.name.slice(1)))
    .at(-1);
  if (!folder) return undefined;
  const tag = folder.name.slice(1);
  return { tag, dir: join(root, folder.name), registry: read(join(root, folder.name)) };
}
const previous = loadPrevious();
if (previous && parse(previous.tag) && compare(version, previous.tag) < 0) {
  console.error(`[release] v${version} is older than the released v${previous.tag} — a tag is a contract`);
  process.exit(1);
}

/**
 * Every file npm would ship from `files` (`["dist", "*.ts"]`), relative to `dir`. A wildcard
 * matches one path segment, which is what npm does for a bare `*.ts`.
 */
function shippedFiles(dir, patterns) {
  const out = [];
  const walk = (current, prefix) => {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const rel = `${prefix}/${entry.name}`;
      if (entry.isDirectory()) walk(join(current, entry.name), rel);
      else out.push(rel);
    }
  };
  for (const pattern of patterns) {
    if (!pattern.includes("*")) {
      const full = join(dir, pattern);
      if (!existsSync(full)) continue;
      if (statSync(full).isDirectory()) walk(full, pattern);
      else out.push(pattern);
      continue;
    }
    const escape = (part) => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const shape = new RegExp(`^${pattern.split("*").map(escape).join("[^/]*")}$`);
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.isFile() && shape.test(entry.name)) out.push(entry.name);
    }
  }
  return out;
}

/**
 * sha256 over the files that actually ship, paths sorted. `package.json` and `README.md` are
 * excluded: both are rewritten at release time, so hashing them would make every release look
 * like a source change. A package without `files` falls back to the whole directory.
 */
function treeHash(entry) {
  const rows = [];
  const add = (rel) => {
    const bytes = readFileSync(join(entry.dir, ...rel.split("/")));
    rows.push(`${rel}:${createHash("sha256").update(bytes).digest("hex")}`);
  };

  if (Array.isArray(entry.manifest.files)) {
    for (const rel of shippedFiles(entry.dir, entry.manifest.files)) add(rel);
  } else {
    const walk = (current, prefix) => {
      for (const child of readdirSync(current, { withFileTypes: true })) {
        const rel = prefix ? `${prefix}/${child.name}` : child.name;
        if (child.isDirectory()) {
          if (child.name === "node_modules" || child.name === ".turbo") continue;
          walk(join(current, child.name), rel);
        } else if (rel !== "package.json" && rel !== "README.md") {
          add(rel);
        }
      }
    };
    walk(entry.dir, "");
  }
  return createHash("sha256").update(rows.sort().join("\n")).digest("hex");
}

/** The plan before anything is written: what moves, what can be copied, what changed unbumped. */
const plan = packages.map((entry) => {
  const name = entry.manifest.name;
  const packageVersion = entry.manifest.version;
  const deps = {};
  for (const dep of internalEdges(entry.manifest)) deps[dep] = byName.get(dep).manifest.version;
  const tree = treeHash(entry);
  const before = previous?.registry.packages?.[name];
  const beforeVersion = before ? (before.version ?? previous.registry.version) : undefined;
  const sourceChanged = Boolean(before?.tree && before.tree !== tree);
  const depsChanged = Boolean(before) && JSON.stringify(before.deps ?? {}) !== JSON.stringify(deps);
  const reusable =
    Boolean(before) &&
    beforeVersion === packageVersion &&
    !sourceChanged &&
    !depsChanged &&
    before.selfContained === bundle &&
    existsSync(join(previous.dir, before.tarball.split("/").pop()));
  return { entry, name, packageVersion, deps, tree, before, beforeVersion, sourceChanged, depsChanged, reusable };
});

const decreased = plan.filter((item) => item.beforeVersion && compare(item.packageVersion, item.beforeVersion) < 0);
if (decreased.length) {
  console.error(`[release] ${decreased.length} package(s) are older than v${previous.tag}:`);
  decreased.slice(0, 5).forEach((item) => console.error(`  - ${item.name} ${item.packageVersion} < ${item.beforeVersion}`));
  process.exit(1);
}

const unbumped = plan.filter((item) => item.sourceChanged && item.beforeVersion === item.packageVersion);
if (unbumped.length) {
  console.error(
    `[release] ${unbumped.length} package(s) changed without a version bump${strict ? " — strict, refusing" : " (warning)"}:`,
  );
  unbumped
    .slice(0, 8)
    .forEach((item) =>
      console.error(
        `  - ${item.name}@${item.packageVersion} — run: node scripts/version.mjs --apply --bump ${item.name} --tag <x.y.z>`,
      ),
    );
  if (strict) process.exit(1);
}

if (!apply) {
  const reuse = plan.filter((item) => item.reusable).length;
  console.log(
    `[release] previous ${previous ? `v${previous.tag}` : "none"} · reuse ${reuse} · repack ${plan.length - reuse}`,
  );
  for (const item of plan.slice(0, 5)) {
    console.log(
      `  ${item.name}@${item.packageVersion} → ${relative(ROOT, item.entry.dir)}${item.reusable ? " (copied)" : ""}`,
    );
  }
  if (plan.length > 5) console.log(`  … ${plan.length - 5} more`);
  console.log(`[release] dry run — pass --apply to write ${relative(ROOT, outDir)}`);
  process.exit(0);
}

// The artefacts belong to the orphan branch, so the working directory has to be its
// checkout. Creating it on demand keeps `--apply` a single command on a fresh clone.
ensureWorktree({ root: ROOT });

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

const registry = {
  version,
  repository,
  base: `https://cdn.jsdelivr.net/gh/${repository}@v${version}/`,
  generatedAt: new Date().toISOString(),
  mode: bundle ? "A" : "B",
  packages: {},
};

const checksums = [];
const layout = {};
const sizes = [];
let totalBytes = 0;

/** `@aio-ui/*` names this manifest requires: install requirements, all three fields. */
function internalEdges(manifest) {
  const names = new Set();
  for (const field of ["dependencies", "peerDependencies", "optionalDependencies"]) {
    for (const key of Object.keys(manifest[field] ?? {})) {
      if (key.startsWith(SCOPE)) names.add(key);
    }
  }
  return [...names].sort();
}

/** Drops the `development` condition at every depth: a shipped tarball is a published artefact. */
function publishedExports(value) {
  if (Array.isArray(value)) return value.map(publishedExports);
  if (!value || typeof value !== "object") return value;
  const out = {};
  for (const [key, inner] of Object.entries(value)) {
    if (key === "development") continue;
    out[key] = publishedExports(inner);
  }
  return out;
}

/** Tarball name npm will produce for a package: `@aio-ui/form` → `aio-ui-form-0.1.0.tgz`. */
function tarballName(packageName, packageVersion) {
  return `aio-ui-${packageName.slice(SCOPE.length)}-${packageVersion}.tgz`;
}

/** The URL a consumer's npm can follow: that tarball inside the tag's folder on `releases`. */
function tarballUrl(packageName, packageVersion) {
  return `https://github.com/${repository}/raw/releases/v${version}/${tarballName(packageName, packageVersion)}`;
}

/**
 * Copies one package to `target` and rewrites its manifest so its closure is reachable.
 *
 * Mode B (default): every internal edge becomes an exact `dependencies` entry pointing at the
 * tarball URL — npm installs A, follows the URL to B, then C, and the modules stay separate.
 * Mode A (`--bundle`): the closure is copied under `node_modules/` and declared bundled, so one
 * tarball is self-contained; a cycle (`form ↔ message`) is broken at the repeated name because
 * that package is already inside the tarball higher up.
 */
function stagePackage(name, target, ancestry) {
  const entry = byName.get(name);
  cpSync(entry.dir, target, {
    recursive: true,
    filter: (source) => !source.split(sep).includes("node_modules") && !source.split(sep).includes(".turbo"),
  });

  const manifest = JSON.parse(readFileSync(join(target, "package.json"), "utf8"));
  const bundled = [];

  for (const dep of internalEdges(manifest)) {
    const depVersion = byName.get(dep).manifest.version;
    // A URL, not a range: the consumer has no registry, and the closure must resolve by itself.
    manifest.dependencies = { ...manifest.dependencies, [dep]: tarballUrl(dep, depVersion) };
    delete manifest.peerDependencies?.[dep];
    delete manifest.optionalDependencies?.[dep];

    if (!bundle || ancestry.has(dep)) continue;
    stagePackage(dep, join(target, "node_modules", ...dep.split("/")), new Set([...ancestry, dep]));
    bundled.push(dep);
  }

  for (const field of ["peerDependencies", "optionalDependencies"]) {
    if (manifest[field] && Object.keys(manifest[field]).length === 0) delete manifest[field];
  }
  if (bundled.length) manifest.bundledDependencies = bundled;
  if (manifest.exports) manifest.exports = publishedExports(manifest.exports);
  writeFileSync(join(target, "package.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  return bundled.length;
}

// The staging tree lives at the branch worktree root so a failed pack is inspectable; the
// branch ignores `/.stage/`, so it never ships.
const stageRoot = join(ROOT, "releases", ".stage");
writeFileSync(join(ROOT, "releases", ".gitignore"), "/.stage/\n", "utf8");

for (const item of plan) {
  const { entry, name, packageVersion, deps, tree, before, reusable } = item;
  const dir = relative(ROOT, entry.dir).replace(/\\/g, "/");
  const filename = tarballName(name, packageVersion);
  let bundledCount = 0;
  let integrity;
  let size;

  if (reusable) {
    // Same version, same shipped bytes: copy the previous tarball so one version keeps exactly
    // one identity. Repacking would produce a different zlib stream under the same number.
    copyFileSync(join(previous.dir, before.tarball.split("/").pop()), join(outDir, filename));
    integrity = before.integrity;
    size = before.size;
  } else {
    // `npm pack` is the same tool a consumer's installer runs, so the tarball
    // layout matches `files[]` exactly — no hand-rolled archive.
    // A single quoted command string is the only form that survives this
    // workspace path (it contains spaces) on every platform.
    // The `./` prefix is required: npm parses a two-segment relative path
    // (`packages/app`) as GitHub shorthand `owner/repo` and packs over ssh
    // instead of the local directory. `dir` is relative to ROOT, never absolute —
    // "./C:\\…" is read as a path inside the cwd and resolves to nothing.
    const packSource = join(stageRoot, name.split("/").pop());
    bundledCount = stagePackage(name, packSource, new Set([name]));
    const packDir = relative(ROOT, packSource).replace(/\\/g, "/");
    const output = execSync(`npm pack "./${packDir}" --pack-destination "${outDir}" --json`, {
      cwd: ROOT,
      encoding: "utf8",
      // A bundled tarball's `--json` file list is megabytes long; the 1 MB default
      // kills the run with ENOBUFS on the first self-contained package.
      maxBuffer: 256 * 1024 * 1024,
    });
    const [packed] = JSON.parse(output);
    if (packed.filename !== filename) {
      console.error(
        `[release] ${name}: npm packed ${packed.filename}, expected ${filename} — ` +
          `the manifest version and the tag disagree`,
      );
      process.exit(1);
    }
    integrity = packed.integrity;
    size = packed.size;
  }

  const tarballPath = join(outDir, filename);
  const bytes = readFileSync(tarballPath);
  checksums.push(`${createHash("sha256").update(bytes).digest("hex")}  ${filename}`);
  totalBytes += bytes.length;
  sizes.push({ name, bytes: bytes.length, file: tarballPath });

  const subpaths = subpathsOf(entry.manifest, entry.dir);
  registry.packages[name] = {
    dir,
    version: packageVersion,
    deps,
    tree,
    subpaths,
    // Raw file on the orphan branch: one URL, no GitHub Release asset to upload, and
    // the same bytes jsDelivr already serves for the unpacked tree.
    tarball: tarballUrl(name, packageVersion),
    integrity,
    size,
    selfContained: bundle,
    bundled: bundledCount,
  };

  // Layout mirrors the generator's resolver: `entry` is a JS root only, every
  // subpath keeps its real file, and styles live in `dist` for TS packages but
  // `src` for the CSS-only package.
  const rootEntry = subpaths["."]?.endsWith(".js")
    ? subpaths["."]
    : Object.values(subpaths).find((file) => file.endsWith(".js"));
  layout[name] = {
    dir,
    ...(rootEntry ? { entry: rootEntry } : {}),
    stylesRoot: rootEntry ? "dist" : "src",
    ...(rootEntry && subpaths["."] ? {} : { bare: false }),
    subpaths,
  };
}

// ---- The bundled pair: four files a no-build page points at --------------
// Built by `npm run build:bundle` into temp/bundle/dist. They are copied beside the tarballs
// and named in the registry so `publish-cdn.mjs` can place them at the branch root.
const BUNDLE_FILES = ["aio-ui.js", "aio-ui.min.js", "aio-ui.css", "aio-ui.min.css"];
const bundleSource = join(ROOT, "temp", "bundle", "dist");
const missingBundle = BUNDLE_FILES.filter((file) => !existsSync(join(bundleSource, file)));
if (missingBundle.length) {
  console.warn(`[release] no bundled pair (${missingBundle.join(", ")}) — run: npm run build:bundle`);
} else {
  for (const file of BUNDLE_FILES) {
    const bytes = readFileSync(join(bundleSource, file));
    copyFileSync(join(bundleSource, file), join(outDir, file));
    checksums.push(`${createHash("sha256").update(bytes).digest("hex")}  ${file}`);
  }
  registry.bundle = {
    files: BUNDLE_FILES,
    base: `https://cdn.jsdelivr.net/gh/${repository}@v${version}/`,
    usage: "aio-ui.min.css + aio-ui.min.js for a page with no build step (globalThis.AioUI)",
  };
}

// ---- Size gates, before anything is published -----------------------------
const heaviest = [...sizes].sort((a, b) => b.bytes - a.bytes);
const overTarball = heaviest.filter((entry) => entry.bytes > BUDGET.tarball);
if (overTarball.length) {
  console.error(`[release] ${overTarball.length} tarball(s) exceed the ${mb(BUDGET.tarball)} per-package budget:`);
  for (const entry of overTarball.slice(0, 5)) console.error(`  - ${entry.name} ${mb(entry.bytes)}`);
  console.error(`[release] mode ${bundle ? "A" : "B"} · re-run without --bundle for the deduped set`);
  process.exit(1);
}
if (totalBytes > BUDGET.total) {
  console.error(`[release] ${mb(totalBytes)} exceeds the ${mb(BUDGET.total)} per-version budget:`);
  for (const entry of heaviest.slice(0, 5)) console.error(`  - ${entry.name} ${mb(entry.bytes)}`);
  console.error(`[release] mode ${bundle ? "A" : "B"} · re-run without --bundle for the deduped set`);
  process.exit(1);
}
const gzipped = sizes.reduce((sum, entry) => sum + gzipSync(readFileSync(entry.file)).length, 0);
if (gzipped > BUDGET.growth && !allowGrowth) {
  console.error(
    `[release] ${mb(gzipped)} gzipped exceeds the ${mb(BUDGET.growth)} repo-growth budget — ` +
      `every v<version>/ stays in git forever. Pass --allow-growth to accept it.`,
  );
  process.exit(1);
}
console.log(
  `[release] size gate ok · heaviest ${heaviest[0].name} ${mb(heaviest[0].bytes)} · total ${mb(totalBytes)} (${mb(gzipped)} gzipped)`,
);

writeFileSync(join(outDir, "registry.json"), `${JSON.stringify(registry, null, 2)}\n`, "utf8");
writeFileSync(join(outDir, "layout.json"), `${JSON.stringify(layout, null, 2)}\n`, "utf8");
writeFileSync(join(outDir, "checksums.txt"), `${checksums.join("\n")}\n`, "utf8");

console.log(`[release] wrote ${checksums.length} file(s) + registry.json + layout.json + checksums.txt`);
console.log(
  `[release] mode ${bundle ? "A — self-contained (bundled closure)" : "B — separate modules (internal dependencies are tarball URLs)"} · ${(totalBytes / 1024 / 1024).toFixed(2)} MB total`,
);
rmSync(stageRoot, { recursive: true, force: true });
console.log(`[release] next: node scripts/publish-releases.mjs --apply`);
console.log(`[release] undo with: rm -rf ${relative(ROOT, outDir).replace(/\\/g, "/")}`);
