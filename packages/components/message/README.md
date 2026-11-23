# Message (`@aio-ui/message`)

Message is the toast: one notification box prepended to a container, removed by a timer or by its
close button.

It follows a destroy-and-recreate rule — preparing a message with an id that already exists removes
the old element first — so one id can never stack two toasts. The close button only appears when the
toast persists (`duration: 0` or `persist: true`).

**The builder is an element factory.** It assembles the markup below, and `Message.css` only
targets those classes and tokens. The CSS therefore behaves like a plain CSS library: the same
nesting and class names written by hand are styled identically. Customise it by overriding a
selector, or retheme it without touching markup by redeclaring a `--app-*` token on an ancestor
(or one `--message-*` token for this component only).

<!-- install:begin -->
## Install

Version — `0.2.5` (tag `v0.2.5`)

    npm install https://github.com/sieteminerva/AIO-UI/raw/releases/v0.2.5/aio-ui-message-0.2.5.tgz

CDN (ES module, no build step) — `https://cdn.jsdelivr.net/gh/sieteminerva/AIO-UI@v0.2.5/packages/components/message/dist/index.js`
Stylesheet — `https://cdn.jsdelivr.net/gh/sieteminerva/AIO-UI@v0.2.5/packages/components/message/dist/Message.css`
<!-- install:end -->

## Payload

```ts
{
  header: "Berhasil",
  message: "Pesanan dikirim.",
  type: "success",     // success | error | info | warning
  icon: "check circle icon",
}
```

Everything is optional except `message`; `header` defaults to `Congrats!`, `type` to `info`, and
`icon` to `bell icon`. `type` selects the colour set in `Message.css`.

## Config

| Option      | Default                   | Meaning                                           |
| ----------- | ------------------------- | ------------------------------------------------- |
| `id`        | `"global-status-message"` | DOM id used to find and replace an existing toast |
| `element`   | `document.body`           | Container (element or id string) to prepend into  |
| `duration`  | `3000`                    | Auto-close in ms; `0` keeps it until dismissed    |
| `persist`   | `false`                   | Keep it open and render the close button          |
| `onOpen`    | no-op                     | Called with the toast element once mounted        |
| `onClose`   | no-op                     | Called with the toast element when it is removed  |
| `selectors` | see defaults              | Per-key tag/class override                        |

## Nodes

| Key                       | Default tag | Class / note                                   |
| ------------------------- | ----------- | ---------------------------------------------- |
| `@message`                | `div`       | `toast`                                        |
| `@message>close`          | `i`         | `close circle icon`, wrapped in `button.close` |
| `@message>content`        | `div`       | `content`                                      |
| `@message>content>header` | `h2`        | `header`                                       |
| `@message>content>desc`   | `p`         | `message`                                      |
| `@message>content>icon`   | `i`         | icon class only, no wrapper                    |

### Structure

The toast is prepended to its container; `type` is a class so the sheet owns the colour set.

```html
<div id="global-status-message" class="toast visible success icon">
  <i class="bell icon"></i>
  <div class="content">
    <h2 class="header">Saved</h2>
    <p class="message">Your changes are stored.</p>
  </div>
</div>
```

## Tokens

The sheet declares its own `--toast-*` palette on `:root` — 16 tokens, including
`--toast-<type>-bg/-text/-border` for the four types, plus border radius, font stack and two shadows.
The values are literal (the Semantic-UI palette), and the sheet reads no `--app-*` token, so it does
**not** follow the theme. The prefix is `--toast-*`, not `--message-*`.

## Wiring checklist

1. Add `"message"` to `iBuilderRegistry` in `packages/core/src/types/registry.ts`.
2. Add a loader for `@aio-ui/message` to the host's asset map.
3. Add a `stylesheet` loader for `@aio-ui/message/Message.css`.
4. List it in the host's route plan, or build it from a controller: `build("message", payload)`.
