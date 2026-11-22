import { describe, expect, it } from "vitest";
import { assemblePreset, assertAiContent } from "../src/ai.ts";
import type { iAiSiteContent } from "../src/ai.ts";
import { answersToBase, modelFromWebType, validateAnswers } from "../src/answers.ts";
import { parsePreset } from "../src/parse.ts";

/** A request as the wizard sends it: dashed-case ids, one field per wizard set. */
const answers = {
  "web-type": "ecommerce",
  "web-name": "Tenun Lestari",
  "web-reason": "Menjual tenun tangan dari penenun lokal.",
  "web-author": "Sri Wahyuni",
  "detail-product": "produk-dan-varian",
  "contact-email": "sri@tenunlestari.id",
  "contact-company": "Tenun Lestari",
  "contact-logo": "logo.png",
  "address-jalan": "Jl. Raya Tenun 12",
  "address-propinsi": "Jawa Tengah",
  "address-kota": "Semarang",
  "address-kecamatan": "Gajahmungkur",
  "address-kelurahan": "Karangrejo",
  "address-kodepos": "50231",
  confirmation: true,
};

const facts = {
  engine: { range: "^0.2.4", resolved: "0.2.4" },
  generatedAt: "2026-11-22T00:00:00.000Z",
  endpoint: "https://script.google.com/macros/s/EXAMPLE/exec",
  sheets: ["products"],
};

const content: iAiSiteContent = {
  contentSchema: 1,
  pages: [{ id: "home", route: "/", content: { "section#hero": { content: "Halo" } } }],
};

describe("modelFromWebType — §3 mapping", () => {
  it("maps every wizard type, including the two that share a model", () => {
    expect(modelFromWebType("ecommerce")).toBe("store");
    expect(modelFromWebType("gallery")).toBe("gallery");
    expect(modelFromWebType("profile")).toBe("profile");
    expect(modelFromWebType("portfolio")).toBe("profile");
    expect(modelFromWebType("blog")).toBe("blog");
    expect(modelFromWebType("news")).toBe("blog");
  });

  it("returns undefined instead of guessing", () => {
    expect(modelFromWebType("shop")).toBeUndefined();
    expect(modelFromWebType("constructor")).toBeUndefined();
    expect(modelFromWebType(undefined)).toBeUndefined();
    expect(modelFromWebType(42)).toBeUndefined();
  });
});

describe("validateAnswers — §8 gates, per wizard set", () => {
  it("keeps intro-set answers verbatim and derives the model", () => {
    const check = validateAnswers(answers);
    expect(check.issues).toEqual([]);
    expect(check.model).toBe("store");
    expect(check.answers["web-name"]).toBe("Tenun Lestari");
    expect(check.answers["web-reason"]).toBe(answers["web-reason"]);
    expect(check.answers["web-author"]).toBe("Sri Wahyuni");
  });

  it("keeps ecommerce, contact and address sets verbatim (dashed-case untouched)", () => {
    const check = validateAnswers(answers);
    for (const key of Object.keys(answers)) {
      expect(check.answers[key]).toBe(answers[key as keyof typeof answers]);
    }
    expect("webName" in check.answers).toBe(false);
    expect("addressPropinsi" in check.answers).toBe(false);
  });

  it("ignores a client-sent model — the server derives it", () => {
    const check = validateAnswers({ ...answers, model: "gallery" });
    expect(check.model).toBe("store");
    expect(check.issues).toEqual([]);
  });

  it("blocks the confirmation gate when it is not true", () => {
    expect(validateAnswers({ ...answers, confirmation: false }).issues).toEqual([
      expect.objectContaining({ code: "MISSING_FIELD", where: "confirmation" }),
    ]);
    expect(validateAnswers({ ...answers, confirmation: "true" }).issues).toHaveLength(1);
    const withoutConfirmation: Record<string, unknown> = { ...answers };
    delete withoutConfirmation.confirmation;
    expect(validateAnswers(withoutConfirmation).issues[0].where).toBe("confirmation");
  });

  it("reports an unknown web-type as UNKNOWN_MODEL", () => {
    const check = validateAnswers({ ...answers, "web-type": "shop" });
    expect(check.issues).toEqual([
      expect.objectContaining({ code: "UNKNOWN_MODEL", where: "web-type" }),
    ]);
    expect(check.model).toBeUndefined();
  });

  it("requires a non-empty web-name and a well-formed contact-email", () => {
    expect(validateAnswers({ ...answers, "web-name": "   " }).issues).toEqual([
      expect.objectContaining({ code: "MISSING_FIELD", where: "web-name" }),
    ]);
    expect(validateAnswers({ ...answers, "contact-email": "sri@" }).issues).toEqual([
      expect.objectContaining({ code: "MISSING_FIELD", where: "contact-email" }),
    ]);
  });

  it("reports all failed gates in §8 order and refuses non-object input", () => {
    const check = validateAnswers({ "web-type": "shop" });
    expect(check.issues.map((issue) => issue.where)).toEqual([
      "confirmation",
      "web-type",
      "web-name",
      "contact-email",
    ]);
    expect(validateAnswers("halo").issues[0].code).toBe("INVALID_SHAPE");
  });
});

