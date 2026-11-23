/** Public surface of `@aio-ui/message` — curated, never `export *`. */

export { MessageBuilder } from "./Message";
export type { iMessageConfig, iMessageContent } from "./Message";

// The form integration ships with the component: a host that has the message has the adapter.
export { messageFormAdapter } from "./adapters/FormAdapter";
