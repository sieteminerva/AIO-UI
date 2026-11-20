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
export declare class Binding<M extends Record<string, any> = Record<string, any>> {
    #private;
    constructor(proxy: BuilderProxy);
    /** Whether this instance is currently mirroring anything. */
    get active(): boolean;
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
    wire(scope: HTMLElement, model: M | null | undefined, paint?: (scope: HTMLElement, model: M) => void): void;
    /**
     * Stops mirroring one scope: its listeners die with the scope, and the effect dies with
     * the last scope. Detaching a key therefore leaves the builder with exactly the wiring
     * that is still on screen.
     */
    unwire(scope: HTMLElement): void;
    /** Releases everything — called from `destroy()`, never from a builder. */
    dispose(): void;
    /**
     * Re-reads the controls of an already wired scope.
     *
     * Needed when a key is re-rendered inside a scope that stays mounted: the old elements
     * are gone, so the registry has to be rebuilt from the subtree that is there now.
     */
    rescan(scope: HTMLElement): void;
}
//# sourceMappingURL=Binding.d.ts.map