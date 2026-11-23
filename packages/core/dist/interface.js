/**
 * Aggregated type barrel for `@aio-ui/core`.
 *
 * Kept so existing `@aio-ui/core` imports keep working. New code should
 * import from the topic entry that owns the contract:
 *
 * - `@aio-ui/core`     — DOM and node tree contracts
 * - `@aio-ui/core`  — builder configuration
 * - `@aio-ui/core` — component map and builder function shape
 * - `@aio-ui/core`  — content item shapes
 * - `@aio-ui/core`     — page sources, theme modules, page reports
 * - `@aio-ui/core` — renderer contracts
 */
export * from "./types/renderer.js";
export * from "./types/api.js";
export * from "./types/content.js";
export * from "./types/node.js";
export * from "./types/registry.js";
export * from "./types/builder.js";
export * from "./types/page.js";
//# sourceMappingURL=interface.js.map