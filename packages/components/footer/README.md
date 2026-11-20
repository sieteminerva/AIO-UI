# Footer (`@aio-ui/footer`)

A two-row page footer: an auto-fitted grid of link columns, then a copyright line separated by a
hairline. The column count is not configured — `auto-fit` fits as many ~14rem columns as the width
allows and wraps the rest.

**The builder is an element factory.** It assembles the markup below, and `Footer.css` only
targets those classes and tokens. The CSS therefore behaves like a plain CSS library: the same
nesting and class names written by hand are styled identically. Customise it by overriding a
selector, or retheme it without touching markup by redeclaring a `--app-*` token on an ancestor
(or one `--footer-*` token for this component only).

## Payload

```ts
{
  columns: [
    {
      title: "Product",
      description: "Built for teams",
      actions: [{ label: "Docs", href: "#docs" }],
    },
  ],
  copyright: "© 2026 AIO",
}
```

A footer without `columns[]` falls back to the flat shape (`title`, `description`, `actions`), so a
single-column payload needs no array of one. `copyright` accepts `{year}` and `{company}`
placeholders; `company` is the flat fallback for the company name.

## Config

| Option         | Default      | Meaning                     |
| -------------- | ------------ | --------------------------- |
| `useInfo`      | `true`       | Render the column rows      |
| `useCopyright` | `true`       | Render the bottom row       |
| `selectors`    | see defaults | Per-key tag/class override  |
| `themeId`      | `"default"`  | Passed through to the theme |

## Nodes

| Key                            | Default tag | Class / note    |
| ------------------------------ | ----------- | --------------- |
| `@footer`                      | `footer`    | `footer`        |
| `@footer>row`                  | `div`       | `row`           |
| `@footer>row>column`           | `div`       | `column`        |
| `@footer>row>column>header`    | `h2`        | `header`        |
| `@footer>row>column>desc`      | `p`         | `desc`          |
| `@footer>row>column>list`      | `ul`        | `unstyled-list` |
| `@footer>row>column>list>item` | `li`        | `item`          |
| `@footer>copyright`            | `div`       | `row bottom`    |

### Structure

Optional parts are not appended, so a column may hold only a title, only actions, or both.

```html
<footer class="footer">
  <div class="row">
    <div class="column">
      <h2 class="header">Product</h2>
      <p class="desc">Built for teams</p>
      <ul class="unstyled-list">
        <li class="item"><a href="#docs">Docs</a></li>
      </ul>
    </div>
  </div>
  <div class="row bottom">
    <p>© 2026 AIO</p>
  </div>
</footer>
```

## Tokens

Declared once on `:root, [data-theme]` in `Footer.css`, each deriving from an app token with a
literal fallback. Redeclare a `--footer-*` token on an ancestor to retheme this component alone.

| Token                    | Derives from                     | Used for                       |
| ------------------------ | -------------------------------- | ------------------------------ |
| `--footer-gap`           | `--app-gap`                      | Row and column gaps            |
| `--footer-margin-top`    | `--app-margin-layout`            | Space above the footer         |
| `--footer-background`    | `--app-surface-background-color` | Footer surface                 |
| `--footer-text-color`    | `--app-text-color`               | Base text colour               |
| `--footer-border-color`  | `--app-border-color`             | Frame and copyright hairline   |
| `--footer-radius`        | `--app-component-border-radius`  | Frame corner radius            |
| `--footer-heading-color` | `--app-text-heading-color`       | Column headers                 |
| `--footer-muted-color`   | `--app-text-accent-color`        | Descriptions, links, copyright |
| `--footer-accent-color`  | `--app-primary-color`            | Link hover / focus             |

## Wiring checklist

1. Add `"footer"` to `iBuilderRegistry` in `packages/core/src/types/registry.ts`.
2. Add a loader for `@aio-ui/footer/Footer` to the host's asset map.
3. Add a `stylesheet` loader for `@aio-ui/footer/Footer.css`.
4. List it in the host's route plan: `registerModule(components, [{ route, components: ["footer"] }])`.
