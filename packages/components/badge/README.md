# Badge (`@aio-ui/badge`)

A stacked list of label/description pairs rendered as self-contained cards. It is the smallest
card surface in the library: no interaction, no state, only a container that turns its payload
into rows.

**The builder is an element factory.** It assembles the markup below, and `Badge.css` only
targets those classes and tokens. The CSS therefore behaves like a plain CSS library: the same
nesting and class names written by hand are styled identically. Customise it by overriding a
selector, or retheme it without touching markup by redeclaring a `--app-*` token on an ancestor
(or one `--badge-*` token for this component only).

## Payload

The payload **is** the item list — `content` appears only in the node wrapper, never here.

```ts
[{ label: "…", description: "…" }];
```

Accepted shapes: `[...]`, `{ items: [...] }`, a single record, or nothing. `normalizePayload()`
is the only place that decides this.

## Config

| Option      | Default                 | Meaning                             |
| ----------- | ----------------------- | ----------------------------------- |
| `emphasis`  | `false`                 | Adds `is-emphasis` to the container |
| `selectors` | see `DEFAULT_SELECTORS` | Per-key tag/class override          |

## Nodes

| Key                 | Default tag | Class          |
| ------------------- | ----------- | -------------- |
| `@container`        | `div`       | `badge-widget` |
| `@badge`            | `div`       | `badge`        |
| `@badge>item`       | `div`       | `badge-item`   |
| `@badge>item>label` | `span`      | `badge-label`  |
| `@badge>item>desc`  | `p`         | `badge-desc`   |

### Structure

One `@badge>item` per record; `label` and `description` are optional and an absent one is not
appended at all.

```html
<div class="badge-widget">
  <div class="badge">
    <div class="badge-item">
      <span class="badge-label">New</span>
      <p class="badge-desc">This week</p>
    </div>
  </div>
</div>
```

## Tokens

All declared once on `:root, [data-theme]` in `Badge.css`, derived from an app token with a
literal fallback. Redeclare any of them on an ancestor to retheme this component only.

| Token                  | Derives from                     | Used for                   |
| ---------------------- | -------------------------------- | -------------------------- |
| `--badge-gap`          | `--app-margin-component`         | Gap between rows           |
| `--badge-padding`      | `--app-padding-component`        | Row padding                |
| `--badge-radius`       | `--app-component-border-radius`  | Row corner radius          |
| `--badge-background`   | `--app-surface-background-color` | Row surface                |
| `--badge-border-color` | `--app-border-color`             | Row hairline               |
| `--badge-label-color`  | `--app-text-heading-color`       | Label text                 |
| `--badge-text-color`   | `--app-text-accent-color`        | Description text           |
| `--badge-accent-color` | `--app-primary-color`            | Row border when `emphasis` |
| `--badge-shadow`       | `--app-shadow-soft`              | Row shadow when `emphasis` |

## Wiring checklist

1. Add `"badge"` to `iBuilderRegistry` in `packages/core/src/types/registry.ts`.
2. Add a loader for `@aio-ui/badge/Badge` to the host's asset map.
3. Add a `stylesheet` loader for `@aio-ui/badge/Badge.css` if you ship CSS.
4. List it in the host's route plan: `registerModule(components, [{ route, components: ["badge"] }])`.
