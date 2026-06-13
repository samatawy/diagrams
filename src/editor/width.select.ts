export interface WidthSelectConfig {
    widths?: number[];
    strokeColor?: string;
    showLabel?: boolean;
    hostClassName?: string;
    triggerClassName?: string;
    menuClassName?: string;
    optionClassName?: string;
    swatchClassName?: string;
    labelClassName?: string;
    selectedClassName?: string;
    openClassName?: string;
}

const DEFAULT_WIDTHS: number[] = [1, 2, 3, 4, 5, 6, 7, 8];

const DEFAULT_CONFIG: Required<Omit<WidthSelectConfig, 'widths'>> & { widths: number[] } = {
    widths: DEFAULT_WIDTHS,
    strokeColor: '#1f2937',
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

const STYLE_ID = 'width-select-defaults';

const DEFAULT_STYLES = `
.line-width-control {
	position: relative;
	min-width: 90px;
	max-width: 130px;
}
.line-width-control .color-preset-trigger,
.line-width-control button[aria-haspopup='listbox'] {
	width: 100%;
	display: grid;
	grid-template-columns: 1fr auto auto;
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
.line-width-control .color-preset-trigger::after {
	content: '▾';
	font-size: 12px;
	color: #334155;
}
.line-width-control .color-preset-trigger:hover,
.line-width-control .color-preset-trigger:focus-visible,
.line-width-control button[aria-haspopup='listbox']:hover,
.line-width-control button[aria-haspopup='listbox']:focus-visible {
    border-color: rgba(15, 118, 110, 0.45);
}
.line-width-swatch {
	width: 100%;
	min-height: 20px;
	display: flex;
	align-items: center;
}
.line-width-swatch svg {
	width: 100%;
	display: block;
	overflow: visible;
}
.line-width-control .color-preset-label {
	font: 600 11px/1.1 'Helvetica Neue', Helvetica, Arial, sans-serif;
	color: #334155;
	text-transform: lowercase;
	justify-self: end;
}
.line-width-control .color-preset-menu {
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
	max-height: 220px;
	overflow: auto;
	box-shadow: 0 10px 24px rgba(15, 23, 42, 0.18);
}
.line-width-control.is-open .color-preset-menu {
	display: grid;
	gap: 6px;
}
.line-width-control .color-preset-option {
	width: 100%;
	display: grid;
	grid-template-columns: 1fr auto;
	align-items: center;
	gap: 8px;
	border: none;
	border-radius: 6px;
	background: transparent;
	padding: 4px 6px;
	cursor: pointer;
	font: inherit;
}
.line-width-control .color-preset-option:hover,
.line-width-control .color-preset-option.is-selected {
	background: rgba(15, 118, 110, 0.1);
}
`;

import { injectStyles, setClasses, toggleClasses, removeClasses } from './editor.utils';

function ensureDefaultStyles(): void {
    injectStyles(STYLE_ID, DEFAULT_STYLES);
}

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

export class WidthSelect {

    protected host: HTMLElement;

    protected config: Required<Omit<WidthSelectConfig, 'widths'>> & { widths: number[] };

    protected selected: number;

    protected trigger: HTMLButtonElement;

    protected triggerSwatch: HTMLDivElement;

    protected triggerLabel?: HTMLSpanElement;

    protected menu: HTMLDivElement;

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

    public destroy(): void {
        this.trigger.removeEventListener('click', this.onTriggerClick);
        this.menu.removeEventListener('click', this.onOptionClick);
        if (typeof document !== 'undefined') {
            document.removeEventListener('click', this.onDocumentClick);
        }
        this.host.innerHTML = '';
    }

    public get value(): number {
        return this.selected;
    }

    public set value(width: number) {
        this.selectWidth(width);
    }

    public setOptions(widths: number[], selectedWidth?: number): void {
        const normalized = normalizeWidths(widths);
        this.config.widths = normalized;
        this.rebuildOptions(normalized);
        this.selectWidth(selectedWidth || normalized[0] || 1, false);
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
        const option = target?.closest<HTMLElement>('[data-width]');
        const value = Number(option?.dataset.width);
        if (!Number.isFinite(value)) {
            return;
        }

        this.selectWidth(value);
        this.closeMenu();
    };

    protected rebuildOptions(widths: number[]): void {
        this.menu.innerHTML = '';
        for (const width of widths) {
            this.menu.appendChild(this.buildOption(width));
        }
        this.syncSelectedOption();
        this.syncTrigger();
    }

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

    protected syncTrigger(): void {
        this.triggerSwatch.innerHTML = '';
        this.triggerSwatch.appendChild(this.createWidthSvg(this.selected));
        if (this.triggerLabel) {
            this.triggerLabel.textContent = `${this.selected}px`;
        }
    }

    protected syncSelectedOption(): void {
        const options = this.menu.querySelectorAll<HTMLElement>('[data-width]');
        options.forEach((option) => {
            const isSelected = Number(option.dataset.width) === this.selected;
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
