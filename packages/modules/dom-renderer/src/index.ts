/**
 * Public surface of `@aio-ui/dom-renderer`.
 *
 * This package is the migration door: one renderer, no workspace imports. `src/DOMRenderer.ts`
 * is generated from `@aio-ui/core` by `scripts/build-renderer-kit.mjs`; a differential test
 * proves both build the same DOM.
 */
export { DOMRenderer } from "./DOMRenderer";
export { inspectPage } from "./Inspect";
export type { iPageInspection } from "./Inspect";
export type {
  BuilderName,
  DefaultSelectors,
  iMetadataContext,
  iNodeContent,
  iNodeRecordItem,
  iNodeRecordRelations,
} from "./DOMRenderer";
