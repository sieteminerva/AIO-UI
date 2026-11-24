import { describe, expect, it } from "vitest";

import { CyberpunkTheme } from "../src/CyberpunkTheme";

/** A shell stand-in: this theme flips `dataset.theme` and pins the mode. */
function createShell() {
  const style: Record<string, string> = {};
  (style as any).removeProperty = (prop: string) => {
    delete style[prop];
    // CSSStyleDeclaration maps `color-scheme` to the camelCase `colorScheme`.
    const camel = prop.replace(/-([a-z])/g, (_m, c: string) => c.toUpperCase());
    delete style[camel];
  };
  return { dataset: {} as DOMStringMap, style };
}

describe("CyberpunkTheme", () => {
  it("identifies itself", () => {
    const theme = new CyberpunkTheme();
    expect(theme.themeId).toBe("cyberpunk");
    expect(theme.name).toBe("Cyberpunk");
  });

  it("marks the shell so the stylesheet can scope its token overrides", () => {
    const shell = createShell();
    new CyberpunkTheme().activate(shell as unknown as HTMLElement, []);

    expect(shell.dataset.theme).toBe("cyberpunk");
  });

  it("pins the dark mode so light-dark() and dark blocks resolve", () => {
    const shell = createShell();
    new CyberpunkTheme().activate(shell as unknown as HTMLElement, []);

    expect(shell.dataset.mode).toBe("dark");
    expect(shell.style.colorScheme).toBe("dark");
  });

  it("leaves the shell as it found it", () => {
    const theme = new CyberpunkTheme();
    const shell = createShell();

    theme.activate(shell as unknown as HTMLElement, []);
    theme.deactivate(shell as unknown as HTMLElement);

    expect(shell.dataset.theme).toBeUndefined();
    expect(shell.dataset.mode).toBeUndefined();
    expect(shell.style.colorScheme).toBeUndefined();
  });

  it("does not strip a marker another theme owns", () => {
    const shell = createShell();
    shell.dataset.theme = "horizontal";
    new CyberpunkTheme().deactivate(shell as unknown as HTMLElement);

    expect(shell.dataset.theme).toBe("horizontal");
  });

  it("passes the page tree through untouched", () => {
    const pages = [{ ".page": {} }];
    expect(new CyberpunkTheme().beforePageRender(pages, null, null).pages).toBe(pages);
  });
});
