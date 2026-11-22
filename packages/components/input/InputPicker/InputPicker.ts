/**
 * InputPicker — a grid of choices behind one control (an icon picker, a swatch board,
 * an image/media gallery).
 *
 * The field type is owned by `InputPicker.inputModules.ts`; this file is the builder
 * the module instantiates. Two looks, one tree:
 *
 *   - `expanded: false` — trigger + a native `popover` panel, anchored to the trigger.
 *     Used where the field sits in a cramped form.
 *   - `expanded: true` — the grid is part of the page: the search box and the cells are
 *     always visible, no popover, no trigger.
 *
 * `#selected` is the single source of truth; `#paint()` pushes it into the DOM. Every
 * write goes through `#paint()` so a caller, a filter and a click can never disagree.
 */

import type { iBuilderConfig } from "@aio-ui/core";
import { Builder } from "@aio-ui/base";

/** Every node this component can render. Order is documentation, not behaviour. */
export const PICKER_KEYS = [
  "@picker",
  "@picker>trigger",
  "@picker>trigger>preview",
  "@picker>trigger>label",
  "@picker>panel",
  "@picker>panel>search",
  "@picker>panel>grid",
  "@picker>panel>grid>option",
  "@picker>panel>grid>option>preview",
  "@picker>panel>grid>option>name",
  "@picker>panel>empty",
  "@picker>value",
  "@picker>visual>icon",
  "@picker>visual>image",
  "@picker>visual>swatch",
] as const;

export type PickerElementType = (typeof PICKER_KEYS)[number];

/** Which visual a cell draws. */
export type PickerKind = "icon" | "image" | "media" | "swatch";

/** One choice. `icon` is a global icon name (`gear`, `user.settings`), `src` an image URL. */
export interface iPickerOption {
  value: string;
  label?: string;
  /** Global `i.icon.<name>` class from `@aio-ui/styles` — `kind: "icon"`. */
  icon?: string;
  /** Image URL — `kind: "image"` / `"media"`. */
  src?: string;
  /** Any CSS colour — `kind: "swatch"`. */
  color?: string;
}

/** What the module hands the builder. */
export interface iPickerPayload {
  id?: string;
  title?: string;
  name?: string;
  placeholder?: string;
  value?: string | string[] | null;
  options?: Array<iPickerOption | string>;
}

export interface iPickerConfig extends iBuilderConfig<PickerElementType> {
  /** What a cell previews: an icon class, an image, or a colour chip. */
  kind?: PickerKind;
  /** `true` prints the grid inline instead of behind the trigger's popover. */
  expanded?: boolean;
  /** Adds the filter box above the grid. */
  searchable?: boolean;
  /** Grid columns. */
  columns?: number;
  /** Lets the visitor pick more than one cell. */
  isMultiple?: boolean;
  placeholder?: string;
}

/** Default shape per key; a theme overrides it through `config.selectors`. */
export const PICKER_SELECTORS: iBuilderConfig<PickerElementType>["selectors"] = {
  // No `wrapper`: `InputBuilder` already mounts the control inside its own `.field` and
  // prints the label, so a second `.field` here would nest one field inside another.
  "@picker": { tagName: "div", className: "picker" },
  "@picker>trigger": { tagName: "button", className: "trigger", attrs: { type: "button" } },
  "@picker>trigger>preview": { tagName: "span", className: "preview" },
  "@picker>trigger>label": { tagName: "span", className: "label" },
  "@picker>panel": { tagName: "div", className: "panel" },
  "@picker>panel>search": { tagName: "input", className: "search" },
  "@picker>panel>grid": { tagName: "div", className: "grid" },
  "@picker>panel>grid>option": { tagName: "button", className: "cell", attrs: { type: "button" } },
  "@picker>panel>grid>option>preview": { tagName: "span", className: "preview" },
  "@picker>panel>grid>option>name": { tagName: "span", className: "name" },
  "@picker>panel>empty": { tagName: "p", className: "empty" },
  "@picker>value": { tagName: "input", className: "value", attrs: { type: "hidden" } },
  "@picker>visual>icon": { tagName: "i", className: "icon" },
  "@picker>visual>image": { tagName: "img", className: "image" },
  "@picker>visual>swatch": { tagName: "span", className: "swatch" },
};

