/**
 * Loader map for the demo.
 *
 * Written as explicit entries because Vite needs static specifiers to create chunks —
 * a computed `import(entry.path)` would silently produce nothing. The demo table drives
 * the registry names; this file only says where each one lives.
 */
export const componentAssets = {
  modules: {
    "@aio-ui/accordion": () => import("@aio-ui/accordion"),
    "@aio-ui/article": () => import("@aio-ui/article"),
    "@aio-ui/badge": () => import("@aio-ui/badge"),
    "@aio-ui/carousel": () => import("@aio-ui/carousel"),
    "@aio-ui/code-block": () => import("@aio-ui/code-block"),
    "@aio-ui/fab-menu": () => import("@aio-ui/fab-menu"),
    "@aio-ui/footer": () => import("@aio-ui/footer"),
    "@aio-ui/form": () => import("@aio-ui/form"),
    "@aio-ui/input": () => import("@aio-ui/input"),
    "@aio-ui/markdown": () => import("@aio-ui/markdown"),
    "@aio-ui/masonry": () => import("@aio-ui/masonry"),
    "@aio-ui/menu": () => import("@aio-ui/menu"),
    "@aio-ui/message": () => import("@aio-ui/message"),
    "@aio-ui/modal": () => import("@aio-ui/modal"),
    "@aio-ui/mode-switcher": () => import("@aio-ui/mode-switcher"),
    "@aio-ui/pricing-card": () => import("@aio-ui/pricing-card"),
    "@aio-ui/product": () => import("@aio-ui/product"),
    "@aio-ui/section": () => import("@aio-ui/section"),
    "@aio-ui/skeleton": () => import("@aio-ui/skeleton"),
    "@aio-ui/tab": () => import("@aio-ui/tab"),
    "@aio-ui/table": () => import("@aio-ui/table"),

    // Sub-modules declared by a manifest (`FORM_ADAPTER_MANIFEST`). Each one is its own
    // chunk: the registry fetches an entry only when a manifest asks for that id.
    "@aio-ui/form/validation-adapter": () => import("@aio-ui/form/validation-adapter"),
    "@aio-ui/form/cascade-adapter": () => import("@aio-ui/form/cascade-adapter"),
    "@aio-ui/form/multistep-adapter": () => import("@aio-ui/form/multistep-adapter"),
    "@aio-ui/form/calculation-adapter": () => import("@aio-ui/form/calculation-adapter"),
    "@aio-ui/input/dropdown": () => import("@aio-ui/input/dropdown"),
    "@aio-ui/input/file-uploader": () => import("@aio-ui/input/file-uploader"),
    "@aio-ui/input/controls": () => import("@aio-ui/input/controls"),
    "@aio-ui/input/picker": () => import("@aio-ui/input/picker"),

    // The opt-in stacks (`@aio-ui/form`, `@aio-ui/input`) and their whole-package imports are
    // declared once, with the components above — a map key may appear once, so repeating them
    // here used to be a duplicate-key error, not a second registration.

    // Adapters owned by other packages: the form never imports them, the host declares them.
    "@aio-ui/id-address": () => import("@aio-ui/id-address"),
  } as Record<string, () => Promise<unknown>>,
  styles: {
    "@aio-ui/accordion/Accordion.css": () => import("@aio-ui/accordion/Accordion.css?inline"),
    "@aio-ui/article/Article.css": () => import("@aio-ui/article/Article.css?inline"),
    "@aio-ui/badge/Badge.css": () => import("@aio-ui/badge/Badge.css?inline"),
    "@aio-ui/carousel/Carousel.css": () => import("@aio-ui/carousel/Carousel.css?inline"),
    "@aio-ui/code-block/CodeBlock.css": () => import("@aio-ui/code-block/CodeBlock.css?inline"),
    "@aio-ui/fab-menu/FabMenu.css": () => import("@aio-ui/fab-menu/FabMenu.css?inline"),
    "@aio-ui/footer/Footer.css": () => import("@aio-ui/footer/Footer.css?inline"),
    "@aio-ui/form/Form.css": () => import("@aio-ui/form/Form.css?inline"),
    // Nested builders (dropdown, uploader, controls, toast) declare their own sheet and
    // reach it through this map — no component imports its own CSS.
    "@aio-ui/input/Input.css": () => import("@aio-ui/input/Input.css?inline"),
    "@aio-ui/input/Dropdown.css": () => import("@aio-ui/input/Dropdown.css?inline"),
    "@aio-ui/input/FileUploader.css": () => import("@aio-ui/input/FileUploader.css?inline"),
    "@aio-ui/input/InputControls.css": () => import("@aio-ui/input/InputControls.css?inline"),
    "@aio-ui/input/InputPicker.css": () => import("@aio-ui/input/InputPicker.css?inline"),
    "@aio-ui/message/Message.css": () => import("@aio-ui/message/Message.css?inline"),
    "@aio-ui/id-address/IdAddress.css": () => import("@aio-ui/id-address/IdAddress.css?inline"),
    "@aio-ui/markdown/Markdown.css": () => import("@aio-ui/markdown/Markdown.css?inline"),
    "@aio-ui/masonry/Masonry.css": () => import("@aio-ui/masonry/Masonry.css?inline"),
    "@aio-ui/menu/Menu.css": () => import("@aio-ui/menu/Menu.css?inline"),
    "@aio-ui/modal/Modal.css": () => import("@aio-ui/modal/Modal.css?inline"),
    "@aio-ui/mode-switcher/ModeSwitcher.css": () => import("@aio-ui/mode-switcher/ModeSwitcher.css?inline"),
    "@aio-ui/pricing-card/PricingCard.css": () => import("@aio-ui/pricing-card/PricingCard.css?inline"),
    "@aio-ui/product/index.css": () => import("@aio-ui/product/index.css?inline"),
    "@aio-ui/section/Section.css": () => import("@aio-ui/section/Section.css?inline"),
    "@aio-ui/skeleton/Skeleton.css": () => import("@aio-ui/skeleton/Skeleton.css?inline"),
    "@aio-ui/tab/Tab.css": () => import("@aio-ui/tab/Tab.css?inline"),
    "@aio-ui/table/Table.css": () => import("@aio-ui/table/Table.css?inline"),
    // The theme console is host chrome, not a registry component: it declares
    // `stylesheet: "./ThemeConsole.css"` and the seam resolves it by basename.
    // (`ColorTheme.css` is host-linked from main.ts — its builder is created directly.)
    "/ThemeConsole/ThemeConsole.css": () => import("./ThemeConsole/ThemeConsole.css?inline"),
  } as Record<string, () => Promise<unknown>>,
};
