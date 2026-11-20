/**
 * Normalises anything the caller might hand over into `iBadgeItem[]`.
 *
 *   - `[...]`                      bare array of records
 *   - `{ items: [...] }`           named collection
 *   - `{ label, description }`     a single record
 *   - `{}` / `null` / `undefined`  nothing
 */
export function normalizePayload(data) {
    if (!data)
        return [];
    if (Array.isArray(data))
        return data.filter(Boolean);
    if (typeof data === "object") {
        if (Array.isArray(data.items))
            return data.items.filter(Boolean);
        if (data.label || data.description)
            return [data];
    }
    return [];
}
//# sourceMappingURL=Badge.engine.js.map