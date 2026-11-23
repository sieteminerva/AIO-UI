/**
 * Missing-capability reporting — one helper, four call sites, one vocabulary.
 *
 * The input layer **degrades** instead of breaking: without a sub-module a `dropdown` is a
 * native `<select>`, an uploader is a plain `input[type=file]`, `config.popover` is
 * ignored. That degradation is honest as *behaviour* and dishonest as *silence* — a
 * consumer that asked for a dropdown and got a select never finds out, and a form that
 * declared `config.files` hands its policy an empty map and drops the bytes without a word.
 *
 * So every degraded capability speaks here, at the moment it degrades:
 *
 * - **warn** — the field still works, just plainer (`dropdown`, `popover`, `file` on a
 *   field). Printed **once per builder and capability**, because a forty-field schema must
 *   not print forty lines, and emitted as `moduleMissing` so a host can surface the same
 *   fact in its own UI instead of reading a console.
 * - **error** — a warning is not enough because the result would be a *hole*: a declared
 *   action set that renders no buttons, a `config.files` policy with no module to hand it
 *   files. The message names the capability, the module id and the one subpath that fixes
 *   it, so a consumer can act without the source.
 *
 * Deliberately **not exported from the `@aio-ui/input` root**: it is an internal mechanism,
 * not an API. Hosts listen for the event (or read the console); they never call this.
 */
/**
 * Reports one missing capability — once per builder, or not at all when it is fatal.
 *
 * @param report - Capability, module, fix, consequence and severity.
 * @param options - Owner label, the builder's dedupe set, and the host emitter.
 * @returns Nothing. Throws for `severity: "error"`.
 * @throws {Error} With the capability, the module id and the fixing subpath in the message.
 *
 * @example
 * // A field fell back to a native select, so say it once.
 * reportMissing({ capability: "dropdown", module: "dropdown", fix: "@aio-ui/input/dropdown (dropdownInputModule)", consequence: "the field falls back to a native select with the same options", severity: "warn" }, { seen });
 */
export function reportMissing(report, options = {}) {
    const { owner = "InputBuilder", seen, emit = null } = options;
    const detail = {
        builder: owner,
        capability: report.capability,
        module: report.module,
        fix: report.fix,
        consequence: report.consequence,
        severity: report.severity,
    };
    // A throw is an answer, not a notice: never deduplicated, always emitted first so a host
    // that renders its own diagnostics sees the same failure the caller is about to catch.
    if (report.severity === "error") {
        emit?.("moduleMissing", detail);
        throw new Error(`[${owner}] ${report.capability}: the "${report.module}" module is not in this builder's set, ` +
            `so ${report.consequence} Add it with ${report.fix}.`);
    }
    // Once per builder and capability: a schema repeats the same field type forty times and
    // the fact is still one fact.
    if (seen?.has(report.capability))
        return;
    seen?.add(report.capability);
    console.warn(`[${owner}] ${report.capability}: the "${report.module}" module is not in this builder's set, ` +
        `so ${report.consequence} Add it with ${report.fix}.`);
    emit?.("moduleMissing", detail);
}
//# sourceMappingURL=Missing.js.map