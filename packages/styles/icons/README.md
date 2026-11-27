# Icons (`@aio-ui/styles/icons.css`)

The icon channel of `@aio-ui/styles`. Every glyph is a real `.svg` under `imgs/`, referenced by a
relative `mask-image`, so an icon takes the colour of the text around it and needs no font file, no
sprite and no build step. The sheet is ~14 kB whatever the set grows to: the browser fetches only
the glyphs a page actually draws.

Nothing here is a second package — `@aio-ui/styles` ships both folders (`files: ["src", "icons"]`),
so the channel has its own entry file and its own CDN path while staying on one version.

## Install

Link the channel — `index.css` already imports it, so a host that links the package entry point
needs nothing else:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/sieteminerva/AIO-UI@v0.2.7/packages/styles/icons/icons.css" />
```

    npm install https://github.com/sieteminerva/AIO-UI/raw/releases/v0.2.7/aio-ui-styles-0.2.7.tgz

`import "@aio-ui/styles/icons.css";` when a bundler resolves the package. The paths inside the sheet
are relative, so `imgs/` must sit beside it wherever it is served — the tarball and the CDN carry it.

**Bundlers:** keep the SVGs out of the CSS. Vite inlines assets under 4 kB by default, which turns
the links back into base64 and gives up the whole win — set `assetsInlineLimit: 0` (or take the
files with `?url`).

## Icons

A global icon system. The sheet declares one rule per glyph; the base (`i.icon` sizing, the mask
setup, the animated spinner) and the few glyphs that are not files live in `../src/icon.css`, which
this sheet imports.

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

### Add an icon

Drop the file in `imgs/`, then add one rule — the name is the file name, dots for spaces:

```css
i.icon.print.file,
i.print.file.icon {
  mask-image: url("imgs/print-file.svg");
  display: inline-block;
  color: currentColor;
}
```

`__tests__/icons.test.ts` in the package fails when a `url()` has no file, when a file is never
referenced, or when a rule goes back to a `data:` URI.

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

- sheet — `https://cdn.jsdelivr.net/gh/sieteminerva/AIO-UI@v0.2.7/packages/styles/icons/icons.css`
- glyphs — `.../packages/styles/icons/imgs/<name>.svg`
- base — `https://cdn.jsdelivr.net/gh/sieteminerva/AIO-UI@v0.2.7/packages/styles/src/icon.css`

The parent README covers the token system and the other four sheets.
