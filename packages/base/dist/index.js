/** Public surface of `@aio-ui/base`. */
export { Builder, GLOBAL_INSTANCE_COUNTER } from "./Base.js";
export { normalize, validate } from "./BaseAdapters/ContentContract.js";
// ---- adapter pieces, published from the root -----------------------------------
// `Builder` already pulls these, so exporting them costs nothing at runtime and removes
// the `@aio-ui/base/BaseAdapters/*` wildcard (a directory pattern is not an API).
export { Binding } from "./BaseAdapters/Binding.js";
export { BuilderProxy, isReactive } from "./BaseAdapters/BuilderProxy.js";
export { holdUntilStyled, releaseMarkers } from "./BaseAdapters/Hydration.js";
export { ReactiveGraph } from "./BaseAdapters/ReactiveGraph.js";
//# sourceMappingURL=index.js.map