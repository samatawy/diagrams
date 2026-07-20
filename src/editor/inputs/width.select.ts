import { injectStyles, setClasses, toggleClasses, removeClasses } from '../editor.utils';

import DEFAULT_STYLES from '../../css_generated/editor/inputs/width.select.css';
const STYLE_ID = 'width-select-defaults';

function ensureDefaultStyles(): void {
    injectStyles(STYLE_ID, DEFAULT_STYLES);
}

/**
 * Configuration options for the WidthSelect component.
 */
export interface WidthSelectConfig {
    /**
     * An array of predefined widths to display in the dropdown. Each width should be a positive number.
     * If not provided, a default set of widths will be used.
     */
    widths?: number[];
    /**
     * The stroke color to use for the width swatch in the dropdown and trigger button.
     */
    strokeColor?: string;
    /**
     * Indicates whether to show the width label (e.g., "1px", "2px") next to the swatch in the trigger button and options.
     */
    showLabel?: boolean;
    /**
     * Optional CSS class name to apply to the host element of the WidthSelect component. This allows for custom styling of the component.
     */
    hostClassName?: string;
    /**
     * Optional CSS class name to apply to the trigger button of the WidthSelect component. This allows for custom styling of the trigger button.
     */
    triggerClassName?: string;
    /**
     * Optional CSS class name to apply to the dropdown menu of the WidthSelect component. This allows for custom styling of the dropdown menu.
     */
    menuClassName?: string;
    /**
     * Optional CSS class name to apply to each option in the dropdown menu. This allows for custom styling of the options.
     */
    optionClassName?: string;
    /**
     * Optional CSS class name to apply to the swatch element of the WidthSelect component. This allows for custom styling of the swatch.
     */
    swatchClassName?: string;
    /**
     * Optional CSS class name to apply to the label element of the WidthSelect component. This allows for custom styling of the label.
     */
    labelClassName?: string;
    /**
     * Optional CSS class name to apply to the selected option of the WidthSelect component. This allows for custom styling of the selected option.
     */
    selectedClassName?: string;
    /**
     * Optional CSS class name to apply when the WidthSelect component is open. This allows for custom styling when the component is open.
     */
    openClassName?: string;
}

const DEFAULT_WIDTHS: number[] = [1, 2, 3, 4, 5, 6, 7, 8];

const DEFAULT_CONFIG: Required<Omit<WidthSelectConfig, 'widths'>> & { widths: number[] } = {
    widths: DEFAULT_WIDTHS,
    strokeColor: 'var(--diagram-ui-text, #1f2937)',
    showLabel: true,
    hostClassName: 'line-width-control',
    triggerClassName: 'color-preset-trigger',
    menuClassName: 'color-preset-menu',
    optionClassName: 'color-preset-option',
    swatchClassName: 'line-width-swatch',
    labelClassName: 'color-preset-label',
    selectedClassName: 'is-selected',
    openClassName: 'is-open',
};

/**
 * Normalizes width values by filtering invalid entries, rounding, and removing duplicates.
 * @param widths Candidate width values.
 * @returns A non-empty normalized width list.
 */
function normalizeWidths(widths: number[]): number[] {
    const seen = new Set<number>();
    const normalized: number[] = [];

    for (const width of widths) {
        if (!Number.isFinite(width)) {
            continue;
        }
        const value = Math.max(1, Math.round(width));
        if (seen.has(value)) {
            continue;
        }
        seen.add(value);
        normalized.push(value);
    }

    return normalized.length ? normalized : [...DEFAULT_WIDTHS];
}

/**
 * A dropdown component for selecting line widths.
 * It displays a list of predefined widths and allows the user to select one.
 * The selected width is reflected in the trigger button and can be accessed via the `value` property.
 * The component emits a 'widthchange' event when the selected width changes.
 */
export class WidthSelect {

    protected host: HTMLElement;

    protected config: Required<Omit<WidthSelectConfig, 'widths'>> & { widths: number[] };

    protected selected: number;

    protected trigger: HTMLButtonElement;

    protected triggerSwatch: HTMLDivElement;

    protected triggerLabel?: HTMLSpanElement;

    protected menu: HTMLDivElement;

