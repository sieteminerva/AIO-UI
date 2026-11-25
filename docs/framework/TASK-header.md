# TASK — `@aio-ui/header` component

Status: **queued** (owner spec, 2026-11-25, batch b99). Not started.

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
    metadata: any; // one class + one text per property (see below)
    useDivider: boolean; // `•` between metadata entries
  }
  config: {
    size: "huge" | "normal" | "medium" | "small";
    appearance: "normal"; // room for more words later; `normal` is the only one now
  }
}
```

## Output

```html
<header class="item">
  <i class="user icon"></i>
  <h3 class="title">Merawat kaos katun agar tidak melar</h3>
  <div class="subtitle">Example subtitle</div>
  <div class="meta">
    <span class="author">Oleh: <strong>Rina</strong></span>
    <span class="divider">•</span>
    <span class="date">12 Januari 2026</span>
  </div>
</header>
```

- `metadata` is **looped**: each property becomes one `<span class="{key}">`, its value the
  `textContent`. Order follows the object's own order.
- `useDivider: true` puts `<span class="divider">•</span>` between entries (never before the
  first or after the last).
- `size` → `data-size` on the root; `appearance` → `data-appearance`. Both drive the sheet,
  not inline styles.

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
   `@header>meta` (`div.meta`), `@header>meta>item` (`span`); `template()` writes `data-size`
   and `data-appearance` on `@header` and loops `content.metadata`.
4. Register in `examples/demo/src/registry.ts` + its asset map, `touch vite.config.ts`, restart
   the dev server, then `npm install` for the new workspace package.
5. Prove it (`builder.inspect()`) before any browser number.

## Open decisions for the owner

1. `metadata` value type — `Record<string, string | number>`, or allow `{ html }` per entry
   (the sample wraps the author in `<strong>`)?
2. Root class — `.item` as in the sample, or `.header` (a bare `.item` is very generic)?
3. `icon` spelling — name only (`"user"` → `class="user icon"`), or full icon-font class?
