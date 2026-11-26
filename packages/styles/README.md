# Styles (`@aio-ui/styles`)

The shared stylesheet layer: the `--app-*` token system, typography, the surfaces components
share, layout primitives and iconography. CSS only — there is no build script and no JavaScript,
so a host links it (or lets `ensureStylesheet` request it) and every component that reads the
tokens restyles itself.

<!-- install:begin -->

## Install

Version — `0.2.6` (tag `v0.2.6`)

    npm install https://github.com/sieteminerva/AIO-UI/raw/releases/v0.2.6/aio-ui-styles-0.2.6.tgz

CDN (no build step) — `https://cdn.jsdelivr.net/gh/sieteminerva/AIO-UI@v0.2.6/packages/styles/src/index.css`

<!-- install:end -->

## Sheets

`index.css` imports the five sheets in presentation order — tokens first, then type, then shared
component surfaces, then layout, then iconography:

| Sheet            | Contents                                                               |
| ---------------- | ---------------------------------------------------------------------- |
| `variables.css`  | `:root` `--app-*` tokens: colour, spacing, radius, type scale, motion  |
| `typography.css` | Base type, headings, measure                                           |
| `components.css` | Surfaces more than one component draws on (focus ring, scrollbar)      |
| `layout.css`     | Section, container and spacing composition                             |
| `icon.css`       | Icon base: sizing, mask setup, the animated spinner                    |
| `icons.css`      | The icon channel: one `mask-image` per glyph, pointing at `icons/imgs` |

## Token rule

Component tokens are `--<component>-*` and must derive from an `--app-*` token:

```css
--input-text-color: var(--app-text-color);
```

Never extend a component sheet to change a colour — change the `--app-*` value it inherits. That
is what makes a theme a data change instead of a fork.

## Icons

A global icon system: every glyph is a CSS mask, so an icon takes the colour of the text around it
and needs no font file, no sprite and no build step. One stylesheet link brings the whole set — the
sheet is `icons/icons.css`, imported by `index.css`.

**The sheet links, it does not inline.** Each glyph is a real `.svg` under `icons/imgs/`, named by a
relative `url()`; the sheet itself stays ~14 kB and a browser fetches only the icons a page draws.
The previous sheet carried the same paths as data URIs and weighed 238 kB before the first icon
rendered. Because the paths are relative, `icons/imgs/` must sit beside `icons.css` wherever it is
served — the tarball and therefore the CDN carry it (`files: ["src", "icons"]`).

| Channel  | How to take it                                                                                                             |
| -------- | -------------------------------------------------------------------------------------------------------------------------- |
| npm      | `import "@aio-ui/styles/icons.css";` — the bundler copies the SVGs it finds next to the sheet                              |
| CDN      | `<cdn>/packages/styles/icons/icons.css` — icons resolve as `<cdn>/packages/styles/icons/imgs/<name>.svg`                   |
| Bundlers | Keep the SVGs out of the CSS: Vite inlines assets under 4 kB, so set `assetsInlineLimit: 0` (or `?url`) or the win is lost |

The animated spinner and the glyphs that are one path in the base sheet (`close`, `close circle`,
`hamburger`, `weburl`, `download file`) stay in `src/icon.css`; `icons.css` imports that base, so
linking the channel alone is enough.

The channel keeps its own README — `packages/styles/icons/README.md` — for usage, markup, adding a
glyph and the bundler note; this one stays the package door.

`__tests__/icons.test.ts` pins the contract: no `data:image` in the sheet, every `url()` has its
file, every file is referenced, and the manifest still ships and exports the folder.

### Usage

The element is `<i class="icon name"></i>`. A multi-word name is written as spaced classes, because
the sheet selects on the class chain (`i.icon.user.list`):

```html
<i class="icon user"></i> <i class="icon user list"></i>
```

Ink follows `currentColor` — colour the parent, not the glyph. Size follows `--icon-size`
(default `1rem`); set the element's `width`/`height` or override the token to rescale. The glyph is
decorative, so pair it with `aria-hidden="true"` unless the surrounding text already says it.

### Markup

The smallest usable unit, ready to copy:

```html
<i class="icon user list" aria-hidden="true"></i>
```

### Built with it

The builders already use these classes, so a component that needs an icon takes a name, not a URL:

| Component           | How it uses the set                                        |
| ------------------- | ---------------------------------------------------------- |
| Article             | `icon arrow left`, `icon display list`                     |
| Form / FormMessages | `icon checkmark`, `icon arrow right`, `icon error`         |
| Header              | `config.icon` (the builder appends `icon`)                 |
| Menu                | `icon arrow right` for a branch                            |
| Input               | FileUploader, InputControls, InputPicker buttons           |
| Masonry             | `icon close`, `icon left`, `icon right`                    |
| Message             | `notification icon`, `close circle icon`                   |
| Table               | `icon: "edit"`, `"trash"`, `"plus square"`, `"arrow left"` |

### Sources

- index — `https://cdn.jsdelivr.net/gh/sieteminerva/AIO-UI@v0.2.7/packages/styles/src/index.css`
- icon channel — `https://cdn.jsdelivr.net/gh/sieteminerva/AIO-UI@v0.2.7/packages/styles/icons/icons.css`
  (its glyphs: `.../packages/styles/icons/imgs/<name>.svg`)
- tarball — `https://github.com/sieteminerva/AIO-UI/raw/releases/v0.2.7/aio-ui-styles-0.2.7.tgz`

The package is not published to npm; install the tarball.

## When to use it

- A host that builds its own page: link the sheet and read `--app-*` in its own CSS.
- A component: do not import this package. `ensureStylesheet` requests the sheet the component
  names, and the tokens are already on `:root`.
