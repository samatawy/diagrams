import { DiagramConstants } from "../model/diagram.constants";
import { ICON_NAMES as FLAG_ICON_NAMES } from "../icons_generated/flag.icons";

export type IconSource =
    | { type: 'svg'; markup: string }
    | { type: 'url'; src: string };

export { FLAG_ICON_NAMES };

/**
 * Registry of icon sources used by editor and toolbar components.
 */
export class IconRegistry {

    private static readonly icons = new Map<string, IconSource>();

    /** 
     * Register an icon by a short key, without the 'icon-' prefix.
     * @param id The icon identifier.
     * @param source The icon source.
     */
    public static register(id: string, source: IconSource): void {
        this.icons.set(id, source);
    }

    /**
     * Register a symbol-defined icon. The symbol markup is converted to an
     * inline SVG so no sprite injection is needed.
     * @param id The icon identifier.
     * @param _symbolId The symbol identifier (unused).
     * @param symbolMarkup The SVG symbol markup.
     */
    public static registerSymbol(id: string, _symbolId: string, symbolMarkup: string): void {
        // Convert <symbol ...>body</symbol> → <svg ...>body</svg> for inline rendering.
        const svg = symbolMarkup
            .replace(/^<symbol\b/, '<svg')
            .replace(/\bid="[^"]*"\s*/g, '')
            .replace(/<\/symbol>$/, '</svg>');
        this.icons.set(id, { type: 'svg', markup: svg });
    }

    /** 
     * Register a standalone SVG string as an icon.
     * @param id The icon identifier.
     * @param markup The SVG markup string.
     */
    public static registerSvg(id: string, markup: string): void {
        this.icons.set(id, { type: 'svg', markup });
    }

    /** 
     * Register an external URL as an icon. 
     * @param id The icon identifier.
     * @param src The URL of the icon.
     */
    public static registerUrl(id: string, src: string): void {
        this.icons.set(id, { type: 'url', src });
    }

    /**
     * Checks if an icon with the given identifier is registered.
     * @param id The icon identifier.
     * @returns True if the icon is registered, false otherwise.
     */
    public static has(id: string): boolean {
        return this.icons.has(id);
    }

    /**
     * Retrieves the icon source for the given identifier.
     * @param id The icon identifier.
     * @returns The icon source if found, undefined otherwise.
     */
    public static get(id: string): IconSource | undefined {
        return this.icons.get(id);
    }

    /** 
     * Returns an Element rendering the icon inline, or null if not found.
     * @param id The icon identifier.
     * @param size The desired size of the icon in pixels.
     * @returns An Element representing the icon, or null if not found.
     */
    public static createElement(id: string, size?: number): Element | null {
        size = size || DiagramConstants.ICON_SIZE;

        const source = this.icons.get(id);
        if (!source) {
            return null;
        }

        if (source.type === 'svg') {
            const tmp = document.createElement('div');
            tmp.innerHTML = source.markup;
            const el = tmp.firstElementChild;
            if (el instanceof SVGElement) {
                el.setAttribute('width', String(size));
                el.setAttribute('height', String(size));
                el.setAttribute('aria-hidden', 'true');
                el.setAttribute('focusable', 'false');
            }
            return el;
        }

        if (source.type === 'url') {
            const img = document.createElement('img');
            img.src = source.src;
            img.alt = '';
            img.width = size;
            img.height = size;
            return img;
        }

        return null;
    }
}

// ─── Built-in icons ──────────────────────────────────────────────────────────

const STROKE_ATTRS = 'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';
const VB = 'viewBox="0 0 24 24"';

/**
 * Wraps icon path markup in a default inline SVG shell used by built-in icons.
 * @param id The SVG id attribute.
 * @param body SVG path/body markup.
 * @returns Full inline SVG markup.
 */
export function sym(id: string, body: string): string {
    return `<svg id="${id}" ${VB} ${STROKE_ATTRS}>${body}</svg>`;
}
