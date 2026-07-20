import type { InspectorAdapterInit, EditableRecord } from "../inspector";
import { InspectorAdapter } from "../inspector";

/**
 * Configuration options for angle editing behavior.
 */
interface AngleAdapterConfig {
    /**
     * Number of decimal places used when formatting and normalizing angle values.
     */
    precision?: number;
}

/**
 * Inspector adapter for editing angle values in degrees while persisting radians.
 */
export class AngleAdapter extends InspectorAdapter {

    private readonly input: HTMLInputElement;
    private readonly precision?: number;

    constructor(cell: HTMLElement, mixedClassName: string, initial: InspectorAdapterInit) {
        super(cell, mixedClassName);
        const config = (initial.def.editorOptions as AngleAdapterConfig | undefined) || {};
        this.precision = typeof config.precision === 'number' ? Math.max(0, Math.floor(config.precision)) : 4;
        this.input = document.createElement('input');
        this.input.type = 'number';
        this.input.step = '1'; //// this.precision === 0 ? '1' : String(Math.pow(10, -this.precision));
        this.input.readOnly = initial.readonly;
        // this.input.title = (initial.def.editorOptions as )?.tooltip ?? 'Angle in degrees';

        cell.appendChild(this.input);
        this.input.addEventListener('input', () => {
            if (this.isTransientNumberInput(this.input.value)) {
                return;
            }

            const parsed = Number(this.input.value);
            if (this.input.value === '') {
                this.setUnset(true);
                this.notifyChange(undefined);
                return;
            }
            if (Number.isFinite(parsed)) {
                this.setUnset(false);
                this.notifyChange(this.normalize(parsed));
            }
        });
    }

    override showValue(editable: EditableRecord): void {
        const { key, value } = this.extractValueFrom(editable);
        this.returnKey = key;
        const radians = Number(value);
        if (!Number.isFinite(radians)) {
            this.setUnset(true);
            this.input.value = '';
            return;
        }

        this.setUnset(false);
        const degrees = radians * (180 / Math.PI);
        this.input.value = this.format(this.normalize(degrees));
    }

    override getValue(): EditableRecord {
        const parsed = Number(this.input.value);
        if (!Number.isFinite(parsed)) {
            return { [this.returnKey ?? '']: undefined };
        }

        const radians = this.normalize(parsed) * (Math.PI / 180);
        return { [this.returnKey ?? '']: radians };
    }

    private normalize(value: number): number {
        if (this.precision === undefined) {
            return value;
        }

        const factor = Math.pow(10, this.precision);
        return Math.round(value * factor) / factor;
    }

    private format(value: number): string {
        if (this.precision === undefined) {
            return String(value);
        }
        if (this.precision === 0) {
            return String(Math.round(value));
        }

        return value.toFixed(this.precision).replace(/\.0+$/, '').replace(/(\.\d*?)0+$/, '$1');
    }

    private isTransientNumberInput(raw: string): boolean {
        return raw === '-' || raw === '.' || raw === '-.' || raw.endsWith('.') || /[eE][+-]?$/.test(raw);
    }
}
