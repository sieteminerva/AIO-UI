# TASK: Component polish — what is left

## 0. Restructuring Package, Flow yang saya mau, kamu rumuskan cyclenya.

**Detail + fase P0–P5: `docs/framework/TASK-restructure.md`** (realita terukur, target graph, gate per
fase). Ringkasnya: P0 edge manifest, P1 DOMRenderer folder + kit, P2 `app` ke `core` + hapus
`frameworks` (v0.2.4), P3 styles jadi dependency core, P4 bundle `AioUI` satu file, P5 (defer).

- [ ] komponen adalah modul bebas (agnostic), dia hanya tergantung oleh `base`. itu dikarenakan `{component}` extending `base`. tapi ada beban lain yaitu skeleton. jadi sementara, ketika saya npm install component,
      maka yang diharapkan `base` langsung terinstall, ketika base diinstall skeleton pun terbawa secara otomatis. atau kalau skeleton mau tetap dibawah component pun tidak masalah, yang penting dia otomatis terbawa (terinstall), karena saat ini tuh menimbulkan error (package .tgz yang sudah dipush ke github)

- [ ] Masalah `DOMRenderer` ini juga module bebas, karena ini kan tugasnya building element. design awal dia tidak membutuhkan siapapun, tapi karena ada fn yg bisa dishare module lain akhirnya diextract ke utilities.
      sebenarnya saya juga tidak masalah ketika domrenderer di install dia sekaligus menginstall utilities.
      tapi alangkah lebih baik kalau punya domrenderer punya kit exclusivenya sendiri. jadi meskipun itu duplicate saya ga masalah.

- [ ] ini breaking changes, menurut kamu gimana kalau `app` itu dimasukkan ke `core`, dulu sudah saya perintahkan ke diri kamu disesi yang lain, tapi entah kenapa kok masih terpisah. jadi barrel index untuk `@aio-ui/frameworks` ga perlu ada cukup `@aio-ui/core`.
      Nah ketika core diinstall yang termasuk
  - App / AioApp
  - DomRenderer
  - Base
  - ComponentRegistry
  - TemplateRegistry
  - Dan file/module yang berhub dengan registry
  - Types yang terkait.
  - styles

- [ ] untuk `modules/` saya sementara ga ada masalah
- [ ] saya juga butuh wrapper untuk namespace, jadi ada versi bundle 1 file juga, jadi bisa dipanggil dengan `AioUI.DOMRenderer`, `AioUI.FormBuilder`, etc. di `globalThis` biar ketika link cdn cuma pakai 2 link saja seperti masa-masa yang lalu `aio-ui.min.js`, `aio-ui.min.css` dan versi tanpa min nya.

## 1. Coba build packages sekarang, tapi sebelumnya ada yang harus diperbaiki:

_(landed: CSS subpath declarations + `skeleton` install edge; `npm run build:pkgs` green — 39 packages)_

- [x] gimana caranya component {file}.css ketika di import dalam vite project tidak type error misalnya: `Cannot find module or type declarations for side-effect import of '@aio-ui/accordion/Accordion.css'.` mungkin tinggal `declare module xStyle {...}`
      → `build-pack.mjs` now writes a `X.css.d.ts` next to every sheet and exports `{ types, default }`; proved with a plain consumer (no `vite/client`) importing the packed tarball.
- [x] `packages/components/skeleton` sebaiknya bukan depedency nya masing-masing component, tetapi `base`. jadi kalau install base sekaligus terinstall, jadi ketika npm install per component.tgz tidak menimbulkan error
      → `@aio-ui/base` lists it under `dependencies` (install-only edge, documented in `BOUNDARIES.md`); guarded by `examples/demo/src/__tests__/packaging.test.ts`.

## 2. `@aio-ui/pricingcard`

- [ ] **Config (`iPricingCardConfig`)**:
  - `layout?: "grid" | "horizontal" | "spotlight" | "matrix"` (sinkronkan ke `data-layout`).
  - `appearance?: "default" | "elevated" | "highlighted" | "bento" | "split-header"` (sinkronkan ke `data-appearance`).
  - `animation?: boolean | "lift" | "glow" | "scale" | "stagger" | "flip"` (sinkronkan ke `data-animation`).
- [ ] **CSS (`PricingCard.css`)**:
  - Implementasi variasi radikal `data-layout="horizontal"` (banner row) dan `data-appearance="bento"` / `"split-header"`.
  - Implementasi 3D card flip (`perspective` + `backface-visibility: hidden` + `grid-area: stack` anti-flicker) untuk `data-animation="flip"`.

## 3. `@aio-ui/code-block`

- [ ] whitespacenya ter-render garis harus diperbaiki, sepertinya block nya memiliki border;

## 4. `@aio-input/Rating`

```ts
export interface iRatingConfig extends iBuilderConfig<RatingElementType> {
  min?: number; // default 0
  max?: number; // default 5
  step?: number; // misal 1, 0.5, atau 0.1 untuk display skor pecahan
  shape?: "star" | "heart" | "bar" | "rounded" | "custom";
  customSvg?: string; // dipakai saat shape === "custom"
  readonly?: boolean;
  showValue?: boolean; // opsional: menampilkan angka skor di sampingnya (mis. "4.5 / 5")
}
```

- [ ] masih kosong implementasi, tujuan awal itu bisa pakai svg element seperti "star" | "heart" | "bar" | "rounded" | "custom"
