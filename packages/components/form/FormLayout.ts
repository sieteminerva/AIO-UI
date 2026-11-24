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
 * The numbers here are pure: `declaredColumns`, `columnsOf` and `spanOf` decide the grid,
 * the caller writes the attributes. That keeps the arithmetic testable without a DOM.
 *
 * One contract for every container (a row **and** a group that declares `column`):
 *
 * | `wide`            | columns spanned                                   |
 * | ----------------- | ------------------------------------------------- |
 * | absent / invalid  | 1                                                 |
 * | `"auto"`, `"full"`| every column                                      |
 * | `0 < n ≤ 1`       | fraction of the row (`0.5` = half)                |
 * | `n > 1`           | percentage of the row (`50` = half, `33` = third) |
 * | `"50%"`           | the same percentage, written with a sign          |
 *
 * A percentage is rounded to the nearest whole column and clamped to `1..columns`, so a
 * child can never ask for more room than the row has — it wraps instead.
 */

/** Column count used when a row does not say. */
export const DEFAULT_ROW_COLUMNS = 2;

/** Upper bound, so a value from a spreadsheet cannot produce a 200-column grid. */
export const MAX_ROW_COLUMNS = 16;

/** A child of a row: a field, a nested row, or a fieldset group. */
export type iFormRowChild =
  | Record<string, any>
  | HTMLElement
  | string;

/**
 * A row container.
 *
 * `column` is the **count of columns**; a child's width comes from `wide` (`50` → half,
 * `"auto"` → full row) or from an explicit `span`.
 */
export interface iFormRowNode {
  /** Column count. Defaults to {@link DEFAULT_ROW_COLUMNS}. */
  column?: number;
  /** Children, in order. They wrap automatically when they do not fit. */
  row: iFormRowChild[];
  /** Heading, rendered as `.title` spanning every column. */
  label?: string;
  /** Optional note, rendered as `.desc` spanning every column. */
  description?: string;
  id?: string;
  className?: string;
  /** Width of this row inside a parent row: percentage, fraction, or `"auto"`. */
  wide?: number | string | null;
  /** Explicit column span, wins over `wide`. */
  span?: number;
  /** Cascade condition, same shape as a group's. */
  condition?: unknown;
}

/**
 * Clamps the column count into a usable range.
 *
 * @param value - `column` from the schema; anything non-numeric falls back to the default.
 * @returns Integer between 1 and {@link MAX_ROW_COLUMNS}.
 */
export function columnsOf(value: unknown): number {
  if (value === undefined || value === null || value === "") return DEFAULT_ROW_COLUMNS;
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric)) return DEFAULT_ROW_COLUMNS;
  return Math.min(MAX_ROW_COLUMNS, Math.max(1, Math.round(numeric)));
}

/**
 * Reads the column count a container declares.
 *
 * A row always forms a grid (it falls back to {@link DEFAULT_ROW_COLUMNS}); a group only
 * does when it says `column`, because a plain fieldset is a one-column stack by design.
 *
 * @param node - Row or group schema node.
 * @returns The column count, or `0` when the node declares no grid.
 */
export function declaredColumns(node: unknown): number {
  const column = (node as Record<string, any> | null | undefined)?.column;
  if (column === undefined || column === null || column === "") return 0;
  return columnsOf(column);
}

/**
 * Clamps a raw span into `1..columns`.
 *
 * The one place the bounds live: `wide`, an explicit `span`, and the cascade's late build
 * all pass through here, so no caller can write a span the grid cannot hold.
 *
 * @param value - Span in columns, before bounds.
 * @param columns - Column count of the container.
 * @returns Integer between 1 and `columns`.
 */
export function clampSpan(value: unknown, columns: number): number {
  const total = Math.max(1, Math.round(columns));
  const span = Number(value);
  if (!Number.isFinite(span)) return 1;
  return Math.min(total, Math.max(1, Math.round(span)));
}

/**
 * Turns a `wide` hint into a column span.
 *
 * Four spellings are accepted, because a schema read from a sheet writes whatever the
 * author typed: `"auto"` / `"full"` (the whole row), a fraction (`0.5` = half), a
 * percentage (`50` = half, `33` = a third), and the same percentage with a sign (`"50%"`).
 *
 * @param wide - Width hint from `config.wide` (or the node's own `wide`).
 * @param columns - Column count of the container this child lives in.
 * @returns Span between 1 and `columns`.
 */
export function spanOf(wide: unknown, columns: number): number {
  const total = Math.max(1, Math.round(columns));

  if (wide === "auto" || wide === "full") return total;

  const numeric = typeof wide === "number" ? wide : Number(String(wide ?? "").replace("%", "").trim());
  if (!Number.isFinite(numeric) || numeric <= 0) return 1;

  const ratio = numeric <= 1 ? numeric : numeric / 100;
  return clampSpan(ratio * total, total);
}

/**
 * Applies a span to a child element.
 *
 * `data-span` is the human/debug marker; `--span` carries the number, because CSS cannot
 * read an attribute inside `grid-column: span …`.
 *
 * @param element - Child element of a row container.
 * @param span - Column span, already clamped by {@link spanOf}.
 */
export function applyRowSpan(element: HTMLElement, span: number): void {
  element.dataset.span = String(span);
  element.style.setProperty("--span", String(span));
}

/**
 * Declares the grid of a row container.
 *
 * @param element - Row container.
 * @param columns - Column count, already clamped by {@link columnsOf}.
 */
export function applyRowColumns(element: HTMLElement, columns: number): void {
  element.dataset.column = String(columns);
  element.style.setProperty("--items", String(columns));
}

/**
 * Resolves the span a row child asked for, explicit `span` first, then `wide`.
 *
 * @param child - Row child node.
 * @param columns - Column count of the parent row.
 * @returns Span between 1 and `columns`.
 */
export function childSpanOf(child: unknown, columns: number): number {
  if (!child || typeof child !== "object") return 1;
  const node = child as Record<string, any>;

  if (node.span !== undefined && node.span !== null) return clampSpan(node.span, columns);
  return spanOf(node.config?.wide ?? node.wide, columns);
}
