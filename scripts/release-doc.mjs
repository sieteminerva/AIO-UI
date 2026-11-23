#!/usr/bin/env node
/**
 * AIO UI — RELEASE DOC
 *
 * A release note is another template over `registry.json` — the same trick `publish-cdn.mjs` uses
 * for the branch README. This script regenerates only the **generated** half of
 * `docs/releases/v<x>.md` and leaves the human half (breaking, migration, prose) untouched.
 *
 * Two marker-bounded blocks are owned by the generator:
 *
 *   <!-- artefacts:begin/end -->   the four bundled-pair rows at the branch root
 *                                  (`registry.bundle.files`; no tarball, no exports entry)
 *   <!-- cdn-paths:begin/end -->   one row per package subpath (`registry.packages[name].subpaths`)
 *
 * Everything outside those markers is hand-written. Placing the markers is a one-time manual edit;
 * after that, only the text between them is ever rewritten.
 *
 *   node scripts/release-doc.mjs --version 0.2.4            # dry run: print both tables + counts
 *   node scripts/release-doc.mjs --version 0.2.4 --apply    # rewrite the two blocks in place
 *   node scripts/release-doc.mjs --version 0.2.4 --probe    # live check (npm run check:live)
 *   node scripts/release-doc.mjs --version 0.2.4 --readme [--apply]
 *                                                           # write the `install` block of every
 *                                                           # package README, then run
 *                                                           # `node scripts/catalogue.mjs --apply`
 *
 * Every URL is copied from `registry.base` verbatim. The generator never composes a base, so the
 * versioned-CDN decision stays a data decision: change `registry.base`, re-run `--apply`.
 *
 * The probe is a separate, callable-any-time gate (`npm run check:live`): it fetches
 * `registry.json`, the four bundled-pair files and one package tarball from the published CDN and
 * fails on any non-200, so "published" stops being a claim.
 *
 * Read-only unless `--apply` is passed. `--registry <file>` / `--note <file>` exist only so a
 * regenerated registry can be tested against a scratch copy without overwriting `releases/`.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const valueOf = (name) => {
  const index = args.indexOf(name);
  return index === -1 ? undefined : args[index + 1];
};

const version = valueOf("--version");
const apply = flag("--apply");
const probe = flag("--probe");
const readme = flag("--readme");

// The probe reads whatever version the root manifest names; the note generator demands --version so
// it can never overwrite an older note by accident.
let targetVersion = version;
if (!targetVersion && probe) {
  targetVersion = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8")).version;
}

if (!probe && (!targetVersion || !/^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/.test(targetVersion))) {
  console.error("[doc] --version <x.y.z> is required (semver, pre-release allowed)");
  process.exit(1);
}

const registryPath = valueOf("--registry") ?? (targetVersion && join("releases", `v${targetVersion}`, "registry.json"));
const notePath = valueOf("--note") ?? (targetVersion && join("docs", "releases", `v${targetVersion}.md`));

if (!registryPath || !existsSync(join(ROOT, registryPath))) {
  console.error(`[doc] no registry at ${registryPath}. Pass --registry or run release.mjs --apply first.`);
  process.exit(1);
}
const registry = JSON.parse(readFileSync(join(ROOT, registryPath), "utf8"));
const base = registry.base ?? "";
const packages = registry.packages ?? {};
const bundleFiles = registry.bundle?.files ?? [];

// ---- table rendering --------------------------------------------------------

/** Pads a column to the width of its widest cell, the shape `prettier` writes. */
function table(headers, rows) {
  const widths = headers.map((header, column) => Math.max(header.length, ...rows.map((row) => row[column].length)));
  const line = (cells) => `| ${cells.map((cell, column) => cell.padEnd(widths[column])).join(" | ")} |`;
  const rule = `| ${widths.map((width) => "-".repeat(width)).join(" | ")} |`;
  return [line(headers), rule, ...rows.map(line)].join("\n");
}

/** `./Accordion.css` → `@aio-ui/accordion/Accordion.css`; `.` → the package name. */
function specifierOf(name, key) {
  return key === "." ? name : `${name}${key.slice(1)}`;
}

