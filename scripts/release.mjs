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
 *   node scripts/release.mjs --version 0.1.0 --apply    # write artefacts (mode B by default)
 *   node scripts/release.mjs --version 0.1.0 --apply --bundle   # mode A: self-contained
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
 * The output directory is the `releases` worktree (`./releases`, see
 * scripts/releases-worktree.mjs), not a scratch folder: the tarball a consumer
 * installs is a file in that checkout, and `publish-releases.mjs --apply` commits
 * it to the orphan branch. Nothing here talks to the remote.
 */
import { execSync } from "node:child_process";
import { createHash } from "node:crypto";
import { copyFileSync, cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { gzipSync } from "node:zlib";
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
const bundle = flag("--bundle");
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
const sizes = [];
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

/** Tarball name npm will produce for a package: `@aio-ui/form` → `aio-ui-form-0.1.0.tgz`. */
function tarballName(packageName, targetVersion) {
  return `aio-ui-${packageName.slice(SCOPE.length)}-${targetVersion}.tgz`;
}

/** The URL a consumer's npm can follow: that tarball as a file on the `releases` branch. */
function tarballUrl(packageName, targetVersion) {
  return `https://github.com/${repository}/raw/releases/v${targetVersion}/${tarballName(packageName, targetVersion)}`;
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
  {
    packSource = join(stageRoot, entry.manifest.name.split("/").pop());
    bundledCount = stagePackage(name, packSource, new Set([name]));
  }
  const packDir = relative(ROOT, packSource).replace(/\\/g, "/");
  const output = execSync(`npm pack "./${packDir}" --pack-destination "${outDir}" --json`, {
    cwd: ROOT,
    encoding: "utf8",
    // A bundled tarball's `--json` file list is megabytes long; the 1 MB default
    // kills the run with ENOBUFS on the first self-contained package.
    maxBuffer: 256 * 1024 * 1024,
  });
  const [packed] = JSON.parse(output);

  const tarballPath = join(outDir, packed.filename);
  const bytes = readFileSync(tarballPath).length;
  const sha256 = createHash("sha256").update(readFileSync(tarballPath)).digest("hex");
  checksums.push(`${sha256}  ${packed.filename}`);
  totalBytes += bytes;
  sizes.push({ name, bytes, file: tarballPath });

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
