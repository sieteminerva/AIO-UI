// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";

import { validate } from "@aio-ui/base";

import { HeaderBuilder } from "../Header";
import { DEFAULT_SELECTORS, ELEMENT_KEYS } from "../Header.kit";

/**
 * Header — the rendered block, not just its payload.
 *
 * The proof is the band's usual door: `create()` then `inspect()`, plus a few DOM readings
 * for what a serialised string cannot state (which tag the heading is, what is the last child).
 */

function time(value: string, label = value): HTMLTimeElement {
  const el = document.createElement("time");
  el.dateTime = value;
  el.textContent = label;
  return el;
}

const payload = {
  title: "Merawat kaos katun agar tidak melar",
  subtitle: "Example subtitle",
  icon: "user",
  metadata: {
    author: { textContent: "Oleh: Rina", className: "author" },
    date: time("2026-01-12", "12 Januari 2026"),
  },
};

function build(content: any = payload, config: Record<string, any> = {}) {
  const builder = new HeaderBuilder(config);
  const root = builder.create({ content });
  return { builder, root };
}

describe("Header payload contract", () => {
  it("validates its own example", () => {
    expect(validate(HeaderBuilder.contract, HeaderBuilder.contract.example)).toEqual([]);
  });

  it("declares a selector for every element key", () => {
    expect(Object.keys(DEFAULT_SELECTORS).sort()).toEqual([...ELEMENT_KEYS].sort());
  });

  it("gives every key a tag", () => {
    for (const key of ELEMENT_KEYS) {
      expect(DEFAULT_SELECTORS[key].tagName, key).toBeTruthy();
    }
  });
});

describe("Header render", () => {
  it("renders a real <header> root with the size, appearance and alignment attributes", () => {
    const { root } = build(payload, { size: "huge", alignment: "center" });

    expect(root.tagName).toBe("HEADER");
    expect(root.className).toBe("header");
    expect(root.getAttribute("data-size")).toBe("huge");
    expect(root.getAttribute("data-appearance")).toBe("normal");
    expect(root.getAttribute("data-alignment")).toBe("center");
  });

  it("maps size to the heading level", () => {
    const levels: Array<[string, string]> = [
      ["huge", "H1"],
      ["normal", "H3"],
      ["medium", "H4"],
      ["small", "H5"],
    ];

    for (const [size, tag] of levels) {
      const { root } = build(payload, { size });
      expect(root.querySelector(".title")?.tagName, size).toBe(tag);
    }
  });

  it("keeps the icon and divider out of the accessible name", () => {
    const { root } = build(payload, { useDivider: true });

    const icon = root.querySelector("i.icon")!;
    expect(icon.className).toBe("user icon");
    expect(icon.getAttribute("aria-hidden")).toBe("true");
    expect(icon.getAttribute("focusable")).toBe("false");
    expect(root.querySelector(".divider")?.getAttribute("aria-hidden")).toBe("true");
  });

  it("loops metadata in object order: a scalar, a classed pair and a live element", () => {
    const { root } = build({
      title: "T",
      metadata: {
        author: { textContent: "Oleh: Rina", className: "author" },
        reading: "3 menit",
        date: time("2026-01-12", "12 Januari 2026"),
      },
    });

    const spans = Array.from(root.querySelectorAll(".meta > span"));
    expect(spans.map((el) => el.className)).toEqual(["author", "reading"]);
    expect(spans[0].textContent).toBe("Oleh: Rina");

    // A live element is appended as-is: it owns its tag, datetime and text.
    const date = root.querySelector(".meta > time")!;
    expect(date.getAttribute("datetime")).toBe("2026-01-12");
    expect(date.textContent).toBe("12 Januari 2026");
  });

  it("keeps the property class on a span even when the pair renames it", () => {
    const { root } = build({ title: "T", metadata: { author: { textContent: "Rina", className: "accent" } } });
    const span = root.querySelector(".meta > span")!;

    expect(span.classList.contains("author")).toBe(true);
    expect(span.classList.contains("accent")).toBe(true);
  });

  it("skips absent parts instead of appending empty nodes", () => {
    const { root } = build({ title: "Only a title" });

    expect(root.querySelector("i.icon")).toBeNull();
    expect(root.querySelector(".subtitle")).toBeNull();
    expect(root.querySelector(".meta")).toBeNull();
    expect(root.querySelector(".divider")).toBeNull();
  });

  it("opts into schema.org microdata, and stays clean by default", () => {
    const plain = build(payload).root;
    expect(plain.hasAttribute("itemscope")).toBe(false);
    expect(plain.querySelector(".title")?.hasAttribute("itemprop")).toBe(false);

    const rich = build(payload, { structuredData: true }).root;
    expect(rich.getAttribute("itemtype")).toBe("https://schema.org/Article");
    expect(rich.querySelector(".title")?.getAttribute("itemprop")).toBe("headline");
    expect(rich.querySelector(".author")?.getAttribute("itemprop")).toBe("author");
  });
});

describe("Header inspect (proof of render)", () => {
  it("inventories the block: keys, meta shape, values and decoration", () => {
    const { builder } = build(payload, { useDivider: true });
    const { keys, hierarchy, html } = builder.inspect();

    expect(keys).toContain("@header");
    expect(hierarchy["@header>meta"]?.elements).toContain("span.author");
    expect(hierarchy["@header"]?.elements).toContain("span.divider"); // sibling after .meta
    expect(html).toContain("Oleh: Rina");
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('<time datetime="2026-01-12">');
  });

  it("omits the divider from the tree when useDivider is false", () => {
    const { builder, root } = build(payload, { useDivider: false });
    const { hierarchy } = builder.inspect();

    expect(hierarchy["@header"]?.elements).not.toContain("span.divider");
    expect(root.lastElementChild?.className).toBe("meta");
  });
});
