export interface SizeSelectConfig {
    sizes?: number[];
    unit?: string;
    showLabel?: boolean;
    hostClassName?: string;
    triggerClassName?: string;
    menuClassName?: string;
    optionClassName?: string;
    previewClassName?: string;
    labelClassName?: string;
    selectedClassName?: string;
    openClassName?: string;
}

export const DEFAULT_SIZES: number[] = [10, 12, 14, 16, 18, 20, 24, 28, 32, 40];

const DEFAULT_CONFIG: Required<Omit<SizeSelectConfig, 'sizes'>> & { sizes: number[] } = {
    sizes: DEFAULT_SIZES,
    unit: 'px',
    showLabel: true,
    hostClassName: 'size-select-control',
    triggerClassName: 'color-preset-trigger',
    menuClassName: 'color-preset-menu',
    optionClassName: 'color-preset-option',
    previewClassName: 'size-select-preview',
    labelClassName: 'color-preset-label',
    selectedClassName: 'is-selected',
    openClassName: 'is-open',
};

const STYLE_ID = 'size-select-defaults';

const DEFAULT_STYLES = `
.size-select-control {
    position: relative;
    min-width: 72px;
    max-width: 100px;
}
.size-select-control .color-preset-trigger,
.size-select-control button[aria-haspopup='listbox'] {
    width: 100%;
    display: grid;
    grid-template-columns: 1fr auto;
    align-items: center;
    gap: 6px;
    padding: 6px 8px;
    cursor: pointer;
    appearance: none;
    border: 1px solid rgba(15, 23, 42, 0.15);
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.88);
    color: #1f2937;
    font: 600 12px/1.2 'Helvetica Neue', Helvetica, Arial, sans-serif;
}
.size-select-control .color-preset-trigger::after {
    content: '▾';
    font-size: 12px;
    color: #334155;
}
.size-select-control .color-preset-trigger:hover,
.size-select-control .color-preset-trigger:focus-visible,
.size-select-control button[aria-haspopup='listbox']:hover,
.size-select-control button[aria-haspopup='listbox']:focus-visible {
    border-color: rgba(15, 118, 110, 0.45);
}
.size-select-preview {
    font: 600 12px/1.2 'Helvetica Neue', Helvetica, Arial, sans-serif;
    color: #1f2937;
    white-space: nowrap;
}
.size-select-control .color-preset-menu {
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
.size-select-control.is-open .color-preset-menu {
    display: grid;
    gap: 4px;
}
.size-select-control .color-preset-option {
    width: 100%;
    display: grid;
    grid-template-columns: 1fr auto;
    align-items: center;
    gap: 8px;
    border: none;
    border-radius: 6px;
    background: transparent;
    padding: 4px 8px;
    cursor: pointer;
    font: inherit;
    text-align: left;
}
.size-select-control .color-preset-option:hover,
.size-select-control .color-preset-option.is-selected {
    background: rgba(15, 118, 110, 0.1);
}
`;

import { injectStyles, setClasses, toggleClasses, removeClasses } from './editor.utils';

function ensureDefaultStyles(): void {
    injectStyles(STYLE_ID, DEFAULT_STYLES);
}

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

export class SizeSelect {

    protected host: HTMLElement;

    protected config: Required<Omit<SizeSelectConfig, 'sizes'>> & { sizes: number[] };

    protected selected: number;

    protected trigger: HTMLButtonElement;

    protected triggerPreview: HTMLSpanElement;

    protected menu: HTMLDivElement;

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

    public set value(size: number) {
        this.selectSize(size, false);
    }

    public setOptions(sizes: number[], selectedSize?: number): void {
        const normalized = normalizeSizes(sizes);
        this.config.sizes = normalized;
        this.rebuildOptions(normalized);
        this.selectSize(selectedSize || normalized[0] || 16, false);
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
        const option = target?.closest<HTMLElement>('[data-size]');
        const value = Number(option?.dataset.size);
        if (!Number.isFinite(value) || value <= 0) {
            return;
        }
        this.selectSize(value);
        this.closeMenu();
    };

    protected rebuildOptions(sizes: number[]): void {
        this.menu.innerHTML = '';
        for (const size of sizes) {
            this.menu.appendChild(this.buildOption(size));
        }
        this.syncSelectedOption();
        this.syncTrigger();
    }

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

    protected selectSize(size: number, emit = true): void {
        this.selected = Math.round(size);
        this.syncTrigger();
        this.syncSelectedOption();
        if (emit) {
            this.host.dispatchEvent(new CustomEvent<number>('sizechange', { detail: this.selected }));
        }
    }

    protected syncTrigger(): void {
        this.triggerPreview.textContent = `${this.selected}${this.config.unit}`;
    }

    protected syncSelectedOption(): void {
        const options = this.menu.querySelectorAll<HTMLElement>('[data-size]');
        options.forEach((option) => {
            const isSelected = Number(option.dataset.size) === this.selected;
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
