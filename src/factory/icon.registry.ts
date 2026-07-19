import { DiagramConstants } from "../model/diagram.constants";

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

// New (New File)
IconRegistry.registerSymbol('new', 'new', sym('new', `<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
  <polyline points="14 2 14 8 20 8"/>
  <line x1="12" y1="18" x2="12" y2="12"/>
  <line x1="9" y1="15" x2="15" y2="15"/>`));

// Open (Open Folder)
IconRegistry.registerSymbol('open', 'open', sym('open', `<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>`));

// Save (Floppy Disk)
IconRegistry.registerSymbol('save', 'save', sym('save', `<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
  <polyline points="17 21 17 13 7 13 7 21"/>
  <polyline points="7 3 7 8 15 8"/>`));

// Export image — floppy disk with an empty overlay box in the top-right.
IconRegistry.registerSymbol('export', 'export', sym('export', `<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
    <polyline points="17 21 17 13 7 13 7 21"/>
    <polyline points="7 3 7 8 15 8"/>
    <path d="M11 1h7l5 5v8a2 2 0 0 1-2 2H11a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2z" fill="white"/>
    <path d="M11 1h7l5 5v8a2 2 0 0 1-2 2H11a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2z"/>
    <polyline points="18 1 18 6 23 6"/>`));

// Load stylesheet — folder base with marker overlay slightly protruding from the top-right.
IconRegistry.registerSymbol('load-stylesheet', 'load-stylesheet', sym('load-stylesheet', `<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>
    <path d="m2.748 24a2.755 2.755 0 0 1 -2.719-3.151c.259-1.806 1.133-5.134 2.373-6.374a5.037 5.037 0 0 1 7.123 7.125c-1.239 1.239-4.567 2.113-6.374 2.372a2.741 2.741 0 0 1 -.403.028zm20.352-23.1a3.139 3.139 0 0 0 -4.33 0l-10.5 10.5a6.976 6.976 0 0 1 4.33 4.338l10.5-10.508a3.068 3.068 0 0 0 0-4.33z"
        transform="translate(7.9 1.8) scale(0.7)"
        fill="currentColor" stroke="none"/>`));

// Save stylesheet — classic floppy base with marker overlay slightly protruding from the top-right.
IconRegistry.registerSymbol('save-stylesheet', 'save-stylesheet', sym('save-stylesheet', `<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
    <polyline points="17 21 17 13 7 13 7 21"/>
    <polyline points="7 3 7 8 15 8"/>
    <path d="m2.748 24a2.755 2.755 0 0 1 -2.719-3.151c.259-1.806 1.133-5.134 2.373-6.374a5.037 5.037 0 0 1 7.123 7.125c-1.239 1.239-4.567 2.113-6.374 2.372a2.741 2.741 0 0 1 -.403.028zm20.352-23.1a3.139 3.139 0 0 0 -4.33 0l-10.5 10.5a6.976 6.976 0 0 1 4.33 4.338l10.5-10.508a3.068 3.068 0 0 0 0-4.33z"
        transform="translate(8.3 1.8) scale(0.7)"
        fill="currentColor" stroke="none"/>`));

// 
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
    sym('duplicate', `<rect x="8" y="8" width="13" height="13" rx="1"/><path d="M4 15.5V4a1 1 0 0 1 1-1h11.5"/>
        <line x1="14" y1="12" x2="14" y2="18"/><line x1="11" y1="15" x2="17" y2="15"/>`));

IconRegistry.registerSymbol('cut', 'cut',
    sym('cut', `<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/>
        <line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/>`));

IconRegistry.registerSymbol('copy', 'copy',
    sym('copy', '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>'));

IconRegistry.registerSymbol('paste', 'paste',
    sym('paste', '<path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/>'));

// vertical pool: single top header with one inner item to suggest containment.
IconRegistry.registerSymbol('vertical_pool', 'vertical_pool',
    sym('vertical_pool', '<rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="8" x2="21" y2="8"/>'));
// <rect x="9" y="12" width="6" height="4" rx="1"/>'));

// horizontal pool: side header with one inner item; inner shape keeps same orientation.
IconRegistry.registerSymbol('horizontal_pool', 'horizontal_pool',
    sym('horizontal_pool', '<rect x="3" y="3" width="18" height="18" rx="2"/><line x1="8" y1="3" x2="8" y2="21"/>'));
// <rect x="12" y="10" width="6" height="4" rx="1"/>'));

// group-nodes: three peer nodes in a triangular arrangement enclosed by a dashed boundary.
IconRegistry.registerSymbol('group-nodes', 'group-nodes',
    sym('group-nodes', '<rect x="2" y="2" width="20" height="20" rx="2" stroke-dasharray="3 2"/><rect x="5" y="6" width="4" height="4" rx="1"/><rect x="15" y="6" width="4" height="4" rx="1"/><rect x="10" y="14" width="4" height="4" rx="1"/>'));

