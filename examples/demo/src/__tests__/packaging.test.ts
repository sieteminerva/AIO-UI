/**
 * The packaging contract.
 *
 * `scripts/build-pack.mjs` rewrites every manifest, and two of its promises are visible to a
 * consumer rather than to this repo:
 *
 * 1. a stylesheet subpath must answer TypeScript. Without a declaration, `import
 *    "@aio-ui/accordion/Accordion.css"` is TS2882 in a plain Vite project — the error this
 *    contract exists to prevent — because `vite/client` declares `*.css` only inside a project
 *    that opted into it.
 * 2. the hydration mockup (`@aio-ui/skeleton`) must arrive **once**, with `@aio-ui/base`, not
 *    repeated by every component package.
 *
 * Both are manifest facts, so they are testable without building anything.
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const GROUPS = ["packages", "packages/components", "packages/modules", "packages/themes", "packages/kits"];

interface Manifest {
  name: string;
  exports?: Record<string, unknown>;
  dependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
}

/** Every package directory, as `{ dir, manifest }`. */
function packages(): Array<{ dir: string; manifest: Manifest }> {
  const found: Array<{ dir: string; manifest: Manifest }> = [];
  for (const group of GROUPS) {
    for (const entry of readdirSync(join(ROOT, group), { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const dir = join(ROOT, group, entry.name);
      const file = join(dir, "package.json");
      if (!existsSync(file)) continue;
      found.push({ dir, manifest: JSON.parse(readFileSync(file, "utf8")) as Manifest });
    }
  }
  return found;
}

/** The file an `exports` value points at, whatever shape it is in. */
function fileOf(value: unknown): string | null {
  if (typeof value === "string") return value;
  if (value && typeof value === "object") return (value as { default?: string }).default ?? null;
  return null;
}

describe("stylesheet exports", () => {
  const all = packages();
  const sheets = all.flatMap(({ dir, manifest }) =>
    Object.entries(manifest.exports ?? {})
      .filter(([, value]) => fileOf(value)?.endsWith(".css"))
      .map(([subpath, value]) => ({ dir, manifest, subpath, value })),
  );

  it("finds every shipped sheet", () => {
    expect(sheets.length).toBeGreaterThanOrEqual(20);
  });

  for (const { dir, manifest, subpath, value } of sheets) {
    const sheet = fileOf(value) as string;

    it(`${manifest.name}${subpath === "." ? "" : subpath} — names its declaration`, () => {
      expect(value).toEqual({ types: `${sheet}.d.ts`, default: sheet });
      expect(subpath.startsWith(".")).toBe(true);
    });

    it(`${manifest.name}${subpath === "." ? "" : subpath} — the declaration exists`, () => {
      const declaration = join(dir, `${sheet.replace(/^\.\//, "")}.d.ts`);
      expect(existsSync(declaration)).toBe(true);
      expect(readFileSync(declaration, "utf8")).toMatch(/export\s*\{\s*\}/);
    });
  }
});

describe("the skeleton install edge", () => {
  const all = packages();

  it("@aio-ui/base installs it", () => {
    const base = all.find((entry) => entry.manifest.name === "@aio-ui/base");
    expect(base?.manifest.dependencies?.["@aio-ui/skeleton"]).toBeTypeOf("string");
  });

  it("no component repeats it", () => {
    const owners = new Set(["@aio-ui/base", "@aio-ui/skeleton"]);
    const offenders = all
      .filter((entry) => !owners.has(entry.manifest.name))
      .filter((entry) =>
        ["dependencies", "peerDependencies"].some((field) =>
          Object.keys((entry.manifest as Record<string, Record<string, string> | undefined>)[field] ?? {}).includes(
            "@aio-ui/skeleton",
          ),
        ),
      )
      .map((entry) => entry.manifest.name);

    expect(offenders).toEqual([]);
  });
});
