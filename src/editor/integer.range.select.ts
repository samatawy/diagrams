/**
 * Configuration options for the IntegerRangeSelect control.
 */
export interface IntegerRangeSelectConfig {
    min?: number;
    max?: number;
    step?: number;
    value?: number;
    unit?: string;
    hostClassName?: string;
    trackClassName?: string;
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

const STYLE_ID = 'integer-range-select-defaults';

const DEFAULT_STYLES = `
.integer-range-select {
    min-width: 116px;
    display: inline-flex;
    align-items: center;
    gap: var(--diagram-ui-control-gap, 6px);
}
.integer-range-select .integer-range-select-track {
    width: 84px;
    accent-color: var(--diagram-ui-accent, #0f766e);
}
.integer-range-select .integer-range-select-track:disabled {
    opacity: 0.4;
    cursor: not-allowed;
}
.integer-range-select .integer-range-select-value {
    min-width: 28px;
    text-align: right;
    font: 600 var(--diagram-ui-label-font-size, 11px)/1.2 var(--diagram-ui-font-family, 'Helvetica Neue', Helvetica, Arial, sans-serif);
    color: var(--diagram-ui-text-muted, #334155);
}
.integer-range-select--disabled .integer-range-select-value {
    opacity: 0.4;
}
`;

import { injectStyles, setClasses } from './editor.utils';

function ensureDefaultStyles(): void {
    injectStyles(STYLE_ID, DEFAULT_STYLES);
}

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

    protected readonly onInput = (): void => {
        this.selected = this.clamp(Number(this.input.value));
        this.input.value = String(this.selected);
        this.syncDisplay();
    };

    protected readonly onChange = (): void => {
        this.selected = this.clamp(Number(this.input.value));
        this.input.value = String(this.selected);
        this.syncDisplay();
        this.host.dispatchEvent(new CustomEvent<number>('valuechange', { detail: this.selected }));
    };

    protected syncDisplay(): void {
        this.valueText.textContent = `${this.selected}${this.config.unit}`;
    }

    protected clamp(value: number): number {
        const rounded = Number.isFinite(value) ? Math.round(value) : this.config.min;
        const bounded = Math.min(this.config.max, Math.max(this.config.min, rounded));
        return bounded;
    }
}