/** `.` sorts first, then case-insensitive by specifier — the order the note already uses. */
const byKey = (a, b) => (a === b ? 0 : a === "." ? -1 : b === "." ? 1 : a.toLowerCase().localeCompare(b.toLowerCase()));

/** The four bundled-pair rows, URL copied from `registry.bundle.base` + the file name. */
function artefactsTable() {
  const bundleBase = registry.bundle?.base ?? base;
  // Keep `bundle.files` order (JS pair first, then CSS) — that is how release.mjs lists them.
  const rows = bundleFiles.map((file) => [`\`${file}\``, `\`${bundleBase}${file}\``]);
  return table(["File", "URL"], rows);
}

/** The package × specifier × URL table, one row per subpath of every package. */
function cdnPathsTable() {
  const rows = [];
  for (const name of Object.keys(packages).sort((a, b) => a.localeCompare(b))) {
    const entry = packages[name];
    const subpaths = entry.subpaths ?? {};
    for (const key of Object.keys(subpaths).sort(byKey)) {
      const url = `${base}${entry.dir}/${subpaths[key]}`;
      rows.push([`\`${name}\``, `\`${specifierOf(name, key)}\``, url]);
    }
  }
  return table(["Package", "Specifier", "URL"], rows);
}

const counts = (() => {
  const keys = Object.values(packages).flatMap((entry) => Object.keys(entry.subpaths ?? {}));
  const wildcard = keys.filter((key) => key.includes("*")).length;
  return { entries: keys.length, exact: keys.length - wildcard, wildcard, packages: Object.keys(packages).length };
})();

// ---- marker replacement -----------------------------------------------------

/** Replaces the text between `<!-- <name>:begin -->` and `<!-- <name>:end -->`, markers kept. */
function replaceBlock(doc, name, content) {
  const begin = `<!-- ${name}:begin -->`;
  const end = `<!-- ${name}:end -->`;
  const from = doc.indexOf(begin);
  const to = doc.indexOf(end);
  if (from === -1 || to === -1 || to < from) {
    throw new Error(`[doc] markers "${begin}" / "${end}" not found in ${notePath}`);
  }
  return `${doc.slice(0, from + begin.length)}\n${content}\n${doc.slice(to)}`;
}

// ---- README install blocks --------------------------------------------------

/** The package's main stylesheet: the CSS subpath named after the package, else the first one. */
function pickStylesheet(name, entry) {
  const keys = Object.keys(entry.subpaths ?? {})
    .filter((key) => key.endsWith(".css"))
    .sort();
  if (!keys.length) return undefined;
  const short = name
    .slice(name.lastIndexOf("/") + 1)
    .replace(/-/g, "")
    .toLowerCase();
  const match = keys.find((key) => {
    const base = key
      .slice(key.lastIndexOf("/") + 1)
      .replace(/\.css$/, "")
      .replace(/-/g, "")
      .toLowerCase();
    return base === short;
  });
  return match ?? keys[0];
}

/**
 * The `## Install` block body — package version, tarball, the CDN URL a host loads, and its
 * stylesheet. The version line matters because one tag can carry several package versions:
 * the tag says which folder, the version says which file.
 */
function installInner(name, entry) {
  const url = (subpath) => `${base}${entry.dir}/${subpath}`;
  const root = entry.subpaths?.["."];
  const css = pickStylesheet(name, entry);
  const packageVersion = entry.version ?? registry.version;
  const lines = [
    "## Install",
    "",
    `Version — \`${packageVersion}\` (tag \`v${registry.version}\`)`,
    "",
    `    npm install ${entry.tarball}`,
    "",
  ];

  if (root && root.endsWith(".js")) {
    // A real ES module: the URL the import map points at.
    lines.push(`CDN (ES module, no build step) — \`${url(root)}\``);
    if (css) lines.push(`Stylesheet — \`${url(entry.subpaths[css])}\``);
  } else if (css) {
    // No JS root (e.g. `styles`): the map a host actually loads, never a fake `import`.
    lines.push(`CDN (no build step) — \`${url(entry.subpaths[css])}\``);
  }
  return lines.join("\n");
}

