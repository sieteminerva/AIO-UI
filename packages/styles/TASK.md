# TASK — colour tokens before v0.2.6

**Status:** T1–T5 **done** (b86–b94, shipped in `v0.2.6`), plus the dropdown/picker seam work the
owner asked for mid-task. The only open item is the **T3 taste pass** (owner reviews colours), and
a picker-upward re-check when a tab is visible. This doc lives here (in the folder that owns the
token root) so the colour contract and its remaining work travel with `packages/styles`.
**Owner direction:** the agent executes the stages; the owner then reviews each component and
points at the colour it wants changed. Do not wait for per-component approval to start the root.

## Restore checkpoint — created 2026-11-25

```
tag    color-pre-full-2026-11-25   → 547973e
branch color-restore-pre-full      → 547973e
```

Nothing below has been written yet; this tag is the "before the full colour rewrite" state.
To undo the whole rewrite:

```
git reset --hard color-pre-full-2026-11-25   # then: git push --force-with-lease origin main
# or, keeping history: git revert <commits>
```

## The contract (decided)

1. **One root shape.** `packages/styles/src/variables.css` becomes ONE `:root` of `light-dark(light,
   dark)` pairs + `color-scheme: light dark`, plus a small dark branch for the three NON-colour
   tokens (`--app-page-background` gradient, `--app-shadow-soft`, `--app-shadow-elevated`) that
   `light-dark()` cannot hold. Pins: `[data-mode="light"] { color-scheme: light }`,
   `[data-mode="dark"] { color-scheme: dark }`. This is the format the generator already exports
   (`ColorThemeEngine.toCssText`) — one shape for one contract.
2. **Two brand strengths.** `--app-primary-color` / `--app-accent-color` are FILL colours.
   `--app-primary-ui` / `--app-accent-ui` are STROKE colours (borders, focus rings, icons) and
   clear WCAG 1.4.11 (3:1) on a surface. Components use `-ui` for any 1px line or glyph.
3. **Text is not decoration.** Body ink keeps a 4.5:1 floor; the generator caps the brand mix
   (`MAX_TEXT_MIX = 25`). A component must never paint body text with a fill token.
4. **No raw colour literal in a component sheet.** A chip/highlight derives from the ink it sits
   behind (`color-mix(text N%, transparent)`) so it is a visible step off ANY page. Allowed
   exceptions, marked with a comment: media overlays (modal backdrop, lightbox), data-URI masks,
   and the code-block paper/ink pair (14.7:1, deliberately theme-independent).
5. **Mode follows one attribute.** A theme package must set `data-mode` (and `color-scheme`) in
   `activate()`, or components that still have a dark block never flip.

## Stages

| # | Stage | Files | State |
| - | ----- | ----- | ----- |
| T0 | This doc | `packages/styles/TASK.md` | done |
| T1 | Root `light-dark()` rewrite + spinner mask + skeleton derive | `packages/styles/src/variables.css`, spinner consumers (`Dropdown.css`, `Masonry.css`, `Tab.css`, `examples/demo/src/style.css`) | **done (b86)** |
| T2 | Form path text/border tokens | `packages/components/input/{Input.css,InputControls,FileUploader,Dropdown}`, `form/Form.css` | **done (b87, b91)** |
| T2b | Popup = one sheet with the control (owner request) | `input/Input.css`, `input/Dropdown/{Dropdown.css,Dropdown.ts}`, `form/Form.css` | **done (b88–b91)** |
| T3 | Hardcoded-palette components | `article/Article.css`, `table/Table.css`, `message/Message.css`, `carousel/Carousel.css`, `tab/Tab.css` | **done (b92)** |
| T4 | Theme packages set the mode | `packages/themes/cyberpunk/src/CyberpunkTheme.ts` (done); `horizontal` intentionally neutral | **done (b93)** |
| T5 | CSS lint test | `packages/components/__tests__/colour-literals.test.ts` (no raw literal except the allowlist above) | **done (b94)** |

### T1 notes (do first)