    /**
     * Creates a WidthSelect component inside the given element.
     * @param target The host element that will contain the width picker.
     * @param config Optional display and behaviour configuration.
     */
    constructor(target: HTMLElement, config: WidthSelectConfig = {}) {
        ensureDefaultStyles();

        this.host = target;
        this.config = {
            ...DEFAULT_CONFIG,
            ...config,
            widths: normalizeWidths(config.widths || DEFAULT_CONFIG.widths),
        };
        this.selected = this.config.widths[0] || 1;

        this.host.innerHTML = '';
        setClasses(this.host, 'color-preset-control', DEFAULT_CONFIG.hostClassName, this.config.hostClassName);

        this.trigger = document.createElement('button');
        this.trigger.type = 'button';
        setClasses(this.trigger, DEFAULT_CONFIG.triggerClassName, this.config.triggerClassName);
        this.trigger.setAttribute('aria-haspopup', 'listbox');
        this.trigger.setAttribute('aria-expanded', 'false');

        this.triggerSwatch = document.createElement('div');
        setClasses(this.triggerSwatch, DEFAULT_CONFIG.swatchClassName, this.config.swatchClassName);
        this.trigger.appendChild(this.triggerSwatch);

        if (this.config.showLabel) {
            this.triggerLabel = document.createElement('span');
            setClasses(this.triggerLabel, DEFAULT_CONFIG.labelClassName, this.config.labelClassName);
            this.trigger.appendChild(this.triggerLabel);
        }

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

        this.rebuildOptions(this.config.widths);
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
     * Gets the currently selected width value.
     */
    public get value(): number {
        return this.selected;
    }

    /**
     * Sets the currently selected width value.
     */
    public set value(width: number) {
        this.selectWidth(width);
    }

    /**
     * Sets the available width options and optionally selects a width.
     * @param widths - An array of widths.
     * @param selectedWidth - The width to select. Defaults to the first width in the array.
     */
    public setOptions(widths: number[], selectedWidth?: number): void {
        const normalized = normalizeWidths(widths);
        this.config.widths = normalized;
        this.rebuildOptions(normalized);
        this.selectWidth(selectedWidth || normalized[0] || 1, false);
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
     * Handles the click event on an option. Selects the clicked width and closes the dropdown menu.
     * @param event - The click event.
     */
    protected readonly onOptionClick = (event: Event): void => {
        const target = event.target as HTMLElement | null;
        const option = target?.closest<HTMLElement>('[data-width]');
        const value = Number(option?.dataset.width);
        if (!Number.isFinite(value)) {
            return;
        }

        this.selectWidth(value);
        this.closeMenu();
    };

    /**
     * Replaces the current option list with a new set of widths.
     * @param widths The pixel-width values to render.
     */
    protected rebuildOptions(widths: number[]): void {
        this.menu.innerHTML = '';
        for (const width of widths) {
            this.menu.appendChild(this.buildOption(width));
        }
        this.syncSelectedOption();
        this.syncTrigger();
    }

    /**
     * Builds a single option button containing an SVG stroke-width preview.
     * @param width The pixel width value for this option.
     * @returns The constructed option button element.
     */
    protected buildOption(width: number): HTMLButtonElement {
        const option = document.createElement('button');
        option.type = 'button';
        setClasses(option, DEFAULT_CONFIG.optionClassName, this.config.optionClassName);
        option.setAttribute('role', 'option');
        option.dataset.width = String(width);

        const swatch = document.createElement('div');
        setClasses(swatch, DEFAULT_CONFIG.swatchClassName, this.config.swatchClassName);
        swatch.appendChild(this.createWidthSvg(width));
        option.appendChild(swatch);

        if (this.config.showLabel) {
            const label = document.createElement('span');
            setClasses(label, DEFAULT_CONFIG.labelClassName, this.config.labelClassName);
            label.textContent = `${width}px`;
            option.appendChild(label);
        }

        return option;
    }

    /**
     * Creates an SVG element visualising a horizontal line at the given stroke width.
     * @param width The stroke width in pixels.
     * @returns The SVG element.
     */
    protected createWidthSvg(width: number): SVGElement {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', '20');

        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', '4');
        line.setAttribute('y1', '10');
        line.setAttribute('x2', '96%');
        line.setAttribute('y2', '10');
        line.setAttribute('stroke', this.config.strokeColor);
        line.setAttribute('stroke-width', String(width));
        line.setAttribute('stroke-linecap', 'round');

        svg.appendChild(line);
        return svg;
    }

    /**
     * Updates the internal selection state, syncs the trigger and option list, and optionally emits 'widthchange'.
     * @param width The new width value to select.
     * @param emit Whether to dispatch the change event. Defaults to true.
     */
    protected selectWidth(width: number, emit = true): void {
        const next = Math.max(1, Math.round(width));
        this.selected = next;
        this.syncTrigger();
        this.syncSelectedOption();

        if (!emit) {
            return;
        }
        this.host.dispatchEvent(new CustomEvent<number>('widthchange', { detail: next }));
    }

    /**
     * Updates the trigger button's swatch and optional label to reflect the current width.
     */
    protected syncTrigger(): void {
        this.triggerSwatch.innerHTML = '';
        this.triggerSwatch.appendChild(this.createWidthSvg(this.selected));
        if (this.triggerLabel) {
            this.triggerLabel.textContent = `${this.selected}px`;
        }
    }

    /**
     * Toggles the selected CSS class and aria-selected attribute on all width option buttons.
     */
    protected syncSelectedOption(): void {
        const options = this.menu.querySelectorAll<HTMLElement>('[data-width]');
        options.forEach((option) => {
            const isSelected = Number(option.dataset.width) === this.selected;
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
