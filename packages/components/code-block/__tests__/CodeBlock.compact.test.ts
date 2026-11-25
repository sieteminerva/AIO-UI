// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";

import { CodeBlockBuilder } from "../CodeBlock";

/**
 * `compact` is a shape, not a size prop on every child: the builder only adds a class and
 * the sheet retunes its own tokens under `&.compact`. So the contract is exactly two facts —
 * the class is absent by default, present when asked.
 */
const build = (config: ConstructorParameters<typeof CodeBlockBuilder>[0]) =>
  new CodeBlockBuilder(config).create({ content: { code: "icon user" } });

describe("Code Block compact", () => {
  it("stays off by default", () => {
    expect(build({}).classList.contains("compact")).toBe(false);
  });

  it("adds the compact class on the root when configured", () => {
    expect(build({ appearance: "compact" }).classList.contains("compact")).toBe(true);
  });

  it("keeps the action row alongside compact", () => {
    const root = build({ appearance: "compact", actions: [{ type: "copy", onClick: () => undefined }] });

    const buttons = root.querySelectorAll<HTMLButtonElement>(".actions button");
    expect(buttons).toHaveLength(1);
    expect(buttons[0].dataset.action).toBe("copy");
  });
});
