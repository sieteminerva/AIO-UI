/**
 * Public surface of the app entry (`@aio-ui/core`).
 *
 * `AioApp` is the framework entry: one class that owns routing, preload, render,
 * lifecycle and teardown. `iApp` is its contract; `iAppConfig`, `iAppSource`,
 * `iAppOptions` and `iAppDeps` describe what the entry receives.
 *
 * Lives inside `core` since `0.2.4`: it only ever imported core types, so a separate
 * package bought an extra install edge and no isolation.
 */
export { AioApp, blockToNode, isPageDocument, normalizeRoute, pageToNode } from "./AioApp.js";
export { AppStorage } from "./modules.js";
//# sourceMappingURL=index.js.map