// ungroup-nodes: same node arrangement as group icon, without enclosing boundary.
IconRegistry.registerSymbol('ungroup-nodes', 'ungroup-nodes',
    sym('ungroup-nodes', '<rect x="5" y="6" width="4" height="4" rx="1"/><rect x="15" y="6" width="4" height="4" rx="1"/><rect x="10" y="14" width="4" height="4" rx="1"/>'));

// hint: lightbulb cue for discoverability tips and contextual guidance.
IconRegistry.registerSymbol('hint', 'hint',
    sym('hint', '<path d="M12 2a7 7 0 0 0-4.2 12.6c.6.45 1.2 1.3 1.2 2.08h6c0-.78.6-1.63 1.2-2.08A7 7 0 0 0 12 2Z"/><path d="M9 19h6v1.4A1.6 1.6 0 0 1 13.4 22h-2.8A1.6 1.6 0 0 1 9 20.4V19Z"/>'));

// info: neutral informational indicator for status text.
IconRegistry.registerSymbol('info', 'info',
    sym('info', '<circle cx="12" cy="12" r="9" stroke-opacity="0.55"/><line x1="12" y1="10" x2="12" y2="17"/><circle cx="12" cy="7" r="1" fill="currentColor" stroke="none"/>'));

// copy-styles: copy base icon with marker overlay to represent style transfer.
IconRegistry.registerSymbol('copy-styles', 'copy-styles',
    sym('copy-styles', `<rect x="9" y="9" width="13" height="13" rx="2"/>
  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
    <path d="m2.748 24a2.755 2.755 0 0 1 -2.719-3.151c.259-1.806 1.133-5.134 2.373-6.374a5.037 5.037 0 0 1 7.123 7.125c-1.239 1.239-4.567 2.113-6.374 2.372a2.741 2.741 0 0 1 -.403.028zm20.352-23.1a3.139 3.139 0 0 0 -4.33 0l-10.5 10.5a6.976 6.976 0 0 1 4.33 4.338l10.5-10.508a3.068 3.068 0 0 0 0-4.33z"
        transform="translate(8.1 1.8) scale(0.65)"
        fill="currentColor" stroke="none"/>`));

// paste-styles: paste base icon with marker overlay to represent style application.
IconRegistry.registerSymbol('paste-styles', 'paste-styles',
    sym('paste-styles', `<path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
  <rect x="8" y="2" width="8" height="4" rx="1"/>
    <path d="m2.748 24a2.755 2.755 0 0 1 -2.719-3.151c.259-1.806 1.133-5.134 2.373-6.374a5.037 5.037 0 0 1 7.123 7.125c-1.239 1.239-4.567 2.113-6.374 2.372a2.741 2.741 0 0 1 -.403.028zm20.352-23.1a3.139 3.139 0 0 0 -4.33 0l-10.5 10.5a6.976 6.976 0 0 1 4.33 4.338l10.5-10.508a3.068 3.068 0 0 0 0-4.33z"
        transform="translate(8.2 1.6) scale(0.66)"
        fill="currentColor" stroke="none"/>`));

// align-text

IconRegistry.registerSymbol('text-left', 'text-left',
    sym('text-left', '<line x1="3" y1="7" x2="15" y2="7"/><line x1="3" y1="12" x2="9" y2="12"/><line x1="3" y1="17" x2="12" y2="17"/>'));

IconRegistry.registerSymbol('text-center', 'text-center',
    sym('text-center', '<line x1="4.5" y1="7" x2="19.5" y2="7"/><line x1="7.5" y1="12" x2="16.5" y2="12"/><line x1="6" y1="17" x2="18" y2="17"/>'));

IconRegistry.registerSymbol('text-right', 'text-right',
    sym('text-right', '<line x1="9" y1="7" x2="21" y2="7"/><line x1="15" y1="12" x2="21" y2="12"/><line x1="12" y1="17" x2="21" y2="17"/>'));

IconRegistry.registerSymbol('text-top', 'text-top',
    sym('text-top', `<line x1="4" y1="3" x2="4" y2="21" stroke-opacity="0.55"/>
        <line x1="7" y1="4" x2="19" y2="4"/>
        <line x1="7" y1="8" x2="16" y2="8"/>`));

IconRegistry.registerSymbol('text-middle', 'text-middle',
    sym('text-middle', `<line x1="4" y1="3" x2="4" y2="21" stroke-opacity="0.55"/>
        <line x1="7" y1="9" x2="19" y2="9"/>
        <line x1="7" y1="13" x2="16" y2="13"/>`));

