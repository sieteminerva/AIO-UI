import type { iBasicNode, iBuilderConfig } from "@aio-ui/core/interface";
import { Builder } from "@aio-ui/base";
import { Skeleton } from "@aio-ui/skeleton";

export type AccordionElementType =
  | "@accordion"
  | "@accordion>section"
  | "@accordion>section>title"
  | "@accordion>section>content"

export interface iAccordionConfig extends iBuilderConfig<AccordionElementType> {
  /** Look of the panels. `compact` tightens padding and radius through the same tokens. */
  appearance?: "compact" | "default";
  /** One open section closes the other: every `<details>` shares one native `name`. */
  autoClose?: boolean;
  /** Sections open on first render: all of them, or only the keys listed. */
  expanded?: boolean | string[];
  /** Open/close motion. `false` turns it off; an object carries `@keyframes` names. */
  animation?: boolean | "slide" | "fade" | "slide-fade" | { in?: string; out?: string };
}

export class AccordionBuilder extends Builder<AccordionElementType, iAccordionConfig> {
  readonly builderId = "accordion";
  readonly name = "accordion";
  readonly stylesheet = "./Accordion.css";

  /** The shared `name` when `autoClose` is on — one group per builder instance, so two
   *  accordions on one page never close each other's sections. */
  readonly group = `accordion-${Math.random().toString(36).slice(2, 8)}`;

  /**
   * 🪶 LOADING MOCKUP — one open panel between two closed headers, drawn with the mandatory
   * `@aio-ui/skeleton` primitive. `Accordion.css` is the sheet that is still on its way, so
   * the skin cannot come from it; the rhythm comes from the spec instead.
   */
  protected loading(): HTMLElement {
    return Skeleton.create({
      shape: "stack",
      children: [
        { shape: "bone", height: "3rem" },
        { shape: "line", count: 3 },
        { shape: "bone", height: "3rem", count: 2 },
      ],
    });
  }

  constructor(config: Partial<iAccordionConfig> = {}) {
    super();
    const defaultConfig: Required<iAccordionConfig> = {
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
    }

    this.config = this.resolveConfig<iAccordionConfig>(defaultConfig, config);
  }

  public prepare(data: iBasicNode, _config?: Partial<iAccordionConfig>): HTMLElement {
    // The registry hands the item list directly; there is no `{ content }` envelope to unwrap.
    const items = (Array.isArray(data) ? data : [data]).filter(Boolean);

    return this.render("@accordion", items) as HTMLElement;
  }

  public initialize(): void {
    // console.log(`[Section Runtime Active] Section DOM tree with ID successfully mounted and initialized.`);
  }

  protected template(typeKey: AccordionElementType, el: HTMLElement, payload?: any): void {
    switch (typeKey) {
      case "@accordion": {
        const items = payload as unknown[];
        const sections = items.map((item) => this.render("@accordion>section", item)!);
        el.append(...sections);
        this.behaviour(el, sections, items);
        break;
      }

      case "@accordion>section":
        // The leaf cases below own the fallback copy, so only the record itself is guarded.
        if (!payload) return;
        const title = this.render("@accordion>section>title", payload.title)!
        const content = this.render("@accordion>section>content", payload.description)!
        el.append(title, content);
        break;

      case "@accordion>section>title":
        el.textContent = payload || "Untitled Header";
        break;

      case "@accordion>section>content":
        if (payload instanceof HTMLElement) {
          el.appendChild(payload);
        } else {
          // Anything that is not a live element is prose: a string, or the fallback label
          // when a record arrived without a description.
          const p = document.createElement("p")
          p.className = "desc"
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
  private behaviour(root: HTMLElement, sections: HTMLElement[], items: unknown[]): void {
    if (this.config.appearance !== "default") {
      root.dataset.appearance = this.config.appearance;
    }

    const animation = this.config.animation;
    if (animation === false) {
      root.dataset.animation = "none";
    } else if (typeof animation === "string") {
      root.dataset.animation = animation;
    } else if (animation && typeof animation === "object") {
      // Keyframe names from `@aio-ui/modules/animations`. A native close fires in one
      // frame, so `out` has nothing to attach to and is not wired here.
      root.dataset.animation = "custom";
      root.style.setProperty("--accordion-anim-in-name", animation.in ?? "none");
    }

    sections.forEach((section, index) => {
      if (this.config.autoClose) section.setAttribute("name", this.group);
      if (this.opens(index, items[index])) section.setAttribute("open", "");
    });
  }

  /** `expanded: true` opens everything — or only index 0 when `autoClose` makes that the
   *  only section that can stay open. An array opens the sections whose key it lists. */
  private opens(index: number, item: unknown): boolean {
    const { expanded, autoClose } = this.config;
    if (expanded === true) return autoClose ? index === 0 : true;
    if (!Array.isArray(expanded)) return false;
    const key = this.keyOf(item);
    return key !== null && expanded.map(String).includes(key);
  }

  private keyOf(item: unknown): string | null {
    if (!item || typeof item !== "object") return null;
    const record = item as Record<string, unknown>;
    const key = record.id ?? record.key ?? record.title;
    return key === undefined || key === null ? null : String(key);
  }
}