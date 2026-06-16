import { ArrowSelect, type ArrowSelectConfig } from "../arrow.select";
import type { InspectorEditorInit, EditableRecord } from "./inspector";
import { InspectorValueEditor } from "./inspector";

export class ArrowSelectEditor extends InspectorValueEditor {

    private readonly editor: ArrowSelect;

    constructor(cell: HTMLElement, mixedClassName: string, initial: InspectorEditorInit) {
        super(cell, mixedClassName);
        const host = document.createElement('div');
        host.style.width = '100%';
        cell.appendChild(host);
        const options: ArrowSelectConfig = {
            ...(initial.def.editorOptions as ArrowSelectConfig),
        };
        this.editor = new ArrowSelect(host, options);
        host.addEventListener('arrowchange', (e) => this.notifyChange((e as CustomEvent<string>).detail));
    }

    override showValue(editable: EditableRecord): void {
        // refresh() passes the already-derived direction string under the row key ('arrow').
        // extractValueFrom() handles deriving direction from startArrow/endArrow in the full record.
        const explicit = editable['arrow'] ? String(editable['arrow'] ?? 'none') : undefined;
        if (explicit) {
            this.editor.value = explicit as any;
            return;
        }

        // If not, derive direction from startArrow/endArrow properties in the record.
        const start = Boolean(editable['startArrow']);
        const end = Boolean(editable['endArrow']);
        const direction = start && end ? 'both' : start ? 'start' : end ? 'end' : 'none';
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

