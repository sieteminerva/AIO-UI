/** Public surface of `@aio-ui/base`. */
export { Builder, GLOBAL_INSTANCE_COUNTER } from "./Base";
export type { iBuilderInspection } from "./Base";
export { normalize, validate } from "./BaseAdapters/ContentContract";
export type { iNormalizedContent } from "./BaseAdapters/ContentContract";

// ---- adapter pieces, published from the root -----------------------------------
// `Builder` already pulls these, so exporting them costs nothing at runtime and removes
// the `@aio-ui/base/BaseAdapters/*` wildcard (a directory pattern is not an API).
export { Binding } from "./BaseAdapters/Binding";
export { BuilderProxy, isReactive } from "./BaseAdapters/BuilderProxy";
export type { BindableElement } from "./BaseAdapters/BuilderProxy";
export { holdUntilStyled, releaseMarkers } from "./BaseAdapters/Hydration";
export type { iMockupFactory } from "./BaseAdapters/Hydration";
export { ReactiveGraph } from "./BaseAdapters/ReactiveGraph";
export type { EffectFn } from "./BaseAdapters/ReactiveGraph";
