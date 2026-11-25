/**
 * The one page shell every demo route renders.
 *
 *   header   menu builder, `type: "top"` — the same menu on every route
 *   body     one column, or `.docs` (aside + main) when the caller passes an aside
 *
 * The shell owns no component knowledge: the caller hands over the body as page content.
 * `#kitchen` and `#modules` pass the docs aside; `#getting-started`, `#product`, `#article`
 * and `#form` are single-column.
 */
import type { iPageContent } from "@aio-ui/core";

import { themeSwitcher } from "./theme-switcher";

type BuildFn = (name: string, data?: any) => HTMLElement;

/** The route part of the hash: `#product/17?theme=cyberpunk` → `product`. */
export function currentRoute(): string {
  return location.hash.replace(/^#/, "").split("?")[0].split("/")[0] || "kitchen";
}

/** Brand on its own key, then the bar as a reader sees it: two groups, not six links. */
const TOP_BRAND = { label: "@aio demo", href: "#kitchen", src: "favicon.svg" };

interface iTopLeaf {
  label: string;
  href: string;
  route: string;
}

interface iTopGroup {
  label: string;
  children: iTopLeaf[];
}

/**
 * Branches only. The theme generator is NOT a destination any more: it is host chrome
 * (see `ThemeConsole`), reachable from every page, so it has no place in this bar.
 */
const TOP_NAV: iTopGroup[] = [
  {
    label: "Guide",
    children: [
      { label: "Getting Started", href: "#getting-started", route: "getting-started" },
      { label: "Modules", href: "#modules", route: "modules" },
      { label: "Data Binding", href: "#data-binding", route: "data-binding" },
    ],
  },
  {
    label: "Display",
    children: [
      { label: "Elements", href: "#kitchen", route: "kitchen" },
      { label: "Icons", href: "#icons", route: "icons" },
      { label: "Product", href: "#product", route: "product" },
      { label: "Article", href: "#article", route: "article" },
      { label: "Form", href: "#form", route: "form" },
    ],
  },
];

function mountTopMenu(host: HTMLElement, build: BuildFn): void {
  const route = currentRoute();
  // The route lives under a branch, so the branch carries the mark and lights up for it.
  const navigations = TOP_NAV.map((group) => ({
    label: group.label,
    children: group.children.map(({ label, href, route: id }) => ({
      label,
      href,
      ...(id === route ? { className: "is-active" } : {}),
    })),
  }));

  const child = build("menu", {
    builder: "menu",
    content: { brand: TOP_BRAND, navigations },
    // `menu` swallows clicks by default; here its own navigation is exactly right — it
    // sets the hash and the router follows.
    config: {
      position: "top",
      multilevel: { activation: "hover", property: "children", multicolumn: false },
      onNavigate: () => false,
    },
  });
  host.appendChild(child instanceof HTMLElement ? child : (child as any).element);
}

export interface iShellPage {
  /** Body of the main column. */
  main: Record<string, unknown>;
  /** Optional left column. When present the body uses the `.docs` split. */
  aside?: Record<string, unknown>;
}

export function shellPage({ main, aside }: iShellPage): iPageContent {
  const body: Record<string, unknown> = {
    "header.docs-top": {
      onCreated: (element: HTMLElement, _render: any, build: BuildFn) => mountTopMenu(element, build),
    },
  };

  if (aside) {
    body[".docs"] = {
      content: {
        "aside.docs-aside": aside,
        "main.docs-main": main
      }
    };
  } else {
    body["main.docs-main"] = main;
  }

  return { ".page": { content: { ...body, ...themeSwitcher } } } as unknown as iPageContent;
}

/**
 * Title block for the single-column routes.
 *
 * A `header`, not a `div`. The shared stylesheet centres every `header`, so `style.css`
 * resets the alignment: a page title belongs to the left edge of its column.
 */
export function pageHead(title: string, meta: string): Record<string, unknown> {
  return {
    "header.docs-head": {
      content: {
        h1: { content: title },
        "p.meta": { content: meta },
      },
    },
  };
}
