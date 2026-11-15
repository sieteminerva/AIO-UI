/**
 * The token broadcast channel, owned by the theme builder.
 *
 * The builder never talks to a preview: it publishes the derived `--app-*` map on
 * `window`, and whoever listens (a host, an editor bridge) picks it up. The constants
 * live beside the builder so the demo does not have to reach into `.archives/` to
 * compile — the archived Editor keeps its own copy for its iframe protocol.
 */

/** Same-document broadcast: dispatched on `window` whenever the derived tokens move. */
export const THEME_TOKENS_EVENT = "editor:theme-tokens";

/** Detail payload of the `THEME_TOKENS_EVENT` CustomEvent. */
export interface iThemeTokensDetail {
  tokens: Record<string, string>;
  mode: "light" | "dark";
}
