import { injectStyles, setClasses, toggleClasses, removeClasses } from '../editor.utils';
import { CHECKER_CSS_PATTERN } from '../../color.types';

import DEFAULT_STYLES from '../../css_generated/editor/inputs/color.select.css';
const STYLE_ID = 'color-select-defaults';

function ensureDefaultStyles(): void {
    injectStyles(STYLE_ID, DEFAULT_STYLES);
}

/**
 * Configuration options for the ColorSelect control.
 * Provide only the properties you want to override; defaults will be used for the rest.
 */
export interface ColorSelectConfig {
    tooltip?: string;
    /**
     * Whether to show a color swatch in the trigger button. Default is true.
     */
    showSwatch?: boolean;
    /**
     * Whether to show a color label in the trigger button. Default is true.
     * The label will display the color value or 'clear' for transparent.
     */
    showLabel?: boolean;
    /**
     * Whether to show the native color input. Default is 'option'.
     * 'start' - show at the start of the trigger button
     * 'end' - show at the end of the trigger button
     * 'option' - show as an option in the menu
     * 'none' - do not show
     */
    showNativeInput?: 'start' | 'end' | 'option' | 'none';

    /**
     * Aria label for the native color input. Default is 'Custom color'.
     */
    nativeInputAriaLabel?: string;
    /**
     * When true, prepends an 'inherit' option to the menu so the user can reset the value
     * to the inherited default (e.g. fill color, diagram background).
     * Default is false.
     */
    showInheritOption?: boolean;
    /**
     * Optional class name for the host element.
     */
    hostClassName?: string;
    /**
     * Optional class name for the trigger button.
     */
    triggerClassName?: string;
    /**
     * Optional class name for the menu element.
     */
    menuClassName?: string;
    /**
     * Optional class name for the option elements.
     */
    optionClassName?: string;
    /**
     * Optional class name for the color swatch elements.
     */
    swatchClassName?: string;
    /**
     * Optional class name for the label elements.
     */
    labelClassName?: string;
    /**
     * Optional class name for the native input element.
     */
    nativeInputClassName?: string;
    /**
     * Optional class name for the selected state.
     */
    selectedClassName?: string;
    /**
     * Optional class name for the open state.
     */
    openClassName?: string;
}

/**
 * Input shape for adding a color option with an optional display label.
 */
export interface ColorOptionInput {
    /**
     * The color value to display. Can be any valid CSS color string.
     */
    color: string;
    /**
     * Optional label to display for the color option. If not provided, the color value will be used.
     */
    label?: string;
}

const DEFAULT_CONFIG: Required<ColorSelectConfig> = {
    tooltip: '',
    showSwatch: true,
    showLabel: true,
    showNativeInput: 'option',
    showInheritOption: false,
    nativeInputAriaLabel: 'Custom color',
    hostClassName: 'color-preset-control',
    triggerClassName: 'color-preset-trigger',
    menuClassName: 'color-preset-menu',
    optionClassName: 'color-preset-option',
    swatchClassName: 'color-preset-swatch',
    labelClassName: 'color-preset-label',
    nativeInputClassName: 'color-preset-native-input',
    selectedClassName: 'is-selected',
    openClassName: 'is-open',
};

/**
 * A color selection control that supports predefined options and an optional native color picker input.
 * The control can be configured to show color swatches, labels, and the native input in different arrangements.
 * It dispatches a 'colorchange' event with the selected color whenever the selection changes.
 */
export class ColorSelect {

    protected host: HTMLElement;

    protected selected = '#000000';

    protected config: Required<ColorSelectConfig>;

    protected trigger: HTMLButtonElement;

    protected triggerSwatch?: HTMLDivElement;

    protected triggerLabel?: HTMLSpanElement;

    protected nativeInput?: HTMLInputElement;

    protected customInput?: HTMLInputElement;

    protected customOption?: HTMLButtonElement;

