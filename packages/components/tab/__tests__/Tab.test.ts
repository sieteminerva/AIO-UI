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
  return new TabBuilder({ lazyload: false, ...config }).create({ content }) as HTMLElement;
}

const content = {
  menu: [{ label: "Satu", title: "Satu" }],
  body: [{ panel: { title: "Isi", description: "Desc" } }],
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
    // One text node, and the record's `title` is the tooltip — not a second, empty span
    // with its own styling (the old `btn-title` was never given text).
    expect(items[0].querySelectorAll("span")).toHaveLength(1);
    expect(items[0].getAttribute("title")).toBe("Satu");
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
      body: [{ panel: { title: "A" } }, { panel: { title: "B" } }],
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
        body: [{ panel: { title: "A" } }, { panel: { title: "B" } }],
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
      content: {
        menu: [
          { label: "Satu", title: "Satu" },
          { label: "Dua", title: "Dua" },
        ],
        body: [{ panel: { title: "A" } }, { panel: { title: "B" } }],
      },
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

  it("keeps a nested tab's menu and panels out of its parent's list", () => {
    const inner = build({
      menu: [{ label: "C1" }, { label: "C2" }],
      body: [{ panel: { title: "c1" } }, { panel: { title: "c2" } }],
    });
    const outer = build({
      menu: [{ label: "P1" }, { label: "P2" }],
      body: [{ panel: { title: "p1" } }, { panel: { title: "p2" } }],
    });

    // The way an application nests: a built child element inside a parent panel.
    (outer.querySelector(".body") as HTMLElement).children[0].append(inner);
    document.body.append(outer);

    // Direct children only: a descendant query would mix the child's panels into the list,
    // which is the bug under test.
    const own = Array.from((outer.querySelector(".body") as HTMLElement).children) as HTMLElement[];
    const ownMenu = Array.from((outer.querySelector(".menu") as HTMLElement).children) as HTMLElement[];
    const childPanels = Array.from((inner.querySelector(".body") as HTMLElement).children) as HTMLElement[];
    const childMenu = Array.from((inner.querySelector(".menu") as HTMLElement).children) as HTMLElement[];

    // Parent tab 2 must open the parent's own second panel, not the child's first.
    ownMenu[1].click();

    expect(own[1].style.display).toBe("block");
    expect(own[1].querySelector(".content .title")?.textContent).toBe("p2");
    expect(childPanels[0].style.display).toBe("block");
    expect(childPanels[1].style.display).toBe("none");

    // And clicking a child tab moves only the child.
    childMenu[1].click();

    expect(childPanels[0].style.display).toBe("none");
    expect(childPanels[1].style.display).toBe("block");
    expect(own[1].style.display).toBe("block");
    expect(ownMenu.map((b) => b.getAttribute("aria-selected"))).toEqual(["false", "true"]);
  });

  it("gives each instance its own id stem, so nested ids never collide", () => {
    const first = build(content);
    const second = build(content);

    const id = (root: HTMLElement) => root.querySelector<HTMLElement>(".body > .panel")?.id;

    expect(id(first)).toMatch(/^tabpanel-tab-/);
    expect(id(first)).not.toBe(id(second));
  });

  it("pairs every button with its panel through the same ids", () => {
    const root = build(content);
    const button = root.querySelector<HTMLElement>(".menu > button")!;
    const panel = root.querySelector<HTMLElement>(".body > .panel")!;

    // The pair is the contract: each attribute names an element that exists. The old ids
    // were generated on both sides independently, so an id of the record's own broke it.
    expect(panel.getAttribute("aria-labelledby")).toBe(button.id);
    expect(button.getAttribute("aria-controls")).toBe(panel.id);
    expect(root.querySelector(`#${button.id}`)).toBe(button);
    expect(root.querySelector(`#${panel.id}`)).toBe(panel);
  });

  it("keeps the pairing when a record brings its own id", () => {
    const root = build({
      menu: [{ label: "Satu", title: "Satu", id: "btn-satu" }],
      body: [{ id: "panel-satu", panel: { title: "Isi" } }],
    });
    const button = root.querySelector<HTMLElement>(".menu > button")!;
    const panel = root.querySelector<HTMLElement>(".body > .panel")!;

    expect(button.id).toBe("btn-satu");
    expect(panel.id).toBe("panel-satu");
    expect(panel.getAttribute("aria-labelledby")).toBe("btn-satu");
    expect(button.getAttribute("aria-controls")).toBe("panel-satu");
  });

  it("falls back to the first tab when `active` matches nothing", () => {
    const root = build(content, { active: "tidak-ada" });
    const button = root.querySelector<HTMLElement>(".menu > button")!;

    // No active panel painted an empty box with no selected button.
    expect(button.getAttribute("aria-selected")).toBe("true");
    expect(root.querySelector<HTMLElement>(".body > .panel")!.style.display).toBe("block");
  });

  it("feeds the callbacks registered on the instance", () => {
    const builder = new TabBuilder({ lazyload: true });
    const seen: number[] = [];
    builder.onTabChanged((detail) => seen.push(detail.index));

    const root = builder.create({
      content: {
        menu: [
          { label: "Satu", title: "Satu" },
          { label: "Dua", title: "Dua" },
        ],
        body: [{ panel: { title: "A" } }, { panel: { title: "B" } }],
      },
    }) as HTMLElement;

    root.querySelectorAll<HTMLElement>(".menu > button")[1].click();

    expect(seen).toEqual([0, 1]);
  });
});
