#!/usr/bin/env node
/**
 * RELEASE PUBLISHER — commit one version folder to the orphan `releases` branch.
 *
 * `release.mjs --apply` writes `releases/v<version>/`; this script is what makes those
 * bytes reachable from a URL, without a GitHub Release upload and without a registry:
 *
 *   npm install https://github.com/<owner>/<repo>/raw/releases/v0.2.2/aio-ui-form-0.2.2.tgz
 *
 * The folder is generated inside the branch checkout (`releases/`, see
 * scripts/releases-worktree.mjs), so publishing is a commit, not a copy. `main` stays
 * source-only: the worktree is a second checkout and its files never belong to `main`.
 *
 * Older `v<version>/` folders are never touched. A published URL is a contract.
 *
 * Usage:
 *   node scripts/publish-releases.mjs                  # dry run: list what would ship
 *   node scripts/publish-releases.mjs --apply          # commit + force-push the branch
 *   node scripts/publish-releases.mjs --apply --version 0.2.2 --remote origin
 */
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
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
const version =
  valueOf("--version") ?? JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8")).version;
const dir = join(ROOT, "releases", `v${version}`);

if (!existsSync(join(dir, "registry.json"))) {
  console.error(
    `[releases] no artefacts at ${relative(ROOT, dir)}. Run: node scripts/release.mjs --version ${version} --apply`,
  );
  process.exit(1);
}

const registry = JSON.parse(readFileSync(join(dir, "registry.json"), "utf8"));
const packages = Object.entries(registry.packages ?? {});
// One tag, one version per package (Option A): the closing example names a real asset.
const sample = packages.at(-1)?.[1]?.tarball?.split("/").pop() ?? `aio-ui-form-${version}.tgz`;

// Gate: the registry is the contract, so every tarball it names must exist on disk and
// every tarball on disk must be named by it. Half a folder is worse than none.
const missing = packages.filter(([, entry]) => !existsSync(join(dir, entry.tarball.split("/").pop())));
const named = new Set(packages.map(([, entry]) => entry.tarball.split("/").pop()));
const orphans = readdirSync(dir).filter((file) => file.endsWith(".tgz") && !named.has(file));

if (missing.length || orphans.length) {
  if (missing.length) console.error(`[releases] ${missing.length} tarball(s) missing from ${relative(ROOT, dir)}`);
  if (orphans.length) console.error(`[releases] ${orphans.length} tarball(s) not in registry.json: ${orphans.join(", ")}`);
  console.error("[releases] re-run: node scripts/release.mjs --apply");
  process.exit(1);
}

const files = readdirSync(dir).sort();
const bytes = files.reduce((sum, file) => sum + statSync(join(dir, file)).size, 0);
const mb = (value) => `${(value / 1024 / 1024).toFixed(2)} MB`;

console.log(
  `[releases] v${version} · ${packages.length} package(s) · ${files.length} file(s) · ${mb(bytes)} · branch ${branch}`,
);
console.log(`[releases] ${relative(ROOT, dir).replace(/\\/g, "/")} → raw.githubusercontent.com/<owner>/<repo>/${branch}/v${version}/`);

if (!apply) {
  for (const file of files.slice(0, 8)) console.log(`  ${file}`);
  if (files.length > 8) console.log(`  … ${files.length - 8} more`);
  console.log("[releases] dry run — pass --apply to commit and push");
  process.exit(0);
}

const worktree = ensureWorktree({ root: ROOT, branch, remote });
commitWorktree(worktree, `releases: v${version}`);
pushBranch(worktree, { branch, remote });

console.log(`[releases] pushed ${branch} · ${version}`);
console.log(`[releases] verify: npm install <repo>/raw/${branch}/v${version}/${sample}`);
