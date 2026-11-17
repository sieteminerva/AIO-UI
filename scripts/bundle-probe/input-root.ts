/**
 * `@aio-ui/input` root — no sub-module.
 *
 * A text field needs the builder and nothing else; the dropdown builder, the uploader,
 * the control set and the popover must stay out of this graph.
 */
import { InputBuilder } from "@aio-ui/input";

export const probe = InputBuilder;
