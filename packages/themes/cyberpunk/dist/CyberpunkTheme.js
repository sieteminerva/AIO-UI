/**
 * Cyberpunk theme — tokens only.
 *
 * A theme can do three things: reshape the page tree (`beforePageRender`), decorate the
 * live shell (`activate`), and undo that (`deactivate`). This one only flips a marker
 * attribute; everything visual comes from `CyberpunkTheme.css`, which overrides the
 * `--app-*` tokens. That is the cheapest possible theme: no listeners, no DOM surgery,
 * no per-component code — every component that reads the tokens restyles itself.
 *
 * Host responsibility: import `@aio-ui/theme-cyberpunk/CyberpunkTheme.css` once.
 */
const THEME_ID = "cyberpunk";
export class CyberpunkTheme {
    themeId = THEME_ID;
    name = "Cyberpunk";
    /** Structural hook — the page tree is authored as-is. */
    beforePageRender(pages, menu, footer) {
        return { pages, menu, footer };
    }
    /** Behavioural hook — the CSS does the work; this marks the scope and pins the mode. */
    activate(shell, _elements, _context) {
        shell.dataset.theme = THEME_ID;
        // The palette below is fixed-dark (night-city surfaces, cold light on dark). Pin the
        // mode so `light-dark()` pairs and any component dark block resolve against it, instead
        // of following the OS by accident.
        shell.dataset.mode = "dark";
        shell.style.colorScheme = "dark";
    }
    /** Unmount hook — leave the shell as found. */
    deactivate(shell) {
        if (shell.dataset.theme === THEME_ID)
            delete shell.dataset.theme;
        if (shell.dataset.mode === "dark")
            delete shell.dataset.mode;
        if (shell.style.colorScheme === "dark")
            shell.style.removeProperty("color-scheme");
    }
}
//# sourceMappingURL=CyberpunkTheme.js.map