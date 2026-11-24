Saya ingin melakukan refactor menyeluruh pada definisi TypeScript interface/types di package `@aio-ui/input` (dan sub-modul di dalamnya) agar memiliki type-checking dan autocomplete yang sangat ketat.

### Konteks & Referensi Kontrak:

1. Periksa dan ikuti kontrak struktur dasar dari **`packages/base/src/BaseAdapters/ContentContract.ts`**.
2. Semua komponen di framework ini telah diseragamkan agar dipanggil menggunakan pola:
   `InputBuilder(builderConfig).create(schema: { content: Object; config?: Object })`
3. **Tanpa Legacy Support**: Saya tidak membutuhkan backward compatibility. Hapus support payload datar lama agar TypeScript melempar compile error pada app consumer yang belum disesuaikan.

### Instruksi Refactor:

1. **Audit & Kurasi Properti Berdasarkan Actual Code:**
   - Baca dan analisis seluruh tipe eksisting di `packages/components/input` (termasuk `FieldTypes.ts`, `Attribute.ts`, `CalculationTypes.ts`, `InputModuleTypes.ts`, serta tipe-tipe di dalam folder `Dropdown`, `InputPicker`, `FileUploader`, `InputControls`, dan `Popover`).
   - Kurasi dan pisahkan seluruh properti eksisting tersebut ke dalam `content` (data, identitas, nilai, opsi, teks) dan `config` (perilaku, layout, batasan, event handler, serta konfigurasi spesifik modul) sesuai standar `ContentContract.ts`.

2. **Terapkan Pola Discriminated Union (`Extract`):**
   - Buat base type untuk `content` dan `config` yang menampung properti umum untuk semua field.
   - Buat schema terpisah untuk **setiap varian `type` input yang ada di actual code**, menggunakan `content.type` sebagai discriminator.
   - Contoh pola yang diharapkan (terapkan pola ini ke seluruh varian input yang Anda temukan di codebase):
     - **Varian `select`**: `content` memiliki `type: "select"` & `options` (dan data terkait pilihan), sedangkan `config` hanya memunculkan konfigurasi yang relevan (seperti `multiple`, dll) tanpa properti file atau text.
     - **Varian `file`**: `content` memiliki `type: "file"` (dan identitas dasar), sedangkan `config` hanya memunculkan konfigurasi khusus file uploader yang ada di actual code (seperti `multiple`, `maxUpload`, `maxFileSize`, `thumbnail`, `onFileSelected`, dll) tanpa `options`.
     - _(Lakukan kurasi ketat yang sama untuk seluruh varian tipe input lainnya yang ada di `FieldTypes.ts` / `Input.ts`, termasuk `dropdown`, `picker`, `textarea`, `number`, `text`, dll)_

3. **Buat Generic Helper Type `InputSchema<T>`:**
   - Gabungkan seluruh varian schema ke dalam union type `AnyInputSchema`.
   - Buat generic helper agar konsumen bisa menggunakannya secara spesifik maupun dinamis:
     ```ts
     export type InputSchema<T extends AnyInputSchema["content"]["type"] = AnyInputSchema["content"]["type"]> = Extract<
       AnyInputSchema,
       { content: { type: T } }
     >;
     ```
   - Pastikan ketika `content.type` diisi, autocomplete di dalam blok `config` otomatis terkunci hanya menampilkan properti yang valid untuk tipe tersebut.

4. **Update Implementasi & Export:**
   - Perbarui signature `.create<T extends AnyInputSchema["content"]["type"]>(schema: InputSchema<T>)` di `InputBuilder`.
   - Sesuaikan akses properti internal di `Input.ts` dan sub-modul terkait agar membaca dari `schema.content` dan `schema.config` sesuai hasil kurasi baru.
   - Export seluruh tipe baru melalui `index.ts` agar terhubung rapi dengan package lain (seperti `@aio-ui/form`).

Silakan mulai dengan membaca `packages/base/src/BaseAdapters/ContentContract.ts` dan seluruh file di `packages/components/input` sebelum mengusulkan mapping kurasi properti dan menulis kodenya.

## Peringatan Penting (Anti-Type Widening):

**Pastikan signature method `.create()` tidak menyebabkan type widening pada content.type menjadi string umum. Gunakan `create(schema: AnyInputSchema)` secara langsung, atau jika menggunakan generic gunakan `<const T extends AnyInputSchema["content"]["type"]>(schema: InputSchema<T>)` sehingga tipe literal `(seperti "file" atau "select")` tetap terkunci ketat dan menolak tipe di luar union.**
