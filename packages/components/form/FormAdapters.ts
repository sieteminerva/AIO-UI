/**
 * The form's default adapter stack — the one import the hand-wired path needs.
 *
 * @summary This module exists so that `@aio-ui/form` **root** can stay free of the
 * adapter implementations. The root exports the manifest (`FORM_ADAPTER_MANIFEST`, plain
 * strings) and the builder; the classes live here, behind the `@aio-ui/form/adapters`
 * subpath. A consumer that never imports this file never compiles these five adapters —
 * `scripts/bundle-probe.mjs` proves exactly that, in the parsed module graph.
 *
 * @example
 * import { FormBuilder } from "@aio-ui/form";
 * import { FORM_ADAPTER_DEFINITIONS } from "@aio-ui/form/adapters";
 * import { ModuleLoader } from "@aio-ui/module-loader";
 *
 * new FormBuilder({ modules: new ModuleLoader("form", FORM_ADAPTER_DEFINITIONS), schema });
 */

import type { FormModuleDefinition } from "./FormRegistry";
import { calculationFormAdapter } from "./adapters/Calculation";
import { cascadeFormAdapter } from "./adapters/Cascade";
import { multistepFormAdapter } from "./adapters/Multistep";
import { validationFormAdapter } from "./adapters/Validation";
import { inputFormAdapter } from "./Input.FormAdapter";

/**
 * Every adapter the form itself provides — the default set.
 *
 * @summary This is what makes `new FormBuilder({ modules, schema })` render anything at
 * all: `input` is required for a field to exist, the four engines are the form's own
 * behaviour (they degrade to no-ops when absent — `Form` loads them by id and calls
 * through `?.`). Anything owned by another package (`table`, `message`, `id-address`) is
 * composed by the host instead, so this list is "what the form is", not "what a project
 * may want".
 *
 * Importing this file does **not** pull the input layer's own sub-modules (dropdown,
 * uploader, controls, popover): those belong to `@aio-ui/input/modules` and reach a field
 * through `FormBuilder`'s `inputModules` option or through the manifest.
 *
 * Registration order is also mount order for adapters, matching the previous hardcoded
 * sequence. `requires` drives dependency order.
 */
export const FORM_ADAPTER_DEFINITIONS: FormModuleDefinition[] = [
  validationFormAdapter,
  cascadeFormAdapter,
  multistepFormAdapter,
  calculationFormAdapter,
  inputFormAdapter,
];

/** Ids of the definitions above, so a test can pin the two shapes together. */
export const FORM_ADAPTER_IDS: string[] = FORM_ADAPTER_DEFINITIONS.map((definition) => String(definition.id));
