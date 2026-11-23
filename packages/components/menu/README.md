# Menu (`@aio-ui/menu`)

One navigation bar, built from a flat link list. The list is split by convention — first entry is
the brand, an entry marked `button` (or a `tel:` link) is the call to action, the rest are links —
so a spreadsheet row and a hand-written array produce the same bar.

`position: "top"` renders a `<nav class="nav">`; a `left` / `right` position wraps it in an
`aside.sidebar` and turns the list into a column. The value is stamped on the bar as
`data-position`, which is what the sheet reads.

**The builder is an element factory.** It assembles the markup below, and `Menu.css` only targets
those classes and tokens. The CSS therefore behaves like a plain CSS library: the same nesting and
class names written by hand are styled identically. Customise it by overriding a selector, or
retheme it without touching markup by redeclaring a `--app-*` token on an ancestor (or one
`--menu-*` token for this component only).

<!-- install:begin -->
## Install

Version — `0.2.5` (tag `v0.2.5`)

    npm install https://github.com/sieteminerva/AIO-UI/raw/releases/v0.2.5/aio-ui-menu-0.2.5.tgz

CDN (ES module, no build step) — `https://cdn.jsdelivr.net/gh/sieteminerva/AIO-UI@v0.2.5/packages/components/menu/dist/index.js`
Stylesheet — `https://cdn.jsdelivr.net/gh/sieteminerva/AIO-UI@v0.2.5/packages/components/menu/dist/Menu.css`
<!-- install:end -->

## Payload

```ts
{
  navigations: [
    { label: "Home", href: "#home" },
    { label: "CTA", href: "#x", className: "button" },
  ];
}
```

The payload is `{ navigations }` directly — the registry hands the builder the node's `content`, so
there is no `{ content }` envelope to unwrap. A single object is wrapped into a one-entry list.
`content.actions` is optional and is appended to the actions group.

| Slot        | Rule                                                                             |
| ----------- | -------------------------------------------------------------------------------- |
| brand       | `content.brand`, else `navigations[0]`, else `{ label: "Brand", href: "#home" }` |
| actions     | `className === "button"` or an `href` containing `tel:`, plus `content.actions`  |
| navigations | everything else, in payload order                                                |

The split is `splitMenuContent()` in `Menu.engine.ts` — pure, exported from the package entry so the
rule can be tested without a DOM. Only a **guessed** brand is removed from the list: when
`content.brand` is given, every navigation stays a navigation.

## Config

| Option         | Default                                                 | Meaning                                                                                                                                                           |
| -------------- | ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `position`     | `"top"`                                                 | `top` / `bottom` / `left` / `right`, each optionally `"… sticky"`. `left` and `right` wrap the bar in `aside.sidebar`                                             |
| `multilevel`   | `null`                                                  | Turns on recursive submenus; see below                                                                                                                            |
| `selectors`    | see Nodes                                               | Per-key tag/class override, merged over the defaults                                                                                                              |
| `defaultRoute` | `"home"`                                                | Route used when a link has no usable `href`                                                                                                                       |
| `routes`       | `["home", "package", "gallery", "dashboard", "wizard"]` | Routes considered known when resolving a link                                                                                                                     |
| `themeId`      | `"default"`                                             | Passed through to the theme                                                                                                                                       |
| `onNavigate`   | returns `true` when the link has an `href`              | Return `true` to swallow the click. **The default swallows every link that has an `href`** — pass a handler that returns `false` to let the router own navigation |

## Multi-level

One entry that carries a nested list is a **branch**. The list is the same element at every depth —
`ul.menus` — and the recursion is the builder's: `paintList()` renders `@menu>menus`, and each of
those items runs `paintItem()` again, so depth is bounded only by the data.

```ts
config: {
  multilevel: { activation: "hover", property: "children", multicolumn: false },
}
content: {
  brand: { label: "Docs", href: "#home" },
  navigations: [
    { label: "Guide", children: [{ label: "Install", href: "#install" }] },
  ],
}
```

| Field         | Meaning                                                                                                          |
| ------------- | ---------------------------------------------------------------------------------------------------------------- |
| `property`    | Which key holds the children (`children`, `menus`, `submenu` — the data keeps its own shape). Default `children` |
| `activation`  | `"always"` (open from the first paint), `"click"` (the branch toggles), `"hover"` (pointer or focus reveals)     |
| `multicolumn` | Reserved for the sheet; the builder does not read it                                                             |

Contract the sheet relies on:

- `nav[data-multilevel="<activation>"]` — config, stamped once on the bar, only when `activation` is one of the three strings.
- `li.item.submenu` — the branch; `open` / `closed` is the state the builder flips.
- `li.item.submenu.is-active` — a branch that contains the current route.
- The glyph is an icon, not a bespoke caret: a branch is rendered with `icon: "icon arrow right"`
  (overridable per entry) and the sheet turns it a quarter for the closed state. Swap the string
  when the icon set grows an `arrow down`.
