import type { ImageAlign } from '../../types';
import { injectStyles, setClasses, toggleClasses, removeClasses } from '../editor.utils';
import { IconRegistry } from '../../factory/icon.registry';

// ── Data ───────────────────────────────────────────────────────────────────

export const ALIGN_POSITIONS: ImageAlign[] = [
    'top-left', 'top', 'top-right',
    'left', 'center', 'right',
    'bottom-left', 'bottom', 'bottom-right',
];

export const ALIGN_TITLES: Record<ImageAlign, string> = {
    'top-left': 'Top left',
    'top': 'Top center',
    'top-right': 'Top right',
    'left': 'Middle left',
    'center': 'Center',
    'right': 'Middle right',
    'bottom-left': 'Bottom left',
    'bottom': 'Bottom center',
    'bottom-right': 'Bottom right',
};

// ── Styles ─────────────────────────────────────────────────────────────────

const STYLE_ID = 'image-align-select-defaults';

const DEFAULT_STYLES = `
.image-align-select-control {
    position: relative;
    font-size: var(--diagram-ui-font-size, 12px);
    font-family: var(--diagram-ui-font-family, system-ui);
    line-height: 1.2;
}
.image-align-select-trigger {
    display: inline-flex;
    align-items: center;
    gap: var(--diagram-ui-control-gap, 6px);
    padding: var(--diagram-ui-control-padding-y, 6px) var(--diagram-ui-control-padding-x, 8px);
    cursor: pointer;
    appearance: none;
    border: var(--diagram-ui-border-width, 1px) solid var(--diagram-ui-border, rgba(15, 23, 42, 0.15));
    border-radius: var(--diagram-ui-control-radius, 10px);
    background: var(--diagram-ui-surface, rgba(255, 255, 255, 0.88));
    color: var(--diagram-ui-text, #1f2937);
    font-weight: 600;
}
.image-align-select-trigger:hover,
.image-align-select-trigger:focus-visible {
    border-color: var(--diagram-ui-border-strong, rgba(15, 118, 110, 0.45));
}
.image-align-select-trigger svg {
    display: block;
    pointer-events: none;
}
.image-align-select-caret {
    color: var(--diagram-ui-text-muted, #334155);
    font-size: var(--diagram-ui-font-size, 12px);
    line-height: 1;
}
.image-align-select-menu {
    position: absolute;
    left: 0;
    top: calc(100% + var(--diagram-ui-control-gap, 6px));
    z-index: 40;
    border: var(--diagram-ui-border-width, 1px) solid var(--diagram-ui-border, rgba(15, 23, 42, 0.15));
    border-radius: var(--diagram-ui-panel-radius, 10px);
    background: var(--diagram-ui-surface-elevated, #ffffff);
    padding: var(--diagram-ui-panel-padding, 6px);
    box-shadow: 0 10px 24px var(--diagram-ui-shadow-color, rgba(15, 23, 42, 0.18));
    min-width: 0;
    display: none;
}
.image-align-select-control.is-open .image-align-select-menu {
    display: block;
}
.image-align-select-grid {
    display: grid;
    grid-template-columns: repeat(3, 30px);
    gap: 2px;
}
.image-align-select-option {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 30px;
    border: var(--diagram-ui-border-width, 1px) solid transparent;
    border-radius: var(--diagram-ui-control-radius, 6px);
    background: transparent;
    color: var(--diagram-ui-text-muted, #475569);
    cursor: pointer;
    appearance: none;
    padding: 0;
    transition: border-color var(--diagram-ui-transition-fast, 100ms ease),
                background var(--diagram-ui-transition-fast, 100ms ease),
                color var(--diagram-ui-transition-fast, 100ms ease);
}
.image-align-select-option svg {
    display: block;
    pointer-events: none;
}
.image-align-select-option:hover {
    border-color: var(--diagram-ui-border-strong, rgba(15, 118, 110, 0.45));
    color: var(--diagram-ui-accent, #0f766e);
}
.image-align-select-option.is-selected {
    border-color: var(--diagram-ui-accent, #0f766e);
    background: rgba(15, 118, 110, 0.12);
    color: var(--diagram-ui-accent, #0f766e);
}
.image-align-select-control.is-disabled .image-align-select-trigger {
    opacity: 0.4;
    pointer-events: none;
}
`;

function ensureDefaultStyles(): void {
    injectStyles(STYLE_ID, DEFAULT_STYLES);
}

// ── Component ──────────────────────────────────────────────────────────────

