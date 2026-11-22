/**
 * `@aio-ui/input` — the whole layer through the root, one import.
 *
 * The root registers every module, so a text-only consumer that still imports the root
 * parses them all; per-module subpaths are where a bundler can trim.
 */
import { INPUT_MODULE_DEFINITIONS } from "@aio-ui/input";

export const probe = INPUT_MODULE_DEFINITIONS;
