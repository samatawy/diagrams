import type { InspectorAdapterInit, EditableRecord } from "./inspector";
import { InspectorAdapter } from "./inspector";
import { WidthSelect, type WidthSelectConfig } from "../width.select";

export class WidthSelectAdapter extends InspectorAdapter {

    private readonly editor: WidthSelect;

    constructor(cell: HTMLElement, mixedClassName: string, initial: InspectorAdapterInit) {
        super(cell, mixedClassName);
        const host = document.createElement('div');
        host.style.width = '100%';
        cell.appendChild(host);
        const options: WidthSelectConfig = {
            ...(initial.def.editorOptions as WidthSelectConfig),
        };
        this.editor = new WidthSelect(host, options);
        host.addEventListener('widthchange', (e) => {
            this.setUnset(false);
            this.notifyChange((e as CustomEvent<number>).detail);
        });
    }

    override showValue(editable: EditableRecord): void {
        const { key, value } = this.extractValueFrom(editable);
        this.returnKey = key;
        const width = Number(value);
        const hasValue = Number.isFinite(width);
        this.setUnset(!hasValue);
        if (hasValue) {
            this.editor.value = width;
        }
    }

    override getValue(): EditableRecord {
        return { [this.returnKey ?? '']: this.editor.value };
    }

    override destroy(): void {
        super.destroy();
        this.editor.destroy();
    }
}
