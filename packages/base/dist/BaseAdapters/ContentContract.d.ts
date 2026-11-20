/**
 * Content contract — the one place that turns a declared payload shape into issues.
 *
 * A builder declares `static contract: iContentContract` next to itself. `create()` calls
 * `normalize()` before `prepare()`, so the same payload always produces the same issues,
 * whether the builder was reached through the registry or built by hand in a test.
 *
 * Three properties are load-bearing:
 *
 * - **Total.** `normalize()` never throws. A malformed payload comes back with issues, not
 *   with an exception, so a caller can read every problem in one pass.
 * - **Idempotent.** `normalize(normalize(x))` is the same value and the same issues: legacy
 *   keys are consumed once, and a list is never wrapped twice.
 * - **Non-destructive.** Unknown fields are reported as warnings and kept, never dropped.
 *   A component may read a field a previous contract revision did not know about.
 */
import type { iContentContract, iContentIssue } from "@aio-ui/core/interface";
export interface iNormalizedContent {
    /** The payload the builder should see: legacy spellings resolved, lists coerced. */
    content: unknown;
    /** Everything wrong or suspicious, already rooted at `content`. */
    issues: iContentIssue[];
}
/**
 * Normalises `content` against a contract.
 *
 * A builder with no contract gets its payload back untouched and no issues — the door
 * stays open for a component that has not declared a shape yet.
 */
export declare function normalize(contract: iContentContract | undefined, content: unknown): iNormalizedContent;
/** `normalize()` when only the verdict matters — what the per-component CI test calls. */
export declare function validate(contract: iContentContract | undefined, content: unknown): iContentIssue[];
//# sourceMappingURL=ContentContract.d.ts.map