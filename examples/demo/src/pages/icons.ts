import type { iPageContent, iPageController, iPageReadyContext } from "@aio-ui/core";
import { releaseBuilders } from "@aio-ui/core";

import { mountInto, node } from "../dom";
import { ICON_NAMES, iconClasses } from "../icons";
import { readmeFor, sectionOf, subsectionOf } from "../readme";
import { shellPage } from "../shell";

type BuildFn = (name: string, data?: any) => HTMLElement;

/**
 * `#icons` — the same docs shape as the element route: one tab, Display · Usage · API.
 *
 * The prose is not written here; it is `packages/styles/icons/README.md`, split by heading and
 * rendered by the `markdown` builder (see `readme.ts`). Display assembles the live grid —
 * one square tile per glyph — while Usage and API are README sections, so the page cannot
 * drift from the sheet's documentation. The icon channel owns its own README, like every module.
 */
const COPY_ACTION = [{ type: "copy" as const, onClick: () => undefined }];
const README_PKG = "icons";

function renderMarkdown(host: HTMLElement, build: BuildFn, source: string | null | undefined): void {
  if (!source || !source.trim()) return;
  mountInto(host, build("markdown", { source }));
}

/** One README H2 as Markdown, heading included; `null` when absent. */
function sectionMarkdown(heading: string): string | null {
  const doc = readmeFor(README_PKG);
  const section = doc ? sectionOf(doc, heading) : null;
  return section ? `## ${section.heading}\n\n${section.body}`.trim() : null;
}

/** One H3 block under the README's `## Icons` section, heading included. */
function subMarkdown(heading: string): string | null {
  const doc = readmeFor(README_PKG);
  const parent = doc ? sectionOf(doc, "Icons") : null;
  if (!parent) return null;
  const body = subsectionOf(parent, heading);
  return body ? `### ${heading}\n\n${body}` : null;
}

/** Display: every glyph as a square tile with copyable classes (the tab adds the title). */
function gridPanel(build: BuildFn): HTMLElement {
  const panel = node("div", "preview-panel");

  const grid = node("div", "icons-grid");
  for (const name of ICON_NAMES) {
    const tile = node("article", "icon-tile");

    const glyph = node("i", `icon ${iconClasses(name)}`);
    glyph.setAttribute("aria-hidden", "true");
    tile.append(glyph);

    const block = build("code-block", {
      builder: "code-block",
      content: { code: iconClasses(name) },
      config: { appearance: "compact", actions: COPY_ACTION },
    });
    mountInto(tile, block);

    grid.append(tile);
  }
  panel.append(grid);

  return panel;
}

/** Usage: the README's `## Install`, then the `### Usage` and `### Markup` blocks. */
function usagePanel(build: BuildFn): HTMLElement {
  const panel = node("div", "usage-panel");

  renderMarkdown(panel, build, sectionMarkdown("Install"));
  renderMarkdown(panel, build, subMarkdown("Usage"));
  renderMarkdown(panel, build, subMarkdown("Markup"));

  if (!panel.childElementCount) {
    panel.append(node("p", undefined, "README styles tidak ditemukan."));
  }
  return panel;
}

/** API: the facts a host needs, then the README's `### Built with it` and `### Sources`. */
function apiPanel(build: BuildFn): HTMLElement {
  const panel = node("div", "api-panel");

  const rows = node("table", "api-rows");
  for (const [label, value] of [
    ["Package", "@aio-ui/styles (v0.2.7)"],
    ["File", "packages/styles/icons/icons.css"],
    ["Imported by", "packages/styles/src/index.css"],
    ["Glyphs", String(ICON_NAMES.length)],
  ]) {
    const line = node("tr");
    line.append(node("th", undefined, label), node("td", undefined, value));
    rows.append(line);
  }
  panel.append(rows);

  renderMarkdown(panel, build, subMarkdown("Built with it"));
  renderMarkdown(panel, build, subMarkdown("Sources"));

  return panel;
}

/**
 * One tab, three panels — the same call shape `#kitchen` uses: Display is a descriptor
 * (the tab prints its title), Usage and API are ready-made elements passed as `panel`.
 */
function mountMain(host: HTMLElement, build: BuildFn): void {
  mountInto(
    host,
    build("tab", {
      builder: "tab",
      content: {
        menu: [{ label: "Display" }, { label: "Usage" }, { label: "API" }],
        body: [
          {
            id: "panel-display",
            panel: {
              eyebrow: "Styles · icon set",
              title: "Icons",
              description: `${ICON_NAMES.length} glyphs from @aio-ui/styles`,
            },
          },
          { id: "panel-usage", panel: usagePanel(build) },
          { id: "panel-api", panel: apiPanel(build) },
        ],
      },
      config: { menuPosition: "top", appearance: "folder" },
    }),
  );

  // The grid is filled once the tab has mounted the Display panel in the document.
  const display = host.querySelector<HTMLElement>("#panel-display");
  if (display) display.append(gridPanel(build));
}

function iconsContent(): iPageContent {
  return shellPage({
    main: {
      "section.icons": {
        onCreated: (element: HTMLElement, _render: any, build: BuildFn) => mountMain(element, build),
      },
    },
  });
}

export class IconsPage implements iPageController {
  #shell: HTMLElement | null = null;

  async onPrepare(): Promise<iPageContent> {
    return iconsContent();
  }

  onReady({ shell }: iPageReadyContext): void {
    this.#shell = shell;
  }

  onDestroy(): void {
    if (this.#shell) releaseBuilders(this.#shell);
    this.#shell = null;
  }
}
