import { ArrowSelect, type ArrowSelectConfig } from "../inputs/arrow.select";
import type { InspectorAdapterInit, EditableRecord } from "./inspector";
import { InspectorAdapter } from "./inspector";

/**
 * Inspector adapter for selecting arrow types on connections, using the ArrowSelect component. 
 * It also manages the "mixed" state when multiple selected connections have different arrow types.
 */
export class ArrowSelectAdapter extends InspectorAdapter {

    private readonly editor: ArrowSelect;

    constructor(cell: HTMLElement, mixedClassName: string, initial: InspectorAdapterInit) {
        super(cell, mixedClassName);
        const host = document.createElement('div');
        host.style.width = '100%';
        cell.appendChild(host);
        const options: ArrowSelectConfig = {
            ...(initial.def.editorOptions as ArrowSelectConfig),
        };
        this.editor = new ArrowSelect(host, options);
        host.addEventListener('arrowchange', (e) => {
            this.setUnset(false);
            this.notifyChange((e as CustomEvent<string>).detail);
        });
    }

    override showValue(editable: EditableRecord): void {
        const { key, value } = this.extractValueFrom(editable);
        this.returnKey = key;
        const hasValue = value !== undefined && value !== null;
        if (!hasValue) {
            this.setUnset(true);
            return;
        }

        const explicit = String(value);
        if (explicit.length > 0) {
            this.setUnset(false);
            this.editor.value = explicit as any;
            return;
        }

        this.setUnset(false);
        this.editor.value = 'none';
    }

    override getValue(): EditableRecord {
        return { [this.returnKey ?? '']: this.editor.value };
    }

    override destroy(): void {
        super.destroy();
        this.editor.destroy();
    }
}

