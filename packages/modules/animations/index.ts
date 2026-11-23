/** Public surface of `@aio-ui/animations` — curated, never `export *`. */

export { AnimationsService } from "./Animations";
export type { AnimationServiceConfig } from "./Animations";

// The behaviour registry ships with the service: one specifier for the animation layer.
export { ANIMATION_BEHAVIOURS, ANIMATION_TYPES, indexBehaviours } from "./behaviours/registry";
