export type IconSource =
    | { type: 'svg'; markup: string }
    | { type: 'url'; src: string };

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
    public static createElement(id: string, size = 18): Element | null {
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
function sym(id: string, body: string): string {
    return `<svg id="${id}" ${VB} ${STROKE_ATTRS}>${body}</svg>`;
}

IconRegistry.registerSymbol('new', 'new',
    sym('new', '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v5h5"/><line x1="12" y1="11" x2="12" y2="17"/><line x1="9" y1="14" x2="15" y2="14"/>'));

IconRegistry.registerSymbol('open', 'open',
    sym('open', '<path d="M3 7h6l2 2h10v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M3 7V5a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v2"/>'));

IconRegistry.registerSymbol('save', 'save',
    sym('save', '<path d="M5 3h11l3 3v15H5z"/><path d="M8 3v6h8V3"/><rect x="8" y="14" width="8" height="6" rx="1"/>'));

IconRegistry.registerSymbol('export', 'export',
    sym('export', '<path d="M4 14v5a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5"/><line x1="12" y1="3" x2="12" y2="15"/><polyline points="7 8 12 3 17 8"/>'));

IconRegistry.registerSymbol('undo', 'undo',
    sym('undo', '<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>'));

IconRegistry.registerSymbol('redo', 'redo',
    sym('redo', '<path d="m15 14 5-5-5-5"/><path d="M19 9H8.5a5.5 5.5 0 0 0 0 11H13"/>'));

IconRegistry.registerSymbol('front', 'front',
    sym('front', '<rect x="8" y="8" width="13" height="13" rx="1"/><path d="M4 15.5V4a1 1 0 0 1 1-1h11.5"/>'));

IconRegistry.registerSymbol('back', 'back',
    sym('back', '<rect x="3" y="3" width="13" height="13" rx="1"/><path d="M8.5 21H20a1 1 0 0 0 1-1V8.5"/>'));

IconRegistry.registerSymbol('delete', 'delete',
    sym('delete', '<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6m4-6v6"/><path d="M9 6V4h6v2"/>'));

IconRegistry.registerSymbol('duplicate', 'duplicate',
    sym('duplicate', '<rect x="8" y="8" width="13" height="13" rx="1"/><path d="M4 15.5V4a1 1 0 0 1 1-1h11.5"/><line x1="14" y1="12" x2="14" y2="18"/><line x1="11" y1="15" x2="17" y2="15"/>'));

IconRegistry.registerSymbol('cut', 'cut',
    sym('cut', '<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/>'));

IconRegistry.registerSymbol('copy', 'copy',
    sym('copy', '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>'));

IconRegistry.registerSymbol('paste', 'paste',
    sym('paste', '<path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/>'));

IconRegistry.registerSymbol('align-left', 'align-left',
    sym('align-left', '<line x1="4" y1="4" x2="4" y2="20"/><rect x="6" y="6" width="14" height="4" rx="1"/><rect x="6" y="13" width="8" height="4" rx="1"/>'));

IconRegistry.registerSymbol('align-center', 'align-center',
    sym('align-center', '<line x1="12" y1="4" x2="12" y2="20"/><rect x="5" y="6" width="14" height="4" rx="1"/><rect x="7" y="13" width="10" height="4" rx="1"/>'));

IconRegistry.registerSymbol('align-right', 'align-right',
    sym('align-right', '<line x1="20" y1="4" x2="20" y2="20"/><rect x="4" y="6" width="14" height="4" rx="1"/><rect x="10" y="13" width="8" height="4" rx="1"/>'));

IconRegistry.registerSymbol('align-top', 'align-top',
    sym('align-top', '<line x1="4" y1="4" x2="20" y2="4"/><rect x="6" y="6" width="4" height="14" rx="1"/><rect x="13" y="6" width="4" height="8" rx="1"/>'));

IconRegistry.registerSymbol('align-middle', 'align-middle',
    sym('align-middle', '<line x1="4" y1="12" x2="20" y2="12"/><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="13" y="7" width="4" height="10" rx="1"/>'));

IconRegistry.registerSymbol('align-bottom', 'align-bottom',
    sym('align-bottom', '<line x1="4" y1="20" x2="20" y2="20"/><rect x="6" y="4" width="4" height="14" rx="1"/><rect x="13" y="10" width="4" height="8" rx="1"/>'));

IconRegistry.registerSymbol('distribute-h', 'distribute-h',
    sym('distribute-h', '<rect x="2" y="8" width="4" height="8" rx="1"/><rect x="10" y="8" width="4" height="8" rx="1"/><rect x="18" y="8" width="4" height="8" rx="1"/><line x1="6" y1="12" x2="10" y2="12"/><line x1="14" y1="12" x2="18" y2="12"/>'));

IconRegistry.registerSymbol('distribute-v', 'distribute-v',
    sym('distribute-v', '<rect x="8" y="2" width="8" height="4" rx="1"/><rect x="8" y="10" width="8" height="4" rx="1"/><rect x="8" y="18" width="8" height="4" rx="1"/><line x1="12" y1="6" x2="12" y2="10"/><line x1="12" y1="14" x2="12" y2="18"/>'));

IconRegistry.registerSymbol('zoom-in', 'zoom-in',
    sym('zoom-in', '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/>'));

IconRegistry.registerSymbol('zoom-out', 'zoom-out',
    sym('zoom-out', '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/>'));

IconRegistry.registerSymbol('fit-width', 'fit-width',
    sym('fit-width', '<line x1="3" y1="5" x2="3" y2="19"/><line x1="21" y1="5" x2="21" y2="19"/><line x1="7" y1="12" x2="17" y2="12"/><polyline points="10 9 7 12 10 15"/><polyline points="14 9 17 12 14 15"/>'));

IconRegistry.registerSymbol('fit-all', 'fit-all',
    sym('fit-all', '<polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>'));

IconRegistry.registerSymbol('show-grid', 'show-grid',
    sym('show-grid', '<line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/>'));

IconRegistry.registerSymbol('snap-grid', 'snap-grid',
    sym('snap-grid', '<path d="M6 15V6a6 6 0 0 1 12 0v9"/><path d="M6 15a3 3 0 0 0 6 0m0 0a3 3 0 0 0 6 0"/><line x1="2" y1="6" x2="6" y2="6"/><line x1="18" y1="6" x2="22" y2="6"/>'));

IconRegistry.registerSymbol('select', 'tool-select',
    sym('tool-select', '<path d="M5 3l14 9-7 1-4 7z"/>'));

IconRegistry.registerSymbol('rectangle', 'tool-rectangle',
    sym('tool-rectangle', '<rect x="3" y="5" width="18" height="14" rx="1"/>'));

IconRegistry.registerSymbol('round_rectangle', 'tool-round-rect',
    sym('tool-round-rect', '<rect x="3" y="5" width="18" height="14" rx="5"/>'));

IconRegistry.registerSymbol('ellipse', 'tool-ellipse',
    sym('tool-ellipse', '<ellipse cx="12" cy="12" rx="10" ry="7"/>'));

IconRegistry.registerSymbol('rhombus', 'tool-rhombus',
    sym('tool-rhombus', '<polygon points="12 2 22 12 12 22 2 12"/>'));

IconRegistry.registerSymbol('text', 'tool-text',
    sym('tool-text', '<line x1="4" y1="6" x2="20" y2="6"/><line x1="12" y1="6" x2="12" y2="20"/>'));

IconRegistry.registerSymbol('svg', 'tool-svg',
    sym('tool-svg', '<path d="M4 14.5S4 18 8 18s4-7 8-7 4 3.5 4 3.5"/><line x1="2" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="22" y2="12"/>'));

IconRegistry.registerSymbol('line', 'tool-line',
    sym('tool-line', '<line x1="5" y1="19" x2="19" y2="5"/><polyline points="14 5 19 5 19 10"/>'));

IconRegistry.registerSymbol('polyline', 'tool-polyline',
    sym('tool-polyline', '<polyline points="4 19 9 9 14 14 19 5"/>'));

IconRegistry.registerSymbol('polygon', 'tool-polygon',
    sym('tool-polygon', '<polygon points="12 3 20 8 20 16 12 21 4 16 4 8"/>'));

IconRegistry.registerSymbol('curve', 'tool-curve',
    sym('tool-curve', '<path d="M4 20 C4 4 20 4 20 20"/>'));
