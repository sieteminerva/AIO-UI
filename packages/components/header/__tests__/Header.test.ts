// @vitest-environment happy-dom
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
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
      ["huge", "H2"],
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

describe("Header appearance", () => {
  it("writes every appearance onto the root", () => {
    for (const appearance of ["normal", "bordered", "block", "editorial"] as const) {
      const { root } = build(payload, { appearance });

      expect(root.getAttribute("data-appearance"), appearance).toBe(appearance);
    }
  });

  it("defaults to `normal`", () => {
    expect(build(payload).root.getAttribute("data-appearance")).toBe("normal");
  });
});

/**
 * Ink is a runtime value, so each field lands as the matching component token on the root —
 * never an inline `color` on a child, which a theme could not retune.
 */
describe("Header colour", () => {
  const TOKENS: Record<string, string> = {
    title: "--header-title-color",
    subtitle: "--header-subtitle-color",
    icon: "--header-accent-color",
    metadata: "--header-meta-color",
    block: "--header-surface-bg",
    border: "--header-surface-border",
  };

  it("writes every field as its own token", () => {
    const color = { title: "red", subtitle: "green", icon: "blue", metadata: "gray", block: "white", border: "black" };
    const { root } = build(payload, { color });

    for (const [field, token] of Object.entries(TOKENS)) {
      expect(root.style.getPropertyValue(token), field).toBe(color[field as keyof typeof color]);
    }
  });

  it("writes only what the caller set, so the sheet's themed ink stands for the rest", () => {
    const { root } = build(payload, { color: { title: "#111111" } });

    expect(root.style.getPropertyValue("--header-title-color")).toBe("#111111");
    expect(root.style.getPropertyValue("--header-subtitle-color")).toBe("");
    expect(root.style.getPropertyValue("--header-meta-color")).toBe("");
  });

  it("touches no colour token by default", () => {
    const { root } = build(payload);

    for (const token of Object.values(TOKENS)) {
      expect(root.style.getPropertyValue(token), token).toBe("");
    }
  });

  it("accepts the general door: `selectors['@header'].color` beats the sheet's ink", () => {
    const { root } = build(payload, {
      selectors: { "@header": { tagName: "header", className: "header", color: "tomato" } },
    });

    expect(root.style.color).toBe("tomato");
    // The default selector still wins nothing else: tag and class are unchanged.
    expect(root.tagName).toBe("HEADER");
    expect(root.className).toBe("header");
  });
});

/**
 * Appearance is a shape, not a palette: each variant is pinned as the rules it must own, and
 * every colour it paints must still come from a `--header-*` token. happy-dom runs no
 * cascade, so this reads the sheet text.
 */
