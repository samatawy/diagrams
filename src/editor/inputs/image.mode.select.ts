import type { ImageMode } from '../../types';
import { injectStyles, setClasses, toggleClasses, removeClasses } from '../editor.utils';
import { IconRegistry } from '../../factory/icon.registry';

// ── Shared data ────────────────────────────────────────────────────────────

export const IMAGE_MODE_TITLES: Record<ImageMode, string> = {
    none: 'No image',
    contain: 'Contain',
    cover: 'Cover',
    fit: 'Fit',
    pattern: 'Tile',
};

export const IMAGE_MODES: ImageMode[] = ['none', 'contain', 'cover', 'fit', 'pattern'];

// ── Styles ───────────────────────────────────────────────────────────────── ──────────────────────────────────────────────────────────

const STYLE_ID = 'image-mode-select-defaults';

const DEFAULT_STYLES = `
.image-mode-select-control {
    position: relative;
    font-size: var(--diagram-ui-font-size, 12px);
    font-family: var(--diagram-ui-font-family, system-ui);
    line-height: 1.2;
}
.image-mode-select-trigger {
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
.image-mode-select-trigger:hover,
.image-mode-select-trigger:focus-visible {
    border-color: var(--diagram-ui-border-strong, rgba(15, 118, 110, 0.45));
}
.image-mode-select-trigger svg {
    display: block;
    pointer-events: none;
}
.image-mode-select-caret {
    color: var(--diagram-ui-text-muted, #334155);
    font-size: var(--diagram-ui-font-size, 12px);
    line-height: 1;
}
.image-mode-select-menu {
    position: absolute;
    left: 0;
    top: calc(100% + var(--diagram-ui-control-gap, 6px));
    z-index: 40;
    min-width: 120px;
    border: var(--diagram-ui-border-width, 1px) solid var(--diagram-ui-border, rgba(15, 23, 42, 0.15));
    border-radius: var(--diagram-ui-panel-radius, 10px);
    background: var(--diagram-ui-surface-elevated, #ffffff);
    padding: var(--diagram-ui-panel-padding, 6px);
    box-shadow: 0 10px 24px var(--diagram-ui-shadow-color, rgba(15, 23, 42, 0.18));
    display: none;
}
.image-mode-select-control.is-open .image-mode-select-menu {
    display: block;
}
.image-mode-select-options {
    display: flex;
    flex-direction: column;
    gap: 2px;
}
.image-mode-select-option {
    display: flex;
    align-items: center;
    gap: var(--diagram-ui-control-gap, 8px);
    width: 100%;
    padding: var(--diagram-ui-group-gap, 4px) var(--diagram-ui-control-padding-x, 8px);
    border: none;
    border-radius: var(--diagram-ui-control-radius, 6px);
    background: transparent;
    cursor: pointer;
    font: inherit;
    text-align: left;
    color: var(--diagram-ui-text, #1f2937);
    white-space: nowrap;
}
.image-mode-select-option svg {
    display: block;
    pointer-events: none;
    flex-shrink: 0;
}
.image-mode-select-option-label {
    flex: 1;
}
.image-mode-select-option:hover,
.image-mode-select-option.is-selected {
    background: var(--diagram-ui-hover-bg, rgba(15, 118, 110, 0.1));
}
.image-mode-select-control.is-disabled .image-mode-select-trigger {
    opacity: 0.4;
    pointer-events: none;
}
`;

function ensureDefaultStyles(): void {
    injectStyles(STYLE_ID, DEFAULT_STYLES);
}

// ── ImageModeSelect ────────────────────────────────────────────────────────

/**
 * A single-trigger dropdown for selecting `image_mode`.
 * The trigger shows the icon for the current mode; the menu lists all modes as icon + label.
 *
 * Emits `imagemodechange` — `CustomEvent<ImageMode>` when the selection changes.
 */
export class ImageModeSelect {
    protected readonly host: HTMLElement;
    protected readonly trigger: HTMLButtonElement;
    protected readonly triggerIcon: HTMLElement;
    protected readonly menu: HTMLDivElement;
    protected _mode: ImageMode = 'contain';
    protected _disabled = false;

    constructor(target: HTMLElement) {
        ensureDefaultStyles();
        this.host = target;
        setClasses(this.host, 'image-mode-select-control');

        // ── Trigger
        this.trigger = document.createElement('button');
        this.trigger.type = 'button';
        this.trigger.setAttribute('aria-haspopup', 'listbox');
        this.trigger.setAttribute('aria-expanded', 'false');
        setClasses(this.trigger, 'image-mode-select-trigger');

        this.triggerIcon = document.createElement('span');
        this.trigger.appendChild(this.triggerIcon);

        const caret = document.createElement('span');
        setClasses(caret, 'image-mode-select-caret');
        caret.textContent = '▾';
        this.trigger.appendChild(caret);

        this.host.appendChild(this.trigger);

        // ── Menu
        this.menu = document.createElement('div');
        setClasses(this.menu, 'image-mode-select-menu');
        this.menu.setAttribute('role', 'listbox');

        const list = document.createElement('div');
        setClasses(list, 'image-mode-select-options');

        for (const mode of IMAGE_MODES) {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.setAttribute('role', 'option');
            btn.dataset.mode = mode;
            setClasses(btn, 'image-mode-select-option');

            const icon = IconRegistry.createElement(`image-mode-${mode}`, 18);
            if (icon) btn.appendChild(icon);

            const label = document.createElement('span');
            setClasses(label, 'image-mode-select-option-label');
            label.textContent = IMAGE_MODE_TITLES[mode];
            btn.appendChild(label);

            list.appendChild(btn);
        }

        this.menu.appendChild(list);
        this.host.appendChild(this.menu);

        // ── Events
        this.trigger.addEventListener('click', this.onTriggerClick);
        this.menu.addEventListener('click', this.onOptionClick);
        document.addEventListener('click', this.onDocumentClick);

        this.syncTriggerIcon();
        this.syncOptions();
    }

    // ── Public API ─────────────────────────────────────────────

    public get mode(): ImageMode { return this._mode; }
    public set mode(v: ImageMode) {
        if (this._mode === v) return;
        this._mode = v;
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
        const icon = IconRegistry.createElement(`image-mode-${this._mode}`, 18);
        if (icon) this.triggerIcon.appendChild(icon);
    }

    protected syncOptions(): void {
        for (const btn of this.menu.querySelectorAll<HTMLButtonElement>('[data-mode]')) {
            btn.classList.toggle('is-selected', btn.dataset.mode === this._mode);
            btn.setAttribute('aria-selected', String(btn.dataset.mode === this._mode));
        }
    }

    protected readonly onTriggerClick = (): void => {
        this.host.classList.contains('is-open') ? this.closeMenu() : this.openMenu();
    };

    protected readonly onDocumentClick = (e: Event): void => {
        if (!this.host.contains(e.target as Node)) this.closeMenu();
    };

    protected readonly onOptionClick = (e: Event): void => {
        const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-mode]');
        if (!btn?.dataset.mode) return;
        const mode = btn.dataset.mode as ImageMode;
        this.closeMenu();
        if (mode === this._mode) return;
        this._mode = mode;
        this.syncTriggerIcon();
        this.syncOptions();
        this.host.dispatchEvent(new CustomEvent<ImageMode>('imagemodechange', { detail: mode, bubbles: true }));
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


