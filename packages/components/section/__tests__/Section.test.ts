// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";

import { SectionBuilder } from "../Section";
import { DEFAULT_SELECTORS, ELEMENT_KEYS } from "../Section.kit";
import { normalizeColumns } from "../Section.engine";

/**
 * `Section` accepts two nested shapes plus a flat one, which is exactly the kind of
 * thing that silently rots. These tests lock the shapes and the key/selector pairing.
 */

describe("Section columns", () => {
  it("reads the documented column-of-blocks shape", () => {
    const columns = normalizeColumns([
      { className: "column half", content: [{ eyebrow: "E", title: "T" }] },
      { content: [{ imageUrl: "x.png" }] },
    ]);

    expect(columns).toHaveLength(2);
    expect(columns[0].className).toBe("column half");
    expect(columns[0].blocks).toHaveLength(1);
    expect(columns[1].blocks[0].imageUrl).toBe("x.png");
  });

  it("treats a column that is itself a block as one block", () => {
    const columns = normalizeColumns([{ title: "Only title", description: "D" }]);

    expect(columns).toHaveLength(1);
    expect(columns[0].blocks).toHaveLength(1);
    expect(columns[0].blocks[0].title).toBe("Only title");
  });

  it("accepts a bare array and a single column object", () => {
    expect(normalizeColumns([{ title: "A" }])).toHaveLength(1);
    expect(normalizeColumns({ title: "A" })).toHaveLength(1);
  });

  it("returns no columns for nothing", () => {
    expect(normalizeColumns(null)).toEqual([]);
    expect(normalizeColumns({})).toEqual([]);
    expect(normalizeColumns([])).toEqual([]);
  });

  it("keeps a column with no blocks so empty wrappers do not crash", () => {
    const columns = normalizeColumns([{ className: "spacer" }]);
    expect(columns).toHaveLength(1);
    expect(columns[0].blocks).toEqual([]);
  });

  it("no longer unwraps a { content } envelope", () => {
    // A `content` key is now a column's block list, not an envelope to strip.
    const columns = normalizeColumns({ content: [] });
    expect(columns).toHaveLength(1);
    expect(columns[0].blocks).toEqual([]);
  });
});

describe("Section build", () => {
  it("takes root id and className from config, columns from content", () => {
    const root = new SectionBuilder({ id: "demo-section", className: "demo" }).create({
      content: [
        { className: "column half", content: [{ title: "A" }] },
        { className: "column half", content: [{ imageUrl: "x.png" }] },
      ],
    }) as HTMLElement;

    expect(root.id).toBe("demo-section");
    expect(root.classList.contains("demo")).toBe(true);
    expect(root.querySelectorAll(".section-column")).toHaveLength(2);
  });

  it("renders no column wrapper for an empty payload", () => {
    const root = new SectionBuilder().create({ content: [] }) as HTMLElement;
    expect(root.querySelectorAll(".section-column")).toHaveLength(0);
  });
});

describe("Section contract", () => {
  it("declares a selector for every element key", () => {
    expect(Object.keys(DEFAULT_SELECTORS).sort()).toEqual([...ELEMENT_KEYS].sort());
  });

  it("gives every key a tag and a class", () => {
    for (const key of ELEMENT_KEYS) {
      expect(DEFAULT_SELECTORS[key].tagName, key).toBeTruthy();
      expect(DEFAULT_SELECTORS[key].className, key).toBeTruthy();
    }
  });
});
