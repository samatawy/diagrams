import type { InspectorEditorInit, EditableRecord } from "./inspector";
import { InspectorValueEditor } from "./inspector";
import { SizeSelect, type SizeSelectConfig } from "../size.select";

export class SizeSelectEditor extends InspectorValueEditor {

    private readonly editor: SizeSelect;

    constructor(cell: HTMLElement, mixedClassName: string, initial: InspectorEditorInit) {
        super(cell, mixedClassName);
        const host = document.createElement('div');
        host.style.width = '100%';
        cell.appendChild(host);
        const options: SizeSelectConfig = {
            ...(initial.def.editorOptions as SizeSelectConfig),
        };
        this.editor = new SizeSelect(host, options);
        host.addEventListener('sizechange', (e) => this.notifyChange((e as CustomEvent<number>).detail));
    }

    override showValue(editable: EditableRecord): void {
        const { key, value } = this.extractValueFrom(editable);
        this.returnKey = key;
        const size = Number(value);
        this.editor.value = Number.isFinite(size) ? size : 1;
    }

    override getValue(): EditableRecord {
        return { [this.returnKey ?? '']: this.editor.value };
    }

    override destroy(): void {
        super.destroy();
        this.editor.destroy();
    }
}
