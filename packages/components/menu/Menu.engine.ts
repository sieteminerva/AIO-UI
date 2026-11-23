/**
 * Menu — engine.
 *
 * `splitMenuContent` — brand / navigations / actions split.
 *
 * Not published: `index.ts` is the only entry and does not mention this file.
 */
import type { iElementProperty } from "@aio-ui/core";
import type { iMenuSplit } from "./Menu";


/**
 * Split one flat navigation list into three sections.
 *
 * The source data is linear (a header row plus links plus a CTA), so the split is a
 * convention rather than a structure:
 *
 * - the **first** entry is the brand,
 * - an entry whose `className` is `button`, or whose `href` is a `tel:` link, is an action,
 * - everything else is a navigation link.
 *
 * Exported and pure so the rule is testable without a DOM.
 */
export function splitMenuContent(content: any): iMenuSplit {

  const navigations: iElementProperty[] = Array.isArray(content?.navigations)
    ? content.navigations
    : content?.navigations
      ? [content.navigations]
      : [];

  const brand: iElementProperty = content?.brand ? content.brand : navigations[0] ?? { label: "Brand", href: "#home" };

  // Only the *guessed* brand is taken out of the list. When the host names the brand
  // explicitly, every navigation is a navigation: slicing the first one anyway silently
  // ate the first entry (the demo lost its first tier heading that way).
  const rest = content?.brand ? navigations : navigations.slice(1);

  const isAction = (link: iElementProperty): boolean =>
    link?.className === "button" || Boolean(link?.href?.includes("tel:"));

  const actions = Array.isArray(content?.actions)
    ? [...content.actions]
    : content?.actions
      ? [content.actions]
      : [];

  const cta = rest.find(isAction);
  // The CTA may already be listed under `actions`; adding it twice was the old behaviour.
  if (cta && !actions.includes(cta)) actions.push(cta);

  return { brand, navigations: rest.filter((link) => !isAction(link)), actions };
}
