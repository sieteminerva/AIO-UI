# TASK — colour tokens before v0.2.6

**Status:** in progress. Priority: **colouring is the top blocker before the v0.2.6 release.**
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
| T0 | This doc | `docs/framework/TASK-color-tokens.md` | done |
| T1 | Root `light-dark()` rewrite + spinner mask + skeleton derive | `packages/styles/src/variables.css`, `packages/components/{input/input.css,form/Form.css}` spinner, `examples/demo/src/style.css` spinner | **not started** |
| T2 | Form path text/border tokens | `packages/components/input/{input.css,InputControls/InputControls.css,Dropdown/Dropdown.css,FileUploader/FileUploader.css}`, `form/Form.css` | **partly** (input resting border done) |
| T3 | Hardcoded-palette components | `article/Article.css`, `table/Table.css`, `message/Message.css`, `carousel/Carousel.css`, `tab/Tab.css` | **not started** |
| T4 | Theme packages set the mode | `packages/themes/{cyberpunk,horizontal}/src/*.ts` (`activate()` → `shell.dataset.mode = "dark"`, `shell.style.colorScheme = "dark"`) | **not started** |
| T5 | CSS lint test | new `packages/components/__tests__/colour-literals.test.ts` (no raw literal except the allowlist above) | **not started** |

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
