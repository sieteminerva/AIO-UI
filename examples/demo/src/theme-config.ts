/**
 * ONE theme config for the whole demo.
 *
 * The colouriser is re-created on every route render (the switcher is host chrome, and a
 * page change mounts a new one), so the panel used to come back with its construction
 * defaults while the page kept the last broadcast: a `gum` panel over a `chocolaris` page,
 * and every interaction painting the defaults back over whatever the visitor had chosen.
 *
 * The fix is that the panel no longer owns the theme. It reads the config from here on
 * mount and writes every broadcast back, so:
 *
 *   boot      the cached tokens are painted before the first render (`bootTheme()`), which
 *             is what stops the app default flashing ahead of the console;
 *   mount     a new colouriser is seeded from `loadTheme()` — inputs, not pixels;
 *   change    `saveTheme()` stores the inputs plus the tokens they derived, so the next
 *             boot can paint them without running the engine twice.
 *
 * Stored under one key: `localStorage` is the same driver `AppStorage` was registered with
 * in `main.ts`, used directly because this is a boot-time read, before the app exists.
 */

/** The inputs the colouriser can be re-seeded with. A preset name alone is not enough. */
export interface iThemeConfig {
  preset: string;
  primary: string;
  accent: string;
  mode: "light" | "dark";
}

/** What is on disk: the inputs, plus the token map they derived at the time. */
export interface iThemeCache extends iThemeConfig {
  tokens: Record<string, string>;
}

const STORAGE_KEY = "demo:theme-config";

/** `localStorage` throws in a private window with storage disabled: read, never assume. */
function box(): Storage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

/** The cached config, or `null` on a first visit (or when the entry is unusable). */
export function loadTheme(): iThemeCache | null {
  const raw = box()?.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as iThemeCache;
    if (!parsed || typeof parsed.tokens !== "object" || !parsed.tokens) return null;
    return parsed;
  } catch {
    return null;
  }
}

/** Store the config. A quota error must not break the toggle that produced it. */
export function saveTheme(theme: iThemeCache): void {
  try {
    box()?.setItem(STORAGE_KEY, JSON.stringify(theme));
  } catch {
    /* a full or disabled store — the live page already has the new tokens */
  }
}

/**
 * Paint a cache entry on `<html>`.
 *
 * Exactly what a broadcast does, minus the event: the same properties, the same
 * `color-scheme` and `data-mode`, so the page behind the popover and the popover itself
 * agree from the first frame.
 */
export function applyTheme(theme: Pick<iThemeCache, "tokens" | "mode">): void {
  const style = document.documentElement.style;
  for (const [name, value] of Object.entries(theme.tokens)) style.setProperty(name, value);
  style.colorScheme = theme.mode;
  document.documentElement.dataset.mode = theme.mode;
}

/** Boot hook: `main.ts` calls this at import time, before the app renders anything. */
export function bootTheme(): void {
  const cached = loadTheme();
  if (cached) applyTheme(cached);
}
