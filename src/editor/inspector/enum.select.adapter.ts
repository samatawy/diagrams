import type { InspectorAdapterInit, EditableRecord } from "./inspector";
import { InspectorAdapter } from "./inspector";

export type EnumSelectOption = string | { value: string; label?: string };

/**
 * Configuration options for EnumSelectAdapter.
 */
export interface EnumSelectAdapterConfig {
    /**
     * Allowed option values, with optional display labels.
     * May be a static array or a zero-argument factory called on every refresh,
     * which lets the inspector narrow the list based on the current selection.
     */
    options: EnumSelectOption[] | (() => EnumSelectOption[]);
    /**
     * Optional placeholder text when no value is selected.
     */
    placeholder?: string;
}

/**
 * Inspector adapter for constrained string values rendered as a dropdown menu.
 */
export class EnumSelectAdapter extends InspectorAdapter {

    private readonly host: HTMLDivElement;
    private readonly trigger: HTMLButtonElement;
    private readonly menu: HTMLDivElement;
    private readonly allOptions: Array<{ value: string; label: string }>;
    private readonly optionsFn: (() => Array<{ value: string; label: string }>) | null;
    private currentOptions: Array<{ value: string; label: string }> = [];
    private value: string = '';
    private isOpen: boolean = false;
    private readonly onDocumentPointerDown: (event: PointerEvent) => void;

    constructor(cell: HTMLElement, mixedClassName: string, initial: InspectorAdapterInit) {
        super(cell, mixedClassName);

        const cfg = (initial.def.editorOptions as EnumSelectAdapterConfig | undefined) || { options: [] };
        const rawOptions = cfg.options;
        const mapOptions = (opts: EnumSelectOption[]) =>
            opts.map((option) => {
                if (typeof option === 'string') return { value: option, label: option };
                return { value: option.value, label: option.label || option.value };
            });

        if (typeof rawOptions === 'function') {
            this.optionsFn = () => mapOptions(rawOptions());
            this.allOptions = mapOptions(rawOptions());
        } else {
            this.optionsFn = null;
            this.allOptions = mapOptions(rawOptions);
        }

        this.currentOptions = [...this.allOptions];

        this.host = document.createElement('div');
        this.host.className = 'enum-select-control';
        this.host.style.position = 'relative';
        this.host.style.width = '100%';

        this.trigger = document.createElement('button');
        this.trigger.type = 'button';
        this.trigger.className = 'color-preset-trigger';
        this.trigger.disabled = initial.readonly;
        this.trigger.style.width = '100%';
        this.trigger.style.justifyContent = 'space-between';
        this.trigger.addEventListener('click', () => {
            this.setOpen(!this.isOpen);
        });

        this.menu = document.createElement('div');
        this.menu.className = 'color-preset-menu';
        this.menu.style.position = 'absolute';
        this.menu.style.insetInlineStart = '0';
        this.menu.style.insetBlockStart = 'calc(100% + 4px)';
        this.menu.style.minWidth = '100%';
        this.menu.style.display = 'none';
        this.menu.style.zIndex = '20';

        this.renderOptions();

        this.host.appendChild(this.trigger);
        this.host.appendChild(this.menu);
        cell.appendChild(this.host);

        this.onDocumentPointerDown = (event: PointerEvent) => {
            const target = event.target as Node | null;
            if (target && !this.host.contains(target)) {
                this.setOpen(false);
            }
        };
        document.addEventListener('pointerdown', this.onDocumentPointerDown);

        this.updateTriggerLabel();
    }

    override showValue(editable: EditableRecord): void {
        const { key, value } = this.extractValueFrom(editable);
        this.returnKey = key;
        this.refreshOptions();
        this.value = value !== undefined && value !== null ? String(value) : '';
        this.syncOptionSelection();
        this.updateTriggerLabel();
    }

    public refreshOptions(): void {
        const next = this.optionsFn ? this.optionsFn() : this.allOptions;
        this.currentOptions = [...next];
        this.renderOptions();
    }

    override getValue(): EditableRecord {
        return { [this.returnKey ?? '']: this.value };
    }

    override destroy(): void {
        super.destroy();
        document.removeEventListener('pointerdown', this.onDocumentPointerDown);
    }

    private setOpen(open: boolean): void {
        this.isOpen = open;
        this.menu.style.display = open ? 'flex' : 'none';
        this.menu.style.flexDirection = 'column';
        this.trigger.setAttribute('aria-expanded', String(open));
    }

    private selectValue(value: string): void {
        this.value = value;
        this.syncOptionSelection();
        this.updateTriggerLabel();
        this.notifyChange(this.value);
        this.setOpen(false);
    }

    private renderOptions(): void {
        this.menu.innerHTML = '';
        for (const option of this.currentOptions) {
            const el = document.createElement('button');
            el.type = 'button';
            el.className = 'color-preset-option';
            el.dataset['value'] = option.value;
            el.textContent = option.label;
            el.addEventListener('click', () => this.selectValue(option.value));
            this.menu.appendChild(el);
        }
    }

    private syncOptionSelection(): void {
        const options = this.menu.querySelectorAll<HTMLButtonElement>('.color-preset-option');
        for (const option of options) {
            const isSelected = (option.dataset['value'] || '') === this.value;
            option.classList.toggle('is-selected', isSelected);
            option.setAttribute('aria-selected', String(isSelected));
        }
    }

    private updateTriggerLabel(): void {
        const selected = this.currentOptions.find((option) => option.value === this.value)
            || this.allOptions.find((option) => option.value === this.value);
        this.trigger.textContent = selected ? selected.label : (this.value || '\u00A0');
    }
}
