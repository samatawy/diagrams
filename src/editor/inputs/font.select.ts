
import { injectStyles, setClasses, toggleClasses, removeClasses } from '../editor.utils';

import DEFAULT_STYLES from '../../css_generated/editor/inputs/font.select.css';
const STYLE_ID = 'font-select-defaults';

function ensureDefaultStyles(): void {
    injectStyles(STYLE_ID, DEFAULT_STYLES);
}

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

/**
 * A dropdown control for selecting font families.
 * Emits a 'fontchange' event when the selected font changes.
 * Example usage:
 * const fontSelect = new FontSelect(document.getElementById('font-select'), {
 * fonts: ['Arial', 'Verdana', 'Tahoma'],
 * showPreview: true,
 * });
 */
export class FontSelect {

    protected host: HTMLElement;

    protected config: Required<Omit<FontSelectConfig, 'fonts'>> & { fonts: string[] };

    protected selected: string;

    protected trigger: HTMLButtonElement;

    protected triggerPreview: HTMLSpanElement;

    protected menu: HTMLDivElement;

    /**
     * Creates a FontSelect component inside the given element.
     * @param target The host element that will contain the font picker.
     * @param config Optional display and behaviour configuration.
     */
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

    /**
     * Replaces the current option list with a new set of font families.
     * @param fonts The font family strings to render.
     */
    protected rebuildOptions(fonts: string[]): void {
        this.menu.innerHTML = '';
        for (const font of fonts) {
            this.menu.appendChild(this.buildOption(font));
        }
        this.syncSelectedOption();
        this.syncTrigger();
    }

    /**
     * Builds a single option button with an optional font-preview span.
     * @param font The CSS font-family string for this option.
     * @returns The constructed option button element.
     */
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

    /**
     * Updates the internal selection state, syncs the trigger and option list, and optionally emits 'fontchange'.
     * @param font The new font family to select.
     * @param emit Whether to dispatch the change event. Defaults to true.
     */
    protected selectFont(font: string, emit = true): void {
        this.selected = font;
        this.syncTrigger();
        this.syncSelectedOption();
        if (emit) {
            this.host.dispatchEvent(new CustomEvent<string>('fontchange', { detail: font }));
        }
    }

    /**
     * Updates the trigger button's preview text to the current font family.
     */
    protected syncTrigger(): void {
        this.triggerPreview.textContent = this.selected;
    }

    /**
     * Toggles the selected CSS class and aria-selected attribute on all font option buttons.
     */
    protected syncSelectedOption(): void {
        const options = this.menu.querySelectorAll<HTMLElement>('[data-font]');
        options.forEach((option) => {
            const isSelected = option.dataset.font === this.selected;
            toggleClasses(option, isSelected, DEFAULT_CONFIG.selectedClassName, this.config.selectedClassName);
            option.setAttribute('aria-selected', String(isSelected));
        });
    }

    /**
     * Adds the open CSS class and updates aria-expanded on the trigger button.
     */
    protected openMenu(): void {
        setClasses(this.host, DEFAULT_CONFIG.openClassName, this.config.openClassName);
        this.trigger.setAttribute('aria-expanded', 'true');
    }

    /**
     * Removes the open CSS class and updates aria-expanded on the trigger button.
     */
    protected closeMenu(): void {
        removeClasses(this.host, DEFAULT_CONFIG.openClassName, this.config.openClassName);
        this.trigger.setAttribute('aria-expanded', 'false');
    }
}
