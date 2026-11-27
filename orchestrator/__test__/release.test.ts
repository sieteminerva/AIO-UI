/**
 * RELEASE CHECK — the artefacts must describe a site that can actually load.
 *
 * Skipped when `releases/v<version>/` is absent (a clean checkout has no
 * artefacts — the folder lives in the orphan-branch worktree, gitignored on `main`).
 * Produce them first:
 *
 *   node scripts/release.mjs --version 0.1.0 --apply
 *
 * Three questions this answers, in order:
 * 1. Does the registry describe every workspace package, barrels included?
 * 2. Does every JS subpath, tarball and checksum point at a real file?
 * 3. Is the barrel import closed? `@aio-ui/frameworks` re-exports bare
 *    specifiers (`@aio-ui/core`, …); if one is missing from the import map the
 *    browser stops at the barrel even though the site "looks" generated.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { beforeAll, describe, expect, it } from "vitest";
import { createCdnResolver, emitPlan } from "../src/emit.ts";
import type { PackageLayout } from "../src/emit.ts";
import { generateSite } from "../src/generate.ts";
import { plan } from "../src/plan.ts";
import { pageRequires } from "../src/runtime.ts";
import { galleryScenario, storeScenario } from "./scenarios.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..", "..");
const WORKSPACE_VERSION = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8")).version as string;
const RELEASE = join(ROOT, "releases", `v${WORKSPACE_VERSION}`);
const available = existsSync(join(RELEASE, "registry.json"));

/**
 * Blanks out comments before a specifier scan.
 *
 * `tsc` copies doc blocks into `dist`, and a README-style example inside one —
 * `import { FORM_ADAPTER_DEFINITIONS } from "@aio-ui/form"` — is documentation,
 * not an import edge. Matching it would demand an import-map key for a file nobody loads
 * through that specifier, which is a false positive, not a finding.
 */
function stripComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:])\/\/[^\n]*/g, "$1");
}

interface RegistryEntry {
  dir: string;
  subpaths: Record<string, string>;
  tarball: string;
  integrity?: string;
  /** The package's own version; absent in a registry written before b66. */
  version?: string;
}

interface Registry {
  version: string;
  base: string;
  packages: Record<string, RegistryEntry>;
  /** The four `aio-ui{,.min}.{js,css}` files published at the branch root, when present. */
  bundle?: {
    files: string[];
    /** The glyph folder the bundled sheet links, when present (b110 onwards). */
    imgs?: { folder: string; count: number; sample: string };
  };
}

/** Aggregators whose `export *` makes the import map a closure, not a list. */
const BARRELS = ["@aio-ui/themes"];

/** The directories `scripts/release.mjs` treats as publishable sections. */
const SECTIONS = [
  "packages",
  "packages/components",
  "packages/modules",
  "packages/themes",
  "packages/kits",
  "packages/utilities",
  "packages/styles",
];

/**
 * Every `@aio-ui/*` package the workspace declares.
 *
 * Derived rather than counted: a hardcoded total turns `code-block` into a failing test the
 * day it is added, which is the opposite of what this check is for.
 */
function workspacePackages(): string[] {
  const names: string[] = [];
  for (const section of SECTIONS) {
    const dir = join(ROOT, section);
    if (!existsSync(dir)) continue;
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const manifest = join(dir, entry.name, "package.json");
      if (!existsSync(manifest)) continue;
      const name = JSON.parse(readFileSync(manifest, "utf8")).name as string | undefined;
      if (name?.startsWith("@aio-ui/")) names.push(name);
    }
  }
  return names;
}

