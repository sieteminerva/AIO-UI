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
export declare const HEADING_BY_SIZE: {
    readonly huge: "h2";
    readonly medium: "h4";
    readonly normal: "h3";
    readonly small: "h5";
};
export type HeaderSize = keyof typeof HEADING_BY_SIZE;
/** The size the sheet and the heading default to — `h3`, the default render. */
export declare const DEFAULT_SIZE: HeaderSize;
/** The heading element a size renders. Unknown sizes fall back to the default. */
export declare function headingFor(size: string | undefined): string;
export declare function itempropFor(key: string): string | undefined;
/** The `{ textContent, className }` form: a span the builder creates from the value. */
export declare function isPairValue(value: unknown): value is iHeaderMeta;
/** A caller-owned element (a `<time datetime>`, a `<strong>`): appended as-is. */
export declare function isElementValue(value: unknown): value is HTMLElement;
/** One `[key, value]` pair per property, in the object's own order. */
export declare function metaEntries(metadata: unknown): Array<[string, iHeaderMetaValue]>;
/** The text of a scalar or pair value; a live element brings its own text. */
export declare function textOf(value: iHeaderMetaValue): string;
//# sourceMappingURL=Header.engine.d.ts.map