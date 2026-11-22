import type { iBuilderConfig, iBuilderRegistry, iElementProperty } from "@aio-ui/core";
import { Builder } from "@aio-ui/base";

// 🧩 The theme builder is instantiated BY THIS builder (no ComponentRegistry
// entry needed), so its module rides along with the console instead of being
// lazily loaded by path — the same deal as the archived Editor.
import { ColorThemeBuilder } from "../ColorTheme/ColorTheme";
import { THEME_TOKENS_EVENT, type iThemeTokensDetail } from "../ColorTheme/ColorTheme.events";
import { applyTheme, loadTheme, saveTheme } from "../theme-config";

export type ThemeConsoleElementType =
  | "@console"
  | "@console>trigger"
  | "@console>color-configurator"
  | "@console>color-report"
  | "@console>mode";

export interface iThemeConsoleConfig extends iBuilderConfig<ThemeConsoleElementType> {
  /**
   * Slot names this builder hands out. A declared key is rendered as a
   * receptacle stamped `data-slot="<name>"`, ready for a child's `attach()` —
   * the whole point of hosting `ColorThemeBuilder` here instead of on a route.
   */
  slots: Partial<Record<ThemeConsoleElementType, string>>;
}

/**
 * The theme generator as host chrome — the `Editor` arrangement, without an iframe.
 *
 *   rail    two triggers + the colouriser's mode switch
 *   panels  the colouriser's own `configurator` and `output`, projected into
 *           slots and slid in from either edge
 *
 * Nothing here re-themes anything: the colouriser broadcasts its derived tokens
 * (`THEME_TOKENS_EVENT`) and this builder applies them to `documentElement`, so
 * every component on the page you are standing on repaints live. That is the
 * difference from the old `#theme` route, where the generator was the page.
 */
export class ThemeConsoleBuilder extends Builder<ThemeConsoleElementType, iThemeConsoleConfig> {
  // The word lives in `iBuilderRegistry` (see packages/core types); the demo typechecks
  // against the package's published `dist` types, which predate that addition.
  readonly builderId = "theme-console" as keyof iBuilderRegistry;
  readonly name = "theme-console" as keyof iBuilderRegistry;
  readonly stylesheet: string = "./ThemeConsole.css";

  /** 🧩 The theme builder this console instantiates and owns (see prepare()). */
  #colorizer?: ColorThemeBuilder;

  /** Abort controller for cleaning up listeners on destroy. */
  #abort = new AbortController();

  constructor(config: Partial<iThemeConsoleConfig>) {
    super();

    const defaultSelectors = {
      "@console": { tagName: "div", className: "theme-console" },
      "@console>trigger": { tagName: "div", className: "field" },

      // Slot receptacles. A `<template>` carries no layout, and `attach()` leaves
      // the receptacle's inline `style` behind, so the projected panel starts
      // pristine apart from the classes welded onto it.
      "@console>color-configurator": { tagName: "template", attrs: { style: "display: none" } },
      "@console>color-report": { tagName: "template", attrs: { style: "display: none" } },
      "@console>mode": { tagName: "template", attrs: { style: "display: none" } },
    };

    const defaultConfig: Required<iThemeConsoleConfig> = {
      themeId: "default",
      namespace: "",
      emit: null,
      selectors: defaultSelectors,
      slots: {
        "@console>color-configurator": "color-configurator",
        "@console>color-report": "color-report",
        "@console>mode": "color-mode",
      },
    };

    this.config = this.resolveConfig(defaultConfig, config);
  }