describe.skipIf(!available)("release artefacts", () => {
  // Read inside `beforeAll`: a `describe` body runs even when the suite is skipped, so a
  // top-level `readFileSync` here would throw during collection on a clean checkout and take
  // the whole run down instead of skipping.
  let registry: Registry;
  let layout: PackageLayout;
  let base: string;

  beforeAll(() => {
    registry = JSON.parse(readFileSync(join(RELEASE, "registry.json"), "utf8")) as Registry;
    layout = JSON.parse(readFileSync(join(RELEASE, "layout.json"), "utf8")) as PackageLayout;
    base = registry.base.endsWith("/") ? registry.base : `${registry.base}/`;
  });

  /** URL under the release base → repo-relative path. */
  const repoPath = (url: string): string => join(ROOT, url.slice(base.length));

  it("describes every workspace package, barrels included", () => {
    expect(Object.keys(registry.packages).sort()).toEqual(workspacePackages().sort());
    for (const name of BARRELS) expect(registry.packages[name], name).toBeDefined();
  });

  it("points every subpath and tarball at a real file", () => {
    const missing: string[] = [];
    for (const [name, entry] of Object.entries(registry.packages)) {
      for (const [subpath, file] of Object.entries(entry.subpaths)) {
        // Wildcard exports describe a pattern, not a file.
        if (file.includes("*")) continue;
        // The published tree sits at the `releases` worktree root (what the CDN serves); the
        // source tree is the fallback for artefacts regenerated but not yet published. They
        // diverge the moment a sheet is renamed on `main` — `v0.2.6` ships `input.css` while
        // the source carries `Input.css` — and that is not a broken release.
        const served = join(ROOT, "releases", entry.dir, file);
        const source = join(ROOT, entry.dir, file);
        if (!existsSync(served) && !existsSync(source)) {
          missing.push(`${name}${subpath === "." ? "" : `/${subpath}`} → ${entry.dir}/${file}`);
        }
      }
      const tarball = entry.tarball.split("/").pop();
      if (tarball && !existsSync(join(RELEASE, tarball))) missing.push(`${name} tarball ${tarball}`);
    }
    expect(missing).toEqual([]);
  });

  it("matches every tarball against checksums.txt", () => {
    const lines = readFileSync(join(RELEASE, "checksums.txt"), "utf8").trim().split("\n");
    const tarballs = Object.values(registry.packages).map((entry) => entry.tarball.split("/").pop());
    const expected = [...tarballs, ...(registry.bundle?.files ?? [])];
    expect(lines).toHaveLength(expected.length);

    const bad: string[] = [];
    for (const line of lines) {
      const [hash, file] = line.trim().split(/\s+/);
      const actual = createHash("sha256").update(readFileSync(join(RELEASE, file))).digest("hex");
      if (actual !== hash) bad.push(file);
    }
    expect(bad).toEqual([]);
  });

  it("ships the bundled sheet's glyphs beside it, as links", () => {
    // The sheet links (`url("./imgs/x.svg")`), it never inlines, so the folder has to travel
    // with the four bundle files — otherwise every icon 404s at the branch root. This is the
    // artefact-level half of the guard `build-bundle.mjs` runs on the freshly built file.
    const imgs = registry.bundle?.imgs;
    if (!imgs) return; // a registry written before b110 records no folder
    const folder = join(RELEASE, imgs.folder);
    expect(existsSync(join(folder, imgs.sample)), `sample glyph ${imgs.sample}`).toBe(true);
    expect(readdirSync(folder).filter((name) => name.endsWith(".svg"))).toHaveLength(imgs.count);

    const problems: string[] = [];
    for (const file of ["aio-ui.css", "aio-ui.min.css"]) {
      const path = join(RELEASE, file);
      if (!existsSync(path)) continue;
      const text = readFileSync(path, "utf8");
      const links = [...text.matchAll(/url\((["']?)([^"')]+)\1\)/g)].map((match) => match[2]);
      // Authored `data:` glyphs (the spinner, a select arrow) stay as written; a link to a
      // *file* must resolve beside the stylesheet, never at a domain root.
      const linked = links.filter((link) => !/^(data:|[a-z]+:|#)/i.test(link));
      for (const link of linked) if (!existsSync(join(RELEASE, link))) problems.push(`${file}: ${link}`);
      if (!linked.length) problems.push(`${file}: no relative glyph link at all`);
    }
    expect(problems).toEqual([]);
  });

  it("names every tarball after its own package version", () => {
    // One tag, one version per package (Option A): the folder carries the tag, the filename the
    // package version. A registry written before b66 records no `version`, so the tag is the
    // package version by definition and the assertion still holds.
    const bad: string[] = [];
    for (const [name, entry] of Object.entries(registry.packages)) {
      const file = entry.tarball.split("/").pop();
      const version = entry.version ?? registry.version;
      const short = name.slice("@aio-ui/".length);
      if (file !== `aio-ui-${short}-${version}.tgz`) bad.push(`${name} → ${file} (expected ${version})`);
    }
    expect(bad).toEqual([]);
  });

  it("keeps an unchanged package's bytes identical to the previous release", () => {
    // Semver order over `release/V*`: the newest folder that is not the current tag is the one
    // a reuse-copy reads from. Absent in a fresh checkout, so the test proves nothing there.
    const folders = readdirSync(join(ROOT, "releases"), { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && /^v\d+\.\d+\.\d+/.test(entry.name))
      .map((entry) => entry.name)
      .filter((name) => name !== `v${WORKSPACE_VERSION}`)
      .filter((name) => existsSync(join(ROOT, "releases", name, "registry.json")))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    if (!folders.length) return;

    const previousDir = folders[folders.length - 1];
    const previous = JSON.parse(readFileSync(join(ROOT, "releases", previousDir, "registry.json"), "utf8")) as Registry;
    const hashOf = (path: string) => createHash("sha256").update(readFileSync(path)).digest("hex");

    const bad: string[] = [];
    for (const [name, entry] of Object.entries(registry.packages)) {
      // No recorded version (pre-b66 registry) or the version moved: a repack is expected.
      if (!entry.version) continue;
      const before = previous.packages[name];
      if (!before?.version || before.version !== entry.version) continue;
      const file = entry.tarball.split("/").pop()!;
      const beforeFile = before.tarball.split("/").pop()!;
      const beforePath = join(ROOT, "releases", previousDir, beforeFile);
      if (!existsSync(beforePath)) continue;
      if (hashOf(join(RELEASE, file)) !== hashOf(beforePath)) bad.push(`${name}@${entry.version}`);
    }
    // A vacuous pass is honest here: a pre-b66 registry records no version, so nothing matches.
    expect(bad).toEqual([]);
  });

  for (const [label, preset] of [
    ["gallery", galleryScenario.preset],
    ["store", storeScenario.preset],
  ] as const) {
    describe(`${label} site import map`, () => {
      // Same rule as the suite above: collection must not touch the artefacts.
      let site: ReturnType<typeof emitPlan>;

      beforeAll(() => {
        site = emitPlan(plan(preset), createCdnResolver({ base, layout }));
      });

      it("resolves every mapped specifier to a real file", () => {
        const missing = Object.entries(site.importMap.imports)
          .filter(([, url]) => url.startsWith(base))
          .filter(([, url]) => !existsSync(repoPath(url)));
        expect(missing).toEqual([]);
      });

      it("keeps every mapped barrel import closed", () => {
        const barrels = BARRELS.filter((name) => site.importMap.imports[name]);
        for (const name of barrels) {
          const source = stripComments(readFileSync(repoPath(site.importMap.imports[name]), "utf8"));
          const imports = [...source.matchAll(/from\s+["'](@aio-ui\/[^"']+)["']/g)].map((match) => match[1]);
          expect(imports.length, `${name} must re-export something`).toBeGreaterThan(0);

          const missing = imports.filter((specifier) => !(specifier in site.importMap.imports));
          expect(missing, `${name} leaves a bare import unmapped`).toEqual([]);
        }
        // A site that maps no barrel at all is fine (0.2.4 removed `@aio-ui/frameworks`),
        // but the transitive closure below still proves the map is complete.
      });

      it("closes every bare import reachable from the mapped files", () => {
        // A prefix alone cannot add `.js`: `@aio-ui/utilities`
        // would become `…/dist/AttributeUtils` and 404. Every bare subpath used
        // by a loaded module must therefore have an exact entry.
        //
        // Comments are stripped first: a doc block that shows `import { X } from
        // "@aio-ui/…"` is documentation, not an edge, and `tsc` keeps it in `dist`.
        const seen = new Set<string>();
        const pending = Object.values(site.importMap.imports).filter(
          (url) => url.startsWith(base) && url.endsWith(".js"),
        );
        const missing: string[] = [];

        while (pending.length) {
          const url = pending.pop()!;
          if (seen.has(url)) continue;
          seen.add(url);

          const source = stripComments(readFileSync(repoPath(url), "utf8"));
          for (const [, specifier] of source.matchAll(/(?:from\s*|import\s*\(\s*)["'](@aio-ui\/[^"']+)["']/g)) {
            const exact = site.importMap.imports[specifier];
            if (exact) {
              if (exact.startsWith(base) && exact.endsWith(".js")) pending.push(exact);
              continue;
            }
            const hasSubpath = specifier.split("/").length > 2;
            // Bare roots and extensionless subpaths both need an exact key.
            if (!hasSubpath || !/\.[a-z]+$/i.test(specifier)) missing.push(specifier);
          }
        }

        expect(missing).toEqual([]);
        expect(seen.size).toBeGreaterThan(10);
      });

      it("resolves every prefix to a directory that exists", () => {
        const missing = Object.entries(site.importMap.imports)
          .filter(([key]) => key.endsWith("/"))
          .filter(([, url]) => !existsSync(repoPath(url)));
        expect(missing).toEqual([]);
      });

      it("registers and maps every component a page requires", () => {
        // A requirement is what the emitted page definition preloads. If the word has no
        // registration the build is a no-op; if its specifier is not in the import map the
        // browser cannot fetch it. Both surface as a blank element, not as a 404 in CI.
        const missing: string[] = [];

        for (const page of pageRequires(preset)) {
          for (const word of page.requires) {
            const binding = site.bindings.find((entry) => entry.word === word);
            if (!binding) {
              missing.push(`${page.route}: "${word}" has no registration`);
              continue;
            }
            if (!(binding.specifier in site.importMap.imports)) {
              missing.push(`${page.route}: "${word}" → ${binding.specifier} is not in the import map`);
            }
          }
        }

        expect(missing).toEqual([]);
      });
    });
  }

  it("writes a locally servable copy of both sites", () => {
    // The real smoke test: serve the repo root at :5300, open `/temp/smoke/<site>/`.
    const localBase = "http://localhost:5300/";
    const resolver = createCdnResolver({ base: localBase, layout });
    const out = join(ROOT, "temp", "smoke");

    for (const [label, preset] of [
      ["gallery", galleryScenario.preset],
      ["store", storeScenario.preset],
    ] as const) {
      rmSync(join(out, label), { recursive: true, force: true });
      const generated = generateSite({ preset, resolver });
      for (const [file, content] of Object.entries(generated.files)) {
        const target = join(out, label, file);
        mkdirSync(dirname(target), { recursive: true });
        writeFileSync(target, content, "utf8");
      }
    }

    expect(existsSync(join(out, "gallery", "index.html"))).toBe(true);
    expect(existsSync(join(out, "store", "app.js"))).toBe(true);
  });

  // The real gate: assets come from the published tag, not the repo mirror.
  // Run with SMOKE_BASE=https://cdn.jsdelivr.net/gh/<owner>/<repo>@v<version>/.
  const cdnBase = process.env.SMOKE_BASE;
  it.skipIf(!cdnBase)("writes a copy that loads from the tagged CDN", () => {
    const resolver = createCdnResolver({ base: cdnBase!, layout });
    const out = join(ROOT, "temp", "cdn-smoke");

    for (const [label, preset] of [
      ["gallery", galleryScenario.preset],
      ["store", storeScenario.preset],
    ] as const) {
      rmSync(join(out, label), { recursive: true, force: true });
      const generated = generateSite({ preset, resolver });
      for (const [file, content] of Object.entries(generated.files)) {
        const target = join(out, label, file);
        mkdirSync(dirname(target), { recursive: true });
        writeFileSync(target, content, "utf8");
      }
    }

    expect(existsSync(join(out, "store", "index.html"))).toBe(true);
  });
});