IconRegistry.registerSymbol('text-bottom', 'text-bottom',
    sym('text-bottom', `<line x1="4" y1="3" x2="4" y2="21" stroke-opacity="0.55"/>
        <line x1="7" y1="16" x2="19" y2="16"/>
        <line x1="7" y1="20" x2="16" y2="20"/>`));

// text-bold: filled serif "B" letterform
IconRegistry.registerSymbol('text-bold', 'text-bold',
    sym('text-bold', `<text x="4" y="18" font-family="serif" font-size="18" font-weight="700"
        fill="currentColor" stroke="none">B</text>`));

// text-italic: angled serif "i" letterform
IconRegistry.registerSymbol('text-italic', 'text-italic',
    sym('text-italic', `<text x="8" y="18" font-family="serif" font-size="18" font-style="italic"
        fill="currentColor" stroke="none">i</text>`));

// text-underline: serif "U" letterform with underline bar
IconRegistry.registerSymbol('text-underline', 'text-underline',
    sym('text-underline', `<text x="4" y="17" font-family="serif" font-size="16"
        fill="currentColor" stroke="none">U</text>
        <line x1="4" y1="21" x2="20" y2="21" stroke="currentColor" stroke-width="1.5"/>`));

// text-orientation-horizontal: three horizontal text lines + filled right arrow (gap before arrow)
IconRegistry.registerSymbol('text-orientation-horizontal', 'text-orientation-horizontal',
    sym('text-orientation-horizontal', `
        <line x1="3" y1="8" x2="13" y2="8"/>
        <line x1="3" y1="12" x2="13" y2="12"/>
        <line x1="3" y1="16" x2="10" y2="16"/>
        <polygon points="16 8 21 12 16 16" fill="currentColor" stroke="none"/>`));

// text-orientation-vertical-down: three vertical text lines + filled down arrow (gap before arrow)
IconRegistry.registerSymbol('text-orientation-vertical-down', 'text-orientation-vertical-down',
    sym('text-orientation-vertical-down', `
        <line x1="8" y1="3" x2="8" y2="13"/>
        <line x1="12" y1="3" x2="12" y2="13"/>
        <line x1="16" y1="3" x2="16" y2="10"/>
        <polygon points="8 16 12 21 16 16" fill="currentColor" stroke="none"/>`));

// text-orientation-vertical: three vertical text lines + filled up arrow (same design, flipped direction)
IconRegistry.registerSymbol('text-orientation-vertical', 'text-orientation-vertical',
    sym('text-orientation-vertical', `
        <line x1="8" y1="11" x2="8" y2="21"/>
        <line x1="12" y1="11" x2="12" y2="21"/>
        <line x1="16" y1="14" x2="16" y2="21"/>
        <polygon points="8 8 12 3 16 8" fill="currentColor" stroke="none"/>`));

// label-orientation-horizontal: sloping path + short horizontal label line across it
// "horizontal" = label drawn level regardless of path angle
IconRegistry.registerSymbol('label-orientation-horizontal', 'label-orientation-horizontal',
    sym('label-orientation-horizontal', `
        <line x1="3" y1="18" x2="21" y2="6" stroke-opacity="0.55"/>
        <line x1="9" y1="12" x2="15" y2="12"/>`));

// label-orientation-path: sloping path + short label line parallel to the path
// "path" = label tilts to follow the path angle
IconRegistry.registerSymbol('label-orientation-path', 'label-orientation-path',
    sym('label-orientation-path', `
        <line x1="3" y1="18" x2="21" y2="6" stroke-opacity="0.55"/>
        <line x1="7" y1="13" x2="15" y2="7"/>`));;

// text-orientation-path: "A" label above a curved line with arrow
IconRegistry.registerSymbol('text-orientation-path', 'text-orientation-path',
    sym('text-orientation-path', `
        <text x="8" y="10" font-family="sans-serif" font-size="9" fill="currentColor" stroke="none">Aa</text>
        <path d="M3 18 Q8 10 12 15 Q16 20 21 14" stroke-opacity="0.5"/>
        <polyline points="18 11 21 14 18 17"/>`));

// align nodes

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
    sym('distribute-h', `<rect x="2" y="8" width="4" height="8" rx="1"/><rect x="10" y="8" width="4" height="8" rx="1"/>
        <rect x="18" y="8" width="4" height="8" rx="1"/><line x1="6" y1="12" x2="10" y2="12"/><line x1="14" y1="12" x2="18" y2="12"/>`));

