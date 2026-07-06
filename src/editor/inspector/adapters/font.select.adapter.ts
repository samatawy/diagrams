import type { InspectorAdapterInit, EditableRecord } from "../inspector";
import { FontSelect, type FontSelectConfig } from "../../inputs/font.select";
import { InspectorAdapter } from "../inspector";

/**
 * Inspector adapter that binds a FontSelect control to text font-family properties.
 */
export class FontSelectAdapter extends InspectorAdapter {

    private readonly editor: FontSelect;

    constructor(cell: HTMLElement, mixedClassName: string, initial: InspectorAdapterInit) {
        super(cell, mixedClassName);
        const host = document.createElement('div');
        host.style.width = '100%';
        cell.appendChild(host);
        const options: FontSelectConfig = {
            showPreview: true,
            ...(initial.def.editorOptions || {} as FontSelectConfig),
        };
        this.editor = new FontSelect(host, options);
        host.addEventListener('fontchange', (e) => {
            this.setUnset(false);
            this.notifyChange((e as CustomEvent<string>).detail);
        });
    }

    override showValue(editable: EditableRecord): void {
        const { key, value } = this.extractValueFrom(editable);
        this.returnKey = key;
        const hasValue = value !== undefined && value !== null && String(value) !== '';
        this.setUnset(!hasValue);
        if (hasValue) {
            this.editor.value = String(value);
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
