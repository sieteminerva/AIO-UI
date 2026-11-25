import type { iComponentModuleRef } from "@aio-ui/core";
import { FORM_ADAPTER_MANIFEST } from "@aio-ui/form";
import type { FormNode, iFormGroupNode } from "@aio-ui/form";

/**
 * The schemas the `#form` docs route builds — data only, no page wiring.
 *
 * The form is a page component: it owns fields, validation, handlers and its own submit
 * lifecycle. That lifecycle is documented across ten topics, and every topic builds one of
 * the sets below. Keeping the data here (and the route in `pages/form.ts`) means the docs
 * shell can pick a set without any page knowing what a "topic" is.
 */
let isEditing = false;
const selectors = { "@field>label": { tagName: "label", /* attrs: { "animation": "typewriter", "animation-chain": "true", "animated-once": "true" } */ } }

// ID ADDRESS input sets
export const AddressSet: iFormGroupNode = {
  id: "address-set",
  legend: "Id Address Set",
  // condition: { field: "contact-company", filled: true },
  group: [
    {
      content: {
        type: "textarea",
        id: "address-jalan",
        // condition: { field: "logo", filled: true },
        label: "Pusat workshop atau rumah tempat kerja mu ini beralamat di",
        placeholder: "Tuliskan nama jalan, nomor rumah, atau ruko usahamu..."
      },
      config: {
        selectors,
        attributes: [
          { name: "animation", value: "fade-in" },
          { name: "animation-chain", value: "true" },
          { name: "animated-once", value: "true" },
        ]
      }
    },
    {
      content: {
        type: "dropdown",
        id: "address-propinsi",
        label: "Tepatnya, wilayah tersebut berada di cakupan wilayah",
        placeholder: "pilih provinsi"
      },
      config: {
        view: "select",
        min: 1,
        // A level can be large (61 districts in BANDUNG). `max` is the dropdown's render
        // cap, not a search limit — with the default 10 the list stayed short after typing.
        max: 100,
        attributes: [{
          name: "data-level",
          value: "propinsi",
        }]
      }
    },
    {
      content: {
        type: "dropdown",
        id: "address-kota",
        label: "pada wilayah administrasi daerah",
        placeholder: "pilih kota/kabupaten"
      },
      config: {
        view: "select",
        min: 1,
        // A level can be large (61 districts in BANDUNG). `max` is the dropdown's render
        // cap, not a search limit — with the default 10 the list stayed short after typing.
        max: 100,
        attributes: [{
          name: "data-level",
          value: "kota",
        }]
      }
    },
    {
      content: {
        type: "dropdown",
        id: "address-kecamatan",
        label: "meluas ke area wilayah tingkat",
        placeholder: "pilih kecamatan"
      },
      config: {
        view: "select",
        min: 1,
        // A level can be large (61 districts in BANDUNG). `max` is the dropdown's render
        // cap, not a search limit — with the default 10 the list stayed short after typing.
        max: 100,
        attributes: [{
          name: "data-level",
          value: "kecamatan",
        }]
      }
    },
    {
      content: {
        type: "dropdown",
        id: "address-kelurahan",
        label: "hingga menyentuh batas terkecil di",
        placeholder: "pilih kelurahan"
      },
      config: {
        view: "select",
        min: 1,
        // A level can be large (61 districts in BANDUNG). `max` is the dropdown's render
        // cap, not a search limit — with the default 10 the list stayed short after typing.
        max: 100,
        attributes: [{
          name: "data-level",
          value: "kelurahan",
        }]
      }
    },
    {
      content: {
        type: "text",
        id: "address-kodepos",
        // condition: { field: "jalan", filled: true },
        label: "dengan penguncian kode pos resmi",
        placeholder: "kodepos"
      },
      config: {
        selectors,
        attributes: [
          { name: "data-level", value: "kodepos" },
          // { name: "animation", value: "fade-in" },
          // { name: "animation-chain", value: "true" },
          // { name: "animated-once", value: "true" },
        ]
      }
    },
  ]
}