IconRegistry.registerSymbol('distribute-v', 'distribute-v',
    sym('distribute-v', `<rect x="8" y="2" width="8" height="4" rx="1"/><rect x="8" y="10" width="8" height="4" rx="1"/>
        <rect x="8" y="18" width="8" height="4" rx="1"/><line x1="12" y1="6" x2="12" y2="10"/><line x1="12" y1="14" x2="12" y2="18"/>`));

IconRegistry.registerSymbol('zoom-in', 'zoom-in',
    sym('zoom-in', '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/>'));

IconRegistry.registerSymbol('zoom-out', 'zoom-out',
    sym('zoom-out', '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/>'));

IconRegistry.registerSymbol('fit-horizontally', 'fit-horizontally',
    sym('fit-horizontally', `<line x1="3" y1="5" x2="3" y2="19"/><line x1="21" y1="5" x2="21" y2="19"/><line x1="7" y1="12" x2="17" y2="12"/>
        <polyline points="10 9 7 12 10 15"/><polyline points="14 9 17 12 14 15"/>`));

IconRegistry.registerSymbol('fit-all', 'fit-all',
    sym('fit-all', '<polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>'));

IconRegistry.registerSymbol('show-grid', 'show-grid',
    sym('show-grid', '<line x1="3" y1="8" x2="21" y2="8"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="8" y1="3" x2="8" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/>'));
/* Exact alias */
IconRegistry.registerSymbol('toggle-visual-grid', 'toggle-visual-grid',
    sym('toggle-visual-grid', '<line x1="3" y1="8" x2="21" y2="8"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="8" y1="3" x2="8" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/>'));

IconRegistry.registerSymbol('snap-grid', 'snap-grid',
    sym('snap-grid', '<line x1="3" y1="8" x2="21" y2="8"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="8" y1="3" x2="8" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/><rect x="8" y="8" width="7" height="7" fill="currentColor" stroke="none"/>'));
/* Exact alias */
IconRegistry.registerSymbol('toggle-grid', 'toggle-grid',
    sym('toggle-grid', '<line x1="3" y1="8" x2="21" y2="8"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="8" y1="3" x2="8" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/><rect x="8" y="8" width="7" height="7" fill="currentColor" stroke="none"/>'));

IconRegistry.registerSymbol('show-guides', 'show-guides',
    sym('show-guides', '<line x1="8" y1="3" x2="8" y2="21"/><line x1="3" y1="8" x2="21" y2="8"/>'));

IconRegistry.registerSymbol('snap-guides', 'snap-guides',
    sym('snap-guides', '<line x1="8" y1="3" x2="8" y2="21"/><line x1="3" y1="8" x2="21" y2="8"/><rect x="8" y="8" width="7" height="7" fill="currentColor" stroke="none"/>'));
/* Exact alias */
IconRegistry.registerSymbol('toggle-guides', 'toggle-guides',
    sym('toggle-guides', '<line x1="8" y1="3" x2="8" y2="21"/><line x1="3" y1="8" x2="21" y2="8"/><rect x="8" y="8" width="7" height="7" fill="currentColor" stroke="none"/>'));


IconRegistry.registerSymbol('select', 'tool-select',
    sym('tool-select', '<path d="M5 3l14 9-7 1-4 7z"/>'));

// IconRegistry.registerSymbol('freehand', 'tool-freehand',
//     sym('tool-freehand', '<path d="m23.906,20.208c.161.225.11.537-.114.698-.176.126-4.338,3.094-7.292,3.094-1.165,0-2.242-.436-3.032-1.226-1.632-1.633-1.632-4.289,0-5.922l8.965-8.922c.376-.377.584-.879.584-1.413s-.208-1.036-.585-1.414c-.756-.756-2.073-.756-2.829,0l-14.482,14.5c-1.134,1.133-3.11,1.133-4.243,0-.567-.566-.879-1.32-.879-2.121s.312-1.555.879-2.121L11.916,4.413c.376-.377.584-.879.584-1.413s-.208-1.036-.586-1.414c-.756-.756-2.072-.756-2.828,0L.852,9.729c-.197.194-.513.192-.707-.004-.194-.196-.192-.513.004-.707L8.381.877c1.129-1.129,3.107-1.131,4.24.002,1.169,1.17,1.169,3.072,0,4.242L1.584,16.069c-.376.377-.584.879-.584,1.413s.208,1.036.586,1.414c.756.756,2.072.756,2.828,0l14.482-14.5c1.134-1.133,3.109-1.133,4.243,0,.566.566.878,1.32.878,2.121s-.312,1.555-.878,2.121l-8.965,8.922c-1.241,1.242-1.241,3.264,0,4.507.602.602,1.427.933,2.325.933,2.631,0,6.668-2.877,6.708-2.906.224-.162.536-.109.698.114Z"/>'));
IconRegistry.registerSymbol('freehand', 'tool-freehand',
    sym('tool-freehand',
        '<path d="M3 16C5.2 12.8 7.8 8.2 11.2 8.2C13.5 8.2 14.8 9.8 14.8 11.5C14.8 13.2 13.8 14.5 12.1 15.6L10.3 16.8C9 17.6 8.5 18.4 8.5 19.3C8.5 20.7 9.7 21.7 11.3 21.7C14.1 21.7 17.2 19.8 21 16.8" stroke-width="1.9" fill="none"/>'
    ));

