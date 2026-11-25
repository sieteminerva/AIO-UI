import type { iComponentManifest } from "@aio-ui/core";

/**
 * Teaching tiers.
 *
 * `category` says what a component *is* (layout / navigation / content / chrome);
 * `tier` says what it *costs* to use. The page groups by tier so the difficulty ramp is
 * visible, while the card keeps the category as classification.
 */
export const DEMO_TIERS = ["basic", "intermediate", "advanced"] as const;

export type DemoTier = (typeof DEMO_TIERS)[number];

export const TIER_LABELS: Record<DemoTier, string> = {
  basic: "Basic",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

/** One line per tier: the thing you must learn before the component works. */
export const TIER_COST: Record<DemoTier, string> = {
  basic: "payload saja — satu builder, satu elemen, tanpa config",
  intermediate: "butuh config atau handle kontrol (buka/tutup, state aktif)",
  advanced: "state, event, atau sub-modul yang hidup di dalam komponen",
};

/**
 * One Display variant.
 *
 * A variant changes the **payload** only: `build(name, payload)` has no third argument, and
 * the config a component sees comes from the registration. A row whose variants differ by
 * config needs its own registration, which is a different thing — not a variant.
 */
export interface iDemoVariant {
  /** Shown above the preview, e.g. `2 slide per view`. */
  label: string;
  payload: unknown;
}

/**
 * The demo table.
 *
 * One entry per component: where it loads from, what it needs, and how it is mounted.
 * Everything else in this example is derived from here — the registry, the loader map,
 * and the page itself. Adding a component means adding a row, not editing three files.
 *
 * `kind` exists because not every builder returns an element: `modal` returns control
 * handles (`open`/`close`/`element`) instead, which is a real API difference, not a bug.
 */
export interface iDemoEntry {
  /** Registry name, also the section id on the page. */
  name: string;
  /** Module specifier, resolved by the host loader map. */
  path: string;
  /** Stylesheet specifier; omitted when the component ships no CSS. */
  stylesheet?: string;
  category: "layout" | "navigation" | "content" | "chrome";
  /** How much wiring the component asks for; the page groups sections by this. */
  tier: DemoTier;
  kind: "element" | "modal";
  /**
   * The Display frame must act as the containing block: the component positions itself out
   * of flow (`fab`) or renders nothing until it is opened (`modal`), so a frame sized by its
   * content would be an empty strip. A display hint only — the builder receives nothing extra.
   */
  stage?: boolean;
  /** Payload handed to `build(name, payload)`. */
  payload: any;
  /** Config merged into the builder (selectors, callbacks, per-build options). */
  config?: Record<string, any>;
  /**
   * Extra Display variants. Declared, never derived: a row only adds one when it really has
   * a different configuration, so the Display panel cannot show a variant that does not exist.
   */
  variants?: iDemoVariant[];
  /** Set when the payload shape is a best guess rather than a verified contract. */
  note?: string;
}

const image = (label: string) => {
  const size = ["300x300", "600x480", "360x720", "1024x640", "800x600"];
  const C = ["4f3274", "607d31", "25b298", "8764b5", "1e3a5f", "d6ac23"];

  function shuffle(array: string[]) {
    let pool: string[] = [];
    let lastItem: string | null = null;

    // Jika stok warna habis, isi ulang dan kocok dengan algoritma Fisher-Yates
    if (pool.length === 0) {
      pool = [...array];
      for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
      }

      // Cegah warna pertama di kocokan baru sama dengan warna terakhir sebelumnya
      if (pool[pool.length - 1] === lastItem) {
        [pool[0], pool[pool.length - 1]] = [pool[pool.length - 1], pool[0]];
      }
    }

    lastItem = pool.pop()!;
    return lastItem;

  }

  return `https://placehold.co/${shuffle(size)}/${shuffle(C)}/fff?text=${encodeURIComponent(label)}`
};

