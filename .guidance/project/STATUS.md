# Project status — index

> Read **only** your band's file, then stop. Band rules: that band's `AGENTS.md`. Why:
> `.guidance/plan*.md`. Decisions: `DECISIONS.md`. Live writers: `AGENTS.md` (claim board).

| Band (folders)                                | Status file    |
| --------------------------------------------- | -------------- |
| Framework — `packages/**`, `examples/demo/**` | `framework.md` |
| Gallery — `examples/gallery/**`                | `gallery.md`   |
| Generator — `orchestrator/**`                  | `generator.md` |
| Tooling — `scripts/**`                         | no queue; rules are in `scripts/AGENTS.md` |

Each project file holds `## Active` (max 3), `## Next` (one line per item) and `## Landed` (the
last three batches). **Done = delete the line**; the evidence lives in the commit message.

Last updated: 2026-11-16

## Cross-project

- **Official release** waits for all four manual model references (`gallery` exists; `store`,
  `profile`, `blog` do not). The tree is at `0.2.0`; the last published tag is `v0.2.0`
  (pre-release, 2026-11-14). Lane: `gallery.md`.
- **Rules**: process `.guidance/AGENT_RULES.md`; engineering + environment
  `docs/framework/COMPONENT-CONVENTIONS.md` (§12 CSS, §13 anti-patterns, §15 env/gates/harness).
- **Memory**: `/memories/` holds state + pointers only — preferences, a band outline per repo, and
  at most three CPs per task file (`AGENT_RULES.md` §12).
