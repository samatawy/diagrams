import { ColorSelect, type ColorSelectConfig } from "../color.select";
import type { InspectorEditorInit, EditableRecord } from "./inspector";
import { InspectorValueEditor } from "./inspector";

export class ColorSelectEditor extends InspectorValueEditor {

    private readonly editor: ColorSelect;

    constructor(cell: HTMLElement, mixedClassName: string, initial: InspectorEditorInit) {
        super(cell, mixedClassName);
        const host = document.createElement('div');
        host.style.width = '100%';
        cell.appendChild(host);
        const options: ColorSelectConfig = {
            showLabel: true,
            showNativeInput: 'option',
            ...(initial.def.editorOptions as ColorSelectConfig),
        };
        this.editor = new ColorSelect(host, options);
        host.addEventListener('colorchange', (e) => this.notifyChange((e as CustomEvent<string>).detail));
    }

    public setColors(colors: string[]): void {
        this.editor.clearOptions();
        this.editor.addOptions(colors);
    }

    override showValue(editable: EditableRecord): void {
        const { key, value } = this.extractValueFrom(editable);
        this.returnKey = key;
        this.editor.value = value !== undefined && value !== null ? String(value) : 'transparent';
    }

    override getValue(): EditableRecord {
        return { [this.returnKey ?? '']: this.editor.value };
    }

    override destroy(): void {
        super.destroy();
        this.editor.destroy();
    }
}