/** Strings are shorthand for `{ value, label }`; everything else is copied as-is. */
function toOptions(list: Array<iPickerOption | string> | undefined): iPickerOption[] {
  return (list ?? []).map((entry) =>
    typeof entry === "string" ? { value: entry, label: entry } : { ...entry, value: String(entry.value) },
  );
}

export class PickerBuilder extends Builder<PickerElementType, iPickerConfig> {
  readonly builderId = "input-picker";
  readonly name = "input-picker";
  /** Short specifier the package maps to `InputPicker.css` — the file-uploader pattern. */
  readonly stylesheet = "./picker.css";

  public config: Required<iPickerConfig>;

  /** Current selection, in pick order. */
  #selected: string[] = [];
  /** Rendered option cells, keyed by value. */
  #cells = new Map<string, HTMLElement>();

  #root: HTMLElement | null = null;
  #trigger: HTMLElement | null = null;
  #label: HTMLElement | null = null;
  #preview: HTMLElement | null = null;
  #panel: HTMLElement | null = null;
  #search: HTMLInputElement | null = null;
  #empty: HTMLElement | null = null;
  #value: HTMLInputElement | null = null;
  #options: iPickerOption[] = [];
  #placeholder = "";

  constructor(config: Partial<iPickerConfig> = {}) {
    super();

    this.config = this.resolveConfig<iPickerConfig>(
      {
        themeId: "default",
        namespace: null,
        emit: () => { },
        selectors: PICKER_SELECTORS,
        kind: "icon",
        expanded: false,
        searchable: true,
        columns: 6,
        isMultiple: false,
        placeholder: "Pilih…",
      },
      config,
    );
  }

