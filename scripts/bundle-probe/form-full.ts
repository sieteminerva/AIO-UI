/**
 * `@aio-ui/form/adapters` — the opt-in full stack, positive direction.
 *
 * If this entry does not pull the five adapters, the probe would pass vacuously: the
 * negative cases could be green simply because nothing was ever resolved.
 */
import { FORM_ADAPTER_DEFINITIONS } from "@aio-ui/form/adapters";

export const probe = FORM_ADAPTER_DEFINITIONS;