    protected nativeInputMode: 'start' | 'end' | 'option' | 'none';

    protected menu: HTMLDivElement;

    /**
     * Creates a ColorSelect component inside the given element.
     * @param target The host element that will contain the color picker.
     * @param config Optional display and behaviour configuration.
     */
    constructor(target: HTMLElement, config: ColorSelectConfig = {}) {
        ensureDefaultStyles();
        this.host = target;
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.nativeInputMode = this.resolveNativeInputMode(this.config.showNativeInput);

        this.host.innerHTML = '';
        setClasses(this.host, DEFAULT_CONFIG.hostClassName, this.config.hostClassName);
        if (this.nativeInputMode === 'start' || this.nativeInputMode === 'end') {
            setClasses(this.host, 'with-native-input', `native-${this.nativeInputMode}`);
        }

        this.trigger = document.createElement('button');
        this.trigger.type = 'button';
        setClasses(this.trigger, DEFAULT_CONFIG.triggerClassName, this.config.triggerClassName);
        this.trigger.setAttribute('aria-haspopup', 'listbox');
        this.trigger.setAttribute('aria-expanded', 'false');
        this.trigger.title = this.config.tooltip;

        if (this.config.showSwatch) {
            this.triggerSwatch = this.createSwatch(this.selected);
            this.trigger.appendChild(this.triggerSwatch);
        }

        if (this.config.showLabel) {
            this.triggerLabel = document.createElement('span');
            setClasses(this.triggerLabel, DEFAULT_CONFIG.labelClassName, this.config.labelClassName);
            this.trigger.appendChild(this.triggerLabel);
        }

        this.menu = document.createElement('div');
        setClasses(this.menu, DEFAULT_CONFIG.menuClassName, this.config.menuClassName);
        this.menu.setAttribute('role', 'listbox');

        if (this.nativeInputMode === 'start' || this.nativeInputMode === 'end') {
            this.nativeInput = document.createElement('input');
            this.nativeInput.type = 'color';
            this.nativeInput.setAttribute('aria-label', this.config.nativeInputAriaLabel);
            setClasses(this.nativeInput, DEFAULT_CONFIG.nativeInputClassName, this.config.nativeInputClassName);
        }

        if (this.nativeInputMode === 'option') {
            this.customInput = document.createElement('input');
            this.customInput.type = 'color';
            this.customInput.setAttribute('aria-label', this.config.nativeInputAriaLabel);
            this.customInput.tabIndex = -1;
            this.customInput.style.position = 'absolute';
            this.customInput.style.width = '0';
            this.customInput.style.height = '0';
            this.customInput.style.opacity = '0';
            this.customInput.style.pointerEvents = 'none';

            this.customOption = this.buildCustomOption();
        }

        if (this.nativeInputMode === 'start' && this.nativeInput) {
            this.host.appendChild(this.nativeInput);
        }
        this.host.appendChild(this.trigger);
        if (this.nativeInputMode === 'end' && this.nativeInput) {
            this.host.appendChild(this.nativeInput);
        }
        this.host.appendChild(this.menu);
        if (this.customInput) {
            this.host.appendChild(this.customInput);
        }

        this.trigger.addEventListener('click', this.onTriggerClick);
        this.menu.addEventListener('click', this.onOptionClick);
        this.nativeInput?.addEventListener('input', this.onNativeInput);
        this.customInput?.addEventListener('input', this.onCustomInput);
        document.addEventListener('click', this.onDocumentClick);

        this.insertBasicOptions();
        this.syncTrigger();
    }

    /**
     * Releases DOM/event resources owned by the control.
     */
    public destroy(): void {
        this.trigger.removeEventListener('click', this.onTriggerClick);
        this.menu.removeEventListener('click', this.onOptionClick);
        this.nativeInput?.removeEventListener('input', this.onNativeInput);
        this.customInput?.removeEventListener('input', this.onCustomInput);
        document.removeEventListener('click', this.onDocumentClick);
        this.host.innerHTML = '';
    }

