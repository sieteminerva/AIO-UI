import { describe, expect, it } from "vitest";

import { DEFAULT_ROW_COLUMNS, MAX_ROW_COLUMNS, WIDE_FULL, childWideOf, columnsOf, declaredColumns, declaredWideOf, wideOf } from "../FormLayout";

/**
 * Row arithmetic, without a DOM. `wide` is a percentage of the row — one way to size a
 * field — and `column` is only the cap on items per line. Both are numbers, so they are
 * pinned here before the renderer touches them.
 */
describe("columnsOf", () => {
  it("defaults to two columns", () => {
    expect(columnsOf(undefined)).toBe(DEFAULT_ROW_COLUMNS);
    expect(columnsOf(null)).toBe(DEFAULT_ROW_COLUMNS);
    expect(columnsOf("abc")).toBe(DEFAULT_ROW_COLUMNS);
  });

  it("rounds and clamps into a usable range", () => {
    expect(columnsOf(3)).toBe(3);
    expect(columnsOf("4")).toBe(4);
    expect(columnsOf(0)).toBe(1);
    expect(columnsOf(-2)).toBe(1);
    expect(columnsOf(99)).toBe(MAX_ROW_COLUMNS);
    expect(columnsOf(2.4)).toBe(2);
  });
});

describe("wideOf", () => {
  it("reads a number as a percentage of the row", () => {
    expect(wideOf(20)).toBe(20);
    expect(wideOf(40)).toBe(40);
    expect(wideOf(50)).toBe(50);
    expect(wideOf(100)).toBe(100);
  });

  it("reads the same percentage written with a sign", () => {
    expect(wideOf("20%")).toBe(20);
    expect(wideOf("40%")).toBe(40);
    expect(wideOf(" 66% ")).toBe(66);
  });

  it("reads a fraction as a share of the row", () => {
    expect(wideOf(0.5)).toBe(50);
    expect(wideOf(0.25)).toBe(25);
    expect(wideOf(1)).toBe(100);
  });

  it('gives "auto" and "full" the whole row', () => {
    expect(wideOf("auto")).toBe(WIDE_FULL);
    expect(wideOf("full")).toBe(WIDE_FULL);
  });

  it("means the whole row when nothing usable is written", () => {
    expect(wideOf(undefined)).toBe(WIDE_FULL);
    expect(wideOf(null)).toBe(WIDE_FULL);
    expect(wideOf("abc")).toBe(WIDE_FULL);
    expect(wideOf(0)).toBe(WIDE_FULL);
    expect(wideOf(300)).toBe(WIDE_FULL);
  });
});

describe("declaredColumns", () => {
  it("separates a row (always a grid) from a group (opt-in)", () => {
    expect(declaredColumns({ column: 2 })).toBe(2);
    expect(declaredColumns({ column: "3" })).toBe(3);
    expect(declaredColumns({ group: [] })).toBe(0);
    expect(declaredColumns({ column: "" })).toBe(0);
    expect(declaredColumns(undefined)).toBe(0);
  });
});

describe("childWideOf", () => {
  it("reads wide from config first, then from the node", () => {
    expect(childWideOf({ config: { wide: 50 } })).toBe(50);
    expect(childWideOf({ wide: "auto" })).toBe(WIDE_FULL);
  });

  it("gives the whole row to a child that says nothing", () => {
    expect(childWideOf({ content: { type: "text" } })).toBe(WIDE_FULL);
    expect(childWideOf("raw html")).toBe(WIDE_FULL);
  });
});

describe("declaredWideOf", () => {
  it("says `null` when the child declares nothing", () => {
    // `null` is not 100: a container with `column` gives the child an equal slice.
    expect(declaredWideOf({ content: { type: "text" } })).toBeNull();
    expect(declaredWideOf({ wide: "" })).toBeNull();
    expect(declaredWideOf("raw html")).toBeNull();
    expect(declaredWideOf(undefined)).toBeNull();
  });

  it("keeps an explicit word — `auto` included", () => {
    expect(declaredWideOf({ config: { wide: 30 } })).toBe(30);
    expect(declaredWideOf({ wide: "auto" })).toBe(WIDE_FULL);
    expect(declaredWideOf({ wide: 0.5 })).toBe(50);
  });
});
