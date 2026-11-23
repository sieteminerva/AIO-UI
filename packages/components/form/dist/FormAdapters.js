/**
 * The form's default adapter stack — the one import the hand-wired path needs.
 *
 * @summary This module exists so that `@aio-ui/form` **root** can stay free of the
 * adapter implementations. The root exports the manifest (`FORM_ADAPTER_MANIFEST`, plain
 * strings) and the builder; the classes live here, behind the `@aio-ui/form`
 * subpath. A consumer that never imports this file never compiles these nine adapters —
 * `scripts/bundle-probe.mjs` proves exactly that, in the parsed module graph.
 *
 * @example
 * import { FormBuilder } from "@aio-ui/form";
 * import { FORM_ADAPTER_DEFINITIONS } from "@aio-ui/form";
 * import { ModuleLoader } from "@aio-ui/module-loader";
 *
 * new FormBuilder({ modules: new ModuleLoader("form", FORM_ADAPTER_DEFINITIONS), schema });
 */
import { INPUT_MODULE_DEFINITIONS } from "@aio-ui/input";
import { calculationFormAdapter } from "./adapters/Calculation.js";
import { cascadeFormAdapter } from "./adapters/Cascade.js";
import { multistepFormAdapter } from "./adapters/Multistep.js";
import { validationFormAdapter } from "./adapters/Validation.js";
import { inputFormAdapter } from "./Input.FormAdapter.js";
/**
 * Every adapter a form needs — the form's own five, then the field layer's four.
 *
 * @summary This is what makes `new FormBuilder({ modules, schema })` render anything at
 * all: `input` is required for a field to exist, the four engines are the form's own
 * behaviour (they degrade to no-ops when absent — `Form` loads them by id and calls
 * through `?.`), and the four input modules are what make those fields *whole* (a
dropdown, an uploader, an action set, a popover) instead of merely present.
 *
 * A form is one import; a bare `InputBuilder` is still opt-in. That asymmetry is
 * deliberate: `@aio-ui/form` is the composition root for a schema, so its entry should
 * mean "everything a form can do", while a single text field should not pay for a
 * dropdown builder it will never open.
 *
 * The four input ids are routed, not loaded as features: `Form.prepare()` splits the
 * loader's ids against `INPUT_MODULE_IDS` and hands the matches to the field layer, the
 * same id rule `provideModules()` has always used. `FORM_ADAPTER_MANIFEST` keeps the form
 * scope at five and re-declares the input four with `scope: "input"`.
 *
 * Registration order is also mount order for adapters, matching the previous hardcoded
 * sequence. `requires` drives dependency order.
 */
export const FORM_ADAPTER_DEFINITIONS = [
    validationFormAdapter,
    cascadeFormAdapter,
    multistepFormAdapter,
    calculationFormAdapter,
    inputFormAdapter,
    // Field-level modules. Typed differently (they receive the input layer's context), so
    // they are erased through the shared definition type — the loader is generic and the
    // routing in `Form.prepare()` is what gives them their real context.
    ...INPUT_MODULE_DEFINITIONS,
];
/** Ids of the definitions above, so a test can pin the two shapes together. */
export const FORM_ADAPTER_IDS = FORM_ADAPTER_DEFINITIONS.map((definition) => String(definition.id));
//# sourceMappingURL=FormAdapters.js.map