import { ColorSelect, type ColorSelectConfig } from "../inputs/color.select";
import type { InspectorAdapterInit, EditableRecord } from "./inspector";
import { InspectorAdapter } from "./inspector";

/**
 * Inspector adapter that binds a ColorSelect control to a string color property.
 */
export class ColorSelectAdapter extends InspectorAdapter {

    private readonly editor: ColorSelect;

    constructor(cell: HTMLElement, mixedClassName: string, initial: InspectorAdapterInit) {
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
        host.addEventListener('colorchange', (e) => {
            this.setUnset(false);
            this.notifyChange((e as CustomEvent<string>).detail);
        });
    }

    public setColors(colors: string[]): void {
        this.editor.clearOptions();
        this.editor.addOptions(colors);
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
