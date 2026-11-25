# TASK — `@aio-ui/header` follow-ups

Status: **landed in `v0.2.7`** (b100–b106, release 2026-11-26). The package, its demo row, the
`appearance` shapes and the two ink doors are shipped; the family bump to `0.2.7` is done. Only
the loose ends below remain.

## Next

1. **Demo control for `appearance`** — the header route renders the default only. Add a select for
   `normal | bordered | block | editorial` beside `iconPosition`, then take a browser number
   (`.header` padding + radius per variant) as the render proof.
2. **`selectors[key].color` rollout check** — `Base._applyNodeAttributes` honours the general ink
   door for every builder. A sheet that hard-sets `color` on a child will not receive a root-level
   inline ink; `Header` solves it with `currentColor`, so audit the other sheets before the door is
   documented as repo-wide.

## Resolved (for reference)

- Package, schema and decisions (metadata value, root class `header.header`, `icon` full class,
  heading level from `size`, opt-in `structuredData`, divider sibling) — b100.
- `iconPosition` + type-scale spacing — b105.
- `appearance` shapes, `color.{title,subtitle,icon,metadata,block,border}`, `.meta` column,
  `config.selectors[key].color` — b106.
- Family bump to `0.2.7` so `releases/v0.2.7` covers the package — v0.2.7 release.

## Gates

`npx vitest run packages/components/header` → `npm run check` → `npm run verify` once at the end
of a batch.
