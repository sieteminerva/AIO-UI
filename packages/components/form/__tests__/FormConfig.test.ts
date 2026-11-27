// @vitest-environment happy-dom
import { describe, expect, it, vi } from "vitest";

import { ModuleLoader } from "@aio-ui/module-loader";

import { FormBuilder } from "../Form";
import { inputFormAdapter } from "../Input.FormAdapter";

/**
 * Everything `iFormConfig` declares must reach the DOM. These are the keys that used to be
 * accepted by the type and then silently ignored (`title`, `description`, `name`), plus the
 * two that were applied by string concatenation and could double up.
 */
const schema = [{ id: "g", title: "Grup", group: [{ content: { type: "text", id: "name", label: "Nama" } }] }];

function build(config: Record<string, any>): HTMLFormElement {
  return new FormBuilder({ modules: new ModuleLoader("form", [inputFormAdapter]) }).create({ content: schema, config }) as HTMLFormElement;
}

describe("form header", () => {
  it("renders the title and description above the first group", () => {
    const form = build({ title: "Pesanan baru", description: "Isi data pengiriman" });

    expect(form.querySelector("h2.title")?.textContent).toBe("Pesanan baru");
    expect(form.querySelector("p.desc")?.textContent).toBe("Isi data pengiriman");
    // the heading comes before the fieldset
    expect(form.firstElementChild?.tagName).toBe("H2");
  });

  it("renders nothing extra when the config omits them", () => {
    const form = build({});

    expect(form.querySelector("h2.title")).toBeNull();
    expect(form.querySelector(":scope > p.desc")).toBeNull();
  });
});

describe("form identity", () => {
  it("sets the form name", () => {
    expect(build({ name: "order-form" }).getAttribute("name")).toBe("order-form");
  });

  it("derives the id from config.id", () => {
    expect(build({ id: "demo order" }).id).toBe("form-demo-order");
  });

  it("accepts several class tokens without doubling them", () => {
    const form = build({ className: "stacked  bordered" });

    expect(form.classList.contains("stacked")).toBe(true);
    expect(form.classList.contains("bordered")).toBe(true);
    expect(form.className).not.toMatch(/stacked\s+stacked/);
    expect(form.className).not.toMatch(/\s{2,}/);
  });

  it("marks a multistep form on the element", () => {
    expect(build({ multistep: true }).classList.contains("multistep")).toBe(true);
    expect(build({}).classList.contains("multistep")).toBe(false);
  });

  it("keeps method and action", () => {
    const form = build({ method: "get", action: "/submit" });

    expect(form.method).toBe("get");
    expect(form.getAttribute("action")).toBe("/submit");
  });
});

describe("reserved height", () => {
  it("writes `minHeight` onto the form as the token the sheet reads", () => {
    const form = build({ minHeight: "12rem" });

    // The option used to be written onto `@container`, an element `prepare()` never
    // renders, so a form kept the sheet's 400px fallback whatever the config said.
    expect(form.style.getPropertyValue("--form-min-height")).toBe("12rem");
  });

  it("defaults the token to the sheet's own fallback", () => {
    // The config default is the same 400px the sheet falls back to, so the two cannot drift.
    expect(build({}).style.getPropertyValue("--form-min-height")).toBe("400px");
  });
});

describe("empty or malformed schema", () => {
  // The final branch of `prepare()` used to render whatever it was given, so an empty
  // object became one blank control — a schema mistake that looked deliberate.
  const make = (content: any): HTMLFormElement => new FormBuilder().create({ content }) as HTMLFormElement;

  it("renders no field for an empty list", () => {
    expect(make([]).querySelectorAll(".field")).toHaveLength(0);
  });

  it("renders no field for an empty object", () => {
    expect(make({}).querySelectorAll(".field")).toHaveLength(0);
  });

  it("drops entries that name no shape, and says how many", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => { });

    const form = make([{ title: "bukan field" }, null]);

    expect(form.querySelectorAll(".field")).toHaveLength(0);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("named no field type"));
    warn.mockRestore();
  });

  it("still renders the valid entries next to a bad one", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => { });

    const form = make([{}, { content: { type: "text", id: "still-there", label: "Ada" } }]);

    expect(form.querySelector("#still-there")).not.toBeNull();
    expect(form.querySelectorAll(".field")).toHaveLength(1);
    warn.mockRestore();
  });
});