IconRegistry.registerSymbol('rectangle', 'tool-rectangle',
    sym('tool-rectangle', '<rect x="3" y="5" width="18" height="14" rx="1"/>'));

IconRegistry.registerSymbol('round_rectangle', 'tool-round-rect',
    sym('tool-round-rect', '<rect x="3" y="5" width="18" height="14" rx="5"/>'));

IconRegistry.registerSymbol('rhombus', 'tool-rhombus',
    sym('tool-rhombus', '<polygon points="12 2 22 12 12 22 2 12"/>'));

IconRegistry.registerSymbol('parallelogram', 'tool-parallelogram',
    sym('tool-parallelogram', '<polygon points="6 5 21 5 18 19 3 19"/>'));

IconRegistry.registerSymbol('ellipse', 'tool-ellipse',
    sym('tool-ellipse', '<ellipse cx="12" cy="12" rx="10" ry="7"/>'));

IconRegistry.registerSymbol('circle', 'tool-circle',
    sym('tool-circle', '<circle cx="12" cy="12" r="8"/>'));

// BPMN start event: single thin ring.
IconRegistry.registerSymbol('bpmn_start_event', 'tool-bpmn-start',
    sym('tool-bpmn-start', '<circle cx="12" cy="12" r="8"/>'));

// BPMN intermediate event: double ring.
IconRegistry.registerSymbol('bpmn_intermediate_event', 'tool-bpmn-intermediate',
    sym('tool-bpmn-intermediate', '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="5"/>'));

// BPMN end event: bold outer ring.
IconRegistry.registerSymbol('bpmn_end_event', 'tool-bpmn-end',
    sym('tool-bpmn-end', '<circle cx="12" cy="12" r="8" stroke-width="4"/>'));

IconRegistry.registerSymbol('bpmn_gateway', 'tool-bpmn-gateway',
    sym('tool-bpmn-gateway', '<polygon points="12 2 22 12 12 22 2 12"/>'));

IconRegistry.registerSymbol('bpmn_task', 'tool-bpmn-task',
    sym('tool-bpmn-task', '<rect x="3" y="5" width="18" height="14" rx="3"/>'));

// BPMN data store: cylinder with double bottom lines indicating a data store / database.
IconRegistry.registerSymbol('bpmn_data_store', 'tool-bpmn-data-store',
    sym('tool-bpmn-data-store', `<ellipse cx="12" cy="6" rx="9" ry="3"/>
        <path d="M3 6v12c0 1.66 4.03 3 9 3s9-1.34 9-3V6"/>`));

// BPMN data object: page with folded top-right corner.
IconRegistry.registerSymbol('bpmn_data_object', 'tool-bpmn-data-object',
    sym('tool-bpmn-data-object', `<path d="M6 2h8l4 4v16a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z"/>
        <polyline points="14 2 14 6 18 6"/>`));

// BPMN sequence flow: solid connector with filled arrowhead.
IconRegistry.registerSymbol('bpmn_sequence_flow', 'tool-bpmn-sequence-flow',
    sym('tool-bpmn-sequence-flow', `<line x1="4" y1="18" x2="17" y2="7"/>
        <polyline points="14 5 19 5 19 10"/>`));

// BPMN message flow: dashed connector with open arrowhead.
IconRegistry.registerSymbol('bpmn_message_flow', 'tool-bpmn-message-flow',
    sym('tool-bpmn-message-flow', `<line x1="4" y1="18" x2="17" y2="7" stroke-dasharray="4 3"/>
        <polyline points="14 5 19 5 19 10"/>`));

// BPMN association: dotted connector with no arrowhead.
IconRegistry.registerSymbol('bpmn_association', 'tool-bpmn-association',
    sym('tool-bpmn-association', `<line x1="4" y1="18" x2="20" y2="6" stroke-dasharray="1.2 3"/>`));

// BPMN data association: dotted connector with a spear-like pointed marker.
IconRegistry.registerSymbol('bpmn_data_association', 'tool-bpmn-data-association',
    sym('tool-bpmn-data-association', `<line x1="4" y1="18" x2="17" y2="7" stroke-dasharray="1.2 3"/>
        <polyline points="14 5 19 5 19 10"/>`));

