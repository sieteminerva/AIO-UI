# DOMRenderer (`@aio-ui/dom-renderer`)

The renderer **alone**. No `@aio-ui/*` import, one generated file — for projects that want the
tree-to-DOM engine without adopting the framework. It is the migration door for existing apps.

<!-- install:begin -->
## Install

Version — `0.2.6` (tag `v0.2.6`)

    npm install https://github.com/sieteminerva/AIO-UI/raw/releases/v0.2.6/aio-ui-dom-renderer-0.2.6.tgz

CDN (ES module, no build step) — `https://cdn.jsdelivr.net/gh/sieteminerva/AIO-UI@v0.2.6/packages/modules/dom-renderer/dist/index.js`
<!-- install:end -->

## Payload

A plain nested object. The key is a selector token — `tag.class`, `tag#id`, or `@templateKey` —
and the value is the node:

```ts
{
  "main.page": {
    "div.hero": { content: "hello" },
    "div.grid": {
      "div.row": { "div.column": { content: "alpha" }, "div.column": { content: "beta" } },
    },
  },
}
```

Each node accepts `content` (string, element, or nested tree), `attrs` (dictionary),
`attributes` (list), `builder` (delegated to the `builderFn` you pass), `isRoot` and the
lifecycle hooks `onCreated` / `onDestroy`.

## Config

`new DOMRenderer(config?)` merges over the defaults:

| Option      | Default                                               | Meaning                            |
| ----------- | ----------------------------------------------------- | ---------------------------------- |
| `selectors` | `container`, `grid`, `row`, `column`                  | The layout tokens a preset may use |
| `separator` | `{ id: "#", class: ".", ignored: "$", include: "-" }` | How a key is parsed                |

`render(content, builderFn, buildFn, options?)` returns the root element.
`unmount(el)` releases the recorded handlers.

## Nodes

This package is one file: `src/DOMRenderer.ts`, generated from `@aio-ui/core`'s renderer. Two seams
are inlined so it imports nothing:

| Seam               | In `@aio-ui/core`                  | Here                                       |
| ------------------ | ---------------------------------- | ------------------------------------------ |
| attribute helpers  | `@aio-ui/utilities` | inlined                                    |
| metadata identity  | `@aio-ui/utilities`       | inlined                                    |
| template overrides | `TemplateRegistry` (core)          | a local `Map` with `register`/`unregister` |
| dev warnings       | `import.meta.env?.DEV`             | `KIT_DEV = false`                          |

`inspectPage(root)` reads the built tree back as `{ html, records, nodeCount }` without touching
the DOM.

## Tokens

The renderer reads no design token. `--app-*` variables belong to `@aio-ui/styles`; a consumer
that wants the framework's look links `aio-ui.css` (or `@aio-ui/styles/index.css`) beside it.

## Methods

| Method        | Returns           | Notes                                                 |
| ------------- | ----------------- | ----------------------------------------------------- |
| `render`      | `HTMLElement`     | Builds the tree, records every node, returns the root |
| `inspectPage` | `iPageInspection` | Pure read of the root's stamped metadata              |
| `unmount`     | `void`            | Calls the cleanup handlers the tree registered        |

`src/DOMRenderer.ts` is generated — `node scripts/build-renderer-kit.mjs --check` guards it, and
`__tests__/kit.test.ts` asserts the kit and `@aio-ui/core` build identical markup and identical
record keys. Edit behaviour in `packages/core/src/DOMRenderer/`, never here.

## Wiring checklist

1. `npm install @aio-ui/dom-renderer` (no peer, no dependency).
2. `const renderer = new DOMRenderer(); const root = renderer.render(page);`
3. `document.body.append(root);`
4. Link a stylesheet if the page expects component classes.
5. Keep `node scripts/build-renderer-kit.mjs --check` in the gate when the renderer changes.