// INPUT CONTROL Sets
export const InputControlSet: iFormGroupNode = {
  id: "test-set",
  legend: "Input Controls",
  group: [
    {
      content: {
        type: "text",
        id: "test-1",
        label: "Test Text",
        placeholder: "Isi apa aja"
      },
      config: {
        actions: [
          {
            type: "copy",
            label: "copy",
            onClick: (_parent, context) => {
              console.log("action!! COPY", context)
            }
          },
          {
            type: "delete",
            label: "delete",
            onClick: (_parent, context) => {
              console.log("action!! delete", context)
            }
          },
          {
            type: "add",
            label: "new",
            onClick: (_parent, context) => {
              console.log("action!! ADD", context)
            }
          },
          {
            type: "edit",
            label: "edit",
            onClick: (_parent, context) => {
              isEditing = !isEditing;
              console.log("action!! EDIT", `isEditing: ${isEditing}`, context)
            }
          }
        ],
        editable: true
      }
    },
    {
      content: {
        type: "select",
        id: "test-2",
        label: "Test Text",
        placeholder: "Pilih mana saja",
        options: [
          "A", "B", "C", "D"
        ]
      },
      config: {
        actions: [
          {
            type: "copy",
            label: "",
            onClick: (_parent, context) => {
              console.log("action!! COPY", context)
            }
          },
          {
            type: "delete",
            label: "",
            onClick: (_parent, context) => {
              console.log("action!! delete", context)
            }
          },
          {
            type: "add",
            label: "",
            onClick: (_parent, context) => {
              console.log("action!! ADD", context)
            }
          },
          {
            type: "edit",
            label: "edit",
            onClick: (_parent, context) => {
              isEditing = !isEditing;
              console.log("action!! EDIT", `isEditing: ${isEditing}`, context)
            }
          }
        ],
        editable: true
      }
    },
    // A group is a scope for the control set: `search` reads the whole fieldset with the
    // same vocabulary a submit uses, and reports it through `context.result` + a `search`
    // event on the fieldset.
    {
      content: {
        type: "text",
        id: "test-editor-action",
        label: "Test Text",
        placeholder: "Isi apa aja"
      },
      config: {
        actions: [{ type: "editor", onClick: () => { } }],
        // editable: true
      }
    },
    {
      content: {
        type: "dropdown",
        id: "test-repeater-action",
        label: "Test Text",
        placeholder: "Isi apa aja",
        options: ["A", "B", "C", "D"]
      },
      config: {
        actions: [{ type: "repeater", onClick: () => { }, hideOnSource: true }],
        // editable: true
      }
    },
    {
      id: "lookup",
      title: "Cari pesanan lama",
      // `search` reads the group; `copy` copies it. One word each — no callbacks needed.
      actions: ["search", "copy"],
      group: [
        { content: { type: "text", id: "lookup-invoice", label: "No. invoice", placeholder: "INV-…" } },
        { content: { type: "select", id: "lookup-status", label: "Status", options: ["Baru", "Diproses", "Selesai"] } },
      ],
    },
    // Two words replace four buttons: `editor` = edit+save, `repeater` = add+delete.
    {
      id: "customer",
      title: "Data pelanggan",
      actions: ["editor", "repeater"],
      group: [
        // `editable: true` keeps this one field writable while Edit/Save lock the group.
        { content: { type: "text", id: "customer-name", label: "Nama pelanggan", placeholder: "Belum diisi" }, config: { editable: true } },
        { content: { type: "select", id: "customer-tier", label: "Tier", options: ["Bronze", "Silver", "Gold"] } },
        // A dropdown is part of the set's job too: locked as a unit (box + hidden value).
        { content: { type: "dropdown", id: "customer-city", label: "Kota", options: ["Bandung", "Jakarta", "Surabaya"] }, config: { view: "datalist" } },
      ],
    },

    // A row is a scope as well, not only a fieldset: same `actions`, buttons in the corner.
    {
      id: "row-record",
      title: "Baris record",
      column: 3,
      // actions: ["editor", "repeater"],
      row: [
        { content: { type: "text", id: "row-sku", label: "SKU" }, config: { wide: 30 } },
        { content: { type: "text", id: "row-qty", label: "Qty" }, config: { wide: 30 } },
        // Cascade inside a locked scope: appears once SKU has a value, i.e. after Edit.
        { content: { type: "text", id: "row-note", label: "Catatan baris" }, config: { wide: 40 } },
      ],
    },
    {
      id: "row-language",
      title: "Bahasa",
      column: 3,
      // actions: ["editor", "repeater"],
      row: [
        {
          content: { type: "checkbox", id: "row-autotranslate", label: "auto-translate" },
          config: {
            view: "toggle", position: "right", wide: 30
          }
        },
        {
          content: {
            type: "dropdown", id: "src-lang", label: "Source Language",
            options: ["Indonesia", "English", "Japanese", "France"]
          }, config: { wide: 30 }
        },
        // Cascade inside a locked scope: appears once SKU has a value, i.e. after Edit.
        {
          content: {
            type: "dropdown", id: "target-lang", label: "Target Language",
            options: ["Indonesia", "English", "Japanese", "France"]
          }, config: { wide: 40 }
        },
      ],
    },

  ]

}

