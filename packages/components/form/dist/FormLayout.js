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
export const WIDE_FULL = 100;
/** Column cap used when a row does not say. */
export const DEFAULT_ROW_COLUMNS = 2;
/** Upper bound, so a value from a spreadsheet cannot produce a 200-column line. */
export const MAX_ROW_COLUMNS = 16;
/**
 * Clamps the column cap into a usable range.
 *
 * @param value - `column` from the schema; anything non-numeric falls back to the default.
 * @returns Integer between 1 and {@link MAX_ROW_COLUMNS}.
 */
export function columnsOf(value) {
    if (value === undefined || value === null || value === "")
        return DEFAULT_ROW_COLUMNS;
    const numeric = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(numeric))
        return DEFAULT_ROW_COLUMNS;
    return Math.min(MAX_ROW_COLUMNS, Math.max(1, Math.round(numeric)));
}
/**
 * Reads the line cap a container declares.
 *
 * A row always caps its lines (it falls back to {@link DEFAULT_ROW_COLUMNS}); a group only
 * does when it says `column`, because a plain fieldset is a one-column stack by design.
 *
 * @param node - Row or group schema node.
 * @returns The cap, or `0` when the node declares no grid.
 */
export function declaredColumns(node) {
    const column = node?.column;
    if (column === undefined || column === null || column === "")
        return 0;
    return columnsOf(column);
}
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
export function wideOf(wide) {
    if (wide === "auto" || wide === "full")
        return WIDE_FULL;
    const numeric = typeof wide === "number" ? wide : Number(String(wide ?? "").replace("%", "").trim());
    if (!Number.isFinite(numeric) || numeric <= 0)
        return WIDE_FULL;
    const percent = numeric <= 1 ? numeric * 100 : numeric;
    return Math.min(WIDE_FULL, Math.max(1, Math.round(percent)));
}
/**
 * Resolves the share a container child asked for.
 *
 * @param child - Row child node.
 * @returns Percentage of the row between 1 and {@link WIDE_FULL}.
 */
export function childWideOf(child) {
    return declaredWideOf(child) ?? WIDE_FULL;
}
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
export function declaredWideOf(child) {
    if (!child || typeof child !== "object")
        return null;
    const node = child;
    const wide = node.config?.wide ?? node.wide;
    if (wide === undefined || wide === null || wide === "")
        return null;
    return wideOf(wide);
}
/**
 * Applies a share to a child element.
 *
 * `data-span` is the human/debug marker; `--span` carries the number, because CSS cannot
 * read an attribute inside `grid-column: span …`.
 *
 * @param element - Child element of a row container.
 * @param wide - Percentage of the row, already resolved by {@link wideOf}.
 */
export function applyRowSpan(element, wide) {
    element.dataset.span = String(wide);
    element.style.setProperty("--span", String(wide));
}
/**
 * Declares the grid of a row container.
 *
 * @param element - Row container.
 * @param columns - Line cap, already clamped by {@link columnsOf}.
 */
export function applyRowColumns(element, columns) {
    element.dataset.column = String(columns);
}
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
export function arrangeRow(container, columns) {
    const capped = columns > 0;
    const cap = capped ? columns : Number.MAX_SAFE_INTEGER;
    let line = 1;
    let count = 0;
    let used = 0;
    /** Equal slice of the space left on this line, over the slots still open on it. */
    const slot = () => {
        if (!capped)
            return WIDE_FULL;
        const open = Math.max(1, cap - count);
        return Math.max(1, Math.ceil((WIDE_FULL - used) / open));
    };
    for (const child of Array.from(container.children)) {
        if (!(child instanceof HTMLElement))
            continue;
        const isField = child.matches(".field, .form-group");
        if (!isField) {
            // A heading, a note, a control set, raw markup: its own full-width line.
            if (count > 0) {
                line += 1;
                count = 0;
                used = 0;
            }
            child.style.gridRow = String(line);
            child.style.gridColumn = "1 / -1";
            line += 1;
            count = 0;
            used = 0;
            continue;
        }
        // `--span` exists only when the schema declared `wide`; absent means "share the line".
        const stated = Number(child.style.getPropertyValue("--span")) || 0;
        let wide = stated || slot();
        if (count >= cap || (used > 0 && used + wide > WIDE_FULL)) {
            line += 1;
            count = 0;
            used = 0;
            // Alone on a fresh line, an undeclared child takes all of it.
            wide = stated || WIDE_FULL;
        }
        applyRowSpan(child, wide);
        child.style.gridRow = String(line);
        child.style.gridColumn = `${used + 1} / span ${wide}`;
        used += wide;
        count += 1;
    }
}
//# sourceMappingURL=FormLayout.js.map