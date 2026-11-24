import type { iBasicNode, iBuilderRegistry, iThemeModule } from "@aio-ui/core";
export declare class CyberpunkTheme implements iThemeModule {
    readonly themeId = "cyberpunk";
    readonly name = "Cyberpunk";
    /** Structural hook — the page tree is authored as-is. */
    beforePageRender(pages: iBasicNode[], menu: iBasicNode | null, footer: iBasicNode | null): {
        pages: iBasicNode[];
        menu: iBasicNode | null;
        footer: iBasicNode | null;
    };
    /** Behavioural hook — the CSS does the work; this marks the scope and pins the mode. */
    activate(shell: HTMLElement, _elements: HTMLElement[], _context?: {
        setConfig: (builderName: keyof iBuilderRegistry, newConfig: Record<string, any>) => void;
    }): void;
    /** Unmount hook — leave the shell as found. */
    deactivate(shell: HTMLElement): void;
}
//# sourceMappingURL=CyberpunkTheme.d.ts.map