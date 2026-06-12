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
.toolbar-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    padding: 0;
    border: 1px solid transparent;
    border-radius: 6px;
    background: transparent;
    cursor: pointer;
    color: inherit;
    flex-shrink: 0;
    transition: background 80ms ease, border-color 80ms ease;
}
.toolbar-button:hover {
    background: rgba(15, 23, 42, 0.06);
    border-color: rgba(15, 23, 42, 0.12);
}
.toolbar-button.is-active {
    background: rgba(15, 118, 110, 0.12);
    border-color: rgba(15, 118, 110, 0.3);
    color: #0f766e;
}
.toolbar-button:disabled,
.toolbar-button.is-disabled {
    opacity: 0.38;
    cursor: default;
    pointer-events: none;
}
.toolbar-button svg,
.toolbar-button img {
    width: 18px;
    height: 18px;
    display: block;
    pointer-events: none;
}
.toolbar-separator {
    width: 1px;
    height: 20px;
    background: rgba(15, 23, 42, 0.15);
    flex-shrink: 0;
    margin: 0 4px;
}
`;

function ensureToolbarStyles(): void {
    if (typeof document === 'undefined' || document.getElementById(TOOLBAR_STYLE_ID)) {
        return;
    }
    const style = document.createElement('style');
    style.id = TOOLBAR_STYLE_ID;
    style.textContent = TOOLBAR_DEFAULT_STYLES;
    document.head.appendChild(style);
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
        this.host.classList.add(this.config.hostClassName);
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
        sep.className = this.config.separatorClassName;
        sep.setAttribute('role', 'separator');
        this.host.appendChild(sep);
        return sep;
    }

    public setActive(id: string, active: boolean): void {
        const btn = this.buttons.get(id);
        btn?.classList.toggle(this.config.activeClassName, active);
        if (btn) {
            btn.setAttribute('aria-pressed', String(active));
        }
    }

    public setEnabled(id: string, enabled: boolean): void {
        const btn = this.buttons.get(id);
        if (!btn) {
            return;
        }
        btn.disabled = !enabled;
        btn.classList.toggle(this.config.disabledClassName, !enabled);
        btn.setAttribute('aria-disabled', enabled ? 'false' : 'true');
    }

    public getButton(id: string): HTMLButtonElement | undefined {
        return this.buttons.get(id);
    }

    protected buildButton(def: ToolButtonDef): HTMLButtonElement {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = this.config.buttonClassName;
        btn.dataset.id = def.id;

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