- A branch never navigates: its click belongs to the disclosure, and its `href` is not bound. Make the
  group's own page its first child instead.
- `Escape` closes what a click opened.

### Compact viewport

Below `768px` **every position looks the same** — a `top` bar and a `left` / `right` column both
collapse to a strip:

| State  | What the sheet does                                                                                         |
| ------ | ----------------------------------------------------------------------------------------------------------- |
| closed | brand plus the hamburger; `.navigations` is `display: none` until the builder adds `.open`                  |
| open   | `display: flex`, `flex-direction: row`, `flex-wrap: nowrap`, each top-level branch a fixed `11rem` column   |
| scroll | `overflow-x: auto` + `scroll-snap-type: x proximity`, so a long list costs the height of its tallest column |
| branch | open regardless of `activation` — a column has the room, and `hover` does not exist on a touch screen       |

Above the breakpoint each position keeps the behaviour it asked for: a bar hangs popovers, a column
draws an inset list.

It is a **media query, not a resize observer**: the sheet has nothing to measure — the host decides
how wide the aside is — and every rule is a function of the viewport. If a host needs the collapse
keyed to the _column_ instead, it declares `container-type: inline-size` on the wrapper and copies
these rules into a `@container` block; the sheet cannot do that for it.

## Nodes

| Key                      | Default tag | Class / note                                                   |
| ------------------------ | ----------- | -------------------------------------------------------------- |
| `@container`             | `aside`     | `sidebar` — only used for a `left` / `right` position          |
| `@menu`                  | `nav`       | `nav`, stamped with `data-position` / `data-multilevel`        |
| `@menu>brand`            | `div`       | `brand`, carries the logo `src` attribute                      |
| `@menu>hamburger`        | `button`    | `hamburger-btn`, toggles the `.open` class                     |
| `@menu>navigations`      | `ul`        | `menus navigations`; its id is forced to `primary-navigations` |
| `@menu>navigations>item` | `li`        | `item` — one per navigation link                               |
| `@menu>menus`            | `ul`        | `menus` — a submenu, same class as the root list               |
| `@menu>menus>item`       | `li`        | `item` — one per submenu entry                                 |
| `@menu>item>link`        | `a`         | gets the entry's `className` and `href`                        |
| `@menu>item>icon`        | `i`         | `icon`; the disclosure glyph on a branch                       |
| `@menu>actions`          | `div`       | `actions` — holds the CTA entries                              |

### Structure

Brand, hamburger, navigations and actions are four sibling groups; a link entry is `li.item > a`,
the action group holds `a.item` straight. `data-position` on the bar is what the sheet reads.

```html
<nav class="nav" data-position="top">
  <div class="brand"><a href="#home">Brand</a></div>
  <button class="hamburger-btn" aria-controls="primary-navigations">…</button>
  <ul id="primary-navigations" class="menus navigations">
    <li class="item"><a href="#home">Home</a></li>
  </ul>
  <div class="actions">
    <a href="tel:+620000" class="button item">Contact</a>
  </div>
</nav>
```

## Tokens

Declared once on `:root, [data-theme]` in `Menu.css`. Before that layer the sheet read a private
namespace (`--surface-bg`, `--text-main`, `--border-soft`, …) that no package declares, so it only
rendered because the host bridged those names onto the app tokens. The values below are exactly that
bridge — the pass renamed a host bridge into the package's own tokens and changed nothing visually.

| Token                     | Derives from                     | Used for                |
| ------------------------- | -------------------------------- | ----------------------- |
| `--menu-background`       | `--app-surface-background-color` | Bar surface             |
| `--menu-border-color`     | `--app-border-color`             | Hairline                |
| `--menu-shadow`           | `--app-shadow-soft`              | Bar shadow              |
| `--menu-radius`           | `--app-component-border-radius`  | Bottom corner radius    |
| `--menu-heading-color`    | `--app-text-color`               | Brand / heading text    |
| `--menu-text-color`       | `--app-text-color`               | Link text               |
| `--menu-muted-color`      | `--app-text-accent-color`        | Secondary text          |
| `--menu-hover-background` | `--app-surface-muted`            | Hover / active row wash |

`--menu-heading-color` derives from `--app-text-color`, **not** `--app-text-heading-color`, on
purpose: the host bridge mapped `--text-heading` to the body colour, and this layer preserves that
value. Changing it is a restyle, not a layer change.

## Wiring checklist

1. Add `"menu"` to `iBuilderRegistry` in `packages/core/src/types/registry.ts`.
2. Add a loader for `@aio-ui/menu/Menu` to the host's asset map.
3. Add a `stylesheet` loader for `@aio-ui/menu/Menu.css`.
4. List it in the host's route plan: `registerModule(components, [{ route, components: ["menu"] }])`.
   A menu built inside `onCreated` is invisible to `collect(nodes)`, so a cold load fails without it.
