import type { iElementProperty, iBasicNode, iBuilderConfig, iContentContract } from "@aio-ui/core";
import { Builder } from "@aio-ui/base";
import type { MenuElementType } from "./Menu.kit";
type MenuPositionType = "top" | "top sticky" | "left" | "left sticky" | "right" | "right sticky" | "bottom" | "bottom sticky";
interface iMultilevelMenuConfig {
    activation: "always" | "hover" | "click" | Function;
    property: string;
    multicolumn: boolean;
}
export interface iMenuConfig extends iBuilderConfig<MenuElementType> {
    /**
     * TOTAL EXTRACTED SELECTORS (Semua elemen diekstrak utuh ke sini!)
     */
    selectors: Record<MenuElementType, iElementProperty>;
    /** Default route */
    defaultRoute?: string;
    /** Default route */
    themeId?: string;
    /** Valid application routes */
    routes?: string[];
    position?: MenuPositionType;
    multilevel?: iMultilevelMenuConfig | null;
    onNavigate?: (href?: string) => boolean;
}
export interface iMenuSplit {
    brand: iElementProperty;
    navigations: iElementProperty[];
    actions: iElementProperty[];
}
export declare class MenuBuilder extends Builder<MenuElementType, iMenuConfig> {
    readonly builderId = "menu";
    readonly name = "menu";
    readonly stylesheet = "./Menu.css";
    static readonly contract: iContentContract;
    protected isMenuOpened: boolean;
    /**
     * 🪶 LOADING MOCKUP — brand, four navigation labels and the action button, drawn with the
     * mandatory `@aio-ui/skeleton` primitive. One row serves both the horizontal bar and the
     * sidebar: the sheet that is still missing is the one that decides the direction.
     */
    protected loading(): HTMLElement;
    constructor(config?: Partial<iMenuConfig>);
    prepare(content: iBasicNode, _config?: Partial<iMenuConfig>): HTMLElement;
    /**
     * Maps one flat navigation list onto the keys `template()` expects. The splitting rule
     * itself lives in `splitMenuContent()` so it can be tested on its own.
     */
    protected resolvePayload(content: iBasicNode): Record<MenuElementType, any>;
    initialize(root?: HTMLElement): void;
    private hamburger;
    private navigations;
    private handleEscape;
    private handleToggle;
    private setOpen;
    protected template(typeKey: MenuElementType, el: HTMLElement, payload: any, props: iElementProperty): void;
    /**
     * The children of one entry, or `null` when it is a leaf.
     *
     * The holding property is the host's choice (`config.multilevel.property`), so the data
     * keeps whatever shape it already had — `children`, `menus`, `submenu`. There is no depth
     * limit because nothing here recurses by hand: `paintList()` renders `@menu>menus`, and
     * each of those items comes straight back through this method.
     */
    private childrenOf;
    private paintList;
    /**
     * One `li`. A leaf is a link; a branch is a link plus the same `.menus` list one level
     * down, marked `.submenu` so the sheet knows it is a disclosure.
     *
     * A branch never navigates — its click belongs to the disclosure. A group that is also a
     * page is expressed by making that page its first child, otherwise one click would have
     * to mean two things and the pointer would get whichever handler happened to run first.
     */
    private paintItem;
    private toggleSubmenu;
    /** Escape closes what a click opened. A hover branch closes by leaving it. */
    private closeSubmenus;
    navigate(href?: string): void;
    protected bindNavigation(element: HTMLAnchorElement, href?: string): void;
}
export {};
//# sourceMappingURL=Menu.d.ts.map