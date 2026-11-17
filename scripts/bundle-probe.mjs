#!/usr/bin/env node
/**
 * Bundle gate — proves the opt-in stacks are absent from the module graph.
 *
 * A doc claim is not proof: "unused adapters are never compiled" only holds if a real
 * bundler, resolving through the real `exports` maps, never parses those files. So this
 * gate runs Vite on four tiny entries and records every module `moduleParsed` reports —
 * ids, not bundle text (a minifier, a comment or a coincidental identifier cannot lie
 * about an id).
 *
 * Direction matters, and both are checked:
 *
 *   - **negative** — `@aio-ui/form` root does not parse the five form adapters and the
 *     four input modules, `@aio-ui/input` root does not parse the four input sub-modules;
 *   - **positive** — `@aio-ui/form/adapters` parses **all nine** (it is the full stack: one
 *     import, whole form) and `@aio-ui/input/modules` parses its four, so the negative
 *     cases cannot be green merely because nothing resolved.
 *
 * A build that produces no parsed module is a failure, not a pass.
 *
 * Usage: `npm run check:bundle` (part of `npm run check`)
 */

import { build } from "vite";
import { join, sep } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(fileURLToPath(import.meta.url), "..", "..");
/** Repository root with POSIX separators: module ids from Vite always use `/`. */
const ROOT_POSIX = ROOT.split(sep).join("/");
const ENTRIES = join(ROOT, "scripts", "bundle-probe");
const OUT = join(ROOT, ".draft", "bundle-probe", "out");

const FORM_ADAPTERS = [
  "packages/components/form/adapters/Calculation.ts",
  "packages/components/form/adapters/Cascade.ts",
  "packages/components/form/adapters/Multistep.ts",
  "packages/components/form/adapters/Validation.ts",
  "packages/components/form/Input.FormAdapter.ts",
];

const INPUT_MODULES = [
  "packages/components/input/Dropdown/Dropdown.InputModule.ts",
  "packages/components/input/FileUploader/FileUploader.InputModule.ts",
  "packages/components/input/InputControls/InputControls.InputModule.ts",
  "packages/components/input/Popover.InputModule.ts",
];

/** What each entry must and must not pull in. */
const CASES = [
  {
    name: "form-root",
    entry: "form-root.ts",
    present: ["packages/components/form/Form.ts", "packages/components/form/FormRegistry.ts"],
    // Not one adapter, and not the field adapter either: a form with no modules is a form
    // that refuses to render, which is why the root can be this light.
    absent: [...FORM_ADAPTERS, ...INPUT_MODULES],
  },
  {
    name: "input-root",
    entry: "input-root.ts",
    present: ["packages/components/input/Input.ts"],
    absent: INPUT_MODULES,
  },
  {
    name: "form-full",
    entry: "form-full.ts",
    // Nine: the form's own five, then the four the fields need. One import is the whole
    // stack, which is only true if all nine are actually in the graph.
    present: [...FORM_ADAPTERS, ...INPUT_MODULES],
    absent: [],
  },
  {
    name: "input-full",
    entry: "input-full.ts",
    present: INPUT_MODULES,
    absent: [],
  },
];

/** Absolute module id → repository-relative POSIX path, query and drive letter removed. */
function toRepoPath(id) {
  const clean = id.split("?")[0].split(sep).join("/");
  if (!clean.startsWith(`${ROOT_POSIX}/`)) return null;
  return clean.slice(ROOT_POSIX.length + 1);
}

/** Builds one entry and returns the repository paths the bundler parsed. */
async function parsedModules(testCase) {
  const seen = new Set();

  /** Records one absolute module id, resolved to a repository path when it is ours. */
  const collect = (id) => {
    if (typeof id !== "string") return;
    const path = toRepoPath(id);
    if (path) seen.add(path);
  };

  /**
   * The probe itself: every id Vite hands to `transform`/`load` is a module the build
   * actually read — that is the graph, and it does not depend on a bundler's optional
   * hooks (Vite 8 no longer fires Rollup's `moduleParsed`).
   */
  const probePlugin = {
    name: "bundle-probe",
    enforce: "pre",
    load(id) {
      collect(id);
      return null;
    },
    transform(_code, id) {
      collect(id);
      return null;
    },
  };

  await build({
    plugins: [probePlugin],
    configFile: false,
    root: ROOT,
    logLevel: "silent",
    // A published consumer resolves `dist`; this gate must read source, so the same
    // `development` condition the repo's tsconfig uses is requested explicitly.
    resolve: { conditions: ["development", "browser", "module", "production", "default"] },
    build: {
      write: true,
      emptyOutDir: true,
      outDir: join(OUT, testCase.name),
      target: "esnext",
      minify: false,
      lib: { entry: join(ENTRIES, testCase.entry), formats: ["es"], fileName: testCase.name },
    },
  });

  return [...seen];
}

const failures = [];
let total = 0;

for (const testCase of CASES) {
  const files = await parsedModules(testCase);
  total += files.length;

  if (!files.length) {
    failures.push(`${testCase.name}: the build parsed no module at all — the probe would be vacuous`);
    continue;
  }

  for (const path of testCase.present) {
    if (!files.includes(path)) failures.push(`${testCase.name}: expected ${path} in the graph, it is missing`);
  }
  for (const path of testCase.absent) {
    if (files.includes(path)) failures.push(`${testCase.name}: ${path} was parsed but must stay out of this graph`);
  }

  if (failures.length) {
    // Make a failure diagnosable without re-running anything.
    const missing = testCase.present.filter((path) => !files.includes(path));
    const leaked = testCase.absent.filter((path) => files.includes(path));
    if (missing.length || leaked.length) {
      console.error(`\n${testCase.name} parsed ${files.length} module(s):`);
      for (const file of files.sort()) console.error(`  ${file}`);
    }
  }
}

if (failures.length) {
  console.error("");
  for (const failure of failures) console.error(`✗ ${failure}`);
  console.error(`\n${failures.length} failure(s). The opt-in split is not real until this is green.`);
  process.exit(1);
}

console.log(`✓ bundle-probe: ${CASES.length} entries, ${total} parsed module(s); opt-in stacks stay out of the roots`);
