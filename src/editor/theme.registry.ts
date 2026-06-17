import { applyCssVars } from "./editor.utils";

/**
 * The full set of CSS custom properties used by all diagram editor UI components.
 * All fields are optional; themes only need to supply the values they want to override.
 */
export interface DiagramTheme {
    // ── Spacing ───────────────────────────────────────────────────────────────

    /** Gap between items inside a compact control (e.g. trigger icon + chevron). */
    controlGap?: string;
    /** Gap between items inside a menu or option list. */
    groupGap?: string;
    /** Gap between controls inside a toolbar row. */
    toolbarGap?: string;
    /** Horizontal padding inside a trigger/button control. */
    controlPaddingX?: string;
    /** Vertical padding inside a trigger/button control. */
    controlPaddingY?: string;
    /** Inner padding of dropdown panels and menus. */
    panelPadding?: string;

    // ── Shape ─────────────────────────────────────────────────────────────────

    /** Border radius applied to individual controls and trigger buttons. */
    controlRadius?: string;
    /** Border radius applied to dropdown panels, menus, and group containers. */
    panelRadius?: string;
    /** Target height for single-line controls. */
    controlHeight?: string;
    /** Width and height of tool palette buttons. */
    paletteButtonSize?: string;
    /** Padding inside tool palette buttons. */
    paletteButtonPadding?: string;
    /** Width/height of icons inside tool buttons. */
    iconSize?: string;
    /** Width of borders on controls and panels. */
    borderWidth?: string;

    // ── Color ─────────────────────────────────────────────────────────────────

    /** Background of control triggers and surfaces. */
    surface?: string;
    /** Background of elevated elements such as dropdown menus. */
    surfaceElevated?: string;
    /** Primary text and icon color. */
    text?: string;
    /** Muted/secondary text and label color. */
    textMuted?: string;
    /** Default border color. */
    border?: string;
    /** Border color on hover and focus. */
    borderStrong?: string;
    /** Hover and selected-row fill inside menus. */
    hoverBg?: string;
    /** Accent color for active/selected state (button fill, active tool, etc). */
    accent?: string;
    /** Text/icon color when rendered on the accent background. */
    accentContrast?: string;
    /** Shadow color used in drop-shadows on menus and panels. */
    shadowColor?: string;

    // ── Typography ────────────────────────────────────────────────────────────

    /** Font family used across all editor controls. */
    fontFamily?: string;
    /** Primary control font size. */
    fontSize?: string;
    /** Smaller label font size used for units, captions, and secondary text. */
    labelFontSize?: string;

    // ── Motion / Interaction ──────────────────────────────────────────────────

    /** Transition shorthand applied to hover/active state changes on controls. */
    transitionFast?: string;
    /** Focus-visible outline or ring style applied to interactive controls. */
    focusRing?: string;
}

/** Built-in defaults matching the original hardcoded values across all editor components. */
const DEFAULTS: Required<DiagramTheme> = {
    controlGap: '6px',
    groupGap: '4px',
    toolbarGap: '6px',
    controlPaddingX: '8px',
    controlPaddingY: '6px',
    panelPadding: '6px',
    controlRadius: '10px',
    panelRadius: '10px',
    controlHeight: '32px',
    paletteButtonSize: '40px',
    paletteButtonPadding: '9px',
    iconSize: '20px',
    borderWidth: '1px',
    surface: 'rgba(255, 255, 255, 0.88)',
    surfaceElevated: '#ffffff',
    text: '#1f2937',
    textMuted: '#475569',
    border: 'rgba(15, 23, 42, 0.15)',
    borderStrong: 'rgba(15, 118, 110, 0.45)',
    hoverBg: 'rgba(15, 118, 110, 0.10)',
    accent: '#0f766e',
    accentContrast: '#ffffff',
    shadowColor: 'rgba(15, 23, 42, 0.18)',
    fontFamily: 'system-ui',
    fontSize: '12px',
    labelFontSize: '11px',
    transitionFast: '100ms ease',
    focusRing: '0 0 0 2px rgba(15, 118, 110, 0.35)',
};

/**
 * A static registry for diagram editor UI themes.
 *
 * Themes are partial {@link DiagramTheme} token sets. When applied to an element
 * they are set as CSS custom properties and inherited by all children — so any
 * editor component rendered inside that element picks up the theme automatically,
 * whether inside a full DiagramEditor or a hand-wired custom layout.
 *
 * Precedence (lowest → highest):
 *   1. Built-in defaults
 *   2. setDefaults() overrides
 *   3. Named theme tokens
 *   4. Inline overrides passed to apply()
 */
export class ThemeRegistry {

    private static readonly PREFIX = '--diagram-ui-';

    private static defaults: DiagramTheme = { ...DEFAULTS };

    private static themes: Map<string, DiagramTheme> = new Map();

