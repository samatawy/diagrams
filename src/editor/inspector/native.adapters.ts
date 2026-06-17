import type { InspectorAdapterClass } from "./inspector";
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

export class NumberInputAdapter extends InspectorAdapter {

    private readonly input: HTMLInputElement;

    constructor(cell: HTMLElement, mixedClassName: string, initial: InspectorAdapterInit) {
        super(cell, mixedClassName);
        this.cell.classList.add('has-number-editor');
        this.input = document.createElement('input');
        this.input.type = 'number';
        this.input.readOnly = initial.readonly;
        cell.appendChild(this.input);
        this.input.addEventListener('input', () => {
            const parsed = Number(this.input.value);
            if (this.input.value === '') {
                this.notifyChange(undefined);
                return;
            }
            if (Number.isFinite(parsed)) {
                this.notifyChange(parsed);
            }
        });
    }

    override showValue(editable: EditableRecord): void {
        const { key, value } = this.extractValueFrom(editable);
        this.returnKey = key;
        this.setUnset(value === undefined || value === null);
        this.input.value = value !== undefined && value !== null ? String(value) : '';
        this.input.placeholder = '';
    }

    override getValue(): EditableRecord {
        const parsed = Number(this.input.value);
        return { [this.returnKey ?? '']: Number.isFinite(parsed) ? parsed : undefined };
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

export function registerNativeInspectorAdapters(registerAdapter: (name: string, adapterClass: InspectorAdapterClass) => void) {
    registerAdapter('string', TextInputAdapter);
    registerAdapter('text', TextInputAdapter);
    registerAdapter('number', NumberInputAdapter);
    registerAdapter('boolean', CheckboxAdapter);
}

export const DefaultInspectorAdapter = TextInputAdapter;
