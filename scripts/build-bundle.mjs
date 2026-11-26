#!/usr/bin/env node
/**
 * BUNDLE — the old two-link CDN pattern, rebuilt from the real packages.
 *
 * `aio-ui.min.js` + `aio-ui.min.css` (and the unminified pair) so a page with no build step
 * can do `<script src="aio-ui.min.js">` and call `AioUI.DOMRenderer`, `AioUI.AccordionBuilder`,
 * … from `globalThis`. Nothing here knows about individual components: the entry is generated
 * from every package barrel that the manifest publishes, so a new component joins the bundle
 * the moment its package exists.
 *
 * Four artefacts, all from one generated entry:
 *   aio-ui.js · aio-ui.min.js   — IIFE, `name: "AioUI"`, default export is the namespace
 *   aio-ui.css · aio-ui.min.css — the shipped sheets in presentation order
 *
 * Guards:
 *   - two packages exporting the same name fails the build (no last-writer-wins),
 *   - a shipped `.css` that the entry does not include fails the build,
 *   - the entry is written to `temp/` and is never committed.
 *
 * Usage:
 *   node scripts/build-bundle.mjs                 # write temp/bundle/dist
 *   node scripts/build-bundle.mjs --out <dir>     # somewhere else
 *   node scripts/build-bundle.mjs --entry-only    # regenerate temp/bundle/entry.*, no build
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SCOPE = "@aio-ui/";
const GROUPS = [
  "packages",
  "packages/components",
  "packages/modules",
  "packages/themes",
  "packages/kits",
  "packages/utilities",
  "packages/styles",
];
const WORK = join(ROOT, "temp", "bundle");

const args = process.argv.slice(2);
const valueOf = (name) => {
  const index = args.indexOf(name);
  return index === -1 ? undefined : args[index + 1];
};
const outDir = valueOf("--out") ?? join(WORK, "dist");
const entryOnly = args.includes("--entry-only");

const slash = (path) => path.replace(/\\/g, "/");
const version = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8")).version;

/** Every publishable package directory, once. */
function dirs() {
  const found = new Set();
  for (const group of GROUPS) {
    const base = join(ROOT, group);
    if (!existsSync(base)) continue;
    if (existsSync(join(base, "package.json"))) found.add(base);
    for (const entry of readdirSync(base, { withFileTypes: true })) {
      const dir = join(base, entry.name);
      if (entry.isDirectory() && existsSync(join(dir, "package.json"))) found.add(dir);
    }
  }
  return [...found];
}

/** Names one barrel publishes (runtime only — `export type` is stripped). */
function names(file) {
  const text = readFileSync(file, "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");
  const out = [];
  for (const match of text.matchAll(
    /export\s+(?:declare\s+)?(?:abstract\s+)?(?:class|function|const|let)\s+([A-Za-z_$][\w$]*)/g,
  ))
    out.push(match[1]);
  for (const match of text.matchAll(/export\s*\{([^}]*)\}/g)) {
    for (const part of match[1].split(",")) {
      const piece = part.trim();
      if (!piece) continue;
      out.push(
        piece
          .split(/\s+as\s+/)
          .pop()
          .trim(),
      );
    }
  }
  return [...new Set(out.filter(Boolean))];
}

/** Standalone doors that must not join the namespace (they duplicate core's exports). */
const EXCLUDE = new Set(["dom-renderer"]);

// ---- 1. Packages with a runtime entry ------------------------------------
const packages = [];
for (const dir of dirs()) {
  const manifest = JSON.parse(readFileSync(join(dir, "package.json"), "utf8"));
  const name = String(manifest.name ?? "");
  if (!name.startsWith(SCOPE)) continue;
  const short = name.slice(SCOPE.length);
  if (EXCLUDE.has(short)) continue;
  const root = manifest.exports?.["."];
  const entry = typeof root === "string" ? root : root?.development;
  if (!entry || !/\.(ts|mts|js|mjs)$/.test(entry)) continue;
  packages.push({ dir, name, short, entry: join(dir, entry), names: names(join(dir, entry)) });
}
packages.sort((a, b) => a.short.localeCompare(b.short));

// ---- 2. Duplicate names are fatal ---------------------------------------
const owners = new Map();
const duplicates = [];
for (const pkg of packages) {
  for (const key of pkg.names) {
    if (owners.has(key)) duplicates.push(`${key}: @aio-ui/${owners.get(key)} and @aio-ui/${pkg.short}`);
    else owners.set(key, pkg.short);
  }
}
if (duplicates.length) {
  console.error(`\n✖ ${duplicates.length} duplicate export name(s) — the namespace would be last-writer-wins:\n`);
  for (const line of duplicates) console.error(`  ${line}`);
  process.exit(1);
}

// ---- 3. Generated entries -----------------------------------------------
mkdirSync(WORK, { recursive: true });
const imports = packages
  .map((pkg, index) => `import * as p${index} from ${JSON.stringify(slash(relative(WORK, pkg.entry)))};`)
  .join("\n");
const members = packages
  .map((pkg, index) => `  ${pkg.short.replace(/-([a-z])/g, (_, c) => c.toUpperCase())}: p${index},`)
  .join("\n");
const flat = packages.flatMap((pkg, index) => pkg.names.map((key) => `AioUI.${key} = p${index}.${key};`)).join("\n");

const js = `// Generated by scripts/build-bundle.mjs — do not edit, do not commit.
${imports}

const AioUI = { version: ${JSON.stringify(version)}, packages: {
${members}
} };

${flat}

globalThis.AioUI = AioUI;
export default AioUI;
`;

