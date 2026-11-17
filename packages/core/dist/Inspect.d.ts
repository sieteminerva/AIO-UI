/**
 * INSPECT — a page tree as data, so a caller can prove what was built.
 *
 * The renderer already records every node it builds and stamps a `getMetadata()` closure
 * on each element. This module is the one honest way to read that: a **pure, synchronous**
 * function over the root the renderer returned. No DOM mutation, no waiting, no stylesheet
 * loader involved.
 *
 * Two rules come from how the recording works, not from taste:
 *
 * 1. **Read from the root, never from a child.** `setMetadata` copies the pool at call
 *    time and a node is stamped before its siblings exist, so a child closure holds a
 *    partial snapshot. Only the root is re-stamped once the walk is complete.
 * 2. **`html` is raw.** Attributes keep the order the renderer wrote them and the
 *    anti-FOUC markers stay (`data-loaded`, `--is-loading`). Normalising here would hide a
 *    regression from the caller; a caller that wants a diffable form can normalise itself.
 *
 * @example
 * const root = renderer.render(page, renderFn, buildFn, { scopeId: "home" });
 * const { html, records, nodeCount } = inspectPage(root);
 * if (nodeCount !== expected) throw new Error("the page did not build what it declared");
 */
import type { iNodeRecordItem } from "./types/node";
/** What one rendered page looks like as data. */
export interface iPageInspection {
    /** Serialized markup of the page root, exactly as the renderer produced it. */
    html: string;
    /** Every node record the walk produced, in creation order. Empty for a bare host. */
    records: iNodeRecordItem[];
    /** `records.length` — the cheap number a test or an agent checks first. */
    nodeCount: number;
}
/**
 * Reads a rendered page back as data.
 *
 * @param root - The element `DOMRenderer.render()` returned.
 * @returns Markup plus the complete record pool. A missing closure yields an empty pool
 *   rather than throwing: an un-recorded tree is a normal state for a host that rendered
 *   nothing, and a snapshot helper must never be the reason a page fails.
 */
export declare function inspectPage(root: HTMLElement): iPageInspection;
//# sourceMappingURL=Inspect.d.ts.map