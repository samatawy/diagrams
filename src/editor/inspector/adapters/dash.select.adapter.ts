import { DashSelect, type DashSelectConfig } from "../../inputs/dash.select";
import type { InspectorAdapterInit, EditableRecord } from "../inspector";
import { InspectorAdapter } from "../inspector";

/**
 * Inspector adapter for selecting line-dash styles using DashSelect.
 */
export class DashSelectAdapter extends InspectorAdapter {

    private readonly editor: DashSelect;

    constructor(cell: HTMLElement, mixedClassName: string, initial: InspectorAdapterInit) {
        super(cell, mixedClassName);
        const host = document.createElement('div');
        host.style.width = '100%';
        cell.appendChild(host);

        const options: DashSelectConfig = {
            ...(initial.def.editorOptions as DashSelectConfig),
        };
        this.editor = new DashSelect(host, options);

        host.addEventListener('dashchange', (e) => {
            this.setUnset(false);
            this.notifyChange((e as CustomEvent<unknown>).detail);
        });
    }

    override showValue(editable: EditableRecord): void {
        const { key, value } = this.extractValueFrom(editable);
        this.returnKey = key;
        const hasValue = value !== undefined && value !== null && (!Array.isArray(value) || value.length > 0);
        if (!hasValue) {
            this.setUnset(true);
            return;
        }

        this.setUnset(false);
        if (Array.isArray(value)) {
            this.editor.value = value.map((one) => Number(one)).filter((one) => Number.isFinite(one) && one >= 0);
            return;
        }

        this.editor.value = String(value) as any;
    }

    override getValue(): EditableRecord {
        return { [this.returnKey ?? '']: this.editor.value };
    }

    override destroy(): void {
        super.destroy();
        this.editor.destroy();
    }
}
