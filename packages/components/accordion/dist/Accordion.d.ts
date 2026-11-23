import type { iBasicNode, iBuilderConfig, iContentContract } from "@aio-ui/core";
import { Builder } from "@aio-ui/base";
export type AccordionElementType = "@accordion" | "@accordion>section" | "@accordion>section>title" | "@accordion>section>content";
export interface iAccordionConfig extends iBuilderConfig<AccordionElementType> {
    /** Look of the panels. `compact` tightens padding and radius through the same tokens. */
    appearance?: "compact" | "default";
    /** One open section closes the other: every `<details>` shares one native `name`. */
    autoClose?: boolean;
    /** Sections open on first render: all of them, or only the keys listed. */
    expanded?: boolean | string[];
    /** Open/close motion. `false` turns it off; an object carries `@keyframes` names. */
    animation?: boolean | "slide" | "fade" | "slide-fade" | {
        in?: string;
        out?: string;
    };
}
export declare class AccordionBuilder extends Builder<AccordionElementType, iAccordionConfig> {
    readonly builderId = "accordion";
    readonly name = "accordion";
    readonly stylesheet = "./Accordion.css";
    static readonly contract: iContentContract;
    /** The shared `name` when `autoClose` is on — one group per builder instance, so two
     *  accordions on one page never close each other's sections. */
    readonly group: string;
    /**
     * 🪶 LOADING MOCKUP — one open panel between two closed headers, drawn with the mandatory
     * `@aio-ui/skeleton` primitive. `Accordion.css` is the sheet that is still on its way, so
     * the skin cannot come from it; the rhythm comes from the spec instead.
     */
    protected loading(): HTMLElement;
    constructor(config?: Partial<iAccordionConfig>);
    prepare(data: iBasicNode, _config?: Partial<iAccordionConfig>): HTMLElement;
    initialize(): void;
    protected template(typeKey: AccordionElementType, el: HTMLElement, payload?: any): void;
    /** Root-level look and behaviour: `data-appearance`, `data-animation`, the shared `name`
     *  group that makes `autoClose` native, and the sections that start open. */
    private behaviour;
    /** `expanded: true` opens everything — or only index 0 when `autoClose` makes that the
     *  only section that can stay open. An array opens the sections whose key it lists. */
    private opens;
    private keyOf;
}
//# sourceMappingURL=Accordion.d.ts.map