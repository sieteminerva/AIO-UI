/** Public surface of `@aio-ui/table` — curated, never `export *`. */

export { TableBuilder } from "./Table";
export type { iTableConfig } from "./Table";

// The form integration ships with the component: a host that has the table has the adapter.
export { tableFormAdapter } from "./adapters/FormAdapter";
