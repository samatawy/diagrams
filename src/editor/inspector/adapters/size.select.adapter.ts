import type { InspectorAdapterInit, EditableRecord } from "../inspector";
import { InspectorAdapter } from "../inspector";
import { SizeSelect, type SizeSelectConfig } from "../../inputs/size.select";

/**
 * Inspector adapter that binds a SizeSelect control to numeric size properties.
 */
export class SizeSelectAdapter extends InspectorAdapter {

    private readonly editor: SizeSelect;

    constructor(cell: HTMLElement, mixedClassName: string, initial: InspectorAdapterInit) {
        super(cell, mixedClassName);
        const host = document.createElement('div');
        host.style.width = '100%';
        cell.appendChild(host);
        const options: SizeSelectConfig = {
            ...(initial.def.editorOptions as SizeSelectConfig),
        };
        this.editor = new SizeSelect(host, options);
        host.addEventListener('sizechange', (e) => {
            this.setUnset(false);
            this.notifyChange((e as CustomEvent<number>).detail);
        });
    }

    override showValue(editable: EditableRecord): void {
        const { key, value } = this.extractValueFrom(editable);
        this.returnKey = key;
        const size = Number(value);
        const hasValue = Number.isFinite(size);
        this.setUnset(!hasValue);
        if (hasValue) {
            this.editor.value = size;
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