  /** The selection as plain strings — what the hidden input and the form see. */
  public get value(): string[] {
    return [...this.#selected];
  }

  /** Adds (or replaces) a selection without a pointer: `multiple` decides which. */
  public select(value: string | string[]): void {
    const next = Array.isArray(value) ? value : [value];
    this.#selected = this.config.isMultiple ? [...new Set(next)] : next.slice(0, 1);
    this.#paint();
  }

  public prepare(data: iPickerPayload = {}): HTMLElement {
    this.#options = toOptions(data.options);
    this.#placeholder = data.placeholder || this.config.placeholder;
    this.#selected = this.#readValue(data.value);
    this.#cells.clear();

    const root = this.render("@picker", data)!;
    this.#root = root;

    if (!this.config.expanded) {
      const trigger = this.render("@picker>trigger", data)!;
      this.#preview = this.render("@picker>trigger>preview", data)!;
      this.#label = this.render("@picker>trigger>label", data)!;
      trigger.append(this.#preview, this.#label);
      trigger.setAttribute("aria-haspopup", "listbox");
      trigger.setAttribute("aria-expanded", "false");
      this.#trigger = trigger;
      root.appendChild(trigger);
    }

    const panel = this.render("@picker>panel", data)!;
    this.#panel = panel;

    if (!this.config.expanded && this.#trigger) {
      // Manual popover: the trigger owns open/close, so no light-dismiss fight with the
      // filter box. Anchored to the trigger when the platform has anchor positioning.
      panel.setAttribute("popover", "manual");
      const anchor = `--picker-${Math.random().toString(36).slice(2, 8)}`;
      this.#trigger.style.setProperty("anchor-name", anchor);
      panel.style.setProperty("position-anchor", anchor);
    }

    if (this.config.searchable) {
      const search = this.render("@picker>panel>search", data)! as HTMLInputElement;
      search.type = "search";
      search.placeholder = "Filter…";
      search.setAttribute("aria-label", `${data.title ?? "Pilihan"}: filter`);
      this.#search = search;
      panel.appendChild(search);
    }

    const grid = this.render("@picker>panel>grid", data)!;
    for (const option of this.#options) {
      const cell = this.render("@picker>panel>grid>option", option)!;
      cell.dataset.value = option.value;
      cell.setAttribute("role", "option");

      const visual = this.render("@picker>panel>grid>option>preview", option)!;
      const name = this.render("@picker>panel>grid>option>name", option)!;
      visual.appendChild(this.#visual(option));
      cell.append(visual, name);

      if (option.label || option.value) cell.title = option.label ?? option.value;

      this.#cells.set(option.value, cell);
      grid.appendChild(cell);
    }

    const empty = this.render("@picker>panel>empty", data)!;
    empty.textContent = "Tidak ada pilihan.";
    empty.hidden = true;
    this.#empty = empty;

    panel.append(grid, empty);
    root.appendChild(panel);

    const value = this.render("@picker>value", data)! as HTMLInputElement;
    value.name = data.name || data.id || this.config.namespace || "picker";
    value.value = this.#selected.join(",");
    this.#value = value;
    root.appendChild(value);

    this.#paint();

    return root;
  }

  protected template(typeKey: PickerElementType, el: HTMLElement, payload?: any): void {
    switch (typeKey) {
      case "@picker":
        el.dataset.kind = this.config.kind;
        el.dataset.expanded = String(this.config.expanded);
        el.style.setProperty("--picker-columns", String(this.config.columns));
        break;

      case "@picker>panel>grid>option>name":
        el.textContent = payload?.label ?? payload?.value ?? "";
        break;

      case "@picker>panel>grid>option>preview": {
        const option = payload as iPickerOption;
        if (option?.label) el.setAttribute("aria-label", option.label);
        el.setAttribute("aria-hidden", "true");
        break;
      }

      case "@picker>visual>icon":
        // `payload` is the icon name as a schema writes it: `gear`, `user.settings`, or a
        // space-separated pair (`hand swipe`). Both separators are real, so one split.
        if (typeof payload === "string" && payload) {
          const tokens = payload.split(/[.\s]+/).filter(Boolean);
          if (tokens.length) el.classList.add(...tokens);
        }
        break;

      case "@picker>visual>image":
        if (payload?.src) {
          (el as HTMLImageElement).src = payload.src;
          (el as HTMLImageElement).alt = payload.label ?? payload.value ?? "";
          (el as HTMLImageElement).loading = "lazy";
        }
        break;

      case "@picker>visual>swatch":
        if (payload?.color) el.style.setProperty("--picker-swatch", payload.color);
        break;

      case "@picker>value":
        el.setAttribute("type", "hidden");
        break;

      default:
        break;
    }
  }

  public initialize(): void {
    const root = this.#root;
    if (!root) return;

    this.#trigger?.addEventListener("click", () => {
      if (this.config.expanded) return;
      this.#isOpen() ? this.close() : this.open();
    });

    this.#panel?.addEventListener("click", (event) => {
      const cell = (event.target as HTMLElement | null)?.closest<HTMLElement>("[role='option']");
      if (cell?.dataset.value !== undefined) this.#pick(cell.dataset.value);
    });

    this.#search?.addEventListener("input", () => this.#filter(this.#search?.value ?? ""));

