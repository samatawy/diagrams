import type { ImageMode } from '../../types';
import { injectStyles, setClasses, toggleClasses, removeClasses } from '../editor.utils';
import { IconRegistry } from '../../factory/icon.registry';

import DEFAULT_STYLES from '../../css_generated/editor/inputs/image.mode.select.css';
const STYLE_ID = 'image-mode-select-defaults';

function ensureDefaultStyles(): void {
    injectStyles(STYLE_ID, DEFAULT_STYLES);
}

// ── Shared data ────────────────────────────────────────────────────────────

export const IMAGE_MODE_TITLES: Record<ImageMode, string> = {
    none: 'No image',
    contain: 'Contain',
    cover: 'Cover',
    fit: 'Fit',
    pattern: 'Tile',
};

export const IMAGE_MODES: ImageMode[] = ['none', 'contain', 'cover', 'fit', 'pattern'];

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
        // this.trigger.title = this.config.tooltip;
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

