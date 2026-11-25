// @vitest-environment happy-dom
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { ModuleLoader } from "@aio-ui/module-loader";

import { FormBuilder } from "../Form";
import { inputFormAdapter } from "../Input.FormAdapter";

/**
 * A row renders fields side by side — the schema is `{ label, column, row: [...] }`, and
 * the DOM it produces is what the CSS grid keys off. No `<fieldset>`, no `<legend>`: that
 * word stays reserved for `group`.
 */
function renderForm(schema: any[]): HTMLFormElement {
  return new FormBuilder({ modules: new ModuleLoader("form", [inputFormAdapter]) }).create({ content: schema }) as HTMLFormElement;
}

describe("form rows", () => {
  const schema = [
    {
      id: "identity",
      label: "Identitas",
      column: 2,
      row: [
        { content: { type: "text", id: "first", label: "Nama depan" }, config: { wide: 50 } },
        { content: { type: "text", id: "last", label: "Nama belakang" }, config: { wide: "50" } },
        { content: { type: "textarea", id: "street", label: "Alamat" }, config: { wide: "auto" } },
      ],
    },
  ];

  it("renders a layout container, not a fieldset", () => {
    const row = renderForm(schema).querySelector(".field.group[data-column]") as HTMLElement;

    expect(row).not.toBeNull();
    expect(row.tagName).toBe("DIV");
    expect(row.querySelector("legend")).toBeNull();
    expect(row.classList.contains("group")).toBe(true);
    expect(row.classList.contains("row")).toBe(false);
  });

  it("declares its line cap for the grid", () => {
    const row = renderForm(schema).querySelector(".field.group[data-column]") as HTMLElement;

    expect(row.dataset.column).toBe("2");
  });

  it("renders the label as a heading that spans the row", () => {
    const row = renderForm(schema).querySelector(".field.group[data-column]") as HTMLElement;
    const title = row.querySelector(".title");

    expect(title?.textContent).toBe("Identitas");
  });

  it("applies each child's width as a share of the row", () => {
    const row = renderForm(schema).querySelector(".field.group[data-column]") as HTMLElement;
    const fields = [...row.querySelectorAll(":scope > .field")] as HTMLElement[];

    expect(fields).toHaveLength(3);
    expect(fields[0].dataset.span).toBe("50");
    expect(fields[2].dataset.span).toBe("100");
    expect(fields[2].style.getPropertyValue("--span")).toBe("100");
  });

  it("keeps every field intact inside the row", () => {
    const row = renderForm(schema).querySelector(".field.group[data-column]") as HTMLElement;

    expect(row.querySelector("#first")).not.toBeNull();
    expect(row.querySelector('label[for="street"]')?.textContent).toBe("Alamat");
  });

  it("lets a row nest inside a row as a grid cell", () => {
    const nested = [
      {
        id: "outer",
        column: 2,
        row: [
          {
            column: 1,
            wide: 50,
            row: [
              { content: { type: "text", id: "city", label: "Kota" } },
              { content: { type: "text", id: "zip", label: "Kode pos" } },
            ],
          },
          { content: { type: "text", id: "province", label: "Provinsi" } },
        ],
      },
    ];
    const form = renderForm(nested);
    const outer = form.querySelector(".field.group[data-column]") as HTMLElement;
    const inner = outer.querySelector(":scope > .field.group[data-column]") as HTMLElement;

    expect(inner).not.toBeNull();
    expect(inner.dataset.column).toBe("1");
    expect(inner.dataset.span).toBe("50");
    expect(inner.querySelectorAll(":scope > .field")).toHaveLength(2);
    // Outer `column: 2`: the row took 50, so the undeclared sibling takes the other 50.
    expect((outer.querySelector("#province") as HTMLElement).closest(".field")?.getAttribute("data-span")).toBe("50");
  });

  it("still lets a plain group render a fieldset", () => {
    const form = renderForm([{ id: "plain", title: "Biasa", group: [{ content: { type: "text", id: "x", label: "X" } }] }]);

    expect(form.querySelector("fieldset.form-group")).not.toBeNull();
    expect(form.querySelector(".field.group[data-column]")).toBeNull();
  });

  it("renders a row nested inside a group as a grid, not as one field", () => {
    // The row used to fall through to the field renderer: no `type`, so a single nameless
    // input appeared where the whole grid should be.
    const form = renderForm([
      {
        id: "wrap",
        group: [
          {
            id: "inner-row",
            column: 2,
            row: [
              { content: { type: "text", id: "sku", label: "SKU" } },
              { content: { type: "text", id: "qty", label: "Qty" } },
            ],
          },
        ],
      },
    ]);

    const row = form.querySelector("fieldset.form-group > .field.group[data-column]") as HTMLElement;

    expect(row).not.toBeNull();
    expect(row.id).toBe("inner-row");
    expect(row.querySelectorAll("input")).toHaveLength(2);
    expect(form.querySelector("#sku")).not.toBeNull();
    // No stray field rendered from the row descriptor itself (the row is `.field.group`).
    expect(form.querySelectorAll("fieldset.form-group > .field:not(.group)")).toHaveLength(0);
  });

  it("lays 20/40/40 out exactly, and drops a fourth child to the next line", () => {
    const form = renderForm([
      {
        id: "share",
        column: 3,
        row: [
          { content: { type: "text", id: "a", label: "A" }, config: { wide: 20 } },
          { content: { type: "text", id: "b", label: "B" }, config: { wide: 40 } },
          { content: { type: "text", id: "c", label: "C" }, config: { wide: 40 } },
          { content: { type: "text", id: "d", label: "D" }, config: { wide: 20 } },
        ],
      },
    ]);
    const row = form.querySelector(".field.group[data-column]") as HTMLElement;
    const fields = [...row.querySelectorAll(":scope > .field")] as HTMLElement[];

    // Percentages, not rounded columns: 20 / 40 / 40 is what the schema asked for.
    expect(fields.map((el) => el.dataset.span)).toEqual(["20", "40", "40", "20"]);
    expect(fields.map((el) => el.style.gridColumn)).toEqual([
      "1 / span 20",
      "21 / span 40",
      "61 / span 40",
      // The line is full (100 units) and the cap is 3: the fourth starts line two.
      "1 / span 20",
    ]);
    expect(fields.map((el) => el.style.gridRow)).toEqual(["1", "1", "1", "2"]);
  });

  it("honours the line cap even when the widths would still fit", () => {
    const form = renderForm([
      {
        id: "cap",
        column: 2,
        row: [
          { content: { type: "text", id: "a", label: "A" }, config: { wide: 20 } },
          { content: { type: "text", id: "b", label: "B" }, config: { wide: 20 } },
          { content: { type: "text", id: "c", label: "C" }, config: { wide: 20 } },
        ],
      },
    ]);
    const row = form.querySelector(".field.group[data-column]") as HTMLElement;
    const fields = [...row.querySelectorAll(":scope > .field")] as HTMLElement[];

    expect(fields.map((el) => el.style.gridRow)).toEqual(["1", "1", "2"]);
    expect(fields[2].style.gridColumn).toBe("1 / span 20");
  });

  it("starts a new line when a share would pass 100", () => {
    const form = renderForm([
      {
        id: "over",
        column: 3,
        row: [
          { content: { type: "text", id: "a", label: "A" }, config: { wide: 60 } },
          { content: { type: "text", id: "b", label: "B" }, config: { wide: 60 } },
        ],
      },
    ]);
    const row = form.querySelector(".field.group[data-column]") as HTMLElement;
    const fields = [...row.querySelectorAll(":scope > .field")] as HTMLElement[];

    // 60 + 60 would create implicit tracks and shrink the whole row, so the second wraps.
    expect(fields[1].style.gridColumn).toBe("1 / span 60");
    expect(fields[1].style.gridRow).toBe("2");
  });

  it("gives a child that says nothing the whole row", () => {
    const form = renderForm([
      {
        id: "full",
        column: 1,
        row: [
          { content: { type: "text", id: "a", label: "A" }, config: { wide: 50 } },
          { content: { type: "text", id: "b", label: "B" } },
        ],
      },
    ]);
    const row = form.querySelector(".field.group[data-column]") as HTMLElement;
    const fields = [...row.querySelectorAll(":scope > .field")] as HTMLElement[];

    expect(fields[1].dataset.span).toBe("100");
    expect(fields[1].style.gridColumn).toBe("1 / span 100");
    expect(fields[1].style.gridRow).toBe("2");
  });
});

