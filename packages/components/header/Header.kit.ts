/**
 * Header — kit.
 *
 * Key list, element-type union and default selectors. Not published: `index.ts` is the
 * only entry a consumer reads.
 *
 * The root is a real `<header>`, so the DOM is the page's SEO surface — never a
 * `<div role="header">`. `@header>meta>item` deliberately has no default class: the
 * metadata key stamps it (`author`, `date`, …), which is what the sample markup and the
 * sheet read. A metadata value that is already an element (a `<time datetime>`, a
 * `<strong>`) is appended as-is and does not use this key.
 */
import type { iBuilderSelectorsConfig } from "@aio-ui/core";

export const ELEMENT_KEYS = [
  "@header",
  "@header>icon",
  "@header>title",
  "@header>subtitle",
  "@header>meta",
  "@header>meta>item",
  "@header>divider",
] as const;

export type HeaderElementType = (typeof ELEMENT_KEYS)[number];

export const DEFAULT_SELECTORS: iBuilderSelectorsConfig<HeaderElementType> = {
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
