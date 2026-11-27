/**
 * WIZARD ANSWERS — wizard form → server-owned preset base.
 *
 * Contract: `orchestrator/TASK.md` §3–§5.
 *
 * Three facts drive this file:
 *
 * - An answer key is the wizard's **dashed-case field id, verbatim**. The same ids
 *   name form fields, inputs and Sheet columns, so a camelCase transform here would
 *   silently break all three.
 * - `model` is server-owned. The client may echo it; this module ignores that echo and
 *   derives the model from `web-type` (§3). An unknown type is an issue, never a guess.
 * - Only `web-name`, `web-type` and `contact-email` reach the preset directly (§4, rule 1).
 *   Address answers configure generated forms, the rest feeds the prompt or the job.
 *
 * Pure functions only (band rule 1): no `node:*`, no `fetch`, no filesystem. The engine
 * pin, the deployment endpoint, the sheet table map and the timestamp are handed in.
 */
import type { PresetAssembly } from "./ai.ts";
import type { PresetDataSource, PresetIssue, PresetModel } from "./types.ts";

/** `web-type` values the wizard offers (`.archives/wizard.ts`, `intro-set`). */
export type WebType = "ecommerce" | "gallery" | "profile" | "portfolio" | "blog" | "news";

/** §3 — server-owned `web-type` → `model` map. Two wizard types may share one model. */
const MODEL_OF: Record<WebType, PresetModel> = {
  ecommerce: "store",
  gallery: "gallery",
  profile: "profile",
  portfolio: "profile",
  blog: "blog",
  news: "blog",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Non-empty trimmed string, else `undefined`. */
function asText(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() !== "" ? value.trim() : undefined;
}

/** Loose on purpose: the server proves the address by sending mail, not by a regex faith. */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** `"Tenun Lestari"` → `"tenun-lestari"`; never empty (falls back to `site`). */
function slug(value: string): string {
  const clean = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return clean || "site";
}

/**
 * Derives the webapp model from `web-type` (§3).
 *
 * @param webType - Raw `web-type` answer.
 * @returns The model, or `undefined` when the value is not one the wizard offers.
 *
 * @example
 * modelFromWebType("ecommerce"); // "store"
 * modelFromWebType("portfolio"); // "profile"
 * modelFromWebType("shop");      // undefined
 */
export function modelFromWebType(webType: unknown): PresetModel | undefined {
  return typeof webType === "string" && Object.hasOwn(MODEL_OF, webType)
    ? MODEL_OF[webType as WebType]
    : undefined;
}

/** Result of `validateAnswers()`: answers kept verbatim plus the derived model. */
export interface AnswersCheck {
  /** Raw answers, dashed-case keys untouched. Empty when the input was not an object. */
  answers: Record<string, unknown>;
  /** Server-derived model, `undefined` when `web-type` was unknown. */
  model?: PresetModel;
  /** Empty means "safe to assemble". */
  issues: PresetIssue[];
}

/**
 * Validates the four gates of §8, in order, before any side effect.
 *
 * | Order | Gate                | Code            |
 * | ----- | ------------------- | --------------- |
 * | 1     | `confirmation` true | `MISSING_FIELD` |
 * | 2     | `web-type` known    | `UNKNOWN_MODEL` |
 * | 3     | `web-name` present  | `MISSING_FIELD` |
 * | 4     | `contact-email` ok  | `MISSING_FIELD` |
 *
 * A client-sent `model` is never read: §2 says the server derives it.
 *
 * @param input - The `answers` object from the job request.
 * @returns Answers verbatim, the derived model and every gate that failed.
 *
 * @example
 * const check = validateAnswers(request.answers);
 * if (check.issues.length) return errorEnvelope(check.issues);
 */
export function validateAnswers(input: unknown): AnswersCheck {
  if (!isRecord(input)) {
    return {
      answers: {},
      issues: [{ code: "INVALID_SHAPE", detail: "`answers` must be a JSON object." }],
    };
  }

  const issues: PresetIssue[] = [];
  const model = modelFromWebType(input["web-type"]);

  if (input.confirmation !== true) {
    issues.push({
      code: "MISSING_FIELD",
      detail: "`confirmation` must be true before a Sheet is copied.",
      where: "confirmation",
    });
  }

  if (!model) {
    issues.push({
      code: "UNKNOWN_MODEL",
      detail: `Unknown \`web-type\` ${JSON.stringify(input["web-type"])}.`,
      where: "web-type",
    });
  }

  if (!asText(input["web-name"])) {
    issues.push({ code: "MISSING_FIELD", detail: "`web-name` is required.", where: "web-name" });
  }

  const email = asText(input["contact-email"]);
  if (!email || !EMAIL.test(email)) {
    issues.push({
      code: "MISSING_FIELD",
      detail: "`contact-email` must be a well-formed email address.",
      where: "contact-email",
    });
  }

  return { answers: input, ...(model ? { model } : {}), issues };
}

/** Everything the answers cannot supply; the server reads these from the release and the job. */
export interface BaseFacts {
  /** Framework pin the generator was built against (`releases/v<version>/registry.json`). */
  engine: { range: string; resolved: string };
  /** ISO timestamp; passed in so the output stays deterministic in tests. */
  generatedAt: string;
  /** `/exec` deployment this job created; becomes `data[].endpoint` (§5). */
  endpoint?: string;
  /** Sheet names from the model's table map (§5 companion contract); one data row each. */
  sheets?: string[];
  /** Theme id; the orchestrator picks it, the AI never does. */
  theme?: string;
  /** Site locale; `id` unless the owner changed it. */
  locale?: string;
}

/** Result of `answersToBase()`: the second argument of `assemblePreset()`, or the issues. */
export interface BaseResult {
  /** Present only when `issues` is empty. */
  base?: PresetAssembly;
  /** Server-derived model, reported even when validation failed. */
  model?: PresetModel;
  /** Empty means "safe to call the AI". */
  issues: PresetIssue[];
}

/**
 * Turns validated wizard answers into the server-owned preset base (§5).
 *
 * `web-name` becomes both `id` (slugged) and `site.name`; `web-reason` is the
 * `site.tagline` fallback; `contact-email` is kept in `answers` for custody, not
 * copied into page content. `data[]` exists only when the job created an endpoint
 * and the model has sheets.
 *
 * @param answers - Raw answers (the `answers` object of the request).
 * @param facts - Engine pin, timestamp, endpoint, sheets, theme and locale.
 * @returns The base for `assemblePreset()`, or the validation issues.
 *
 * @example
 * const { base, issues } = answersToBase(request.answers, {
 *   engine: { range: "^0.2.4", resolved: "0.2.4" },
 *   generatedAt: new Date().toISOString(),
 *   endpoint: deploymentUrl,
 *   sheets: ["products"],
 * });
 * if (!base) return errorEnvelope(issues);
 */
export function answersToBase(answers: unknown, facts: BaseFacts): BaseResult {
  const check = validateAnswers(answers);
  if (!check.model) return { issues: check.issues };
  if (check.issues.length) return { model: check.model, issues: check.issues };

  const name = asText(check.answers["web-name"]) as string;
  const tagline = asText(check.answers["web-reason"]);
  const sheets = facts.sheets ?? [];
  const data: PresetDataSource[] =
    facts.endpoint && sheets.length
      ? sheets.map((sheet) => ({ id: sheet, sheet, endpoint: facts.endpoint as string }))
      : [];

  const base: PresetAssembly = {
    id: slug(name),
    engine: facts.engine,
    model: check.model,
    theme: facts.theme ?? "default",
    site: {
      name,
      locale: facts.locale ?? "id",
      ...(tagline ? { tagline } : {}),
    },
    ...(data.length ? { data } : {}),
    answers: check.answers,
    generatedAt: facts.generatedAt,
  };

  return { base, model: check.model, issues: [] };
}
