# Gallery — status (`examples/gallery/**`)

Band rules: `examples/gallery/AGENTS.md`. Why: `.guidance/plan-gallery.md`.
Index: `STATUS.md`.

## Active (max 3)

| #   | Task                   | State  | Gate                                                                             |
| --- | ---------------------- | ------ | -------------------------------------------------------------------------------- |
| 1   | `profile` reference    | queued | home, services, contact, portfolio render; boundaries documented                  |

## Next

- Connect `AboutContent` to the router.
- Decide the first portfolio data schema, then selected work records per category.
- Project detail content: problem, process, result, media.
- Archive browsing and filtering; Flash game archive fallback (Ruffle or gameplay media).
- Blog content model; EN + ID content objects; language switcher last.
- Make gallery the first generated profile example.
- `store` reference: catalog, product, cart, checkout with a real data shape _(paused; `product`
  now composes grid + detail itself — re-check before resuming)_.
- `blog` reference: home, post list, post, about.
- Document each reference's boundaries: capabilities it proves and avoids.

## Release gate

The official release waits for all four manual models — `gallery` exists, `store` / `profile` /
`blog` do not.
