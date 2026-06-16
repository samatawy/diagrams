import type { InspectorEditorInit, EditableRecord } from "./inspector";
import { InspectorValueEditor } from "./inspector";
import { WidthSelect, type WidthSelectConfig } from "../width.select";

export class WidthSelectEditor extends InspectorValueEditor {

    private readonly editor: WidthSelect;

    constructor(cell: HTMLElement, mixedClassName: string, initial: InspectorEditorInit) {
        super(cell, mixedClassName);
        const host = document.createElement('div');
        host.style.width = '100%';
        cell.appendChild(host);
        const options: WidthSelectConfig = {
            ...(initial.def.editorOptions as WidthSelectConfig),
        };
        this.editor = new WidthSelect(host, options);
        host.addEventListener('widthchange', (e) => this.notifyChange((e as CustomEvent<number>).detail));
    }

    override showValue(editable: EditableRecord): void {
        const { key, value } = this.extractValueFrom(editable);
        this.returnKey = key;
        const width = Number(value);
        this.editor.value = Number.isFinite(width) ? width : 1;
    }

    override getValue(): EditableRecord {
        return { [this.returnKey ?? '']: this.editor.value };
    }

    override destroy(): void {
        super.destroy();
        this.editor.destroy();
    }
}
