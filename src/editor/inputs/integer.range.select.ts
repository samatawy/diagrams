import { injectStyles, setClasses } from '../editor.utils';

import DEFAULT_STYLES from '../../css_generated/editor/inputs/integer.range.select.css';
const STYLE_ID = 'integer-range-select-defaults';

function ensureDefaultStyles(): void {
    injectStyles(STYLE_ID, DEFAULT_STYLES);
}

/**
 * Configuration options for the IntegerRangeSelect control.
 */
export interface IntegerRangeSelectConfig {
    /**
     * Minimum allowed slider value.
     */
    min?: number;
    /**
     * Maximum allowed slider value.
     */
    max?: number;
    /**
     * Slider increment step; normalized to a positive integer internally.
     */
    step?: number;
    /**
     * Initial slider value used during construction.
     */
    value?: number;
    /**
     * Optional text unit suffix shown next to the numeric value (for example, 'px').
     */
    unit?: string;
    /**
     * Optional CSS class for the host element.
     */
    hostClassName?: string;
    /**
     * Optional CSS class for the native range input element.
     */
    trackClassName?: string;
    /**
     * Optional CSS class for the value text element.
     */
    valueClassName?: string;
}

const DEFAULT_CONFIG: Required<IntegerRangeSelectConfig> = {
    min: 0,
    max: 100,
    step: 1,
    value: 0,
    unit: '',
    hostClassName: 'integer-range-select',
    trackClassName: 'integer-range-select-track',
    valueClassName: 'integer-range-select-value',
};

/**
 * A compact integer range selector based on native input[type=range].
 * Emits a 'valuechange' event when the slider change is committed.
 */
export class IntegerRangeSelect {
    protected host: HTMLElement;

    protected config: Required<IntegerRangeSelectConfig>;

    protected input: HTMLInputElement;

    protected valueText: HTMLSpanElement;

    protected selected: number;

    /**
     * Creates an IntegerRangeSelect component inside the given element.
     * @param target The host element that will contain the range slider.
     * @param config Optional range bounds and display configuration.
     */
    constructor(target: HTMLElement, config: IntegerRangeSelectConfig = {}) {
        ensureDefaultStyles();

        this.host = target;
        this.config = {
            ...DEFAULT_CONFIG,
            ...config,
        };

        this.selected = this.clamp(this.config.value);

        this.host.innerHTML = '';
        setClasses(this.host, DEFAULT_CONFIG.hostClassName, this.config.hostClassName);

        this.input = document.createElement('input');
        this.input.type = 'range';
        this.input.min = String(this.config.min);
        this.input.max = String(this.config.max);
        this.input.step = String(Math.max(1, Math.round(this.config.step)));
        this.input.value = String(this.selected);
        setClasses(this.input, DEFAULT_CONFIG.trackClassName, this.config.trackClassName);

        this.valueText = document.createElement('span');
        setClasses(this.valueText, DEFAULT_CONFIG.valueClassName, this.config.valueClassName);

        this.host.appendChild(this.valueText);
        this.host.appendChild(this.input);

        this.input.addEventListener('input', this.onInput);
        this.input.addEventListener('change', this.onChange);

        this.syncDisplay();
    }

    /**
     * Releases DOM/event resources owned by the control.
     */
    public destroy(): void {
        this.input.removeEventListener('input', this.onInput);
        this.input.removeEventListener('change', this.onChange);
        this.host.innerHTML = '';
    }

    /**
     * Gets the currently selected integer value.
     */
    public get value(): number {
        return this.selected;
    }

    /**
     * Sets the currently selected integer value.
     */
    public set value(value: number) {
        this.selected = this.clamp(value);
        this.input.value = String(this.selected);
        this.syncDisplay();
    }

    /**
     * Gets whether the control is disabled.
     */
    public get disabled(): boolean {
        return this.input.disabled;
    }

    /**
     * Disables or enables the control.
     */
    public set disabled(value: boolean) {
        this.input.disabled = value;
        if (value) {
            this.host.classList.add('integer-range-select--disabled');
        } else {
            this.host.classList.remove('integer-range-select--disabled');
        }
    }

    /**
     * Updates the selectable range and optional current value.
     */
    public setRange(min: number, max: number, step: number = 1, value?: number): void {
        this.config.min = Math.round(min);
        this.config.max = Math.round(max);
        this.config.step = Math.max(1, Math.round(step));

        this.input.min = String(this.config.min);
        this.input.max = String(this.config.max);
        this.input.step = String(this.config.step);

        this.value = value ?? this.selected;
    }

    /**
     * Fires on every `input` event to keep the display in sync while dragging.
     */
    protected readonly onInput = (): void => {
        this.selected = this.clamp(Number(this.input.value));
        this.input.value = String(this.selected);
        this.syncDisplay();
    };

    /**
     * Fires on the `change` event when the user releases the slider, and emits 'valuechange'.
     */
    protected readonly onChange = (): void => {
        this.selected = this.clamp(Number(this.input.value));
        this.input.value = String(this.selected);
        this.syncDisplay();
        this.host.dispatchEvent(new CustomEvent<number>('valuechange', { detail: this.selected }));
    };

    /**
     * Updates the visible value text element to reflect the current selection.
     */
    protected syncDisplay(): void {
        this.valueText.textContent = `${this.selected}${this.config.unit}`;
    }

    /**
     * Clamps and rounds a raw number to the configured min/max range.
     * @param value The raw value to clamp.
     * @returns The clamped integer value.
     */
    protected clamp(value: number): number {
        const rounded = Number.isFinite(value) ? Math.round(value) : this.config.min;
        const bounded = Math.min(this.config.max, Math.max(this.config.min, rounded));
        return bounded;
    }
}
