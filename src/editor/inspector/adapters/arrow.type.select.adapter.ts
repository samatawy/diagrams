import { ArrowTypeSelect } from '../../inputs/arrow.type.select';
import type { ArrowType } from '../../../types';
import type { EditableRecord, InspectorAdapterInit } from '../inspector';
import { InspectorAdapter } from '../inspector';

/**
 * Inspector adapter for selecting arrow types on connections, using the ArrowTypeSelect component.
 * It also manages the "mixed" state when multiple selected connections have different arrow types.
 */
export class ArrowTypeSelectAdapter extends InspectorAdapter {

    private readonly editor: ArrowTypeSelect;

    constructor(cell: HTMLElement, mixedClassName: string, initial: InspectorAdapterInit) {
        super(cell, mixedClassName);
        const host = document.createElement('div');
        host.style.width = '100%';
        cell.appendChild(host);
        this.editor = new ArrowTypeSelect(host, {
            arrows: ['solid_triangle', 'hollow_triangle', 'solid_spear', 'hollow_spear', 'solid_diamond', 'hollow_diamond', 'solid_circle', 'hollow_circle', 'none'],
            ...((initial.def.editorOptions || {}) as any),
        });
        host.addEventListener('arrowtypechange', (event) => {
            this.setUnset(false);
            this.notifyChange((event as CustomEvent<ArrowType>).detail);
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
            this.editor.value = explicit as ArrowType;
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
