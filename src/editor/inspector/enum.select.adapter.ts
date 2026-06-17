import type { InspectorAdapterInit, EditableRecord } from "./inspector";
import { InspectorAdapter } from "./inspector";

export type EnumSelectOption = string | { value: string; label?: string };

export interface EnumSelectAdapterConfig {
    options: EnumSelectOption[];
    placeholder?: string;
}

export class EnumSelectAdapter extends InspectorAdapter {

    private readonly host: HTMLDivElement;
    private readonly trigger: HTMLButtonElement;
    private readonly menu: HTMLDivElement;
    private readonly options: Array<{ value: string; label: string }>;
    private value: string = '';
    private isOpen: boolean = false;
    private readonly onDocumentPointerDown: (event: PointerEvent) => void;

    constructor(cell: HTMLElement, mixedClassName: string, initial: InspectorAdapterInit) {
        super(cell, mixedClassName);

        const cfg = (initial.def.editorOptions as EnumSelectAdapterConfig | undefined) || { options: [] };
        this.options = (cfg.options || []).map((option) => {
            if (typeof option === 'string') {
                return { value: option, label: option };
            }
            return { value: option.value, label: option.label || option.value };
        });

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

        for (const option of this.options) {
            const el = document.createElement('button');
            el.type = 'button';
            el.className = 'color-preset-option';
            el.dataset['value'] = option.value;
            el.textContent = option.label;
            el.addEventListener('click', () => this.selectValue(option.value));
            this.menu.appendChild(el);
        }

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
        this.value = value !== undefined && value !== null ? String(value) : '';
        this.syncOptionSelection();
        this.updateTriggerLabel();
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

    private syncOptionSelection(): void {
        const options = this.menu.querySelectorAll<HTMLButtonElement>('.color-preset-option');
        for (const option of options) {
            const isSelected = (option.dataset['value'] || '') === this.value;
            option.classList.toggle('is-selected', isSelected);
            option.setAttribute('aria-selected', String(isSelected));
        }
    }

    private updateTriggerLabel(): void {
        const selected = this.options.find((option) => option.value === this.value);
        this.trigger.textContent = selected ? selected.label : (this.value || '\u00A0');
    }
}
