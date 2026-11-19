// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { TabBuilder } from "../Tab";

/**
 * A tab set is a menu plus one panel per body item. Panels are built lazily by default, so the
 * content test turns `lazyload` off to have something to assert on.
 *
 * The sheet is read from disk so a rule that the build silently drops cannot hide from these
 * tests. The path is resolved from the repo root because Vitest runs from there and happy-dom's
 * `URL` is not Node's, which makes `new URL(…, import.meta.url)` unusable here.
 */
const sheet = readFileSync(resolve(process.cwd(), "packages/components/tab/Tab.css"), "utf8");

function build(content: any, config: Record<string, any> = {}): HTMLElement {
  return new TabBuilder({ lazyload: false, ...config }).create(content) as HTMLElement;
}

const content = {
  menu: [{ label: "Satu", title: "Satu" }],
  body: [{ content: { title: "Isi", description: "Desc" } }],
};

describe("tab", () => {
  it("renders a tab root with a menu item per menu record", () => {
    const root = build(content);

    // Regression: the root class list used to repeat `tab`. The position and the look are
    // data attributes now, so the class list stays exactly one word.
    expect(root.className).toBe("tab");
    expect(root.dataset.menu).toBe("top");
    expect(root.dataset.tabStyle).toBeUndefined();
    const items = root.querySelectorAll(".menu button.button");
    expect(items).toHaveLength(1);
    expect(items[0].getAttribute("role")).toBe("tab");
    expect(items[0].querySelector(".btn-label")?.textContent).toBe("Satu");
  });

  it("renders one panel per body item with its content", () => {
    const root = build(content);
    const panels = root.querySelectorAll(".body .panel");

    expect(panels).toHaveLength(1);
    expect(panels[0].getAttribute("role")).toBe("tabpanel");
    expect(panels[0].querySelector(".content .title")?.textContent).toBe("Isi");
    expect(panels[0].querySelector(".content .desc")?.textContent).toBe("Desc");
  });

  it("renders the footer only when the payload has one", () => {
    expect(build(content).querySelector(".footer")).toBeNull();
    expect(build({ ...content, footer: { text: "Catatan" } }).querySelector(".footer")).not.toBeNull();
  });

  it("marks only the first menu item as selected on first paint", () => {
    const root = build({
      menu: [
        { label: "Satu", title: "Satu" },
        { label: "Dua", title: "Dua" },
      ],
      body: [{ content: { title: "A" } }, { content: { title: "B" } }],
    });
    const items = root.querySelectorAll(".menu button.button");

    expect(items).toHaveLength(2);
    expect(items[0].getAttribute("aria-selected")).toBe("true");
    expect(items[0].classList.contains("active")).toBe(true);
    expect(items[1].getAttribute("aria-selected")).toBe("false");
  });

  it("stamps the appearance requested by config", () => {
    expect(build(content, { appearance: "underline" }).dataset.appearance).toBe("underline");
    expect(build(content).dataset.appearance).toBeUndefined();
  });

  it("keeps the folder look on every menu position", () => {
    // The sheet is nested CSS: a Sass-style suffix would be dropped silently by the build, so
    // the source is checked for one position block per edge of the panel.
    for (const position of ["top", "bottom", "left", "right"]) {
      expect(sheet).toContain(`&[data-menu="${position}"] {`);
    }

    expect(build(content, { appearance: "folder", menuPosition: "bottom" }).dataset.appearance).toBe(
      "folder",
    );
  });

  it("does not emit Sass-style `&-` selectors", () => {
    expect(sheet).not.toMatch(/&-[a-z]/);
  });

  it("honours `active` given as a label", () => {
    const root = build(
      {
        menu: [
          { label: "Satu", title: "Satu" },
          { label: "Dua", title: "Dua" },
        ],
        body: [{ content: { title: "A" } }, { content: { title: "B" } }],
      },
      { active: "Dua" },
    );
    const items = root.querySelectorAll(".menu button.button");

    expect(items[0].getAttribute("aria-selected")).toBe("false");
    expect(items[1].getAttribute("aria-selected")).toBe("true");
  });

  it("turns panel motion off through `data-animation=\"none\"`", () => {
    expect(build(content, { animation: false }).dataset.animation).toBe("none");
  });

  it("passes keyframe names through to the sheet", () => {
    const root = build(content, { animation: { in: "slideUp", out: "slideDown" } });

    expect(root.dataset.animation).toBe("custom");
    expect(root.style.getPropertyValue("--tab-anim-in")).toBe("slideUp");
    expect(root.style.getPropertyValue("--tab-anim-out")).toBe("slideDown");
  });

  it("keeps the previous panel content until the out animation ends", () => {
    const builder = new TabBuilder({
      lazyload: false,
      destroyPrevious: true,
      animation: { out: "slideDown" },
    });
    const root = builder.create({
      menu: [
        { label: "Satu", title: "Satu" },
        { label: "Dua", title: "Dua" },
      ],
      body: [{ content: { title: "A" } }, { content: { title: "B" } }],
    }) as HTMLElement;
    const panels = root.querySelectorAll<HTMLElement>(".body .panel");

    builder.navigateTo(1);

    // Leaving, not yet wiped: the wipe waits for `animationend`.
    expect(panels[0].classList.contains("is-leaving")).toBe(true);
    expect(panels[0].querySelector(".content .title")?.textContent).toBe("A");

    panels[0].dispatchEvent(new Event("animationend"));

    expect(panels[0].children).toHaveLength(0);
    expect(panels[0].dataset.loaded).toBe("false");
    expect(panels[0].classList.contains("hidden")).toBe(true);
  });
});
