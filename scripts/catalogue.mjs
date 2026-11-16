#!/usr/bin/env node
/**
 * AIO UI — COMPONENT CATALOGUE COMPILER
 *
 * One machine-readable file out of the READMEs that already exist. The README is the contract a
 * component must write anyway (`COMPONENT-CONVENTIONS.md` §1c), so the catalogue never owns a
 * second copy of it: change the README, re-run this, done. Nothing drifts, nothing is retyped.
 *
 * What it extracts per package, without assuming any section's internal shape:
 *
 * - the H1 title and the package id inside its backticks,
 * - the lead paragraph (between H1 and the first H2),
 * - every H2 with its prose, its fenced code blocks and **every table**, each row keyed by a
 *   camelCase of its header cell. A README may hold two tables in one section or none at all.
 *
 * Usage:
 *   node scripts/catalogue.mjs            # report: what would be written, and how much
 *   node scripts/catalogue.mjs --apply    # write docs/framework/catalogue.json
 *   node scripts/catalogue.mjs --check    # exit 1 when the file is stale (runs inside `verify`)
 *
 * The compiler is deliberately dumb: it does not know what "Payload" means. That is what keeps it
 * safe when a README invents a section — the section shows up in the output instead of being
 * silently dropped. Second-pass interpretation (payload → schema) is `Builder.inspect()`'s job.
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const SCAN = join(ROOT, "packages", "components");
const OUTPUT = join(ROOT, "docs", "framework", "catalogue.json");
const FORMAT = 1;

const args = process.argv.slice(2);
const apply = args.includes("--apply");
const check = args.includes("--check");

/** `true` while inside a ``` or ~~~ fence, flipped by the fence lines themselves. */
const isFence = (line) => /^\s*(```|~~~)/.test(line);

/** `Default tag` → `defaultTag`; `Class / note` → `classNote`; `` `--x` `` → `x`. */
function cellKey(header) {
  const cleaned = header
    .replace(/[`*_]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim();
  const parts = cleaned.split(/\s+/);
  return parts
    .map((part, index) => (index === 0 ? part.toLowerCase() : part[0].toUpperCase() + part.slice(1).toLowerCase()))
    .join("");
}

/** Splits one GFM table row into cells; `\|` is a literal pipe, not a separator. */
function splitRow(line) {
  const trimmed = line.trim().replace(/^\|/, "").replace(/\|$/, "");
  const cells = [];
  let cell = "";
  for (let index = 0; index < trimmed.length; index++) {
    const char = trimmed[index];
    if (char === "\\" && trimmed[index + 1] === "|") {
      cell += "|";
      index++;
      continue;
    }
    if (char === "|") {
      cells.push(cell.trim());
      cell = "";
      continue;
    }
    cell += char;
  }
  cells.push(cell.trim());
  return cells;
}

/** A separator row: only dashes, colons and spaces. */
const isSeparator = (line) => /^\s*\|?[\s:-]*-[\s|:-]*$/.test(line) && line.includes("-");

/**
 * Reads the tables out of a block of markdown lines.
 *
 * @returns One `{ columns, rows }` per table, in document order.
 */
function readTables(lines) {
  const tables = [];
  let inFence = false;
  let current = null;

  const flush = () => {
    if (current) tables.push(current);
    current = null;
  };

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];

    if (isFence(line)) {
      inFence = !inFence;
      flush();
      continue;
    }
    if (inFence) continue;

    const looksLikeRow = line.trim().startsWith("|");
    if (!looksLikeRow) {
      flush();
      continue;
    }

    if (!current) {
      const next = lines[index + 1] ?? "";
      // A table needs its separator line right below the header.
      if (!isSeparator(next)) continue;
      current = { columns: splitRow(line), rows: [] };
      index++; // consume the separator
      continue;
    }

    const cells = splitRow(line);
    const row = {};
    current.columns.forEach((column, cellIndex) => {
      row[cellKey(column)] = cells[cellIndex] ?? "";
    });
    current.rows.push(row);
  }

  flush();
  return tables;
}

/**
 * Splits a README into a lead paragraph and H2 sections.
 *
 * Fence-aware because a README legitimately prints `## heading` as example source
 * (`markdown`, `code-block`) — splitting on that would cut a section in half.
 */
