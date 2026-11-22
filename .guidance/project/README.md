# Gallery project brief

The `examples/gallery` app's own brief — **not** the monorepo index. Orientation is
`.guidance/project/STATUS.md`; band rules are the six `AGENTS.md` files named by the root router.

## Project

Personal portfolio archive and the first reference app of the AIO framework (the other three —
`store`, `profile`, `blog` — do not exist yet).

## Purpose

This project serves three roles:

- personal portfolio and work archive;
- living example of the AIO framework;
- integration test for the future `aio new --type profile` generator.

## Main Areas

- personal story and About content;
- software engineering projects;
- visual, motion, and brand work;
- product and fabrication work;
- music and audio work;
- blog and technical notes;
- future i18n support;
- future gallery and archive modules.

## Current Principle

Do not optimize for a generic portfolio template. Preserve the personal history, visual character, and connection between design, software, physical making, and music.

## Content and Rendering Notes

- Page content is represented as `iNodeContent` objects and rendered through `DOMRenderer`.
- Read `packages/core/src/DOMRenderer.md` when changing the content schema or renderer behavior.
- The application must remain readable on mobile devices.
- The application should provide both dark and light themes.
- Forms and future content modules should follow the same visual and animation language as the rest of the site.
