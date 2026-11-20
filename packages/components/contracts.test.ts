import { describe, expect, it } from "vitest";

import { normalize, validate } from "@aio-ui/base";
import type { iContentContract } from "@aio-ui/core/interface";

import { AccordionBuilder } from "@aio-ui/accordion";
import { ArticleBuilder } from "@aio-ui/article";
import { BadgeBuilder } from "@aio-ui/badge";
import { CarouselBuilder } from "@aio-ui/carousel";
import { CodeBlockBuilder } from "@aio-ui/code-block";
import { FabMenuBuilder } from "@aio-ui/fab-menu";
import { FooterBuilder } from "@aio-ui/footer";
import { FormBuilder } from "@aio-ui/form";
import { InputBuilder } from "@aio-ui/input";
import { MarkdownBuilder } from "@aio-ui/markdown";
import { MasonryBuilder } from "@aio-ui/masonry";
import { MenuBuilder } from "@aio-ui/menu";
import { MessageBuilder } from "@aio-ui/message";
import { ModalBuilder } from "@aio-ui/modal";
import { ModeSwitcherBuilder } from "@aio-ui/mode-switcher";
import { PricingCardBuilder } from "@aio-ui/pricing-card";
import { ProductBuilder } from "@aio-ui/product";
import { RatingBuilder } from "@aio-ui/rating";
import { SectionBuilder } from "@aio-ui/section";
import { SkeletonBuilder } from "@aio-ui/skeleton";
import { TabBuilder } from "@aio-ui/tab";
import { TableBuilder } from "@aio-ui/table";

/**
 * BATCH E — every builder that declares a content contract must survive its own example.
 *
 * This is the cheapest possible guard against a contract drifting away from the code: the
 * `example` is the smallest legal payload, and `validate()` is the same normaliser
 * `create()` runs. A broken declaration fails here, before any browser exists.
 *
 * `@aio-ui/id-address` is a plugin, not a builder: it takes no content payload, so it
 * declares no contract and has no row in this table.
 */
const builders: Array<[string, { contract?: iContentContract }]> = [
  ["accordion", AccordionBuilder],
  ["article", ArticleBuilder],
  ["badge", BadgeBuilder],
  ["carousel", CarouselBuilder],
  ["code-block", CodeBlockBuilder],
  ["fab-menu", FabMenuBuilder],
  ["footer", FooterBuilder],
  ["form", FormBuilder],
  ["input", InputBuilder],
  ["markdown", MarkdownBuilder],
  ["masonry", MasonryBuilder],
  ["menu", MenuBuilder],
  ["message", MessageBuilder],
  ["modal", ModalBuilder],
  ["mode-switcher", ModeSwitcherBuilder],
  ["pricing-card", PricingCardBuilder],
  ["product", ProductBuilder],
  ["rating", RatingBuilder],
  ["section", SectionBuilder],
  ["skeleton", SkeletonBuilder],
  ["tab", TabBuilder],
  ["table", TableBuilder],
];

describe("declared content contracts", () => {
  it("covers every builder in the band", () => {
    expect(builders).toHaveLength(22);
  });

  for (const [name, builder] of builders) {
    it(`${name} — declares a contract with a valid example`, () => {
      const contract = builder.contract;
      expect(contract, `${name} must declare static contract`).toBeDefined();
      expect(validate(contract, contract!.example)).toEqual([]);
    });

    it(`${name} — normalising the example twice changes nothing`, () => {
      const contract = builder.contract!;
      const once = normalize(contract, contract.example);
      const twice = normalize(contract, once.content);
      expect(twice.content).toEqual(once.content);
      expect(twice.issues).toEqual([]);
    });
  }
});

/**
 * The union must not be a renamed `any`: one value per narrowed builder that fits no branch.
 * If a contract silently accepts everything again, this table fails.
 */
const rejections: Array<[string, unknown]> = [
  ["code-block", 42],
  ["fab-menu", 42],
  ["markdown", 42],
  ["masonry", 42],
  ["modal", 42],
  ["product", 42],
  ["rating", "high"],
];

describe("narrowed contracts reject a payload that fits no branch", () => {
  for (const [name, value] of rejections) {
    it(`${name} — reports at least one issue`, () => {
      const builder = builders.find(([key]) => key === name)?.[1];
      expect(builder?.contract, `${name} must declare a contract`).toBeDefined();
      expect(validate(builder!.contract, value).length).toBeGreaterThan(0);
    });
  }
});