    /**
     * Gets the currently selected color value.
     */
    public get value(): string {
        return this.selected;
    }

    /**
     * Sets the selected color value.
     */
    public set value(color: string) {
        this.selectColor(color);
    }

    /**
     * Manually adds a color option to the menu. This is useful when the color options are dynamic or not known upfront.
     * @param color The color value to add. Any web color or hexadecimal value including alpha channel.
     * @param label An optional label for the color option.
     */
    public addOption(color: string, label?: string): void {
        const option = this.buildOption(color, label);
        this.menu.appendChild(option);
        this.insertBasicOptions();
        this.syncSelectedOption();
    }

    /**
     * Manually adds multiple color options to the menu. This is useful when the color options are dynamic or not known upfront.
     * @param colors An array of color values or objects containing color and optional label.
     */
    public addOptions(colors: (string | ColorOptionInput)[]): void {
        colors.forEach((entry) => {
            if (typeof entry === 'string') {
                this.addOption(entry);
                return;
            }
            this.addOption(entry.color, entry.label);
        });
    }

    /**
     * Removes all color options from the menu, including the transparent 'clear' and custom options if present.
     * The menu will be left empty and the custom option will need to be re-added manually if desired.
     */
    public clearOptions(): void {
        this.menu.innerHTML = '';
        this.insertBasicOptions();
    }

    /**
     * Handles the click event on the trigger element. Opens or closes the menu based on its current state.
     */
    protected readonly onTriggerClick = (): void => {
        if (this.host.classList.contains(DEFAULT_CONFIG.openClassName)) {
            this.closeMenu();
            return;
        }
        this.openMenu();
    };

    /**
     * Handles the click event on the document. Closes the menu if the click is outside the host element.
     */
    protected readonly onDocumentClick = (event: Event): void => {
        const target = event.target as Node | null;
        if (target && !this.host.contains(target)) {
            this.closeMenu();
        }
    };

    /**
     * Handles the click event on a color option. Selects the color and closes the menu.
     */
    protected readonly onOptionClick = (event: Event): void => {
        const target = event.target as HTMLElement | null;
        const action = target?.closest<HTMLElement>('[data-action]');
        if (action?.dataset.action === 'custom') {
            this.customInputOpen();
            return;
        }

        const option = target?.closest<HTMLElement>('[data-color]');
        const color = option?.dataset.color;
        if (!color) {
            return;
        }

        this.selectColor(color);
        this.closeMenu();
    };

    /**
     * Handles the input event on the native color input. Selects the color without closing the menu.
     */
    protected readonly onNativeInput = (): void => {
        if (!this.nativeInput) {
            return;
        }
        this.selectColor(this.nativeInput.value);
    };

    /**
     * Handles the input event on the custom color input. Selects the color and closes the menu.
     */
    protected readonly onCustomInput = (): void => {
        if (!this.customInput) {
            return;
        }

        const picked = this.nativeInputValue(this.customInput.value);
        if (!this.hasOption(picked)) {
            this.addOption(picked, picked);
        }
        this.selectColor(picked);
        this.closeMenu();
    };

    /**
     * Selects a color and updates the UI accordingly.
     * @param color The color to select.
     */
    protected selectColor(color: string): void {
        this.selected = color;
        this.syncTrigger();
        this.syncSelectedOption();
        this.host.dispatchEvent(new CustomEvent('colorchange', { detail: color }));
    }

