#!/usr/bin/env node
/**
 * RELEASE ASSETS — put the 40 tarballs on the GitHub Release page.
 *
 * The branch keeps every version's tarballs (that is what `registry.json` points at), but the
 * Releases page is where a human goes to download one file per module. This script creates the
 * release for a tag (if it does not exist yet) and uploads `releases/v<version>/*.tgz` to it.
 *
 * Auth: a token in `GITHUB_TOKEN` (classic: `repo`; fine-grained: Contents + Administration
 * read/write). It is read from the environment and never printed — run this yourself:
 *
 *   GITHUB_TOKEN=ghp_… node scripts/publish-release-assets.mjs --tag v0.2.3 --body .draft/release-body.md
 *
 * Dry run is the default; `--apply` uploads. Re-running is safe: an asset that already exists
 * with the same name is skipped, never replaced.
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const valueOf = (name) => {
  const index = args.indexOf(name);
  return index === -1 ? undefined : args[index + 1];
};

const repository = process.env.GITHUB_REPOSITORY || "sieteminerva/AIO-UI";
const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
const apply = flag("--apply");
const version =
  (valueOf("--tag") ?? "").replace(/^v/, "") || JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8")).version;
const tag = `v${version}`;
const dir = join(ROOT, "releases", tag);
const bodyFile = valueOf("--body");

if (!existsSync(join(dir, "registry.json"))) {
  console.error(`[assets] no artefacts at releases/${tag}. Run: node scripts/release.mjs --version ${version} --apply`);
  process.exit(1);
}

const tarballs = readdirSync(dir)
  .filter((file) => file.endsWith(".tgz"))
  .sort()
  .map((file) => ({ file, path: join(dir, file), bytes: statSync(join(dir, file)).size }));

const fallbackBody = [
  `Tarballs for \`@aio-ui\` \`${version}\`.`,
  "",
  "Each file is one package. Its internal dependencies point at the sibling tarballs on the",
  "`releases` branch, so installing one pulls the rest automatically:",
  "",
  "```bash",
  `npm install https://github.com/${repository}/releases/download/${tag}/aio-ui-form-${version}.tgz`,
  "```",
  "",
  "Registry: https://cdn.jsdelivr.net/gh/" + `${repository}@${tag}/registry.json`,
].join("\n");

const body = bodyFile ? readFileSync(join(ROOT, bodyFile), "utf8") : fallbackBody;

console.log(
  `[assets] ${tag} · ${tarballs.length} tarball(s) · ${(tarballs.reduce((sum, t) => sum + t.bytes, 0) / 1024 / 1024).toFixed(2)} MB`,
);

if (!apply) {
  tarballs.slice(0, 5).forEach((t) => console.log(`  ${t.file}`));
  if (tarballs.length > 5) console.log(`  … ${tarballs.length - 5} more`);
  console.log("[assets] dry run — pass --apply to create/refresh the release and upload");
  process.exit(0);
}

if (!token) {
  console.error("[assets] GITHUB_TOKEN is not set. Export a token and re-run; it is never logged.");
  process.exit(1);
}

const api = "https://api.github.com";
const headers = {
  authorization: `Bearer ${token}`,
  accept: "application/vnd.github+json",
  "x-github-api-version": "2022-11-28",
  "user-agent": "aio-ui-release-assets",
};

async function call(url, init = {}) {
  const response = await fetch(url, { ...init, headers: { ...headers, ...(init.headers ?? {}) } });
  if (!response.ok) {
    throw new Error(`${init.method ?? "GET"} ${url} → ${response.status} ${await response.text()}`);
  }
  return response.status === 204 ? null : response.json();
}

// ---- 1. The release object for the tag (create once, then reuse) ----------
let release;
try {
  release = await call(`${api}/repos/${repository}/releases/tags/${tag}`);
  console.log(`[assets] release ${tag} exists (id ${release.id})`);
} catch {
  release = await call(`${api}/repos/${repository}/releases`, {
    method: "POST",
    body: JSON.stringify({ tag_name: tag, name: tag, prerelease: true, body }),
  });
  console.log(`[assets] created release ${tag} (id ${release.id})`);
}

// ---- 2. Upload every tarball that is not there yet ------------------------
const existing = new Set(
  (await call(`${api}/repos/${repository}/releases/${release.id}/assets?per_page=100`)).map((a) => a.name),
);

let uploaded = 0;
for (const tarball of tarballs) {
  if (existing.has(tarball.file)) continue;
  await call(
    `https://uploads.github.com/repos/${repository}/releases/${release.id}/assets?name=${encodeURIComponent(tarball.file)}`,
    { method: "POST", headers: { "content-type": "application/octet-stream" }, body: readFileSync(tarball.path) },
  );
  uploaded += 1;
  console.log(`  ↑ ${tarball.file}`);
}

console.log(`[assets] ${uploaded} uploaded, ${tarballs.length - uploaded} already present`);
console.log(`[assets] https://github.com/${repository}/releases/tag/${tag}`);
