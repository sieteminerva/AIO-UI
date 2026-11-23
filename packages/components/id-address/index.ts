/** Public surface of `@aio-ui/id-address` — curated, never `export *`. */

export { IdAddressBuilder } from "./id-address-builder";
export type {
  IdAddressCacheConfig, IdAddressConfig, IdAddressDetail, IdAddressEventArgs, IdAddressEventHandler,
  IdAddressSchemaRef, IdAddressTextContentConfig,
} from "./id-address-builder";

// Adapter flavours and the form integration ship with the component; `IdAddressBuilder`
// picks one at runtime, so the package is root + stylesheet only.
export type { IAddressAdapter, ISetOptionsFunction, ISetOptionsParamsConfig } from "./id-address-adapter";
export { IdAddressAdapterAio } from "./id-address-adapter.aio";
export { IdAddressAdapterBase } from "./id-address-adapter.base";
export { IdAddressAdapterNative } from "./id-address-adapter.native";
export { idAddressFormAdapter } from "./IdAddress.FormAdapter";
