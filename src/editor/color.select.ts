import { injectStyles, setClasses, toggleClasses, removeClasses } from './editor.utils';

/**
 * Configuration options for the ColorSelect control.
 * Provide only the properties you want to override; defaults will be used for the rest.
 */
export interface ColorSelectConfig {
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
    showSwatch: true,
    showLabel: true,
    showNativeInput: 'option',
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

const STYLE_ID = 'color-select-defaults';

const DEFAULT_STYLES = `
.color-preset-control {
    position: relative;
    min-width: 132px;
}
.color-preset-control.with-native-input {
    display: grid;
    grid-template-columns: 34px minmax(0, 1fr);
    align-items: center;
    gap: 0;
    min-width: 172px;
    border: var(--diagram-ui-border-width, 1px) solid var(--diagram-ui-border, rgba(15, 23, 42, 0.15));
    border-radius: var(--diagram-ui-control-radius, 10px);
    background: var(--diagram-ui-surface, rgba(255, 255, 255, 0.88));
}
.color-preset-control.with-native-input.native-end {
    grid-template-columns: minmax(0, 1fr) 34px;
}
.color-preset-control.with-native-input:hover,
.color-preset-control.with-native-input:focus-within {
    border-color: var(--diagram-ui-border-strong, rgba(15, 118, 110, 0.45));
}
.color-preset-trigger,
.color-preset-control button[aria-haspopup='listbox'] {
    width: 100%;
    display: grid;
    grid-template-columns: 1fr auto auto;
    align-items: center;
    gap: var(--diagram-ui-control-gap, 8px);
    padding: var(--diagram-ui-control-padding-y, 6px) var(--diagram-ui-control-padding-x, 8px);
    cursor: pointer;
    appearance: none;
    border: var(--diagram-ui-border-width, 1px) solid var(--diagram-ui-border, rgba(15, 23, 42, 0.15));
    border-radius: var(--diagram-ui-control-radius, 10px);
    background: var(--diagram-ui-surface, rgba(255, 255, 255, 0.88));
    color: var(--diagram-ui-text, #1f2937);
    font: 600 var(--diagram-ui-font-size, 12px)/1.2 var(--diagram-ui-font-family, system-ui);
}
.color-preset-trigger::after {
    content: '▾';
    font-size: var(--diagram-ui-font-size, 12px);
    color: var(--diagram-ui-text-muted, #334155);
}
.color-preset-trigger:hover,
.color-preset-trigger:focus-visible,
.color-preset-control button[aria-haspopup='listbox']:hover,
.color-preset-control button[aria-haspopup='listbox']:focus-visible {
    border-color: var(--diagram-ui-border-strong, rgba(15, 118, 110, 0.45));
}
.color-preset-swatch {
    width: 100%;
    min-height: 18px;
    border-radius: 5px;
}
.color-preset-trigger .color-preset-swatch {
    border: var(--diagram-ui-border-width, 1px) solid var(--diagram-ui-border, rgba(15, 23, 42, 0.2));
}
.color-preset-label {
    font: 600 var(--diagram-ui-label-font-size, 11px)/1.1 var(--diagram-ui-font-family, system-ui);
    color: var(--diagram-ui-text-muted, #334155);
    text-transform: lowercase;
    justify-self: end;
}
.color-preset-menu {
    position: absolute;
    left: 0;
    right: 0;
    top: calc(100% + var(--diagram-ui-control-gap, 6px));
    z-index: 40;
    border: var(--diagram-ui-border-width, 1px) solid var(--diagram-ui-border, rgba(15, 23, 42, 0.15));
    border-radius: var(--diagram-ui-panel-radius, 10px);
    background: var(--diagram-ui-surface-elevated, #ffffff);
    padding: var(--diagram-ui-panel-padding, 6px);
    display: none;
    max-height: 220px;
    overflow: auto;
    box-shadow: 0 10px 24px var(--diagram-ui-shadow-color, rgba(15, 23, 42, 0.18));
}
.color-preset-control.is-open .color-preset-menu {
    display: grid;
    gap: var(--diagram-ui-group-gap, 6px);
}
.color-preset-control.with-native-input.native-end .color-preset-menu {
    right: 40px;
}
.color-preset-control.with-native-input.native-start .color-preset-menu {
    left: 40px;
}
.color-preset-option {
    width: 100%;
    display: grid;
    grid-template-columns: 1fr auto;
    align-items: center;
    gap: var(--diagram-ui-group-gap, 8px);
    border: none;
    border-radius: var(--diagram-ui-control-radius, 6px);
    background: transparent;
    padding: var(--diagram-ui-group-gap, 4px) var(--diagram-ui-control-padding-x, 6px);
    cursor: pointer;
    font: inherit;
}
.color-preset-option:hover,
.color-preset-option.is-selected {
    background: var(--diagram-ui-hover-bg, rgba(15, 118, 110, 0.1));
}
.color-preset-custom-option {
    text-transform: lowercase;
}
.color-preset-custom-option .color-preset-swatch {
    background: linear-gradient(90deg, #ff0000 0%, #00ff00 50%, #0000ff 100%);
    border: var(--diagram-ui-border-width, 1px) solid var(--diagram-ui-border, rgba(15, 23, 42, 0.16));
}
.color-preset-native-input {
    border: var(--diagram-ui-border-width, 1px) solid var(--diagram-ui-border, rgba(15, 23, 42, 0.15));
    border-radius: var(--diagram-ui-control-radius, 10px);
    background: var(--diagram-ui-surface, rgba(255, 255, 255, 0.88));
    color: var(--diagram-ui-text, #1f2937);
    width: 34px;
    height: 32px;
    padding: 2px;
    display: block;
    overflow: hidden;
    cursor: pointer;
}
.color-preset-control.with-native-input .color-preset-trigger,
.color-preset-control.with-native-input button[aria-haspopup='listbox'] {
    border: none;
    border-radius: 0;
    background: transparent;
}
.color-preset-control.with-native-input .color-preset-trigger:hover,
.color-preset-control.with-native-input .color-preset-trigger:focus-visible,
.color-preset-control.with-native-input button[aria-haspopup='listbox']:hover,
.color-preset-control.with-native-input button[aria-haspopup='listbox']:focus-visible {
    border-color: transparent;
}
.color-preset-control.with-native-input .color-preset-native-input {
    border: none;
    border-radius: 0;
    background: transparent;
    width: 34px;
    height: 32px;
    padding: 5px;
}
.color-preset-control.with-native-input.native-start .color-preset-native-input {
    border-right: var(--diagram-ui-border-width, 1px) solid var(--diagram-ui-border, rgba(15, 23, 42, 0.12));
}
.color-preset-control.with-native-input.native-end .color-preset-native-input {
    border-left: var(--diagram-ui-border-width, 1px) solid var(--diagram-ui-border, rgba(15, 23, 42, 0.12));
}
.color-preset-native-input:hover,
.color-preset-native-input:focus-visible {
    border-color: var(--diagram-ui-border-strong, rgba(15, 118, 110, 0.45));
}
.color-preset-native-input::-webkit-color-swatch-wrapper {
    padding: 1px;
}
.color-preset-native-input::-webkit-color-swatch {
    border: none;
    border-radius: var(--diagram-ui-control-radius, 6px);
}
.color-preset-native-input::-moz-color-swatch {
    border: none;
    border-radius: var(--diagram-ui-control-radius, 6px);
}
`;

function ensureDefaultStyles(): void {
    injectStyles(STYLE_ID, DEFAULT_STYLES);
}

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