export const DropdownSet: iFormGroupNode = {
  legend: "dropdown",
  group: [
    // ══ Test bed: Dropdown mode select (Semantic-UI style) ──────────────
    {
      content: {
        type: "dropdown",
        id: "test-dropdown-single",
        label: "Satu pilihan (style=select)",
        placeholder: "Ketik atau pilih satu...",
        options: [
          { value: "jakarta", label: "Jakarta" },
          { value: "bandung", label: "Bandung" },
          { value: "surabaya", label: "Surabaya" },
          { value: "yogyakarta", label: "Yogyakarta" },
          { value: "bali", label: "Bali" },
          { value: "makassar", label: "Makassar" }
        ]
      },
      config: {
        view: "select",
        min: 1,
        max: 6,
        onSelect: (value: string, id: string | null) => {
          console.log("[Dropdown single] onSelect", { value, id });
        }
      }
    },
    {
      content: {
        type: "dropdown",
        id: "test-dropdown-multi",
        label: "Banyak pilihan (multiple)",
        placeholder: "Ketik lalu pilih banyak...",
        options: [
          "Kopi",
          "Teh",
          "Jus Alpukat",
          "Kue Lapis",
          "Klepon",
          "Wajik",
          "Sekoteng",
          "Semar Mendem",
          "Jenang",
          "Nasi Liwet",
          "Tengkleng"
        ]
      },
      config: {
        view: "select",
        min: 1,
        max: 15,
        onMultiChange: (items: any[]) => {
          console.log("[Dropdown multi] onMultiChange", items);
        },
        multiple: true
      }
    },
  ]
}

