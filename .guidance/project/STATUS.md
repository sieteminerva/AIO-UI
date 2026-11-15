# Project Status — what now

> **Rule:** maximum **3** active items, ≤ 80 lines, **overwritten** every session — never appended.
> Lifecycle: `plan.md` (why) → `NEXT_TASKS.md` (queue) → **this file** (what now). See `AGENT_RULES.md` §9.

Last updated: 2026-11-16

## Active (max 3)

| #   | Task                        | Project   | State       | Gate                                                                                            |
| --- | --------------------------- | --------- | ----------- | ----------------------------------------------------------------------------------------------- |
| 1   | Theme console view (fab)    | Framework | in progress | `docs/framework/TASK-theme-console.md` — panels compose inside a 24rem popover; ≤380px no overflow |
| 2   | Generator emits `isRoot`    | Generator | next        | `mount()` emits `isRoot: true`; `gallery` + `store` probed in a browser                          |
| 3   | Build `profile` reference   | Examples  | queued      | home, services, contact, portfolio render; boundaries documented                                |

## Landed recently

- **Batch 38 (2026-11-16):** the colour generator is host chrome, not a route. `fab-menu` accepts an
  **`HTMLElement` payload** — an entry in `actions` or the whole payload — the contract `tab`, `form`
  and `modal` already had, so a host can dock a real widget instead of option buttons. `ThemeConsole`
  (demo) is a slot host in the `Editor.ts` arrangement: it instantiates `ColorThemeBuilder`, attaches
  `@colorizer>configurator` / `>output` / `>mode` into one fab panel, and applies the broadcast tokens
  to `documentElement` — the page behind the popover is the preview. Its three rail controls are the
  input primitive's switch (`.field` + `.switch.control`), and the fab no longer auto-closes. Fixed on
  the way: `.page` is `minmax(0, 1fr)` (an implicit `auto` track grew to the code block's width), the
  projected panels are border-box, and the preset save button belongs to `InputControls` — `input.css`
  alone was not enough, `controls.css` is host-linked too. `#theme` route, its page and nav leaf: gone.
- **Batch 37 (2026-11-16):** the menu is recursive. `config.multilevel.property` names the children key
  and `paintList()`/`paintItem()` re-enter per level, so depth is unbounded; every list is `ul.menus`.
  A branch is `li.item.submenu` with `open`/`closed`, never navigates, and draws its glyph from the
  shared icon set. Below 768px every position becomes the same strip. An explicit `content.brand` no
  longer eats the first navigation; `.nav.nav` keeps compact rules from losing on emit order.
- **Batch 36 (2026-11-15):** the masonry lightbox is markup again — `@masonry>modal>stage|image|
  caption|title|desc` are declared selectors, so `template()` builds it from the payload. The card, not
  the `img`, carries the click.
- **Batches 32–35 (2026-11-14/15):** the CSS debt list emptied (Menu owns its states, file control is a
  flex row, tab gained `tabStyle: "folder"`), the last five `#form` topics got live demos — which
  exposed a loader that never ran **initialize** — and `@aio-ui` **0.2.0** shipped to CDN + Pages
  with `docs/live-cdn-migration.md` for apps that still vendor the source.


## Blocked

- **Official release** waits for all four manual model references (`gallery` exists; `store`,
  `profile`, `blog` do not). The tree is at `0.2.0`; the last published tag is `v0.2.0`
  (pre-release, 2026-11-14).

## Open questions

- **The theme console's view still reads odd** — see `docs/framework/TASK-theme-console.md`
  (`## Open question`). Nothing is broken; the panels are a page grid inside a popover.
- Generated-site hosting (GitHub Pages vs Cloudflare Pages) — affects deployment only, not the
  preset contract.
