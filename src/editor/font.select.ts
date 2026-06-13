/**
 * Configuration options for the font select control.
 * Provide only the properties you want to customize. All other properties will use default values.
 */
export interface FontSelectConfig {
    /**
     * Optional array of font family names to display in the dropdown. If not provided, a default set of common fonts will be used.
     * If an empty array is provided, the default fonts will be used.
     */
    fonts?: string[];
    /**
     * Whether to show a preview of the selected font in the trigger button.
     */
    showPreview?: boolean;
    /**
     * Custom class name for the host element.
     */
    hostClassName?: string;
    /**
     * Custom class name for the trigger button.
     */
    triggerClassName?: string;
    /**
     * Custom class name for the dropdown menu.
     */
    menuClassName?: string;
    /**
     * Custom class name for each option in the dropdown.
     */
    optionClassName?: string;
    /**
     * Custom class name for the font preview element.
     */
    previewClassName?: string;
    /**
     * Custom class name for the label element.
     */
    labelClassName?: string;
    /**
     * Custom class name for the selected option.
     */
    selectedClassName?: string;
    /**
     * Custom class name for the open state.
     */
    openClassName?: string;
}

export const DEFAULT_FONTS: string[] = [
    'Tahoma',
    'Arial',
    'Helvetica',
    'Georgia',
    'Times New Roman',
    'Courier New',
    'Trebuchet MS',
    'Verdana',
];

const DEFAULT_CONFIG: Required<Omit<FontSelectConfig, 'fonts'>> & { fonts: string[] } = {
    fonts: DEFAULT_FONTS,
    showPreview: true,
    hostClassName: 'font-select-control',
    triggerClassName: 'font-select-trigger',
    menuClassName: 'font-select-menu',
    optionClassName: 'font-select-option',
    previewClassName: 'font-select-preview',
    labelClassName: 'font-select-label',
    selectedClassName: 'is-selected',
    openClassName: 'is-open',
};

const STYLE_ID = 'font-select-defaults';

const DEFAULT_STYLES = `
.font-select-control {
    position: relative;
    min-width: 140px;
}
.font-select-control .font-select-trigger,
.font-select-control button[aria-haspopup='listbox'] {
    width: 100%;
    display: grid;
    grid-template-columns: 1fr auto;
    align-items: center;
    gap: 8px;
    padding: 6px 8px;
    cursor: pointer;
    appearance: none;
    border: 1px solid rgba(15, 23, 42, 0.15);
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.88);
    color: #1f2937;
    font: 600 12px/1.2 'Helvetica Neue', Helvetica, Arial, sans-serif;
}
.font-select-control .font-select-trigger::after {
    content: '▾';
    font-size: 12px;
    color: #334155;
}
.font-select-control .font-select-trigger:hover,
.font-select-control .font-select-trigger:focus-visible,
.font-select-control button[aria-haspopup='listbox']:hover,
.font-select-control button[aria-haspopup='listbox']:focus-visible {
    border-color: rgba(15, 118, 110, 0.45);
}
.font-select-preview {
    font-size: 13px;
    line-height: 1.2;
    color: #1f2937;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
.font-select-control .font-select-label {
    font: 600 11px/1.1 'Helvetica Neue', Helvetica, Arial, sans-serif;
    color: #334155;
    text-transform: lowercase;
    justify-self: end;
    white-space: nowrap;
}
.font-select-control .font-select-menu {
    position: absolute;
    left: 0;
    right: 0;
    top: calc(100% + 6px);
    z-index: 40;
    border: 1px solid rgba(15, 23, 42, 0.15);
    border-radius: 10px;
    background: #ffffff;
    padding: 6px;
    display: none;
    max-height: 240px;
    overflow: auto;
    box-shadow: 0 10px 24px rgba(15, 23, 42, 0.18);
}
.font-select-control.is-open .font-select-menu {
    display: grid;
    gap: 4px;
}
.font-select-control .font-select-option {
    width: 100%;
    display: grid;
    grid-template-columns: 1fr;
    align-items: center;
    border: none;
    border-radius: 6px;
    background: transparent;
    padding: 5px 8px;
    cursor: pointer;
    font: inherit;
    text-align: left;
}
.font-select-control .font-select-option:hover,
.font-select-control .font-select-option.is-selected {
    background: rgba(15, 118, 110, 0.1);
}
`;

import { injectStyles, setClasses, toggleClasses, removeClasses } from './editor.utils';

function ensureDefaultStyles(): void {
    injectStyles(STYLE_ID, DEFAULT_STYLES);
}

/**
 * A dropdown control for selecting font families.
 * Emits a 'fontchange' event when the selected font changes.
 * Example usage:
 * 
 * const fontSelect = new FontSelect(document.getElementById('font-select'), {
 *     fonts: ['Arial', 'Verdana', 'Tahoma'],
 *     showPreview: true,
 * });
 */
export class FontSelect {

    protected host: HTMLElement;

    protected config: Required<Omit<FontSelectConfig, 'fonts'>> & { fonts: string[] };

    protected selected: string;

    protected trigger: HTMLButtonElement;

    protected triggerPreview: HTMLSpanElement;

    protected menu: HTMLDivElement;

