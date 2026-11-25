# TASK — `@aio-ui/header` component

Status: **landed** (b100, 2026-11-25) — package, demo row and proofs are in; the only open
item is the family bump to **0.2.7** so the release-artefact test (`releases/v0.2.7`) covers
the new package.

Status addendum (b105, 2026-11-26): `config.iconPosition` (`top` default, `left`/`right`/
`bottom`) and type-scale spacing landed — `--header-title-measure` drives `--header-gap`
(`clamp(0.35rem, 0.35 × measure, 0.5rem)`) and the icon block, so `data-size` moves the whole
block. Measured on `#kitchen/header` at `size: "small"`: gap 23.2 → 7.5px, icon glyph 42.9px.

Decisions (owner, 2026-11-25): metadata value = `string | { textContent, className } |
HTMLElement`; root class `.header` (selector `header.header`, nested); `icon` is the full
font class; heading level from `size` (huge→h1, normal→h3, medium→h4, small→h5);
`structuredData` opt-in (default off); divider is a sibling after `.meta`.

## Goal

One new self-contained package, `packages/components/header/`, rendering an article-style
heading block: an icon, a title, a subtitle and a metadata line. Same shape as every other
component — `Builder` subclass, `ensureStylesheet` (never `import "./Header.css"`), curated
`index.ts`, README, `__tests__`, registered in the demo's asset map.

```bash
npm run new:component header      # scaffold from templates/component/
```

## Schema

```ts
{
  content: {
    title: string;
    subtitle: string;
    icon: string; // a `<i class="… icon">` glyph name, e.g. "user"
    metadata: string | {textContent: string; className: string;} | HTMLElement; // one class + one text per property (see below)
  },
  config: {
    useDivider: boolean; // line at the end of header
    size: "huge" | "normal" | "medium" | "small";
    appearance: "normal"; // room for more words later; `normal` is the only one now,
    alignment: "center" | "left" | "right" | "justify";
    iconPosition: "top" | "left" | "right" | "bottom"; // where `i.icon` stands, default "top"
  }
}
```

## Output

```html
<header class="item">
  <i class="user icon" data-position="top"></i>
  <h3 class="title">Merawat kaos katun agar tidak melar</h3>
  <div class="subtitle">Example subtitle</div>
  <div class="meta">
    <span class="author">Oleh: <strong>Rina</strong></span>
    <span class="date">12 Januari 2026</span>
  </div>
  <span class="divider"></span>
</header>
```

- `metadata` is **looped**: each property becomes one `<span class="{key}">`, its value the
  `textContent`. Order follows the object's own order.
- `config.useDivider: true` appends `<span class="divider"></span>` **after `.meta`** — the
  closing line of the header (a boolean, so the sheet draws it).
- `size` → `data-size`, `appearance` → `data-appearance`, `alignment` → `data-alignment` on the
  root. All three drive the sheet, not inline styles.
- `iconPosition` → `data-position` on `i.icon` (never an order change: the DOM stays icon →
  title → subtitle → meta → divider). `left`/`right` make the glyph a block as tall as the
  title + subtitle with its glyph centred on that block; `bottom` puts it under the subtitle,
  above `.meta`.

## SEO & semantics (mandatory)

A heading block is content, so its markup is the page's SEO surface. These are rules, not
suggestions:

- **A real `<header>`, never `<div role="header">`.** Inside `<article>`/`<section>` it is that
  section's header, not a page `banner` landmark; the demo must not turn it into a second banner.
- **One heading, and the level is the page's decision.** `<h3>` is the default render, but the
  element must come from config (see decision 4): a page whose article title is the block's title
  needs `<h1>`, and two `<h1>`s on one page is a defect. The text is `content.title` verbatim —
  never truncated or decorated.
- **Dates are machine-readable.** A metadata key that holds a date (`date`, `published`,
  `updated`) renders `<time datetime="YYYY-MM-DD">` plus the human text; the `datetime` value
  comes from the schema, not from parsing the label. Without it, crawlers see prose only.
