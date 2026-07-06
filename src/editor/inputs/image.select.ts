import { injectStyles, setClasses, toggleClasses, removeClasses } from '../editor.utils';

import DEFAULT_STYLES from '../../css_generated/editor/inputs/image.select.css';
const STYLE_ID = 'image-select-control-defaults';

function ensureDefaultStyles(): void {
    injectStyles(STYLE_ID, DEFAULT_STYLES);
}

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