// // BPMN parallel gateway: diamond with X marker.
// IconRegistry.registerSymbol('bpmn_parallel_gateway', 'tool-bpmn-parallel-gateway',
//     sym('tool-bpmn-parallel-gateway', '<polygon points="12 2 22 12 12 22 2 12"/><line x1="9.25" y1="9.25" x2="14.75" y2="14.75"/><line x1="14.75" y1="9.25" x2="9.25" y2="14.75"/>'));

// // BPMN inclusive gateway: diamond with inner ring.
// IconRegistry.registerSymbol('bpmn_inclusive_gateway', 'tool-bpmn-inclusive-gateway',
//     sym('tool-bpmn-inclusive-gateway', '<polygon points="12 2 22 12 12 22 2 12"/><circle cx="12" cy="12" r="3.5"/>'));

// // BPMN exclusive gateway: diamond with plus marker.
// IconRegistry.registerSymbol('bpmn_exclusive_gateway', 'tool-bpmn-exclusive-gateway',
//     sym('tool-bpmn-exclusive-gateway', '<polygon points="12 2 22 12 12 22 2 12"/><line x1="12" y1="8.5" x2="12" y2="15.5"/><line x1="8.5" y1="12" x2="15.5" y2="12"/>'));

// // BPMN complex gateway: diamond with star/asterisk marker.
// IconRegistry.registerSymbol('bpmn_complex_gateway', 'tool-bpmn-complex-gateway',
//     sym('tool-bpmn-complex-gateway', '<polygon points="12 2 22 12 12 22 2 12"/><line x1="12" y1="8.25" x2="12" y2="15.75"/><line x1="8.75" y1="10.125" x2="15.25" y2="13.875"/><line x1="15.25" y1="10.125" x2="8.75" y2="13.875"/>'));

IconRegistry.registerSymbol('text', 'tool-text',
    sym('tool-text', '<line x1="4" y1="6" x2="20" y2="6"/><line x1="12" y1="6" x2="12" y2="20"/>'));

IconRegistry.registerSymbol('speech_bubble', 'tool-speech-bubble',
    sym('tool-speech-bubble',
        '<path d="M5 5h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-6l-3 2-1-2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z"/>'));

IconRegistry.registerSymbol('arrow_triangle', 'tool-arrow-triangle',
    sym('tool-arrow-triangle',
        '<path d="M4 9H12V6L20 12L12 18V15H4Z"/>'));    //'<path d="M4 9H13V6L20 12L13 18V15H4Z"/>'));

IconRegistry.registerSymbol('arrow_chevron', 'tool-arrow-chevron',
    sym('tool-arrow-chevron',
        '<path d="M4 6H13L20 12L13 18H4L8 12Z"/>'));    //'<path d="M4 9H13L20 12L13 15H4L8 12Z"/>'));

IconRegistry.registerSymbol('svg', 'tool-svg',
    sym('tool-svg', '<path d="M4 14.5S4 18 8 18s4-7 8-7 4 3.5 4 3.5"/><line x1="2" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="22" y2="12"/>'));

IconRegistry.registerSymbol('line', 'tool-line',
    sym('tool-line', '<line x1="5" y1="19" x2="19" y2="5"/><polyline points="14 5 19 5 19 10"/>'));

IconRegistry.registerSymbol('polyline', 'tool-polyline',
    sym('tool-polyline', '<polyline points="4 19 9 9 14 14 19 5"/>'));

// IconRegistry.registerSymbol('manhattan', 'tool-manhattan',
//     sym('tool-manhattan', '<polyline points="4 19 10 19 10 8 19 8"/>'));

IconRegistry.registerSymbol('orthogonal', 'tool-orthogonal',
    sym('tool-orthogonal', '<polyline points="4 19 10 19 10 8 19 8"/>'));

IconRegistry.registerSymbol('polygon', 'tool-polygon',
    sym('tool-polygon', '<polygon points="12 3 20 8 20 16 12 21 4 16 4 8"/>'));

IconRegistry.registerSymbol('curve', 'tool-curve',
    sym('tool-curve', '<path d="M4 20 C4 4 20 4 20 20"/>'));

IconRegistry.registerSymbol('trapezoid', 'tool-trapezoid',
    sym('tool-trapezoid', '<polygon points="6 5 18 5 21 19 3 19"/>'));

IconRegistry.registerSymbol('document', 'tool-document',
    sym('tool-document', '<path d="M3 5 H21 V17 Q16 13 12 17 Q7 21 3 17 Z"/>'));