  public prepare(): HTMLElement {
    // 🔔 THE BRIDGE IS WIRED BEFORE THE CHILD EXISTS. `attach()` initializes each projected
    // panel, and that first paint is the broadcast this console has to catch — wired in
    // `initialize()` instead, the announcement was gone before a listener existed and the
    // page stayed on the app default while the panel showed its own theme.
    this.#listen();

    const root = this.render("@console")!;

    // 🧩 CHILD INSTANTIATED HERE — nothing is registered anywhere: the console owns its
    // theme builder, and that builder projects its own configurator and output panels into
    // the slots declared in this builder's config.slots. It is SEEDED from the ONE theme
    // config, so a route change no longer resets the panel to the construction defaults.
    const saved = loadTheme();
    this.#colorizer = new ColorThemeBuilder({
      themeId: this.config.themeId,
      ...(saved
        ? { preset: saved.preset, primary: saved.primary, accent: saved.accent, mode: saved.mode }
        : {}),
    });
    this.#colorizer
      .attach("@colorizer>mode", "color-mode")
      .attach("@colorizer>configurator", "color-configurator")
      .attach("@colorizer>output", "color-report");

    return root;
  }

  protected template(typeKey: ThemeConsoleElementType, el: HTMLElement, payload?: any, _props?: iElementProperty): void {
    switch (typeKey) {
      case "@console": {
        const configurator = this.render("@console>color-configurator")!;
        const report = this.render("@console>color-report")!;
        const mode = this.render("@console>mode")!;

        // `drawer` is welded onto the projected node, so the sheet can lay out a drawer
        // without knowing which colouriser key landed there. NOT `panel`: that is the fab's
        // own class, and a host rule aimed at the popover would size the drawers too.
        configurator.className = "drawer";
        report.className = "drawer";

        // All three controls are the same switch, so they share ONE row: a control surface
        // with two rows of toggles reads as two unrelated groups, and the mode switch is not
        // a category of its own. Order: the two drawers, then the setting that is always on.
        const rail = document.createElement("div");
        rail.className = "rail";
        rail.append(
          mode,
          this.render("@console>trigger", { target: "color-configurator", id: "theme-mixer", label: "Mixer" })!,
          this.render("@console>trigger", { target: "color-report", id: "theme-report", label: "Report" })!,
        );

        el.append(rail, configurator, report);
        break;
      }

      case "@console>trigger": {
        // The input primitive's toggle, not a bespoke button: `.field` > label +
        // `.switch.control` is the one switch the framework already draws, and the
        // colouriser's own mode control is the same widget — so all three read alike.
        const input = document.createElement("input");
        input.type = "checkbox";
        input.id = payload.id;
        input.name = payload.id;
        input.dataset.target = payload.target;

        const label = document.createElement("label");
        label.htmlFor = payload.id;
        // `data-position` drives the grid area: `"control label"` for right.
        label.dataset.position = "right";
        label.textContent = payload.label;

        const control = document.createElement("div");
        control.className = "switch control";
        const slider = document.createElement("div");
        slider.className = "slider";
        slider.dataset.shape = "round";
        control.append(input, slider);

        el.append(label, control);
        break;
      }
    }
  }

  /**
   * The token bridge: one theme for the whole demo.
   *
   * `attach()` already wired the colouriser's own keys; this only owns the chrome. Every
   * broadcast is applied to `<html>` AND written to the one theme config, so the page
   * behind the popover is the preview, the fab panel paints the same tokens, and the next
   * render starts where this one stopped.
   */
  #listen(): void {
    window.addEventListener(
      THEME_TOKENS_EVENT,
      ((event: CustomEvent<iThemeTokensDetail>) => {
        const { tokens, mode, state } = event.detail;
        applyTheme({ tokens, mode });
        saveTheme({ ...state, tokens });
      }) as EventListener,
      { signal: this.#abort.signal },
    );
  }

  /**
   * Triggers.
   *
   * The two switches are one choice, not two booleans: the popover is 24rem wide, so two
   * open drawers stack into ~900px of content inside a ~660px panel and the visitor gets
   * two scrollbars fighting each other. Opening one closes the other, which is what a rail
   * of drawers means.
   */
  public initialize(root?: HTMLElement): void {
    if (!root) return;

    const opts = { signal: this.#abort.signal };
    const inputs = [...root.querySelectorAll<HTMLInputElement>("input[type='checkbox'][data-target]")];
    const panelFor = (input: HTMLInputElement) =>
      root.querySelector<HTMLElement>(`[data-slot="${input.dataset.target}"]`);

    for (const input of inputs) {
      input.addEventListener(
        "change",
        () => {
          if (input.checked) {
            for (const other of inputs) {
              if (other === input) continue;
              other.checked = false;
              panelFor(other)?.classList.remove("open");
            }
          }
          panelFor(input)?.classList.toggle("open", input.checked);
        },
        opts,
      );
    }
  }

  public destroy(): void {
    // 🧩 I created the theme builder, so I tear it down (it hands this console's
    // slot receptacles back on its way out).
    this.#colorizer?.destroy();
    this.#abort.abort();
  }
}
