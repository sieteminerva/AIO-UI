# TASK — Wizard answers contract (wizard → orchestrator → preset)

Status: agreed 2026-11-22 (owner). Shapes below are frozen; the code that consumes
them lives in `orchestrator/` and `docs/generator/apps-script-integration.md`
describes the Apps Script side.

## 1. Why this document exists

Three objects meet at the orchestrator and only one of them has a type:

| Object         | Owner        | Shape today                                    |
| -------------- | ------------ | ---------------------------------------------- |
| Wizard answers | wizard form  | `iFormConfig.schema` (untitled)                |
| AI content     | Gemini       | `iAiSiteContent` v1 (`orchestrator/src/ai.ts`) |
| Preset         | orchestrator | `iWebPreset` v1 (`orchestrator/src/types.ts`)  |

This document freezes the first one and states the two transformations that turn it
into the other two. Nothing here invents vocabulary: every field id is the wizard's own.

## 2. Request: wizard → Apps Script

```json
{
  "idToken": "<Google Identity Services credential>",
  "answers": { "web-type": "ecommerce", "web-name": "Tenun Lestari" }
}
```

- `idToken` proves the email; the orchestrator verifies it server-side and uses that
  identity for Sheet/repo custody.
- `answers` keeps the wizard's **dashed-case field ids verbatim**. No camelCase
  transform, because the same ids already name form fields, inputs and Sheet columns.
- `model` may be sent as an echo, but **the server derives it** (§3); a client value
  is ignored, never trusted.

## 3. `web-type` → `model` (server-owned mapping)

| `web-type`  | `model`   |
| ----------- | --------- |
| `ecommerce` | `store`   |
| `gallery`   | `gallery` |
| `profile`   | `profile` |
| `portfolio` | `profile` |
| `blog`      | `blog`    |
| `news`      | `blog`    |

Anything else is a validation error (`UNKNOWN_MODEL`), never a guess.

## 4. Wizard fields (source: `.archives/wizard.ts`)

| Set                    | Field id            | Type     | Goes to                                        |
| ---------------------- | ------------------- | -------- | ---------------------------------------------- |
| `intro-set`            | `web-type`          | select   | `model` (§3)                                   |
| `intro-set`            | `web-name`          | text     | `site.name` + `id` slug (server-slugged)       |
| `intro-set`            | `web-reason`        | textarea | prompt only (+ `site.tagline` fallback)        |
| `intro-set`            | `web-author`        | text     | prompt only (owner identity)                   |
| `ecommerce-detail-set` | `detail-product`    | file     | template Sheet choice (not in preset)          |
| `contact-set`          | `contact-email`     | email    | `site.contact.email` (sheet owner)             |
| `contact-set`          | `contact-company`   | text     | prompt only (brand voice)                      |
| `contact-set`          | `contact-logo`      | file     | assets hand-off (not in preset)                |
| `address-set`          | `address-jalan`     | textarea | prompt only                                    |
| `address-set`          | `address-propinsi`  | select   | `config.address` reference for generated forms |
| `address-set`          | `address-kota`      | select   | same                                           |
| `address-set`          | `address-kecamatan` | select   | same                                           |
| `address-set`          | `address-kelurahan` | select   | same                                           |
| `address-set`          | `address-kodepos`   | text     | same                                           |
| `confirmation-set`     | `confirmation`      | checkbox | permission gate (must be `true`)               |

Rules that follow from the table:

1. Only `web-name`, `web-type` and `contact-email` reach the preset directly; the rest
   either feeds the prompt or the deployment, never the page content.
2. Address fields never become page data. They configure the generated form's
   `config.address`, which is what `@aio-ui/id-address` already expects.
3. `confirmation` is a server-side gate: `false` stops the job before a Sheet copy.

## 5. Server-owned preset base (`assemblePreset` second argument)

The AI writes content only. Everything below is set by the orchestrator:

```json
{
  "id": "tenun-lestari",
  "engine": { "range": "^0.2.4", "resolved": "0.2.4" },
  "model": "store",
  "theme": "default",
  "site": { "name": "Tenun Lestari", "locale": "id" },
  "data": [{ "id": "products", "sheet": "products", "endpoint": "https://script.google.com/macros/s/…/exec" }]
}
```

- `id` is `web-name` slugged by the server.
- `engine.resolved` is the tag the generator was built against (read from
  `releases/v<version>/registry.json`), never chosen by the AI.
- `data[].endpoint` is the deployment this job creates; `sheet` names come from the
  model's table map (`docs/generator/` model tables), not from the AI.

## 6. AI output (unchanged)

`iAiSiteContent` v1 (`orchestrator/src/ai.ts`): `contentSchema`, `pages[]`, optional
`site.tagline`/`seo`, `notes[]`. The model may echo `model`/`theme`; the orchestrator
overwrites both from §3 and the base.

## 7. Response envelope (unchanged)

```json
{ "status": "success | partial | error", "meta": { … }, "data": { "sheet": …, "repo": …, "live": …, "guide": […], "message": … } }
```

`data.preset` may be added for the wizard hand-off (`plan-generator.md` §3.6.6). The
envelope shape itself stays as `BuildApiResponse` in `.archives/wizard.ts`.

## 8. Validation order (fail before side effects)

1. `confirmation === true` — else `MISSING_FIELD`.
2. `web-type` known — else `UNKNOWN_MODEL`.
3. `web-name` non-empty — else `MISSING_FIELD`.
4. `contact-email` well-formed — else `MISSING_FIELD`.
5. Copy the Sheet, derive `data[]`, call Gemini.
6. `parseAiContent()` — issues are fed back verbatim (max 2 retries).
7. `assemblePreset()` → `parsePreset()` (shape + closed vocabulary).
8. `plan` → `emit` → `generate`.

## 9. Open items

- Model → Sheet table map (one table per model, column → field type). This is the
  companion contract and lives next to this file when written.
- `data.preset` in the response: add now or with stage C wiring.
- `web-author` vs the Google identity: when they differ, the identity wins for
  custody; the mismatch is reported as a `notes[]` entry.
