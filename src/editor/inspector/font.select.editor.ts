import type { InspectorEditorInit, EditableRecord } from "./inspector";
import { FontSelect, type FontSelectConfig } from "../font.select";
import { InspectorValueEditor } from "./inspector";

export class FontSelectEditor extends InspectorValueEditor {

    private readonly editor: FontSelect;

    constructor(cell: HTMLElement, mixedClassName: string, initial: InspectorEditorInit) {
        super(cell, mixedClassName);
        const host = document.createElement('div');
        host.style.width = '100%';
        cell.appendChild(host);
        const options: FontSelectConfig = {
            showPreview: true,
            ...(initial.def.editorOptions as FontSelectConfig),
        };
        this.editor = new FontSelect(host, options);
        host.addEventListener('fontchange', (e) => this.notifyChange((e as CustomEvent<string>).detail));
    }

    override showValue(editable: EditableRecord): void {
        const { key, value } = this.extractValueFrom(editable);
        this.returnKey = key;
        this.editor.value = String(value ?? 'Tahoma');
    }

    override getValue(): EditableRecord {
        return { [this.returnKey ?? '']: this.editor.value };
    }

    override destroy(): void {
        super.destroy();
        this.editor.destroy();
    }
}
