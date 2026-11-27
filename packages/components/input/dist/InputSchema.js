/**
 * Input field schema — the `content` / `config` split, **grouping stage**.
 *
 * Why this file exists: an input today receives one flat node in which data, rules,
 * layout, events and module settings are mixed. The refactor separates them into two
 * blocks — `content` (what the field *is*) and `config` (how it *behaves*) — and then
 * makes the blocks a per-`type` discriminated union.
 *
 * The rule used to sort every property (see `Attribute.ts` for the vocabulary):
 *
 * - **content** — instance data: identity, value, choices, and the text the visitor reads.
 *   Two fields of the same `type` may differ here without changing behaviour.
 * - **config** — rules and wiring: constraints, state, layout, callbacks, module settings.
 *
 * The groups below are the *inventory* of properties that actually exist in `Input.ts`,
 * `Attribute.ts` and the four modules, each with the code that reads it; the union
 * (`iFieldNode` / `InputSchema<T>`) is assembled from them at the bottom of this file.
 */
export {};
//# sourceMappingURL=InputSchema.js.map