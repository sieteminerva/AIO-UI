Implement a new `rating` sub-module adapter (`type: "rating"`) inside `@aio-ui/input` (`packages/components/input`) and showcase it in `examples/demo`, following the exact modular architecture, subpath exports, token layering, and graceful-degradation conventions used by `InputPicker` (`picker`).

### Context & Design Intent

`type: "rating"` is primarily a **display / readonly visual indicator** (behaving like a `readonly` range control by default, unless explicitly made interactive) that renders either repeated icon ratings (`star`, `heart`, `custom`) or continuous `min`–`max` score bars (`bar`, `rounded`). Rather than inventing redundant properties or reimplementing slider/form mechanics in JavaScript, it reuses existing `iBasicInputNode` & `iBasicInputConfig` properties (`value`, `step`, `range`, `readonly`, `disabled`, `icon`, `content`, `position`, `display`) alongside a minimal rating-specific subset, backed by a native `<input type="range">` engine and an optional native `<output>` element. This keeps markup shallow, preserves native accessibility and form serialization, and ensures clean fallback when the `rating` module is not loaded (`modules: []`).

### 1. Architecture & Sub-module Wiring

- Create `InputRating` folder inside `packages/components/input/` (matching `InputPicker`: adapter implementation, `module.ts` exporting `ratingInputModule`, and `InputRating.css`).
- Export subpaths in `packages/components/input/package.json` (and update `edges` / `exports`):
  - `./rating`
  - `./rating.css`
  - `./rating/module`
- Register `ratingInputModule` in `INPUT_MODULE_DEFINITIONS` (`packages/components/input/modules.ts`) and `INPUT_MODULE_MANIFEST` (root barrel).
- Register `"rating"` in `packages/components/input/Missing.ts` so when `modules: []` is passed, it degrades gracefully to a native `<input type="range">` (respecting `readonly` / `disabled`, `min`, `max`, `step`, `value`), emitting a single `warn` + `moduleMissing` event (must pass `__tests__/Modules.test.ts` and `__tests__/Missing.test.ts`).

### 2. Payload & Config Contract (Reuse `iBasicInputNode` & `iBasicInputConfig`)

Reuse existing properties on `iBasicInputNode` and `iBasicInputConfig` without duplicating them:

- **From `iBasicInputNode`**:
  - `value` (current score), `step` (default `1`, supports fractional steps like `0.5` or `0.1`), `range` (e.g., `"0,5"` or `"0..10"` parsed to `min`/`max`, defaulting to `0` and `5`), `readonly` (defaults to `true` for `type: "rating"` since it is a display type, unless explicitly set `false`), `disabled`, `onValueChange`, `position` (controls placement of `<output>` relative to the track when applicable).
- **From `iBasicInputConfig`**:
  - `icon` / `content`: custom SVG markup, icon class, or data-URI when `shape === "custom"`.
  - `display`: `"block" | "inline"` (controls wrapper layout).
  - `shape?: "star" | "heart" | "bar" | "rounded" | "custom"` (default `"star"`, stamped on wrapper as `data-shape`).
  - `repeat?: boolean` (default `true` for `"star" | "heart" | "custom"`, `false` for `"bar" | "rounded"`, stamped on wrapper as `data-repeat`).
  - `color?: "default" | string` (default `"default"` which uses `--rating-accent-color`; when a custom CSS color string is provided, overrides `--rating-accent-color` inline on the wrapper).
  - `output?: string | null` (default `null`; when provided, renders a native `<output for="<inputId>">` formatted using the string template—e.g. `"{value} / {max}"` or `"{value}"`—and keeps it synced with the input value).

### 3. Shallow Markup & Native `<input type="range">` Engine

- Render a shallow wrapper (`.rating`) containing:
  1. `.track` (CSS Grid `grid-area: 1 / 1` stack):
     - Native `<input type="range">` (`opacity: 0; z-index: 1;` — NEVER `visibility: hidden` or `display: none`; `pointer-events: none; cursor: default;` when `readonly` or `disabled`).
     - Visual `.shapes` layer (`pointer-events: none; aria-hidden="true"`).
  2. Native `<output for="<inputId>">` (only rendered when `config.output` is non-null).
- Sync `--rating-value` (and `<output>` text) on initialization and on the `input` event (when `readonly: false`), disposing listeners cleanly on teardown.

### 4. CSS Tokens & Styling (`InputRating/InputRating.css`)

- Declare all `--rating-*` tokens **once** on `:root, [data-theme]` derived from `--input-*` tokens (never redeclare on `.field`):
  - `--rating-accent-color: var(--input-primary-color)`
  - `--rating-track-color: var(--input-border-color)`
  - `--rating-size: var(--input-icon-size)`
  - `--rating-gap: 0.25rem`
  - `--rating-duration: var(--input-popup-duration)`
- Support continuous fill (`[data-repeat="false"]` for `bar` and `rounded` pill track) and repeated symbol fill (`[data-repeat="true"]` for `star`, `heart`, `custom` supporting fractional `step` fills via percentage gradient/mask), plus `:focus-visible` indicator when interactive.

### 5. Demo Showcase (`examples/demo`), Docs & Verification Gates

- Wire `@aio-ui/input/rating`, `@aio-ui/input/rating.css`, and `@aio-ui/input/rating/module` in `examples/demo` and add a showcase section in the input kitchen demo demonstrating `star`, `heart`, `bar`, `rounded`, `custom`, `config.color`, and `config.output` formatting.
- Document `type: "rating"` in `packages/components/input/README.md`.
- Add unit tests for `type: "rating"` (default `readonly`, `range` parsing, `repeat` defaults, `config.color`, `config.output` formatting, and `Missing.ts` fallback).
- Run `npm run check:edges -- --apply` if needed, then verify everything passes cleanly with `npm run check` and `npm run verify`.