    constructor(target: HTMLElement, config: FontSelectConfig = {}) {
        ensureDefaultStyles();

        this.host = target;
        this.config = {
            ...DEFAULT_CONFIG,
            ...config,
            fonts: config.fonts?.length ? config.fonts : DEFAULT_CONFIG.fonts,
        };
        this.selected = this.config.fonts[0] || 'Tahoma';

        this.host.innerHTML = '';
        setClasses(this.host, DEFAULT_CONFIG.hostClassName, this.config.hostClassName);

        this.trigger = document.createElement('button');
        this.trigger.type = 'button';
        setClasses(this.trigger, DEFAULT_CONFIG.triggerClassName, this.config.triggerClassName);
        this.trigger.setAttribute('aria-haspopup', 'listbox');
        this.trigger.setAttribute('aria-expanded', 'false');

        this.triggerPreview = document.createElement('span');
        setClasses(this.triggerPreview, DEFAULT_CONFIG.previewClassName, this.config.previewClassName);
        this.trigger.appendChild(this.triggerPreview);

        this.menu = document.createElement('div');
        setClasses(this.menu, DEFAULT_CONFIG.menuClassName, this.config.menuClassName);
        this.menu.setAttribute('role', 'listbox');

        this.host.appendChild(this.trigger);
        this.host.appendChild(this.menu);

        this.trigger.addEventListener('click', this.onTriggerClick);
        this.menu.addEventListener('click', this.onOptionClick);
        if (typeof document !== 'undefined') {
            document.addEventListener('click', this.onDocumentClick);
        }

        this.rebuildOptions(this.config.fonts);
    }

    /**
     * Releases DOM/event resources owned by the control.
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
     * Gets the currently selected font family.
     */
    public get value(): string {
        return this.selected;
    }

    /**
     * Sets the currently selected font family.
     */
    public set value(font: string) {
        this.selectFont(font, false);
    }

    /**
     * Sets the available font options and optionally selects a font.
     * @param fonts - An array of font family names.
     * @param selectedFont - The font to select. Defaults to the first font in the array.
     */
    public setOptions(fonts: string[], selectedFont?: string): void {
        this.config.fonts = fonts.length ? fonts : DEFAULT_FONTS;
        this.rebuildOptions(this.config.fonts);
        this.selectFont(selectedFont || this.config.fonts[0] || 'Tahoma', false);
    }

    /** 
     * Handles the click event on the trigger button.
     * Toggles the open/closed state of the dropdown menu.
     */
    protected readonly onTriggerClick = (): void => {
        if (this.host.classList.contains(DEFAULT_CONFIG.openClassName)) {
            this.closeMenu();
            return;
        }
        this.openMenu();
    };

    /**
     * Handles the click event on the document to close the menu when clicking outside. 
     */
    protected readonly onDocumentClick = (event: Event): void => {
        const target = event.target as Node | null;
        if (target && !this.host.contains(target)) {
            this.closeMenu();
        }
    };

    /**
     * Handles the click event on a font option.
     * Selects the clicked font and closes the menu.
     * @param event - The click event.
     */
    protected readonly onOptionClick = (event: Event): void => {
        const target = event.target as HTMLElement | null;
        const option = target?.closest<HTMLElement>('[data-font]');
        const font = option?.dataset.font;
        if (!font) {
            return;
        }
        this.selectFont(font);
        this.closeMenu();
    };

    protected rebuildOptions(fonts: string[]): void {
        this.menu.innerHTML = '';
        for (const font of fonts) {
            this.menu.appendChild(this.buildOption(font));
        }
        this.syncSelectedOption();
        this.syncTrigger();
    }

    protected buildOption(font: string): HTMLButtonElement {
        const option = document.createElement('button');
        option.type = 'button';
        setClasses(option, DEFAULT_CONFIG.optionClassName, this.config.optionClassName);
        option.setAttribute('role', 'option');
        option.dataset.font = font;

        if (this.config.showPreview) {
            const preview = document.createElement('span');
            setClasses(preview, DEFAULT_CONFIG.previewClassName, this.config.previewClassName);
            preview.style.fontFamily = font;
            preview.textContent = font;
            option.appendChild(preview);
        } else {
            option.textContent = font;
        }

        return option;
    }

    protected selectFont(font: string, emit = true): void {
        this.selected = font;
        this.syncTrigger();
        this.syncSelectedOption();
        if (emit) {
            this.host.dispatchEvent(new CustomEvent<string>('fontchange', { detail: font }));
        }
    }

    protected syncTrigger(): void {
        this.triggerPreview.textContent = this.selected;
    }

    protected syncSelectedOption(): void {
        const options = this.menu.querySelectorAll<HTMLElement>('[data-font]');
        options.forEach((option) => {
            const isSelected = option.dataset.font === this.selected;
            toggleClasses(option, isSelected, DEFAULT_CONFIG.selectedClassName, this.config.selectedClassName);
            option.setAttribute('aria-selected', String(isSelected));
        });
    }

    protected openMenu(): void {
        setClasses(this.host, DEFAULT_CONFIG.openClassName, this.config.openClassName);
        this.trigger.setAttribute('aria-expanded', 'true');
    }

    protected closeMenu(): void {
        removeClasses(this.host, DEFAULT_CONFIG.openClassName, this.config.openClassName);
        this.trigger.setAttribute('aria-expanded', 'false');
    }
}