/** The hub demo: one schema that exercises cascade, actions, rows, files and dropdowns. */
export const orderSchema: readonly FormNode[] = [

  InputControlSet,

  {
    id: "order",
    title: "Detail pesanan",
    group: [
      { content: { type: "text", id: "name", label: "Nama", placeholder: "Nama lengkap" } },
      { content: { type: "email", id: "email", label: "Email", placeholder: "nama@email.com" } },
      { content: { type: "tel", id: "phone", label: "Telepon", placeholder: "+62…" } },
      { content: { type: "select", id: "size", label: "Ukuran", options: ["S", "M", "L", "XL"] } },
      // Dropdowns are a module, and their stylesheet arrives through the lazy seam —
      // nothing in the bundle imports `Dropdown.css`.
      {
        content: {
          type: "dropdown",
          id: "material",
          label: "Bahan",
          options: ["Katun Combed 30s", "Katun Combed 24s", "Cvc", "Linen", "Rajut"]
        },
        config: {
          view: "datalist"
        }
      },
      { content: { type: "number", id: "qty", label: "Jumlah", placeholder: "1" } },
      { content: { type: "textarea", id: "notes", label: "Catatan", placeholder: "Warna, sablon, atau deadline" } },
      { content: { type: "checkbox", id: "agree", label: "Saya setuju dengan ketentuan pesanan" }, config: { position: "right" } },
      // Radios sharing a name form one group; `style: "toggle"` asks for the switch shell.
      { content: { type: "radio", id: "pickup", name: "delivery", value: "pickup", label: "Ambil sendiri" }, config: { view: "toggle" } },
      { content: { type: "radio", id: "courier", name: "delivery", value: "courier", label: "Kirim kurir", checked: true }, config: { view: "toggle" } },
      // Cascade: this field only exists while the delivery radio says "courier".
      { content: { type: "text", id: "courierNote", label: "Catatan untuk kurir" }, condition: { field: "delivery", equals: "courier" } },
    ],
  },
  // Inline row: `column` is the column count, `config.wide` the share a field takes
  // (50 = half, "auto" = full row). A row is layout, not a fieldset — `group` above.
  AddressSet,
  {
    id: "files",
    title: "Berkas",
    group: [
      // `config.csv` is a declaration, not a parser: it marks the file as tabular so the
      // table module previews it. The input layer still reports raw `File` objects.
      { content: { type: "file", id: "product-csv", label: "Impor produk (CSV)" }, config: { csv: true, accept: ".csv,text/csv" } },
      { content: { type: "file", id: "reference-photo", label: "Foto referensi" }, config: { view: "thumbnail" } },
    ],
  },
  {
    id: "identity",
    label: "Identitas pemesan",
    column: 2,
    row: [
      { content: { type: "text", id: "first", label: "Nama depan" }, config: { wide: 50 } },
      { content: { type: "text", id: "last", label: "Nama belakang" }, config: { wide: 50 } },
      { content: { type: "textarea", id: "street", label: "Alamat lengkap" }, config: { wide: "auto" } },
    ],
  },
  DropdownSet,
];

/**
 * Real regional endpoint (Google Apps Script deployment).
 *
 * The picker no longer ships an endpoint — the demo declares it here, and the builder
 * talks to it through `HttpService` (cache + timeout included). Swap this for
 * `address.loader(query)` if the data should come from the app's own HTTP service.
 */
const ADDRESS_URL = "https://script.google.com/macros/s/AKfycbwjQ_iNQClJuyf5z1ZlJcJ-j6LEnINfvbBmjBFlE4T3X4dVAoxF_GzUCCv6TXZ_apfhpA/exec";

export const addressSource = { url: ADDRESS_URL, useAdapter: "aio" };

/**
 * The form's module stack, as the registry manifest.
 *
 * @summary The form ships its own adapters (`FORM_ADAPTER_MANIFEST`); the three below
 * belong to other packages, so the host composes them — the form never imports `table`,
 * `message` or `id-address`. Declaring them here (instead of handing the page a
 * `ModuleLoader`) is what makes the wiring official: the registry resolves each entry as
 * its own chunk, `Form.provideModules()` partitions them, and the page only owns a schema.
 */
export function formManifest(): iComponentModuleRef[] {
  return [
    ...FORM_ADAPTER_MANIFEST,
    { id: "idAddress", path: "@aio-ui/id-address", export: "idAddressFormAdapter" },
    { id: "table", path: "@aio-ui/table", export: "tableFormAdapter" },
    { id: "message", path: "@aio-ui/message", export: "messageFormAdapter" },
  ];
}

export const formConfig = {
  id: "demo-order-form",
  address: addressSource,
  // Cascade needs the engine on; `hidden` keeps conditional fields alive so a chained
  // picker (address, dependent select) can inject into them before they are shown.
  cascading: true,
  cascadeMode: "hidden" as const,
};

/** Three steps, one per group — the engine owns the next/back set. */
export const multiStepSchema: readonly FormNode[] = [
  { id: "ms-contact", title: "Langkah 1 · Kontak", group: [{ content: { type: "email", id: "ms-email", label: "Email" }, config: { required: true } }] },
  { id: "ms-address", title: "Langkah 2 · Alamat", group: [{ content: { type: "text", id: "ms-city", label: "Kota" }, config: { required: true } }] },
  { id: "ms-confirm", title: "Langkah 3 · Konfirmasi", group: [{ content: { type: "checkbox", id: "ms-agree", label: "Saya setuju" } }] },
] as any[];

/** The multistep demo: one build per topic, so the step engine stays the subject. */
export const multiStepConfig = { id: "demo-multistep", multistep: true };

