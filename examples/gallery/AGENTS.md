> **STEP 0 — logbook, then claim (mandatory, first action of any session):** `git log --oneline -8`,
> then `git status --short`, then read **only** `.guidance/project/STATUS.md` — the logbook: three
> cards, each a one-line summary plus the link to the real detail. Report the three, say the detail
> is **not** read yet, and ask which card to continue. Open `TASKS.md`, `TASK-*.md` or a band file
> only **after** the user picks. Then read the claim board `.guidance/project/AGENTS.md` and take
> your row **before the first edit** — overlapping a live row is a stop-and-ask, not an override.
> Every finished action category leaves **3 pointer lines** (`CHANGED →`, `PROVED →`, `NEXT →`);
> see `.guidance/AGENT_RULES.md` §10 (checkpoint), §11 (claims), §13 (logbook), §14 (pre-compact
> handoff at ~80k), §15 (commit message shape) and §16 (**proof of render** — the inspection
> ritual every batch that changes output must run).

# AGENTS.md — Gallery band (`examples/gallery/**`)

The **profile model** example: a portfolio/work-archive webapp and the first generated-profile
target for the Rajutan generator.

## What it is

Personal portfolio archive, a living AIO UI example, and an integration test for the future
`aio new --type profile`. Preserve personal history, visual character, and the link between
design/software/making/music — do **not** reduce it to a generic template.

## Layout & content

- Page content is `iNodeContent` objects rendered through `DOMRenderer`.
- Content/copy lives in `src/content/` (`copy.md`); pages in `src/pages/`.
- Read `docs/framework/DOMRenderer.md` only when changing the content schema or renderer behaviour.
- Uses `article`, `masonry`, `form`, `table`, `rating` components.

## Commands

```bash
npm run dev      # gallery is the default dev target (from repo root)
npm run build    # gallery build (from repo root)
```

## Requirements

- Must be mobile-first (`clamp()` typography) for a middle-to-low-education audience.
- Provide both dark and light themes; keep animations consistent with the rest of the site.
- The multistep, paragraph-driven form is the main course — style it to match the site.
- Future i18n: English and Indonesian content objects kept consistent.

## Tasking

This file carries rules only. The queue is `.guidance/project/gallery.md`; live work for a folder
is that folder's `TASKS.md`. Official release waits for all four models (`gallery`, `store`,
`profile`, `blog`).

## Do NOT read by default

`docs/generator/apps-script-integration.md`, `orchestrator/**`, `packages/**` internals — unless a task genuinely
crosses into the framework or generator.