/** Replaces the block in place, or inserts it before the first hand-written `##`. */
function placeInstallBlock(doc, inner) {
  if (doc.includes("<!-- install:begin -->") && doc.includes("<!-- install:end -->")) {
    return replaceBlock(doc, "install", inner);
  }
  const block = `<!-- install:begin -->\n${inner}\n<!-- install:end -->`;
  const index = doc.indexOf("\n## ");
  if (index === -1) return `${doc.replace(/\s*$/, "")}\n\n${block}\n`;
  const head = doc.slice(0, index).replace(/\s*$/, "");
  const tail = doc.slice(index); // starts with "\n## "
  return `${head}\n\n${block}\n${tail}`;
}

function runReadme() {
  const names = Object.keys(packages).sort((a, b) => a.localeCompare(b));
  const touched = [];
  for (const name of names) {
    const entry = packages[name];
    const readmePath = join(ROOT, entry.dir, "README.md");
    if (!existsSync(readmePath)) continue;
    const inner = installInner(name, entry);
    if (apply) writeFileSync(readmePath, placeInstallBlock(readFileSync(readmePath, "utf8"), inner), "utf8");
    touched.push(entry.dir);
  }
  const verb = apply ? "wrote" : "would write";
  console.log(`[readme] ${verb} install block in ${touched.length} package README(s)`);
  if (apply) console.log("[readme] now run: node scripts/catalogue.mjs --apply");
  return touched.length;
}

// ---- probe ------------------------------------------------------------------

async function runProbe() {
  const urls = [];
  if (base) urls.push(`${base}registry.json`);
  for (const file of bundleFiles) urls.push(`${registry.bundle?.base ?? base}${file}`);
  const firstPackage = Object.values(packages)[0];
  if (firstPackage?.tarball) urls.push(firstPackage.tarball);

  if (!urls.length) {
    console.error("[probe] the registry names no URL to check");
    return 1;
  }

  let failed = 0;
  for (const url of urls) {
    try {
      const response = await fetch(url, { method: "GET", redirect: "follow" });
      const state = response.ok ? "✓" : "✗";
      if (!response.ok) failed += 1;
      console.log(`${state} ${response.status} ${url}`);
    } catch (error) {
      failed += 1;
      console.log(`✗ ERR ${url} — ${error.message}`);
    }
  }
  console.log(`[probe] ${urls.length - failed}/${urls.length} live URL(s) answered 2xx`);
  return failed ? 1 : 0;
}

// ---- main -------------------------------------------------------------------

if (probe) {
  process.exitCode = await runProbe();
} else if (readme) {
  runReadme();
} else {
  const artefactRows = bundleFiles.length;
  if (!apply) {
    console.log(
      `[doc] v${targetVersion} · ${counts.packages} package(s) · ${counts.entries} row(s) ` +
        `(${counts.exact} exact + ${counts.wildcard} wildcard) · ${artefactRows} bundled-pair row(s)`,
    );
    console.log(`\n<!-- artefacts:block -->\n${artefactsTable()}\n`);
    console.log(`<!-- cdn-paths:block -->\n${cdnPathsTable()}`);
    console.log(`\n[doc] dry run — pass --apply to rewrite ${notePath}`);
  } else {
    if (!notePath || !existsSync(join(ROOT, notePath))) {
      console.error(`[doc] no note at ${notePath}. Placing the markers is a one-time manual edit.`);
      process.exit(1);
    }
    let doc = readFileSync(join(ROOT, notePath), "utf8");
    doc = replaceBlock(doc, "artefacts", artefactsTable());
    doc = replaceBlock(doc, "cdn-paths", cdnPathsTable());
    writeFileSync(join(ROOT, notePath), doc, "utf8");
    console.log(`[doc] rewrote artefacts + cdn-paths blocks in ${notePath}`);
    console.log(
      `[doc] ${counts.packages} package(s) · ${counts.entries} row(s) ` +
        `(${counts.exact} exact + ${counts.wildcard} wildcard) · ${artefactRows} bundled-pair row(s)`,
    );
  }
}
