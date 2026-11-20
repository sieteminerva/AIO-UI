import { Builder } from "@aio-ui/base";
import { Skeleton } from "@aio-ui/skeleton";
import { DEFAULT_MENU_SELECTORS } from "./Menu.kit.js";
import { splitMenuContent } from "./Menu.engine.js";
export class MenuBuilder extends Builder {
    builderId = "menu";
    name = "menu";
    stylesheet = "./Menu.css";
    static contract = {
        schema: {
            t: "record",
            open: true,
            of: {
                brand: { t: "any" },
                actions: { t: "list", of: { t: "any" } },
                navigations: {
                    t: "list",
                    single: true,
                    of: {
                        t: "record",
                        open: true,
                        of: {
                            label: { t: "string" },
                            href: { t: "string" },
                            className: { t: "string" },
                        },
                    },
                },
            },
        },
        example: {
            navigations: [
                { label: "Home", href: "#home" },
                { label: "Contact", href: "tel:+620000", className: "button" },
            ],
        },
    };
    isMenuOpened = false;
    /**
     * 🪶 LOADING MOCKUP — brand, four navigation labels and the action button, drawn with the
     * mandatory `@aio-ui/skeleton` primitive. One row serves both the horizontal bar and the
     * sidebar: the sheet that is still missing is the one that decides the direction.
     */
    loading() {
        return Skeleton.create({
            shape: "row",
            gap: "1rem",
            children: [
                { shape: "bone", width: "5rem", height: "1.75rem" },
                { shape: "line", width: "3rem", count: 4 },
                { shape: "bone", width: "2.5rem", height: "1.75rem" },
            ],
        });
    }
    constructor(config = {}) {
        super(); // Wajib mengetuk pintu rahim induk BuilderBase
        const defaultSelectors = DEFAULT_MENU_SELECTORS;
        const defaultConfig = {
            themeId: "default",
            defaultRoute: "home",
            routes: ["home", "package", "gallery", "dashboard", "wizard"],
            emit: () => { },
            onNavigate(href) { return href ? true : false; },
            namespace: null,
            position: "top",
            multilevel: null,
            ...config,
            // 🛡️ MERGE SELECTORS TERPISAH: Jangan biarkan `...config` menggantikan seluruh
            // defaultSelectors dengan selectors parsial (mis. createSidebar hanya mengirim
            // `{ "@menu": { id } }`). Gabungkan override di ATAS default yang utuh.
            selectors: {
                ...defaultSelectors,
                ...(config?.selectors || {})
            }
        };
        this.config = this.resolveConfig(defaultConfig, config);
    }
    prepare(content, _config) {
        // The registry hands the payload directly: `{ navigations }`, never a `{ content }` wrapper.
        const payload = this.resolvePayload(content);
        const nav = this.render("@menu", payload["@menu"]);
        const brand = this.render("@menu>brand", payload["@menu>brand"]);
        const hamburger = this.render("@menu>hamburger", payload["@menu>hamburger"]);
        const navigations = this.render("@menu>navigations", payload["@menu>navigations"]);
        const actions = this.render("@menu>actions", payload["@menu>actions"]);
        if (brand)
            nav.appendChild(brand);
        if (hamburger)
            nav.appendChild(hamburger);
        if (navigations) {
            // The toggle needs a target to point at, and both sides must agree on the id.
            navigations.id = "primary-navigations";
            nav.appendChild(navigations);
            hamburger?.setAttribute("aria-controls", navigations.id);
        }
        if (actions)
            nav.appendChild(actions);
        // `type` decides the shell, not the content: a sidebar is the same nav in a wrapper.
        if (this.config.position === "left" || this.config.position === "right") {
            const sidebar = this.render("@container", content);
            sidebar.appendChild(nav);
            return sidebar;
        }
        return nav;
    }
    // ====================================================
    // 🧙‍♂️ OVERRIDE 1: ABSTRAKSI PETA DATA (MURNI KHUSUS UNTUK DATA MENU)
    // ====================================================
    /**
     * Maps one flat navigation list onto the keys `template()` expects. The splitting rule
     * itself lives in `splitMenuContent()` so it can be tested on its own.
     */
    resolvePayload(content) {
        const { brand, navigations, actions } = splitMenuContent(content);
        return {
            "@menu": content,
            "@menu>brand": brand,
            "@menu>hamburger": {},
            "@menu>navigations": navigations,
            "@menu>navigations>item": null,
            "@menu>menus": null,
            "@menu>menus>item": null,
            "@menu>actions": actions,
        };
    }
    initialize(root) {
        const nav = root ?? this.load("@menu");
        if (!nav)
            return;
        const hamburger = nav.querySelector(".hamburger-btn");
        const navigations = nav.querySelector(".navigations");
        // A menu without a toggle is a valid menu (desktop-only, or a sidebar). No warning.
        if (!hamburger || !navigations)
            return;
        this.hamburger = hamburger;
        this.navigations = navigations;
        hamburger.removeEventListener("click", this.handleToggle);
        hamburger.addEventListener("click", this.handleToggle);
        nav.removeEventListener("keydown", this.handleEscape);
        nav.addEventListener("keydown", this.handleEscape);
        // Reflect the current state on first paint, so `aria-expanded` is never a lie.
        this.setOpen(this.isMenuOpened);
    }
    hamburger = null;
    navigations = null;
    handleEscape = (event) => {
        if (event.key === "Escape")
            this.closeSubmenus();
    };
    handleToggle = () => {
        this.isMenuOpened = !this.isMenuOpened;
        let isDefaultPrevented = false;
        this.config.emit?.("builder:menu-toggle", {
            opened: this.isMenuOpened,
            element: this.hamburger,
            preventDefault: () => { isDefaultPrevented = true; },
        });
        if (isDefaultPrevented) {
            // The listener already answered: keep internal state where the host expects it.
            this.isMenuOpened = !this.isMenuOpened;
            return;
        }
        this.setOpen(this.isMenuOpened);
    };
    setOpen(open) {
        this.navigations?.classList.toggle("open", open);
        this.hamburger?.classList.toggle("active", open);
        this.hamburger?.setAttribute("aria-expanded", open ? "true" : "false");
    }
    // ====================================================
    // 🧙‍♂️ OVERRIDE 2: PERAKIT STRUKTUR CONTENT DEFAULT FALLBACK KOMPONEN MENU
    // ====================================================
    template(typeKey, el, payload, props) {
        // if (!payload) return;
        switch (typeKey) {
            case "@container":
                // console.log({ payload })
                if (payload.id)
                    el.id = payload.id;
                break;
            case "@menu":
                el.dataset.position = this.config.position;
                // The activation is a css hook on the bar, not a per-item class: the sheet owns
                // *when* a branch opens, the builder only says *how* the host asked for it.
                // A function activation is the host's own wiring, so there is nothing to stamp.
                if (this.config.multilevel && typeof this.config.multilevel.activation === "string") {
                    el.dataset.multilevel = this.config.multilevel.activation;
                }
                break;
            case "@menu>brand":
                // The brand is a link like any other: one key, no bespoke anchor.
                const brandLink = this.render("@menu>item>link", payload);
                if (brandLink)
                    el.appendChild(brandLink);
                break;
            case "@menu>navigations":
                this.paintList(el, payload, "@menu>navigations>item");
                break;
            case "@menu>menus":
                this.paintList(el, payload, "@menu>menus>item");
                break;
            case "@menu>navigations>item":
            case "@menu>menus>item":
                this.paintItem(el, payload);
                break;
            case "@menu>item>link": {
                if (payload?.className) {
                    for (const token of String(payload.className).split(/\s+/).filter(Boolean)) {
                        el.classList.add(token);
                    }
                }
                if (payload?.src) {
                    const img = document.createElement("img");
                    img.src = payload.src;
                    img.alt = payload.label || "logo";
                    img.className = "brand-image";
                    el.appendChild(img);
                }
                else if (payload?.label) {
                    el.textContent = payload.label;
                }
                if (payload?.icon) {
                    const icon = this.render("@menu>item>icon", payload.icon);
                    el.appendChild(icon);
                }
                if (payload?.attrs) {
                    for (const key in payload.attrs) {
                        if (!Object.hasOwn(payload.attrs, key))
                            continue;
                        const value = payload.attrs[key];
                        el.setAttribute(key, value);
                    }
                }
                if (payload?.onClick && typeof payload.onClick === "function") {
                    el.addEventListener("click", payload.onClick);
                }
                else {
                    this.bindNavigation(el, payload?.href);
                }
                break;
            }
            case "@menu>item>icon":
                // console.log({ el, payload })
                el.className = payload;
                break;
            case "@menu>actions": {
                // One link per action, flat: `div.actions` is not a list, so nesting `li` in it
                // (the previous behaviour) produced invalid markup and duplicated the CTA.
                const actions = Array.isArray(payload) ? payload : [];
                for (const action of actions) {
                    const link = this.render("@menu>item>link", action);
                    if (link) {
                        link.classList.add("item");
                        el.appendChild(link);
                    }
                }
                break;
            }
            case ("@menu>hamburger"):
                if (props.tagName?.toLowerCase() === "button")
                    el.type = "button";
                el.setAttribute("aria-expanded", "false");
                // Built as nodes rather than an innerHTML literal: the icon is markup, and markup
                // does not belong in a component's template hook.
                if (!el.firstChild) {
                    const svgNs = "http://www.w3.org/2000/svg";
                    const svg = document.createElementNS(svgNs, "svg");
                    svg.setAttribute("width", "24");
                    svg.setAttribute("height", "24");
                    svg.setAttribute("viewBox", "0 0 24 24");
                    svg.setAttribute("fill", "none");
                    svg.setAttribute("stroke", "currentColor");
                    svg.setAttribute("stroke-width", "2");
                    svg.setAttribute("aria-hidden", "true");
                    const path = document.createElementNS(svgNs, "path");
                    path.setAttribute("d", "M3 12h18M3 6h18M3 18h18");
                    svg.appendChild(path);
                    el.appendChild(svg);
                }
                break;
        }
    }
    // ====================================================
    // 🪜 MULTI-LEVEL: one list shape, iterated recursively
    // ====================================================
    /**
     * The children of one entry, or `null` when it is a leaf.
     *
     * The holding property is the host's choice (`config.multilevel.property`), so the data
     * keeps whatever shape it already had — `children`, `menus`, `submenu`. There is no depth
     * limit because nothing here recurses by hand: `paintList()` renders `@menu>menus`, and
     * each of those items comes straight back through this method.
     */
    childrenOf(entry) {
        const property = this.config.multilevel?.property ?? "children";
        const raw = entry?.[property];
        if (!raw)
            return null;
        const children = Array.isArray(raw) ? raw : [raw];
        return children.length ? children : null;
    }
    paintList(list, payload, itemKey) {
        const entries = Array.isArray(payload) ? payload : payload ? [payload] : [];
        for (const entry of entries) {
            const item = this.render(itemKey, entry);
            if (item)
                list.appendChild(item);
        }
    }
    /**
     * One `li`. A leaf is a link; a branch is a link plus the same `.menus` list one level
     * down, marked `.submenu` so the sheet knows it is a disclosure.
     *
     * A branch never navigates — its click belongs to the disclosure. A group that is also a
     * page is expressed by making that page its first child, otherwise one click would have
     * to mean two things and the pointer would get whichever handler happened to run first.
     */
    paintItem(item, payload) {
        const children = this.childrenOf(payload);
        const activation = this.config.multilevel?.activation ?? "hover";
        if (!children) {
            const leaf = this.render("@menu>item>link", payload);
            if (leaf)
                item.appendChild(leaf);
            return;
        }
        item.classList.add("submenu");
        item.classList.toggle("open", activation === "always");
        item.classList.toggle("closed", activation !== "always");
        // A branch lights up when the route lives under it, so the bar still says where you are.
        if (children.some((child) => /\bis-active\b/.test(String(child?.className ?? "")))) {
            item.classList.add("is-active");
        }
        const isOpen = item.classList.contains("open");
        // Supplying `onClick` short-circuits `bindNavigation()` in the link template, which is
        // what keeps a branch off the route table even when it carries no `href` of its own.
        const link = this.render("@menu>item>link", {
            ...payload,
            // The disclosure glyph is the shared icon set, never a bespoke caret: a branch is
            // handed the closed arrow unless the data named an icon of its own.
            icon: payload?.icon ?? "icon arrow right",
            onClick: (event) => {
                event.preventDefault();
                if (activation === "click")
                    this.toggleSubmenu(item);
                payload?.onClick?.(event);
            },
        });
        if (!link)
            return;
        link.setAttribute("aria-haspopup", "true");
        link.setAttribute("aria-expanded", String(isOpen));
        // A branch has no `href` on purpose, and an anchor without one is neither focusable nor
        // keyboard-operable. Restore both instead of inventing a `href="#"` that would pollute
        // the history.
        link.setAttribute("tabindex", "0");
        link.setAttribute("role", "button");
        link.addEventListener("keydown", (event) => {
            if (event.key !== "Enter" && event.key !== " ")
                return;
            event.preventDefault();
            link.click();
        });
        item.appendChild(link);
        const nested = this.render("@menu>menus", children);
        if (nested)
            item.appendChild(nested);
    }
    toggleSubmenu(item) {
        const open = item.classList.toggle("open");
        item.classList.toggle("closed", !open);
        item.querySelector(":scope > a")?.setAttribute("aria-expanded", String(open));
    }
    /** Escape closes what a click opened. A hover branch closes by leaving it. */
    closeSubmenus() {
        if (this.config.multilevel?.activation === "always")
            return;
        const nav = this.load("@menu");
        for (const item of nav?.querySelectorAll(".item.submenu.open") ?? []) {
            item.classList.remove("open");
            item.classList.add("closed");
            item.querySelector(":scope > a")?.setAttribute("aria-expanded", "false");
        }
    }
    navigate(href) {
        if (href)
            window.location.hash = href.replace(/^#/, "");
    }
    bindNavigation(element, href) {
        let rawTargetHref = (href || element.getAttribute("href") || this.config.defaultRoute || "home").trim();
        if (rawTargetHref.includes(window.location.origin) || rawTargetHref.includes(window.location.host)) {
            if (rawTargetHref.includes("#")) {
                rawTargetHref = rawTargetHref.split("#").filter(Boolean).filter(part => !part.includes("://") && !part.includes("localhost") && !part.includes(".com")).join("#").trim();
            }
        }
        element.href = rawTargetHref.startsWith("#") ? rawTargetHref : `#${rawTargetHref}`;
        element.addEventListener("click", (e) => {
            e.preventDefault();
            if (!rawTargetHref.includes("://") && !rawTargetHref.startsWith("//") && !rawTargetHref.startsWith("www.")) {
                let cleanRoute = String(rawTargetHref).replace(/^#/, "").trim();
                if (cleanRoute.includes(":"))
                    cleanRoute = String(cleanRoute.split(":")[0]).trim();
                if (cleanRoute.includes("?"))
                    cleanRoute = String(cleanRoute.split("?")[0]).trim();
                const finalRouteString = cleanRoute || "home";
                const handled = this.config.onNavigate(finalRouteString);
                if (handled === true)
                    return;
                this.navigate(finalRouteString);
            }
            else {
                window.open(rawTargetHref, "_blank");
            }
        });
    }
}
//# sourceMappingURL=Menu.js.map