IconRegistry.registerSymbol('cylinder', 'tool-cylinder',
    sym('tool-cylinder', `<ellipse cx="12" cy="6" rx="9" ry="3"/>
        <path d="M3 6v12c0 1.66 4.03 3 9 3s9-1.34 9-3V6"/>`));

// C4 system: system boundary with a title strip and two inner building blocks.
IconRegistry.registerSymbol('c4_system', 'tool-c4-system',
    sym('tool-c4-system', `<rect x="3" y="4" width="18" height="16" rx="2"/>
        <line x1="3" y1="8" x2="21" y2="8"/>
        <rect x="6" y="11" width="5" height="5" rx="1"/>
        <rect x="13" y="11" width="5" height="5" rx="1"/>`));

// C4 container: one bounded deployable unit inside a boundary.
IconRegistry.registerSymbol('c4_container', 'tool-c4-container',
    sym('tool-c4-container', `<rect x="3" y="4" width="18" height="16" rx="2"/>
        <rect x="7" y="9" width="10" height="8" rx="1.5"/>
        <line x1="9" y1="12" x2="15" y2="12"/>`));

// C4 component: UML-style component block with side tabs.
IconRegistry.registerSymbol('c4_component', 'tool-c4-component',
    sym('tool-c4-component', `<rect x="6" y="6" width="14" height="12" rx="2"/>
        <rect x="3" y="8" width="3" height="3" rx="0.6"/>
        <rect x="3" y="13" width="3" height="3" rx="0.6"/>
        <line x1="10" y1="11" x2="16" y2="11"/>`));

// C4 database: canonical cylinder shape.
IconRegistry.registerSymbol('c4_database', 'tool-c4-database',
    sym('tool-c4-database', `<ellipse cx="12" cy="6" rx="8.5" ry="2.8"/>
        <path d="M3.5 6v10.8c0 1.55 3.8 2.8 8.5 2.8s8.5-1.25 8.5-2.8V6"/>`));

// C4 store: bucket silhouette (wide rim, tapered body, rounded small base).
IconRegistry.registerSymbol('c4_store', 'tool-c4-store',
    sym('tool-c4-store', `<ellipse cx="12" cy="6" rx="8.5" ry="2.8"/>
        <path d="M4.4 6.7 L7.2 18.2"/>
        <path d="M19.6 6.7 L16.8 18.2"/>
        <ellipse cx="12" cy="18.2" rx="4.8" ry="1.5"/>`));

// C4 person: head plus rounded shoulders silhouette.
IconRegistry.registerSymbol('c4_person', 'tool-c4-person',
    sym('tool-c4-person', `<circle cx="12" cy="7" r="3"/>
        <path d="M5 19a7 5 0 0 1 14 0"/>`));

// C4 relationship: solid directed relationship.
IconRegistry.registerSymbol('c4_relationship', 'tool-c4-relationship',
    sym('tool-c4-relationship', `<line x1="4" y1="18" x2="17" y2="7"/>
        <polyline points="14 5 19 5 19 10"/>`));

// C4 async relationship: dashed directed relationship.
IconRegistry.registerSymbol('c4_async_relationship', 'tool-c4-async-relationship',
    sym('tool-c4-async-relationship', `<line x1="4" y1="18" x2="17" y2="7" stroke-dasharray="4 3"/>
        <polyline points="14 5 19 5 19 10"/>`));

// C4 dependency: lighter/thinner directed relationship.
IconRegistry.registerSymbol('c4_dependency', 'tool-c4-dependency',
    sym('tool-c4-dependency', `<line x1="4" y1="18" x2="17" y2="7" stroke-width="1.25"/>
        <polyline points="14 5 19 5 19 10"/>`));



// ── Image mode icons ─────────────────────────────────────────────────────────
// Used in the ImageModeSelect toolbar widget.
// All follow the standard 24×24 stroke convention used by toolbar icons.

// image-mode-none: dashed-border box + diagonal X — image is not rendered
IconRegistry.registerSymbol('image-mode-none', 'image-mode-none',
    sym('image-mode-none', `<rect x="3" y="3" width="18" height="18" rx="2" stroke-dasharray="4 2" stroke-opacity="0.55"/>
    <line x1="8" y1="8" x2="16" y2="16"/><line x1="16" y1="8" x2="8" y2="16"/>`));

// image-mode-contain: outer frame + smaller wide rect inside — letterbox bars show image fits within bounds
IconRegistry.registerSymbol('image-mode-contain', 'image-mode-contain',
    sym('image-mode-contain', `<rect x="3" y="3" width="18" height="18" rx="2" stroke-opacity="0.55"/>
    <rect x="3" y="7" width="18" height="10" rx="1"/>`));

