import { injectStyles, setClasses, toggleClasses, removeClasses } from '../editor.utils';

// ── Asset store interface ─────────────────────────────────────────────────────
// A minimal subset of AssetStore so this component has no hard dependency on
// the view layer. The full AssetStore satisfies this interface.

export interface IImageAssetStore {
    register(source: string, preferredId?: string): string;
    resolve(imageId?: string): string | undefined;
    snapshot(): Record<string, string> | undefined;
}

// ── Config ────────────────────────────────────────────────────────────────────

export interface ImageSelectConfig {
    /**
     * Optional asset store used to enumerate, look up, and register images.
     * Can also be supplied (or replaced) later via {@link ImageSelect.setAssetStore}.
     */
    assetStore?: IImageAssetStore;

    /**
     * When true the text input and browse button are hidden, disabling user edits.
     */
    readonly?: boolean;

    // ── Class name overrides ─────────────────────────────────────────────────

    hostClassName?: string;
    triggerClassName?: string;
    menuClassName?: string;
    optionClassName?: string;
    thumbClassName?: string;
    openClassName?: string;
    selectedClassName?: string;
}

// ── Defaults ──────────────────────────────────────────────────────────────────

const DEFAULT_CONFIG: Required<Omit<ImageSelectConfig, 'assetStore'>> = {
    readonly: false,
    hostClassName: 'image-select-control',
    triggerClassName: 'image-select-trigger',
    menuClassName: 'image-select-menu',
    optionClassName: 'image-select-option',
    thumbClassName: 'image-select-thumb',
    openClassName: 'is-open',
    selectedClassName: 'is-selected',
};

// ── Styles ────────────────────────────────────────────────────────────────────

const STYLE_ID = 'image-select-control-defaults';

const DEFAULT_STYLES = `
/* ── host ────────────────────────────────────────────────────── */
.image-select-control {
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: var(--diagram-ui-control-gap, 4px);
    font-size: var(--diagram-ui-font-size, 12px);
    font-family: var(--diagram-ui-font-family, system-ui);
    line-height: 1.2;
}

/* ── trigger button ──────────────────────────────────────────── */
.image-select-control .image-select-trigger {
    display: inline-flex;
    align-items: center;
    gap: var(--diagram-ui-control-gap, 4px);
    padding: var(--diagram-ui-control-padding-y, 6px) var(--diagram-ui-control-padding-x, 8px);
    cursor: pointer;
    appearance: none;
    border: var(--diagram-ui-border-width, 1px) solid var(--diagram-ui-border, rgba(15, 23, 42, 0.15));
    border-radius: var(--diagram-ui-control-radius, 10px);
    background: var(--diagram-ui-surface, rgba(255, 255, 255, 0.88));
    color: var(--diagram-ui-text, #1f2937);
    font-weight: 600;
    min-width: 140px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
.image-select-control .image-select-trigger:hover,
.image-select-control .image-select-trigger:focus-visible {
    border-color: var(--diagram-ui-border-strong, rgba(15, 118, 110, 0.45));
}
/* mixed state — shown when selection has different image ids */
.image-select-control .image-select-trigger.is-mixed {
    position: relative;
}
.image-select-control .image-select-trigger.is-mixed > * {
    opacity: 0;
}
.image-select-control .image-select-trigger.is-mixed::after {
    content: 'Multiple';
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    padding: 0 var(--diagram-ui-control-padding-x, 8px);
    color: var(--diagram-ui-text-muted, #94a3b8);
    font-style: italic;
    pointer-events: none;
}

/* thumbnail inside the trigger */
.image-select-control .image-select-trigger-thumb {
    width: 18px;
    height: 18px;
    object-fit: contain;
    border-radius: 3px;
    flex-shrink: 0;
    display: none;
}
.image-select-control .image-select-trigger-thumb.is-visible {
    display: block;
}
/* hide caret when thumbnail is showing */
.image-select-control .image-select-trigger-thumb.is-visible ~ .image-select-trigger-caret {
    display: none;
}
/* trigger label (shown when no image is selected) */
.image-select-control .image-select-trigger-label {
    font-size: var(--diagram-ui-font-size, 12px);
    font-weight: 400;
    color: var(--diagram-ui-text-muted, #334155);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    flex: 1;
}
.image-select-control .image-select-trigger-caret {
    font-size: var(--diagram-ui-font-size, 12px);
    color: var(--diagram-ui-text-muted, #334155);
    flex-shrink: 0;
}

/* ── browse (…) button ───────────────────────────────────────── */
.image-select-control .image-select-browse-btn {
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: var(--diagram-ui-control-padding-y, 6px) var(--diagram-ui-control-padding-x, 8px);
    border: var(--diagram-ui-border-width, 1px) solid var(--diagram-ui-border, rgba(15, 23, 42, 0.15));
    border-radius: var(--diagram-ui-control-radius, 10px);
    background: var(--diagram-ui-surface, rgba(255, 255, 255, 0.88));
    color: var(--diagram-ui-text, #1f2937);
    font-weight: 600;
    cursor: pointer;
    appearance: none;
}
.image-select-control .image-select-browse-btn:hover,
.image-select-control .image-select-browse-btn:focus-visible {
    border-color: var(--diagram-ui-border-strong, rgba(15, 118, 110, 0.45));
}

/* ── hidden file input ───────────────────────────────────────── */
.image-select-control .image-select-file-input {
    display: none;
}

/* ── dropdown menu ───────────────────────────────────────────── */
.image-select-control .image-select-menu {
    position: absolute;
    left: 0;
    right: 0;
    top: calc(100% + var(--diagram-ui-control-gap, 6px));
    min-width: 100%;
    z-index: 40;
    border: var(--diagram-ui-border-width, 1px) solid var(--diagram-ui-border, rgba(15, 23, 42, 0.15));
    border-radius: var(--diagram-ui-panel-radius, 10px);
    background: var(--diagram-ui-surface-elevated, #ffffff);
    padding: var(--diagram-ui-panel-padding, 6px);
    display: none;
    max-height: 240px;
    overflow: auto;
    box-shadow: 0 10px 24px var(--diagram-ui-shadow-color, rgba(15, 23, 42, 0.18));
}
.image-select-control.is-open .image-select-menu {
    display: grid;
    gap: var(--diagram-ui-group-gap, 4px);
}

/* ── menu option ─────────────────────────────────────────────── */
.image-select-control .image-select-option {
    display: flex;
    align-items: center;
    gap: var(--diagram-ui-control-gap, 4px);
    width: 100%;
    padding: var(--diagram-ui-group-gap, 5px) var(--diagram-ui-control-padding-x, 8px);
    border: none;
    border-radius: var(--diagram-ui-control-radius, 6px);
    background: transparent;
    text-align: left;
    cursor: pointer;
    font: inherit;
    color: var(--diagram-ui-text, #1f2937);
    white-space: nowrap;
    overflow: hidden;
}
.image-select-control .image-select-option:hover,
.image-select-control .image-select-option.is-selected {
    background: var(--diagram-ui-hover-bg, rgba(15, 118, 110, 0.1));
}
.image-select-control .image-select-option-label {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
.image-select-control .image-select-option-thumb {
    width: 16px;
    height: 16px;
    object-fit: contain;
    flex-shrink: 0;
    border-radius: 2px;
}
.image-select-control .image-select-option-empty {
    padding: var(--diagram-ui-group-gap, 5px) var(--diagram-ui-control-padding-x, 8px);
    color: var(--diagram-ui-text-muted, #334155);
    opacity: 0.7;
    pointer-events: none;
}
/* clear option */
.image-select-control .image-select-option-clear {
    opacity: 0.65;
}
`;

