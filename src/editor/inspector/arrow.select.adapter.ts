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
        const explicitRaw = editable['arrow'];
        if (explicitRaw === undefined || explicitRaw === null) {
            this.setUnset(true);
            return;
        }

        const explicit = String(explicitRaw);
        if (explicit.length > 0) {
            this.setUnset(false);
            this.editor.value = explicit as any;
            return;
        }

        this.setUnset(false);
        this.editor.value = 'none';
    }

    override getValue(): EditableRecord {
        return { arrow: this.editor.value };
    }

    override extractValueFrom(record: EditableRecord): { key: string; value: unknown } {
        return { key: 'arrow', value: record['arrow'] ?? 'none' };
    }

    override destroy(): void {
        super.destroy();
        this.editor.destroy();
    }
}