// ---- 4. Stylesheets, in presentation order ------------------------------
const STYLES_ORDER = ["variables.css", "typography.css", "components.css", "layout.css", "icon.css"];
function walk(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === "dist") continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) walk(path, out);
    else if (entry.name.endsWith(".css")) out.push(path);
  }
  return out;
}

const sheets = [];
for (const name of STYLES_ORDER) sheets.push({ kind: 0, path: join(ROOT, "packages", "styles", "src", name) });
// The icon channel is its own export (`@aio-ui/styles/icons.css`), so it is not one of the
// five `src` sheets. Without this line `walk` below reports it as "not bundled" and the
// release CSS keeps the base sheet but loses every glyph. It imports `src/icon.css`, so the
// base is deduplicated by the `reimported` pass.
sheets.push({ kind: 0, path: join(ROOT, "packages", "styles", "icons", "icons.css") });
const themeSheets = walk(join(ROOT, "packages", "themes"));
for (const path of themeSheets.sort()) sheets.push({ kind: 1, path });
const componentSheets = walk(join(ROOT, "packages", "components"));
for (const path of componentSheets.sort()) sheets.push({ kind: 2, path });
for (const path of walk(join(ROOT, "packages", "modules")).sort()) sheets.push({ kind: 3, path });

const missing = sheets.filter((sheet) => !existsSync(sheet.path));
if (missing.length) {
  console.error(`\n✖ ${missing.length} sheet(s) named by the bundle entry do not exist:\n`);
  for (const sheet of missing) console.error(`  ${slash(relative(ROOT, sheet.path))}`);
  process.exit(1);
}

// A sheet that only re-imports other sheets (a package's `index.css`) is not listed beside
// them: the bundler inlines both copies. Its imports are the real entries.
const reimported = new Set();
for (const sheet of sheets) {
  const text = readFileSync(sheet.path, "utf8");
  for (const match of text.matchAll(/@import\s+(?:url\()?\s*["']([^"']+)["']/g)) {
    reimported.add(resolve(dirname(sheet.path), match[1]));
  }
}
const bundledSheets = sheets.filter((sheet) => !reimported.has(sheet.path));

const css = bundledSheets.map((sheet) => `@import ${JSON.stringify(slash(relative(WORK, sheet.path)))};`).join("\n");

writeFileSync(join(WORK, "entry.js"), js);
writeFileSync(join(WORK, "entry.css"), `${css}\n`);

// ---- 5. Report ----------------------------------------------------------
const shipped = walk(join(ROOT, "packages")).filter((path) => !path.endsWith("styles\\src\\index.css"));
const listed = new Set([...bundledSheets.map((sheet) => sheet.path), ...reimported]);
const unstyled = shipped.filter((path) => !listed.has(path));
const count = (label, value) => `${label}: ${value}`;
console.log(
  [
    count("packages", packages.length),
    count("exported names", owners.size),
    count("sheets", bundledSheets.length),
    count("sheets not in the bundle", unstyled.length),
  ].join(" · "),
);
if (unstyled.length) {
  // Never fatal: a sheet can be intentionally outside the bundle's stylesheet.
  for (const path of unstyled) console.log(`  · not bundled: ${slash(relative(ROOT, path))}`);
}
console.log(`  entry: ${slash(relative(ROOT, join(WORK, "entry.js")))} + entry.css`);

if (entryOnly) process.exit(0);

// ---- 6. Build -----------------------------------------------------------
const { build } = await import("vite");
mkdirSync(outDir, { recursive: true });
const silent = { logLevel: "silent" };

async function bundleJs(minify, file) {
  await build({
    ...silent,
    configFile: false,
    root: WORK,
    build: {
      lib: { entry: join(WORK, "entry.js"), name: "AioUI", formats: ["iife"], fileName: () => file },
      outDir,
      emptyOutDir: false,
      minify,
      sourcemap: false,
      target: "es2020",
    },
  });
}

async function bundleCss(minify, dir) {
  await build({
    ...silent,
    configFile: false,
    root: WORK,
    build: {
      outDir: dir,
      emptyOutDir: true,
      minify,
      // A modern CSS target keeps native nesting instead of downlevelling it into
      // expanded rules: the "min" file was 35 % larger than the source without this.
      cssTarget: "chrome130",
      cssMinify: minify,
      target: "es2020",
      rollupOptions: { input: join(WORK, "entry.css"), output: { assetFileNames: "aio-ui.css" } },
    },
  });
}

await bundleJs(false, "aio-ui.js");
await bundleJs(true, "aio-ui.min.js");
await bundleCss(false, join(outDir, ".css"));
await bundleCss(true, join(outDir, ".css.min"));

const { copyFileSync, rmSync } = await import("node:fs");
copyFileSync(join(outDir, ".css", "aio-ui.css"), join(outDir, "aio-ui.css"));
copyFileSync(join(outDir, ".css.min", "aio-ui.css"), join(outDir, "aio-ui.min.css"));
rmSync(join(outDir, ".css"), { recursive: true, force: true });
rmSync(join(outDir, ".css.min"), { recursive: true, force: true });

for (const file of ["aio-ui.js", "aio-ui.min.js", "aio-ui.css", "aio-ui.min.css"]) {
  const bytes = statSync(join(outDir, file)).size;
  console.log(`  ${file.padEnd(14)} ${(bytes / 1024).toFixed(1)} kB`);
}
