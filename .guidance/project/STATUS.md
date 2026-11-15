# Project Status — what now

> **Rule:** maximum **3** active items, ≤ 80 lines, **overwritten** every session — never appended.
> Lifecycle: `plan.md` (why) → `NEXT_TASKS.md` (queue) → **this file** (what now). See `AGENT_RULES.md` §9.

Last updated: 2026-11-15

## Active (max 3)

| #   | Task                        | Project   | State       | Gate                                                                                            |
| --- | --------------------------- | --------- | ----------- | ----------------------------------------------------------------------------------------------- |
| 1   | Page-level components (P9b) | Framework | in progress | `isRoot` and `loading()` settled; generator must emit `isRoot: true` in `mount()` and be probed |
| 2   | Build `profile` reference   | Examples  | not started | home, services, contact, portfolio render; boundaries documented                                |
| 3   | Build `blog` reference      | Examples  | not started | home, post list, post, about render; boundaries documented                                      |

## Landed recently

- **Batch 36 (2026-11-15):** the masonry lightbox is markup again. `@masonry>modal>stage|image|
caption|title|desc` are declared selectors, so `template()` builds the whole modal from the
  payload it is handed and nothing writes text afterwards; `_initModal()` only assembles
  `payloadOf(record)` and re-renders per open (`updateNavigation()` is gone — the arrows read
  `currentIndex` live). The card, not the `img`, carries the click (`onclick`, one handler that
  leaves with its node), and `_applyFilter` drops the old cards with `replaceChildren()`. The
  grid is a preview now: the caption the card reveals on hover is repeated in the lightbox.
- **Batch 35 (2026-11-15):** the CSS debt list is empty. `Menu.css` owns its own states — the
  `li` is no longer a clickable `.item` (hover and active were fighting over one box), the current
  route is a solid accent pill, and `.nav` is `border-box` so a host can size it. The `datalist`
  dropdown restates its box (it had been losing fill and border on hover) and the file control is
  a flex row, so the selector button centres itself instead of riding a `bottom: 5px` nudge.
  `input.css` stops painting file controls as text inputs; the tab gained `variant: "folder"`.
  Measured: accordion slide 68 → 137 px over 6 frames, lightbox controls 48×48, modal close
  37×37 flex-centred, pricing cards share one height with the middle one scaled, footer columns
  on the copyright's axis. Demo: sidebar collapses below the 900 px **split** (not the sheet's
  768 px), every hash change scrolls to top, the duplicate `input` demo row is gone.
- **Batch 34 (2026-11-14):** `@aio-ui` **0.2.0** is published — tag `v0.2.0` and the `cdn` branch
  both at `5251e20` (40 packages), the GitHub release carries 43 assets as a pre-release, 10/10
  sampled CDN URLs answer `200`, `checksums.txt` is byte-identical, and `release.test.ts` is
  15/15 against the tag. New handout `docs/live-cdn-migration.md` maps copied files and symbols
  onto the packages for apps that still vendor the source; `docs/live-cdn-repo.md` follows the tag.
  The demo deploys itself to Pages: `deploy.yml` builds `build:pkgs` + the demo under `/-aio-ui-dev/`.
- **Batch 32 (2026-11-14):** the last five `#form` topics have live demos (`cascade`,
  `calculation`, `id-address`, `modules`, `layout`). Building them exposed a real defect: a
  loader handed over by a manifest/registry never ran the **initialize** phase, so `calculation`
  was dead on every form mounted through the registry. `Form` now resolves every phase through
  the active loader and unloads it between prepares; pinned by a `FormModules` case. Housekeeping:
  `orchestrator/layout.json` regenerated (never listed `skeleton`); CDN guide counts → 40/43.
- **Batches 26–31 (2026-11-14):** the `#form` docs tree went from sliced Markdown to declared
  _parts_ — a topic names its README `source`, the `sections` it claims and an optional live
  demo; `selectOutline` carries nested subsections, `role=contract` marks the four contract
  sections, and the Markdown parser moved out of `@aio-ui/utilities` into its only consumer.
  `Tab.css` `& .menu` → `& > .menu` (a dropdown popover inside a panel was inheriting the tab
  strip), and the skeleton default became a **2000 ms floor** (`"auto"` never painted).
- **Batches 20–25 (2026-11-14):** skeleton, start to finish — 20 in-flow builders draw their
  own silhouette, `duration` became a published floor, placeholder became the mandatory
  `@aio-ui/skeleton` package with the optional `Builder.loading?()` hook, the hold moved to
  `base/BaseAdapters/Hydration`, and the `isRoot` debt closed (`dd34f2d`, rule table in
  `APP.md`). The rewrite proved that **Sass-style `&-suffix` is dropped silently by the build**.
- **Batches 15–19 (2026-11-13):** anti-FOUC gate collapsed (family → `0.2.0`), three leak classes
  and L6 closed with measurements (`APP-LIFECYCLE.md` L1/L2/L5/L6), `#form` docs synced.

_(Everything before batch 15 is in `git log`; only open work stays in this file.)_

## Blocked

- **Official release** waits for all four manual model references (`gallery` exists; `store`,
  `profile`, `blog` do not). The tree is at `0.2.0`; the last published tag is `v0.2.0`
  (pre-release, 2026-11-14).

## Open questions

- Generated-site hosting (GitHub Pages vs Cloudflare Pages) — affects deployment only, not the
  preset contract.
