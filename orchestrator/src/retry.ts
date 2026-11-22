/**
 * AI RETRY LOOP — the model gets its own validation issues back.
 *
 * Contract: `docs/generator/TASK-answers-contract.md` §8 step 6 — "issues are fed
 * back verbatim (max 2 retries)".
 *
 * The loop stays pure (band rule 1): it never calls `fetch`. The caller passes
 * `ask`, which performs the network call however the host does it (`UrlFetchApp`
 * in Apps Script, `fetch` in a test). On every rejection the model is re-asked
 * with the exact `PresetIssue` list, not a paraphrase: a reworded issue is a new
 * problem the model has to guess at.
 */
import { parseAiContent } from "./ai.ts";
import type { AiParseResult } from "./ai.ts";
import type { PresetIssue } from "./types.ts";

/** Re-asks after the first answer; 2 means at most 3 calls in total. */
export const MAX_RETRIES = 2;

/**
 * One model call.
 *
 * @param issues - Empty on the first call; the last rejection's issues afterwards.
 * @returns The parsed JSON the model produced (never a string).
 */
export type AskAi = (issues: PresetIssue[]) => unknown;

/** Result of `retry()`. */
export interface RetryResult {
  /** Validated content; absent only when every attempt was rejected. */
  content?: AiParseResult;
  /** How many model calls were made (1 when the first answer passed). */
  attempts: number;
  /** The last rejection's issues; empty on success. */
  issues: PresetIssue[];
}

/**
 * Renders issues as prompt lines, verbatim.
 *
 * @param issues - Issues from `parseAiContent()` / `parsePreset()`.
 * @returns One `- CODE: detail (at where)` line per issue, newline-separated.
 *
 * @example
 * issueLines([{ code: "MISSING_FIELD", detail: "`id` is required.", where: "pages[0]" }]);
 * // "- MISSING_FIELD: `id` is required. (at pages[0])"
 */
export function issueLines(issues: PresetIssue[]): string {
  return issues
    .map((issue) => {
      const where = issue.where ? ` (at ${issue.where})` : "";
      return `- ${issue.code}: ${issue.detail}${where}`;
    })
    .join("\n");
}

/**
 * Calls the model until `parseAiContent()` accepts the answer or `max` is spent.
 *
 * @param ask - The caller's model call; `issues` is empty on the first attempt.
 * @param max - Re-asks allowed after the first answer (default `MAX_RETRIES`).
 * @returns The accepted content, the call count, and the last issues on failure.
 *
 * @example
 * const result = retry((issues) => askGemini(prompt, issues));
 * if (!result.content) return errorEnvelope(result.issues);
 * const preset = assemblePreset(result.content, base);
 */
export function retry(ask: AskAi, max: number = MAX_RETRIES): RetryResult {
  const limit = Math.max(0, Math.floor(max));
  let issues: PresetIssue[] = [];

  for (let attempt = 0; attempt <= limit; attempt++) {
    const result = parseAiContent(ask(issues));
    if (result.issues.length === 0) {
      return { content: result, attempts: attempt + 1, issues: [] };
    }
    issues = result.issues;
  }

  return { attempts: limit + 1, issues };
}
