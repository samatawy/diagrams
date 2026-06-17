import type { InspectorAdapterInit, EditableRecord } from "./inspector";
import { InspectorAdapter } from "./inspector";

export class AngleAdapter extends InspectorAdapter {

    private readonly input: HTMLInputElement;

    constructor(cell: HTMLElement, mixedClassName: string, initial: InspectorAdapterInit) {
        super(cell, mixedClassName);
        this.input = document.createElement('input');
        this.input.type = 'number';
        this.input.step = '1';
        this.input.readOnly = initial.readonly;
        this.input.title = 'Angle in degrees';
        cell.appendChild(this.input);
        this.input.addEventListener('input', () => {
            const parsed = Number(this.input.value);
            if (this.input.value === '') {
                this.setUnset(true);
                this.notifyChange(undefined);
                return;
            }
            if (Number.isFinite(parsed)) {
                this.setUnset(false);
                this.notifyChange(parsed);
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
        this.input.value = String(Math.round(degrees * 100) / 100);
    }

    override getValue(): EditableRecord {
        const parsed = Number(this.input.value);
        if (!Number.isFinite(parsed)) {
            return { [this.returnKey ?? '']: undefined };
        }

        const radians = parsed * (Math.PI / 180);
        return { [this.returnKey ?? '']: radians };
    }
}