        this.placeCustomOption();
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
        if (this.customOption && this.customOption.parentElement === this.menu) {
            this.menu.insertBefore(option, this.customOption);
        } else {
            this.menu.appendChild(option);
        }
        this.placeCustomOption();
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
        this.placeTransparentOption();
        this.placeCustomOption();
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

    protected createSwatch(color: string): HTMLDivElement {
        const swatch = document.createElement('div');
        setClasses(swatch, DEFAULT_CONFIG.swatchClassName, this.config.swatchClassName);
        swatch.style.background = this.colorStyleForSwatch(color);
        return swatch;
    }

    protected createCustomSwatch(): HTMLDivElement {
        const swatch = document.createElement('div');
        setClasses(swatch, DEFAULT_CONFIG.swatchClassName, this.config.swatchClassName);
        swatch.style.background = 'linear-gradient(90deg, #ff0000 0%, #00ff00 50%, #0000ff 100%)';
        return swatch;
    }

    protected colorStyleForSwatch(color: string): string {
        if (color.trim().toLowerCase() === 'transparent') {
            return 'repeating-linear-gradient(45deg, #f8fafc, #f8fafc 6px, #e2e8f0 6px, #e2e8f0 12px)';
        }
        return color;
    }

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

    protected displayColorLabel(color: string): string {
        return color.trim().toLowerCase() === 'transparent' ? 'clear' : color;
    }

    protected nativeInputValue(color: string): string {
        const value = color.trim().toLowerCase();
        if (value === 'transparent') {
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

    protected resolveNativeInputMode(value: ColorSelectConfig['showNativeInput']): 'start' | 'end' | 'option' | 'none' {
        if (value === undefined) {
            return DEFAULT_CONFIG.showNativeInput;
        }
        if (value === 'start' || value === 'end' || value === 'option' || value === 'none') {
            return value;
        }
        return DEFAULT_CONFIG.showNativeInput;
    }

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

    protected placeCustomOption(): void {
        if (!this.customOption) {
            return;
        }

        const clearOption = this.menu.querySelector<HTMLElement>('[data-color="transparent"]');
        if (clearOption && clearOption.nextSibling) {
            this.menu.insertBefore(this.customOption, clearOption.nextSibling);
        } else if (clearOption) {
            this.menu.appendChild(this.customOption);
        } else {
            this.menu.appendChild(this.customOption);
        }

        // const afterColor = this.normalizeComparableColor('transparent');
        // const options = Array.from(this.menu.querySelectorAll<HTMLElement>('[data-color]'));
        // const anchor = options.find((option) => this.normalizeComparableColor(option.dataset.color ?? '') === afterColor);
        // if (anchor && anchor.nextSibling) {
        //     this.menu.insertBefore(this.customOption, anchor.nextSibling);
        //     return;
        // }
        // this.menu.appendChild(this.customOption);
    }

    protected placeTransparentOption(): void {
        const transparentColor = 'transparent';
        if (this.hasOption(transparentColor)) {
            return;
        }
        const option = this.buildOption(transparentColor, 'clear');
        this.menu.insertBefore(option, this.menu.firstChild);
    }

    protected hasOption(color: string): boolean {
        const wanted = this.normalizeComparableColor(color);
        const options = this.menu.querySelectorAll<HTMLElement>('[data-color]');
        return Array.from(options).some((option) => this.normalizeComparableColor(option.dataset.color ?? '') === wanted);
    }

    protected normalizeComparableColor(color: string): string {
        const value = color.trim().toLowerCase();
        if (value === 'transparent') {
            return value;
        }
        const short = value.match(/^#([0-9a-f]{3})$/i);
        if (short) {
            const [r, g, b] = short[1]!.split('');
            return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
        }
        return value;
    }

    protected syncSelectedOption(): void {
        const options = this.menu.querySelectorAll<HTMLElement>('[data-color]');
        options.forEach((option) => {
            const isSelected = option.dataset.color === this.selected;
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