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
export declare const ELEMENT_KEYS: readonly ["@header", "@header>icon", "@header>title", "@header>subtitle", "@header>meta", "@header>meta>item", "@header>divider"];
export type HeaderElementType = (typeof ELEMENT_KEYS)[number];
export declare const DEFAULT_SELECTORS: iBuilderSelectorsConfig<HeaderElementType>;
//# sourceMappingURL=Header.kit.d.ts.map