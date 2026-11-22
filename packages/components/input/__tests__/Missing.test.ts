// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { InputBuilder } from "../Input";
import { INPUT_MODULE_DEFINITIONS } from "../index";

/**
 * A degraded capability must never be silent.
 *
 * The layer degrades by design — a `dropdown` without its module is a native `<select>` —
 * so the danger is not the plainer control, it is that nobody is told. These tests pin the
 * three voices: a **warning once per builder and capability**, an **event** a host can
 * render, and a **throw** where a warning would still leave a hole.
 */

describe("input layer reports what is missing", () => {
  let warn: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warn = vi.spyOn(console, "warn").mockImplementation(() => { });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("warns once for a dropdown that fell back to a native select", () => {
    const builder = new InputBuilder({ modules: [] });
    const field = { type: "dropdown", id: "pick", title: "Pick", config: { options: ["a"] } };

    builder.create({ content: field as any });
    builder.create({ content: field as any });

    // Two fields, one fact: a forty-field schema must not print forty lines.
    expect(warn).toHaveBeenCalledTimes(1);
    const message = String(warn.mock.calls[0][0]);
    expect(message).toContain('"dropdown" module is not in this builder\'s set');
    expect(message).toContain("native select");
    // The fix is named by subpath and export — never as an import statement, which the
    // release pipeline would read as a real edge.
    expect(message).toContain("@aio-ui/input/dropdown (dropdownInputModule)");
  });

  it("stays quiet for a dropdown when the module is there", () => {
    new InputBuilder({ modules: INPUT_MODULE_DEFINITIONS }).create({
      content: {
        type: "dropdown",
        id: "pick",
        title: "Pick",
        config: { options: ["a"] },
      },
    } as any);

    expect(warn).not.toHaveBeenCalled();
  });

  it("warns for a file field with no uploader, and names the module", () => {
    new InputBuilder({ modules: [] }).create({ content: { type: "file", id: "docs", title: "Docs" } } as any);

    expect(warn).toHaveBeenCalledTimes(1);
    const message = String(warn.mock.calls[0][0]);
    expect(message).toContain('"file" module');
    expect(message).toContain("onFileSelected never fires");
    expect(message).toContain("@aio-ui/input/file-uploader (fileUploaderInputModule)");
  });

  it("warns for a declared popover instead of dropping it in silence", () => {
    // The popover only decorates, so the builder reads the ids the preset declared.
    new InputBuilder({ modules: [] }).create({
      content: {
        type: "text",
        id: "when",
        title: "When",
        config: { popover: "<div>picker</div>" },
      },
    } as any);

    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0][0])).toContain('"popover" module');
  });

  it("does not warn twice for two different capabilities on one builder", () => {
    const builder = new InputBuilder({ modules: [] });
    builder.create({ content: { type: "dropdown", id: "a", title: "A", config: { options: ["x"] } } } as any);
    builder.create({ content: { type: "file", id: "b", title: "B" } } as any);

    const messages = warn.mock.calls.map((call: unknown[]) => String(call[0]));
    expect(messages).toHaveLength(2);
    expect(messages[0]).toContain("dropdown");
    expect(messages[1]).toContain("file");
  });

  it("emits moduleMissing so a host can surface the same fact itself", () => {
    const events: Array<[string, any]> = [];
    const builder = new InputBuilder({
      modules: [],
      emit: (event: string, detail: any) => events.push([event, detail]),
    } as any);

    builder.create({ content: { type: "dropdown", id: "pick", title: "Pick", config: { options: ["a"] } } } as any);

    // The host emitter also carries the builder's own lifecycle events; this is the one
    // that must never be lost.
    const missing = events.filter(([name]) => name === "moduleMissing");
    expect(missing).toHaveLength(1);
    const [, detail] = missing[0];
    expect(detail).toMatchObject({
      builder: "InputBuilder",
      capability: "dropdown",
      module: "dropdown",
      severity: "warn",
    });
    expect(detail.fix).toContain("@aio-ui/input/dropdown");
  });

  it("throws for a declared action set when no module can render buttons", () => {
    // A warning is not enough here: the field would render perfectly and the buttons would
    // simply never exist — a hole, not a plainer control.
    const amount = () => ({ content: { type: "text", id: "amount", title: "Amount", config: { actions: ["editor"] } } });

    expect(() => new InputBuilder({ modules: [] }).create(amount() as any)).toThrow(
      /"controls" module is not in this builder's set/,
    );

    expect(() => new InputBuilder({ modules: [] }).create(amount() as any)).toThrow(
      /@aio-ui\/input\/controls/,
    );
  });

  it("renders the action set when the controls module is present", () => {
    const field = new InputBuilder({ modules: INPUT_MODULE_DEFINITIONS }).create({
      content: {
        type: "text",
        id: "amount",
        title: "Amount",
        config: { actions: ["editor"] },
      },
    } as any) as HTMLElement;

    expect(field.querySelectorAll("button").length).toBeGreaterThan(0);
  });
});