/**
 * Every editable field type in one schema — the `fields` topic.
 *
 * The types come from `INPUT_TYPE_REGISTRY` (`packages/components/input/FieldTypes.ts`);
 * `actions` is not a type of its own there, it is `config.actions` on any node, which
 * `InputControlSet` above already shows.
 */
export const fieldTypesSchema: readonly FormNode[] = [
  {
    id: "types-text",
    title: "Teks & angka",
    column: 2,
    row: [
      { content: { type: "text", id: "t-text", label: "text", placeholder: "teks bebas" }, config: { wide: 50 } },
      { content: { type: "email", id: "t-email", label: "email", placeholder: "nama@email.com" }, config: { wide: 50 } },
      { content: { type: "password", id: "t-password", label: "password" }, config: { wide: 50 } },
      { content: { type: "url", id: "t-url", label: "url", placeholder: "https://…" }, config: { wide: 50 } },
      { content: { type: "tel", id: "t-tel", label: "tel", placeholder: "+62…" }, config: { wide: 50 } },
      { content: { type: "number", id: "t-number", label: "number" }, config: { wide: 50, min: 0, max: 100 } },
      { content: { type: "textarea", id: "t-textarea", label: "textarea", placeholder: "baris jamak" }, config: { wide: "auto" } },
    ],
  },
  {
    id: "types-choice",
    title: "Pilihan",
    column: 2,
    group: [
      { content: { type: "select", id: "t-select", label: "select", options: ["A", "B", "C"] } },
      // `datalist` is the native picker; `select` asks for the Semantic-UI style box.
      { content: { type: "dropdown", id: "t-dropdown", label: "dropdown", options: ["Katun", "Linen", "Rajut"] }, config: { view: "datalist" } },
      // A grid behind one control, configured flat: `style` picks the cell visual,
      // `column` the track count (same word the row layout uses), `expanded` prints the
      // grid inline instead of behind the trigger's popover.
      {
        content: {
          type: "picker",
          id: "t-picker",
          label: "picker (icon)",
          value: "gear",
          options: [
            "gear", "hand swipe", "inbox", "user",
            "user list", "user settings",
            "checkmark circle",
            "checkmark",
            "cross circle",
            "close",
            "edit",
            "plus",
            "plus circle",
            "plus square",
            "trash",
            "three dots framed",
            "three dots horizontal",
            "three dots square vertical",
            "three dots vertical",
            "hamburger",
            "paper clip",
            "search",
            "arrow left",
            "arrow right",
            "arrow left circle",
            "arrow right circle",
            "double arrow left",
            "double arrow right",
            "expand arrow",
            "bell warning",
            "bell",
            "error",
            "info",
            "notification",
            "text edit",
            "download file",
            "add file circle",
            "adobe illustrator file",
            "adobe pdf file",
            "adobe photoshop file",
            "copy file round",
            "copy file",
            "css file",
            "csv file",
            "file sheets",
            "doc file",
            "edit file round",
            "edit file",
            "file edit",
            "file outline dotted",
            "file",
            "add file",
            "html file",
            "javascript file",
            "jpg file",
            "json file",
            "mp3 file",
            "mp4 file",
            "png file",
            "svg file",
            "txt file",
            "xls file",
            "zip file",
            "add folder circle",
            "add folder",
            "folder",
            "adobe illustrator logo",
            "adobe photoshop logo",
            "google logo",
            "github logo",
            "weburl",
            "instagram logo",
            "itunes logo",
            "qrcode",
            "scan qrcode",
            "barcode",
            "add cart",
            "cart",
            "expand",
            "recycled",
            "rotate",
            "write mail",
            "moon dark",
            "moon sleep",
            "moon sun",
            "sunrise",
          ]
        },
        config: {
          view: "icon",
          column: 8,
          expanded: true
        }
      },
      {
        content: {
          type: "picker",
          id: "t-picker-swatch",
          label: "picker (swatch, multiple)",
          value: "#e5484d,#30a46c",
          options: [
            { value: "#e5484d", label: "Merah", color: "#e5484d" },
            { value: "#f5a524", label: "Amber", color: "#f5a524" },
            { value: "#30a46c", label: "Hijau", color: "#30a46c" },
            { value: "#3e63dd", label: "Biru", color: "#3e63dd" },
            { value: "#8e4ec6", label: "Ungu", color: "#8e4ec6" },
            { value: "#f3ede2", label: "Krem", color: "#f3ede2" },
          ]
        },
        config: {
          view: "swatch",
          column: 8,
          multiple: true
        }
      },
      { content: { type: "checkbox", id: "t-checkbox", label: "checkbox" }, config: { position: "right" } },
      // Radios that share `name` form one group; `toggle` asks for the switch shell.
      { content: { type: "radio", id: "t-radio-a", name: "t-radio", value: "a", label: "radio a" }, config: { view: "toggle" } },
      { content: { type: "radio", id: "t-radio-b", name: "t-radio", value: "b", label: "radio b", checked: true }, config: { view: "toggle" } },
    ],
  },
  {
    id: "types-data",
    title: "Nilai lain",
    column: 2,
    row: [
      { content: { type: "range", id: "t-range", label: "range" }, config: { wide: 50, min: 0, max: 10 } },
      { content: { type: "color", id: "t-color", label: "color" }, config: { wide: 50 } },
      { content: { type: "date", id: "t-date", label: "date" }, config: { wide: 50 } },
      { content: { type: "time", id: "t-time", label: "time" }, config: { wide: 50 } },
      { content: { type: "datetime-local", id: "t-datetime", label: "datetime-local" }, config: { wide: 50 } },
      { content: { type: "file", id: "t-file", label: "file" }, config: { wide: 50 } },
      // `hidden` is a registry type but has no control to look at, so it stays out of the
      // live demo — it is mentioned in the topic's limits instead.
    ],
  },
];