export const DEMO: iDemoEntry[] = [
  {
    // First row is the output of `node scripts/new-component.mjs badge` — kept in the
    // table so the scaffold stays proven against the real registry, not just typechecked.
    name: "badge",
    path: "@aio-ui/badge",
    stylesheet: "@aio-ui/badge/Badge.css",
    category: "content",
    tier: "basic",
    kind: "element",
    payload: [
      { label: "Template", description: "Dihasilkan oleh scripts/new-component.mjs" },
      { label: "Konvensi", description: "ELEMENT_KEYS, selectors, prepare, template, initialize" },
    ],
    config: { emphasis: true },
    note: "scaffolded: node scripts/new-component.mjs badge",
  },
  {
    // An article heading block: one record, with the metadata line looped from an object.
    // `size` also picks the heading level — `huge` renders `<h1>`.
    name: "header",
    path: "@aio-ui/header",
    stylesheet: "@aio-ui/header/Header.css",
    category: "content",
    tier: "intermediate",
    kind: "element",
    payload: {
      title: "Merawat kaos katun agar tidak melar",
      subtitle: "Panduan singkat untuk menjaga bentuk dan warna kaos favorit.",
      icon: "user",
      metadata: {
        author: { textContent: "Oleh: Rina", className: "author" },
        date: { textContent: "12 Januari 2026", className: "date" },
      },
    },
    config: { useDivider: true, size: "huge", alignment: "left" },
  },
  {
    name: "accordion",
    path: "@aio-ui/accordion",
    stylesheet: "@aio-ui/accordion/Accordion.css",
    category: "content",
    tier: "basic",
    kind: "element",
    // Shape from `.archives/travel-trip/content.ts:308` — items are `title` + `description`,
    // and the payload is the item list directly (no `{ content }` envelope).
    payload: [
      { title: "Apakah ada batas minimal peserta?", description: "Tidak. Kami siap membantu rombongan kecil maupun besar." },
      { title: "Apakah bisa reschedule?", description: "Ya, jika operasional dibatalkan karena cuaca." },
    ],
    config: { appearance: "compact", autoClose: true, expanded: true },
    note: "config: { appearance: compact, autoClose: true, expanded: true } → one open row at a time",
  },
  {
    name: "carousel",
    path: "@aio-ui/carousel",
    stylesheet: "@aio-ui/carousel/Carousel.css",
    category: "content",
    tier: "advanced",
    kind: "element",
    // Shape from `content.ts:37` — slides are `title` + `description` + `image`, and the
    // payload is the slide array directly (no `{ content }` envelope).
    payload: [
      { title: "Eksplorasi Keindahan", description: "Perjalanan privat yang tenang.", image: image("Slide 1") },
      { title: "Pantai Pasir Putih", description: "Pemandangan sunset yang luar biasa.", image: image("Slide 2") },
      { title: "Aktivitas Menyenangkan", description: "Snorkeling untuk semua umur.", image: image("Slide 3") },
      { title: "Pulau Pramuka", description: "Penangkaran penyu dan mangrove.", image: image("Slide 4") },
    ],
    // Two slides per view, so the sliding path and the reduced dot count are exercised
    // instead of the default single-slide fade.
    config: { slidesPerView: 1, animation: "slide-left", showControl: true, showNavigation: true, vertical: false },
    note: "config: { slidesPerView: 2, animation: slide-left } → maxIndex = slides - perView",
  },
  {
    name: "code-block",
    path: "@aio-ui/code-block",
    stylesheet: "@aio-ui/code-block/CodeBlock.css",
    category: "content",
    tier: "basic",
    kind: "element",
    // Two blocks in one payload: the `{ blocks }` shape is what a docs page uses.
    payload: {
      blocks: [
        {
          code: ['const app = new AioApp({ container: "#app", source: { pages } });', "await app.render();"].join("\n"),
          label: "ts · mount",
          language: "ts",
        },
        { code: "npm run verify", label: "shell · gate" },
      ],
    },
  },
  {
    name: "tab",
    path: "@aio-ui/tab",
    stylesheet: "@aio-ui/tab/Tab.css",
    category: "layout",
    tier: "advanced",
    kind: "element",
    payload: {
      menu: ["Panel A", "Panel B"],
      body: [{ panel: "Isi panel A" }, { panel: "Isi panel B" }],
    },
    // The docs shell already shows the default look on every page, so the demo shows the
    // other one: folder tabs on a ruled edge.
    config: { menuPosition: "top", tabStyle: "folder" },
    note: "config: { tabStyle: \"folder\" } draws folder tabs on a ruled edge (top position only)",
  },
  {
    name: "section",
    path: "@aio-ui/section",
    stylesheet: "@aio-ui/section/Section.css",
    category: "layout",
    tier: "basic",
    kind: "element",
    // Shape from `.archives/travel-trip/content.ts:296` — one row. The payload is the column
    // list directly (the registry hands `node.content`); each column has its own block list.
    // Root id/className are host-level, so they live in config, never in the payload.
    payload: [
      {
        className: "column half",
        blocks: [
          {
            eyebrow: "Private trip",
            title: "Dua kolom, satu baris.",
            description:
              "Kolom teks di kiri, media di kanan. Di bawah 768px grid runtuh jadi satu kolom dan gambar mengambil lebar penuh.",
            actions: [{ label: "Lihat galeri", href: "#gallery" }, { label: "Tanya dulu" }],
          },
        ],
      },
      {
        className: "column half",
        blocks: [{ imageUrl: image("Section media"), alt: "Ilustrasi kolom media" }],
      },
    ],
    config: { id: "demo-section", className: "demo" },
    note: "2 columns; image spans the full row under 768px",
  },
  {
    name: "footer",
    path: "@aio-ui/footer",
    stylesheet: "@aio-ui/footer/Footer.css",
    category: "layout",
    tier: "basic",
    kind: "element",
    // Row 1 = `columns` (any count), row 2 = copyright. Columns are free-form:
    // the first carries title + description, the second only actions.
    payload: {
      id: "contact-section",
      company: "Agen Wisata SeribuTrip",
      columns: [
        {
          title: "Agen Wisata SeribuTrip",
          description: "Operator lokal resmi yang mengedepankan kenyamanan dan ketepatan.",
        },
        {
          title: "Kontak & Informasi",
          actions: [
            { label: "email", href: "halo@seributrip.id" },
            { label: "phone", href: "+628123456789" },
            { label: "address", href: "Dermaga 16 Marina Ancol, Jakarta" },
          ],
        },
      ],
    },
    note: "row 1 = columns[] (dynamic), row 2 = copyright",
  },
  {
    name: "menu",
    path: "@aio-ui/menu",
    stylesheet: "@aio-ui/menu/Menu.css",
    category: "navigation",
    tier: "intermediate",
    kind: "element",
    // Flat list: the first entry is the brand, an entry with `className: "button"` becomes an
    // action, the rest are navigation links. The hamburger is rendered by the builder.
    payload: {
      navigations: [
        { href: "#kitchen", label: "@aio demo" },
        { href: "#kitchen/menu", label: "Kitchen", title: "Kitchen" },
        { href: "#product", label: "Product", title: "Product" },
        { href: "#form", label: "Pesan", className: "button" },
      ],
    },
    config: { type: "top" },
    note: "default onNavigate swallows every click; the navigations id is forced to primary-navigations, so this preview duplicates the shell's id",
  },
  {
    name: "fab-menu",
    path: "@aio-ui/fab-menu",
    stylesheet: "@aio-ui/fab-menu/FabMenu.css",
    category: "navigation",
    tier: "intermediate",
    kind: "element",
    // `FabMenu.css` is `position: fixed`; in the frame it is contained, so it needs a stage.
    stage: true,
    // `FabMenu.prepare` reads `content.actions` and `content.title` — no wrapper.
    payload: {
      title: "Actions",
      actions: [{ label: "Satu" }, { label: "Dua" }, { label: "Tiga" }],
    },
  },
  {
    name: "mode-switcher",
    path: "@aio-ui/mode-switcher",
    stylesheet: "@aio-ui/mode-switcher/ModeSwitcher.css",
    category: "chrome",
    tier: "intermediate",
    kind: "element",
    payload: {},
  },
  {
    name: "pricing-card",
    path: "@aio-ui/pricing-card",
    stylesheet: "@aio-ui/pricing-card/PricingCard.css",
    category: "content",
    tier: "basic",
    kind: "element",
    // Shape from `content.ts:531` — an **array** of cards: `header`, `body[]`, `price`.
    // Three plans, not two: the featured middle card is scaled up, and with only two cards
    // the row had no middle for it to be the middle of.
    payload: [
      {
        header: "Standard",
        body: [
          { title: "Kapal Kayu Tradisional" },
          { title: "Snorkeling Session" },
          { title: "Dokumentasi Drone", className: "disabled" },
          { title: "Mulai dari Rp 450.000 / pax", className: "price-tag" },
        ],
        price: 450000,
        action: { label: "Pilih" },
      },
      {
        header: "Medium",
        className: "is-featured",
        body: [
          { title: "Speedboat Kilat (Ancol)" },
          { title: "Snorkeling & Island Tour" },
          { title: "Dokumentasi Drone" },
          { title: "Mulai dari Rp 750.000 / pax", className: "price-tag" },
        ],
        price: 750000,
        action: { label: "Pilih" },
      },
      {
        header: "Premium",
        body: [
          { title: "Private Speedboat" },
          { title: "Island Tour + Makan Siang" },
          { title: "Dokumentasi Drone & Foto" },
          { title: "Mulai dari Rp 1.250.000 / pax", className: "price-tag" },
        ],
        price: 1250000,
        action: { label: "Pilih" },
      },
    ],
  },
  {
    name: "modal",
    path: "@aio-ui/modal",
    stylesheet: "@aio-ui/modal/Modal.css",
    category: "chrome",
    tier: "intermediate",
    kind: "modal",
    stage: true,
    // `destroyOnClose: true` makes a modal single-use; a mounted demo wants reuse.
    payload: "Isi modal dari payload demo.",
    config: {
      id: "demo-modal",
      title: "Modal demo",
      destroyOnClose: false,
      onReady: (controls: any) => {
        (globalThis as any).__demoModal = controls;
      },
    },
    note: "config: { id, title, destroyOnClose: false = reuse, onReady(controls) }",
  },
  {
    name: "markdown",
    path: "@aio-ui/markdown",
    stylesheet: "@aio-ui/markdown/Markdown.css",
    category: "content",
    tier: "basic",
    kind: "element",
    // The whole point of this builder: a string in, a document out, no `innerHTML` anywhere.
    payload: {
      source: [
        "# Catatan rilis",
        "",
        "Satu paragraf dengan **tebal**, *miring*, `kode` dan [tautan](#kitchen/markdown).",
        "",
        "- daftar tanpa nomor",
        "- baris kedua",
        "",
        "```ts",
        'const doc = build("markdown", { source });',
        "```",
        "",
        "> Kutipan tetap terbaca sebagai kutipan.",
      ].join("\n"),
    },
    variants: [
      {
        label: "catatan rilis",
        payload: {
          source: [
            "# Catatan rilis",
            "",
            "Satu paragraf dengan **tebal**, *miring*, `kode` dan [tautan](#kitchen/markdown).",
            "",
            "- daftar tanpa nomor",
            "- baris kedua",
            "",
            "```ts",
            'const doc = build("markdown", { source });',
            "```",
            "",
            "> Kutipan tetap terbaca sebagai kutipan.",
          ].join("\n"),
        },
      },
      {
        label: "GFM table",
        payload: {
          source: ["| Kolom | Nilai |", "| --- | --- |", "| payload | string |", "| hasil | `article.markdown` |"].join("\n"),
        },
      },
    ],
    note: "a bare string is accepted as the source; anything else renders nothing",
  },
  {
    name: "message",
    path: "@aio-ui/message",
    stylesheet: "@aio-ui/message/Message.css",
    category: "chrome",
    tier: "basic",
    kind: "element",
    payload: { header: "Berhasil", message: "Pesanan dikirim.", type: "success" },
    // `element` is a DOM id: the toast prepends into that node, so the frame can hold it.
    // `persist: true` also renders the close button and skips the auto-close timer.
    config: { element: "panel-display", persist: true, duration: 0 },
    variants: [
      { label: "success", payload: { header: "Berhasil", message: "Pesanan dikirim.", type: "success" } },
      { label: "error", payload: { header: "Gagal", message: "Koneksi terputus.", type: "error" } },
      { label: "warning", payload: { header: "Perhatian", message: "Kuota hampir habis.", type: "warning" } },
    ],
    note: "config: { element: <dom id>, persist: true } — without `element` the toast mounts on document.body",
  },
  {
    name: "table",
    path: "@aio-ui/table",
    stylesheet: "@aio-ui/table/Table.css",
    category: "content",
    tier: "advanced",
    kind: "element",
    // `header` is the column list, `body` a row array per record — a cell may be a plain
    // value or `{ text, options }` (an object without `text` prints as `[object Object]`).
    payload: {
      header: ["Produk", "Qty", "Harga"],
      body: [
        ["Kopi", 2, 45000],
        ["Teh", { text: 1, options: { class: "muted" } }, 20000],
        ["Roti", 3, 15000],
      ],
      footer: null,
    },
    config: { sortable: true, pageSize: 5 },
    note: "config: { sortable, pageSize }; `editable` is on by default, so every row carries edit/remove actions",
  },
  {
    name: "masonry",
    path: "@aio-ui/masonry",
    stylesheet: "@aio-ui/masonry/Masonry.css",
    category: "layout",
    tier: "advanced",
    kind: "element",
    // The array lives under `items` — the same word `iNormalizedColumn` uses for a column's
    // block list.
    payload: {
      id: "demo-masonry",
      className: "section masonry gallery",
      items: [
        { image: image("Branding 1"), category: "Branding", title: "Identitas", description: "Logotype dan panduan warna." },
        { image: image("Web 1"), category: "Web", title: "Landing page", description: "Satu halaman, satu tujuan." },
        { image: image("Branding 2"), category: "Branding", title: "Kemasan", description: "Cetak dan digital." },
        { image: image("Web 2"), category: "Web", title: "Dashboard", description: "Tabel, filter, ekspor." },
        { image: image("Motion 1"), category: "Motion", title: "Intro", description: "Enam detik, tanpa audio." },
        { image: image("Motion 2"), category: "Motion", title: "Loop", description: "Latar belakang bergerak." },
      ],
    },
    config: { column: 2, maxDisplayed: 4 },
    note: "config: { column: 2, maxDisplayed: 4 } — the filter list is derived from `category`, never declared",
  },
];

/**
 * Every entry shares one manifest shape: how to load the component, nothing else.
 *
 * The payload is the build call's business — it arrives as a node
 * (`{ builder, content, config }`), and the registry reduces that node to the builder's
 * schema. A manifest that also carried `config` or `schema` would be a second authoring
 * mode, and the two would disagree.
 */
export function manifestFor(entry: iDemoEntry) {
  return (): iComponentManifest => ({
    path: entry.path,
    stylesheet: entry.stylesheet,
  });
}
