import type { InputType } from "./Input";
import type { InputChooserType, iInputConfigOf, iInputContentOf } from "./InputSchema";
/**
 * The content block of an Apps Script sheet note.
 *
 * Identical to `iInputContentOf`, plus `range` on the chooser types only. `range` is the
 * sheet spelling of `options`: the name of a Google Sheets named range that resolves the
 * choice list. The key is called `range` — not `rangeName` — on purpose, because one word
 * is enough and a reader can tell from it that the list lives in the sheet rather than
 * inline in the note. Only a type that chooses (`select`, `dropdown`, `picker`, `checkbox`,
 * `radio`) accepts it; every other type refuses the key outright.
 */
export type iAppsScriptContentOf<T extends InputType> = iInputContentOf<T> & (T extends InputChooserType ? {
    range?: string;
} : {
    range?: never;
});
/**
 * Host metadata every Apps Script note carries in its `config` block: where the value is
 * stored. These are storage addresses, not behaviour — they never travel to a public
 * payload that renders a page.
 */
export interface iAppsScriptConfigMeta {
    /** Sheet name or `gid` the column lives on. */
    sheet: number | string;
    /** A1 address of the header cell whose note holds this descriptor. */
    cell: string;
    /** `true` keeps the value in `data` but hides the field from every form. */
    skipped?: boolean;
}
/** The behaviour block of an Apps Script note: `iInputConfigOf` plus the storage address. */
export type iAppsScriptConfigOf<T extends InputType> = iInputConfigOf<T> & iAppsScriptConfigMeta;
/**
 * One field node exactly as a sheet note stores it, discriminated by `content.type`.
 *
 * This is `iFieldNode` narrowed to a contract: a note that misses `sheet` or `cell` fails
 * to compile, and a `range` on a type that cannot choose is rejected. It is public, so the
 * note writer (Apps Script) and the note reader (a client) type against one shape. A note
 * is also a valid `iFieldSeed`, so it goes straight into `InputAttributeBuilder.create()`.
 */
export type iAppsScriptFieldNode = {
    [T in InputType]: {
        content: iAppsScriptContentOf<T>;
        config: iAppsScriptConfigOf<T>;
    };
}[InputType];
/** One note narrowed to a single type, e.g. `iAppsScriptInputSchema<"select">`. */
export type iAppsScriptInputSchema<T extends InputType = InputType> = Extract<iAppsScriptFieldNode, {
    content: {
        type: T;
    };
}>;
//# sourceMappingURL=InputAppsScriptSchema.d.ts.map