function ensureDefaultStyles(): void {
    injectStyles(STYLE_ID, DEFAULT_STYLES);
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * A toolbar-ready dropdown control for selecting, browsing, and clearing image assets.
 *
 * Dispatches an `'imagechange'` CustomEvent whose `detail` is the selected asset id
 * string, or an empty string when the image is cleared.
 *
 * Example:
 * ```ts
 * const pick = new ImageSelect(host, { assetStore: diagram.assetStore });
 * host.addEventListener('imagechange', e => node.image_id = e.detail || undefined);
 * ```
 */
export class ImageSelect {

    protected readonly host: HTMLElement;
    protected readonly config: Required<Omit<ImageSelectConfig, 'assetStore'>>;

    protected assetStore?: IImageAssetStore;

    protected trigger: HTMLButtonElement;
    protected triggerThumb: HTMLImageElement;
    protected triggerLabel: HTMLSpanElement;
    protected menu: HTMLDivElement;
    protected fileInput: HTMLInputElement;

    protected selected: string = '';

    // ── Construction ──────────────────────────────────────────────────────────

    constructor(target: HTMLElement, config: ImageSelectConfig = {}) {
        ensureDefaultStyles();

        this.host = target;
        this.config = {
            readonly: config.readonly ?? DEFAULT_CONFIG.readonly,
            hostClassName: config.hostClassName ?? DEFAULT_CONFIG.hostClassName,
            triggerClassName: config.triggerClassName ?? DEFAULT_CONFIG.triggerClassName,
            menuClassName: config.menuClassName ?? DEFAULT_CONFIG.menuClassName,
            optionClassName: config.optionClassName ?? DEFAULT_CONFIG.optionClassName,
            thumbClassName: config.thumbClassName ?? DEFAULT_CONFIG.thumbClassName,
            openClassName: config.openClassName ?? DEFAULT_CONFIG.openClassName,
            selectedClassName: config.selectedClassName ?? DEFAULT_CONFIG.selectedClassName,
        };
        this.assetStore = config.assetStore;

        this.host.innerHTML = '';
        setClasses(this.host, DEFAULT_CONFIG.hostClassName, this.config.hostClassName);

        // ── Trigger button ────────────────────────────────────────────────────
        this.trigger = document.createElement('button');
        this.trigger.type = 'button';
        setClasses(this.trigger, DEFAULT_CONFIG.triggerClassName, this.config.triggerClassName);
        this.trigger.setAttribute('aria-haspopup', 'listbox');
        this.trigger.setAttribute('aria-expanded', 'false');

        this.triggerThumb = document.createElement('img');
        this.triggerThumb.className = 'image-select-trigger-thumb';
        this.trigger.appendChild(this.triggerThumb);

        this.triggerLabel = document.createElement('span');
        this.triggerLabel.className = 'image-select-trigger-label';
        this.triggerLabel.textContent = 'Image';
        this.trigger.appendChild(this.triggerLabel);

        const caret = document.createElement('span');
        caret.className = 'image-select-trigger-caret';
        caret.textContent = '▾';
        this.trigger.appendChild(caret);

        this.host.appendChild(this.trigger);

        // ── Dropdown menu ─────────────────────────────────────────────────────
        this.menu = document.createElement('div');
        setClasses(this.menu, DEFAULT_CONFIG.menuClassName, this.config.menuClassName);
        this.menu.setAttribute('role', 'listbox');
        this.host.appendChild(this.menu);

        // ── Browse button + hidden file input (write mode only) ───────────────
        this.fileInput = document.createElement('input');
        this.fileInput.type = 'file';
        this.fileInput.accept = 'image/*,image/svg+xml';
        this.fileInput.className = 'image-select-file-input';
        this.host.appendChild(this.fileInput);

        if (!this.config.readonly) {
            const browseBtn = document.createElement('button');
            browseBtn.type = 'button';
            browseBtn.className = 'image-select-browse-btn';
            browseBtn.textContent = '\u2026';
            browseBtn.title = 'Browse local file';
            this.host.appendChild(browseBtn);

            browseBtn.addEventListener('click', () => this.fileInput.click());
            this.fileInput.addEventListener('change', () => this.onFileSelected());
        }

        // ── Event wiring ──────────────────────────────────────────────────────
        this.trigger.addEventListener('click', this.onTriggerClick);
        this.menu.addEventListener('click', this.onOptionClick);
        if (typeof document !== 'undefined') {
            document.addEventListener('click', this.onDocumentClick);
        }

        this.syncTrigger();
    }

    // ── Public API ────────────────────────────────────────────────────────────

    /**
     * Releases all DOM/event resources owned by the control.
     */
    public destroy(): void {
        this.trigger.removeEventListener('click', this.onTriggerClick);
        this.menu.removeEventListener('click', this.onOptionClick);
        if (typeof document !== 'undefined') {
            document.removeEventListener('click', this.onDocumentClick);
        }
        this.host.innerHTML = '';
    }

    /**
     * The currently selected asset id, or an empty string when no image is set.
     */
    public get value(): string {
        return this.selected;
    }

    /**
     * Sets the selected asset id without emitting a change event.
     */
    public set value(id: string) {
        this.selectId(id || '', false);
    }

    /**
     * Provides or replaces the asset store used to enumerate and register images.
     * Call this after construction when the store is not yet available, or when
     * the active diagram changes.
     */
    public setAssetStore(store: IImageAssetStore | undefined): void {
        this.assetStore = store;
    }

    /**
     * Puts the trigger into a mixed-value state showing "Multiple" in muted italic.
     * Pass false to clear the mixed state and restore normal display.
     */
    public setMixed(mixed: boolean): void {
        toggleClasses(this.trigger, mixed, 'is-mixed');
        if (mixed) {
            // Hide all child content via CSS (::after overlay shows 'Multiple')
            // Nothing to set on `selected` — leave it unchanged so clearing mixed
            // restores the last real value.
        } else {
            this.syncTrigger();
        }
    }

    // ── Event handlers ────────────────────────────────────────────────────────

    protected readonly onTriggerClick = (): void => {
        if (this.host.classList.contains(DEFAULT_CONFIG.openClassName)) {
            this.closeMenu();
            return;
        }
        this.rebuildMenu();
        this.openMenu();
    };

    protected readonly onDocumentClick = (event: Event): void => {
        const target = event.target as Node | null;
        if (target && !this.host.contains(target)) {
            this.closeMenu();
        }
    };

    protected readonly onOptionClick = (event: Event): void => {
        const target = event.target as HTMLElement | null;
        const option = target?.closest<HTMLElement>('[data-image-id]');
        if (!option) return;

        const id = option.dataset['imageId'] ?? '';
        this.selectId(id);
        this.closeMenu();
    };

    // ── Menu building ─────────────────────────────────────────────────────────

    protected rebuildMenu(): void {
        this.menu.innerHTML = '';

        // Always offer a "None / clear" option at the top
        this.menu.appendChild(this.buildClearOption());

        const snapshot = this.assetStore?.snapshot() ?? {};
        const ids = Object.keys(snapshot);

        if (!ids.length) {
            const empty = document.createElement('div');
            empty.className = 'image-select-option-empty';
            empty.textContent = 'No assets in store';
            this.menu.appendChild(empty);
            return;
        }

        for (const id of ids) {
            this.menu.appendChild(this.buildOption(id, snapshot[id]!));
        }
    }

    protected buildClearOption(): HTMLButtonElement {
        const btn = document.createElement('button');
        btn.type = 'button';
        setClasses(btn, DEFAULT_CONFIG.optionClassName, this.config.optionClassName,
            'image-select-option-clear');
        btn.setAttribute('role', 'option');
        btn.dataset['imageId'] = '';
        const label = document.createElement('span');
        label.className = 'image-select-option-label';
        label.textContent = '— None';
        btn.appendChild(label);
        toggleClasses(btn, !this.selected, DEFAULT_CONFIG.selectedClassName, this.config.selectedClassName);
        return btn;
    }

    protected buildOption(id: string, src: string): HTMLButtonElement {
        const btn = document.createElement('button');
        btn.type = 'button';
        setClasses(btn, DEFAULT_CONFIG.optionClassName, this.config.optionClassName);
        btn.setAttribute('role', 'option');
        btn.dataset['imageId'] = id;

        if (this.looksLikeImage(src)) {
            const thumb = document.createElement('img');
            thumb.src = src;
            thumb.className = 'image-select-option-thumb';
            btn.appendChild(thumb);
        }

        const label = document.createElement('span');
        label.className = 'image-select-option-label';
        label.textContent = id;
        btn.appendChild(label);

        toggleClasses(btn, id === this.selected,
            DEFAULT_CONFIG.selectedClassName, this.config.selectedClassName);
        btn.setAttribute('aria-selected', String(id === this.selected));

        return btn;
    }

    // ── Selection ─────────────────────────────────────────────────────────────

    /**
     * Updates the selection, syncs the trigger, and optionally emits `'imagechange'`.
     */
    protected selectId(id: string, emit = true): void {
        this.selected = id;
        this.syncTrigger();
        if (emit) {
            this.host.dispatchEvent(new CustomEvent<string>('imagechange', { detail: id, bubbles: false }));
        }
    }

    /**
     * Handles a local file being picked via the file input.
     * Reads the file as a data URL, registers it in the store, then selects it.
     */
    protected onFileSelected(): void {
        const file = this.fileInput.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const dataUrl = reader.result as string;
            const preferredId = file.name.replace(/\.[^.]+$/, '');
            const registeredId = this.assetStore
                ? this.assetStore.register(dataUrl, preferredId)
                : dataUrl;
            this.selectId(registeredId);
        };
        this.fileInput.value = '';
    }

    // ── Trigger sync ──────────────────────────────────────────────────────────

    /**
     * Updates the trigger button to reflect the current selection:
     * shows a thumbnail when an image is selected, otherwise shows the placeholder label.
     */
    protected syncTrigger(): void {
        const src = this.selected ? (this.assetStore?.resolve(this.selected) ?? this.selected) : undefined;
        const hasImage = !!src && this.looksLikeImage(src);

        if (hasImage) {
            this.triggerThumb.src = src!;
        }
        toggleClasses(this.triggerThumb, hasImage, 'is-visible');

        this.triggerLabel.textContent = this.selected
            ? (this.labelForId(this.selected) ?? this.selected)
            : 'Image';
    }

    // ── Menu open/close ───────────────────────────────────────────────────────

    protected openMenu(): void {
        toggleClasses(this.host, true, DEFAULT_CONFIG.openClassName, this.config.openClassName);
        this.trigger.setAttribute('aria-expanded', 'true');
    }

    protected closeMenu(): void {
        removeClasses(this.host, DEFAULT_CONFIG.openClassName, this.config.openClassName);
        this.trigger.setAttribute('aria-expanded', 'false');
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    protected looksLikeImage(src: string): boolean {
        return src.startsWith('data:image') || /\.(png|jpe?g|gif|webp|svg)(\?|$)/i.test(src);
    }

    /**
     * Returns a short human-readable label for an asset id.
     * For data URIs it returns the id itself; for URLs it returns the URL.
     */
    protected labelForId(id: string): string | undefined {
        const src = this.assetStore?.resolve(id);
        if (!src) return id;
        return src.startsWith('data:') ? id : src;
    }
}
