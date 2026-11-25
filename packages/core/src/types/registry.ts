/**
 * Registry contracts: the component map and the builder function shape.
 */

import type { iBasicNode } from "./node";
import type { iBuilderContent, iCardProperty, iHeaderProperty } from "./content";

/**
 * Events a builder reports while it assembles or mutates its own nodes.
 *
 * Only builder-level events live here. The shell-level ones (`ready`, `themeChanged`,
 * `error`) used to sit in this map too, left over from the old monolithic page builder —
 * they are declared once, with their real payloads, in `events.ts`. Keeping one copy is
 * what makes `iPageEvents extends iComponentEvents` legal instead of a collision.
 */
export interface iComponentEvents<T extends string = string> {
  elementChanged: {
    builder?: keyof iBuilderRegistry;
    type?: T | string; // 💡 Tipe sub-organ menangkap token dinamis dari T secara kaku!
    element: HTMLElement | null;
    data?: any;
  };
  elementAdded: {
    builder?: keyof iBuilderRegistry;
    type?: T; // 💡 Tipe sub-organ menangkap token dinamis dari T secara kaku!
    element: HTMLElement;
    parent?: HTMLElement;
    data?: any;
  };
  elementRemoved: {
    element?: HTMLElement;
    builder?: keyof iBuilderRegistry;
    data?: any
  };
}

export interface iBuilderRegistry {
  carousel: iBuilderContent[];
  accordion: iHeaderProperty[];
  "pricing-card": iCardProperty[];
  masonry: iBuilderContent[];
  section: iBuilderContent[];
  /** `FormNode[]` from `@aio-ui/form`; core cannot import a component package, so the concrete shape is enforced at that package's door. */
  form: any[];
  menu: iBasicNode;
  footer: iBasicNode;
  "fab-menu": iBasicNode;
  modal: iBasicNode | HTMLElement;
  "mode-switcher": iBasicNode;
  message: iBasicNode;
  rating: any;
  article: any;
  tab: any;
  /** `InputSchema<T>` from `@aio-ui/input`; core cannot import a component package, so the concrete shape is enforced at that package's door. */
  input: any;
  "product-card": iBasicNode;
  /** The composed catalog: grid ⇄ detail, owned by `ProductBuilder`. */
  product: iBasicNode | iBuilderContent[];
  "product-card-grid": any;
  "product-detail": any;
  /** `FormField[]` from `@aio-ui/form` — same door rule as `input`. */
  "input-controls": any[];
  table: any[];
  /** `InputSchema<"dropdown">` from `@aio-ui/input` — same door rule as `input`. */
  dropdown: any;
  /** `InputSchema<"picker">` from `@aio-ui/input` — same door rule as `input`. */
  "input-picker": any;
  "color-theme": iBasicNode;
  /** Host chrome that owns a `color-theme` builder: the generator's slide panels. */
  "theme-console": iBasicNode;
  "editor": iBasicNode;
  "form-editor": iBasicNode;
  badge: any;
  /** An article-style heading block; payload is `iHeaderContent` from `@aio-ui/header`. */
  header: any;
  /** The mandatory placeholder primitive — payload is an `iSkeletonSpec`. */
  skeleton: any;
  /** A dark panel for source text — payload `{ code, label?, language? } | { blocks }`. */
  "code-block": any;
  /** A Markdown document rendered to DOM — payload `{ source: string }`. */
  markdown: any;
  // Untuk komponen baru nanti, cukup daftarkan jenis array atomnya di sini:
  // stats: iStatsProperty[];
}

// Function signature constraint for allowed builders
export type ComponentBuilderFn<Args = any> = (content: Args) => HTMLElement | null;

// Registry map type contract tracking all active builder functions
export type BuilderFunctionsMap = {
  [K in keyof iBuilderRegistry]: ComponentBuilderFn<iBuilderRegistry[K]>;
};


/**
 * 
 */

export interface iComponentMeta {
  active: boolean;
  container: string;       // Selector CSS unik tempat dia bersarang (misal: "div#carousel-container")
  count: number;           // Jumlah komponen sejenis di halaman tersebut
  instances: any[];        // Salinan referensi payload data internalnya
}

export interface iPageMetaReport {
  isArray: boolean;
  totalSections: number;
  hasComponent: {
    [K in keyof iBuilderRegistry]?: iComponentMeta;
  };
  // Tambahan info taktis: Daftar seluruh ID seksi dan label nama seksi untuk timeline
  timelinePaths: Array<{ id: string; name: string; type: string }>;
  graphRelationsBlueprint?: any
}

