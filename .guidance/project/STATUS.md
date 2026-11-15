# Logbook — top three

> Read this file only at orientation, beside `git log --oneline -8`. Cards are rewritten every
> session, never appended: each is a summary plus the link to the real detail, which is opened only
> after the user picks a card (`AGENT_RULES.md` §13).

### 1. Theme console — docked in the fab menu

Colour engine + kit + presets, plus the `ThemeConsole` chrome: one fab panel with style / mode /
colour switches, tokens broadcast to `<html>`; `fab-menu` now accepts an `HTMLElement` payload.
**Open:** the panel composition inside a 24rem popover.
→ `examples/demo/src/ThemeConsole/TASKS.md`

### 2. Menu — recursive submenus and a compact strip

`config.multilevel` (`activation`, `property`, `multicolumn`) beside `position`; a branch is
`li.item.submenu` with `open`/`closed` and never navigates; below 768px every position becomes one
scrolling strip. Shipped.
→ `packages/components/menu/README.md` (`## Multi-level`, `## Compact viewport`)

### 3. Masonry — the lightbox is part of the payload

`@masonry>modal>stage|image|caption|title|desc` are declared selectors, so `template()` builds the
lightbox and re-renders it per open. Shipped; the column distribution is still open.
→ `packages/components/masonry/README.md`

## Where everything else lives

| Need                                | File                                        |
| ----------------------------------- | ------------------------------------------- |
| Framework queue + landed            | `.guidance/project/framework.md`            |
| Gallery queue + landed              | `.guidance/project/gallery.md`              |
| Generator queue + landed            | `.guidance/project/generator.md`            |
| Rules — process                     | `.guidance/AGENT_RULES.md`                  |
| Rules — component + environment     | `docs/framework/COMPONENT-CONVENTIONS.md`   |
| Live writers (lock)                 | `.guidance/project/AGENTS.md`               |
| Architecture decisions              | `.guidance/project/DECISIONS.md`            |

Last updated: 2026-11-16

## Cross-project

- **Official release** waits for all four manual model references (`gallery` exists; `store`,
  `profile`, `blog` do not). The tree is at `0.2.0`; the last published tag is `v0.2.0`
  (pre-release, 2026-11-14). Lane: `gallery.md`.
- **Rules**: process `.guidance/AGENT_RULES.md`; engineering + environment
  `docs/framework/COMPONENT-CONVENTIONS.md` (§12 CSS, §13 anti-patterns, §15 env/gates/harness).
- **Memory**: `/memories/` holds state + pointers only — preferences, a band outline per repo, and
  at most three CPs per task file (`AGENT_RULES.md` §12).