/**
 * Native constraint validation — the `validation` topic.
 *
 * The rules are DOM attributes (`required`, `pattern`, `min`, `max`, `maxlength`), read by
 * `form/adapters/Validation.ts` at submit / `next`, and reported through `formValidation`.
 * `data-level` is deliberately absent: it marks an address picker level, not a rule.
 */
export const validationSchema: readonly FormNode[] = [
  {
    id: "val-native",
    title: "Aturan native",
    column: 2,
    group: [
      { content: { type: "text", id: "v-name", label: "Nama (required)" }, config: { wide: 50, required: true } },
      { content: { type: "email", id: "v-email", label: "Email (required, type=email)" }, config: { wide: 50, required: true } },
      {
        content: {
          type: "text",
          id: "v-invoice",
          label: "Invoice (pattern INV-…)",
          placeholder: "INV-001"
        },
        config: {
          wide: 50,
          required: true,
          pattern: "INV-[0-9]+"
        }
      },
      { content: { type: "number", id: "v-qty", label: "Jumlah 1–10" }, config: { wide: 50, required: true, min: 1, max: 10 } },
      { content: { type: "textarea", id: "v-note", label: "Catatan (maks 40 karakter)" }, config: { wide: "auto", maxlength: 40 } },
    ],
  },
];

/**
 * Conditional fields — the `cascade` topic.
 *
 * Two spellings of one rule: `equals` follows a radio group, `filled` waits for a value.
 * `cascadeMode: "hidden"` keeps the field in the DOM so another engine (an address picker)
 * can inject into it; the default `"template"` would hand it nothing.
 */
export const cascadeSchema: readonly FormNode[] = [
  {
    id: "cascade-delivery",
    title: "Metode pengiriman",
    group: [
      { content: { type: "radio", id: "cs-pickup", name: "delivery", value: "pickup", label: "Ambil di toko", checked: true } },
      { content: { type: "radio", id: "cs-courier", name: "delivery", value: "courier", label: "Kirim kurir" } },
      {
        content: {
          type: "text",
          id: "cs-note",
          label: "Catatan kurir",
          placeholder: "Patokan alamat…"
        },
        condition: { field: "delivery", equals: "courier" }
      },
      { content: { type: "text", id: "cs-invoice", label: "No. invoice", placeholder: "INV-…" } },
      {
        content: {
          type: "text",
          id: "cs-approval",
          label: "Nama penyetuju"
        },
        // `message` is the guidance a multistep gate shows; on a single page it is inert.
        condition: { field: "cs-invoice", filled: true }
      },
    ],
  },
];