/**
 * A group honours the same `column` / `wide` contract as a row — the demo's calculation
 * topic is a `column: 2` group, and the README table lists `column` for both. The grid is
 * still the sheet's job; what this pins is the resolved `--span` every child carries.
 */
describe("group columns", () => {
  const schema = [
    {
      id: "order",
      title: "Satu baris pesanan",
      column: 2,
      group: [
        { content: { type: "number", id: "qty", label: "Qty" }, config: { wide: 50 } },
        { content: { type: "number", id: "price", label: "Harga" }, config: { wide: 50 } },
        { content: { type: "number", id: "total", label: "Total" }, config: { wide: "auto" } },
      ],
    },
  ];

  it("declares its line cap on the fieldset", () => {
    const group = renderForm(schema).querySelector("fieldset.form-group") as HTMLElement;

    expect(group.dataset.column).toBe("2");
  });

  it("stamps every child with its share of the grid", () => {
    const group = renderForm(schema).querySelector("fieldset.form-group") as HTMLElement;
    const fields = [...group.querySelectorAll(":scope > .field")] as HTMLElement[];

    expect(fields.map((el) => el.dataset.span)).toEqual(["50", "50", "100"]);
    expect(fields[2].style.getPropertyValue("--span")).toBe("100");
    expect(fields.map((el) => el.style.gridColumn)).toEqual(["1 / span 50", "51 / span 50", "1 / span 100"]);
  });

  it("leaves a group without `column` a plain stack", () => {
    const group = renderForm([{ id: "plain", group: schema[0].group }])
      .querySelector("fieldset.form-group") as HTMLElement;

    expect(group.dataset.column).toBeUndefined();
    expect((group.querySelector(":scope > .field") as HTMLElement).style.getPropertyValue("--span")).toBe("");
  });
});

