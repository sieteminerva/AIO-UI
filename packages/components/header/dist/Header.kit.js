export const ELEMENT_KEYS = [
    "@header",
    "@header>icon",
    "@header>title",
    "@header>subtitle",
    "@header>meta",
    "@header>meta>item",
    "@header>divider",
];
export const DEFAULT_SELECTORS = {
    // The tag is the spec: a heading block *is* its section's header.
    "@header": { tagName: "header", className: "header" },
    "@header>icon": { tagName: "i", className: "icon" },
    // Default level; the builder rewrites this to `h1..h5` from `config.size` (see Header.engine.ts).
    "@header>title": { tagName: "h3", className: "title" },
    "@header>subtitle": { tagName: "p", className: "subtitle" },
    "@header>meta": { tagName: "div", className: "meta" },
    // The class comes from the metadata key, added in template().
    "@header>meta>item": { tagName: "span" },
    "@header>divider": { tagName: "span", className: "divider" },
};
//# sourceMappingURL=Header.kit.js.map