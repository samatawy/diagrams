export interface ToolBarConfig {
    hostClassName?: string;
    buttonClassName?: string;
    activeClassName?: string;
    disabledClassName?: string;
    separatorClassName?: string;
    tooltipAttribute?: string;
}

export interface ToolButtonDef {
    id: string;
    /** SVG use href (e.g. '#icon-undo'), URL string, or an Element */
    icon?: string | Element;
    label?: string;
    tooltip?: string;
    toggle?: boolean;
    disabled?: boolean;
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
    padding: 6px 8px;
    border: 1px solid rgba(15, 23, 42, 0.12);
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.88);
    cursor: pointer;
    color: #334155;
    font: 600 12px/1.2 'Helvetica Neue', Helvetica, Arial, sans-serif;
    line-height: 0;
    flex-shrink: 0;
    transition: border-color 100ms ease, background-color 100ms ease, color 100ms ease;
}
.toolbar .toolbar-button:hover,
.toolbar .toolbar-button:focus-visible,
.toolbar button[data-toolbar-button='true']:hover,
.toolbar button[data-toolbar-button='true']:focus-visible {
    border-color: rgba(15, 118, 110, 0.45);
    color: #0f766e;
}
.toolbar .toolbar-button.is-active,
.toolbar .toolbar-button[data-toggle='true'].is-active,
.toolbar button[data-toolbar-button='true'].is-active,
.toolbar button[data-toolbar-button='true'][data-toggle='true'].is-active {
    background: #0f766e;
    border-color: #0f766e;
    color: #ffffff;
}
.toolbar .toolbar-button:disabled,
.toolbar .toolbar-button.is-disabled,
.toolbar button[data-toolbar-button='true']:disabled,
.toolbar button[data-toolbar-button='true'].is-disabled {
    opacity: 0.45;
    cursor: not-allowed;
    color: #64748b;
    border-color: rgba(15, 23, 42, 0.12);
    pointer-events: none;
}
.toolbar .toolbar-button svg,
.toolbar .toolbar-button img,
.toolbar button[data-toolbar-button='true'] svg,
.toolbar button[data-toolbar-button='true'] img {
    width: 18px;
    height: 18px;
    display: block;
    pointer-events: none;
}
.toolbar .toolbar-separator,
.toolbar [data-toolbar-separator='true'] {
    width: 1px;
    height: 20px;
    background: rgba(15, 23, 42, 0.15);
    flex-shrink: 0;
    margin: 0 4px;
    align-self: center;
}
.toolbar [role='separator'] {
    width: 1px;
    height: 20px;
    background: rgba(15, 23, 42, 0.15);
    flex-shrink: 0;
    margin: 0 4px;
    align-self: center;
}
`;

import { injectStyles, setClasses, toggleClasses } from './editor.utils';

function ensureToolbarStyles(): void {
    injectStyles(TOOLBAR_STYLE_ID, TOOLBAR_DEFAULT_STYLES);
}

const DEFAULT_TOOLBAR_CONFIG: Required<ToolBarConfig> = {
    hostClassName: 'toolbar',
    buttonClassName: 'toolbar-button',
    activeClassName: 'is-active',
    disabledClassName: 'is-disabled',
    separatorClassName: 'toolbar-separator',
    tooltipAttribute: 'title',
};

export class ToolBar {

    protected host: HTMLElement;

    protected config: Required<ToolBarConfig>;

    protected buttons = new Map<string, HTMLButtonElement>();

    constructor(target: HTMLElement, config: ToolBarConfig = {}) {
        ensureToolbarStyles();
        this.host = target;
        this.config = { ...DEFAULT_TOOLBAR_CONFIG, ...config };
        setClasses(this.host, 'toolbar', this.config.hostClassName);
    }

    public destroy(): void {
        this.host.innerHTML = '';
        this.buttons.clear();
    }

    public addButton(def: ToolButtonDef): HTMLButtonElement {
        const btn = this.buildButton(def);
        this.host.appendChild(btn);
        this.buttons.set(def.id, btn);
        return btn;
    }

    public addSeparator(): HTMLDivElement {
        const sep = document.createElement('div');
        setClasses(sep, DEFAULT_TOOLBAR_CONFIG.separatorClassName, this.config.separatorClassName);
        sep.setAttribute('role', 'separator');
        sep.dataset.toolbarSeparator = 'true';
        this.host.appendChild(sep);
        return sep;
    }

    public setActive(id: string, active: boolean): void {
        const btn = this.buttons.get(id);
        if (!btn) {
            return;
        }
        toggleClasses(btn, active, DEFAULT_TOOLBAR_CONFIG.activeClassName, this.config.activeClassName);
        btn.setAttribute('aria-pressed', String(active));
    }

    public setEnabled(id: string, enabled: boolean): void {
        const btn = this.buttons.get(id);
        if (!btn) {
            return;
        }
        btn.disabled = !enabled;
        toggleClasses(btn, !enabled, DEFAULT_TOOLBAR_CONFIG.disabledClassName, this.config.disabledClassName);
        btn.setAttribute('aria-disabled', enabled ? 'false' : 'true');
    }

    public getButton(id: string): HTMLButtonElement | undefined {
        return this.buttons.get(id);
    }

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