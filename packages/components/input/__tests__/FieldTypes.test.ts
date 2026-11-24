import { describe, expect, it } from "vitest";

import { INPUT_STRUCTURAL_KEYS, scanInputAttributes } from "../FieldTypes";

/**
 * The one decision that has no runtime reader: a Google-Sheets header carries a named
 * `range`, and since b73 it is no longer a structural key. This pin keeps it that way —
 * either it stays a plain attribute (today) or somebody declares a schema key for it, and
 * then this test is the place the change shows up.
 */
describe("field type matrix", () => {
  it("treats `range` as a control attribute, not a structural key", () => {
    expect(INPUT_STRUCTURAL_KEYS).not.toContain("range");

    const scan = scanInputAttributes("text", { id: "invoice", range: "SegmentRange" });

    // `id` is identity — the scan never reports it.
    expect(scan.structural).toEqual(["id"]);
    // `range` is classified like any other attribute, so it still reaches the control.
    expect([...scan.accepted, ...scan.rejected]).toEqual(["range"]);
  });
});
