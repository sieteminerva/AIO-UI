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
 * What is missing, what it costs, and how to add it.
 *
 * @summary The `fix` field is a *subpath and export name*, never an import statement: the
 * release pipeline scans shipped text for specifiers, and a message is not an edge.
 */
export interface iMissingModuleReport {
  /** Capability in the schema's own vocabulary: `"dropdown"`, `"popover"`, `"actions"`, `"file"`. */
  capability: string;
  /** Id of the module that provides it — one of `INPUT_MODULE_IDS`. */
  module: string;
  /** The subpath and export that fix it, e.g. `@aio-ui/input/dropdown/module (dropdownInputModule)`. */
  fix: string;
  /** What the visitor sees instead, in one clause, used verbatim in both messages. */
  consequence: string;
  /** `"warn"` degrades and continues; `"error"` throws. */
  severity: "warn" | "error";
}

/**
 * Who is speaking, and where the dedupe and the event go.
 *
 * Every field is optional: a test may call this with nothing and still get the message.
 */
export interface iMissingModuleOptions {
  /** Builder shown in the message prefix — `InputBuilder` (default) or `FormBuilder`. */
  owner?: string;
  /**
   * Capabilities already reported by this builder instance.
   *
   * Dedupe lives with the builder, not with this module: one builder renders one schema,
   * and the same missing module must produce one line per capability for its whole life.
   */
  seen?: Set<string>;
  /** Host emitter (`config.emit`), so the app can render the same fact itself. */
  emit?: ((event: string, detail: any) => void) | null;
}

/** Payload of the `moduleMissing` event. */
export interface iModuleMissingDetail {
  /** Builder that degraded: `input` or `form`. */
  builder: string;
  /** Capability in the schema's vocabulary. */
  capability: string;
  /** Id of the module that was not in the set. */
  module: string;
  /** The subpath and export that fix it. */
  fix: string;
  /** What happened instead. */
  consequence: string;
  /** How loudly it was said. */
  severity: "warn" | "error";
}

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
 * reportMissing({ capability: "dropdown", module: "dropdown", fix: "@aio-ui/input/dropdown/module (dropdownInputModule)", consequence: "the field falls back to a native select with the same options", severity: "warn" }, { seen });
 */
export function reportMissing(report: iMissingModuleReport, options: iMissingModuleOptions = {}): void {
  const { owner = "InputBuilder", seen, emit = null } = options;

  const detail: iModuleMissingDetail = {
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
    throw new Error(
      `[${owner}] ${report.capability}: the "${report.module}" module is not in this builder's set, ` +
      `so ${report.consequence} Add it with ${report.fix}.`
    );
  }

  // Once per builder and capability: a schema repeats the same field type forty times and
  // the fact is still one fact.
  if (seen?.has(report.capability)) return;
  seen?.add(report.capability);

  console.warn(
    `[${owner}] ${report.capability}: the "${report.module}" module is not in this builder's set, ` +
    `so ${report.consequence} Add it with ${report.fix}.`
  );
  emit?.("moduleMissing", detail);
}
