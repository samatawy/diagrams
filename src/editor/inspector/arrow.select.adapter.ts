import { ArrowSelect, type ArrowSelectConfig } from "../inputs/arrow.select";
import type { InspectorAdapterInit, EditableRecord } from "./inspector";
import { InspectorAdapter } from "./inspector";

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
        // refresh() passes the already-derived direction string under the row key ('arrow').
        // extractValueFrom() handles deriving direction from startArrow/endArrow in the full record.
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

        // If not, derive direction from startArrow/endArrow properties in the record.
        const start = Boolean(editable['startArrow']);
        const end = Boolean(editable['endArrow']);
        const direction = start && end ? 'both' : start ? 'start' : end ? 'end' : 'none';
        this.setUnset(false);
        this.editor.value = direction;
    }

    override getValue(): EditableRecord {
        const value = this.editor.value;

        return {
            startArrow: value === 'start' || value === 'both',
            endArrow: value === 'end' || value === 'both',
        };
    }

    override extractValueFrom(record: EditableRecord): { key: string; value: unknown } {
        const start = Boolean(record['startArrow']);
        const end = Boolean(record['endArrow']);
        const value = start && end ? 'both' : start ? 'start' : end ? 'end' : 'none';
        return { key: '_', value };
    }

    override destroy(): void {
        super.destroy();
        this.editor.destroy();
    }
}