export const cascadeConfig = {
  id: "demo-cascade",
  cascading: true,
  cascadeMode: "hidden" as const,
};

/**
 * A running total — the `calculation` topic.
 *
 * The formula travels with the field that carries the quantity: `config.calculator` names
 * the output field, and the engine re-runs it on every `input`/`change`.
 */
export const calculationSchema: readonly FormNode[] = [
  {
    id: "calc-lines",
    title: "Satu baris pesanan",
    column: 2,
    group: [
      {
        content: {
          type: "number",
          id: "calc-qty",
          label: "Qty"
        },
        config: {
          wide: 50,
          calculator: {
            id: "line-total",
            outputId: "calc-total",
            formula: ({ getNumber }: any) => ({
              id: "line-total",
              label: "Line",
              quantity: getNumber("calc-qty"),
              unitPrice: getNumber("calc-price"),
              total: getNumber("calc-qty") * getNumber("calc-price"),
            }),
          },
          min: 0
        }
      },
      { content: { type: "number", id: "calc-price", label: "Harga satuan" }, config: { wide: 50, min: 0 } },
      { content: { type: "number", id: "calc-total", label: "Total (dihitung)" }, config: { wide: "auto", readonly: true } },
    ],
  },
];

export const calculationConfig = { id: "demo-calculation", calculation: true };

/** The address cascade — the `id-address` topic. One group, five `[data-level]` controls. */
export const idAddressSchema = [AddressSet];

export const idAddressConfig = { id: "demo-id-address", address: addressSource };

/**
 * The adapter stack at runtime — the `modules` topic.
 *
 * `search` and `copy` are the controls module, `file` is the file adapter: every one of them
 * arrives through `FORM_ADAPTER_MANIFEST`, never through an import in this file.
 */
export const modulesSchema: readonly FormNode[] = [
  {
    id: "modules-lookup",
    title: "Cari, lalu salin",
    actions: ["search", "copy"],
    group: [
      { content: { type: "text", id: "mod-invoice", label: "No. invoice", placeholder: "INV-…" } },
      { content: { type: "select", id: "mod-status", label: "Status", options: ["Baru", "Diproses", "Selesai"] } },
    ],
  },
  {
    id: "modules-files",
    title: "Lampiran",
    group: [{ content: { type: "file", id: "mod-file", label: "Berkas" }, config: { wide: "auto" } }],
  },
];

export const modulesConfig = { id: "demo-modules" };

/**
 * The layout contract — the `layout` topic.
 *
 * `config.title` / `config.description` render above the first group; `column: 2` with
 * `config.wide: 50` splits a row, `"auto"` takes the rest.
 */
export const layoutSchema: readonly FormNode[] = [
  {
    id: "layout-row",
    title: "Satu grup, dua kolom",
    description: "Baris membagi ruang: wide 50 = setengah, auto = sisa baris.",
    column: 2,
    row: [
      { content: { type: "text", id: "ly-name", label: "Nama" }, config: { wide: 50 } },
      { content: { type: "text", id: "ly-city", label: "Kota" }, config: { wide: 50 } },
      { content: { type: "text", id: "ly-address", label: "Alamat lengkap" }, config: { wide: "auto" } },
      { content: { type: "select", id: "ly-tier", label: "Tier", options: ["Bronze", "Silver", "Gold"] }, config: { wide: 50 } },
      { content: { type: "textarea", id: "ly-note", label: "Catatan" }, config: { wide: 50 } },
    ],
  },
];

export const layoutConfig = {
  id: "demo-layout",
  title: "Layout & tokens",
  description: "Judul dan deskripsi form, lalu satu grup dua kolom yang bisa dijatuhkan ke grid.",
  buttonText: "Simpan",
  // `footer` is the quiet note line under the actions (`@form>footer` → `.form-footer`).
  footer: "Dengan mengirim, kamu setuju pada ketentuan pemesanan.",
};
