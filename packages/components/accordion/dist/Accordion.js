import { Builder } from "@aio-ui/base";
import { Skeleton } from "@aio-ui/skeleton";
export class AccordionBuilder extends Builder {
    builderId = "accordion";
    name = "accordion";
    stylesheet = "./Accordion.css";
    static contract = {
        schema: {
            t: "list",
            single: true,
            of: { t: "record", open: true, of: { title: { t: "string" }, description: { t: "string" } } },
        },
        example: [{ title: "Shipping", description: "Delivered in two working days." }],
    };
    /** The shared `name` when `autoClose` is on — one group per builder instance, so two
     *  accordions on one page never close each other's sections. */
    group = `accordion-${Math.random().toString(36).slice(2, 8)}`;
    /**
     * 🪶 LOADING MOCKUP — one open panel between two closed headers, drawn with the mandatory
     * `@aio-ui/skeleton` primitive. `Accordion.css` is the sheet that is still on its way, so
     * the skin cannot come from it; the rhythm comes from the spec instead.
     */
    loading() {
        return Skeleton.create({
            shape: "stack",
            children: [
                { shape: "bone", height: "3rem" },
                { shape: "line", count: 3 },
                { shape: "bone", height: "3rem", count: 2 },
            ],
        });
    }
    constructor(config = {}) {
        super();
        const defaultConfig = {
            themeId: "default",
            selectors: {
                "@accordion": { tagName: "div", className: "accordion" },
                "@accordion>section": { tagName: "details" },
                "@accordion>section>title": { tagName: "summary" },
                "@accordion>section>content": { tagName: "div", className: "content" },
            },
            namespace: null,
            emit: () => { },
            appearance: "default",
            autoClose: false,
            expanded: false,
            animation: true
        };
        this.config = this.resolveConfig(defaultConfig, config);
    }
    prepare(data, _config) {
        // The registry hands the item list directly; there is no `{ content }` envelope to unwrap.
        const items = (Array.isArray(data) ? data : [data]).filter(Boolean);
        return this.render("@accordion", items);
    }
    initialize() {
        // console.log(`[Section Runtime Active] Section DOM tree with ID successfully mounted and initialized.`);
    }
    template(typeKey, el, payload) {
        switch (typeKey) {
            case "@accordion": {
                const items = payload;
                const sections = items.map((item) => this.render("@accordion>section", item));
                el.append(...sections);
                this.behaviour(el, sections, items);
                break;
            }
            case "@accordion>section":
                // The leaf cases below own the fallback copy, so only the record itself is guarded.
                if (!payload)
                    return;
                const title = this.render("@accordion>section>title", payload.title);
                const content = this.render("@accordion>section>content", payload.description);
                el.append(title, content);
                break;
            case "@accordion>section>title":
                el.textContent = payload || "Untitled Header";
                break;
            case "@accordion>section>content":
                if (payload instanceof HTMLElement) {
                    el.appendChild(payload);
                }
                else {
                    // Anything that is not a live element is prose: a string, or the fallback label
                    // when a record arrived without a description.
                    const p = document.createElement("p");
                    p.className = "desc";
                    p.textContent = typeof payload === "string" && payload ? payload : "Untitled Content";
                    el.appendChild(p);
                }
                break;
            // Pos selektor pembungkus murni (@container, @accordion, @content) 
            // dilewati secara pasif karena tag & kelasnya sudah otomatis di-inject di atas!
        }
    }
    /** Root-level look and behaviour: `data-appearance`, `data-animation`, the shared `name`
     *  group that makes `autoClose` native, and the sections that start open. */
    behaviour(root, sections, items) {
        if (this.config.appearance !== "default") {
            root.dataset.appearance = this.config.appearance;
        }
        const animation = this.config.animation;
        if (animation === false) {
            root.dataset.animation = "none";
        }
        else if (typeof animation === "string") {
            root.dataset.animation = animation;
        }
        else if (animation && typeof animation === "object") {
            // Keyframe names from `@aio-ui/modules/animations`. A native close fires in one
            // frame, so `out` has nothing to attach to and is not wired here.
            root.dataset.animation = "custom";
            root.style.setProperty("--accordion-anim-in-name", animation.in ?? "none");
        }
        sections.forEach((section, index) => {
            if (this.config.autoClose)
                section.setAttribute("name", this.group);
            if (this.opens(index, items[index]))
                section.setAttribute("open", "");
        });
    }
    /** `expanded: true` opens everything — or only index 0 when `autoClose` makes that the
     *  only section that can stay open. An array opens the sections whose key it lists. */
    opens(index, item) {
        const { expanded, autoClose } = this.config;
        if (expanded === true)
            return autoClose ? index === 0 : true;
        if (!Array.isArray(expanded))
            return false;
        const key = this.keyOf(item);
        return key !== null && expanded.map(String).includes(key);
    }
    keyOf(item) {
        if (!item || typeof item !== "object")
            return null;
        const record = item;
        const key = record.id ?? record.key ?? record.title;
        return key === undefined || key === null ? null : String(key);
    }
}
//# sourceMappingURL=Accordion.js.map