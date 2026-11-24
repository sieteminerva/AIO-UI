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
    expect((outer.querySelector("#province") as HTMLElement).closest(".field")?.getAttribute("data-span")).toBe("100");
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
});
