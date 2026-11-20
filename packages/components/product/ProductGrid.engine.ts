/**
 * ProductGrid — engine.
 *
 * `normalizeProducts` — collection shape.
 *
 * Not published: `index.ts` is the only entry and does not mention this file.
 */


/** `[...]` or `{ data: [...] }` — the registry hands the payload directly, no `{ content }` envelope. */
export function normalizeProducts(data: any): any[] {
  if (Array.isArray(data)) return data.filter(Boolean);
  if (Array.isArray(data?.data)) return data.data.filter(Boolean);
  return [];
}
