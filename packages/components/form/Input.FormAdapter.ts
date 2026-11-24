import type { iModuleDefinition } from "@aio-ui/module-loader";
import type { iFormModuleContext } from "./FormModuleTypes";
import { FORM_MODULE_IDS } from "./FormModuleTypes";
import type { FormField } from "./FormSchema";
import { InputBuilder } from "@aio-ui/input";
import { inputFilesOf, mountControls, mountInputModules } from "@aio-ui/input";
import { INPUT_MODULE_IDS } from "@aio-ui/input";
import { reportMissing } from "@aio-ui/input";

/** The two blocks `InputBuilder.create()` takes, read from one field node. */
interface iFieldSchema {
  content: Record<string, any>;
  config: Record<string, any>;
}

/**
 * Reads the two blocks of one field node.
 *
 * The node already carries `content` / `config` — it is the input schema, unchanged — so the
 * adapter splits nothing and renames nothing. The form's own keys (`condition`, `then`) sit
 * beside the blocks on the same node and are never handed over: the cascade engine has read
 * them before a field is rendered.
 *
 * @param input - Field node from the form schema.
 * @returns `{ content, config }`, both defaulted to an empty bag.
 */
function blocksOf(input: FormField): iFieldSchema {
  return { content: input.content ?? {}, config: input.config ?? {} };
}

/**
 * Field rendering adapter.
 *
 * @summary Owns `InputBuilder`: it creates every field the form renders, offers subtrees
 * to the input modules (the file adapter for raw HTML fields), and — only when the form
 * asks for it — contributes the selected files to the submit payload.
 *
 * Nothing here parses or serializes a file: the form config decides, because that is a
 * policy, not a mechanism.
 */
class InputFormAdapter {
  /** Host context captured at load time. */
  readonly #context: iFormModuleContext;

  /**
   * @param context - Host context.
   */
  constructor(context: iFormModuleContext) {
    this.#context = context;
  }