describe("the sheet draws each appearance from tokens", () => {
  const sheet = readFileSync(resolve(process.cwd(), "packages/components/header/Header.css"), "utf8");

  it("boxes `bordered` and `block` with the same padding and radius", () => {
    expect(sheet).toMatch(
      /&\[data-appearance="bordered"\],\s*&\[data-appearance="block"\] \{\s*padding: var\(--header-surface-pad\);\s*border-radius: var\(--header-surface-radius\);/,
    );
  });

  it("gives `bordered` a stroke and `block` a surface + soft shadow", () => {
    expect(sheet).toMatch(/&\[data-appearance="bordered"\] \{\s*border: 1px solid var\(--header-surface-border\);/);
    expect(sheet).toMatch(/&\[data-appearance="block"\] \{\s*background: var\(--header-surface-bg\);\s*box-shadow: var\(--header-surface-shadow\);/);
  });

  it("opens `editorial` with a rule, the formal face and a byline meta", () => {
    expect(sheet).toMatch(/&\[data-appearance="editorial"\] \{[\s\S]*?border-block-start: 2px solid var\(--header-divider-color\)/);
    expect(sheet).toMatch(/&\[data-appearance="editorial"\] \{[\s\S]*?font-family: var\(--header-editorial-font\)/);
    expect(sheet).toMatch(/& \.meta \{\s*text-transform: uppercase;\s*letter-spacing: 0\.08em;/);
  });

  it("derives every surface token from an `--app-*` token", () => {
    expect(sheet).toMatch(/--header-surface-bg: var\(--app-surface-strong/);
    expect(sheet).toMatch(/--header-surface-border: var\(--app-border-color/);
    expect(sheet).toMatch(/--header-surface-radius: var\(--app-component-border-radius/);
    expect(sheet).toMatch(/--header-surface-shadow: var\(--app-shadow-soft/);
    expect(sheet).toMatch(/--header-editorial-font: var\(--app-font-heading-formal/);
  });

  it("lets the root ink reach subtitle and meta, so the selector door works", () => {
    expect(sheet).toMatch(/--header-subtitle-color: currentColor;/);
    expect(sheet).toMatch(/--header-meta-color: currentColor;/);
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

/**
 * Placement is a hint on the glyph, not an order change: the DOM keeps the reading order
 * the SEO rules ask for, and the sheet reads `i.icon[data-position]`.
 */
describe("Header icon placement", () => {
  it("defaults to `top`", () => {
    const { root } = build(payload);

    expect(root.querySelector("i.icon")?.getAttribute("data-position")).toBe("top");
  });

  it("writes every `iconPosition` onto the glyph", () => {
    for (const position of ["top", "left", "right", "bottom"] as const) {
      const { root } = build(payload, { iconPosition: position });

      expect(root.querySelector("i.icon")?.getAttribute("data-position"), position).toBe(position);
    }
  });

  it("leaves the reading order alone whatever the placement is", () => {
    for (const position of ["top", "left", "right", "bottom"] as const) {
      const { root } = build(payload, { iconPosition: position });

      expect([...root.children].map((el) => el.className), position).toEqual([
        "user icon",
        "title",
        "subtitle",
        "meta",
      ]);
    }
  });
});

/**
 * The sheet is where the placement becomes a layout. happy-dom runs no cascade, so the four
 * placements and the glyph's block are pinned as rules; the measured heights come from the
 * browser probe on the demo's Elements route.
 */
describe("the sheet places the icon from data-position", () => {
  const sheet = readFileSync(resolve(process.cwd(), "packages/components/header/Header.css"), "utf8");

  it("keys every non-default placement off the glyph attribute", () => {
    for (const position of ["left", "right", "bottom"]) {
      expect(sheet, position).toContain(`&:has(> .icon[data-position="${position}"])`);
    }
  });

  it("states the default alignment instead of inheriting one", () => {
    // Inside a centred docs frame the block inherited `text-align: center`, so
    // `data-alignment="left"` (the default) was a no-op.
    expect(sheet).toMatch(/header\.header \{[\s\S]*?text-align: left;/);
  });

  it("makes the glyph a block as tall as the text stack, centred on it", () => {
    const pair = sheet.slice(sheet.indexOf('&:has(> .icon[data-position="left"]),'));

    // Centred on the stack, not stretched flush to its edges.
    expect(pair).toMatch(/& > \.icon \{[\s\S]*?align-self: center/);
    expect(pair).toMatch(/& > \.icon \{[\s\S]*?justify-self: center/);
    // Title + subtitle + meta: the glyph is centred on all three, not just the heading pair.
    expect(pair).toMatch(/grid-row: 1 \/ span 3/);
    // An absent line is not a row: the span drops to the lines that are there.
    expect(pair).toMatch(/&:not\(:has\(> \.subtitle\)\) > \.icon \{\s*grid-row: 1 \/ span 2;/);
    expect(pair).toMatch(/&:not\(:has\(> \.meta\)\) > \.icon \{\s*grid-row: 1 \/ span 2;/);
    // A lone heading has no stack to span.
    expect(pair).toMatch(/&:not\(:has\(> \.subtitle\)\):not\(:has\(> \.meta\)\) > \.icon \{\s*grid-row: 1;/);
    // A span past the last row would add an empty implicit row and its gap.
    expect(pair).not.toMatch(/grid-row: 1 \/ span 4/);
  });

  it("grows the glyph with the block, inset from its edges", () => {
    const pair = sheet.slice(sheet.indexOf('&:has(> .icon[data-position="left"]),'));

    // A square `0.8 × the block` glyph: big, and never flush against the column edge — a
    // mask/`background` icon paints the whole box, so padding would not give it room.
    expect(pair).toMatch(/& > \.icon \{[\s\S]*?width: calc\(var\(--header-icon-block\) \* 0\.8\)/);
    expect(pair).toMatch(/& > \.icon \{[\s\S]*?aspect-ratio: 1/);
    expect(pair).toMatch(/font-size: calc\(var\(--header-icon-block\) \* 0\.8\)/);
    expect(sheet).toMatch(/--header-icon-block: calc\(var\(--header-title-measure\) \* 2\.5\)/);
    // `data-size` swaps the measure, so the icon (and the gap) follow the chosen size.
    expect(sheet).toMatch(/&\[data-size="huge"\] \{\s*--header-title-measure:/);
  });

  it("derives the gap from the type scale, clamped at both ends", () => {
    expect(sheet).toMatch(/--header-title-measure: var\(--header-title-size\)/);
    expect(sheet).toMatch(/--header-gap: clamp\(0\.35rem, calc\(var\(--header-title-measure\) \* 0\.35\), 0\.5rem\)/);
    // Stacked rows sit tighter than the column gap beside an icon.
    expect(sheet).toMatch(/row-gap: calc\(var\(--header-gap\) \* 0\.5\)/);
    // A page-level gap knew nothing about the heading size, so `small` kept the `huge` gap.
    expect(sheet).not.toMatch(/--header-gap: var\(--app-gap/);
  });

  it("lines `.meta` up with the heading pair, not with the glyph", () => {
    // Beside an icon the block is two columns. The meta line belongs to the text column
    // (same left edge as the title), so it must not be given `grid-column: 1 / -1`.
    // `{` right after the glyph attribute is the standalone placement block, not the shared
    // `left, right` block above it.
    const beside = sheet.slice(sheet.indexOf('&:has(> .icon[data-position="left"]) {'));

    expect(beside).toMatch(/& > \.title,\s*& > \.subtitle,\s*& > \.meta \{\s*grid-column: 2;/);
    expect(beside).toMatch(/& > \.title,\s*& > \.subtitle,\s*& > \.meta \{\s*grid-column: 1;/);
    // Only the closing line still spans the whole block.
    expect(sheet).toMatch(/& > \.divider \{\s*grid-column: 1 \/ -1;/);
  });

  it("carries no Sass-style suffix the build would drop", () => {
    expect(sheet).not.toMatch(/&-[a-z]/i);
  });
});