// image-mode-cover: frame with photo icon (sun + landscape) — image scales up to fill the frame, cropped as needed
IconRegistry.registerSymbol('image-mode-cover', 'image-mode-cover',
    sym('image-mode-cover', `<rect x="3" y="3" width="18" height="18" rx="2" stroke-opacity="0.55"/>
    <circle cx="8" cy="9" r="2"/>
    <polyline points="3 17 8 12 12 16 15 13 21 17"/>`));

// image-mode-fit: frame with inner corner brackets — image is stretched to fill exactly, aspect ratio not preserved
IconRegistry.registerSymbol('image-mode-fit', 'image-mode-fit',
    sym('image-mode-fit', `<rect x="3" y="3" width="18" height="18" rx="2" stroke-opacity="0.55"/>
    <polyline points="7 6 4 6 4 9"/><polyline points="17 6 20 6 20 9"/>
    <polyline points="7 18 4 18 4 15"/><polyline points="17 18 20 18 20 15"/>`));

// image-mode-pattern: 2×2 grid of squares — image is tiled as a repeating pattern fill
IconRegistry.registerSymbol('image-mode-pattern', 'image-mode-pattern',
    sym('image-mode-pattern', `<rect x="3" y="3" width="8" height="8" rx="1"/>
    <rect x="13" y="3" width="8" height="8" rx="1"/>
    <rect x="3" y="13" width="8" height="8" rx="1"/>
    <rect x="13" y="13" width="8" height="8" rx="1"/>`));

// ── Image align icons ─────────────────────────────────────────────────────────
// Used in the ImageModeSelect alignment grid (visible for contain / fit modes).
// Each shows a frame with a smaller image rect anchored to a specific position.

// image-align-top-left: image rect anchored to top-left corner of frame
IconRegistry.registerSymbol('image-align-top-left', 'image-align-top-left',
    sym('image-align-top-left', `<rect x="3" y="3" width="18" height="18" rx="2" stroke-opacity="0.55"/><rect x="5" y="5" width="8" height="6" rx="1"/>`));

// image-align-top: image rect anchored to top edge, horizontally centered
IconRegistry.registerSymbol('image-align-top', 'image-align-top',
    sym('image-align-top', `<rect x="3" y="3" width="18" height="18" rx="2" stroke-opacity="0.55"/><rect x="8" y="5" width="8" height="6" rx="1"/>`));

// image-align-top-right: image rect anchored to top-right corner of frame
IconRegistry.registerSymbol('image-align-top-right', 'image-align-top-right',
    sym('image-align-top-right', `<rect x="3" y="3" width="18" height="18" rx="2" stroke-opacity="0.55"/><rect x="11" y="5" width="8" height="6" rx="1"/>`));

// image-align-left: image rect anchored to left edge, vertically centered
IconRegistry.registerSymbol('image-align-left', 'image-align-left',
    sym('image-align-left', `<rect x="3" y="3" width="18" height="18" rx="2" stroke-opacity="0.55"/><rect x="5" y="9" width="8" height="6" rx="1"/>`));

// image-align-center: image rect centered within the frame
IconRegistry.registerSymbol('image-align-center', 'image-align-center',
    sym('image-align-center', `<rect x="3" y="3" width="18" height="18" rx="2" stroke-opacity="0.55"/><rect x="8" y="9" width="8" height="6" rx="1"/>`));

// image-align-right: image rect anchored to right edge, vertically centered
IconRegistry.registerSymbol('image-align-right', 'image-align-right',
    sym('image-align-right', `<rect x="3" y="3" width="18" height="18" rx="2" stroke-opacity="0.55"/><rect x="11" y="9" width="8" height="6" rx="1"/>`));

// image-align-bottom-left: image rect anchored to bottom-left corner of frame
IconRegistry.registerSymbol('image-align-bottom-left', 'image-align-bottom-left',
    sym('image-align-bottom-left', `<rect x="3" y="3" width="18" height="18" rx="2" stroke-opacity="0.55"/><rect x="5" y="13" width="8" height="6" rx="1"/>`));

// image-align-bottom: image rect anchored to bottom edge, horizontally centered
IconRegistry.registerSymbol('image-align-bottom', 'image-align-bottom',
    sym('image-align-bottom', `<rect x="3" y="3" width="18" height="18" rx="2" stroke-opacity="0.55"/><rect x="8" y="13" width="8" height="6" rx="1"/>`));

// image-align-bottom-right: image rect anchored to bottom-right corner of frame
IconRegistry.registerSymbol('image-align-bottom-right', 'image-align-bottom-right',
    sym('image-align-bottom-right', `<rect x="3" y="3" width="18" height="18" rx="2" stroke-opacity="0.55"/><rect x="11" y="13" width="8" height="6" rx="1"/>`));
