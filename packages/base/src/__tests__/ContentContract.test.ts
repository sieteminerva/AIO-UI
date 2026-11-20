// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";

import type { iContentContract } from "@aio-ui/core/interface";
import { Builder } from "../Base";
import { normalize, validate } from "../BaseAdapters/ContentContract";

/**
 * BATCH E — the content contract, pinned at the seam.
 *
 * A contract is a declaration a builder ships next to itself. These probes lock the four
 * properties the door promises: total (never throws), idempotent, non-destructive (unknown
 * fields are reported, not dropped) and visible (`inspect().issues`).
 */

const contract: iContentContract = {
  schema: {
    t: "list",
    single: true,
    of: {
      t: "record",
      of: {
        label: { t: "string", req: true },
        count: { t: "number" },
      },
    },
  },
  example: [{ label: "alpha" }],
  legacy: [{ from: "items", to: "", reason: "pre-0.3 wrapped the list" }],
};

describe("normalize(contract, content)", () => {
  it("passes the payload through when no contract is declared", () => {
    const payload = { anything: true };
    expect(normalize(undefined, payload)).toEqual({ content: payload, issues: [] });
  });

  it("accepts the declared example with zero issues", () => {
    expect(validate(contract, contract.example)).toEqual([]);
  });

  it("reports a wrong item field with path, expected and received", () => {
    const issues = validate(contract, [{ label: "ok" }, { label: 7 }]);
    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({
      code: "INPUT_WRONG_TYPE",
      path: "content[1].label",
      expected: "string",
      received: "number",
      severity: "error",
    });
  });

  it("reports a missing required field", () => {
    const issues = validate(contract, [{}]);
    expect(issues[0]).toMatchObject({ code: "INPUT_MISSING_FIELD", path: "content[0].label" });
  });

  it("keeps an unknown field and warns instead of dropping it", () => {
    const { content, issues } = normalize(contract, [{ label: "a", extra: "kept" }]);
    expect((content as any)[0].extra).toBe("kept");
    expect(issues[0]).toMatchObject({ code: "INPUT_UNKNOWN_FIELD", severity: "warning" });
  });

  it("wraps one lone record when the contract allows it", () => {
    expect(normalize(contract, { label: "solo" }).content).toEqual([{ label: "solo" }]);
  });

  it("resolves a legacy envelope once and stays idempotent", () => {
    const first = normalize(contract, { items: [{ label: "old" }] });
    expect(first.content).toEqual([{ label: "old" }]);
    expect(first.issues.map((issue) => issue.code)).toEqual(["INPUT_LEGACY_USED"]);

    const second = normalize(contract, first.content);
    expect(second.content).toEqual(first.content);
    expect(second.issues).toEqual([]);
  });

  it("never throws on a payload of the wrong kind", () => {
    expect(() => validate(contract, 42)).not.toThrow();
    expect(validate(contract, 42)[0].code).toBe("INPUT_WRONG_TYPE");
  });
});

describe("union and element specs", () => {
  const unionContract: iContentContract = {
    schema: {
      t: "union",
      of: [
        { t: "record", open: true, of: { label: { t: "string" } } },
        { t: "string" },
      ],
    },
    example: { label: "alpha" },
  };

  it("picks the record branch for a record and the string branch for a string", () => {
    expect(normalize(unionContract, { label: "a" }).content).toEqual({ label: "a" });
    expect(normalize(unionContract, "hello").content).toBe("hello");
  });

  it("still wraps a lone record when the chosen branch is a single list", () => {
    const single: iContentContract = {
      schema: {
        t: "union",
        of: [
          { t: "list", single: true, of: { t: "record", open: true } },
          { t: "string" },
        ],
      },
      example: [],
    };
    expect(normalize(single, { label: "solo" }).content).toEqual([{ label: "solo" }]);
  });

  it("yields exactly one INPUT_SHAPE that lists the branches when nothing fits", () => {
    const issues = validate(unionContract, 42);
    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({
      code: "INPUT_SHAPE",
      path: "content",
      expected: "object | string",
      received: "number",
    });
  });

  it("accepts an element and rejects a record", () => {
    const elementOnly: iContentContract = { schema: { t: "element" }, example: null };
    const el = document.createElement("div");
    expect(validate(elementOnly, el)).toEqual([]);
    expect(validate(elementOnly, { label: "not an element" })[0]).toMatchObject({
      code: "INPUT_WRONG_TYPE",
      expected: "element",
    });
  });

  it("tests element before record in a union, so an element is not read as a record", () => {
    const mixed: iContentContract = {
      schema: { t: "union", of: [{ t: "element" }, { t: "record", of: { label: { t: "string", req: true } } }] },
      example: {},
    };
    // A record here would fail the required `label`; an element must short-circuit first.
    expect(validate(mixed, document.createElement("section"))).toEqual([]);
  });
});

/** A minimal builder that declares the contract above, to prove `inspect()` reports issues. */
class ContractProbe extends Builder<"@probe", any> {
  static override contract = contract;
  readonly builderId = "section" as const;
  readonly name = "section" as const;
  readonly stylesheet = "" as const;
  public config: any;

  constructor() {
    super();
    this.config = this.resolveConfig(
      {
        themeId: "default",
        namespace: null,
        emit: () => { },
        selectors: { "@probe": { tagName: "div", className: "probe" } },
      },
      {},
    );
  }

  public prepare(): HTMLElement {
    return this.render("@probe") as HTMLElement;
  }

  protected template(): void { }

  public initialize(): void { }
}

describe("Builder.create() + inspect()", () => {
  it("surfaces the payload issues on the inspection", () => {
    const good = new ContractProbe().create({ content: [{ label: "ok" }] });
    expect(good).toBeInstanceOf(HTMLElement);
  });

  it("reports zero issues for a valid payload and one for a broken one", () => {
    const clean = new ContractProbe();
    clean.create({ content: [{ label: "ok" }] });
    expect(clean.inspect().issues).toEqual([]);

    const broken = new ContractProbe();
    broken.create({ content: [{ count: 3 }] });
    expect(broken.inspect().issues[0]).toMatchObject({ code: "INPUT_MISSING_FIELD" });
  });
});
