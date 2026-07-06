
import { injectStyles, setClasses, toggleClasses, removeClasses } from '../editor.utils';

import DEFAULT_STYLES from '../../css_generated/editor/inputs/size.select.css';
const STYLE_ID = 'size-select-defaults';

function ensureDefaultStyles(): void {
    injectStyles(STYLE_ID, DEFAULT_STYLES);
}

/**
 * Configuration options for the SizeSelect control.
 * Provide only the properties you want to customize. All other properties will use default values.
 */
export interface SizeSelectConfig {
    /**
     * Optional array of sizes to display in the dropdown. If not provided, a default set of sizes will be used.
     */
    sizes?: number[];
    /**
     * Optional unit to display next to the size values (e.g., 'px', 'pt'). Defaults to 'px'.
     */
    unit?: string;
    /**
     * Whether to show the unit label next to the size values. Defaults to true.
     */
    showLabel?: boolean;
    /**
     * Optional CSS class name to apply to the host element of the SizeSelect control. This allows for custom styling.
     */
    hostClassName?: string;
    /**
     * Optional CSS class name to apply to the trigger button of the SizeSelect control. This allows for custom styling.
     */
    triggerClassName?: string;
    /**
     * Optional CSS class name to apply to the dropdown menu of the SizeSelect control. This allows for custom styling.
     */
    menuClassName?: string;
    /**
     * Optional CSS class name to apply to each option in the dropdown menu. This allows for custom styling.
     */
    optionClassName?: string;
    /**
     * Optional CSS class name to apply to the preview element that shows the selected size. This allows for custom styling.
     */
    previewClassName?: string;
    /**
     * Optional CSS class name to apply to the label element that shows the unit. This allows for custom styling.
     */
    labelClassName?: string;
    /**
     * Optional CSS class name to apply to the selected option. This allows for custom styling.
     */
    selectedClassName?: string;
    /**
     * Optional CSS class name to apply when the dropdown is open. This allows for custom styling.
     */
    openClassName?: string;
}

export const DEFAULT_SIZES: number[] = [6, 7, 8, 9, 10, 12, 14, 16, 18, 20, 24, 28, 32, 40];

const DEFAULT_CONFIG: Required<Omit<SizeSelectConfig, 'sizes'>> & { sizes: number[] } = {
    sizes: DEFAULT_SIZES,
    unit: 'px',
    showLabel: true,
    hostClassName: 'size-select-control',
    triggerClassName: 'size-select-trigger',
    menuClassName: 'size-select-menu',
    optionClassName: 'size-select-option',
    previewClassName: 'size-select-preview',
    labelClassName: 'size-select-label',
    selectedClassName: 'is-selected',
    openClassName: 'is-open',
};

/**
 * Normalizes size values by filtering invalid entries, rounding, and removing duplicates.
 * @param sizes Candidate size values.
 * @returns A non-empty normalized size list.
 */
function normalizeSizes(sizes: number[]): number[] {
    const seen = new Set<number>();
    const result: number[] = [];
    for (const s of sizes) {
        if (!Number.isFinite(s) || s <= 0) {
            continue;
        }
        const v = Math.round(s);
        if (!seen.has(v)) {
            seen.add(v);
            result.push(v);
        }
    }
    return result.length ? result : [...DEFAULT_SIZES];
}

/**
 * A dropdown control for selecting sizes (e.g., font sizes, line widths).
 * Emits a 'sizechange' event when the selected size changes.
 * Example usage:
 * const sizeSelect = new SizeSelect(document.getElementById('size-select'), {
 * sizes: [8, 10, 12, 14, 16, 18, 20],
 * unit: 'px',
 * showLabel: true,
 * });
 */
export class SizeSelect {

    protected host: HTMLElement;

    protected config: Required<Omit<SizeSelectConfig, 'sizes'>> & { sizes: number[] };

    protected selected: number;

    protected trigger: HTMLButtonElement;

    protected triggerPreview: HTMLSpanElement;

    protected menu: HTMLDivElement;

