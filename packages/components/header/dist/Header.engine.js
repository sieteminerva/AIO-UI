export const HEADING_BY_SIZE = {
    huge: "h2",
    medium: "h4",
    normal: "h3",
    small: "h5",
};
/** The size the sheet and the heading default to — `h3`, the default render. */
export const DEFAULT_SIZE = "normal";
/** The heading element a size renders. Unknown sizes fall back to the default. */
export function headingFor(size) {
    return HEADING_BY_SIZE[size] ?? HEADING_BY_SIZE[DEFAULT_SIZE];
}
/** The `itemprop` a metadata key earns when `config.structuredData` is on. */
const ITEMPROP = {
    author: "author",
    date: "datePublished",
    published: "datePublished",
    updated: "dateModified",
};
export function itempropFor(key) {
    return ITEMPROP[key.toLowerCase()];
}
/** The `{ textContent, className }` form: a span the builder creates from the value. */
export function isPairValue(value) {
    return (!!value &&
        typeof value === "object" &&
        typeof value.textContent === "string" &&
        typeof value.className === "string");
}
/** A caller-owned element (a `<time datetime>`, a `<strong>`): appended as-is. */
export function isElementValue(value) {
    return typeof HTMLElement !== "undefined" && value instanceof HTMLElement;
}
/** One `[key, value]` pair per property, in the object's own order. */
export function metaEntries(metadata) {
    if (!metadata || typeof metadata !== "object" || Array.isArray(metadata))
        return [];
    return Object.entries(metadata);
}
/** The text of a scalar or pair value; a live element brings its own text. */
export function textOf(value) {
    if (typeof value === "string")
        return value;
    return isPairValue(value) ? value.textContent : "";
}
//# sourceMappingURL=Header.engine.js.map