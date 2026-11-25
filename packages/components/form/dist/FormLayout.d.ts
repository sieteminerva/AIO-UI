/**
 * Row layout — the schema side of an inline field group.
 *
 * A row is a **layout container**, not a fieldset: it holds fields (and nested rows) in a
 * CSS grid. `group` stays reserved for `<fieldset>` + `<legend>` semantics, so neither
 * word is overloaded.
 *
 * ```ts
 * { label: "Identitas", column: 2, row: [
 *     { type: "text", id: "first", title: "Nama depan", config: { wide: 50 } },
 *     { type: "text", id: "last",  title: "Nama belakang", config: { wide: 50 } },
 *     { type: "textarea", id: "street", title: "Alamat", config: { wide: "auto" } },
 * ] }
 * ```
 *
 * The numbers here are pure: `wideOf`, `declaredColumns` and `arrangeRow` decide the grid,
 * the caller writes the attributes. That keeps the arithmetic testable without a DOM.
 *
 * **One way to size a field: `wide` is a percentage of the row.** A container is a
 * 100-unit grid; `wide: 20` takes a fifth, `wide: 100` takes the row. There is no column
 * arithmetic and no `span` — an integer span could not express 20/40/40 anyway.
 *
 * | `wide`             | share of the row                                  |
 * | ------------------ | ------------------------------------------------- |
 * | absent             | equal share of the line (`column: 3` → a third),  |
 * |                    | or 100 when the child has to start a new line      |
 * | invalid            | 100                                               |
 * | `"auto"`, `"full"` | 100                                               |
 * | `0 < n ≤ 1`        | fraction (`0.5` = `50`)                           |
 * | `n > 1`            | percentage (`20`, `100`)                          |
 * | `"40%"`            | the same percentage, with a sign                  |
 *
 * `column` is both the **cap on items per line** and the default share: a child that
 * declares nothing takes an equal slice of its line (100 / `column`, the remainder spread
 * from the left), so three children under `column: 3` are a third each. A fourth child no
 * longer fits, and a child that starts a new line takes it whole — `wide` is only needed
 * when a line should be uneven.
 */
/** The whole row: the unit every `wide` is measured in. */
export declare const WIDE_FULL = 100;
/** Column cap used when a row does not say. */
export declare const DEFAULT_ROW_COLUMNS = 2;
/** Upper bound, so a value from a spreadsheet cannot produce a 200-column line. */
export declare const MAX_ROW_COLUMNS = 16;
/** A child of a row: a field, a nested row, or a fieldset group. */
export type iFormRowChild = Record<string, any> | HTMLElement | string;
/**
 * A row container.
 *
 * `column` caps how many children a line holds; a child's width comes from `wide`
 * (a percentage of the row).
 */
export interface iFormRowNode {
    /** Line cap. Defaults to {@link DEFAULT_ROW_COLUMNS}. */
    column?: number;
    /** Children, in order. They wrap to the next line once a line is full. */
    row: iFormRowChild[];
    /** Heading, rendered as `.title` spanning the row. */
    label?: string;
    /** Optional note, rendered as `.desc` spanning the row. */
    description?: string;
    id?: string;
    className?: string;
    /** Width of this row inside a parent row: percentage, fraction, or `"auto"`. */
    wide?: number | string | null;
    /** Cascade condition, same shape as a group's. */
    condition?: unknown;
}
/**
 * Clamps the column cap into a usable range.
 *
 * @param value - `column` from the schema; anything non-numeric falls back to the default.
 * @returns Integer between 1 and {@link MAX_ROW_COLUMNS}.
 */
export declare function columnsOf(value: unknown): number;
/**
 * Reads the line cap a container declares.
 *
 * A row always caps its lines (it falls back to {@link DEFAULT_ROW_COLUMNS}); a group only
 * does when it says `column`, because a plain fieldset is a one-column stack by design.
 *
 * @param node - Row or group schema node.
 * @returns The cap, or `0` when the node declares no grid.
 */
export declare function declaredColumns(node: unknown): number;
/**
 * Turns a `wide` hint into a percentage of the row.
 *
 * Four spellings are accepted, because a schema read from a sheet writes whatever the
 * author typed: `"auto"` / `"full"` (the whole row), a fraction (`0.5` = 50), a percentage
 * (`20`, `100`), and the same percentage with a sign (`"40%"`). Anything unreadable means
 * the whole row, which is also what "not written" means.
 *
 * @param wide - Width hint from `config.wide` (or the node's own `wide`).
 * @returns Integer between 1 and {@link WIDE_FULL}.
 */
export declare function wideOf(wide: unknown): number;
/**
 * Resolves the share a container child asked for.
 *
 * @param child - Row child node.
 * @returns Percentage of the row between 1 and {@link WIDE_FULL}.
 */
export declare function childWideOf(child: unknown): number;
/**
 * The share a child declares, or `null` when it declares none.
 *
 * `null` is not "the whole row": a container that declares `column` gives such a child an
 * equal slice of its line (see {@link arrangeRow}). Only an explicit word — including
 * `"auto"` / `"full"` — pins a width.
 *
 * @param child - Row child node.
 * @returns Percentage of the row, or `null` when `wide` was never written.
 */
export declare function declaredWideOf(child: unknown): number | null;
/**
 * Applies a share to a child element.
 *
 * `data-span` is the human/debug marker; `--span` carries the number, because CSS cannot
 * read an attribute inside `grid-column: span …`.
 *
 * @param element - Child element of a row container.
 * @param wide - Percentage of the row, already resolved by {@link wideOf}.
 */
export declare function applyRowSpan(element: HTMLElement, wide: number): void;
/**
 * Declares the grid of a row container.
 *
 * @param element - Row container.
 * @param columns - Line cap, already clamped by {@link columnsOf}.
 */
export declare function applyRowColumns(element: HTMLElement, columns: number): void;
/**
 * Places every child of a container on its line.
 *
 * Widths are percentages of a 100-unit grid, so placement is explicit: the cursor walks
 * the children, adds `wide` units, and starts a new line when the cap is reached **or**
 * when the next share would pass 100. That is how "the fourth child of a `column: 3` row
 * starts the next line" is guaranteed — CSS auto-placement wraps by width alone and would
 * let a fourth child try to fit.
 *
 * A share that would pass 100 starts a new line instead of overflowing: a placement past
 * track 100 would make CSS create implicit tracks, which silently shrink every explicit
 * one (the whole row loses its percentages). Headings and anything the layout does not
 * know (a control set, raw markup) take a full line of their own.
 *
 * A child that declares no `wide` (`--span` was never stamped) takes an equal slice of the
 * line: what is left, split over the slots still open on it. Three fields under
 * `column: 3` become 34/33/33; the fourth no longer fits and takes the whole next line.
 *
 * @param container - Row or column group.
 * @param columns - Line cap; `0` means "no cap, one line".
 */
export declare function arrangeRow(container: HTMLElement, columns: number): void;
//# sourceMappingURL=FormLayout.d.ts.map