    /**
     * Builds a preset color option button for the dropdown menu.
     * @param color CSS color value for this option.
     * @param label Optional display label; defaults to the color value.
     * @returns The constructed option button element.
     */
    protected buildOption(color: string, label?: string): HTMLButtonElement {
        const option = document.createElement('button');
        option.type = 'button';
        setClasses(option, DEFAULT_CONFIG.optionClassName, this.config.optionClassName);
        option.setAttribute('role', 'option');
        option.dataset.color = color;

        if (this.config.showSwatch) {
            option.appendChild(this.createSwatch(color));
        }

        if (this.config.showLabel) {
            const text = document.createElement('span');
            setClasses(text, DEFAULT_CONFIG.labelClassName, this.config.labelClassName);
            text.textContent = label || this.displayColorLabel(color);
            option.appendChild(text);
        }

        return option;
    }

    /**
     * Builds the "custom" option button that opens the native color picker.
     * @returns The constructed custom option button element.
     */
    protected buildCustomOption(): HTMLButtonElement {
        const option = document.createElement('button');
        option.type = 'button';
        setClasses(
            option,
            DEFAULT_CONFIG.optionClassName,
            this.config.optionClassName,
            'color-preset-custom-option',
        );
        option.setAttribute('role', 'option');
        option.dataset.action = 'custom';
        option.dataset.fixed = 'true';

        if (this.config.showSwatch) {
            option.appendChild(this.createCustomSwatch());
        }

        if (this.config.showLabel) {
            const text = document.createElement('span');
            setClasses(text, DEFAULT_CONFIG.labelClassName, this.config.labelClassName);
            text.textContent = 'custom';
            option.appendChild(text);
        }

        return option;
    }

    /**
     * Creates a color swatch element with its background set to the given color.
     * @param color CSS color value to display in the swatch.
     * @returns The swatch div element.
     */
    protected createSwatch(color: string): HTMLDivElement {
        const swatch = document.createElement('div');
        setClasses(swatch, DEFAULT_CONFIG.swatchClassName, this.config.swatchClassName);
        swatch.style.background = this.colorStyleForSwatch(color);
        return swatch;
    }

    /**
     * Creates the multi-colour gradient swatch used for the custom-colour option.
     * @returns The swatch div element.
     */
    protected createCustomSwatch(): HTMLDivElement {
        const swatch = document.createElement('div');
        setClasses(swatch, DEFAULT_CONFIG.swatchClassName, this.config.swatchClassName);
        swatch.style.background = 'linear-gradient(90deg, #ff0000 0%, #00ff00 50%, #0000ff 100%)';
        return swatch;
    }

    /**
     * Returns the CSS background value to apply to a swatch element.
     * Transparent colors are rendered as a checkerboard pattern.
     * @param color CSS color string.
     * @returns The CSS background shorthand value.
     */
    protected colorStyleForSwatch(color: string): string {
        const lc = color.trim().toLowerCase();
        if (lc === 'transparent') {
            return CHECKER_CSS_PATTERN;
        }
        if (lc === 'inherit') {
            return 'linear-gradient(135deg, #e2e8f0 0%, #94a3b8 50%, #475569 100%)';
        }
        return color;
    }

    /**
     * Updates the trigger button's swatch, label, and native input to reflect the current selection.
     */
    protected syncTrigger(): void {
        if (this.triggerSwatch) {
            this.triggerSwatch.style.background = this.colorStyleForSwatch(this.selected);
        }
        if (this.triggerLabel) {
            this.triggerLabel.textContent = this.displayColorLabel(this.selected);
        }
        if (this.nativeInput) {
            this.nativeInput.value = this.nativeInputValue(this.selected);
        }
    }

    /**
     * Returns the human-readable label for a color, showing 'clear' for transparent.
     * @param color CSS color string.
     * @returns Display label string.
     */
    protected displayColorLabel(color: string): string {
        const lc = color.trim().toLowerCase();
        if (lc === 'transparent') return 'clear';
        if (lc === 'inherit') return 'inherit';
        return color;
    }

