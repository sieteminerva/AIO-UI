// @vitest-environment happy-dom
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { AccordionBuilder } from "../Accordion";

/**
 * Accordion is one of the older builders: its selector map lives in the constructor, so the
 * contract is checked through the rendered DOM instead of an exported table.
 *
 * `prepare()` accepts a `{ content }` envelope whose items are `{ title, description }`.
 *
 * The sheet is read from disk so a rule that the build silently drops cannot hide from these
 * tests. The path is resolved from the repo root because Vitest runs from there and happy-dom's
 * `URL` is not Node's, which makes `new URL(…, import.meta.url)` unusable here.
 */
const sheet = readFileSync(
  resolve(process.cwd(), "packages/components/accordion/Accordion.css"),
  "utf8",
);

function build(content: any[] | any): HTMLElement {
  return new AccordionBuilder().create({ content }) as HTMLElement;
}

describe("accordion", () => {
  it("renders one details/summary per item", () => {
    const root = build([
      { title: "First", description: "One" },
      { title: "Second", description: "Two" },
    ]);

    const sections = root.querySelectorAll("details");
    expect(root.tagName.toLowerCase()).toBe("div");
    expect(root.classList.contains("accordion")).toBe(true);
    expect(sections).toHaveLength(2);
    expect(sections[0].querySelector("summary")?.textContent).toBe("First");
    expect(sections[0].querySelector(".content p.desc")?.textContent).toBe("One");
  });

  it("accepts a single item without an array", () => {
    const root = build({ title: "Only", description: "Body" });

    expect(root.querySelectorAll("details")).toHaveLength(1);
    expect(root.querySelector("summary")?.textContent).toBe("Only");
  });

  it("falls back to placeholder copy for a record without a title", () => {
    const root = build([{}]);

    // The leaf cases own the fallback copy, so a missing title/description still labels the row.
    expect(root.querySelector("summary")?.textContent).toBe("Untitled Header");
    expect(root.querySelector(".content p.desc")?.textContent).toBe("Untitled Content");
  });

  it("drops nullish records instead of rendering empty rows", () => {
    const root = build([null, { title: "Only", description: "Body" }, undefined]);

    expect(root.querySelectorAll("details")).toHaveLength(1);
    expect(root.querySelector("summary")?.textContent).toBe("Only");
  });

  it("stamps the appearance on the root, never on the sections", () => {
    const root = new AccordionBuilder({ appearance: "compact" }).create({
      content: [{ title: "First", description: "One" }],
    }) as HTMLElement;

    expect(root.dataset.appearance).toBe("compact");
    expect(root.querySelector("details")?.hasAttribute("data-appearance")).toBe(false);
  });

  it("gives every section one shared native `name` when autoClose is on", () => {
    const root = new AccordionBuilder({ autoClose: true }).create({
      content: [{ title: "A" }, { title: "B" }],
    }) as HTMLElement;
    const sections = Array.from(root.querySelectorAll("details"));
    const names = sections.map((section) => section.getAttribute("name"));

    expect(names[0]).toBeTruthy();
    expect(new Set(names).size).toBe(1);
  });

  it("leaves the sections without a `name` when autoClose is off", () => {
    const root = build([{ title: "A" }, { title: "B" }]);

    expect(root.querySelector("details")?.hasAttribute("name")).toBe(false);
  });

  it("opens every section for `expanded: true`", () => {
    const root = new AccordionBuilder({ expanded: true }).create({
      content: [{ title: "A" }, { title: "B" }],
    }) as HTMLElement;

    expect(root.querySelectorAll("details[open]")).toHaveLength(2);
  });

  it("opens only the first section when `expanded` meets `autoClose`", () => {
    const root = new AccordionBuilder({ expanded: true, autoClose: true }).create({
      content: [{ title: "A" }, { title: "B" }],
    }) as HTMLElement;
    const sections = root.querySelectorAll("details");

    expect(sections[0].hasAttribute("open")).toBe(true);
    expect(sections[1].hasAttribute("open")).toBe(false);
  });

  it("opens only the sections whose key `expanded` lists", () => {
    const root = new AccordionBuilder({ expanded: ["second"] }).create({
      content: [
        { id: "first", title: "A" },
        { id: "second", title: "B" },
      ],
    }) as HTMLElement;
    const sections = root.querySelectorAll("details");

    expect(sections[0].hasAttribute("open")).toBe(false);
    expect(sections[1].hasAttribute("open")).toBe(true);
  });

  it("turns motion off through `data-animation=\"none\"`", () => {
    const root = new AccordionBuilder({ animation: false }).create({
      content: [{ title: "A" }],
    }) as HTMLElement;

    expect(root.dataset.animation).toBe("none");
  });

  it("passes a keyframe name through to the sheet", () => {
    const root = new AccordionBuilder({ animation: { in: "popIn" } }).create({
      content: [{ title: "A" }],
    }) as HTMLElement;

    expect(root.dataset.animation).toBe("custom");
    expect(root.style.getPropertyValue("--accordion-anim-in-name")).toBe("popIn");
  });
});

describe("accordion sheet", () => {
  it("nests every rule under the one root selector and never writes a Sass `&-` join", () => {
    expect(sheet).not.toMatch(/&-[a-z]/i);
    expect(sheet).toMatch(/^\.accordion \{/m);
  });

  it("animates the disclosure box itself, not a fake max-height", () => {
    expect(sheet).toMatch(/::details-content/);
    expect(sheet).toMatch(/interpolate-size:\s*allow-keywords/);
  });

  it("keeps the gap between panels, not after the last one", () => {
    expect(sheet).toMatch(/:last-child\s*\{\s*margin-bottom:\s*0/);
  });

  it("gives the summary a keyboard ring and scopes hover to a closed panel", () => {
    expect(sheet).toMatch(/&:focus-visible\s*\{[^}]*outline:/);
    expect(sheet).toMatch(/:hover:not\(\[open\]\)/);
  });

  it("drops the drawer motion when the user asks for reduced motion", () => {
    expect(sheet).toMatch(/@media \(prefers-reduced-motion: reduce\)/);
  });

  it("frames compact as one list of rows, not a stack of cards", () => {
    // The frame moves to the root, rows lose their own border, and a hairline divides them.
    expect(sheet).toMatch(/\[data-appearance="compact"\]\s*\{[^}]*border:\s*1px/);
    expect(sheet).toMatch(/&\s*\+\s*details\s*\{[^}]*border-top:/);
  });

  it("swaps the +/- marker for the masked arrow icon in compact", () => {
    // The global `arrow.left` mask, turned down while closed and left once open.
    expect(sheet).toMatch(/--accordion-icon-arrow:\s*url\("data:image\/svg\+xml/);
    expect(sheet).toMatch(/mask:\s*var\(--accordion-icon-arrow\)/);
    expect(sheet).toMatch(/transform:\s*rotate\(-90deg\)/);
    expect(sheet).toMatch(/details\[open\] summary::after\s*\{[^}]*content:\s*""/);
  });
});
