import type { InspectorAdapterInit, EditableRecord } from "../inspector";
import { InspectorAdapter } from "../inspector";
import { SHADOW_PRESET_CHANGE_EVENT, ShadowPresetSelect } from "../../inputs/shadow.preset.select";
import type { ShadowStyle } from "../../../style.interfaces";
import { DiagramConstants } from "../../../model";

/**
 * Inspector adapter that binds a ShadowPresetSelect control to numeric size properties.
 */
export class ShadowPresetSelectAdapter extends InspectorAdapter {

    private readonly editor: ShadowPresetSelect;

    constructor(cell: HTMLElement, mixedClassName: string, initial: InspectorAdapterInit) {
        super(cell, mixedClassName);
        const host = document.createElement('div');
        host.style.width = '100%';
        cell.appendChild(host);
        // const options: ShadowPresetSelectConfig = {
        //     ...(initial.def.editorOptions as SizeSelectConfig),
        // };
        this.editor = new ShadowPresetSelect(host); // , options);
        host.addEventListener(SHADOW_PRESET_CHANGE_EVENT, (e) => {
            this.setUnset(false);
            this.notifyChange((e as CustomEvent<ShadowStyle>).detail);
        });
    }

    override showValue(editable: EditableRecord): void {
        const { key, value } = this.extractValueFrom(editable);
        this.returnKey = key;
        const hasValue = value !== undefined && value !== null;
        if (!hasValue) {
            this.setUnset(true);
            return;
        }

        const explicit = value; //String(value);
        if (explicit) {
            this.setUnset(false);
            this.editor.value = explicit as ShadowStyle;
            return;
        }

        this.setUnset(false);
        this.editor.value = DiagramConstants.NO_SHADOW;
    }

    override getValue(): EditableRecord {
        return { [this.returnKey ?? '']: this.editor.value };
    }

    override destroy(): void {
        super.destroy();
        this.editor.destroy();
    }
}
