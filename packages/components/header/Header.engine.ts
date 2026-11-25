/**
 * Header — engine.
 *
 * The decisions this component makes about *data*, kept out of the builder so they are
 * testable without a DOM:
 *
 *   - `headingFor()`  which `<hN>` a size maps to (the level is the page's decision),
 *   - `metaEntries()` one `[key, value]` pair per metadata property, in the object's order,
 *   - the reading of one metadata value (scalar, classed text, or a live element).
 */
import type { iHeaderMeta, iHeaderMetaValue } from "./Header";

export const HEADING_BY_SIZE = {
  huge: "h1",
  normal: "h3",
  medium: "h4",
  small: "h5",
} as const;

export type HeaderSize = keyof typeof HEADING_BY_SIZE;

/** The size the sheet and the heading default to — `h3`, the default render. */
export const DEFAULT_SIZE: HeaderSize = "normal";

/** The heading element a size renders. Unknown sizes fall back to the default. */
export function headingFor(size: string | undefined): string {
  return HEADING_BY_SIZE[size as HeaderSize] ?? HEADING_BY_SIZE[DEFAULT_SIZE];
}

/** The `itemprop` a metadata key earns when `config.structuredData` is on. */
const ITEMPROP: Record<string, string> = {
  author: "author",
  date: "datePublished",
  published: "datePublished",
  updated: "dateModified",
};

export function itempropFor(key: string): string | undefined {
  return ITEMPROP[key.toLowerCase()];
}

/** The `{ textContent, className }` form: a span the builder creates from the value. */
export function isPairValue(value: unknown): value is iHeaderMeta {
  return (
    !!value &&
    typeof value === "object" &&
    typeof (value as { textContent?: unknown }).textContent === "string" &&
    typeof (value as { className?: unknown }).className === "string"
  );
}

/** A caller-owned element (a `<time datetime>`, a `<strong>`): appended as-is. */
export function isElementValue(value: unknown): value is HTMLElement {
  return typeof HTMLElement !== "undefined" && value instanceof HTMLElement;
}

/** One `[key, value]` pair per property, in the object's own order. */
export function metaEntries(metadata: unknown): Array<[string, iHeaderMetaValue]> {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return [];
  return Object.entries(metadata as Record<string, iHeaderMetaValue>);
}

/** The text of a scalar or pair value; a live element brings its own text. */
export function textOf(value: iHeaderMetaValue): string {
  if (typeof value === "string") return value;
  return isPairValue(value) ? value.textContent : "";
}
