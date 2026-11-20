import type { BindableElement } from "./BuilderProxy";
import { BuilderProxy } from "./BuilderProxy";

/**
 * The mirror wire between one builder's model and the controls inside its scopes.
 *
 * A builder never touches this class: `Builder` owns the instance and calls `wire()` at
 * the three points where a DOM scope starts living (the root from `create()`, the element
 * projected by `attach()`, the element mounted by `project()`). Everything below is the
 * consequence of that one call — and of `unwire()`, which is the only way out.
 *
 * One direction is delegated, the other is drawn:
 *
 * - **control → model** — one `input`/`change` pair per scope, captured at the scope root.
 *   A control created later inside that scope is served by the same pair, and a control
 *   removed with its scope is served by nobody: the `AbortController` belongs to the
 *   scope, not to the instance.
 * - **model → control** — one effect per instance that walks every wired scope. It is
 *   registered once and re-runs on a microtask, so attaching three keys to one builder
 *   still paints them from one state instead of three subscriptions.
 *
 * `data-bind` is the only binding attribute. `name` is form semantics and is deliberately
 * not consulted here, even though `BuilderProxy.getBindingPath` falls back to it.
 */
export class Binding<M extends Record<string, any> = Record<string, any>> {
  readonly #proxy: BuilderProxy;
  /** scope root → its controls + the abort handle that releases this scope alone. */
  readonly #scopes = new Map<HTMLElement, { controls: Array<{ element: BindableElement; path: string }>; abort: AbortController }>();
  /** The reactive model, created once for the instance (never per scope). */
  #model: M | null = null;
  #paint: ((scope: HTMLElement, model: M) => void) | null = null;
  #stopEffect: (() => void) | null = null;

  constructor(proxy: BuilderProxy) {
    this.#proxy = proxy;
  }

  /** Whether this instance is currently mirroring anything. */
  public get active(): boolean {
    return this.#scopes.size > 0;
  }

  /**
   * Starts mirroring one scope.
   *
   * Idempotent per scope: re-entering is a no-op, which is what makes `attach()` safe to
   * call repeatedly for the same key. Hydration runs first (model → control), so the first
   * paint already agrees with the model.
   *
   * @param scope - the element whose subtree holds the `[data-bind]` controls.
   * @param model - the builder's plain model; wrapped once, then shared by every scope.
   * @param paint - optional drawer for everything that is not a control value.
   */
  public wire(scope: HTMLElement, model: M | null | undefined, paint?: (scope: HTMLElement, model: M) => void): void {
    if (!model || !(scope instanceof HTMLElement)) return;
    if (this.#scopes.has(scope)) return;

    this.#model ??= this.#proxy.makeReactive("model", model) as M;
    this.#paint ??= paint ?? null;

    const state = this.#model;
    const controls = this.#scan(scope);
    for (const control of controls) {
      this.#proxy.writeValue(control.element, this.#proxy.getByPath(state, control.path));
    }

    const abort = new AbortController();
    const onEvent = (event: Event): void => {
      const target = event.target as HTMLElement | null;
      const element = target?.closest?.<BindableElement>("[data-bind]");
      if (!element || !scope.contains(element)) return;
      const path = element.dataset.bind;
      if (!path) return;
      this.#proxy.setByPath(state, path, this.#proxy.readValue(element));
    };
    scope.addEventListener("input", onEvent, { signal: abort.signal });
    scope.addEventListener("change", onEvent, { signal: abort.signal });

    this.#scopes.set(scope, { controls, abort });
    this.#stopEffect ??= this.#proxy.watchEffect(() => this.#flush());
  }

  /**
   * Stops mirroring one scope: its listeners die with the scope, and the effect dies with
   * the last scope. Detaching a key therefore leaves the builder with exactly the wiring
   * that is still on screen.
   */
  public unwire(scope: HTMLElement): void {
    const entry = this.#scopes.get(scope);
    if (!entry) return;

    entry.abort.abort();
    this.#scopes.delete(scope);

    if (!this.#scopes.size) {
      this.#stopEffect?.();
      this.#stopEffect = null;
    }
  }

  /** Releases everything — called from `destroy()`, never from a builder. */
  public dispose(): void {
    for (const scope of Array.from(this.#scopes.keys())) this.unwire(scope);
    this.#stopEffect?.();
    this.#stopEffect = null;
    this.#model = null;
    this.#paint = null;
  }

  /**
   * Re-reads the controls of an already wired scope.
   *
   * Needed when a key is re-rendered inside a scope that stays mounted: the old elements
   * are gone, so the registry has to be rebuilt from the subtree that is there now.
   */
  public rescan(scope: HTMLElement): void {
    const entry = this.#scopes.get(scope);
    if (!entry || !this.#model) return;

    entry.controls = this.#scan(scope);
    for (const control of entry.controls) {
      this.#proxy.writeValue(control.element, this.#proxy.getByPath(this.#model, control.path));
    }
  }

  /** model → control, then model → everything the builder wants to draw. */
  #flush(): void {
    const model = this.#model;
    if (!model) return;

    for (const [scope, entry] of this.#scopes) {
      for (const control of entry.controls) {
        // Never fight the caret: the control the user is editing is the current value.
        if (control.element === document.activeElement) continue;
        this.#proxy.writeValue(control.element, this.#proxy.getByPath(model, control.path));
      }
      this.#paint?.(scope, model);
    }
  }

  #scan(scope: HTMLElement): Array<{ element: BindableElement; path: string }> {
    const found: Array<{ element: BindableElement; path: string }> = [];
    for (const element of Array.from(scope.querySelectorAll<BindableElement>("[data-bind]"))) {
      const path = element.dataset.bind;
      if (path) found.push({ element, path });
    }
    return found;
  }
}