    this.#panel?.addEventListener("keydown", (event) => {
      if ((event as KeyboardEvent).key !== "Escape" || this.config.expanded) return;
      event.preventDefault();
      this.close();
      this.#trigger?.focus();
    });

    // One document listener per picker, and it only reacts while the panel is open.
    document.addEventListener("pointerdown", this.#outside);

    root.addEventListener("picker:destroy", () => {
      document.removeEventListener("pointerdown", this.#outside);
    }, { once: true });
  }

  /** Opens the popover panel. No-op in the expanded look. */
  public open(): void {
    if (!this.#panel || this.config.expanded) return;
    this.#panel.dataset.open = "true";
    this.#trigger?.setAttribute("aria-expanded", "true");
    this.#showPopover(true);
    this.#search?.focus();
  }

  /** Closes the popover panel. No-op in the expanded look. */
  public close(): void {
    if (!this.#panel || this.config.expanded) return;
    delete this.#panel.dataset.open;
    this.#trigger?.setAttribute("aria-expanded", "false");
    this.#showPopover(false);
  }

  /** The panel opens only through native popover when the platform supports it. */
  #showPopover(show: boolean): void {
    const panel = this.#panel;
    if (!panel || typeof panel.showPopover !== "function") return;

    try {
      show ? panel.showPopover() : panel.hidePopover();
    } catch {
      // `hidePopover()` throws when the panel was never shown; state is already correct.
    }
  }

  #isOpen(): boolean {
    return this.#panel?.dataset.open === "true";
  }

  /** Document-level dismissal: a press outside the picker closes it. */
  #outside = (event: Event): void => {
    if (!this.#isOpen() || !this.#root) return;
    if (this.#root.contains(event.target as Node)) return;
    this.close();
  };

  #pick(value: string): void {
    if (this.config.isMultiple) {
      this.#selected = this.#selected.includes(value)
        ? this.#selected.filter((entry) => entry !== value)
        : [...this.#selected, value];
    } else {
      this.#selected = [value];
      this.close();
    }

    this.#paint();
    this.#notify();
  }

  /** Hidden cells disappear; the empty note speaks only when nothing matches. */
  #filter(query: string): void {
    const needle = query.trim().toLowerCase();
    let visible = 0;

    for (const option of this.#options) {
      const cell = this.#cells.get(option.value);
      if (!cell) continue;

      const haystack = `${option.label ?? ""} ${option.value}`.toLowerCase();
      const match = !needle || haystack.includes(needle);
      cell.hidden = !match;
      if (match) visible += 1;
    }

    if (this.#empty) this.#empty.hidden = visible > 0;
  }

  /** Pushes `#selected` into the DOM: cells, trigger preview and the hidden input. */
  #paint(): void {
    for (const [value, cell] of this.#cells) {
      cell.setAttribute("aria-selected", String(this.#selected.includes(value)));
    }

    const chosen = this.#options.find((option) => option.value === this.#selected[0]);

    if (this.#preview) {
      this.#preview.replaceChildren();
      if (chosen) this.#preview.appendChild(this.#visual(chosen));
    }

    if (this.#label) {
      this.#label.textContent = chosen
        ? this.#selected.length > 1
          ? `${chosen.label ?? chosen.value} +${this.#selected.length - 1}`
          : chosen.label ?? chosen.value
        : this.#placeholder;
      this.#label.classList.toggle("is-placeholder", !chosen);
    }

    if (this.#value) this.#value.value = this.#selected.join(",");
    this.#root?.classList.toggle("is-empty", this.#selected.length === 0);
  }

  /** The visual a kind draws. One function, so trigger and cells never drift. */
  #visual(option: iPickerOption): HTMLElement {
    const kind = this.config.kind;

    if (kind === "swatch") return this.render("@picker>visual>swatch", option)!;
    if (kind === "image" || kind === "media") {
      const image = this.render("@picker>visual>image", option)!;
      if (!option.src) {
        // No source: fall back to the icon (or the first letter) rather than a broken image.
        const name = option.icon;
        return name ? this.render("@picker>visual>icon", name)! : this.#letter(option);
      }
      return image;
    }

    // A string option in an icon grid (`options: ["gear", "user"]`) carries the icon name
    // as its value, so `icon` is an override and `value` is the default.
    const name = option.icon ?? option.value;
    return name ? this.render("@picker>visual>icon", name)! : this.#letter(option);
  }

  /** Last resort preview: the option's initial, so a cell is never blank. */
  #letter(option: iPickerOption): HTMLElement {
    const span = document.createElement("span");
    span.className = "letter";
    span.textContent = (option.label ?? option.value).charAt(0).toUpperCase();
    return span;
  }

  /** Value may arrive as an array, a comma string, or nothing. */
  #readValue(value: iPickerPayload["value"]): string[] {
    if (Array.isArray(value)) return value.map(String);
    if (typeof value === "string" && value) return value.split(",").map((entry) => entry.trim()).filter(Boolean);
    return [];
  }

  /** One event pair: `change` for forms, `picker:change` for a host that listens by name. */
  #notify(): void {
    const detail = { value: this.#selected.join(","), values: this.value, name: this.#value?.name ?? "" };
    this.#value?.dispatchEvent(new Event("change", { bubbles: true }));
    this.#root?.dispatchEvent(new CustomEvent("picker:change", { detail, bubbles: true }));
    this.config.emit?.("picker:change", detail);
  }
}
