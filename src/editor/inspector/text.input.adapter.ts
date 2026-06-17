import { InspectorAdapter, type EditableRecord, type InspectorAdapterInit } from "./inspector.adapter";

export class TextInputAdapter extends InspectorAdapter {

    private readonly input: HTMLInputElement;

    constructor(cell: HTMLElement, mixedClassName: string, initial: InspectorAdapterInit) {
        super(cell, mixedClassName);
        this.input = document.createElement('input');
        this.input.type = 'text';
        this.input.readOnly = initial.readonly;
        cell.appendChild(this.input);
        this.input.addEventListener('input', () => this.notifyChange(this.input.value));
    }

    override showValue(editable: EditableRecord): void {
        const { key, value } = this.extractValueFrom(editable);
        this.returnKey = key;
        this.setUnset(value === undefined || value === null);
        this.input.value = value !== undefined && value !== null ? String(value) : '';
        this.input.placeholder = '';
    }

    override getValue(): EditableRecord {
        return { [this.returnKey ?? '']: this.input.value };
    }

    override setMixed(mixed: boolean): void {
        super.setMixed(mixed);
        if (mixed) {
            this.input.value = '';
            this.input.placeholder = 'Multiple';
        } else {
            this.input.placeholder = '';
        }
    }
}
