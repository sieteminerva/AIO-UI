#!/usr/bin/env node
/**
 * CDN PUBLISHER — put the built packages behind the version tag.
 *
 * jsDelivr serves repository files, but `dist/` is gitignored on `main`, so a
 * tag on `main` 404s for every import-map URL. This script rebuilds the tag
 * content from the release tarballs (exactly what consumers install) on the
 * orphan `releases` branch:
 *
 *   <repo>/packages/components/form/dist/Form.js
 *   <repo>/packages/styles/src/index.css
 *   <repo>/registry.json  layout.json  checksums.txt
 *   <repo>/README.md
 *   <repo>/v<version>/*.tgz            (written by release.mjs, kept as they are)
 *
 * Both publishers share one checkout — `<repo>/releases`, the worktree created by
 * scripts/releases-worktree.mjs — so a tarball, its registry entry and the unpacked
 * file jsDelivr serves are never in two different places.
 *
 * The README is rendered from `templates/cdn/README.md.tpl` with the version, the tag and a
 * package table generated from registry.json, so the published branch documents itself.
 *
 * It then moves the version tag onto that commit. `registry.base` keeps pointing at
 * `@v<version>/`.
 *
 * Usage:
 *   node scripts/publish-cdn.mjs                 # dry run: assemble the tree
 *   node scripts/publish-cdn.mjs --apply         # commit, tag, push
 *   node scripts/publish-cdn.mjs --apply --remote origin --branch releases
 */
import { execSync } from "node:child_process";
import { copyFileSync, cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { commitWorktree, ensureWorktree, pushBranch } from "./releases-worktree.mjs";

const ROOT = process.cwd();
const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const valueOf = (name) => {
  const index = args.indexOf(name);
  return index === -1 ? undefined : args[index + 1];
};

const apply = flag("--apply");
const remote = valueOf("--remote") ?? "origin";
const branch = valueOf("--branch") ?? "releases";
const version = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8")).version;
const releaseDir = join(ROOT, "releases", `v${version}`);
// Staging lives inside the worktree so the unpacked tree is inspectable; the branch
// ignores `/.stage/`, so it never ships.
const treeDir = join(ROOT, "releases", ".stage", "cdn");
const tag = `v${version}`;

if (!existsSync(join(releaseDir, "registry.json"))) {
  console.error(`[cdn] no artefacts at ${relative(ROOT, releaseDir)}. Run release.mjs --apply first.`);
  process.exit(1);
}

const registry = JSON.parse(readFileSync(join(releaseDir, "registry.json"), "utf8"));

// ---- 1. Assemble the tree from the tarballs --------------------------------
rmSync(treeDir, { recursive: true, force: true });
for (const [name, entry] of Object.entries(registry.packages)) {
  const tarball = join(releaseDir, entry.tarball.split("/").pop());
  const target = join(treeDir, entry.dir);
  mkdirSync(target, { recursive: true });
  // Windows `tar` treats `C:\...` as a remote host, so pass repo-relative paths.
  const fromRoot = (path) => relative(ROOT, path).replace(/\\/g, "/");
  // A bundled tarball carries its closure under `node_modules/`. Those files are
  // duplicates of sibling packages already in this tree (and on Windows their nested
  // paths blow the 260-character limit), so they are never unpacked here.
  execSync(`tar -xzf "${fromRoot(tarball)}" -C "${fromRoot(target)}" --strip-components=1 --exclude=package/node_modules`, {
    cwd: ROOT,
    stdio: "pipe",
  });
  if (!existsSync(join(target, "package.json"))) {
    console.error(`[cdn] ${name}: tarball did not unpack into ${entry.dir}`);
    process.exit(1);
  }
  if (existsSync(join(target, "node_modules"))) {
    console.error(`[cdn] ${name}: a bundled node_modules/ reached the cdn tree; refusing to publish`);
    process.exit(1);
  }
}
for (const file of ["registry.json", "layout.json", "checksums.txt"]) {
  copyFileSync(join(releaseDir, file), join(treeDir, file));
}

// ---- 1b. Render the branch README from the template + registry -------------
const README_TEMPLATE = join(ROOT, "templates", "cdn", "README.md.tpl");

/** One markdown row per package: name, directory, root entry, release asset. */
function packageRow([name, entry]) {
  const root = entry.subpaths?.["."];
  const asset = entry.tarball.split("/").pop();
  return `| \`${name}\` | \`${entry.dir}\` | ${root ? `\`${root}\`` : "— (CSS only)"} | \`${asset}\` |`;
}

function renderReadme() {
  const tokens = {
    __VERSION__: version,
    __TAG__: tag,
    __REPOSITORY__: registry.repository,
    __PACKAGE_COUNT__: String(Object.keys(registry.packages).length),
    __GENERATED_AT__: String(registry.generatedAt ?? "").slice(0, 10),
    __PACKAGE_TABLE__: Object.entries(registry.packages).map(packageRow).join("\n"),
  };
  const template = readFileSync(README_TEMPLATE, "utf8");
  return template.replace(/__[A-Z_]+__/g, (token) => tokens[token] ?? token);
}

writeFileSync(join(treeDir, "README.md"), renderReadme());
console.log(`[cdn] assembled ${Object.keys(registry.packages).length} packages for ${tag}`);

if (!apply) {
  console.log(`[cdn] dry run — tree at ${relative(ROOT, treeDir)}; pass --apply to commit and push`);
  process.exit(0);
}

// ---- 2. Commit on the orphan `releases` branch -----------------------------
const worktree = ensureWorktree({ root: ROOT, branch, remote });

// Same checkout the tarballs live in, so only the unpacked tree at the root is
// replaced. A wipe would delete `v<version>/`, and a published URL is a contract.
for (const entry of ["packages", "registry.json", "layout.json", "checksums.txt", "README.md"]) {
  rmSync(join(worktree, entry), { recursive: true, force: true });
}

// Node's own recursive copy: no `cp` in cmd.exe.
cpSync(treeDir, worktree, { recursive: true });
writeFileSync(join(worktree, ".gitignore"), "/.stage/\n", "utf8");

commitWorktree(worktree, `releases: ${tag}`);
pushBranch(worktree, { branch, remote, tag });

rmSync(treeDir, { recursive: true, force: true });
console.log(`[cdn] pushed ${branch} branch + ${tag} to ${remote}`);
console.log(`[cdn] verify: https://cdn.jsdelivr.net/gh/<owner>/<repo>@${tag}/registry.json`);