function parseReadme(text) {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const sections = [];
  const lead = [];
  let title = "";
  let current = null;
  let inFence = false;

  for (const line of lines) {
    if (isFence(line)) {
      inFence = !inFence;
      (current ? current.lines : lead).push(line);
      continue;
    }

    if (!inFence) {
      if (!title && /^#\s+/.test(line)) {
        title = line.replace(/^#\s+/, "").trim();
        continue;
      }
      if (/^##\s+/.test(line)) {
        if (current) sections.push(current);
        current = { heading: line.replace(/^##\s+/, "").trim(), lines: [] };
        continue;
      }
    }

    (current ? current.lines : lead).push(line);
  }
  if (current) sections.push(current);

  return { title, lead: lead.join("\n").trim(), sections };
}

/** Turns one section's raw lines into prose + examples + tables. */
function readSection(section) {
  const prose = [];
  const examples = [];
  let inFence = false;
  let fenceLang = "";
  let buffer = [];

  for (const line of section.lines) {
    if (isFence(line)) {
      if (!inFence) {
        inFence = true;
        fenceLang = line.trim().replace(/^(```|~~~)\s*/, "");
        buffer = [];
      } else {
        inFence = false;
        examples.push({ lang: fenceLang, code: buffer.join("\n") });
      }
      continue;
    }
    if (inFence) buffer.push(line);
    else if (line.trim().startsWith("|"))
      continue; // tables are read separately
    else prose.push(line);
  }

  return {
    text: prose
      .join("\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim(),
    examples,
    tables: readTables(section.lines),
  };
}

/** The package id a README claims in its H1 backticks, e.g. `Accordion (`@aio-ui/accordion`)`. */
function claimedId(title) {
  const match = title.match(/`(@aio-ui\/[^`]+)`/);
  return match ? match[1] : null;
}

/** Every README under `packages/components`, at any depth, as absolute paths. */
function readmes(dir) {
  const found = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) found.push(...readmes(full));
    else if (entry.toLowerCase() === "readme.md") found.push(full);
  }
  return found;
}

/**
 * Compiles every component README into one catalogue document.
 *
 * @returns `{ document, problems }` — problems never stop the build; they are reported so a broken
 *   README is visible in `--check` output instead of quietly producing a thin entry.
 */
function compile() {
  const problems = [];
  const entries = [];

  for (const file of readmes(SCAN).sort()) {
    const dir = file.replace(/[\\/]README\.md$/i, "");
    const folder = dir.split(/[\\/]/).pop();
    // The manifest is the authority; the README H1 is prose and has drifted before
    // (`fabmenu`, `pricingcard` both named a package that does not exist). A mismatch is
    // reported, never silently adopted.
    let packageName = `@aio-ui/${folder}`;
    try {
      packageName = JSON.parse(readFileSync(join(dir, "package.json"), "utf8")).name || packageName;
    } catch {
      problems.push(`${folder}: no readable package.json — falling back to the folder name`);
    }
    const doc = parseReadme(readFileSync(file, "utf8"));

    if (!doc.title) problems.push(`${folder}: no H1 title`);
    const claimed = claimedId(doc.title);
    if (!claimed) problems.push(`${folder}: H1 does not name the package in backticks`);
    else if (claimed !== packageName) {
      problems.push(`${folder}: H1 says "${claimed}", package.json says "${packageName}"`);
    }

    const entry = {
      package: packageName,
      title: (doc.title || folder).replace(/\s*\(`@aio-ui\/[^`]+`\)\s*$/, "").trim(),
      lead: doc.lead,
      sections: {},
    };

    for (const section of doc.sections) {
      entry.sections[section.heading] = readSection(section);
    }

    entries.push(entry);
  }

  const document = {
    $comment:
      "Generated by `node scripts/catalogue.mjs --apply` from packages/components/**/README.md. " +
      "Never edit by hand — edit the README and re-run. `--check` fails when this file is stale.",
    format: FORMAT,
    source: "packages/components/**/README.md",
    packages: Object.fromEntries(entries.map((entry) => [entry.package.replace("@aio-ui/", ""), entry])),
  };

  return { document, problems };
}

const { document, problems } = compile();
const serialized = `${JSON.stringify(document, null, 2)}\n`;
const names = Object.keys(document.packages);

let existing = null;
try {
  existing = readFileSync(OUTPUT, "utf8");
} catch {
  existing = null;
}

/**
 * Whether the file on disk still says what the READMEs say.
 *
 * Compared on **content**, not bytes: a formatter that re-indents the file has not changed the
 * catalogue, and a gate that fails on whitespace trains people to ignore it. Key order is
 * preserved by `JSON.parse`, so a real reordering still counts as drift.
 */
function isStale(existing, serialized) {
  if (existing === null) return true;
  if (existing === serialized) return false;
  try {
    return JSON.stringify(JSON.parse(existing)) !== JSON.stringify(JSON.parse(serialized));
  } catch {
    return true; // unparseable = definitely not what we would write
  }
}

const stale = isStale(existing, serialized);

if (check) {
  for (const problem of problems) console.error(`[catalogue] ${problem}`);
  if (stale) {
    console.error(`[catalogue] docs/framework/catalogue.json is stale — run "node scripts/catalogue.mjs --apply".`);
    process.exit(1);
  }
  console.log(
    `[catalogue] ${names.length} package(s) match their READMEs${problems.length ? `, ${problems.length} warning(s)` : ""}`,
  );
  process.exit(0);
}

for (const problem of problems) console.warn(`[catalogue] ${problem}`);

if (apply) {
  writeFileSync(OUTPUT, serialized);
  console.log(
    `[catalogue] wrote ${relative(ROOT, OUTPUT)} — ${names.length} package(s), ${(serialized.length / 1024).toFixed(1)} kB`,
  );
} else {
  console.log(`[catalogue] dry run — ${names.length} package(s), ${(serialized.length / 1024).toFixed(1)} kB`);
  console.log(`[catalogue] would write ${relative(ROOT, OUTPUT)}${stale ? " (changes)" : " (no changes)"}`);
  if (stale) console.log(`[catalogue] pass --apply to write`);
}
