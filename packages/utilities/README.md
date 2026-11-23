# Utilities (`@aio-ui/utilities`)

Small, DOM-light helpers shared by builders, modules and the renderer. Curated exports, never
`export *` — a helper earns its place here only when more than one package needs it.

<!-- install:begin -->
## Install

Version — `0.2.4` (tag `v0.2.4`)

    npm install https://github.com/sieteminerva/AIO-UI/raw/releases/v0.2.4/aio-ui-utilities-0.2.4.tgz

CDN (ES module, no build step) — `https://cdn.jsdelivr.net/gh/sieteminerva/AIO-UI@v0.2.4/packages/utilities/dist/index.js`
<!-- install:end -->

## Exports

| Export                                                                                   | Role                                                                                    |
| ---------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `buildNamespace`, `ensureMetadataIdentity`, `setMetadata`                                 | The identity scheme: one namespace per payload, records stamped on the root              |
| `selectorToTree`                                                                          | A component's `selectors` dictionary → the per-key relation map the renderer merges       |
| `applyAttrDictionary`, `applyAttributeList`                                               | Attribute maps and `{ name, value }` lists → the DOM                                       |
| `mergeInputConfig`                                                                        | Form input config merge with the watcher attributes (`required`, `multiple`, …)           |
| `numberToText`, `toBeString`, `truncateText`                                              | Small coercions a component repeats                                                       |
| `parseTableFile`, `parseTableText`, `parseTableRecords`, `splitCsvRows`, `detectDelimiter`, `EMPTY_TABLE` | CSV/JSON → `{ header, body, footer }`; delimiter counted outside quotes only |
| `createImageError`                                                                        | The placeholder an `<img>` falls back to                                                 |
| `generateRandomColor`, `hexToRgb`, `hexToRgba`                                            | Colour maths for tokens and demos                                                         |

`parseTableFile` is pure text in, plain object out — no DOM beyond `FileReader` — so the input
layer can hand over a `File` and the table layer stays unaware of forms.

## Tokens

None. `utilities` ships no CSS.
