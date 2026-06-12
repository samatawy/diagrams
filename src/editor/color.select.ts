export interface ColorSelectConfig {
    showSwatch?: boolean;
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

export interface ColorOptionInput {
    color: string;
    label?: string;
}

const DEFAULT_CONFIG: Required<ColorSelectConfig> = {
    showSwatch: true,
    showLabel: true,
    hostClassName: 'color-preset-control',
    triggerClassName: 'color-preset-trigger',
    menuClassName: 'color-preset-menu',
    optionClassName: 'color-preset-option',
    swatchClassName: 'color-preset-swatch',
    labelClassName: 'color-preset-label',
    selectedClassName: 'is-selected',
    openClassName: 'is-open',
};

const STYLE_ID = 'color-select-defaults';

const DEFAULT_STYLES = `
.color-preset-control {
    position: relative;
    min-width: 132px;
}
.color-preset-trigger {
    width: 100%;
    display: grid;
    grid-template-columns: 1fr auto auto;
    align-items: center;
    gap: 8px;
    padding: 6px 8px;
    cursor: pointer;
    border: none;
    background: transparent;
    font: inherit;
}
.color-preset-trigger::after {
    content: '▾';
    font-size: 12px;
    color: #334155;
}
.color-preset-swatch {
    width: 100%;
    min-height: 18px;
    border-radius: 5px;
}
.color-preset-trigger .color-preset-swatch {
    border: 1px solid rgba(15, 23, 42, 0.2);
}
.color-preset-label {
    font: 600 11px/1.1 'Helvetica Neue', Helvetica, Arial, sans-serif;
    color: #334155;
    text-transform: lowercase;
    justify-self: end;
}
.color-preset-menu {
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
.color-preset-control.is-open .color-preset-menu {
    display: grid;
    gap: 6px;
}
.color-preset-option {
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
.color-preset-option:hover,
.color-preset-option.is-selected {
    background: rgba(15, 118, 110, 0.1);
}
`;

function ensureDefaultStyles(): void {
    if (typeof document === 'undefined' || document.getElementById(STYLE_ID)) {
        return;
    }
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = DEFAULT_STYLES;
    document.head.appendChild(style);
}

export class ColorSelect {

    protected host: HTMLElement;

    protected selected = '#000000';

    protected config: Required<ColorSelectConfig>;

    protected trigger: HTMLButtonElement;

    protected triggerSwatch?: HTMLDivElement;

    protected triggerLabel?: HTMLSpanElement;

    protected menu: HTMLDivElement;

    constructor(target: HTMLElement, config: ColorSelectConfig = {}) {
        ensureDefaultStyles();
        this.host = target;
        this.config = { ...DEFAULT_CONFIG, ...config };

        this.host.innerHTML = '';
        this.host.classList.add(this.config.hostClassName);

        this.trigger = document.createElement('button');
        this.trigger.type = 'button';
        this.trigger.className = this.config.triggerClassName;
        this.trigger.setAttribute('aria-haspopup', 'listbox');
        this.trigger.setAttribute('aria-expanded', 'false');

        if (this.config.showSwatch) {
            this.triggerSwatch = this.createSwatch(this.selected);
            this.trigger.appendChild(this.triggerSwatch);
        }

        if (this.config.showLabel) {
            this.triggerLabel = document.createElement('span');
            this.triggerLabel.className = this.config.labelClassName;
            this.trigger.appendChild(this.triggerLabel);
        }

        this.menu = document.createElement('div');
        this.menu.className = this.config.menuClassName;
        this.menu.setAttribute('role', 'listbox');

        this.host.appendChild(this.trigger);
        this.host.appendChild(this.menu);

        this.trigger.addEventListener('click', this.onTriggerClick);
        this.menu.addEventListener('click', this.onOptionClick);
        document.addEventListener('click', this.onDocumentClick);

        this.syncTrigger();
    }

    public destroy(): void {
        this.trigger.removeEventListener('click', this.onTriggerClick);
        this.menu.removeEventListener('click', this.onOptionClick);
        document.removeEventListener('click', this.onDocumentClick);
        this.host.innerHTML = '';
    }

    public get value(): string {
        return this.selected;
    }

    public set value(color: string) {
        this.selectColor(color);
    }

    public addOption(color: string, label?: string): void {
        this.menu.appendChild(this.buildOption(color, label));
        this.syncSelectedOption();
    }

    public addOptions(colors: (string | ColorOptionInput)[]): void {
        colors.forEach((entry) => {
            if (typeof entry === 'string') {
                this.addOption(entry);
                return;
            }
            this.addOption(entry.color, entry.label);
        });
    }

    public clearOptions(): void {
        this.menu.innerHTML = '';
    }

    protected readonly onTriggerClick = (): void => {
        if (this.host.classList.contains(this.config.openClassName)) {
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
        const option = target?.closest<HTMLElement>('[data-color]');
        const color = option?.dataset.color;
        if (!color) {
            return;
        }

        this.selectColor(color);
        this.closeMenu();
    };

    protected selectColor(color: string): void {
        this.selected = color;
        this.syncTrigger();
        this.syncSelectedOption();
        this.host.dispatchEvent(new CustomEvent('colorchange', { detail: color }));
    }

    protected buildOption(color: string, label?: string): HTMLButtonElement {
        const option = document.createElement('button');
        option.type = 'button';
        option.className = this.config.optionClassName;
        option.setAttribute('role', 'option');
        option.dataset.color = color;

        if (this.config.showSwatch) {
            option.appendChild(this.createSwatch(color));
        }

        if (this.config.showLabel) {
            const text = document.createElement('span');
            text.className = this.config.labelClassName;
            text.textContent = label || color;
            option.appendChild(text);
        }

        return option;
    }

    protected createSwatch(color: string): HTMLDivElement {
        const swatch = document.createElement('div');
        swatch.className = this.config.swatchClassName;
        swatch.style.background = this.colorStyleForSwatch(color);
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
            this.triggerLabel.textContent = this.selected;
        }
    }

    protected syncSelectedOption(): void {
        const options = this.menu.querySelectorAll<HTMLElement>('[data-color]');
        options.forEach((option) => {
            const isSelected = option.dataset.color === this.selected;
            option.classList.toggle(this.config.selectedClassName, isSelected);
            option.setAttribute('aria-selected', String(isSelected));
        });
    }

    protected openMenu(): void {
        this.host.classList.add(this.config.openClassName);
        this.trigger.setAttribute('aria-expanded', 'true');
    }

    protected closeMenu(): void {
        this.host.classList.remove(this.config.openClassName);
        this.trigger.setAttribute('aria-expanded', 'false');
    }
}