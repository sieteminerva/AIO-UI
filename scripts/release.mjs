#!/usr/bin/env node
/**
 * RAJUTAN — RELEASE PRODUCER (local, dry-run by default)
 *
 * Turns a built workspace into the artefacts a generated site needs, without
 * publishing to npm:
 *
 *   releases/v<version>/              (inside the orphan-branch worktree)
 *     aio-ui-<name>-<version>.tgz   one per package   (installable by URL)
 *     registry.json                 specifier → tarball + integrity + subpaths
 *     layout.json                   package → dir/entry/stylesRoot/bare
 *     checksums.txt                 sha256 per tarball
 *
 * Usage:
 *   node scripts/release.mjs --version 0.1.0            # plan only
 *   node scripts/release.mjs --version 0.1.0 --apply    # write artefacts (bundled by default)
 *   node scripts/release.mjs --version 0.1.0 --apply --no-bundle   # mode B: bare tarballs
 *
 * Bundling (mode A) is the default because it is what makes one URL enough: each
 * tarball carries its whole `@aio-ui/*` closure under `node_modules/`, declared as
 * exact `dependencies` + `bundledDependencies`, and the `development` export
 * condition is stripped so a consumer's bundler cannot pull `.ts` out of
 * `node_modules`. `--no-bundle` keeps the old peer-only tarballs and is only useful
 * for debugging the pack step.
 *
 * The output directory is the `releases` worktree (`./releases`, see
 * scripts/releases-worktree.mjs), not a scratch folder: the tarball a consumer
 * installs is a file in that checkout, and `publish-releases.mjs --apply` commits
 * it to the orphan branch. Nothing here talks to the remote.
 */
import { execSync } from "node:child_process";
import { createHash } from "node:crypto";
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { ensureWorktree } from "./releases-worktree.mjs";

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
const bundle = !flag("--no-bundle");
const repository = process.env.GITHUB_REPOSITORY || "sieteminerva/AIO-UI";
const outDir = version ? join(ROOT, "releases", `v${version}`) : null;

if (!version || !/^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/.test(version)) {
  console.error("[release] --version <x.y.z> is required (semver, pre-release allowed)");
  process.exit(1);
}

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

// Gate 1: every package carries the released version, otherwise the tarballs
// and the registry would disagree with their own manifests.
const mismatched = packages.filter((entry) => entry.manifest.version !== version);
if (mismatched.length) {
  console.error(
    `[release] ${mismatched.length} package(s) are not at ${version}. ` +
      `Run: node scripts/version.mjs --apply --version ${version}`,
  );
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

if (!apply) {
  for (const entry of packages.slice(0, 5)) {
    console.log(`  ${entry.manifest.name} → ${relative(ROOT, entry.dir)}`);
  }
  if (packages.length > 5) console.log(`  … ${packages.length - 5} more`);
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
  packages: {},
};

const checksums = [];
const layout = {};
let totalBytes = 0;
const byName = new Map(packages.map((entry) => [entry.manifest.name, entry]));

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

/**
 * Copies one package to `target` and rewrites its manifest so the closure travels with it.
 *
 * A cycle (`form ↔ message`) is broken at the repeated name: that package is already
 * inside the tarball higher up, and node's upward lookup finds it there. It stays a
 * declared exact dependency, it just is not nested a second time.
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
    // Exact, not the workspace range: the copy in this tarball is the version it was built against.
    manifest.dependencies = { ...manifest.dependencies, [dep]: depVersion };
    delete manifest.peerDependencies?.[dep];
    delete manifest.optionalDependencies?.[dep];

    if (ancestry.has(dep)) continue;
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
if (bundle) {
  writeFileSync(join(ROOT, "releases", ".gitignore"), "/.stage/\n", "utf8");
}

for (const entry of packages) {
  const name = entry.manifest.name;
  const dir = relative(ROOT, entry.dir).replace(/\\/g, "/");
  const exportMap = entry.manifest.exports ?? {};

  // `npm pack` is the same tool a consumer's installer runs, so the tarball
  // layout matches `files[]` exactly — no hand-rolled archive.
  // A single quoted command string is the only form that survives this
  // workspace path (it contains spaces) on every platform.
  // The `./` prefix is required: npm parses a two-segment relative path
  // (`packages/app`) as GitHub shorthand `owner/repo` and packs over ssh
  // instead of the local directory. `dir` is relative to ROOT, never absolute —
  // "./C:\\…" is read as a path inside the cwd and resolves to nothing.
  let bundledCount = 0;
  let packSource = entry.dir;
  if (bundle) {
    packSource = join(stageRoot, entry.manifest.name.split("/").pop());
    bundledCount = stagePackage(name, packSource, new Set([name]));
  }
  const packDir = relative(ROOT, packSource).replace(/\\/g, "/");
  const output = execSync(`npm pack "./${packDir}" --pack-destination "${outDir}" --json`, {
    cwd: ROOT,
    encoding: "utf8",
  });
  const [packed] = JSON.parse(output);

  const tarballPath = join(outDir, packed.filename);
  const bytes = readFileSync(tarballPath).length;
  const sha256 = createHash("sha256").update(readFileSync(tarballPath)).digest("hex");
  checksums.push(`${sha256}  ${packed.filename}`);
  totalBytes += bytes;

  const subpaths = subpathsOf(entry.manifest, entry.dir);
  registry.packages[name] = {
    dir,
    subpaths,
    // Raw file on the orphan branch: one URL, no GitHub Release asset to upload, and
    // the same bytes jsDelivr already serves for the unpacked tree.
    tarball: `https://github.com/${repository}/raw/releases/v${version}/${packed.filename}`,
    integrity: packed.integrity,
    size: packed.size,
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

writeFileSync(join(outDir, "registry.json"), `${JSON.stringify(registry, null, 2)}\n`, "utf8");
writeFileSync(join(outDir, "layout.json"), `${JSON.stringify(layout, null, 2)}\n`, "utf8");
writeFileSync(join(outDir, "checksums.txt"), `${checksums.join("\n")}\n`, "utf8");

console.log(`[release] wrote ${checksums.length} tarball(s) + registry.json + layout.json + checksums.txt`);
console.log(
  `[release] mode ${bundle ? "A — self-contained (bundled closure)" : "B — bare tarballs (peers unresolved)"} · ${(totalBytes / 1024 / 1024).toFixed(2)} MB total`,
);
if (bundle) rmSync(stageRoot, { recursive: true, force: true });
console.log(`[release] next: node scripts/publish-releases.mjs --apply`);
console.log(`[release] undo with: rm -rf ${relative(ROOT, outDir).replace(/\\/g, "/")}`);
