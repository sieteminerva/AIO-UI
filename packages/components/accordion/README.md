# Accordion (`@aio-ui/accordion`)

A stack of native `<details>` disclosures, one per payload entry. Because the disclosure is the
browser's own element, open/close, keyboard support and find-in-page keep working without script.

**The builder is an element factory.** It assembles the markup below, and `Accordion.css` only
targets those classes and tokens. The CSS therefore behaves like a plain CSS library: the same
nesting and class names written by hand are styled identically. Customise it by overriding a
selector, or retheme it without touching markup by redeclaring a `--app-*` token on an ancestor
(or one `--accordion-*` token for this component only).

<!-- install:begin -->
## Install

Version — `0.2.6` (tag `v0.2.6`)

    npm install https://github.com/sieteminerva/AIO-UI/raw/releases/v0.2.6/aio-ui-accordion-0.2.6.tgz

CDN (ES module, no build step) — `https://cdn.jsdelivr.net/gh/sieteminerva/AIO-UI@v0.2.6/packages/components/accordion/dist/index.js`
Stylesheet — `https://cdn.jsdelivr.net/gh/sieteminerva/AIO-UI@v0.2.6/packages/components/accordion/dist/Accordion.css`
<!-- install:end -->

## Payload

```ts
[{ title: "…", description: "…" }];
```

A single object is accepted too (it is wrapped into a one-entry list). Each entry becomes one
`@accordion>section`; `title` fills the `summary`, `description` fills the `.content`. A record
missing either field is labelled `Untitled Header` / `Untitled Content`; nullish entries are dropped
so they never render an empty row.

## Config

| Option       | Default      | Meaning                                                                  |
| ------------ | ------------ | ------------------------------------------------------------------------ |
| `appearance` | `"default"`  | `default \| compact` — stamped on the root as `data-appearance`          |
| `autoClose`  | `false`      | Opening one section closes the others (one native `name` per instance)   |
| `expanded`   | `false`      | `true` opens every section, `string[]` opens the listed `id`/`key`/title |
| `animation`  | `true`       | `false \| "slide" \| "fade" \| "slide-fade" \| { in? }` — open motion    |
| `selectors`  | see defaults | Per-key tag/class override                                               |
| `themeId`    | `"default"`  | Passed through to the theme                                              |
| `namespace`  | `null`       | Prefix for generated ids                                                 |

`animation` is stamped on the root as `data-animation`; an object writes `custom` and passes its
`in` keyframe name through `--accordion-anim-in-name`. A native `<details>` closes in one frame, so
no `out` keyframe is wired.

### Appearance

| `appearance` | Look                                                                                                                                                                                                                                                    |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `default`    | A stack of cards: each panel has its own frame, shadow and `+`/`−` marker                                                                                                                                                                               |
| `compact`    | One framed list: the frame sits on the root, hairlines divide the rows, no shadow; the marker is the global `arrow.left` icon (masked, accent-coloured) pointing down while closed and left while open; hover and the open row take a 4–6 % accent tint |

`appearance` is stamped on the root `.accordion` as `data-appearance`, so the sheet can frame the
whole group instead of every panel. Combine it with `autoClose: true` for the settings-panel shape:
one bordered list where only one row is open at a time.

## Nodes

| Key                          | Default tag | Class / note          |
| ---------------------------- | ----------- | --------------------- |
| `@accordion`                 | `div`       | `accordion`           |
| `@accordion>section`         | `details`   | one per payload entry |
| `@accordion>section>title`   | `summary`   | the clickable row     |
| `@accordion>section>content` | `div`       | `content`             |

### Structure

The `<details>` element is the whole disclosure: no script, no extra wrapper.

```html
<div class="accordion">
  <details>
    <summary>Shipping</summary>
    <div class="content">
      <p class="desc">Delivered in two working days.</p>
    </div>
  </details>
</div>
```

## Tokens

Declared once on `:root, [data-theme]` in `Accordion.css`. Each derives from an app token with a
literal fallback, so a theme retunes the app token and this sheet follows; redeclare a
`--accordion-*` token on an ancestor to retheme this component alone.

| Token                       | Derives from                      | Used for                   |
| --------------------------- | --------------------------------- | -------------------------- |
| `--accordion-background`    | `--app-surface-background-color`  | Panel surface              |
| `--accordion-border-color`  | `--app-border-color`              | Resting hairline           |
| `--accordion-border-focus`  | `--app-border-focus`              | Hairline of an open panel  |
| `--accordion-radius`        | `--app-component-border-radius`   | Panel corner radius        |
| `--accordion-shadow`        | `--app-shadow-soft`               | Resting shadow             |
| `--accordion-shadow-open`   | `--app-shadow-elevated`           | Shadow of an open panel    |
| `--accordion-accent-color`  | `--app-primary-color`             | Hover hairline, `+` marker |
| `--accordion-label-color`   | `--app-text-heading-color`        | Summary text               |
| `--accordion-text-color`    | `--app-text-accent-color`         | Panel body text            |
| `--accordion-font-size`     | `--app-font-size-base`            | Summary and body size      |
| `--accordion-anim-duration` | literal (component-private)       | Open/close transition time |
| `--accordion-anim-easing`   | literal (component-private)       | Open/close easing curve    |
| `--accordion-fade-duration` | literal (component-private)       | Opacity transition time    |
| `--accordion-icon-arrow`    | global `arrow.left` SVG (literal) | Compact marker mask        |

## Wiring checklist

1. Add `"accordion"` to `iBuilderRegistry` in `packages/core/src/types/registry.ts`.
2. Add a loader for `@aio-ui/accordion/Accordion` to the host's asset map.
3. Add a `stylesheet` loader for `@aio-ui/accordion/Accordion.css`.
4. List it in the host's route plan: `registerModule(components, [{ route, components: ["accordion"] }])`.