    // ── Registration ──────────────────────────────────────────────────────────

    /**
     * Overrides one or more global default token values.
     * Useful when you want to adjust the baseline without creating a named theme.
     * The changes apply to all themes and persist until resetDefaults() is called.
     * Note that existing themes are not affected; they will continue to inherit the old defaults
     * until re-applied.
     * @param vars Partial token set with new default values.
     */
    public static setDefaults(vars: DiagramTheme): void {
        this.defaults = { ...this.defaults, ...vars };
    }

    /**
     * Resets defaults to the original built-in values.
     */
    public static resetDefaults(): void {
        this.defaults = { ...DEFAULTS };
    }

    /**
     * Registers a named theme. Themes are partial; unspecified tokens fall back
     * to the current defaults when resolved.
     * @param name Unique name for the theme.
     * @param theme Partial token set defining the theme. Only tokens that differ from the defaults need to be included.
     */
    public static registerTheme(name: string, theme: DiagramTheme): void {
        this.themes.set(name, theme);
    }

    /**
     * Unregisters a named theme.
     * @param name The name of the theme to unregister.
     */
    public static unregisterTheme(name: string): void {
        this.themes.delete(name);
    }

    /**
     * Retrieves a registered theme by name.
     * @param name The name of the theme to retrieve.
     * @returns The theme object if found, otherwise undefined.
     */
    public static getTheme(name: string): DiagramTheme | undefined {
        return this.themes.get(name);
    }

    /**
     * Checks if a theme with the given name is registered.
     * @param name The name of the theme to check.
     * @returns True if the theme is registered, otherwise false.
     */
    public static hasTheme(name: string): boolean {
        return this.themes.has(name);
    }

    /**
     * Returns a list of all registered theme names.
     * @returns An array of registered theme names.
     */
    public static getRegisteredThemes(): string[] {
        return Array.from(this.themes.keys());
    }

    // ── Resolution ────────────────────────────────────────────────────────────

    /**
     * Resolves a final token map by merging in order:
     * current defaults → named theme (if any) → optional inline overrides.
     * Returns a plain object; nothing is applied to the DOM.
     * @param theme A registered theme name or an inline theme object.
     * @param overrides Optional inline token overrides applied on top of the resolved theme.
     * @returns The final resolved theme object.
     */
    public static resolve(theme?: string | DiagramTheme, overrides?: DiagramTheme): DiagramTheme {
        let named: DiagramTheme = {};
        if (typeof theme === 'string') {
            named = this.themes.get(theme) ?? {};
        } else if (theme) {
            named = theme;
        }
        return { ...this.defaults, ...named, ...overrides };
    }

    // ── Application ───────────────────────────────────────────────────────────

    /**
     * Applies a theme to an element as CSS custom properties.
     * The vars are scoped to that element and inherited by all children,
     * so any editor component rendered inside it consumes the theme automatically.
     * @param element   The element to receive the CSS custom properties.
     * @param theme     A registered theme name, an inline DiagramTheme object, or
     * omit to apply the current defaults only.
     * @param overrides Extra token overrides applied on top of the resolved theme.
     */
    public static apply(element: HTMLElement, theme?: string | DiagramTheme, overrides?: DiagramTheme): void {
        if (typeof theme === 'string' && !this.themes.has(theme)) {
            console.warn(`[ThemeRegistry] Theme "${theme}" is not registered.`);
            return;
        }
        const resolved = this.resolve(theme, overrides);
        const cssVars: Record<string, string> = {};
        for (const [key, value] of Object.entries(resolved)) {
            if (value !== undefined && value !== null) {
                cssVars[this.normalizeVarName(key)] = String(value);
            }
        }
        applyCssVars(element, cssVars);
    }

    /**
     * Removes all CSS custom properties that were set by this registry on the element.
     * Properties belonging to other systems are not touched.
     * @param element The element to clean up.
     */
    public static unapply(element: HTMLElement): void {
        // Snapshot first; live removal during iteration can skip entries.
        const ownVars: string[] = [];
        for (let i = 0; i < element.style.length; i++) {
            const prop = element.style.item(i);
            if (prop.startsWith(this.PREFIX)) {
                ownVars.push(prop);
            }
        }
        for (const prop of ownVars) {
            element.style.removeProperty(prop);
        }
    }

    // ── Internals ─────────────────────────────────────────────────────────────

    /**
     * Maps a camelCase or snake_case token field name to its full CSS custom property name.
     */
    private static normalizeVarName(name: string): string {
        if (name.startsWith('--')) {
            // already valid CSS variable name, return as is
            return name;
        }
        const kebab = name
            .replace(/_/g, '-')
            .replace(/([a-z])([A-Z])/g, '$1-$2')
            .toLowerCase();
        return `${this.PREFIX}${kebab}`;
    }

}