#!/usr/bin/env node
/**
 * SEMVER — the three functions `version.mjs` and `release.mjs` both need.
 *
 * Written here rather than pulled from npm: a release tool that cannot install its own
 * dependency is not a release tool. The subset is `x.y.z[-pre]` (what the workspace uses);
 * build metadata is ignored, as the spec allows.
 *
 *   parse("0.2.5-rc.1")      → { major, minor, patch, pre: "rc.1" }
 *   compare("0.2.5", "0.2.4") → 1      (negative: a < b, zero: equal, positive: a > b)
 *   next("0.2.4", "patch")    → "0.2.5" (pre-release is dropped, per semver)
 */

const SEMVER = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?(?:\+[0-9A-Za-z.-]+)?$/;

export function parse(value) {
  const match = SEMVER.exec(String(value ?? ""));
  if (!match) return undefined;
  return { major: Number(match[1]), minor: Number(match[2]), patch: Number(match[3]), pre: match[4] };
}

/** Semver precedence: numbers first, then a pre-release sorts *below* its release. */
export function compare(a, b) {
  const left = parse(a);
  const right = parse(b);
  if (!left || !right) throw new Error(`[semver] not a version: ${!left ? a : b}`);

  for (const key of ["major", "minor", "patch"]) {
    const delta = left[key] - right[key];
    if (delta) return delta;
  }
  if (left.pre === right.pre) return 0;
  if (!left.pre) return 1;
  if (!right.pre) return -1;

  const leftIds = left.pre.split(".");
  const rightIds = right.pre.split(".");
  for (let index = 0; index < Math.max(leftIds.length, rightIds.length); index += 1) {
    const one = leftIds[index];
    const two = rightIds[index];
    if (one === undefined) return -1;
    if (two === undefined) return 1;
    if (one === two) continue;
    const numeric = /^\d+$/.test(one);
    const otherNumeric = /^\d+$/.test(two);
    if (numeric && otherNumeric) return Number(one) - Number(two);
    // Numeric identifiers always sort below alphanumeric ones.
    if (numeric) return -1;
    if (otherNumeric) return 1;
    return one.localeCompare(two);
  }
  return 0;
}

/** The version after a `patch` / `minor` / `major` bump; a pre-release is not carried over. */
export function next(value, level = "patch") {
  const parsed = parse(value);
  if (!parsed) throw new Error(`[semver] not a version: ${value}`);
  if (!["patch", "minor", "major"].includes(level)) throw new Error(`[semver] unknown level: ${level}`);
  if (level === "major") return `${parsed.major + 1}.0.0`;
  if (level === "minor") return `${parsed.major}.${parsed.minor + 1}.0`;
  return `${parsed.major}.${parsed.minor}.${parsed.patch + 1}`;
}
