import { INPUT_MODULE_MANIFEST } from "@aio-ui/input/InputRegistry";
/**
 * The stack as manifest refs, plus the input sub-modules a form normally wants.
 *
 * @summary `scope` is what makes the split work: a parent that nests another builder
 * declares both layers here, and `Form.provideModules()` routes by id — `"input"` entries
 * become the field-level preset (`@aio-ui/input` owns them, the form only mounts them),
 * everything else stays with the form. Adapters owned by yet other packages (`table`,
 * `message`, `id-address`) are deliberately absent: the host composes those.
 */
export const FORM_ADAPTER_MANIFEST = [
    { id: "validation", path: "@aio-ui/form/validation-adapter", export: "validationFormAdapter", scope: "form" },
    { id: "cascade", path: "@aio-ui/form/cascade-adapter", export: "cascadeFormAdapter", scope: "form" },
    { id: "multistep", path: "@aio-ui/form/multistep-adapter", export: "multistepFormAdapter", scope: "form" },
    { id: "calculation", path: "@aio-ui/form/calculation-adapter", export: "calculationFormAdapter", scope: "form" },
    { id: "input", path: "@aio-ui/form/Input.FormAdapter", export: "inputFormAdapter", scope: "form" },
    // The input layer's own manifest, labelled with the layer it belongs to. Re-declaring
    // the four entries here by hand is how the two lists would drift apart.
    ...INPUT_MODULE_MANIFEST.map((ref) => ({ ...ref, scope: "input" })),
];
//# sourceMappingURL=FormRegistry.js.map