/**
 * The sheet reads only the two variables FormLayout writes. happy-dom does not run the
 * cascade, so the grid itself is pinned as a rule on both container roots; the measured
 * width comes from the browser probe on the demo routes.
 */
describe("form sheet reads the resolved span", () => {
  const sheet = readFileSync(resolve(process.cwd(), "packages/components/form/Form.css"), "utf8");

  it("defines the row grid in row units and the child share from --span", () => {
    expect(sheet).toMatch(/^\.field\.group\[data-column\],/m);
    expect(sheet).toMatch(/grid-template-columns: repeat\(100, minmax\(0, 1fr\)\)/);
    expect(sheet).toMatch(/grid-column: span var\(--span, 100\)/);
  });

  it("gives a column group the same grid", () => {
    expect(sheet).toMatch(/^\s*\.form > fieldset\.form-group\[data-column\] \{/m);
    expect(sheet).toMatch(/\.form > fieldset\.form-group\[data-column\] \{[\s\S]*?grid-column: span var\(--span, 100\)/);
  });

  it("keeps --span from inheriting into a nested container", () => {
    expect(sheet).toMatch(/@property --span \{[\s\S]*inherits: false/);
  });

  it("carries no Sass-style suffix the build would drop", () => {
    expect(sheet).not.toMatch(/&-[a-z]/i);
  });

  it("gives the footer the note-line rule it never had", () => {
    expect(sheet).toMatch(/^\.form > \.form-footer \{/m);
    expect(sheet).toMatch(/\.form > \.form-footer \{[\s\S]*?border-top: 1px solid var\(--form-footer-border\)/);
    expect(sheet).toMatch(/--form-footer-border: var\(--app-border-color\)/);
  });
});

/**
 * A toggle field is a grid of its own (Input.css §8). The row used to force every direct
 * child to `display: block` (0,4,0, declared later), which outranked
 * `:has(> .switch.control)` and stacked the label above the switch — `data-position` had no
 * effect. happy-dom runs no cascade, so the split is pinned as a rule pair here; the
 * measured geometry comes from the browser probe on the demo form route.
 */
describe("a toggle keeps its shell inside a row", () => {
  const schema = [
    {
      id: "flags",
      column: 3,
      row: [
        { content: { type: "checkbox", id: "notify", label: "Notifikasi" }, config: { view: "toggle" } },
        { content: { type: "checkbox", id: "digest", label: "Ringkasan harian" }, config: { view: "toggle" } },
      ],
    },
  ];

  it("renders the switch as a direct child, so `:has(> .switch.control)` can match", () => {
    const row = renderForm(schema).querySelector(".field.group[data-column]") as HTMLElement;
    const toggle = row.querySelector(":scope > .field") as HTMLElement;

    expect(toggle.querySelector(":scope > .switch.control")).not.toBeNull();
    // A nested (descendant) switch would prove nothing: the sheet keys off a direct child.
    expect(toggle.querySelector(":scope > .switch.control > input")?.getAttribute("type")).toBe("checkbox");
    // The toggle defaults its caption to `right`, which needs the shell's grid to render.
    expect(toggle.querySelector(":scope > label")?.getAttribute("data-position")).toBe("right");
  });

  it("keeps every toggle a grid cell with a share of the row", () => {
    const row = renderForm(schema).querySelector(".field.group[data-column]") as HTMLElement;
    const fields = [...row.querySelectorAll(":scope > .field")] as HTMLElement[];

    expect(fields).toHaveLength(2);
    // No `wide`: `column: 3` divides the line, whatever the field type is.
    expect(fields.map((el) => el.style.gridColumn)).toEqual(["1 / span 34", "35 / span 33"]);
    expect(fields.map((el) => el.dataset.span)).toEqual(["34", "33"]);
  });
});

describe("the row sheet leaves the toggle shell alone", () => {
  const sheet = readFileSync(resolve(process.cwd(), "packages/components/form/Form.css"), "utf8");

  it("blocks only the children that are not toggle shells", () => {
    expect(sheet).toMatch(/& > \.field:not\(:has\(> \.switch\.control\)\)/);

    // The shared property block no longer declares `display` at all — that was the 0,4,0
    // declaration which beat the shell.
    const shared = /& > \.field,\s*& > \.field\.group\[data-column\],\s*& > \.form-group\[data-column\] \{([\s\S]*?)\r?\n  \}/.exec(sheet);
    expect(shared).not.toBeNull();
    expect(shared![1]).not.toMatch(/\bdisplay:/);
  });

  it("gives the toggle cell its grid back, declared after the block rule", () => {
    const blockAt = sheet.indexOf("& > .field:not(:has(> .switch.control))");
    const gridAt = sheet.indexOf("& > .field:has(> .switch.control)");

    expect(blockAt).toBeGreaterThan(-1);
    expect(gridAt).toBeGreaterThan(blockAt);
    expect(sheet.slice(gridAt)).toMatch(/^& > \.field:has\(> \.switch\.control\) \{\s*display: grid;/);
  });
});

/**
 * `column` is the line cap **and** the default share: a child that declares no `wide`
 * takes an equal slice of its line, so three fields under `column: 3` are a third each.
 * A fourth no longer fits and takes the whole next line.
 */
describe("column divides the line by default", () => {
  const rowOf = (schema: any[]) => {
    const row = renderForm(schema).querySelector(".field.group[data-column]") as HTMLElement;
    return [...row.querySelectorAll(":scope > .field")] as HTMLElement[];
  };

  it("gives three undeclared children a third each under `column: 3`", () => {
    const fields = rowOf([
      {
        id: "thirds",
        column: 3,
        row: [
          { content: { type: "text", id: "a", label: "A" } },
          { content: { type: "text", id: "b", label: "B" } },
          { content: { type: "text", id: "c", label: "C" } },
        ],
      },
    ]);

    // 100 / 3: the remainder is spread from the left so the line ends flush.
    expect(fields.map((el) => el.dataset.span)).toEqual(["34", "33", "33"]);
    expect(fields.map((el) => el.style.gridColumn)).toEqual(["1 / span 34", "35 / span 33", "68 / span 33"]);
    expect(fields.map((el) => el.style.gridRow)).toEqual(["1", "1", "1"]);
  });

  it("gives a fourth undeclared child the whole next line", () => {
    const fields = rowOf([
      {
        id: "wrap",
        column: 3,
        row: [
          { content: { type: "text", id: "a", label: "A" } },
          { content: { type: "text", id: "b", label: "B" } },
          { content: { type: "text", id: "c", label: "C" } },
          { content: { type: "text", id: "d", label: "D" } },
        ],
      },
    ]);

    expect(fields.map((el) => el.dataset.span)).toEqual(["34", "33", "33", "100"]);
    expect(fields[3].style.gridRow).toBe("2");
    expect(fields[3].style.gridColumn).toBe("1 / span 100");
  });

  it("shares what an explicit `wide` leaves on the line", () => {
    const fields = rowOf([
      {
        id: "rest",
        column: 2,
        row: [
          { content: { type: "text", id: "a", label: "A" }, config: { wide: 30 } },
          { content: { type: "text", id: "b", label: "B" } },
        ],
      },
    ]);

    expect(fields.map((el) => el.dataset.span)).toEqual(["30", "70"]);
    expect(fields[1].style.gridColumn).toBe("31 / span 70");
  });

  it("keeps a group without `column` a full-width stack", () => {
    const form = renderForm([
      {
        id: "stack",
        group: [
          { content: { type: "text", id: "a", label: "A" } },
          { content: { type: "text", id: "b", label: "B" } },
        ],
      },
    ]);
    const fields = [...form.querySelectorAll("fieldset.form-group > .field")] as HTMLElement[];

    expect(fields.map((el) => el.dataset.span ?? "")).toEqual(["", ""]);
  });
});

describe("the input shell matches a direct child, nested too", () => {
  const sheet = readFileSync(resolve(process.cwd(), "packages/components/input/Input.css"), "utf8");
  const shellAt = sheet.indexOf("&:has(> .switch.control)");
  const shell = sheet.slice(shellAt, sheet.indexOf("@starting-style", shellAt));

  it("uses a child combinator, never a descendant match", () => {
    expect(sheet).toMatch(/&:has\(> \.switch\.control\)/);
    expect(sheet).not.toMatch(/:has\(\.switch\.control\)/);
  });

  it("restores the grid for a toggle nested in a group", () => {
    // The base field block (`.field:is(.group) .field`, 0,3,0) outranks the bare shell.
    expect(sheet).toMatch(/\.field:is\(\.group\) \.field:has\(> \.switch\.control\) \{\s*display: grid;/);
  });

  it("wins without `!important`", () => {
    expect(shell.length).toBeGreaterThan(0);
    expect(shell).not.toMatch(/!important/);
  });

  /**
   * A toggle used to pin the FIELD to one `--input-min-height` line, so the label and the
   * switch overflowed a 29px box and a `top` toggle spilled 38px past its own field while
   * its neighbours measured 61.7px. The height must come from the content, and the band
   * the switch centres in must be the box a text control occupies — not the field's line.
   */
  it("sizes the control band, never the whole field", () => {
    expect(shell).not.toMatch(/^\s*height:\s*var\(--input-min-height\)/m);
    expect(shell).toMatch(/grid-template-rows: auto var\(--input-control-height\)/);
    expect(shell).toMatch(/grid-template-rows: var\(--input-control-height\)( auto)?;/);
  });

  it("derives the band from one control line box", () => {
    expect(sheet).toMatch(/--input-control-line: calc\(var\(--input-line-height\) \* 1\.3\)/);
    expect(sheet).toMatch(/--input-control-height: calc\(var\(--input-font-size\) \* var\(--input-control-line\)\)/);
    // The shared control rule and the toggle band read the same line, so they cannot drift.
    expect(sheet).toMatch(/line-height: var\(--input-control-line\)/);
  });

  it("gives the caption the same type as a field label", () => {
    expect(shell).toMatch(/& > label \{[\s\S]*?font-size: var\(--input-label-size\)/);
    expect(shell).toMatch(/& > label \{[\s\S]*?color: var\(--input-label-color\)/);
    // The 0.7em caption with its own padding is what made a top toggle taller than its row.
    expect(shell).not.toMatch(/font-size: calc\(var\(--input-font-size\) \* 0\.7\)/);
  });
});