    /**
     * Converts a color to a 6-digit hex value accepted by native `<input type="color">`.
     * Falls back to a dark default when the color cannot be converted.
     * @param color CSS color string.
     * @returns A #rrggbb hex string.
     */
    protected nativeInputValue(color: string): string {
        const value = color.trim().toLowerCase();
        if (value === 'transparent' || value === 'inherit') {
            return '#111827';
        }
        const short = value.match(/^#([0-9a-f]{3})$/i);
        if (short) {
            const [r, g, b] = short[1]!.split('');
            return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
        }
        if (/^#[0-9a-f]{6}$/i.test(value)) {
            return value;
        }
        return '#111827';
    }

    /**
     * Normalises the `showNativeInput` config value into one of the four known placement modes.
     * @param value The raw config value.
     * @returns One of 'start', 'end', 'option', or 'none'.
     */
    protected resolveNativeInputMode(value: ColorSelectConfig['showNativeInput']): 'start' | 'end' | 'option' | 'none' {
        if (value === undefined) {
            return DEFAULT_CONFIG.showNativeInput;
        }
        if (value === 'start' || value === 'end' || value === 'option' || value === 'none') {
            return value;
        }
        return DEFAULT_CONFIG.showNativeInput;
    }

    /**
     * Triggers the custom color picker input, using `showPicker()` when available.
     */
    protected customInputOpen(): void {
        if (!this.customInput) {
            return;
        }
        this.customInput.value = this.nativeInputValue(this.selected);
        if ('showPicker' in this.customInput && typeof this.customInput.showPicker === 'function') {
            this.customInput.showPicker();
            return;
        }
        this.customInput.click();
    }

    /**
     * Rebuilds basic options in canonical order at the top of the menu: inherit, clear, custom.
     * Existing basic option elements are reused when possible to preserve listeners/state.
     */
    protected insertBasicOptions(): void {
        const inheritOption = this.menu.querySelector<HTMLElement>('[data-color="inherit"]');
        const clearOption = this.menu.querySelector<HTMLElement>('[data-color="transparent"]');
        const customOption = this.customOption;

        inheritOption?.remove();
        clearOption?.remove();
        customOption?.remove();

        const orderedBasics: HTMLElement[] = [];

        if (this.config.showInheritOption) {
            const option = inheritOption ?? this.buildOption('inherit', 'inherit');
            option.dataset.fixed = 'true';
            orderedBasics.push(option);
        }

        const clear = clearOption ?? this.buildOption('transparent', 'clear');
        clear.dataset.fixed = 'true';
        orderedBasics.push(clear);

        if (customOption) {
            customOption.dataset.fixed = 'true';
            orderedBasics.push(customOption);
        }

        for (let i = orderedBasics.length - 1; i >= 0; i -= 1) {
            this.menu.insertBefore(orderedBasics[i]!, this.menu.firstChild);
        }
    }

    /**
     * Returns true when a menu option matching the given color already exists.
     * @param color CSS color string to check.
     * @returns True when the option is present.
     */
    protected hasOption(color: string): boolean {
        const wanted = this.normalizeComparableColor(color);
        const options = this.menu.querySelectorAll<HTMLElement>('[data-color]');
        return Array.from(options).some((option) => this.normalizeComparableColor(option.dataset.color ?? '') === wanted);
    }

    /**
     * Normalises a CSS color string to a lowercase 6-digit hex so options can be compared reliably.
     * @param color CSS color string to normalise.
     * @returns Comparable lowercase color string.
     */
    protected normalizeComparableColor(color: string): string {
        const value = color.trim().toLowerCase();
        if (value === 'transparent' || value === 'inherit') {
            return value;
        }
        const short = value.match(/^#([0-9a-f]{3})$/i);
        if (short) {
            const [r, g, b] = short[1]!.split('');
            return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
        }
        return value;
    }

    /**
     * Toggles the selected CSS class and aria-selected attribute on all menu option buttons
     * to reflect the current selection.
     */
    protected syncSelectedOption(): void {
        const options = this.menu.querySelectorAll<HTMLElement>('[data-color]');
        options.forEach((option) => {
            const isSelected = option.dataset.color === this.selected;
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