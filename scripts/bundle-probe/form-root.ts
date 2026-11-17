/**
 * `@aio-ui/form` root — no adapter, no input layer.
 *
 * The one thing a component needs from the package: the builder. Nothing else, so the
 * probe can prove the adapters are absent from the graph rather than merely unused.
 */
import { FormBuilder } from "@aio-ui/form";

export const probe = FormBuilder;
