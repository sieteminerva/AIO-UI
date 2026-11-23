// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";

import { MessageBuilder, messageFormAdapter } from "../index";

/**
 * The package root is the only door.
 *
 * A host wiring submit feedback writes `{ id: "message", path: "@aio-ui/message",
 * export: "messageFormAdapter" }` and nothing else, so the adapter has to be part of the
 * same module namespace as the builder — a `/adapters/FormAdapter` subpath is not in the
 * `exports` map and would 404 at runtime.
 */
describe("@aio-ui/message root", () => {
  it("exports the builder and the form adapter from one module", () => {
    expect(typeof MessageBuilder).toBe("function");
    expect(messageFormAdapter.id).toBe("message");
    expect(typeof messageFormAdapter.load).toBe("function");
  });

  it("loads an adapter with the `notify` hook the form calls", () => {
    const adapter = messageFormAdapter.load({ config: {} } as any);

    expect(typeof (adapter as any).notify).toBe("function");
  });
});