describe("answersToBase — §5 server-owned base", () => {
  it("builds the preset base from the answers and the facts", () => {
    const { base, issues } = answersToBase(answers, facts);
    expect(issues).toEqual([]);
    expect(base).toEqual({
      id: "tenun-lestari",
      engine: { range: "^0.2.4", resolved: "0.2.4" },
      model: "store",
      theme: "default",
      site: {
        name: "Tenun Lestari",
        locale: "id",
        tagline: "Menjual tenun tangan dari penenun lokal.",
      },
      data: [
        {
          id: "products",
          sheet: "products",
          endpoint: "https://script.google.com/macros/s/EXAMPLE/exec",
        },
      ],
      answers,
      generatedAt: "2026-11-22T00:00:00.000Z",
    });
  });

  it("slugs the site name and falls back to `site` when nothing survives", () => {
    expect(answersToBase({ ...answers, "web-name": "Café  Ångström" }, facts).base?.id).toBe(
      "cafe-angstrom",
    );
    expect(answersToBase({ ...answers, "web-name": "***" }, facts).base?.id).toBe("site");
  });

  it("creates no data rows when the job made no endpoint", () => {
    const { base } = answersToBase(answers, { ...facts, endpoint: undefined });
    expect(base?.data).toBeUndefined();
    expect(answersToBase(answers, { ...facts, sheets: [] }).base?.data).toBeUndefined();
  });

  it("honours theme and locale the server passes in", () => {
    const { base } = answersToBase(answers, { ...facts, theme: "cyberpunk", locale: "en" });
    expect(base?.theme).toBe("cyberpunk");
    expect(base?.site.locale).toBe("en");
  });

  it("returns issues, no base, when the gate fails", () => {
    const result = answersToBase({ ...answers, confirmation: false }, facts);
    expect(result.base).toBeUndefined();
    expect(result.issues).toHaveLength(1);
  });

  it("feeds assemblePreset and survives parsePreset", () => {
    const { base } = answersToBase(answers, facts);
    const preset = assemblePreset(assertAiContent(content), base!);
    expect(parsePreset(preset).issues).toEqual([]);
    expect(preset.id).toBe("tenun-lestari");
    expect(preset.site.tagline).toBe("Menjual tenun tangan dari penenun lokal.");
  });

  it("lets the AI tagline override the web-reason fallback", () => {
    const { base } = answersToBase(answers, facts);
    const preset = assemblePreset(
      assertAiContent({ ...content, site: { tagline: "Tenun elite" } }),
      base!,
    );
    expect(preset.site.tagline).toBe("Tenun elite");
  });

  it("is deterministic for the same inputs", () => {
    expect(answersToBase(answers, facts)).toEqual(answersToBase(answers, facts));
  });
});