  /**
   * The input adapter set this form runs on, or `undefined` for a plain field.
   *
   * @summary The host may declare the input modules (`inputModules`, or a manifest with
   * `scope: "input"`); when it does, fields must use *that* set. When it does not, the
   * field gets no input sub-modules at all: since `0.2.2` there is no default to fall back
   * to, because a default would be a static import edge and the whole point of the split
   * is that an app which never imports `@aio-ui/input/modules` never compiles them.
   */
  get #preset() {
    // `?.` because a context built by a test (or by a third-party host) may predate the field.
    return this.#context.inputModules?.length ? this.#context.inputModules : undefined;
  }

  /**
   * Builds one field from the input schema.
   *
   * @param input - Field node from the form schema (identity and text, behaviour keys,
   *   and the form-owned `condition` / `then`).
   * @param formId - Id of the owning form, forwarded to the field markup.
   * @returns The rendered field element.
   *
   * @summary The node is split into the two blocks `InputBuilder.create()` takes, so the
   * input layer never has to guess which key is data and which is behaviour. The host's
   * builder config comes along, so the field inherits `themeId`, `namespace` and `emit`
   * instead of starting blank — and so does its adapter set.
   */
  public renderField(input: FormField, formId: string): HTMLElement {
    const { content, config } = blocksOf(input);
    // `selectors` is builder config, not field config: each field is its own builder
    // instance, so a per-field skin is declared on the node and lifted here. `resolveConfig`
    // merges it key by key, so a field that overrides one label keeps every other default.
    const { selectors, ...fieldConfig } = config;

    return new InputBuilder({
      ...this.#context.builderConfig,
      formId,
      modules: this.#preset,
      ...(selectors ? { selectors } : {}),
    } as any).create({ content, config: fieldConfig } as any);
  }

  /**
   * Covers file inputs that bypass `InputBuilder` (raw HTML fields).
   *
   * @param root - Form element or freshly mounted fieldset.
   * @returns Nothing.
   */
  public mount(root: HTMLElement): void {
    mountInputModules(root, this.#preset);
  }

  /**
   * Gives a group the same control set a field can have.
   *
   * @param fieldset - Group the set acts on.
   * @param spec - `{ actions, position? }` declared by the group schema.
   * @returns The controls node, or `null` when nothing was declared.
   * @throws {Error} When the group declared a button and no module can render one.
   *
   * @summary Delegated to the input module registry, so this adapter does not know how a
   * button works. A group that declared no buttons simply gets none; a group that declared
   * buttons and got none is a hole, and it says so instead of rendering a fieldset that
   * quietly lost its actions.
   */
  public renderActions(fieldset: HTMLElement, spec: { actions: any; position?: "left" | "right" }): HTMLElement[] | null {
    const controls = mountControls(fieldset, spec.actions, spec.position ?? "right", this.#preset);

    if (!controls && declaredAny(spec.actions)) {
      reportMissing(
        { capability: "actions", module: INPUT_MODULE_IDS.controls, fix: "@aio-ui/input/controls (inputControlsInputModule)", consequence: "the declared action buttons would never render.", severity: "error" },
        { owner: "FormBuilder", emit: this.#context.builderConfig?.emit }
      );
    }

    return controls ? [controls] : null;
  }

  /**
   * Contributes the selected files when — and only when — the form asks for them.
   *
   * @summary `config.files` is `"ignore"` by default: a form submit carries form data,
   * not an implied file payload. A callback receives the raw `File` map and decides what
   * to add (a Drive serialization, a signed URL, nothing at all).
   * @param payload - Mutable submit payload.
   * @throws {Error} When a `files` policy is declared and no module can read the selected
   *   files — the policy would receive an empty map and drop the bytes without a word.
   */
  public async beforeSubmit(payload: Record<string, any>): Promise<void> {
    const policy = this.#context.config.files;
    if (typeof policy !== "function") return;

    // A policy is a promise that the bytes arrive. With no module to read them the map is
    // empty, `Object.assign` adds nothing, and the form submits happily without the
    // upload — the one degradation that must never be silent.
    if (!this.#canReadFiles) {
      reportMissing(
        { capability: "file", module: INPUT_MODULE_IDS.file, fix: "@aio-ui/input/file-uploader (fileUploaderInputModule) — @aio-ui/form already includes it", consequence: "config.files receives no files and the selected bytes are dropped.", severity: "error" },
        { owner: "FormBuilder", emit: this.#context.builderConfig?.emit }
      );
    }

    const files = inputFilesOf(this.#context.form.id, this.#preset);
    Object.assign(payload, await policy(files, this.#context.form));
  }

  /**
   * Whether this form's field set can hand over the selected files.
   *
   * @summary Method sniffing for live adapters, id matching for definitions — the two
   * shapes a preset can hold. A definition is not instantiated here on purpose: asking
   * "can you read files" must never cost a load.
   */
  get #canReadFiles(): boolean {
    return (this.#preset ?? []).some(
      (item) => typeof (item as any).getFiles === "function" || String((item as any).id) === INPUT_MODULE_IDS.file
    );
  }
}

/**
 * Whether a declared action set asks for at least one button.
 *
 * @param actions - Whatever the group schema declared.
 * @returns `false` for nothing at all, and for an empty array or object.
 *
 * @summary `actions: []` and `actions: {}` declare nothing, so they must not be read as
 * "buttons were asked for and lost". Everything else — an array with entries, or a map
 * keyed by action type — counts.
 */
function declaredAny(actions: any): boolean {
  if (!actions) return false;
  if (Array.isArray(actions)) return actions.filter(Boolean).length > 0;
  return Object.keys(actions).length > 0;
}

/**
 * Input module definition.
 *
 * @summary Required for rendering: without it the builder cannot create fields
 * and fails loudly instead of rendering an empty form.
 *
 * @example
 * // registered by FORM_ADAPTER_DEFINITIONS (the form's default set)
 */
export const inputFormAdapter: iModuleDefinition<iFormModuleContext, InputFormAdapter> = {
  id: FORM_MODULE_IDS.input,

  /**
   * Builds the input adapter for the host form.
   *
   * @param context - Host context.
   * @returns The live adapter.
   */
  load: (context) => new InputFormAdapter(context),
};
