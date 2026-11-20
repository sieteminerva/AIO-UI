/**
 * Reads a rendered page back as data.
 *
 * @param root - The element `DOMRenderer.render()` returned.
 * @returns Markup plus the complete record pool. A missing closure yields an empty pool
 *   rather than throwing: an un-recorded tree is a normal state, and a snapshot helper must
 *   never be the reason a page fails.
 */
export function inspectPage(root) {
    const records = (root?.getMetadata?.() ?? []);
    return {
        html: root ? root.outerHTML : "",
        records,
        nodeCount: records.length,
    };
}
//# sourceMappingURL=Inspect.js.map