    /**
     * Creates a SizeSelect component inside the given element.
     * @param target The host element that will contain the size picker.
     * @param config Optional display and behaviour configuration.
     */
    constructor(target: HTMLElement, config: SizeSelectConfig = {}) {
        ensureDefaultStyles();

        this.host = target;
        this.config = {
            ...DEFAULT_CONFIG,
            ...config,
            sizes: normalizeSizes(config.sizes || DEFAULT_CONFIG.sizes),
        };
        this.selected = this.config.sizes[0] || 16;

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

        this.rebuildOptions(this.config.sizes);
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
     * Gets the currently selected size value.
     */
    public get value(): number {
        return this.selected;
    }

    /**
     * Sets the currently selected size value.
     */
    public set value(size: number) {
        this.selectSize(size, false);
    }

    /**
     * Sets the available size options and optionally selects a size.
     * @param sizes - An array of sizes.
     * @param selectedSize - The size to select. Defaults to the first size in the array.
     */
    public setOptions(sizes: number[], selectedSize?: number): void {
        const normalized = normalizeSizes(sizes);
        this.config.sizes = normalized;
        this.rebuildOptions(normalized);
        this.selectSize(selectedSize || normalized[0] || 16, false);
    }

    /**
     * Handles the click event on the trigger button. Toggles the open/closed state of the dropdown menu.
     */
    protected readonly onTriggerClick = (): void => {
        if (this.host.classList.contains(DEFAULT_CONFIG.openClassName)) {
            this.closeMenu();
            return;
        }
        this.openMenu();
    };

    /**
     * Handles the click event on the document. Closes the dropdown menu if the click is outside the host element.
     * @param event - The click event.
     */
    protected readonly onDocumentClick = (event: Event): void => {
        const target = event.target as Node | null;
        if (target && !this.host.contains(target)) {
            this.closeMenu();
        }
    };

    /**
     * Handles the click event on an option. Selects the clicked size and closes the dropdown menu.
     * @param event - The click event.
     */
    protected readonly onOptionClick = (event: Event): void => {
        const target = event.target as HTMLElement | null;
        const option = target?.closest<HTMLElement>('[data-size]');
        const value = Number(option?.dataset.size);
        if (!Number.isFinite(value) || value <= 0) {
            return;
        }
        this.selectSize(value);
        this.closeMenu();
    };

    /**
     * Replaces the current option list with a new set of size values.
     * @param sizes The numeric size values to render.
     */
    protected rebuildOptions(sizes: number[]): void {
        this.menu.innerHTML = '';
        for (const size of sizes) {
            this.menu.appendChild(this.buildOption(size));
        }
        this.syncSelectedOption();
        this.syncTrigger();
    }

    /**
     * Builds a single option button with a size preview and optional unit label.
     * @param size The numeric size value for this option.
     * @returns The constructed option button element.
     */
    protected buildOption(size: number): HTMLButtonElement {
        const option = document.createElement('button');
        option.type = 'button';
        setClasses(option, DEFAULT_CONFIG.optionClassName, this.config.optionClassName);
        option.setAttribute('role', 'option');
        option.dataset.size = String(size);

        const preview = document.createElement('span');
        setClasses(preview, DEFAULT_CONFIG.previewClassName, this.config.previewClassName);
        preview.textContent = String(size);
        option.appendChild(preview);

        if (this.config.showLabel && this.config.unit) {
            const unit = document.createElement('span');
            setClasses(unit, DEFAULT_CONFIG.labelClassName, this.config.labelClassName);
            unit.textContent = this.config.unit;
            option.appendChild(unit);
        }

        return option;
    }

    /**
     * Updates the internal selection state, syncs the trigger and option list, and optionally emits 'sizechange'.
     * @param size The new size value to select.
     * @param emit Whether to dispatch the change event. Defaults to true.
     */
    protected selectSize(size: number, emit = true): void {
        this.selected = Math.round(size);
        this.syncTrigger();
        this.syncSelectedOption();
        if (emit) {
            this.host.dispatchEvent(new CustomEvent<number>('sizechange', { detail: this.selected }));
        }
    }

    /**
     * Updates the trigger button's preview text to the current size with its unit suffix.
     */
    protected syncTrigger(): void {
        this.triggerPreview.textContent = `${this.selected}${this.config.unit}`;
    }

    /**
     * Toggles the selected CSS class and aria-selected attribute on all size option buttons.
     */
    protected syncSelectedOption(): void {
        const options = this.menu.querySelectorAll<HTMLElement>('[data-size]');
        options.forEach((option) => {
            const isSelected = Number(option.dataset.size) === this.selected;
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
