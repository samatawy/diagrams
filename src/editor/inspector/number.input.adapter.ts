import { InspectorAdapter, type EditableRecord, type InspectorAdapterInit } from "./inspector.adapter";

export interface NumberInputAdapterConfig {
    /**
     * Optional minimum allowed numeric value.
     */
    min?: number;
    /**
     * Optional maximum allowed numeric value.
     */
    max?: number;
    /**
     * Optional decimal precision used for normalization and formatting.
     */
    precision?: number;
}

/**
 * Inspector adapter for numeric text fields with optional precision and min/max constraints.
 */
export class NumberInputAdapter extends InspectorAdapter {

    private readonly input: HTMLInputElement;
    private readonly config: NumberInputAdapterConfig;

    constructor(cell: HTMLElement, mixedClassName: string, initial: InspectorAdapterInit) {
        super(cell, mixedClassName);
        this.cell.classList.add('has-number-editor');
        this.input = document.createElement('input');
        this.input.type = 'number';
        this.input.readOnly = initial.readonly;
        this.config = (initial.def.editorOptions || {} as NumberInputAdapterConfig);

        if (typeof this.config.min === 'number') {
            this.input.min = String(this.config.min);
        }
        if (typeof this.config.max === 'number') {
            this.input.max = String(this.config.max);
        }
        if (typeof this.config.precision === 'number') {
            const p = Math.max(0, Math.floor(this.config.precision));
            this.input.step = p === 0 ? '1' : String(Math.pow(10, -p));
        }

        cell.appendChild(this.input);
        this.input.addEventListener('input', () => {
            if (this.isTransientNumberInput(this.input.value)) {
                return;
            }

            const parsed = Number(this.input.value);
            if (this.input.value === '') {
                this.notifyChange(undefined);
                return;
            }
            if (Number.isFinite(parsed)) {
                this.notifyChange(this.normalizeValue(parsed));
            }
        });
    }

    override showValue(editable: EditableRecord): void {
        const { key, value } = this.extractValueFrom(editable);
        this.returnKey = key;
        this.setUnset(value === undefined || value === null);
        if (value === undefined || value === null) {
            this.input.value = '';
        } else {
            const parsed = Number(value);
            this.input.value = Number.isFinite(parsed) ? this.formatValue(this.normalizeValue(parsed)) : '';
        }
        this.input.placeholder = '';
    }

    override getValue(): EditableRecord {
        const parsed = Number(this.input.value);
        return { [this.returnKey ?? '']: Number.isFinite(parsed) ? this.normalizeValue(parsed) : undefined };
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

    private normalizeValue(value: number): number {
        let next = value;
        if (typeof this.config.precision === 'number') {
            const p = Math.max(0, Math.floor(this.config.precision));
            const factor = Math.pow(10, p);
            next = Math.round(next * factor) / factor;
        }

        if (typeof this.config.min === 'number' && next < this.config.min) {
            next = this.config.min;
        }
        if (typeof this.config.max === 'number' && next > this.config.max) {
            next = this.config.max;
        }

        return next;
    }

    private formatValue(value: number): string {
        if (typeof this.config.precision !== 'number') {
            return String(value);
        }

        const p = Math.max(0, Math.floor(this.config.precision));
        return p === 0 ? String(Math.round(value)) : value.toFixed(p).replace(/\.0+$/, '').replace(/(\.\d*?)0+$/, '$1');
    }

    private isTransientNumberInput(raw: string): boolean {
        return raw === '-' || raw === '.' || raw === '-.' || raw.endsWith('.') || /[eE][+-]?$/.test(raw);
    }
}
