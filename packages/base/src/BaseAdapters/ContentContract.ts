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
import type { iContentContract, iContentIssue, iContentSpec } from "@aio-ui/core";

export interface iNormalizedContent {
  /** The payload the builder should see: legacy spellings resolved, lists coerced. */
  content: unknown;
  /** Everything wrong or suspicious, already rooted at `content`. */
  issues: iContentIssue[];
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** The word a developer sees in `received` — `array`, `null`, `string`, … */
const typeName = (value: unknown): string => {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  return typeof value;
};

/** `content` or `content.title` or `content[2].title` */
const childPath = (path: string, key: string | number): string =>
  typeof key === "number" ? `${path}[${key}]` : path ? `${path}.${key}` : key;

const issue = (
  code: iContentIssue["code"],
  path: string,
  expected: string,
  received: unknown,
  message: string,
  severity: iContentIssue["severity"] = "error",
  allowed?: readonly (string | number)[],
): iContentIssue => ({
  code,
  path,
  expected,
  received: typeName(received),
  allowed,
  message,
  severity,
});

/**
 * Applies the contract's legacy spellings, once.
 *
 * `from` is a top-level key; `to` is the top-level field that replaces it (`""` means the
 * legacy value *is* the payload). A payload that already carries the new field wins, so the
 * pass cannot overwrite good input.
 */
function applyLegacy(contract: iContentContract, content: unknown, issues: iContentIssue[]): unknown {
  if (!contract.legacy?.length || !isRecord(content)) return content;

  let result: Record<string, unknown> | null = null;
  const mutable = () => (result ??= { ...content });

  for (const entry of contract.legacy) {
    if (!Object.prototype.hasOwnProperty.call(content, entry.from)) continue;

    const target = mutable();
    const value = target[entry.from] as unknown;
    delete target[entry.from];

    if (entry.to === "") {
      // The legacy value is the payload itself — only when nothing better is there.
      issues.push(
        issue(
          "INPUT_LEGACY_USED",
          "content",
          "payload directly",
          value,
          `body shape "${entry.from}" is legacy — ${entry.reason}`,
          "warning",
        ),
      );
      return value;
    }

    if (target[entry.to] === undefined) target[entry.to] = value;
    issues.push(
      issue(
        "INPUT_LEGACY_USED",
        childPath("content", entry.from),
        childPath("content", entry.to),
        value,
        `"${entry.from}" is legacy, read as "${entry.to}" — ${entry.reason}`,
        "warning",
      ),
    );
  }

  return result ?? content;
}

/**
 * Structural fit — does `value` *look like* this spec? Never throws, collects nothing.
 *
 * A union uses it to pick a branch before normalising, so this is deliberately a cheap
 * type test, not a full validation: a `record` that is missing a required field still
 * fits, and `check()` reports the missing field on the chosen branch.
 */
function fits(spec: iContentSpec, value: unknown): boolean {
  switch (spec.t) {
    case "any":
      return true;
    case "string":
      return typeof value === "string";
    case "number":
      return typeof value === "number" && Number.isFinite(value);
    case "boolean":
      return typeof value === "boolean";
    case "enum":
      return spec.of.includes(value as string | number);
    case "record":
      return isRecord(value);
    case "list":
      return Array.isArray(value) || (spec.single === true && isRecord(value));
    case "element":
      // An element is an object, so a union must test `element` before `record`.
      return typeof HTMLElement !== "undefined" && value instanceof HTMLElement;
    case "union":
      return spec.of.some((branch) => fits(branch, value));
  }
}

/** Walks one spec against one value, collecting issues and returning the normalised value. */
function check(spec: iContentSpec, value: unknown, path: string, issues: iContentIssue[]): unknown {
  if (value === undefined) {
    if (spec.req) {
      issues.push(
        issue("INPUT_MISSING_FIELD", path, describe(spec), value, `required field is missing`),
      );
    }
    return value;
  }

  switch (spec.t) {
    case "any":
      return value;

    case "element":
      if (typeof HTMLElement === "undefined" || !(value instanceof HTMLElement)) {
        issues.push(issue("INPUT_WRONG_TYPE", path, "element", value, `expected a DOM element`));
      }
      return value;

    case "union": {
      const branch = spec.of.find((candidate) => fits(candidate, value));
      if (!branch) {
        issues.push(
          issue(
            "INPUT_SHAPE",
            path,
            describe(spec),
            value,
            `fits none of: ${describe(spec)}`,
          ),
        );
        return value;
      }
      // First fitting branch normalises the value (so `list.single` still wraps).
      return check(branch, value, path, issues);
    }

    case "string":
      if (typeof value !== "string") {
        issues.push(issue("INPUT_WRONG_TYPE", path, "string", value, `expected string`));
      }
      return value;

    case "number":
      if (typeof value !== "number" || !Number.isFinite(value)) {
        issues.push(issue("INPUT_WRONG_TYPE", path, "number", value, `expected number`));
      }
      return value;

    case "boolean":
      if (typeof value !== "boolean") {
        issues.push(issue("INPUT_WRONG_TYPE", path, "boolean", value, `expected boolean`));
      }
      return value;

    case "enum":
      if (!spec.of.includes(value as string | number)) {
        issues.push(
          issue("INPUT_BAD_ENUM", path, `one of ${spec.of.join(" | ")}`, value, `value is not in the allowed set`, "error", spec.of),
        );
      }
      return value;

    case "record": {
      if (!isRecord(value)) {
        issues.push(issue("INPUT_WRONG_TYPE", path, "object", value, `expected object`));
        return value;
      }
      const fields = spec.of ?? {};
      let result: Record<string, unknown> | null = null;
      for (const [key, fieldSpec] of Object.entries(fields)) {
        const next = check(fieldSpec, value[key], childPath(path, key), issues);
        if (next !== value[key]) (result ??= { ...value })[key] = next;
      }
      for (const key of Object.keys(value)) {
        if (key in fields) continue;
        if (spec.open) continue;
        // An unknown key is a warning: keep it, say it, never drop it.
        issues.push(
          issue(
            "INPUT_UNKNOWN_FIELD",
            childPath(path, key),
            "a declared field",
            value[key],
            `"${key}" is not declared by this contract`,
            "warning",
          ),
        );
      }
      return result ?? value;
    }

    case "list": {
      let list = value;
      if (!Array.isArray(list)) {
        if (spec.single && isRecord(list)) {
          list = [list];
        } else {
          issues.push(issue("INPUT_WRONG_TYPE", path, "array", value, `expected array`));
          return value;
        }
      }
      const items = list as unknown[];
      if (spec.min !== undefined && items.length < spec.min) {
        issues.push(
          issue("INPUT_TOO_FEW", path, `at least ${spec.min} item(s)`, items, `${items.length} item(s) received`),
        );
      }
      if (spec.max !== undefined && items.length > spec.max) {
        issues.push(
          issue("INPUT_TOO_MANY", path, `at most ${spec.max} item(s)`, items, `${items.length} item(s) received`),
        );
      }
      if (!spec.of) return list;
      let changed = list !== value;
      const next = items.map((item, index) => {
        const resolved = check(spec.of as iContentSpec, item, childPath(path, index), issues);
        if (resolved !== item) changed = true;
        return resolved;
      });
      return changed ? next : list;
    }
  }
}

/** One-line description of a spec, used in `expected`. */
function describe(spec: iContentSpec): string {
  switch (spec.t) {
    case "record":
      return "object";
    case "list":
      return "array";
    case "enum":
      return `one of ${spec.of.join(" | ")}`;
    case "union":
      return spec.of.map(describe).join(" | ");
    case "element":
      return "element";
    case "any":
      return "any value";
    default:
      return spec.t;
  }
}

/**
 * Normalises `content` against a contract.
 *
 * A builder with no contract gets its payload back untouched and no issues — the door
 * stays open for a component that has not declared a shape yet.
 */
export function normalize(contract: iContentContract | undefined, content: unknown): iNormalizedContent {
  if (!contract) return { content, issues: [] };

  const issues: iContentIssue[] = [];
  const resolved = applyLegacy(contract, content, issues);
  return { content: check(contract.schema, resolved, "content", issues), issues };
}

/** `normalize()` when only the verdict matters — what the per-component CI test calls. */
export function validate(contract: iContentContract | undefined, content: unknown): iContentIssue[] {
  return normalize(contract, content).issues;
}
