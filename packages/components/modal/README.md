# Modal (`@aio-ui/modal`)

Modal renders a hidden overlay (`.dialog.hidden`) holding a header and a body, and hands the caller
the handles to open it. `build()` returns the element, so the controls arrive through
`config.onReady` — that is the intended way to open a modal.

Closing is either a full teardown (`destroyOnClose: true`, the default) or a hide, and both a close
button and a backdrop click are wired through stored references, so `destroy()` removes exactly the
listeners it added.

**The builder is an element factory.** It assembles the markup below, and `Modal.css` only targets
those classes and tokens. The CSS therefore behaves like a plain CSS library: the same nesting and
class names written by hand are styled identically. Customise it by overriding a selector, or
retheme it without touching markup by redeclaring a `--app-*` token on an ancestor (or one
`--modal-*` token for this component only).

<!-- install:begin -->
## Install

Version — `0.2.9` (tag `v0.2.9`)

    npm install https://github.com/sieteminerva/AIO-UI/raw/releases/v0.2.9/aio-ui-modal-0.2.9.tgz

CDN (ES module, no build step) — `https://cdn.jsdelivr.net/gh/sieteminerva/AIO-UI@v0.2.9/packages/components/modal/dist/index.js`
Stylesheet — `https://cdn.jsdelivr.net/gh/sieteminerva/AIO-UI@v0.2.9/packages/components/modal/dist/Modal.css`
<!-- install:end -->

## Payload

An `HTMLElement`, an HTML string, or a node-shaped object — whatever `_compileContent` accepts. A
string payload is parsed into an element; the component never sets `el.innerHTML` on user text.

```ts
build("modal", document.createElement("form"));
```

`config.title` is independent of the payload: it becomes the `h2.title` inside the header.

## Config

| Option           | Default           | Meaning                                                           |
| ---------------- | ----------------- | ----------------------------------------------------------------- |
| `id`             | `"modal-default"` | DOM id; a second prepare with the same id removes the old overlay |
| `title`          | `"Notification"`  | Header text                                                       |
| `className`      | `""`              | Extra classes on the outer overlay                                |
| `modalClass`     | `""`              | Extra classes on the inner box                                    |
| `destroyOnClose` | `true`            | Remove on close instead of hiding                                 |
| `onOpen`         | no-op             | Called with the overlay when opened                               |
| `onClose`        | no-op             | Called with the overlay when closed                               |
| `onReady`        | no-op             | Receives `iModalControls` once the overlay exists                 |
| `selectors`      | see defaults      | Per-key tag/class override                                        |

`iModalControls` = `{ element, open, close, unmount }`. After `destroy()`, `open()` and `close()`
refuse to pretend the modal still works.

## Nodes

| Key               | Default tag | Class / note                                               |
| ----------------- | ----------- | ---------------------------------------------------------- |
| `@container`      | `div`       | `dialog hidden` — the overlay                              |
| `@modal`          | `div`       | `modal` — the box                                          |
| `@modal>header`   | `div`       | `header` (contains `h2.title`)                             |
| `@modal>closeBtn` | none        | `close`; the declared tag is empty, so the wrapper decides |

The body is appended by the builder, not by a declared key: the compiled payload element gets the
`body` class.

### Structure

The overlay starts hidden; `config.title` fills `h2.title`, independently of the body payload.

```html
<div id="modal-default" class="dialog hidden">
  <div class="modal">
    <div class="header">
      <h2 class="title">Notification</h2>
      <div class="close">…</div>
    </div>
    <p class="body">Hello from the modal body.</p>
  </div>
</div>
```

## Tokens

Declared once on `:root, [data-theme]` in `Modal.css`. The sheet previously read seven names that no
package declares (`--padding-layout`, `--padding-component`, `--border-soft`, `--radius-component`,
`--page-bg`, `--shadow-soft`, `--text-heading`), so the box rendered with no padding, border, radius,
background or shadow; each now derives from the app layer.

| Token                     | Derives from                    | Used for              |
| ------------------------- | ------------------------------- | --------------------- |
| `--modal-overlay-padding` | `--app-padding-layout`          | Overlay gutter        |
| `--modal-box-padding`     | `--app-padding-component` × 2   | Sheet padding         |
| `--modal-border-color`    | `--app-border-color`            | Sheet hairline        |
| `--modal-border-radius`   | `--app-component-border-radius` | Sheet corner          |
| `--modal-surface`         | `--app-surface-strong`          | Sheet background      |
| `--modal-shadow`          | `--app-shadow-soft`             | Sheet shadow          |
| `--modal-title-color`     | `--app-text-heading-color`      | Title text            |
| `--modal-close-color`     | `--app-status-error`            | Close glyph           |
| `--modal-scrollbar-thumb` | `--app-border-color`            | Sheet scrollbar thumb |

## Wiring checklist

1. Add `"modal"` to `iBuilderRegistry` in `packages/core/src/types/registry.ts`.
2. Add a loader for `@aio-ui/modal` to the host's asset map.
3. Add a `stylesheet` loader for `@aio-ui/modal/Modal.css`.
4. Open it from `onReady`: `const el = build("modal", content); controls.open()`. A modal renders
   nothing visible until opened, so a display page needs its own trigger.
