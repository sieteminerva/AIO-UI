import type { iBasicNode, iBuilderConfig, iBuilderRegistry, iContentContract } from "@aio-ui/core/interface";
import { Builder } from "@aio-ui/base";
export type MasonryElementType = "@container" | "@masonry" | "@masonry>filter" | "@masonry>filter>item" | "@masonry>filter>slider" | "@masonry>item" | "@masonry>item>image" | "@masonry>item>title" | "@masonry>item>desc" | "@masonry>item>actions" | "@masonry>modal" | "@masonry>modal>stage" | "@masonry>modal>image" | "@masonry>modal>caption" | "@masonry>modal>title" | "@masonry>modal>desc" | "@masonry>modal>close" | "@masonry>modal>next" | "@masonry>modal>previous" | "@masonry>spinner" | "@masonry>trigger" | "@masonry>sentinel";
export interface iMasonryConfig extends iBuilderConfig<MasonryElementType> {
    container?: string | HTMLElement | null;
    column: number;
    lazyload: boolean;
    maxDisplayed: number;
    useLoadButton?: boolean;
    category: string | null;
    /**
     * Category highlighted on first render.
     *
     * `null` (default) shows everything — the "All" button is active. A name that is not
     * present in the current data falls back to `null` instead of rendering an empty grid.
     */
    defaultCategory?: string | null;
    loadFn?: null | ((page: number, category: string | null) => Promise<any[]>);
    onScrollEnd?: null | (() => void);
    onLoadTriggered?: null | ((page: number) => void);
}
export declare class MasonryBuilder extends Builder<MasonryElementType, iMasonryConfig> {
    #private;
    readonly builderId: keyof iBuilderRegistry;
    readonly name: keyof iBuilderRegistry;
    readonly stylesheet: string;
    /** `{ items }` or a bare array (the builder wraps it), and an item may be an element. */
    static readonly contract: iContentContract;
    private displayedCount;
    private selectedCategory;
    private currentPage;
    private isServerFetching;
    private modal;
    private observer?;
    /**
     * 🪶 LOADING MOCKUP — the filter row and three staggered boards, drawn with the mandatory
     * `@aio-ui/skeleton` primitive. The aspect ratios (not a payload loop) are what make the
     * grid read as masonry, and they are geometry, not data.
     */
    protected loading(): HTMLElement;
    constructor(config?: Partial<iMasonryConfig>);
    /**
     * SETTER: Tempat validasi pusat untuk mengamankan data sebelum masuk ke aplikasi
     */
    set items(newItems: (iBasicNode | HTMLElement)[]);
    /**
     * GETTER KATEGORI: record yang AKTIF dan SUDAH TER-RENDER di layar.
     *
     * The whole record, not just its URL: the grid is a preview, so the lightbox has to repeat
     * the picture **and** the text the card only reveals on hover. Filtering by "is on screen"
     * is what keeps the arrows inside the current filter instead of walking hidden records.
     */
    private get currentVisibleRecords();
    prepare(data: any, _config?: Partial<iMasonryConfig>): HTMLElement;
    protected template(typeKey: MasonryElementType, el: HTMLElement, payload?: any): void;
    initialize(): void;
    unmount(): void;
    private _initPaginationTrigger;
    private _handleNextBatchTrigger;
    private _loadNextBatch;
    /**
     * Pins the column count to the configuration, never to how many items a filter
     * happened to leave behind.
     *
     * A card is one column wide, so its size must not change when the visitor filters:
     * clamping the count to the item total (`min(configured, itemCount)`) made a single
     * match stretch across the whole grid, and two matches each half of it — the same
     * card, three different sizes, depending only on how many siblings it had.
     * The responsive clamps live in `Masonry.css`, which is where viewport width belongs.
     */
    private _syncColumnCount;
    private _killPaginationControls;
    private _renderFilterMenu;
    private _updateSlider;
    /**
     * Pengukur ulang slider dengan transisi dimatikan (untuk koreksi posisi saat init).
     * Dipisah dari _updateSlider agar panggilan berulang warnanya bersih tanpa animasi lompat.
     */
    private _measureSlider;
    private _handleCategoryChange;
    private _applyFilter;
    private _createSpinner;
    private _createItem;
    /**
     * The lightbox: one record at a time, re-rendered per open.
     *
     * The markup is `template()`'s, so opening a card is a `render("@masonry>modal", payload)`
     * with the record reduced to what the modal shows. Nothing here writes text or touches an
     * `img` — that is why this method is only about payload, wiring and teardown.
     */
    private _initModal;
}
//# sourceMappingURL=Masonry.d.ts.map