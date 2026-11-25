// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";

import { MenuBuilder } from "../Menu";

/**
 * Branch activation — a hover menu must still answer a click.
 *
 * On a touch viewport nothing hovers, so hover-only disclosure left the branch dead: the
 * panel never opened. `toggleSubmenu()` is now reached for every activation except
 * `always`; the sheet shows `.open` for `hover` too (Menu.css).
 */

function build(activation: "hover" | "click" | "always") {
  const menu = new MenuBuilder({
    position: "top",
    multilevel: { activation, property: "children", multicolumn: false },
  });
  const root = menu.create({
    content: {
      navigations: [
        // The first entry is the brand, so the branch must be listed after it.
        { label: "Brand", href: "#home" },
        { label: "Guide", children: [{ label: "Docs", href: "#docs" }] },
      ],
    },
  });
  const branch = root.querySelector(".item.submenu") as HTMLElement;
  const link = branch.querySelector(":scope > a") as HTMLElement;
  return { branch, link };
}

describe("menu branch activation", () => {
  it("a hover branch opens on click and closes on the next click", () => {
    const { branch, link } = build("hover");

    expect(branch.classList.contains("open")).toBe(false);
    expect(link.getAttribute("aria-expanded")).toBe("false");

    link.click();
    expect(branch.classList.contains("open")).toBe(true);
    expect(link.getAttribute("aria-expanded")).toBe("true");

    link.click();
    expect(branch.classList.contains("open")).toBe(false);
    expect(link.getAttribute("aria-expanded")).toBe("false");
  });

  it("an always branch ignores a click because it never closes", () => {
    const { branch, link } = build("always");

    expect(branch.classList.contains("open")).toBe(true);
    link.click();
    expect(branch.classList.contains("open")).toBe(true);
  });

  it("a click branch still toggles", () => {
    const { branch, link } = build("click");

    link.click();
    expect(branch.classList.contains("open")).toBe(true);
    link.click();
    expect(branch.classList.contains("open")).toBe(false);
  });
});
