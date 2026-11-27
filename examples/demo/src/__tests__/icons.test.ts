import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { ICON_NAMES, iconClasses, parseIconNames } from "../icons";

/**
 * The icons page reads the icon channel at build time (`icons.css`), so this test guards the
 * parser: a name is the dotted tail of an `i.icon.<name>` selector, never the base rule.
 */
const SHEETS = ["packages/styles/icons/icons.css"];

describe("icon catalogue", () => {
  it("reads single- and multi-word names, first occurrence wins", () => {
    const css = [
      "i.icon { display: inline-block; }",
      "i.icon.user { mask-image: url(a); }",
      "i.icon.user.list { mask-image: url(b); }",
      "i.icon.user { mask-image: url(a); }",
    ].join("\n");

    expect(parseIconNames(css)).toEqual(["user", "user.list"]);
  });

  it("matches the styles sheets, so the list cannot drift", () => {
    const css = SHEETS.map((path) => readFileSync(join(process.cwd(), path), "utf8")).join("\n");

    expect(ICON_NAMES).toEqual(parseIconNames(css));
    expect(ICON_NAMES.length).toBeGreaterThanOrEqual(80);
  });

  it("turns a dotted name into the classes the element carries", () => {
    expect(iconClasses("user.list")).toBe("user list");
    expect(iconClasses("plus")).toBe("plus");
  });
});
