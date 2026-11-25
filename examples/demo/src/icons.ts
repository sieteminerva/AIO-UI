/**
 * The icon catalogue.
 *
 * `packages/styles/src/icon.css` defines every glyph as `i.icon.<name>` (a multi-word name
 * uses dots: `user.list`). A browser bundle cannot read that sheet's source at runtime, so the
 * names live here — and `__tests__/icons.test.ts` re-parses the sheet with Node's `fs` and
 * fails when this list drifts from it. Add an icon to the sheet, run the tests, copy the diff.
 */
export const ICON_NAMES: readonly string[] = [
  "spinner",
  "gear",
  "hand.swipe",
  "inbox",
  "user",
  "user.list",
  "user.settings",
  "checkmark.circle",
  "checkmark",
  "cross.circle",
  "close.circle",
  "cross",
  "close",
  "edit",
  "plus",
  "plus.circle",
  "plus.square",
  "trash",
  "three.dots.framed",
  "three.dots.horizontal",
  "three.dots.square.vertical",
  "three.dots.vertical",
  "hamburger",
  "paper.clip",
  "search",
  "arrow.left",
  "arrow.right",
  "arrow.left.circle",
  "arrow.right.circle",
  "double.arrow.left",
  "double.arrow.right",
  "expand.arrow",
  "bell.warning",
  "bell",
  "error",
  "info",
  "notification",
  "text.edit",
  "download.file",
  "add.file.circle",
  "adobe.illustrator.file",
  "adobe.pdf.file",
  "adobe.photoshop.file",
  "copy.file.round",
  "copy.file",
  "css.file",
  "csv.file",
  "file.sheets",
  "doc.file",
  "edit.file.round",
  "edit.file",
  "file.edit",
  "file.outline.dotted",
  "file",
  "add.file",
  "html.file",
  "javascript.file",
  "jpg.file",
  "json.file",
  "mp3.file",
  "mp4.file",
  "png.file",
  "svg.file",
  "txt.file",
  "xls.file",
  "zip.file",
  "add.folder.circle",
  "add.folder",
  "folder",
  "adobe.illustrator.logo",
  "adobe.photoshop.logo",
  "google.logo",
  "github.logo",
  "weburl",
  "instagram.logo",
  "itunes.logo",
  "qrcode",
  "scan.qrcode",
  "barcode",
  "add.cart",
  "cart",
  "expand",
  "recycled",
  "rotate",
  "write.mail",
  "moon.dark",
  "moon.sleep",
  "moon.sun",
  "sunrise",
];

/** `i.icon.user.list` → `user.list`. Non-anchored: a minified sheet has no line starts. */
const SELECTOR = /i\.icon\.([a-z0-9.]+)/g;

/** Every icon name a stylesheet declares, in document order, without duplicates. */
export function parseIconNames(css: string): string[] {
  const seen = new Set<string>();
  for (const match of css.matchAll(SELECTOR)) seen.add(match[1]);
  return [...seen];
}

/** `user.list` → `user list` — the classes the element actually carries. */
export const iconClasses = (name: string): string => name.split(".").join(" ");