- **The icon is decoration.** `<i aria-hidden="true">` (plus `focusable="false"` for old IE
  fallbacks), because the title already says what the block is. Never let a ligature word
  (`"user"`) leak into the accessible name.
- **The divider is decoration too.** `<span class="divider" aria-hidden="true">` — a screen
  reader must not announce a bullet as content.
- **`<p>` for the subtitle.** The sample's `<div class="subtitle">` is kept for the owner's
  markup, but the implementation may use `<p>`; either way no `<h*>` inside the block other than
  the title.
- **No hidden text, no duplicate copy.** The subtitle/meta appear once in the DOM; CSS may hide
  them at a size, but `display: none` SEO copy is a defect, not a feature.
- **The host owns `lang`/`dir`.** The component never writes `lang`; a locale-specific date
  string is the caller's job (`content.metadata`).

## Rules to honour (non-negotiable in this repo)

- Files are PascalCase (`Header.ts`, `Header.css`); the sheet specifier mirrors the file name.
- CSS house style: **one root selector** (`.item` or a component root class — decide and keep
  one), every rule nests with `&`; no Sass `&-suffix`; media queries stay top-level.
- Tokens are `--header-*` and must derive from an `--app-*` token.
- A new package needs: `package.json`, `exports` entries, import-map entries (package root
  **and** every exact subpath), `npm install`, a dev-server restart (`touch vite.config.ts`),
  and a row in the catalogue/README tables.
- Register the builder in the demo's registry assets and add a demo route/section.

## Proof of render (mandatory)

```ts
const builder = new HeaderBuilder(config);
builder.create(payload);
const { keys, hierarchy, html } = builder.inspect();

expect(keys).toContain("@header"); // presence
expect(hierarchy["@header>meta"].elements).toHaveLength(3); // shape (2 spans + divider)
expect(html).toContain("Oleh: Rina"); // value
expect(hierarchy["@header>meta"].elements).toHaveLength(2); // negative: useDivider false
expect(html).toContain('aria-hidden="true"'); // icon + divider are decoration
expect(html).toContain('<time datetime="2026-01-12">'); // machine-readable date
```

Plus one measured browser number on the demo route (`getComputedStyle` for `data-size`,
`getBoundingClientRect` for the icon/title row).

## Gates

`npx vitest run packages/components/header` → `npm run check` → `npm run verify` once at the
end of the batch.

## Next (cold start)

1. Answer the three decisions below — they change the schema type and the sheet, so nothing
   else can be written first.
2. `npm run new:component header` — creates `packages/components/header/{Header.ts,Header.css,
index.ts,README.md,__tests__/Header.test.ts}` from `templates/component/`.
3. `Header.ts`: `HeaderBuilder extends Builder` with `builderId`/`name` = `"header"`,
   `stylesheet = "./Header.css"`; element map `@header` (`header.item`), `@header>icon`
   (`i.icon`), `@header>title` (`h3.title`), `@header>subtitle` (`div.subtitle`),
   `@header>meta` (`div.meta`), `@header>meta>item` (`span`); `template()` writes `data-size`,
   `data-appearance` and `data-alignment` on `@header`, loops `content.metadata`, and appends
   `@header>divider` when `config.useDivider` is true.
4. Register in `examples/demo/src/registry.ts` + its asset map, `touch vite.config.ts`, restart
   the dev server, then `npm install` for the new workspace package.
5. Prove it (`builder.inspect()`) before any browser number.

## Open decisions for the owner

1. `metadata` value type — `Record<string, string | number>`, or allow `{ html }` per entry
   (the sample wraps the author in `<strong>`)?
2. Root class — `.item` as in the sample, or `.header` (a bare `.item` is very generic)?
3. `icon` spelling — name only (`"user"` → `class="user icon"`), or full icon-font class?
4. Heading level — the sample's fixed `<h3>`, or a level the page can set (`config.level` /
   `content.level`, `1..6`, default `3`)? Two `<h1>`s on one page is an SEO defect.
5. Structured data — opt-in `itemscope itemtype="https://schema.org/Article"` with
   `itemprop="headline" / "author" / "datePublished"`, or leave microdata to the page?