- Convert every colour token in `variables.css` to `light-dark(light, dark)`; keep layout/spacing
  tokens as-is. The two current dark blocks (media + `[data-mode]`) collapse into the pairs; only
  the gradient + two shadows keep a dark branch.
- Spinner: `--app-spinner-content` is an SVG data-URI with hardcoded purple strokes, consumed as a
  real image in `Dropdown.css:111` (`content:`) and `examples/demo/src/style.css:333`
  (`background-image:`). Convert both consumers to `mask-image` + `background-color:
  var(--app-primary-color)` (Form/Input already do this). Then the URI's colours stop mattering.
- Skeleton: `Skeleton.css` reads `--app-skeleton-bg`; the generator now emits it. Optionally derive
  it from `color-mix(primary 12%, transparent)` so no theme can forget it.

### T2 notes (owner-reported defects)

- `input.css`: `--input-paper` / `--input-paper-soft` are light-only (`rgb(245,244,244)`) and feed
  button/uploader mixes (`Form.css:346-347`, `FileUploader.css:50,469`). Delete them or derive from
  `--app-surface-*`. `--input-background-color` mixes into `#fff`; `--input-text-color-light` /
  `-hover` mix into `white`/`black`. The dropdown arrow SVG is `fill='black'` (invisible in dark).
  One border hue only: resting = `--input-border-color` (done), hover, focus = `--app-accent-ui`.
- `InputControls.css:173-179`: button text is `mix(text 20%, white 70%)` → light-only; uses
  `--input-paper`.
- `Dropdown.css:111`: spinner as a coloured image (see T1). `Dropdown.css:76` reads an undeclared
  `--primary-border-color`.
- `FileUploader.css`: mixes into `black`, `rgb(7,7,7)`, `rgb(245,244,244,.8)`.
- `Form.css`: `grey` mixes (`339,671,696`), olive shadow `406`, black shadow `612`, fieldset border
  `26` uses `--input-primary-color` → should be `--app-primary-ui`.

### T3 notes

- `Article.css` and `Table.css` are full light palettes (`#ffffff`, `#1d2733`, `#e4e7ec`,
  `#f3f3f3`, `#925408` literal) with no `--app-*`; `Message.css` is light pastel
  (`#f8ffff`, `#fcfff5`, …) plus `body` `#f8f8f9` / text `rgba(0,0,0,.87)`. Map each to app
  tokens or to `color-mix()` of them.
- `Tab.css` base block has dark assumptions (`--tab-hover-wash: rgba(255,255,255,.06)`,
  `--tab-divider-color: rgba(255,255,255,.08)`).
- Lightbox/backdrop literals in `Modal.css`, `Masonry.css`, `Carousel.css` are intentional overlays
  — keep, but mark.

## Evidence so far (measured in the demo, HMR)

- Inline code `.markdown-code`: 1.02 → **9.71:1** light / **11.61:1** dark.
- Inline-code chip visibility: **1.27:1** step on white, **1.38:1** on noir.
- Report "Primary on surface (UI)": **2.47 ✗ → 3.23 ✓** light, **6.39 ✓** dark.

## Gate policy for this task

CSS-only edits: **no `npm run verify`** — the dev server (HMR) + a quoted measured number is the
proof. TypeScript under `examples/`: `npx tsc --noEmit -p examples/demo/tsconfig.json`. A batch
that touches a package TypeScript file, an `exports` map, or a README still runs `npm run check`.

## Landed

- **b82** `b0db957` — `MAX_TEXT_MIX = 25`, mode-correct dark `--app-surface-muted`, emits
  `--app-skeleton-bg`, guards `zipTokens()` against non-colours.
- **b83** `7e1e224` — inline-code chip derives from the ink (14% fill / 32% hairline).
- **b84** `547973e` — `--app-primary-ui` / `--app-accent-ui` (3:1 floor) + report measures them;
  input resting border adopts it.
- **b86** `12daf52` — `variables.css` is ONE `:root` of `light-dark()` pairs + `color-scheme`,
  `[data-mode]` pins, a dark branch for the three non-colours, `--app-skeleton-bg` derived from
  the brand, and `--app-spinner-content` as a white mask (4 consumers repainted with
  `background-color`).
