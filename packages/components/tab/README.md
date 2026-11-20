# Tab (`@aio-ui/tab`)

A tab strip plus panels, with the strip placeable on any side of the body and panels built lazily.
Each payload entry becomes one button and one panel; the panel body reads `eyebrow`, `title` and
`description` from that same entry.

**The builder is an element factory.** It assembles the markup below, and `Tab.css` only targets
those classes and tokens. The CSS therefore behaves like a plain CSS library: the same nesting and
class names written by hand are styled identically. Customise it by overriding a selector, or
retheme it without touching markup by redeclaring a `--app-*` token on an ancestor (or one
`--tab-*` token for this component only).

## Payload

```ts
{
  menu: [{ label: "Overview", title: "Overview" }],
  body: [{ panel: { eyebrow: "…", title: "…", description: "…" } }],
  footer: { text: "…" },
}
```

`menu` and `body` are parallel lists: entry _n_ of the body pairs with button _n_ of the menu.
`body` is the only required key (a missing one falls back to `[]`). A `menu` entry may be an
`iBasicNode`, a body item may be an `HTMLElement`, and `footer` may be an element or
`{ id?, className?, text }`.

## Config

| Option            | Default     | Meaning                                                                    |
| ----------------- | ----------- | -------------------------------------------------------------------------- |
| `menuPosition`    | `"top"`     | `top \| bottom \| left \| right` — which side the strip sits on            |
| `appearance`      | `"default"` | `default \| folder \| underline \| segmented` — look of the strip          |
| `active`          | `0`         | Tab active on first paint: index, button id, or label/title                |
| `animation`       | `true`      | `true \| false \| { in?, out? }` — panel motion; names are `@keyframes`    |
| `lazyload`        | `true`      | Build a panel only when it is first activated                              |
| `destroyPrevious` | `false`     | Empty the previous panel on switch, after its `out` animation has finished |
| `container`       | `null`      | External element to host the tab instead of a built root                   |
| `name`            | generated   | Namespace for the generated button/panel ids                               |
| `minHeight`       | `"400px"`   | Minimum body height, in any CSS length                                     |
| `selectors`       | defaults    | Per-key tag/class override                                                 |

### Appearance

`appearance` is stamped on the root as `data-appearance` (omitted for `default`) and every value
follows `menuPosition`, so the strip reads the same on all four sides:

| Value       | Look                                                                          |
| ----------- | ----------------------------------------------------------------------------- |
| `default`   | Gradient pill on the active tab                                               |
| `folder`    | File-folder tabs on the panel's rule; equal widths, active cut into the panel |
| `underline` | Labels only, with a rule that grows under (or beside) the active label        |
| `segmented` | One inset rail with a lifted active segment                                   |

`animation` is stamped as `data-animation` too: `false` writes `none`, an object writes `custom` and
sets `--tab-anim-in` / `--tab-anim-out` to the keyframe names it carries.

## Nodes

| Key                          | Default tag | Class / note         |
| ---------------------------- | ----------- | -------------------- |
| `@container`                 | `div`       | `tab-widget-wrapper` |
| `@tab`                       | `div`       | `tab`                |
| `@tab>menu`                  | `div`       | `menu`               |
| `@tab>menu>item`             | `button`    | `button`             |
| `@tab>menu>item>label`       | `span`      | `btn-label`          |
| `@tab>menu>item>title`       | `span`      | `btn-title`          |
| `@tab>body`                  | `div`       | `body`               |
| `@tab>panel`                 | `div`       | `panel hidden`       |
| `@tab>panel>content`         | `div`       | `content`            |
| `@tab>panel>content>eyebrow` | `span`      | `eyebrow`            |
| `@tab>panel>content>title`   | `h3`        | `title`              |
| `@tab>panel>content>desc`    | `p`         | `desc`               |
| `@tab>footer`                | `div`       | `footer`             |
| `@tab>spinner`               | `div`       | `spinner hidden`     |

### Structure

A button per menu entry, a panel per body entry. `spinner` is present while the sheet lands;
panels are `hidden` until activated, and a lazily built panel only exists after its first open.

```html
<div class="tab">
  <div class="spinner"></div>
  <div class="menu" role="tablist">
    <button class="button active" role="tab">
      <span class="btn-label">Overview</span>
      <span class="btn-title"></span>
    </button>
  </div>
  <div class="body">
    <div class="panel" role="tabpanel">
      <div class="content">
        <h3 class="title">Overview</h3>
        <p class="desc">…</p>
      </div>
    </div>
  </div>
</div>
```

## Tokens

Declared once on `:root, [data-theme]` in `Tab.css`, each deriving from an app token with a literal
fallback, so a theme retunes the app token and the sheet follows. Redeclare any token below on an
ancestor to retheme the tab alone.

| Token                     | Derives from                     | Used for                                                   |
| ------------------------- | -------------------------------- | ---------------------------------------------------------- |
| `--tab-accent-strong`     | `--app-accent-strong`            | Strip hairline, resting button text, gradient end, eyebrow |
| `--tab-accent-color`      | `--app-accent-color`             | Active gradient start                                      |
| `--tab-label-color`       | `--app-text-accent-color`        | `.btn-label`, footer text                                  |
| `--tab-text-color`        | `--app-text-color`               | Panel description                                          |
| `--tab-title-color`       | `--app-text-heading-color`       | Panel title                                                |
| `--tab-active-foreground` | `--app-text-on-accent`           | Text on the active button                                  |
| `--tab-spinner`           | `--app-spinner-content`          | Loading spinner artwork                                    |
| `--tab-hover-wash`        | literal (component-private)      | Button hover wash                                          |
| `--tab-active-shadow`     | literal (component-private)      | Active button shadow                                       |
| `--tab-divider-color`     | literal (component-private)      | Footer hairline                                            |
| `--tab-border-color`      | `--app-border-color`             | Folder/underline/segmented rule and inactive borders       |
| `--tab-folder-surface`    | `--app-surface-background-color` | Active folder tab surface, segmented segment               |
| `--tab-folder-hover`      | `--app-surface-muted`            | Resting wash of an inactive folder tab, segmented rail     |
| `--tab-border-width`      | `2px`                            | Thickness of the rules the active tab cuts through         |

`--tab-active-foreground` is the WCAG-picked foreground for a brand fill; do not point it at a
background token, or the active label loses its contrast.

## Wiring checklist

1. Add `"tab"` to `iBuilderRegistry` in `packages/core/src/types/registry.ts`.
2. Add a loader for `@aio-ui/tab/Tab` to the host's asset map.
3. Add a `stylesheet` loader for `@aio-ui/tab/Tab.css`.
4. List it in the host's route plan: `registerModule(components, [{ route, components: ["tab"] }])`.
