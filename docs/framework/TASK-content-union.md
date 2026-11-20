# TASK — `union` + `element` in `iContentSpec`

**Status:** next. This closes batch E's known limit (seven builders use the `{ t: "any" }` escape).
Band: `packages/**` (Framework). Rules: `docs/framework/COMPONENT-CONVENTIONS.md` §4 / §12.

## Why

A contract that says `any` validates only `example`. Seven builders accept more than one shape
(`code-block`, `fab-menu`, `markdown`, `masonry`, `modal`, `product`, `rating`), and four of them
also accept a DOM element — no existing spec member can say that, so the door stayed open.

## Shape

- `iContentSpec` gains `{ t: "union"; of: readonly iContentSpec[] }` and `{ t: "element" }`.
- `check()` picks the **first branch whose `fits(spec, value)` is true**, then normalises with that
  branch, so `list.single` still wraps. No branch fits → one `INPUT_SHAPE` issue that lists the
  alternatives. `normalize()` stays total and idempotent.
- `fits()` is structural only and never throws: `record` → plain object, `list` → array (or a record
  when `single`), primitives by `typeof`, `enum` by membership, `element` → `instanceof HTMLElement`
  guarded by `typeof HTMLElement !== "undefined"`.
- `describe()` learns both words (`union` → `a | b`, `element` → `element`).

## Next (cold start)

1. `packages/core/src/types/content.ts` — add both members to `iContentSpec` with a doc comment.
2. `packages/base/src/BaseAdapters/ContentContract.ts` — add `fits()`, a `union` and an `element`
   case in `check()`, and `describe()` entries. Signature of `normalize()`/`validate()` unchanged.
3. Narrow the seven contracts (each accepted shape is in that README `## Payload`):
   - `code-block` → union of `{ code }`, `{ blocks: list }`, `list`, `string`.
   - `fab-menu` → union of `element`, `{ title?, actions: list of union(record, element) }`.
   - `markdown` → union of `{ source: string (req) }`, `string`.
   - `masonry` → union of `{ items: list (req) }` (open), `list` of record-or-element.
   - `modal` → union of `element`, `string`, record.
   - `product` → union of `list`, `{ items: list }`, `{ record: record }`.
   - `rating` → union of `number`, `{ value: number }`.
4. Tests — `packages/base/src/__tests__/ContentContract.test.ts`: union picks the record branch for
   a record and the string branch for a string; a value fitting nothing yields exactly one
   `INPUT_SHAPE`; `element` accepts an element and rejects a record. Then
   `packages/components/contracts.test.ts`: every `example` still 0 issues, plus one deliberately
   invalid value per narrowed builder proving ≥1 issue (the union no longer accepts everything).
5. Docs — `COMPONENT-CONVENTIONS.md` §4: replace the "Known limit" paragraph with the union rule.
6. Gate — `npm run typecheck` while iterating, then `npm run verify` once. New type members add no
   barrel symbol, so `api-map.json` does not change.
7. Commit — `feat(core): content contracts can declare a union`.

## Done = delete this file

After the commit, `STATUS.md` drops the `union` card and the release card becomes #1. Then continue
with `docs/framework/TASK-releases-branch.md` `## Next`, and **stop before** the version bump /
publish — the owner cuts the release.
