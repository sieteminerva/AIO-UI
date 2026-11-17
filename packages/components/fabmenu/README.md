# FabMenu (`@aio-ui/fabmenu`)

FabMenu is the floating action button: a trigger in a viewport corner that opens a panel of
labelled options. It closes on selection (configurable), on a second trigger press, and after an
idle `duration` with no interaction.

The sheet positions it `fixed` with a very large `z-index`, so a host that needs it contained (a
preview frame, a split pane) must override both — the demo does exactly that for its Display panel.

## Payload

```ts
{
  title: "Menu",
  actions: [
    { label: "WhatsApp", id: "wa", type: "button" },
    { label: "Email", href: "mailto:halo@example.com" },
  ];
}
```

`title` is uppercased by the component; `actions` become `button` elements whose `label`, `id` and
`type` come straight from the record. An option without a label prints `Option`.

### Element payload

An entry in `actions` may be an **`HTMLElement`**: it is mounted as-is, untouched, instead of an
option button. The payload itself may be an element too — the panel then holds just that element and
gets no title.

```ts
const dock = new SliderBank(); // any element, no registration involved
build("fab-menu", { actions: [{ label: "Reset" }, dock] });
build("fab-menu", dock); // element as the whole payload
```

This is the same contract as `tab` (`body`), `form` (`inputs`) and `modal` (content): the fab stops
being only a list of destinations and can host a real control surface — the demo docks its colour
generator there, so theme style, mode and colour live in one place.

## Config

| Option            | Default         | Meaning                                     |
| ----------------- | --------------- | ------------------------------------------- |
| `position`        | `"bottom-left"` | One of the five `FabPosition` values        |
| `closeOnSelected` | `true`          | Close the panel when an option is chosen    |
| `duration`        | `10000`         | Idle ms before auto-close (`null` disables) |
| `closeIcon`       | `"✕"`           | Glyph shown when open                       |
| `displayIcon`     | `"⚙️"`          | Glyph shown when closed                     |
| `container`       | `null`          | Element the fab is appended to              |
| `selectors`       | see defaults    | Per-key tag/class override                  |

The trigger is appended before or after the panel depending on `position`, so the panel opens away
from the nearest viewport edge.

## Nodes

| Key                  | Default tag | Class         |
| -------------------- | ----------- | ------------- |
| `@fab`               | `div`       | `fab`         |
| `@fab>panel`         | `div`       | `panel`       |
| `@fab>panel>title`   | `span`      | `title`       |
| `@fab>panel>item`    | `button`    | `item option` |
| `@fab>panel>trigger` | `button`    | `trigger`     |

## Tokens

No `--fab-menu-*` layer and no token reads: the sheet is geometry and a handful of literals. Nothing
to override at the layer level; restyle through `config.selectors` if a host needs a different shape.

## Wiring checklist

1. Add `"fab-menu"` to `iBuilderRegistry` in `packages/core/src/types/registry.ts`.
2. Add a loader for `@aio-ui/fabmenu` to the host's asset map.
3. Add a `stylesheet` loader for `@aio-ui/fabmenu/FabMenu.css`.
4. List it in the host's route plan: `registerModule(components, [{ route, components: ["fab-menu"] }])`.