- **b87** `5138546` — input token layer is mode-neutral (no `white|black|grey|#fff`); field ink
  10.25/11.91, labels 7.27/8.92; `--app-surface-deep` + `--app-text-on-deep` make the code panel
  follow the colour theme; `Dropdown.css` re-written nested.
- **b88** `2865cae` — popup is one sheet with the control (attached, 1px overlap), seam mirrored
  through `data-placement`, entrance unrolls from the seam.
- **b89** `150f625` — one source for the popup values (`--input-popup-*` tokens) and for the
  field box (`Input.css`); `Dropdown.css` keeps only datalist-specific rules.
- **b90** `a2d1af7` — native picker no longer guesses its side.
- **b91** `5605022` — native picker mirrors from its REAL height
  (`getComputedStyle(select, "::picker(select)").height`); `select:not(:open)` rests on
  `--input-border-color` like every other control.
- **b92** — T3: **Article** (`--article-*` all derive from `--app-*`; glyph/link accents route
  through `--article-primary-ui`, fill only for `active-page`; shadows → `--app-shadow-*`),
  **Table** (`darkgoldenrod` + `white/black/grey/#925408/#f3f3f3` mixes → `--app-*`, row banding
  and hover as `color-mix(primary N%, transparent)`), **Message** (Semantic-UI pastels →
  `--app-status-*-fill` wash + `--app-status-*` border + `--app-text-color` ink, shadows app),
  **Tab** (three `rgba(255,255,255,*)` washes → `text 6% transparent`, `--app-shadow-soft`,
  `--app-border-color`), **Carousel** (media overlays kept, marked as the §4 allowlist).
  Proof (dev server HMR + measured computed styles, light ↔ dark): Article card bg
  `oklch(.99)`↔`oklch(.25)`, title ink `L .38`↔`.89`; Table header ink `L .25`↔`.97` with a
  mode-neutral `brand 30%` hairline; Message error/warning ink `L .38`↔`.89` with the solid border
  flipping `#b07c00`↔`#f5c53d`; Tab tokens resolve to `text 6%` / `border-color` / app shadow.
- **b93** — T4: `CyberpunkTheme.activate()` now pins `shell.dataset.mode = "dark"` +
  `shell.style.colorScheme = "dark"` (its palette is fixed-dark), and `deactivate()` clears both
  only when it still owns them; `npx vitest run packages/themes/cyberpunk → 6/6`. **Horizontal is a
  layout theme with no palette**, so it deliberately does NOT force a mode — forcing dark would
  paint a light layout dark. Proof: the cyberpunk test asserts `dataset.mode`/`colorScheme`;
  `npm run check` green.
- **b94** — T5: `packages/components/__tests__/colour-literals.test.ts` walks every source sheet
  under `packages/components` (no `dist`/`__tests__`), strips comments + `url()` + `var()`
  fallbacks, skips shadow/backdrop/lightbox declarations, and flags any remaining hex/rgb/hsl or
  named colour. Allowlist = Modal/Masonry/Carousel overlays + the CodeBlock paper/ink pair.
  `fab-menu` `color-mix(…, #000000)` → `var(--app-surface-deep)`. Proof:
  `npx vitest run packages/components/__tests__/colour-literals.test.ts → 1/1`; `npm run check`
  green.

## Next (cold start)

1. **T3 taste pass** — the palettes compile and flip, but the *taste* is not settled; the owner
   reviews each component and points at the colour to change (Article/Table/Message first).
2. **Leftover**: `packages/components/masonry/README.md` + `docs/framework/catalogue.json` still
   show the pre-b86 `background-image: var(--app-spinner-content)` snippet (the catalogue snippet
   is curated, not generated from source).
3. **Verify when a tab is visible**: the native picker's upward seam (`data-placement` from the
   real picker height) was only proved with the page backgrounded — re-check by opening a
   `<select>` near the viewport bottom.
