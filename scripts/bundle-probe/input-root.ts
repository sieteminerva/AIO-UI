/**
 * `@aio-ui/input` root — the builder and the modules it registers.
 *
 * One import is the whole layer (the price of a single door); the per-module subpaths are
 * where a bundler trims. This case proves the root resolves to the real module files.
 */
import { InputBuilder } from "@aio-ui/input";

export const probe = InputBuilder;
