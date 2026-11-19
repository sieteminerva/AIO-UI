> **STEP 0 — logbook, then claim (mandatory, first action of any session):** `node scripts/session.mjs
start` gathers it in one command (`git log --oneline -8`, `git status --short`, the three logbook
> cards, live claims); run the commands by hand if you prefer. Then read **only**
> `.guidance/project/STATUS.md` — the logbook: three
> cards, each a one-line summary plus the link to the real detail. Report the three, say the detail
> is **not** read yet, and ask which card to continue. Open `TASKS.md`, `TASK-*.md` or a band file
> only **after** the user picks. Then read the claim board `.guidance/project/AGENTS.md` and take
> your row **before the first edit** — overlapping a live row is a stop-and-ask, not an override.
> Every finished action category leaves **3 pointer lines** (`CHANGED →`, `PROVED →`, `NEXT →`);
> see `.guidance/AGENT_RULES.md` §10 (checkpoint), §11 (claims), §13 (logbook), §14 (pre-compact
> handoff at ~80k), §15 (commit message shape) and §16 (**proof of render** — the inspection
> ritual every batch that changes output must run).

# AGENTS.md — Rajutan / AIO UI (root router)

One monorepo, four working bands. **Start here, then open the band's `AGENTS.md`.**

| Band             | Folders                           | Read                                                 |
| ---------------- | --------------------------------- | ---------------------------------------------------- |
| Framework + Demo | `packages/**`, `examples/demo/**` | `packages/AGENTS.md`, then `examples/demo/AGENTS.md` |
| Gallery          | `examples/gallery/**`             | `examples/gallery/AGENTS.md`                         |
| Generator        | `orchestrator/**`                 | `orchestrator/AGENTS.md`                             |
| Tooling          | `scripts/**`                      | `scripts/AGENTS.md`                                  |

## Start-of-task protocol (cheap context)

1. Name the band you are in (one line) and read **only** that band's `AGENTS.md`.
2. Then read **only** the docs the band file links. Do **not** crawl `.guidance/` or other
   bands' folders "just to orient".
3. State a 2–3 line plan, then act. Ask before any multi-step refactor.

## Universal hard rules (every band)

- Import map must be `{ "imports": {…} }`; every package root **and** every exact `exports`
  subpath must be mapped (a prefix cannot add `.js`).
- A builder node key must be a **real tag** (`div#masonry`), never the builder word.
- Form sub-module refs need `export: "<symbol>"`, or the registry resolves the class.
- **CSS house style** (`.guidance/rules.md`) — check every sheet you touch:
  one component sheet has **one root selector**, and every rule nests under it with `&`:
  `& .child` (descendant), `&.bone` (compound — the element carries both classes),
  `&:hover` (state). Media queries stay top-level and re-name the selector they scope.
  **Never** write Sass-style `&-suffix`: the build drops those rules silently.
  A class is one clean word. Prefer a **bare** modifier on a compound (`.skeleton` +
  `.bone` → `&.bone`); a `-` join (`skeleton-bone`) is only for a modifier that must
  stand alone as its own class, and never more than two words.
  Component tokens are `--<component>-*` and must derive from an `--app-*` token.
- **Proof of render:** a batch that changes what gets rendered states what it built —
  `builder.inspect()` or `inspectPage(root)` in a test, or a measured browser number
  (`.guidance/AGENT_RULES.md` §16). "It looks right" is not a proof, and a gate that was
  already green proves nothing about a feature that did not exist when it ran.
- **Gates by tier, not by habit** (`AGENT_RULES.md` §4): the inner loop is `dev`/`build` and nothing
  else; `npm run check` (~12 s) before a commit that touched a type, an `exports` map, an import
  edge or a README
  table; `npm run verify` (~54 s, adds the tests) **once** at the end of a batch; `npm run verify:pkgs`
  (~2 m 23 s) before a release. Every tier reads source, so none needs a prior build.
- Answer in **Bahasa Indonesia**; repo artifacts (code, comments, docs, copy) stay **English**.

## Where the "why" lives

- Decisions / history / rationale: `.guidance/` (`plan*.md`, `DECISIONS.md`, `RAJUTAN.md`).
  Open only when a band file links to it.
- Working rules & token discipline: `.guidance/AGENT_RULES.md`.
- Current status: `.guidance/project/STATUS.md` (read at session start, ≤ 80 lines).
