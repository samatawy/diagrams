import { injectStyles, setClasses, toggleClasses, removeClasses } from '../editor.utils';

import DEFAULT_STYLES from '../../css_generated/editor/inputs/dash.select.css';
const STYLE_ID = 'dash-select-defaults';

function ensureDefaultStyles(): void {
    injectStyles(STYLE_ID, DEFAULT_STYLES);
}
/**
 * Supported named line-dash presets.
 */
export type DashPreset = 'solid' | 'dashed' | 'dotted' | 'dashdot';

/**
 * Allowed line-dash values.
 * - Named presets are easiest to persist and compare.
 * - Number arrays are supported for custom patterns.
 */
export type LineDashValue = DashPreset | number[];

/**
 * Configuration options for the DashSelect component.
 */
export interface DashSelectConfig {
    /**
     * Dash options shown in the dropdown.
     */
    dashes?: LineDashValue[];
    /**
     * Stroke color used by preview swatches.
     */
    strokeColor?: string;
    /**
     * Optional CSS class for the host element.
     */
    hostClassName?: string;
    /**
     * Optional CSS class for the trigger button.
     */
    triggerClassName?: string;
    /**
     * Optional CSS class for the dropdown menu.
     */
    menuClassName?: string;
    /**
     * Optional CSS class for each option element.
     */
    optionClassName?: string;
    /**
     * Optional CSS class for the swatch element.
     */
    swatchClassName?: string;
    /**
     * Optional CSS class for selected options.
     */
    selectedClassName?: string;
    /**
     * Optional CSS class when the menu is open.
     */
    openClassName?: string;
}

export type DashOption = {
    key: string;
    value: LineDashValue;
    dash: number[];
    label: string;
};

const PRESET_MAP: Record<DashPreset, number[]> = {
    solid: [],
    dashed: [10, 6],
    dotted: [2, 4],
    dashdot: [10, 4, 2, 4],
};

const DEFAULT_DASHES: LineDashValue[] = ['solid', 'dashed', 'dotted', 'dashdot'];

const DEFAULT_CONFIG: Required<Omit<DashSelectConfig, 'dashes'>> & { dashes: LineDashValue[] } = {
    dashes: DEFAULT_DASHES,
    strokeColor: 'var(--diagram-ui-text, #1f2937)',
    hostClassName: 'dash-select-control',
    triggerClassName: 'color-preset-trigger',
    menuClassName: 'color-preset-menu',
    optionClassName: 'color-preset-option',
    swatchClassName: 'dash-width-swatch',
    selectedClassName: 'is-selected',
    openClassName: 'is-open',
};

/**
 * A dropdown component for selecting line-dash presets.
 */
export class DashSelect {

    protected host: HTMLElement;

    protected config: Required<Omit<DashSelectConfig, 'dashes'>> & { dashes: LineDashValue[] };

    protected options: DashOption[] = [];

    protected selectedKey = 'solid';

    protected trigger: HTMLButtonElement;

    protected triggerSwatch: HTMLDivElement;

    protected menu: HTMLDivElement;

    constructor(target: HTMLElement, config: DashSelectConfig = {}) {
        ensureDefaultStyles();

        this.host = target;
        this.config = {
            ...DEFAULT_CONFIG,
            ...config,
            dashes: config.dashes || DEFAULT_CONFIG.dashes,
        };

        this.host.innerHTML = '';
        setClasses(this.host, 'dash-select-control', DEFAULT_CONFIG.hostClassName, this.config.hostClassName);

        this.trigger = document.createElement('button');
        this.trigger.type = 'button';
        setClasses(this.trigger, DEFAULT_CONFIG.triggerClassName, this.config.triggerClassName);
        this.trigger.setAttribute('aria-haspopup', 'listbox');
        this.trigger.setAttribute('aria-expanded', 'false');

        this.triggerSwatch = document.createElement('div');
        setClasses(this.triggerSwatch, DEFAULT_CONFIG.swatchClassName, this.config.swatchClassName);
        this.trigger.appendChild(this.triggerSwatch);

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

        this.rebuildOptions(this.config.dashes);
    }

    public destroy(): void {
        this.trigger.removeEventListener('click', this.onTriggerClick);
        this.menu.removeEventListener('click', this.onOptionClick);
        if (typeof document !== 'undefined') {
            document.removeEventListener('click', this.onDocumentClick);
        }
        this.host.innerHTML = '';
    }

    public get value(): LineDashValue {
        return this.currentValue();
    }

    public set value(value: LineDashValue) {
        this.selectDash(value);
    }

    public setOptions(dashes: LineDashValue[], selectedDash?: LineDashValue): void {
        this.config.dashes = dashes;
        this.rebuildOptions(dashes);
        this.selectDash(selectedDash ?? this.options[0]?.value ?? 'solid', false);
    }

    protected readonly onTriggerClick = (): void => {
        if (this.host.classList.contains(DEFAULT_CONFIG.openClassName)) {
            this.closeMenu();
            return;
        }
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
        const option = target?.closest<HTMLElement>('[data-dash]');
        const key = option?.dataset.dash;
        if (!key) {
            return;
        }
        const value = this.optionByKey(key)?.value;
        if (value === undefined) {
            return;
        }

        this.selectDash(value);
        this.closeMenu();
    };

