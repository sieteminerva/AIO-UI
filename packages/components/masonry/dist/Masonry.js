import { Builder } from "@aio-ui/base";
import { Skeleton } from "@aio-ui/skeleton";
import { createImageError } from "@aio-ui/utilities";
export class MasonryBuilder extends Builder {
    builderId = "masonry";
    name = "masonry";
    stylesheet = "./Masonry.css";
    /** `{ items }` or a bare array (the builder wraps it), and an item may be an element. */
    static contract = {
        schema: {
            t: "union",
            of: [
                {
                    t: "record",
                    open: true,
                    of: { items: { t: "list", req: true, of: { t: "union", of: [{ t: "element" }, { t: "record", open: true }] } } },
                },
                { t: "list", of: { t: "union", of: [{ t: "element" }, { t: "record", open: true }] } },
            ],
        },
        example: { items: [{ image: "a.png", category: "Branding", title: "Project A" }] },
    };
    #items = [];
    displayedCount = 0;
    selectedCategory = null;
    currentPage = 1; // Penunjuk halaman untuk Apps Script Pagination
    isServerFetching = false; // Flag pelindung agar tidak terjadi double-fetch tabrakan
    modal;
    observer;
    /**
     * 🪶 LOADING MOCKUP — the filter row and three staggered boards, drawn with the mandatory
     * `@aio-ui/skeleton` primitive. The aspect ratios (not a payload loop) are what make the
     * grid read as masonry, and they are geometry, not data.
     */
    loading() {
        return Skeleton.create({
            shape: "stack",
            children: [
                { shape: "row", gap: "0.5rem", children: [{ shape: "bone", width: "4.5rem", height: "1.4rem", count: 3 }] },
                {
                    shape: "row",
                    gap: "0.9rem",
                    children: [
                        { shape: "bone", width: "28%", aspect: "3 / 4" },
                        { shape: "bone", width: "28%", aspect: "1 / 1.6" },
                        { shape: "bone", width: "28%", aspect: "3 / 5" },
                    ],
                },
            ],
        });
    }
    constructor(config = {}) {
        super();
        const defaultSelectors = {
            "@container": { tagName: "section", className: "masonry gallery" },
            "@masonry": { tagName: "div", className: "grid" },
            "@masonry>filter": { tagName: "nav", className: "filter menu" },
            "@masonry>filter>item": { tagName: "button", className: "item" },
            "@masonry>filter>slider": { tagName: "span", className: "slider" },
            "@masonry>item": { tagName: "figure", className: "item is-fade-in" },
            "@masonry>item>image": { tagName: "img" },
            "@masonry>item>title": { tagName: "h3", className: "title" },
            "@masonry>item>desc": { tagName: "p", className: "desc" },
            "@masonry>item>actions": { tagName: "div", className: "actions" },
            "@masonry>modal": { tagName: "div", className: "modal hidden" },
            /* The lightbox shows the whole record: the grid is a preview, so the modal repeats the
               image at full size **and** the text the card only reveals on hover. `stage` is the
               figure that holds both, which is what makes the caption sit under the picture. */
            "@masonry>modal>stage": { tagName: "figure", className: "stage" },
            "@masonry>modal>image": { tagName: "img", className: "img" },
            "@masonry>modal>caption": { tagName: "figcaption", className: "caption" },
            "@masonry>modal>title": { tagName: "h3", className: "title" },
            "@masonry>modal>desc": { tagName: "p", className: "desc" },
            "@masonry>modal>close": { tagName: "i", className: "icon cross", wrapper: ".close" },
            "@masonry>modal>next": { tagName: "i", className: "icon arrow right", wrapper: ".next" },
            "@masonry>modal>previous": { tagName: "i", className: "icon arrow left", wrapper: ".previous" },
            "@masonry>spinner": { tagName: "div", className: "spinner hidden" },
            "@masonry>sentinel": { tagName: "div", className: "sentinel" },
            "@masonry>trigger": { tagName: "button", className: "more" },
        };
        const defaultConfig = {
            themeId: "default",
            container: null,
            column: 3,
            lazyload: true,
            maxDisplayed: 5,
            useLoadButton: true,
            category: null,
            defaultCategory: null,
            selectors: defaultSelectors,
            loadFn: null, // Default untuk load data baru dari GAS Server
            onScrollEnd: null, // Meletup saat user menyentuh lantai terbawah dokumen bodi HTML
            onLoadTriggered: null, // Meletup tepat saat hitmundur loading data baru dimulai
            namespace: null,
            emit: null
        };
        this.config = this.resolveConfig(defaultConfig, config);
    }
    /**
     * SETTER: Tempat validasi pusat untuk mengamankan data sebelum masuk ke aplikasi
     */
    set items(newItems) {
        // Validasi Keamanan: Pastikan data berupa array dan lakukan pembersihan
        if (!Array.isArray(newItems)) {
            console.error('Validasi Gagal: Data masonry harus berupa array.');
            return;
        }
        // Bekukan data (Immutability) agar tidak bisa dimutasi secara ilegal dari luar skrip
        this.#items = newItems.map(item => {
            if (item instanceof HTMLElement)
                return item;
            // Sanitasi dasar: Pastikan properti penting aman dari manipulasi tipe data
            return Object.freeze({
                ...item,
                title: item.title ? String(item.title).trim() : undefined,
                description: item.description ? String(item.description).trim() : undefined,
                category: item.category ? String(item.category).trim() : undefined,
                image: item.image || item.imageUrl ? String(item.image || item.imageUrl).trim() : undefined
            });
        });
    }
    /**
     * GETTER KATEGORI: record yang AKTIF dan SUDAH TER-RENDER di layar.
     *
     * The whole record, not just its URL: the grid is a preview, so the lightbox has to repeat
     * the picture **and** the text the card only reveals on hover. Filtering by "is on screen"
     * is what keeps the arrows inside the current filter instead of walking hidden records.
     */
    get currentVisibleRecords() {
        // 1. Ambil data yang lolos saringan kategori saat ini
        const filtered = this.#items.filter(item => {
            if (item instanceof HTMLElement)
                return false;
            return this.selectedCategory === null || item.category === this.selectedCategory;
        });
        // 2. Batasi hanya sebanyak jumlah item yang sedang aktif di-render di layar (displayedCount)
        const visibleBatch = filtered.slice(0, this.displayedCount);
        // 3. Simpan record utuhnya, bukan cuma URL-nya: modal menampilkan gambar **dan** teks
        return visibleBatch.filter(item => !!(item.image || item.imageUrl));
    }
    prepare(data, _config) {
        let normalizedData = data;
        if (Array.isArray(data)) {
            normalizedData = {
                id: this.config.container instanceof HTMLElement ? this.config.container.id : "masonry-legacy-root",
                className: "section masonry gallery",
                items: data // Bare array is the item list; the payload key is `items`.
            };
        }
        // Pasok data array murni ksatria Anda ke Immutable Setter Tracker
        this.items = normalizedData.items || [];
        this.displayedCount = 0;
        this.currentPage = 1; // Reset nomor halaman awal
        const rootContainer = this.render("@container", normalizedData);
        const categoriesSet = new Set();
        this.#items.forEach(item => {
            if (!(item instanceof HTMLElement) && item.category)
                categoriesSet.add(item.category.trim());
        });
        const categories = Array.from(categoriesSet);
        // Start on the configured category, or on "All" (null) when none is configured.
        // A name that does not exist in the current data also means "All": an empty grid on
        // first paint is worse than showing everything.
        const preferred = this.config.defaultCategory;
        this.selectedCategory = preferred && categories.includes(preferred) ? preferred : null;
        if (categories.length > 0) {
            const filterMenuElement = this._renderFilterMenu(categories, this.selectedCategory);
            rootContainer?.appendChild(filterMenuElement);
        }
        const gridElement = this.render("@masonry", data);
        rootContainer?.appendChild(gridElement);
        this.modal = this._initModal();
        // Jalankan penyaringan & pemuatan batch pagination pertama kali
        this._applyFilter(this.selectedCategory);
        return this.load("@container");
    }
    template(typeKey, el, payload) {
        // 🧱 SELURUH LOGIKA PEMBANGUNAN DOM TERKONSENTRASI DI SINI (pola Accordion).
        // render() pusat menganugerahi setiap balok bersih, lalu template() merakit
        // keturunannya secara rekursif & menanamkan konten/data aktifnya.
        switch (typeKey) {
            case "@container":
                if (this.config.container instanceof HTMLElement) {
                    el.id = this.config.container.id || el.id;
                    el.className = `${this.config.container.className} ${el.className}`.trim();
                }
                else if (typeof this.config.container === 'string') {
                    const target = document.querySelector(this.config.container);
                    if (target)
                        el.id = target.id;
                }
                break;
            case "@masonry":
                el.style.setProperty("--masonry-columns", this.config.column.toString());
                break;
            // ── FILTER MENU ─────────────────────────────────────────────
            case "@masonry>filter": {
                const categories = payload?.categories || [];
                const selected = payload?.selected ?? null;
                const onSelect = payload?.onSelect;
                // Tombol "All" (selalu tersedia sebagai pos default)
                const allBtn = this.render("@masonry>filter>item", {
                    label: "All",
                    active: selected === null,
                    onSelect,
                });
                if (allBtn)
                    el.appendChild(allBtn);
                // Tombol kategori hasil dedupe data
                categories.forEach((catName) => {
                    const btn = this.render("@masonry>filter>item", {
                        label: catName,
                        active: selected === catName,
                        onSelect,
                    });
                    if (btn)
                        el.appendChild(btn);
                });
                // Indikator slider (digeser presisi oleh _updateSlider)
                const slider = this.render("@masonry>filter>slider");
                if (slider)
                    el.appendChild(slider);
                break;
            }
            case "@masonry>filter>item":
                el.textContent = payload?.label || "";
                el.classList.toggle("active", !!payload?.active);
                el._categoryToken = payload?.label;
                // Wiring klik: teruskan label & elemen tombol untuk sinkronisasi slider
                if (typeof payload?.onSelect === "function") {
                    el.onclick = () => payload.onSelect(payload.label, el);
                }
                break;
            // ── MASONRY CARD ───────────────────────────────────────────
            case "@masonry>item": {
                const content = payload?.item ?? payload;
                const modalIndex = payload?.modalIndex ?? -1;
                // Passthrough langsung untuk elemen DOM mentah yang disuntikkan pemanggil
                if (content instanceof HTMLElement) {
                    el.appendChild(content);
                    break;
                }
                const item = content;
                if (item.className)
                    el.classList.add(...String(item.className).split(" "));
                if (item.id)
                    el.id = item.id;
                if (item.image || item.imageUrl) {
                    const img = this.render("@masonry>item>image", { ...item, modalIndex });
                    if (img)
                        el.appendChild(img);
                }
                if (item.title || item.description) {
                    const overlay = document.createElement("header");
                    overlay.className = "caption";
                    if (item.title) {
                        const h2 = this.render("@masonry>item>title", item);
                        if (h2)
                            overlay.appendChild(h2);
                    }
                    if (item.description) {
                        const p = this.render("@masonry>item>desc", item);
                        if (p)
                            overlay.appendChild(p);
                    }
                    el.appendChild(overlay);
                }
                if (item.actions && Array.isArray(item.actions)) {
                    const actionsEl = this.render("@masonry>item>actions", item.actions);
                    if (actionsEl)
                        el.appendChild(actionsEl);
                }
                /*
                 * The whole card opens the lightbox, not only its picture: the grid is a preview, so
                 * anywhere on it is a fair target. `onclick` rather than `addEventListener`, on
                 * purpose — one handler per card, overwritten by a rebuild and collected with the
                 * node. A filter empties `.grid`, so no listener list has to be walked to unhook it
                 * (see `_applyFilter`), and `unmount()` has nothing beyond the modal to clean.
                 */
                if (payload?.modalIndex !== undefined && payload?.modalIndex !== -1) {
                    el.onclick = (event) => {
                        event.stopPropagation();
                        this.modal.show(payload.modalIndex);
                    };
                }
                break;
            }
            case "@masonry>item>image": {
                const img = el;
                img.src = encodeURI(payload?.image || payload?.imageUrl || "");
                img.alt = payload?.title || "Gallery image";
                if (this.config.lazyload)
                    img.loading = "lazy";
                // Fallback saat URL gambar gagal dimuat dari server statis
                img.onerror = () => {
                    img.src = createImageError();
                };
                break;
            }
            case "@masonry>item>title":
                el.textContent = payload?.title || "";
                break;
            case "@masonry>item>desc":
                el.textContent = payload?.description || "";
                break;
            case "@masonry>item>actions": {
                const actions = Array.isArray(payload) ? payload : [];
                for (const action of actions) {
                    const btn = action.href ? document.createElement("a") : document.createElement("button");
                    if (action.id)
                        btn.id = action.id;
                    if (btn instanceof HTMLAnchorElement && action.href)
                        btn.href = action.href;
                    btn.textContent = action.label || "Click";
                    if (action.onClick)
                        btn.addEventListener("click", (e) => action.onClick(e));
                    el.appendChild(btn);
                }
                break;
            }
            // ── MODAL ─────────────────────────────────────────────
            // Every modal block reads the payload assembled by `_initModal`: one record, already
            // normalised (`image`, `title`, `description`). The lightbox is re-rendered per open,
            // so the markup below is the whole story — nothing patches it afterwards.
            case "@masonry>modal": {
                const previous = this.render("@masonry>modal>previous", payload);
                const stage = this.render("@masonry>modal>stage", payload);
                const next = this.render("@masonry>modal>next", payload);
                const close = this.render("@masonry>modal>close", payload);
                // The controls are wrapped (`i.icon` inside its `.close` / `.next` / `.previous`
                // wrapper), so the wrapper is the node the overlay lays out; `__outer` is what the
                // builder hands back.
                if (previous)
                    el.appendChild(previous.__outer ?? previous);
                if (stage)
                    el.appendChild(stage);
                if (next)
                    el.appendChild(next.__outer ?? next);
                if (close)
                    el.appendChild(close.__outer ?? close);
                break;
            }
            case "@masonry>modal>stage": {
                const image = this.render("@masonry>modal>image", payload);
                const caption = this.render("@masonry>modal>caption", payload);
                if (image)
                    el.appendChild(image);
                if (caption)
                    el.appendChild(caption);
                break;
            }
            case "@masonry>modal>caption": {
                const title = this.render("@masonry>item>title", payload);
                const desc = this.render("@masonry>item>desc", payload);
                if (title)
                    el.appendChild(title);
                if (desc)
                    el.appendChild(desc);
                break;
            }
            case "@masonry>modal>image": {
                const img = el;
                img.decoding = "async";
                img.src = encodeURI(String(payload?.image || ""));
                img.alt = payload?.title || "Gallery image";
                break;
            }
            case "@masonry>modal>close":
                (el.closest("button") ?? el.parentElement ?? el).setAttribute("aria-label", "Close image");
                break;
            case "@masonry>modal>next":
                (el.closest("button") ?? el.parentElement ?? el).setAttribute("aria-label", "Next image");
                break;
            case "@masonry>modal>previous":
                (el.closest("button") ?? el.parentElement ?? el).setAttribute("aria-label", "Previous image");
                break;
            // ── PAGINATION ─────────────────────────────────────────────
            case "@masonry>trigger":
                el.textContent = "Load More";
                break;
        }
    }
    initialize() {
        const activeBtn = this.load("@masonry>filter")?.querySelector(".item.active");
        if (activeBtn) {
            // Browser sudah sukses menggambar ukuran piksel, hitung slider koordinat dengan presisi 100%!
            requestAnimationFrame(() => this._updateSlider(activeBtn, true));
        }
        // console.log("[Masonry Lifecycle] Advanced photo gallery layout synchronized successfully.");
    }
    unmount() {
        // Panggil logika pembersih aseli bawaan Anda tanpa ada yang ketinggalan
        if (this.observer) {
            this.observer.disconnect();
            this.observer = undefined;
        }
        // The modal is the one node with listeners that outlive their parent: its key handler,
        // the backdrop click and the two arrows all close over `show`. Cards need no equivalent —
        // they carry a single `onclick` and leave with their node (see `_applyFilter`).
        if (this.modal && typeof this.modal.destroy === 'function') {
            this.modal.destroy();
        }
        this.remove("@masonry>trigger", "@masonry>spinner");
        // Hancurkan saku Map dan likuidasi RAM via destroy base class terpusat!
        this.destroy();
    }
    _initPaginationTrigger(root) {
        if (this.config.useLoadButton) {
            const button = (this.load("@masonry>trigger") || this.render("@masonry>trigger"));
            button.onclick = () => this._handleNextBatchTrigger();
            root.append(button);
            // this._handleNextBatchTrigger();
        }
        else {
            const sentinel = (this.load("@masonry>sentinel") || this.render("@masonry>sentinel"));
            root.insertBefore(sentinel, this.load("@masonry>spinner") || null);
            this.observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    const totalInActiveCat = this.#items.filter(item => {
                        if (item instanceof HTMLElement)
                            return false;
                        return this.selectedCategory === null || item.category === this.selectedCategory;
                    }).length;
                    if (entry.isIntersecting && this.displayedCount < totalInActiveCat) {
                        this._handleNextBatchTrigger();
                    }
                });
            }, { rootMargin: '200px' });
            this.observer.observe(sentinel);
        }
        this._handleNextBatchTrigger(); // <= panggil dulu supaya first load ga kosong
    }
    async _handleNextBatchTrigger() {
        const filteredPool = this.#items.filter(item => this.selectedCategory === null || item.category === this.selectedCategory);
        // 💡 Skenario A: Jika data lokal masih ada, suntikkan langsung brik fotonya ke layar
        if (this.displayedCount < filteredPool.length) {
            this._loadNextBatch();
            return;
        }
        // 💡 Skenario B: Jika data lokal sudah habis, tembak server JIT via loadFn andalan Anda!
        if (typeof this.config.loadFn === "function" && !this.isServerFetching) {
            this.isServerFetching = true;
            this.currentPage++;
            // Letupkan callback laporan waktu tunggu loading dimulai
            if (this.config.onLoadTriggered && typeof this.config.onLoadTriggered === "function") {
                this.config.onLoadTriggered(this.currentPage);
            }
            this.load("@masonry>spinner")?.classList.remove('hidden');
            try {
                console.log(`🚀 [GAS Data Stream] Querying page ${this.currentPage} for category: ${this.selectedCategory}`);
                const freshServerItems = await this.config.loadFn(this.currentPage, this.selectedCategory);
                if (freshServerItems && freshServerItems.length > 0) {
                    // ====================================================
                    // 🔒 RAM LEAK PROTECTION SYSTEM (MANAJEMEN NEGATIVE MEMORY TRACKING)
                    // Jika Galeri Anda super raksasa (ribuan foto), kita kuras array element 
                    // angkatan paling lama dari dalam tabel _nodes pusat sebelum memasukkan yang baru!
                    // ====================================================
                    const itemNodesRecord = Array.from(this.load("@masonry").querySelectorAll(".item"));
                    if (itemNodesRecord.length > 24) {
                        console.log(`🧹 [RAM Shield]: Flushing past batch elements to optimize physical RAM memory.`);
                        // Potong dan hapus 8 elemen fisik pertama dari layar dokumen browser
                        for (let i = 0; i < 8; i++) {
                            const garbageNode = itemNodesRecord.shift();
                            garbageNode?.remove();
                        }
                    }
                    // Gabungkan data baru hantaran server ke dalam saku internal #items ksatria Anda!
                    this.#items = [...this.#items, ...freshServerItems];
                    // Semburkan angkatan baru tersebut langsung ke dinding grid
                    this._loadNextBatch();
                }
                else {
                    // Jika server memutahkan array kosong [], tandanya data di database GAS habis total!
                    console.log(`🏁 [GAS Data Stream] Reach end of server rows database table.`);
                    if (this.config.onScrollEnd && typeof this.config.onScrollEnd === "function")
                        this.config.onScrollEnd(); // Letupkan callback penanda lantai terbawah
                    this._killPaginationControls();
                }
            }
            catch (streamError) {
                console.error(`[GAS Data Stream Error]:`, streamError);
            }
            finally {
                this.isServerFetching = false;
                this.load("@masonry>spinner")?.classList.add('hidden');
            }
        }
    }
    _loadNextBatch() {
        const filtered = this.#items.filter(item => {
            if (item instanceof HTMLElement)
                return false;
            return this.selectedCategory === null || item.category === this.selectedCategory;
        });
        const start = this.displayedCount;
        const end = Math.min(start + this.config.maxDisplayed, filtered.length);
        this._syncColumnCount();
        if (start >= end)
            return;
        const spinner = this.load("@masonry>spinner");
        spinner?.classList.remove('hidden');
        const fragment = document.createDocumentFragment();
        // Hitung index modal dari item yang SUDAH ter-render di grid (bukan dari tabel _nodes pusat)
        const grid = this.load("@masonry");
        const renderedItems = grid.querySelectorAll(".item");
        let imageIndexCounter = renderedItems.length;
        let batchIndex = 0;
        for (let i = start; i < end; i++) {
            const content = filtered[i];
            let assignedIndex = -1;
            if (!(content instanceof HTMLElement) && (content.image || content.imageUrl)) {
                assignedIndex = imageIndexCounter;
                imageIndexCounter++;
            }
            const item = this._createItem(content, assignedIndex);
            item.style.setProperty('--batch-index', batchIndex.toString());
            batchIndex++;
            fragment.appendChild(item);
        }
        this.load("@masonry").appendChild(fragment);
        this.displayedCount = end;
        // Jika seluruh data (lokal + server hantaran baru) sudah benar-benar habis, matikan kontroler
        if (this.displayedCount >= filtered.length && !this.config.loadFn) {
            this._killPaginationControls();
        }
        setTimeout(() => {
            spinner?.classList.add('hidden');
        }, 200);
        if (this.displayedCount >= filtered.length) {
            if (this.observer)
                this.observer.disconnect();
            this.remove("@masonry>spinner");
        }
    }
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
    _syncColumnCount() {
        const grid = this.load("@masonry");
        if (!grid)
            return;
        const configuredColumns = Math.max(1, Number(this.config.column) || 1);
        grid.style.setProperty("--masonry-columns", String(configuredColumns));
    }
    _killPaginationControls() {
        if (this.observer)
            this.observer.disconnect();
        this.remove("@masonry>trigger", "@masonry>spinner");
    }
    _renderFilterMenu(categories, selectedCategory) {
        // Seluruh balok menu (tombol "All" + kategori + slider) dirakit oleh template()
        // lewat render("...") — pola Accordion. Di sini hanya menyambungkan wiring pilihan.
        const menu = this.render("@masonry>filter", {
            categories,
            selected: selectedCategory,
            onSelect: (category, activeBtn) => {
                this._handleCategoryChange(category === "All" ? null : category, activeBtn);
            },
        });
        return menu;
    }
    _updateSlider = (activeBtn, isInit = false) => {
        const slider = this.load("@masonry>filter>slider");
        if (!slider || !activeBtn)
            return;
        // 1. Jika inisialisasi awal, matikan transisi agar tidak melompat dari atas/kiri screen
        if (isInit) {
            slider.style.transition = 'none';
        }
        else {
            // Kembalikan ke animasi bawaan jika ini adalah klik manual pengguna
            slider.style.transition = '';
        }
        // 2. Ambil posisi relatif menggunakan offsetLeft & offsetTop yang presisi terhadap induknya
        const leftPosition = activeBtn.offsetLeft;
        const topPosition = activeBtn.offsetTop;
        const width = activeBtn.offsetWidth;
        const height = activeBtn.offsetHeight;
        // 3. Terapkan dimensi dan geser menggunakan translate3d
        slider.style.width = `${width}px`;
        slider.style.height = `${height}px`;
        slider.style.transform = `translate3d(${leftPosition}px, ${topPosition}px, 0)`;
        // 🛡️ RETRY: Jika ukuran belum terhitung (0), tunggu frame berikutnya lalu ukur ulang
        if (activeBtn.offsetWidth === 0 && isInit) {
            requestAnimationFrame(() => {
                this._updateSlider(activeBtn, true);
            });
            return;
        }
        // 🎯 INIT SETTLE CORRECTION (FIX POSISI SLIDER NYUNGKUR KE BAWAH):
        // rAF pertama sering berjalan SELAGI layout flex-wrap & font menu masih bergeser,
        // sehingga offsetTop tombol aktif saat itu tertolak ke baris bawah. Alih-alih hanya
        // mengandalkan offsetWidth, kita ukur ulang setelah browser tuntas menggambar layout
        // (double-rAF + jeda mikro timeout) agar slider menempel presisi ke tombol aktif.
        if (isInit) {
            const settle = () => this._measureSlider(activeBtn);
            requestAnimationFrame(() => requestAnimationFrame(settle));
            window.setTimeout(settle, 350);
        }
        // 4. Jika baru diinisialisasi, hidupkan kembali transisinya di frame berikutnya agar klik berikutnya lancar
        if (isInit) {
            requestAnimationFrame(() => {
                // Berikan jeda mikro agar browser menerapkan posisi "none" terlebih dahulu
                setTimeout(() => {
                    slider.style.transition = '';
                }, 50);
            });
        }
    };
    /**
     * Pengukur ulang slider dengan transisi dimatikan (untuk koreksi posisi saat init).
     * Dipisah dari _updateSlider agar panggilan berulang warnanya bersih tanpa animasi lompat.
     */
    _measureSlider = (activeBtn) => {
        const slider = this.load("@masonry>filter>slider");
        if (!slider || !activeBtn)
            return;
        slider.style.transition = 'none';
        slider.style.width = `${activeBtn.offsetWidth}px`;
        slider.style.height = `${activeBtn.offsetHeight}px`;
        slider.style.transform = `translate3d(${activeBtn.offsetLeft}px, ${activeBtn.offsetTop}px, 0)`;
        // Nyalakan kembali transisi di frame berikutnya agar interaksi klik tetap mulus
        requestAnimationFrame(() => {
            slider.style.transition = '';
        });
    };
    _handleCategoryChange(category, activeBtn) {
        // Update class active pada tombol menu
        const splitActive = "active";
        this.load("@masonry>filter")?.querySelectorAll(".item").forEach(btn => {
            btn.classList.remove(splitActive);
        });
        activeBtn.classList.add(splitActive);
        this._updateSlider(activeBtn);
        // Simpan ke config & jalankan re-render
        this.selectedCategory = category;
        // console.log({ selectedCategory: this.selectedCategory })
        this._applyFilter(category);
    }
    _applyFilter(category) {
        if (this.observer) {
            this.observer.disconnect();
            this.observer = undefined;
        }
        // Drop the builder's handles on the old cards **before** the nodes leave the document:
        // each card carries its own `onclick` into `modal.show`, so nothing else has to walk a
        // listener list — replacing the children collects the handlers with the nodes.
        this.remove("@masonry>item", "@masonry>item>actions", "@masonry>item>image", "@masonry>item>title", "@masonry>item>desc", "@masonry>spinner", "@masonry>trigger");
        const grid = this.load("@masonry");
        grid.replaceChildren();
        this.displayedCount = 0;
        this.currentPage = 1;
        this.selectedCategory = category;
        this._syncColumnCount();
        const container = this.load("@container");
        this._createSpinner(container);
        this._initPaginationTrigger(container);
    }
    _createSpinner(root) {
        const spinner = (this.load("@masonry>spinner") || this.render("@masonry>spinner"));
        root.appendChild(spinner);
    }
    _createItem(content, modalIndex) {
        // Bangun seluruh jeroan kartu (gambar, judul, deskripsi, aksi) secara rekursif
        // lewat template() — pola Accordion. Di sini hanya menyalakan perilaku animasi.
        const card = this.render("@masonry>item", { item: content, modalIndex });
        // SAFE CLASS REMOVAL: Menggunakan `animationend` untuk melepas class animasi
        // tanpa risiko bug macet (lebih andal daripada setTimeout)
        card?.addEventListener('animationend', () => {
            card.classList.remove("is-fade-in");
        }, { once: true });
        return card;
    }
    /**
     * The lightbox: one record at a time, re-rendered per open.
     *
     * The markup is `template()`'s, so opening a card is a `render("@masonry>modal", payload)`
     * with the record reduced to what the modal shows. Nothing here writes text or touches an
     * `img` — that is why this method is only about payload, wiring and teardown.
     */
    _initModal() {
        let currentIndex = 0;
        let isModalOpen = false;
        let modalEl = null;
        const container = this.load("@container");
        /** What the modal shows of a record: the grid is a preview, so the text comes along. */
        const payloadOf = (record) => ({
            image: record.image || record.imageUrl || "",
            title: record.title,
            description: record.description,
        });
        const hide = () => {
            if (!modalEl)
                return;
            modalEl.classList.add("hidden");
            isModalOpen = false;
        };
        const handleKeyDown = (event) => {
            if (!isModalOpen)
                return;
            if (event.key === 'ArrowRight') {
                event.preventDefault();
                show(currentIndex + 1);
            }
            if (event.key === 'ArrowLeft') {
                event.preventDefault();
                show(currentIndex - 1);
            }
            if (event.key === 'Escape') {
                event.preventDefault();
                hide();
            }
        };
        /** A click on the backdrop (i.e. outside the stage) closes the lightbox. */
        const handleBackdropClick = (event) => {
            if (event.target === modalEl)
                hide();
        };
        /**
         * Wires one freshly rendered lightbox. The arrow handlers read `currentIndex` live, so
         * a re-render can never leave them pointing at a record that is no longer shown — which
         * is why nothing outside has to refresh them.
         */
        const wire = (element) => {
            element.setAttribute('tabindex', '-1');
            element.addEventListener('keydown', handleKeyDown);
            element.addEventListener('click', handleBackdropClick);
            const close = element.querySelector(".close");
            const next = element.querySelector(".next");
            const previous = element.querySelector(".previous");
            if (close)
                close.onclick = hide;
            if (next)
                next.onclick = () => show(currentIndex + 1);
            if (previous)
                previous.onclick = () => show(currentIndex - 1);
        };
        const show = (index) => {
            const records = this.currentVisibleRecords;
            if (!records.length)
                return;
            currentIndex = (index + records.length) % records.length;
            // Drop the previous lightbox through the builder, so no orphan node keeps a second
            // set of handlers alive; `render()` then owns the new one under the same key.
            if (modalEl)
                this.remove("@masonry>modal");
            modalEl = this.render("@masonry>modal", payloadOf(records[currentIndex]));
            wire(modalEl);
            container.appendChild(modalEl);
            modalEl.classList.remove("hidden");
            isModalOpen = true;
            setTimeout(() => modalEl?.focus(), 50);
        };
        const destroy = () => {
            // The handlers on `.close` / `.next` / `.previous` are own properties of nodes that
            // leave with the modal; only the two on the overlay itself need unhooking — they
            // close over `show`, and a document-level keydown is what used to pin the gallery.
            modalEl?.removeEventListener('keydown', handleKeyDown);
            modalEl?.removeEventListener('click', handleBackdropClick);
            modalEl?.remove();
            modalEl = null;
            isModalOpen = false;
        };
        return { show, destroy };
    }
}
//# sourceMappingURL=Masonry.js.map