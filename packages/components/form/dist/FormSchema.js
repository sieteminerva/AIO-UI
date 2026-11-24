/**
 * The form schema — the shapes one `form` payload accepts, as types.
 *
 * Why this file exists: a schema is the first thing a consumer writes, and until now it was
 * `any`. A field that kept the pre-split spelling (`title`, `config.options`) still rendered —
 * without a caption and without choices — because nothing typed it. Declare a set as
 * `readonly FormNode[]` and the compiler names the key that is wrong.
 *
 * One field, one shape, everywhere: a field node **is** the input schema
 * (`{ content, config }`), passed through untouched to `InputBuilder.create()`. The only keys
 * the form adds are its own — the cascade rule `condition` and its `then` payload. A layout
 * node (`group` / `row`) is the form's vocabulary, not a field, and keeps its own shape.
 *
 * `legend` / `label` on a group or row is a heading, never the input caption — a caption
 * belongs to a field and lives in that field's `content`.
 */
export {};
//# sourceMappingURL=FormSchema.js.map