    protected rebuildOptions(dashes: LineDashValue[]): void {
        this.options = this.toOptions(dashes);
        this.menu.innerHTML = '';

        for (const option of this.options) {
            this.menu.appendChild(this.buildOption(option));
        }

        this.selectedKey = this.options[0]?.key ?? 'solid';
        this.syncSelectedOption();
        this.syncTrigger();
    }

    protected buildOption(option: DashOption): HTMLButtonElement {
        const button = document.createElement('button');
        button.type = 'button';
        setClasses(button, DEFAULT_CONFIG.optionClassName, this.config.optionClassName);
        button.setAttribute('role', 'option');
        button.dataset.dash = option.key;

        const swatch = document.createElement('div');
        setClasses(swatch, DEFAULT_CONFIG.swatchClassName, this.config.swatchClassName);
        swatch.appendChild(this.createDashSvg(option.dash));
        button.appendChild(swatch);

        return button;
    }

    protected createDashSvg(dash: number[]): SVGElement {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', '0 0 100 20');
        svg.setAttribute('preserveAspectRatio', 'none');
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', '20');

        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', '10');
        line.setAttribute('y1', '10');
        line.setAttribute('x2', '90');
        line.setAttribute('y2', '10');
        line.setAttribute('stroke', this.config.strokeColor);
        line.setAttribute('stroke-width', '2');
        line.setAttribute('stroke-linecap', 'round');
        if (dash.length) {
            line.setAttribute('stroke-dasharray', dash.join(','));
        }

        svg.appendChild(line);
        return svg;
    }

    protected selectDash(value: LineDashValue, emit = true): void {
        const option = this.findOption(value) ?? this.options[0];
        if (!option) {
            return;
        }

        this.selectedKey = option.key;
        this.syncTrigger();
        this.syncSelectedOption();

        if (!emit) {
            return;
        }

        this.host.dispatchEvent(new CustomEvent<LineDashValue>('dashchange', { detail: option.value }));
    }

    protected currentValue(): LineDashValue {
        return this.optionByKey(this.selectedKey)?.value ?? 'solid';
    }

    protected syncTrigger(): void {
        this.triggerSwatch.innerHTML = '';
        const option = this.optionByKey(this.selectedKey);
        this.triggerSwatch.appendChild(this.createDashSvg(option?.dash ?? []));
    }

    protected syncSelectedOption(): void {
        const options = this.menu.querySelectorAll<HTMLElement>('[data-dash]');
        options.forEach((option) => {
            const isSelected = option.dataset.dash === this.selectedKey;
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

    private toOptions(values: LineDashValue[]): DashOption[] {
        const options: DashOption[] = [];
        const usedKeys = new Set<string>();

        for (let i = 0; i < values.length; i++) {
            const value = values[i]!;
            const normalized = this.normalize(value);
            const key = this.ensureUniqueKey(normalized.key, usedKeys);
            options.push({
                key,
                value: normalized.value,
                dash: normalized.dash,
                label: normalized.label,
            });
        }

        return options;
    }

    private normalize(value: LineDashValue): DashOption {
        if (Array.isArray(value)) {
            const dash = value
                .map((one) => Number(one))
                .filter((one) => Number.isFinite(one) && one >= 0);

            const key = `custom-${dash.join('-') || 'solid'}`;
            return {
                key,
                value: dash,
                dash,
                label: dash.length ? `[${dash.join(',')}]` : 'solid',
            };
        }

        const preset = this.normalizePreset(value);
        return {
            key: preset,
            value: preset,
            dash: [...PRESET_MAP[preset]],
            label: preset,
        };
    }

    private normalizePreset(value: unknown): DashPreset {
        if (value === 'solid' || value === 'dashed' || value === 'dotted' || value === 'dashdot') {
            return value;
        }
        return 'solid';
    }

    private ensureUniqueKey(key: string, used: Set<string>): string {
        if (!used.has(key)) {
            used.add(key);
            return key;
        }

        let index = 2;
        let next = `${key}-${index}`;
        while (used.has(next)) {
            index += 1;
            next = `${key}-${index}`;
        }

        used.add(next);
        return next;
    }

    private optionByKey(key: string): DashOption | undefined {
        return this.options.find((option) => option.key === key);
    }

    private findOption(value: LineDashValue): DashOption | undefined {
        if (Array.isArray(value)) {
            const normalized = this.normalize(value);
            return this.options.find((option) => this.sameDash(option.dash, normalized.dash));
        }

        const preset = this.normalizePreset(value);
        return this.options.find((option) => typeof option.value === 'string' && option.value === preset);
    }

    private sameDash(a: number[], b: number[]): boolean {
        if (a.length !== b.length) {
            return false;
        }
        for (let i = 0; i < a.length; i++) {
            if (a[i] !== b[i]) {
                return false;
            }
        }
        return true;
    }
}
