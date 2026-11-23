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
export { AioApp, blockToNode, isPageDocument, normalizeRoute, pageToNode } from "./AioApp";
export { AppStorage } from "./modules";
export type { iStorageConfig, iStorageDriver } from "./modules";
export type { iApp, iAppConfig, iAppModuleClass, iAppModuleContext, iAppOptions, iAppSlot, iAppSlots, iAppSource, iComponentRoute, iPageBlock, iPageContent, iPageContext, iPageController, iPageControllerClass, iPageDataSpec, iPageDefinition, iPageDocument, iPageEventSpec, iPagePort, iPageReadyContext, iPageRouteSpec, iPageSlotSpec, } from "./types";
export type { iAnimationPort, iAppRouteState, iComponentRegistryPort, iEventPort, iHttpPort, iRendererPort, iRouterFactory, iRouterPort, iStoragePort, } from "./ports";
//# sourceMappingURL=index.d.ts.map