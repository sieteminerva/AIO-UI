# Mekanisme — Rajutan / generator (teruji b55–b57)

Dokumen ini mencatat **apa yang sudah berjalan dan bagaimana persisnya**, supaya sesi berikutnya
tidak menebak. Semua angka di sini adalah hasil pengukuran, bukan klaim.

---

## 1. Topologi

```
browser: examples/rajutan (Vite, hash router)
  │  POST text/plain JSON                    membaca @engine/** langsung (alias)
  ▼
Apps Script Web App (orchestrator/apps-script): Code.js → AI.js | Sheet.js | Deploy.js
  │                                            │            │           │
  ▼                                            ▼            ▼           ▼
Gemini / DeepSeek (API key di Script Props)   Drive copy   GitHub API (Contents + Pages)
                                               │
engine murni (orchestrator/src): answers → prompt → retry → ai(assemble) → plan → emit → runtime
```

- **Engine murni** (`orchestrator/src`): tanpa `node:*`, `fetch`, filesystem. Semua I/O disuntik.
- Aplikasi memakai alias `@engine` → `orchestrator/src`; satu sumber untuk app dan test.
- Test engine: `npx vitest run orchestrator` → **139 pass / 1 skip**.

## 2. Kontrak request/response Web App

- Body **wajib** `Content-Type: text/plain` (Apps Script tidak bisa menjawab CORS preflight).
- Selalu `{ "status": "success" | "error", "meta"?, "data" }` (`Code.js:reply`).
- Aksi: `ask` · `sheet` · `deploy`. Aksi asing → `{"status":"error","data":{"message":"Unknown action …"}}`.

| Aksi     | Payload                                       | `data` balasan                                   |
| -------- | --------------------------------------------- | ------------------------------------------------ |
| `ask`    | `{ prompt, provider?, model? }`               | `{ text, provider, model, ms }`                  |
| `sheet`  | `{ name?, templateId? }`                      | `{ sheet: { id, url, title } }`                  |
| `deploy` | `{ name, files: { "index.html", "app.js" } }` | `{ repo: { title, url }, live: { title, url } }` |

`authorized(payload)` hanya memeriksa `CLIENT_TOKEN` **bila property itu diisi**. Sekarang kosong →
`/exec` **terbuka**. Belum ada verifikasi `idToken`.

## 3. `ask` (AI.js)

- Provider: `payload.provider` → `AI_PROVIDER` → `gemini`. Key: `GEMINI_API_KEY` / `DEEPSEEK_API_KEY`
  (Script Properties). `doGet` mengembalikan daftar provider yang punya key.
- `temperature: 0.2` (turun dari 0.7 — kesalahan JSON muncul di suhu tinggi), DeepSeek
  `max_tokens: 8192`, `response_format: json_object`.
- Gemini default `gemini-3.8-flash`; **503 "high demand"** berulang = gangguan sisi provider, bukan bug.
- Gejala kegagalan yang nyata: JSON **rusak** (kurung berlebih / teks setelah objek sebelum
  `"notes"`), bukan terpotong → engine membacanya `INVALID_SHAPE` lalu minta ulang.

## 4. `sheet` (Sheet.js)

- Menyalin `TEMPLATE_SHEET_ID` (Drive `makeCopy`), opsional ke `SHEET_FOLDER_ID`.
- Nama disanitasi (`safeName`) → slug repo/app tetap sejalan.
- Dipanggil **setelah** preset sah, supaya model gagal tidak meninggalkan file yatim.

## 5. `deploy` (Deploy.js)

- Commit `index.html` + `app.js` via Contents API, lalu aktifkan Pages sekali (`POST /pages`),
  balasan `{ repo, live }`.
- Dua mode, satu kode:
  - **repo tetap** — `GITHUB_SITE_REPO` (menerima nama **atau** URL `https://github.com/o/r.git`);
    token cukup **Contents: write + Pages: write**, tidak perlu Administration. Setiap site
    menimpa repo itu. Dipakai saat ini: `sieteminerva/test_site_rajutan`.
  - **repo per site** — `GITHUB_SITE_REPO` kosong: nama repo = slug preset, repo dibuat bila belum
    ada (**butuh Administration: write**). Belum diuji.
