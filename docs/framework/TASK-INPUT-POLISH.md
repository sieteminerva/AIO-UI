# TASK — input & form polish before the next release

**Band:** Framework · **Claim:** none yet — take a row before the first edit · **Brief:** this file
**Status:** A (b78/b79), **B and C landed in b81**. Only the release is left (it also owes the
note for the three types `@aio-ui/core` stopped exporting in b76).

Three defects the owner reported after the b74/b76 refactor. Each one is a "looks wired, does not
work" case, so each needs a measurement, not an eyeball (`AGENT_RULES.md` §16).

## A — a field's width is one number: `wide` is a percentage of the row

**Landed — b78 + b79.** Two faults, one cause: only a row consumed the share, and the share was
expressed as an integer column span — which cannot render `20 / 40 / 40` on a 3-column row (it
rounded to `1 / 1 / 1`).

**Final contract (b79, owner's decision).**

- `wide` is a **percentage of the row** and the only width knob; the 16-grid / integer span system
  is retired. `20`, `"40%"`, `0.5` (fraction), `"auto"` / `100` (full). **Absent = the whole row.**
- `column` is **only the line cap**: the fourth child of a `column: 3` row starts the next line.
  It no longer divides space.
- A share that would pass 100 starts a new line instead of overflowing: a placement past track 100
  makes CSS create implicit tracks, which silently shrink every explicit one (the whole row loses
  its percentages). Measured before the guard: `#form/layout` `grid-template-columns` grew to 150
  tracks and the `wide: 50` children rendered 293px instead of 352px.
- The gutter lives inside each share (`padding-inline: gutter/2`, `column-gap: 0`): a real
  `column-gap` would be added on top of the percentages and push a 20/40/40 line past 100.

**Where it lives.**

- `FormLayout.ts` — `wideOf` (the only arithmetic), `childWideOf`, `declaredColumns` (line cap),
  `applyRowSpan` (writes `--span` 1..100), `arrangeRow` (explicit `grid-row` + `grid-column`).
- `Form.ts` — `renderGroup` lays out a `column` group with the same writers a row uses; both call
  `arrangeRow` once the children (and a control set) are in.
- `adapters/Cascade.ts` — a child built later is stamped and the container re-arranged (both hold
  modes).
- `Form.css` — `@property --span { inherits: false; initial-value: 100 }`; one grid block for
  `.field.group[data-column]` and `.form > fieldset.form-group[data-column]` reading a
  100-track grid; the 640px query collapses both.
- `FormSchema.ts` / `README.md` — `column` = line cap, `wide` = percentage, `span` gone.

**Measured (browser, demo dev server, 2026-11-24, after b79).**

- `#form/layout` (row, `column: 2`, widths 50/50/100/50/50): row 704px, 100 tracks, children
  352 / 352 / 704 / 352 / 352 → **exactly 50/50/100/50/50**; the 100-unit child starts line 3 and
  the next pair line 4.
- `#form/calculation` (group, `column: 2`): fieldset 700px → 323 / 323 / 646 (50/50/100 of the
  646px content box).
- `#form/fields` `types-choice` (group, `column: 2`, no `wide`): every child 646px (full line) —
  the b78 side effect where an unwritten width became half is gone.
- `#form/input` `row-record` (row with a control set): fields 323 / 323 then 646; the control set
  takes its own full-width line instead of a cell.

## B — `config.footer` — **landed (b81)**

The footer is a **note line** (terms, a help link, a build stamp), not a second action bar.
`Form.css` now has `.form > .form-footer { display:flex; justify-content:flex-end; gap:.5em;
margin-top:1em; padding-top:.75em; border-top:1px solid var(--form-footer-border); … }`,
with `--form-footer-border` / `--form-footer-text` declared on `.form` from
`--app-border-color` / `--app-text-accent-color`.

**Measured (browser, `#form/layout`, footer added to `layoutConfig`):** `.form-footer` 704px,
x 41 (aligned with the form), `border-top: 1px` at 30% alpha, `justify-content: flex-end`.
`FormRow.test.ts` pins the rule and the token derivation.

**Original brief.**

**Symptom.** `config.footer` renders (a string becomes `@form>footer`), and then nothing styles it.

**Where.** `Form.ts:83` (`footer?: HTMLElement | string | null`), `:441`
(`"@form>footer": { tagName: "div", className: "form-footer" }`), `:661-666` (the append).
`grep -n "form-footer" packages/components/form/Form.css` → **no rule**.

**Do.** Add the rule to `Form.css`, obeying the house style (`.guidance/rules.md`): the sheet has
**one root selector**, so the footer nests under it (`& > .form-footer`), never a bare
`.form-footer` at top level; tokens are `--form-*` derived from `--app-*`. Decide and document what
the footer is for (submit row? message line?) — the style should follow that, not invent a look.

**Acceptance.** The footer renders with its declared layout (padding, border-top, alignment) and a
test pins the rule's presence/side effect (`getComputedStyle` in happy-dom is thin — prefer asserting
the class + a browser measurement from the demo's `#form` route).

## C — popup clipping — **landed (b81)**

Anchor positioning and the Native Popover API were already in place; the clip came from
`position-try-fallbacks: none`. Now:

- `.field { anchor-scope: --field-dropdown-anchor }` and **one shared anchor name** — the
generated `--anchor-<id>` / `--picker-xxxxxx` names are gone (`Dropdown.ts`, `Input.ts`,
`InputPicker.ts`).
- `position-try-fallbacks: --flip-top, flip-block` on the shared surface **and** on the picker
panel; `@position-try --flip-top` mirrors the inset, width and anchor edges.
- A try rule may only carry placing/sizing declarations, so the trigger border cannot be
mirrored from inside it; and `@container anchored(fallback: …)` does **not** match for the
anchor element itself (probe on Chromium 148: neither the trigger nor the menu picked the
query styles up). The seam is handled geometrically instead — the surface overlaps the
trigger by 1px — and `input/README.md` says so.

**Measured (browser, fixed `.field` 24px above the viewport bottom, Chromium 148):** menu
`bottom` 435 vs trigger `top` 434 → opens **upward**, stays inside the viewport with
`position-try-fallbacks: --flip-top` alone (no `flip-block`); `anchor-name` and
`anchor-scope` both report `--field-dropdown-anchor`.

**Original brief.**

**Symptom.** The choice list is cut off when the trigger sits near the viewport edge or inside a
scrolling/overflow container.

**Fix direction (owner's decision, do not substitute a JS position calculator).** CSS-only:
CSS Anchor Positioning + the Native Popover API, keeping `select::picker(select)` and
`.dropdown[data-style] > .menu` visually identical.

**Where (current line numbers).**

- `packages/components/input/input.css` §5.2 SHARED POPUP SURFACE — the rule at `:410-449` holds the
  shared surface; `position-try-fallbacks: none;` sits at **`:440`** and must go.
- §10.3 SELECT MODE — `:1067` (`& > select:open::picker(select)`).
- The `.visible` state the dropdown uses today: `:605`, `:864`.
- `packages/components/input/Dropdown/Dropdown.ts` + `Dropdown.css` — where the menu is created and
  toggled.

**Do.**

1. **Per-field anchor.** `.field { anchor-scope: --field-dropdown-anchor; }`; the trigger sets
   `anchor-name: --field-dropdown-anchor;` and `container-type: anchored;`; the surface sets
   `position-anchor: --field-dropdown-anchor;`. No generated ids.
2. **Flip to top.** Replace `position-try-fallbacks: none` with
   `position-try-fallbacks: --flip-top, flip-block;` and add `@position-try --flip-top` (inset auto,
   `left: anchor(left)`, `width: anchor-size(width)`, `bottom: calc(anchor(top) - 1px)`,
   top border on, bottom border off, radius top only, `transform-origin: bottom`).
3. **Trigger border follows the flip.** Inside `@container anchored(fallback: --flip-top)`, the
   trigger drops its top radius + top border colour and gains the bottom ones, so trigger and menu
   read as one surface.
4. **Top layer.** Give `.dropdown[data-style] > .menu` `popover="auto"` in `Dropdown.ts` and drive
   open/close with `showPopover()` / `hidePopover()` (light-dismiss + Esc come free); the CSS accepts
   `:popover-open` beside `.visible`. Keep the `@starting-style` + `transition-behavior:
allow-discrete` choreography working in both directions.
5. **Keep §5.2's rule split.** `select::picker(select)` and `.dropdown[data-style] > .menu` stay
   separate standalone rules where they differ — a selector list that is invalid for one kind kills
   both.

**Traps.** `::picker(select)` and CSS Anchor Positioning are Chromium-only today: keep a readable
fallback (the current absolutely-positioned surface) so Firefox/Safari do not lose the menu, and say
so in `input/README.md`. `Dropdown.css` must not re-state what §5.2 already owns. Run the CSS house
style check by hand on every sheet touched (one root selector, `&` nesting, no `&-suffix`, tokens
from `--app-*`).

**Acceptance.** A measured browser probe (playwright/browser tools, or the demo's `#form` +
`#kitchen` routes): a trigger 24 px from the viewport bottom opens **upward**, its menu's
`getBoundingClientRect().bottom` stays inside the viewport, and the trigger's computed
`border-top-color` is `transparent` in that state; a menu inside an `overflow: hidden` container is
visible in the top layer (no clipping).

## Gate ladder

Per item: the narrow test file, then `npm run check` (types + api-map), `npm run verify` once for the
batch, and the browser number above for C (and for A/B where stated). Release only after all three.
