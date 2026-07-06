import { injectStyles, removeClasses, setClasses, toggleClasses } from '../editor.utils';

import DEFAULT_STYLES from '../../css_generated/editor/inputs/enum.select.css';
const STYLE_ID = 'enum-select-defaults';

function ensureDefaultStyles(): void {
    injectStyles(STYLE_ID, DEFAULT_STYLES);
}

export type EnumSelectOption<T> = { value: T; label?: string };

export interface EnumSelectConfig<T> {
    options: EnumSelectOption<T>[];
    equals?: (left: T, right: T) => boolean;
    hostClassName?: string;
    triggerClassName?: string;
    menuClassName?: string;
    optionClassName?: string;
    selectedClassName?: string;
    openClassName?: string;
    disabled?: boolean;
    placeholder?: string;
}

const DEFAULT_CONFIG: Required<Omit<EnumSelectConfig<unknown>, 'options' | 'equals'>> = {
    hostClassName: 'enum-select-control',
    triggerClassName: 'color-preset-trigger',
    menuClassName: 'color-preset-menu',
    optionClassName: 'color-preset-option',
    selectedClassName: 'is-selected',
    openClassName: 'is-open',
    disabled: false,
    placeholder: '',
};

export const ENUM_SELECT_CHANGE_EVENT = 'enumchange';

export class EnumSelect<T> {

    protected readonly host: HTMLElement;
    protected readonly trigger: HTMLButtonElement;
    protected readonly menu: HTMLDivElement;
    protected options: EnumSelectOption<T>[] = [];
    protected _value: T | undefined;
    protected readonly equals: (left: T, right: T) => boolean;
    protected readonly classes: Required<Omit<EnumSelectConfig<T>, 'options' | 'equals'>>;

    constructor(target: HTMLElement, config: EnumSelectConfig<T>) {
        ensureDefaultStyles();

        this.host = target;
        this.equals = config.equals || ((left, right) => left === right);
        this.classes = {
            ...DEFAULT_CONFIG,
            ...config,
        };

        this.host.innerHTML = '';
        setClasses(this.host, DEFAULT_CONFIG.hostClassName, this.classes.hostClassName);

        this.trigger = document.createElement('button');
        this.trigger.type = 'button';
        setClasses(this.trigger, DEFAULT_CONFIG.triggerClassName, this.classes.triggerClassName);
        this.trigger.setAttribute('aria-haspopup', 'listbox');
        this.trigger.setAttribute('aria-expanded', 'false');

        this.menu = document.createElement('div');
        setClasses(this.menu, DEFAULT_CONFIG.menuClassName, this.classes.menuClassName);
        this.menu.setAttribute('role', 'listbox');

        this.host.appendChild(this.trigger);
        this.host.appendChild(this.menu);

        this.setOptions(config.options);
        this.disabled = !!config.disabled;

        this.trigger.addEventListener('click', this.onTriggerClick);
        this.menu.addEventListener('click', this.onOptionClick);
        document.addEventListener('click', this.onDocumentClick);

        this.syncTriggerLabel();
    }

    public get value(): T | undefined {
        return this._value;
    }

    public set value(next: T | undefined) {
        this._value = next;
        this.syncOptions();
        this.syncTriggerLabel();
    }

    public get disabled(): boolean {
        return this.host.classList.contains('is-disabled');
    }

    public set disabled(value: boolean) {
        toggleClasses(this.host, value, 'is-disabled');
    }

    public setOptions(options: EnumSelectOption<T>[]): void {
        this.options = [...options];
        this.renderOptions();
        this.syncOptions();
        this.syncTriggerLabel();
    }

    public destroy(): void {
        this.trigger.removeEventListener('click', this.onTriggerClick);
        this.menu.removeEventListener('click', this.onOptionClick);
        document.removeEventListener('click', this.onDocumentClick);
        this.host.innerHTML = '';
    }

    protected readonly onTriggerClick = (): void => {
        this.host.classList.contains(this.classes.openClassName) ? this.closeMenu() : this.openMenu();
    };

    protected readonly onDocumentClick = (event: Event): void => {
        if (!this.host.contains(event.target as Node)) {
            this.closeMenu();
        }
    };

    protected readonly onOptionClick = (event: Event): void => {
        const optionEl = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-option-index]');
        if (!optionEl) return;

        const index = Number(optionEl.dataset['optionIndex']);
        if (!Number.isFinite(index) || index < 0 || index >= this.options.length) return;

        const selected = this.options[index]!.value;
        const changed = this._value === undefined || !this.equals(this._value, selected);
        this._value = selected;
        this.syncOptions();
        this.syncTriggerLabel();
        this.closeMenu();

        if (changed) {
            this.host.dispatchEvent(new CustomEvent<T>(ENUM_SELECT_CHANGE_EVENT, {
                bubbles: true,
                detail: selected,
            }));
        }
    };

    protected openMenu(): void {
        toggleClasses(this.host, true, this.classes.openClassName);
        this.trigger.setAttribute('aria-expanded', 'true');
    }

    protected closeMenu(): void {
        removeClasses(this.host, this.classes.openClassName);
        this.trigger.setAttribute('aria-expanded', 'false');
    }

    protected renderOptions(): void {
        this.menu.innerHTML = '';
        for (let i = 0; i < this.options.length; i++) {
            const option = this.options[i]!;
            const button = document.createElement('button');
            button.type = 'button';
            button.setAttribute('role', 'option');
            button.dataset['optionIndex'] = String(i);
            setClasses(button, DEFAULT_CONFIG.optionClassName, this.classes.optionClassName);
            button.textContent = option.label ?? String(option.value);
            this.menu.appendChild(button);
        }
    }

    protected syncOptions(): void {
        const optionEls = this.menu.querySelectorAll<HTMLButtonElement>('[data-option-index]');
        for (const optionEl of optionEls) {
            const index = Number(optionEl.dataset['optionIndex']);
            const option = Number.isFinite(index) ? this.options[index] : undefined;
            const selected = option ? (this._value !== undefined && this.equals(this._value, option.value)) : false;
            toggleClasses(optionEl, !!selected, this.classes.selectedClassName);
            optionEl.setAttribute('aria-selected', String(!!selected));
        }
    }

    protected syncTriggerLabel(): void {
        const selected = this.options.find((option) => this._value !== undefined && this.equals(this._value, option.value));
        this.trigger.textContent = selected ? (selected.label ?? String(selected.value)) : (this.classes.placeholder || '\u00A0');
    }
}