- `GITHUB_OWNER` menimpa owner hasil parsing; tanpa itu dipakai `GET /user`.

## 6. Rantai job di klien (`examples/rajutan/src/lib`)

```
runJob(answers, provider?)
  answersToBase(answers, { engine, generatedAt })        → base (§5) atau issues
  retryAsync(ask(composePrompt({…}, issues)), 2)         → content + issues verbatim
  assemblePreset(content, base)                          → iWebPreset
  copySheet(preset.id)                                   → data.sheet
  buildApp(preset)                                       → { url: blob:, files } → data.live (sementara)
  deploySite(preset.id, files)                           → data.repo + data.live (hosted)
  envelope { status, meta, data }
```

- Urutan itu disengaja: model → preset → efek samping. Efek samping gagal **tidak** menggagalkan
  job; status menjadi `"partial"` dan `message` menyebut apa yang kurang.
- `#/result` membaca `buildStore.response` di `onCreated` (tree dibangun sekali saat import).
- Tiga aset yang dirender: **Situs Anda Live**, **Google Sheets**, **Repositori GitHub** + 5 baris
  preset (ID, Model, Tema, Engine, Halaman).

## 7. Emisi situs (`buildApp`)

1. `plan(preset)` → paket/kapabilitas; `issues` tidak kosong = berhenti (jangan render situs cacat).
2. `emitPlan(plan, createCdnResolver({ base, layout }))` → links, importMap, table, bindings,
   moduleRefs, `missing` (harus kosong).
3. `emitRuntime({ preset, plan, site })` → `index.html` + `app.js`.
4. Pratinjau sesi: `app.js` di-inline ke dokumen `blob:` (blob tidak bisa resolve `./app.js`).

- **Layout diambil dari tag CDN** (`<base>layout.json`), bukan `orchestrator/layout.json` repo:
  repo = 37 paket (pohon yang disiapkan), tag `v0.2.4` = 39 paket (yang benar-benar disajikan).
  Memakai yang repo membuat `@aio-ui/utilities/Metadata` 404 (prefix tidak bisa menambah `.js`).
- Base CDN: `https://cdn.jsdelivr.net/gh/sieteminerva/AIO-UI@v0.2.4/`.

### Bentuk `app.js` yang dihasilkan

- `const PRESET = {…}` (seluruh preset, termasuk `data[]`).
- `assets.modules` = tabel specifier → `() => import(url)`; `assets.styles` kosong (CSS ada di
  `index.html`).
- `registry.register("<word>", …)` per binding; `form` diberi `export: "FormBuilder"` + `modules`.
- `pageDefinitions` = `{ route, requires }` per halaman (`pageRequires()` dari `builder` di node).
- `mount()` menandai node ber-`builder` sebagai `isRoot: true` (tanpa div pembungkus); hook
  `onCreated` tetap mendapat host.
- **Preload sekali** sebelum `render()` (menutup race `No modules configured`).
- Listener klik memetakan link konten ber-path (`/portofolio`) ke hash (`#portofolio`) — app memakai
  `HashRouter`; tanpa ini klik meninggalkan dokumen (`#blocked`).

## 8. Operasional (yang sering bikin salah)

| Hal          | Fakta                                                                                 |
| ------------ | ------------------------------------------------------------------------------------- |
| `clasp push` | **bukan** deploy. Deployment tetap di versi lamanya.                                  |
| Rilis kode   | `clasp version "…"` → `clasp deployments` (ambil id) → `clasp update-deployment <id>` |
| `/exec`      | Test deployment `AKfycbwPu…` (sekarang `@4`). URL tidak berubah saat update.          |
| `/dev`       | **tidak** bisa dipanggil browser (tanpa header CORS, butuh sesi Google)               |
| Pages        | build pertama perlu ~1 menit; CDN meng-cache URL telanjang ±10 menit (`?v=` menembus) |

## 9. Konfigurasi

