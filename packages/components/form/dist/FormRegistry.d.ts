import type { iModuleDefinition } from "@aio-ui/module-loader";
import type { iComponentModuleRef } from "@aio-ui/core";
import type { iFormModuleContext } from "./FormModuleTypes";
/**
 * The form's adapter stack **as data** — refs and types only, zero implementations.
 *
 * `FORM_ADAPTER_MANIFEST` is the stack as manifest `modules` refs, so a host can declare
 * it without importing classes and `ComponentRegistry` can resolve one entry at a time.
 * The live list (`FORM_ADAPTER_DEFINITIONS`, `{ id, load }`) lives in `./FormAdapters`,
 * behind the `@aio-ui/form/adapters` subpath, so that importing `@aio-ui/form` does not
 * compile the five adapters. Keeping the refs here is what makes that split possible:
 * they are strings.
 *
 * Named "adapters" rather than "core modules" because that is what they are — and because
 * "core" made readers expect the input modules to be in here too.
 */
/** Erased definition type for the preset arrays, where module results differ per id. */
export type FormModuleDefinition = iModuleDefinition<iFormModuleContext, any>;
/**
 * The stack as manifest refs, plus the input sub-modules a form normally wants.
 *
 * @summary `scope` is what makes the split work: a parent that nests another builder
 * declares both layers here, and `Form.provideModules()` routes by id — `"input"` entries
 * become the field-level preset (`@aio-ui/input` owns them, the form only mounts them),
 * everything else stays with the form. Adapters owned by yet other packages (`table`,
 * `message`, `id-address`) are deliberately absent: the host composes those.
 */
export declare const FORM_ADAPTER_MANIFEST: iComponentModuleRef[];
//# sourceMappingURL=FormRegistry.d.ts.map