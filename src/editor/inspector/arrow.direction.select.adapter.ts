import { ArrowDirectionSelect, type ArrowDirectionSelectConfig } from "../inputs/arrow.direction.select";
import type { InspectorAdapterInit, EditableRecord } from "./inspector";
import { InspectorAdapter } from "./inspector";

/**
 * Inspector adapter for selecting arrow directions on connections, using the ArrowDirectionSelect component.
 * It also manages the "mixed" state when multiple selected connections have different arrow directions.
 */
export class ArrowDirectionSelectAdapter extends InspectorAdapter {

    private readonly editor: ArrowDirectionSelect;

    constructor(cell: HTMLElement, mixedClassName: string, initial: InspectorAdapterInit) {
        super(cell, mixedClassName);
        const host = document.createElement('div');
        host.style.width = '100%';
        cell.appendChild(host);
        const options: ArrowDirectionSelectConfig = {
            ...(initial.def.editorOptions as ArrowDirectionSelectConfig),
        };
        this.editor = new ArrowDirectionSelect(host, options);
        host.addEventListener('arrowchange', (e) => {
            this.setUnset(false);
            this.notifyChange((e as CustomEvent<string>).detail);
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

        const explicit = String(value);
        if (explicit.length > 0) {
            this.setUnset(false);
            this.editor.value = explicit as any;
            return;
        }

        this.setUnset(false);
        this.editor.value = 'none';
    }

    override getValue(): EditableRecord {
        return { [this.returnKey ?? '']: this.editor.value };
    }

    override destroy(): void {
        super.destroy();
        this.editor.destroy();
    }
}