**Script Properties** (server): `AI_PROVIDER`, `AI_MODEL`, `GEMINI_API_KEY`, `DEEPSEEK_API_KEY`,
`TEMPLATE_SHEET_ID`, `SHEET_FOLDER_ID`, `CLIENT_TOKEN` (belum dipakai), `GITHUB_TOKEN`,
`GITHUB_OWNER`, `GITHUB_SITE_REPO`.

**`.env.local` app** (git-ignored): `VITE_ORCHESTRATOR_URL` (`/exec`), `VITE_ORCHESTRATOR_DEV_URL`
(cadangan), `VITE_AI_PROVIDER`, plus key server-side untuk skrip `temp/` (`GEMINI_API_KEY`,
`DEEPSEEK_API_KEY`, `GITHUB_TOKEN`). **Jangan** pernah memberi prefix `VITE_` pada sebuah key.

## 10. Bukti yang sudah ada

- Job nyata (deepseek) → `tenun-lestari` (store, 5 route) & `ruang-karya-sri` (profile, 4 route).
- `runJob` tanpa jawaban → `status:"error"`, 4 issue gate (`MISSING_FIELD@confirmation`,
  `UNKNOWN_MODEL@web-type`, `MISSING_FIELD@web-name`, `MISSING_FIELD@contact-email`).
- Sheet nyata: `uji-b56`, `kriya-b57` (link tampil di `#/result`).
- Emisi: `kriya-nusantara` boot dari import map CDN (hero + 3 section), navigasi `#portofolio` OK.
- `RENDER_BUILDER` ke `#canvas` membangun `article` (1 anak, `data-loaded=true`).
- Hosting: `https://sieteminerva.github.io/test_site_rajutan/` → 200, `app.js` 200, judul `Kriya B57`
  dari satu job model (1 panggilan, tanpa retry), `#/result` menampilkan 3 aset.

## 11. Utang / risiko terbuka

1. `/exec` **tanpa autentikasi** — siapa pun yang punya URL bisa memicu biaya model + salinan Drive.
2. Mode **repo per site** belum diuji (butuh token Administration).
3. `data[].endpoint` belum pernah terisi → `HttpService` belum pernah benar-benar dipakai.
4. Token GitHub sempat terlihat di transkrip → **rotate** setelah selesai.
5. Gemini 503 intermiten; fallback manual ke `deepseek`.
6. `layout.json` repo ≠ tag CDN (lihat §7) → generator perlu meregenerasi layout di workflow rilis.
7. Sisa berkas tes di Drive (`uji-b56`, `kriya-b57`, `rajutan-probe-b56`) dan `temp/` yang bisa dihapus.

---

# Proposal — standarisasi data CMS → halaman @aio-ui

## Masalah

Sekarang ada dua sumber bentuk data yang **belum punya kontrak**:

1. **Struktur halaman** — `preset.pages[].content`: pohon node `{ "div#x": {…} }` + `builder`.
2. **Data tabel** — `preset.data[]` (`{ id, sheet, endpoint }`) yang belum pernah terisi.

Pertanyaan yang harus dijawab lebih dulu (dan yang Anda angkat): **apakah baris tabel ikut ditulis
ke struktur halaman, atau dirujuk?** Lalu bagaimana komponen yang punya data **milik sendiri**
(`carousel` di hero) bercampur dengan tabel CMS.

## Keputusan yang saya usulkan (inti)

**Struktur tetap milik preset; data selalu dirujuk.** Alasannya: satu halaman bisa memakai tabel yang
sama di dua tempat, dan editor CMS tidak boleh bisa merusak struktur.

```jsonc
// 1) Kontrak data — satu entry per tabel logis
"data": [
  { "id": "produk",   "sheet": "produk",   "endpoint": "…/exec", "columns": ["nama","harga","foto"] },
  { "id": "hero",     "sheet": "hero",     "endpoint": "…/exec", "inline": true }
]
```

```jsonc
// 2) Node halaman — config tidak memuat data; data dirujuk
{
  "section#hero": {
    "content": {
      "div.carousel": {
        "builder": "carousel",
        "config": { "autoplay": 4000, "ratio": "16/9" }, // milik komponen
        "dataRef": "hero", // milik CMS
      },
    },
  },
}
```

