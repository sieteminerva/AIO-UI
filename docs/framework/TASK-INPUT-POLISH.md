# TASK — input & form polish before the next release

**Band:** Framework · **Claim:** none yet — take a row before the first edit · **Brief:** this file
**Status:** A **done (b78)**. Order matters: **B → C, then the release** (the release also owes the
note for the three types `@aio-ui/core` stopped exporting in b76).

Three defects the owner reported after the b74/b76 refactor. Each one is a "looks wired, does not
work" case, so each needs a measurement, not an eyeball (`AGENT_RULES.md` §16).

## A — form `.wide` / `span` layout is not implemented in full

**Landed — b78.** The root cause was not the arithmetic but the *containers*: only a row
consumed the share. A `group` (`fieldset`) never called FormLayout, so a documented
`column: 2` group (the demo's `#form/calculation`) rendered a one-column stack with no
`--span` at all; and a cascade-held child was built outside the row loop, so its
`config.wide` was never stamped.

- `FormLayout.ts` — one contract: `spanOf` (fraction, percent, `"50%"`, `"auto"`/`"full"`)
  and `clampSpan` (the only bounds), `declaredColumns` (a row always grids, a group only
  when it says `column`), `childSpanOf` (explicit `span` wins, then `wide`).
- `Form.ts` — `renderGroup` lays its children out when `column` is declared, using the
  same `applyRowColumns` + `applyRowSpan` a row uses; `renderRow` reads `declaredColumns`.
- `adapters/Cascade.ts` — `#stampSpan` writes the share on a child built later (both hold
  modes), from the container's `data-column` and the item's `wide`/`span`.
- `Form.css` — `@property --span { inherits: false }` so a share never leaks into a nested
  container; new `7c. Group Grid` block reads only `--items` / `--span`; the 640px query
  collapses both grids.
- `FormSchema.ts` / `README.md` — `column` on a group is the contract now (the old
  “a group ignores it” JSDoc was stale); one share spelling table in both places.

**Measured (browser, demo dev server, 2026-11-24):**
- `#form/calculation` (group, `column: 2`): fieldset 700px → Qty 314px, Harga 314px,
  Total 646px (`span 2`); before b78 the same group was `grid-template-columns: none` and
  the fields stacked 646px each.
- `#form/layout` (row, `column: 2`): row 704px, two `span 1` children 343px each
  (`(704 − 18 gap) / 2`), the `"auto"` child 704px (`span 2`).

## A — original brief (kept for the contract)

**Symptom.** A field's share of a form row is documented as `wide: 50` (half) / `"auto"` (full row)
/ an explicit `span`, but the rendered grid does not honour it faithfully.

**Where.**
- `packages/components/form/FormLayout.ts` — `columnsOf()`, `childSpanOf()`, `applyRowSpan()`,
  `applyRowColumns()` (imported at `Form.ts:17`).
- `packages/components/form/Form.ts:785` (`columnsOf(rowInput.column)`),
  `:827` (`applyRowSpan(element, childSpanOf(child, columns))`).
- `packages/components/form/Form.css:38-63` — the grid consumes `grid-column: span var(--span, 1)`;
  the comment there is the contract ("50 = half, `\"auto\"` = full row").
- `docs/framework/TASK-INPUT-SCHEMA.md` and `form/README.md` both promise that contract.

**Do.** Decide the intended arithmetic once (`wide` is a percentage of the row → `span` in columns,
`"auto"` = every column, absent = 1), write it in `FormLayout.ts` as one function, and make the CSS
read only the resolved `--span`. Cover: `wide: 50` on a 2-column row (half), `wide: 100`/`"auto"`
(full), `wide: 33` on 3 columns, a child wider than the remaining columns (wrap, never overflow),
and a nested row.

**Acceptance.** A test in `packages/components/form/__tests__/FormRow.test.ts` asserting the
resolved `--span` **and** the measured `gridColumn` on each child; plus a browser number for one
real demo row (e.g. "2 children, columns: 2, wide: 50 → each 50% of 640px = 320px").

## B — `config.footer` is appended but unstyled

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

## C — `select` / `dropdown` popup clipped near the viewport or inside `overflow: hidden`

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
