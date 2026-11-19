import type { iPageContent, iPageController } from "@aio-ui/core";

import { mountInto, node } from "../dom";
import { pageHead, shellPage } from "../shell";

/**
 * Data Binding — a reserved address for the guide, not a tutorial yet.
 *
 * The page ships before the seam it documents, on purpose: a guide with a fixed URL is
 * what keeps the contract honest. Every section below is an argument the implementation
 * must satisfy, and none of them claims a method that already exists — section 6 says so
 * inside the page itself.
 */

function section(title: string, summary: string, bullets: string[]): HTMLElement {
  const block = node("section", "doc-section");
  block.append(node("h2", undefined, title), node("p", "summary", summary));

  const list = node("ul");
  for (const bullet of bullets) list.append(node("li", undefined, bullet));
  block.append(list);
  return block;
}

function doc(): HTMLElement {
  const panel = node("div", "doc-panel");

  panel.append(
    node(
      "p",
      "summary",
      "A builder declares one model. The framework owns the wire between that model and the controls inside every scope the builder renders — the builder never touches a listener.",
    ),
  );

  panel.append(
    section(
      "1 · The model",
      "model() is the only writable state a builder owns. It returns a plain object; the base turns it into the reactive proxy, so every read inside an effect and every write outside one share one identity.",
      [
        "One model per builder. A second object is a second source of truth, which is how a component starts disagreeing with itself.",
        "The model is not the payload: the payload is what the caller handed in, the model is what the component may change.",
        "Until input normalisation lands, a builder declares its own model; afterwards model() can default to the normalised data.",
      ],
    ),
  );

  panel.append(
    section(
      "2 · Declaring a control",
      "A control states its intent in the DOM and nothing else. data-bind is the only attribute the framework reads; name is form semantics, never a binding path.",
      [
        "<input data-bind=\"bases.primary\"> — text, range, color and number read on input.",
        "<input type=\"checkbox\" data-bind=\"mode\" data-true-value=\"dark\" data-false-value=\"light\"> — a checkbox is a boolean by default, or the two declared strings when the pair is present.",
        "<select data-bind=\"mixer.mode\"> — a select reads on change, and the bound option must exist by the time the scope is connected.",
      ],
    ),
  );

  panel.append(
    section(
      "3 · What the framework wires",
      "Wiring is automatic once model() exists — a builder never calls wire. The base wires every scope it hands to initialize(): the root from create(), the projected element from attach(), the mounted element from project().",
      [
        "One delegated listener pair per scope, so a control created later inside that scope still works.",
        "One effect per instance, looping the builder's scopes: a scope attached after the first paint is repainted by the same effect.",
        "Hydration writes the model into each control before the first event, so first paint and first keystroke agree.",
        "Teardown is the framework's: destroy() aborts the listeners and stops the effect, and nothing is left to leak.",
      ],
    ),
  );

  panel.append(
    section(
      "4 · Painting what is not a control",
      "paint(scope, model) is the other half of the mirror. Text, classes, tokens and derived markup cannot be expressed as a control value, so the builder draws them — once per scope, from the same model read.",
      [
        "It runs inside the same effect, after the control values are refreshed.",
        "It is optional: a builder whose UI is only controls does not implement it.",
        "It must be idempotent — it renders current state, it does not diff.",
      ],
    ),
  );

  panel.append(
    section(
      "5 · Lifecycle vocabulary",
      "One word per direction: project() places a child into one of my slots, attach() and detach() are the guest side of a slot, and the binding adapter's own wire/unwire stay internal — a builder never calls them.",
      [
        "A scope that is detached loses its binding with it; attaching that key again wires it again.",
        "destroy() is the only teardown a builder calls, and it is never overridden to do binding work.",
      ],
    ),
  );

  const status = node("section", "doc-section");
  status.append(
    node("h2", undefined, "6 · Status"),
    node(
      "p",
      "summary",
      "Shipped in @aio-ui/base: model(), paint(), the Binding adapter (wire/unwire/rescan/dispose) and four tests pinning hydration, both directions, per-scope repaint and teardown. First consumer migrated: the colouriser. Still open: model() defaulting to the normalised payload, and data-bind paths validated against the input contract.",
    ),
  );
  panel.append(status);

  return panel;
}

export class DataBindingPage implements iPageController {
  async onPrepare(): Promise<iPageContent> {
    return shellPage({
      main: {
        ...pageHead("Data Binding", "model · data-bind · automatic wiring · paint · lifecycle"),
        "div.doc-host": {
          onCreated: (element: HTMLElement) => mountInto(element, doc()),
        },
      },
    });
  }
}