/**
 * A single-trigger dropdown for selecting `image_align`.
 * The trigger shows the icon for the current alignment; the menu is a 3×3 icon grid.
 *
 * Emits `imagealignchange` — `CustomEvent<ImageAlign>` when the selection changes.
 */
export class ImageAlignSelect {
    protected readonly host: HTMLElement;
    protected readonly trigger: HTMLButtonElement;
    protected readonly triggerIcon: HTMLElement;
    protected readonly menu: HTMLDivElement;
    protected _align: ImageAlign = 'center';
    protected _disabled = false;

    constructor(target: HTMLElement) {
        ensureDefaultStyles();
        this.host = target;
        setClasses(this.host, 'image-align-select-control');

        // ── Trigger
        this.trigger = document.createElement('button');
        this.trigger.type = 'button';
        this.trigger.setAttribute('aria-haspopup', 'listbox');
        this.trigger.setAttribute('aria-expanded', 'false');
        setClasses(this.trigger, 'image-align-select-trigger');

        this.triggerIcon = document.createElement('span');
        this.trigger.appendChild(this.triggerIcon);

        const caret = document.createElement('span');
        setClasses(caret, 'image-align-select-caret');
        caret.textContent = '▾';
        this.trigger.appendChild(caret);

        this.host.appendChild(this.trigger);

        // ── Menu — 3×3 grid
        this.menu = document.createElement('div');
        setClasses(this.menu, 'image-align-select-menu');
        this.menu.setAttribute('role', 'listbox');

        const grid = document.createElement('div');
        setClasses(grid, 'image-align-select-grid');

        for (const pos of ALIGN_POSITIONS) {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.title = ALIGN_TITLES[pos];
            btn.setAttribute('role', 'option');
            btn.dataset.align = pos;
            setClasses(btn, 'image-align-select-option');

            const icon = IconRegistry.createElement(`image-align-${pos}`, 18);
            if (icon) btn.appendChild(icon);

            grid.appendChild(btn);
        }

        this.menu.appendChild(grid);
        this.host.appendChild(this.menu);

        // ── Events
        this.trigger.addEventListener('click', this.onTriggerClick);
        this.menu.addEventListener('click', this.onOptionClick);
        document.addEventListener('click', this.onDocumentClick);

        this.syncTriggerIcon();
        this.syncOptions();
    }

    // ── Public API ─────────────────────────────────────────────

    public get align(): ImageAlign { return this._align; }
    public set align(v: ImageAlign) {
        if (this._align === v) return;
        this._align = v;
        this.syncTriggerIcon();
        this.syncOptions();
    }

    public get disabled(): boolean { return this._disabled; }
    public set disabled(v: boolean) {
        this._disabled = v;
        this.host.classList.toggle('is-disabled', v);
    }

    public destroy(): void {
        this.trigger.removeEventListener('click', this.onTriggerClick);
        this.menu.removeEventListener('click', this.onOptionClick);
        document.removeEventListener('click', this.onDocumentClick);
        this.host.innerHTML = '';
    }

    // ── Private ────────────────────────────────────────────────

    protected syncTriggerIcon(): void {
        this.triggerIcon.innerHTML = '';
        const icon = IconRegistry.createElement(`image-align-${this._align}`, 18);
        if (icon) this.triggerIcon.appendChild(icon);
    }

    protected syncOptions(): void {
        for (const btn of this.menu.querySelectorAll<HTMLButtonElement>('[data-align]')) {
            btn.classList.toggle('is-selected', btn.dataset.align === this._align);
            btn.setAttribute('aria-selected', String(btn.dataset.align === this._align));
        }
    }

    protected readonly onTriggerClick = (): void => {
        this.host.classList.contains('is-open') ? this.closeMenu() : this.openMenu();
    };

    protected readonly onDocumentClick = (e: Event): void => {
        if (!this.host.contains(e.target as Node)) this.closeMenu();
    };

    protected readonly onOptionClick = (e: Event): void => {
        const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-align]');
        if (!btn?.dataset.align) return;
        const align = btn.dataset.align as ImageAlign;
        this.closeMenu();
        if (align === this._align) return;
        this._align = align;
        this.syncTriggerIcon();
        this.syncOptions();
        this.host.dispatchEvent(new CustomEvent<ImageAlign>('imagealignchange', { detail: align, bubbles: true }));
    };

    protected openMenu(): void {
        toggleClasses(this.host, true, 'is-open');
        this.trigger.setAttribute('aria-expanded', 'true');
    }

    protected closeMenu(): void {
        removeClasses(this.host, 'is-open');
        this.trigger.setAttribute('aria-expanded', 'false');
    }
}