Aturan resolusi (satu arah, tanpa sihir):

1. `dataRef` ada → runtime mengambil baris dari `data[]` yang id-nya cocok, hasilnya masuk sebagai
   `content: { data: [...] }` ke builder.
2. Tidak ada `dataRef` → `config.content` apa adanya (data ditulis di preset). Ini yang dipakai
   sekarang, jadi **kompatibel mundur**.
3. `dataRef` menunjuk id yang tidak ada = **issue fatal**, bukan halaman kosong.

Konsekuensi lain: `carousel` di hero **tidak** istimewa — ia komponen yang kebetulan memakai
`dataRef`. Tabel CMS yang sama bisa dipakai `table`, `article`, atau `carousel` tanpa duplikasi.

## Kontrak tabel (Google Sheets)

Satu sheet = satu tabel. Baris 1 = header, dan kolom wajib:

| Kolom        | Wajib | Arti                                                |
| ------------ | ----- | --------------------------------------------------- |
| `_id`        | ya    | kunci stabil; dipakai untuk edit/delete dan relasi  |
| `_order`     | tidak | urutan tampil (angka; kosong = urut baris)          |
| `_published` | tidak | `TRUE`/kosong → tampil; `FALSE` → disembunyikan     |
| `_slug`      | tidak | hanya untuk tabel ber-halaman detail (article/blog) |

Kolom lain = field komponen, **id dashed-case** sama dengan id form/input (§ kontrak jawaban wizard).

## Tahapan

| #   | Tahap                                                                                                                    | Hasil                                              | Gate                                                                                 |
| --- | ------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------- | ------------------------------------------------------------------------------------ |
| P0  | **Inventaris CMS** — baca `docs/generator/GoogleSheets CMS/` + template sheet nyata                                      | daftar tabel + kolom yang sudah ada, tidak menebak | satu tabel per komponen yang dipakai (`carousel`, `table`, `article`) terdokumentasi |
| P1  | **Tipe kontrak** — `PresetDataSource` + `dataRef` di `types.ts`, validasi di `plan()`                                    | `dataRef` tak dikenal → issue `MISSING_DATA_REF`   | unit test: node ber-`dataRef` tanpa entry = issue                                    |
| P2  | **Runtime** — `runtime.ts` mengisi `dataRef` sebelum `render()` (HttpService per entry, `_published`/`_order` dihormati) | halaman merender baris nyata                       | satu preset dengan `carousel` dari sheet tampil di `#canvas`                         |
| P3  | **Prompt** — model boleh memilih `dataRef` dari daftar `data[]` yang server berikan, **tidak** boleh mengarang kolom     | output model tidak lagi menulis isi tabel          | `retryAsync` menerima issue `UNKNOWN_DATA_REF`                                       |
| P4  | **Halaman home** — pola tabel-per-section: home = daftar section, tiap section menunjuk satu tabel                       | home tersusun dari data, bukan copy hard-coded     | hasilkan satu situs penuh (5 halaman) tanpa edit manual                              |
| P5  | **Endpoint per situs** — deployment CMS per salinan Sheet (atau satu deployment + `?sheet=`)                             | `data[].endpoint` benar-benar terisi               | job menghasilkan `endpoint` yang menjawab `{rows}`                                   |

## Yang perlu Anda putuskan

1. **`dataRef` vs inline** — setuju struktur di atas (rujukan), atau Anda ingin baris tabel
   **ditulis masuk** ke `preset.json` saat job (snapshot, tanpa HttpService)?
2. **Endpoint CMS** — satu deployment bersama dengan `?sheet=<id>` (murah), atau deployment per
   situs lewat Apps Script API (mahal, butuh OAuth)?
3. **P0 boleh saya mulai sekarang?** Saya perlu membaca folder `docs/generator/GoogleSheets CMS/`
   dan template sheet-nya (id di Script Properties) untuk menginventaris tabel nyatanya.
