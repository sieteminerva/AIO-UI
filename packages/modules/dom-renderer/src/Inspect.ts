/**
 * INSPECT — a built tree as data (same contract as `@aio-ui/core`'s `inspectPage`).
 *
 * The renderer stamps a `getMetadata()` closure on every element it creates, so the root can
 * be read back synchronously: no DOM mutation, no stylesheet wait. The type import pulls in the
 * renderer module, whose `declare global` block is what gives `HTMLElement.getMetadata` its
 * shape here.
 */
import type { iNodeRecordItem } from "./DOMRenderer";

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
 *   rather than throwing: an un-recorded tree is a normal state, and a snapshot helper must
 *   never be the reason a page fails.
 */
export function inspectPage(root: HTMLElement): iPageInspection {
  const records = (root?.getMetadata?.() ?? []) as iNodeRecordItem[];
  return {
    html: root ? root.outerHTML : "",
    records,
    nodeCount: records.length,
  };
}
