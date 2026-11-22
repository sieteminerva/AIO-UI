import { describe, expect, it } from "vitest";
import type { iAiSiteContent } from "../src/ai.ts";
import { issueLines, MAX_RETRIES, retry, retryAsync } from "../src/retry.ts";
import type { PresetIssue } from "../src/types.ts";

const good: iAiSiteContent = {
  contentSchema: 1,
  pages: [{ id: "home", route: "/", content: { "section#hero": { content: "Halo" } } }],
};

/** Wrong `contentSchema` — rejected, and the issue carries a `where`. */
const badSchema = { ...good, contentSchema: 2 };

/** Duplicate routes — rejected, two issues at once. */
const badRoutes = {
  ...good,
  pages: [
    good.pages[0],
    { id: "again", route: "/", content: { "section#hero": { content: "Lagi" } } },
  ],
};

describe("retry — §8 step 6", () => {
  it("accepts the first answer with one call and no feedback", () => {
    const seen: PresetIssue[][] = [];
    const result = retry((issues) => {
      seen.push(issues);
      return good;
    });

    expect(result.attempts).toBe(1);
    expect(result.content?.issues).toEqual([]);
    expect(result.issues).toEqual([]);
    expect(seen).toEqual([[]]);
  });

  it("re-asks with the issues verbatim, then accepts", () => {
    const seen: PresetIssue[][] = [];
    const result = retry((issues) => {
      seen.push(issues);
      return issues.length ? good : badSchema;
    });

    expect(result.attempts).toBe(2);
    expect(result.content?.pages).toHaveLength(1);
    expect(seen[1]).toEqual([
      expect.objectContaining({ code: "INVALID_SHAPE", where: "contentSchema" }),
    ]);
  });

  it("stops after MAX_RETRIES and returns the last issues", () => {
    const result = retry(() => badRoutes);

    expect(result.attempts).toBe(MAX_RETRIES + 1);
    expect(result.content).toBeUndefined();
    expect(result.issues.map((issue) => issue.code)).toEqual(["DUPLICATE_ROUTE"]);
  });

  it("honours a custom limit, including zero retries", () => {
    expect(retry(() => badSchema, 1).attempts).toBe(2);
    expect(retry(() => badSchema, 0).attempts).toBe(1);
    expect(retry(() => badSchema, -3).attempts).toBe(1);
  });

  it("never trusts a string answer — it is rejected as INVALID_SHAPE", () => {
    const result = retry(() => '{"contentSchema":1}', 0);
    expect(result.issues[0].code).toBe("INVALID_SHAPE");
  });
});

describe("retryAsync — the same rule over a network hop", () => {
  it("accepts the first answer with one awaited call and no feedback", async () => {
    const seen: PresetIssue[][] = [];
    const result = await retryAsync(async (issues) => {
      seen.push(issues);
      return good;
    });

    expect(result.attempts).toBe(1);
    expect(result.content?.issues).toEqual([]);
    expect(seen).toEqual([[]]);
  });

  it("re-asks with the issues verbatim, then accepts", async () => {
    const seen: PresetIssue[][] = [];
    const result = await retryAsync(async (issues) => {
      seen.push(issues);
      return issues.length ? good : badSchema;
    });

    expect(result.attempts).toBe(2);
    expect(result.content?.pages).toHaveLength(1);
    expect(seen[1]).toEqual([
      expect.objectContaining({ code: "INVALID_SHAPE", where: "contentSchema" }),
    ]);
  });

  it("stops after MAX_RETRIES and returns the last issues", async () => {
    const result = await retryAsync(async () => badRoutes);

    expect(result.attempts).toBe(MAX_RETRIES + 1);
    expect(result.content).toBeUndefined();
    expect(result.issues.map((issue) => issue.code)).toEqual(["DUPLICATE_ROUTE"]);
  });

  it("propagates a transport rejection — no silent retry of a dead endpoint", async () => {
    await expect(retryAsync(async () => { throw new Error("offline"); }, 0)).rejects.toThrow("offline");
  });
});

describe("issueLines — verbatim feedback", () => {
  it("renders code, detail and where, one line each", () => {
    expect(
      issueLines([
        { code: "MISSING_FIELD", detail: "`id` is required.", where: "pages[0].id" },
        { code: "UNKNOWN_MODEL", detail: "Unknown `model`." },
      ]),
    ).toBe("- MISSING_FIELD: `id` is required. (at pages[0].id)\n- UNKNOWN_MODEL: Unknown `model`.");
  });

  it("copies the detail untouched — no rewording, no truncation", () => {
    const detail = 'Theme "neon" has no package.';
    expect(issueLines([{ code: "UNKNOWN_THEME", detail }])).toContain(detail);
  });
});
