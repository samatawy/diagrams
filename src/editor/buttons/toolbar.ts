/**
 * Configuration options for the toolbar.
 * Provide only the properties you want to customize. All other properties will use default values.
 */
export interface ToolbarConfig {
    /**
     * Optional CSS class name to apply to the toolbar host element. This allows for custom styling of the toolbar.
     */
    hostClassName?: string;
    /**
     * Optional CSS class name to apply to toolbar buttons. This allows for custom styling of the buttons.
     */
    buttonClassName?: string;
    /**
     * Optional CSS class name to apply to active toolbar buttons. This allows for custom styling of active buttons.
     */
    activeClassName?: string;
    /**
     * Optional CSS class name to apply to disabled toolbar buttons. This allows for custom styling of disabled buttons.
     */
    disabledClassName?: string;
    /**
     * Optional CSS class name to apply to toolbar separators. This allows for custom styling of separators.
     */
    separatorClassName?: string;
    /**
     * Optional attribute name to use for tooltips. This allows for custom tooltip behavior.
     */
    tooltipAttribute?: string;
}

/**
 * Definition of a toolbar button.
 * Provide only the properties you want to customize. All other properties will use default values.
 */
export interface ToolButtonDef {
    /**
     * Unique identifier for the button. This is used to reference the button in the toolbar.
     */
    id: string;
    /**
     * SVG use href (e.g. '#icon-undo'), URL string, or an Element
     */
    icon?: string | Element;
    /**
     * Optional label for the button. This is used for accessibility and tooltips.
     */
    label?: string;
    /**
     * Optional tooltip text for the button. This is displayed on hover.
     */
    tooltip?: string;
    /**
     * Indicates if the button is a toggle button.
     */
    toggle?: boolean;
    /**
     * Indicates if the button is disabled.
     */
    disabled?: boolean;
    /**
     * Click event handler for the button.
     */
    onClick: (event: MouseEvent) => void | Promise<void>;
}

const TOOLBAR_STYLE_ID = 'toolbar-defaults';

const TOOLBAR_DEFAULT_STYLES = `
.toolbar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 2px;
    padding: 4px;
    box-sizing: border-box;
}
.toolbar .toolbar-button,
.toolbar button[data-toolbar-button='true'] {
    appearance: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 32px;
    min-height: 32px;
    width: auto;
    height: auto;
    padding: var(--diagram-ui-control-padding-y, 6px) var(--diagram-ui-control-padding-x, 8px);
    border: var(--diagram-ui-border-width, 1px) solid var(--diagram-ui-border, rgba(15, 23, 42, 0.12));
    border-radius: var(--diagram-ui-control-radius, 10px);
    background: var(--diagram-ui-surface, rgba(255, 255, 255, 0.88));
    cursor: pointer;
    color: var(--diagram-ui-text-muted, #334155);
    font: 600 var(--diagram-ui-font-size, 12px)/1.2 var(--diagram-ui-font-family, system-ui);
    line-height: 0;
    flex-shrink: 0;
    transition: border-color var(--diagram-ui-transition-fast, 100ms ease), background-color var(--diagram-ui-transition-fast, 100ms ease), color var(--diagram-ui-transition-fast, 100ms ease);
}
.toolbar .toolbar-button:hover,
.toolbar .toolbar-button:focus-visible,
.toolbar button[data-toolbar-button='true']:hover,
.toolbar button[data-toolbar-button='true']:focus-visible {
    border-color: var(--diagram-ui-border-strong, rgba(15, 118, 110, 0.45));
    color: var(--diagram-ui-accent, #0f766e);
}
.toolbar .toolbar-button.is-active,
.toolbar .toolbar-button[data-toggle='true'].is-active,
.toolbar button[data-toolbar-button='true'].is-active,
.toolbar button[data-toolbar-button='true'][data-toggle='true'].is-active {
    background: var(--diagram-ui-accent, #0f766e);
    border-color: var(--diagram-ui-accent, #0f766e);
    color: var(--diagram-ui-accent-contrast, #ffffff);
}
.toolbar .toolbar-button:disabled,
.toolbar .toolbar-button.is-disabled,
.toolbar button[data-toolbar-button='true']:disabled,
.toolbar button[data-toolbar-button='true'].is-disabled {
    opacity: 0.45;
    cursor: not-allowed;
    color: var(--diagram-ui-text-muted, #64748b);
    border-color: var(--diagram-ui-border, rgba(15, 23, 42, 0.12));
    pointer-events: none;
}
.toolbar .toolbar-button svg,
.toolbar .toolbar-button img,
.toolbar button[data-toolbar-button='true'] svg,
.toolbar button[data-toolbar-button='true'] img {
    width: var(--diagram-ui-icon-size, 18px);
    height: var(--diagram-ui-icon-size, 18px);
    display: block;
    pointer-events: none;
}
.toolbar .toolbar-separator,
.toolbar [data-toolbar-separator='true'] {
    width: 1px;
    height: 20px;
    background: var(--diagram-ui-border, rgba(15, 23, 42, 0.15));
    flex-shrink: 0;
    margin: 0 var(--diagram-ui-control-gap, 4px);
    align-self: center;
}
.toolbar [role='separator'] {
    width: 1px;
    height: 20px;
    background: var(--diagram-ui-border, rgba(15, 23, 42, 0.15));
    flex-shrink: 0;
    margin: 0 var(--diagram-ui-control-gap, 4px);
    align-self: center;
}
`;

import { injectStyles, setClasses, toggleClasses } from '../editor.utils';

function ensureToolbarStyles(): void {
    injectStyles(TOOLBAR_STYLE_ID, TOOLBAR_DEFAULT_STYLES);
}

