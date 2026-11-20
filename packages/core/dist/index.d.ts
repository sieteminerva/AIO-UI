/**
 * Public surface of `@aio-ui/core` — curated, never `export *`.
 *
 * Two kinds of names live here:
 *
 * - **runtime** — the renderer, the registry kernel, the stylesheet injector, the builder
 *   port and the template registry. Components and modules use these; nothing else.
 * - **contracts** — the type modules (`iBasicNode`, `iComponentEvents`, …) are also
 *   published as types-only subpaths (`@aio-ui/core/interface`, `/node`, `/page`, …) for
 *   hosts that want one module of types without the runtime. Those subpaths contain types
 *   only, which is why they are allowed to stay.
 */
export { ComponentRegistry, mergeBuildConfig } from "./ComponentRegistry";
export { AioApp, AppStorage, blockToNode, isPageDocument, normalizeRoute, pageToNode } from "./app";
export { DOMRenderer } from "./DOMRenderer";
export { inspectPage } from "./Inspect";
export { getBuilderAdapter, setBuilderAdapter } from "./BuilderPort";
export { ensureStylesheet, injectLazyCss, isStyleInjected, isStylesheetPending, normalizeStylesheetPath, replaceLazyCss, styleTagId, useStylesheetAssets, } from "./Stylesheets";
export { releaseBuilders } from "./Registry/BuilderInstances";
export { TemplateRegistry, getTemplates, setTemplates } from "./TemplateRegistry";
export { DEFAULT_REGISTRY_SCOPE, Registry, RegistryError, assertValidId, assertValidScope, qualifyId, splitQualifiedId, } from "./Registry/index";
export type { iComponentAssetMaps, iComponentManifest, iComponentModuleRef, RegisterFn } from "./ComponentRegistry";
export type { iBuilderAdapter } from "./BuilderPort";
export type { iPageInspection } from "./Inspect";
export type { iStyleLoader } from "./Stylesheets";
export type { TemplateHandler } from "./TemplateRegistry";
export type { RegistryDuplicatePolicy, RegistryErrorCode, iRegistryEntry, iRegistryErrorDetails, iRegistryLike, iRegistryOptions, } from "./Registry/index";
export type { iComponentEvents, iEventCallback, iEventEmit, iPageEvents, iPagePhase } from "./types/events";
export type { iStorageConfig, iStorageDriver } from "./app/modules";
export type { iApp, iAppConfig, iAppModuleClass, iAppModuleContext, iAppOptions, iAppSlot, iAppSlots, iAppSource, iComponentRoute, iPageBlock, iPageContent, iPageContext, iPageController, iPageControllerClass, iPageDataSpec, iPageDefinition, iPageDocument, iPageEventSpec, iPagePort, iPageReadyContext, iPageRouteSpec, iPageSlotSpec, iAnimationPort, iAppRouteState, iComponentRegistryPort, iEventPort, iHttpPort, iRendererPort, iRouterFactory, iRouterPort, iStoragePort, } from "./app";
//# sourceMappingURL=index.d.ts.map