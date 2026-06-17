import { InspectorAdapter, type EditableRecord, type InspectorAdapterInit } from "./inspector.adapter";

/**
 * Inspector adapter for boolean properties rendered as checkboxes.
 */
export class CheckboxAdapter extends InspectorAdapter {

    private readonly input: HTMLInputElement;

    constructor(cell: HTMLElement, mixedClassName: string, initial: InspectorAdapterInit) {
        super(cell, mixedClassName);
        this.input = document.createElement('input');
        this.input.type = 'checkbox';
        this.input.disabled = initial.readonly;
        cell.appendChild(this.input);
        this.input.addEventListener('change', () => this.notifyChange(this.input.checked));
    }

    override showValue(editable: EditableRecord): void {
        const { key, value } = this.extractValueFrom(editable);
        this.returnKey = key;
        this.setUnset(value === undefined || value === null);
        this.input.indeterminate = false;
        this.input.checked = Boolean(value);
    }

    override getValue(): EditableRecord {
        return { [this.returnKey ?? '']: this.input.checked };
    }

    override setMixed(mixed: boolean): void {
        super.setMixed(mixed);
        this.input.indeterminate = mixed;
        if (mixed) {
            this.input.checked = false;
        }
    }
}