const DEFAULT_TOOLBAR_CONFIG: Required<ToolbarConfig> = {
    hostClassName: 'toolbar',
    buttonClassName: 'toolbar-button',
    activeClassName: 'is-active',
    disabledClassName: 'is-disabled',
    separatorClassName: 'toolbar-separator',
    tooltipAttribute: 'title',
};

/**
 * A simple toolbar component that can be used to create a toolbar with buttons and separators.
 * The toolbar can be customized with CSS classes and tooltip attributes.
 * Buttons can be added with icons, labels, tooltips, and click event handlers.
 * Buttons can also be toggled on/off and enabled/disabled.
 */
export class Toolbar {

    protected host: HTMLElement;

    protected config: Required<ToolbarConfig>;

    protected buttons = new Map<string, HTMLButtonElement>();

    /**
     * Creates a toolbar mounted inside the given element.
     * @param target The host element that will contain the toolbar buttons.
     * @param config Optional style/class overrides for the toolbar layout.
     */
    constructor(target: HTMLElement, config: ToolbarConfig = {}) {
        ensureToolbarStyles();
        this.host = target;
        this.config = { ...DEFAULT_TOOLBAR_CONFIG, ...config };
        setClasses(this.host, 'toolbar', this.config.hostClassName);
    }

    /**
     * Clears toolbar DOM and internal button references.
     */
    public destroy(): void {
        this.host.innerHTML = '';
        this.buttons.clear();
    }

    /**
     * Manually adds a button to the toolbar. This is useful for dynamically adding buttons after the toolbar has been created.
     * @param def The definition of the button to add.
     * @returns The HTMLButtonElement that was created and added to the toolbar.
     */
    public addButton(def: ToolButtonDef): HTMLButtonElement {
        const btn = this.buildButton(def);
        this.host.appendChild(btn);
        this.buttons.set(def.id, btn);
        return btn;
    }

    /**
     * Manually adds a separator to the toolbar. This is useful for dynamically adding separators after the toolbar has been created.
     * @returns The HTMLDivElement that was created and added to the toolbar.
     */
    public addSeparator(): HTMLDivElement {
        const sep = document.createElement('div');
        setClasses(sep, DEFAULT_TOOLBAR_CONFIG.separatorClassName, this.config.separatorClassName);
        sep.setAttribute('role', 'separator');
        sep.dataset.toolbarSeparator = 'true';
        this.host.appendChild(sep);
        return sep;
    }

    /**
     * Sets the active state of a button.
     * @param id The ID of the button.
     * @param active Whether the button should be active.
     */
    public setActive(id: string, active: boolean): void {
        const btn = this.buttons.get(id);
        if (!btn) {
            return;
        }
        toggleClasses(btn, active, DEFAULT_TOOLBAR_CONFIG.activeClassName, this.config.activeClassName);
        btn.setAttribute('aria-pressed', String(active));
    }

    /**
     * Sets the enabled state of a button.
     * @param id The ID of the button.
     * @param enabled Whether the button should be enabled.
     */
    public setEnabled(id: string, enabled: boolean): void {
        const btn = this.buttons.get(id);
        if (!btn) {
            return;
        }
        btn.disabled = !enabled;
        toggleClasses(btn, !enabled, DEFAULT_TOOLBAR_CONFIG.disabledClassName, this.config.disabledClassName);
        btn.setAttribute('aria-disabled', enabled ? 'false' : 'true');
    }

    /**
     * Gets a button by its ID.
     * @param id The ID of the button.
     * @returns The HTMLButtonElement if found, otherwise undefined.
     */
    public getButton(id: string): HTMLButtonElement | undefined {
        return this.buttons.get(id);
    }

    /**
     * Creates a button DOM element from the given definition and wires its click handler.
     * @param def The button definition including id, icon, label, and callbacks.
     * @returns The constructed HTMLButtonElement.
     */
    protected buildButton(def: ToolButtonDef): HTMLButtonElement {
        const btn = document.createElement('button');
        btn.type = 'button';
        setClasses(btn, DEFAULT_TOOLBAR_CONFIG.buttonClassName, this.config.buttonClassName);
        btn.dataset.id = def.id;
        btn.dataset.toolbarButton = 'true';

        if (def.tooltip) {
            btn.setAttribute(this.config.tooltipAttribute, def.tooltip);
        }
        if (def.label) {
            btn.setAttribute('aria-label', def.label);
        }
        if (def.toggle) {
            btn.setAttribute('aria-pressed', 'false');
        }
        if (def.disabled) {
            btn.disabled = true;
            btn.setAttribute('aria-disabled', 'true');
        }

        const iconEl = this.resolveIcon(def.icon);
        if (iconEl) {
            btn.appendChild(iconEl);
        } else if (def.label) {
            btn.textContent = def.label;
        }

        btn.addEventListener('click', def.onClick);
        return btn;
    }

    /**
     * Resolves a string icon reference or Element into a DOM element suitable for button content.
     * @param icon An SVG sprite reference (e.g. '#icon-undo'), an img URL, raw SVG markup, or an Element.
     * @returns The icon element, or null when no icon is provided.
     */
    protected resolveIcon(icon?: string | Element): Element | null {
        if (!icon) {
            return null;
        }
        if (icon instanceof Element) {
            return icon;
        }
        // SVG sprite reference e.g. '#icon-undo'
        if (icon.startsWith('#')) {
            const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.setAttribute('aria-hidden', 'true');
            svg.setAttribute('focusable', 'false');
            const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
            use.setAttribute('href', icon);
            svg.appendChild(use);
            return svg;
        }
        // URL → <img>
        const img = document.createElement('img');
        img.src = icon;
        img.alt = '';
        return img;
    }
}