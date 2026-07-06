import type { EditableRecord, InspectorAdapterInit } from '../inspector';
import { InspectorAdapter } from '../inspector';
import { TypeTransferPanel } from '../../inputs/type.transfer.panel';

/**
 * Configuration options for TypeTransferAdapter.
 */
export interface TypeTransferAdapterConfig {
    /**
     * Candidate node types that can replace the current type.
     * May be static or computed per-refresh.
     */
    options: string[] | (() => string[]);
}

/**
 * Inspector adapter for changing node type using the shared transfer panel UI.
 */
export class TypeTransferAdapter extends InspectorAdapter {

    private readonly panel: TypeTransferPanel;
    private readonly allOptions: string[];
    private readonly optionsFn: (() => string[]) | null;
    private currentType = '';

    constructor(cell: HTMLElement, mixedClassName: string, initial: InspectorAdapterInit) {
        super(cell, mixedClassName);

        const cfg = (initial.def.editorOptions as TypeTransferAdapterConfig | undefined) || { options: [] };
        if (typeof cfg.options === 'function') {
            this.optionsFn = cfg.options;
            this.allOptions = cfg.options();
        } else {
            this.optionsFn = null;
            this.allOptions = [...cfg.options];
        }

        this.panel = new TypeTransferPanel(cell, {
            currentType: this.currentType,
            transferables: this.allOptions,
            onSelect: (type) => {
                this.currentType = type;
                this.notifyChange(type);
            },
        });
    }

    override showValue(editable: EditableRecord): void {
        const { key, value } = this.extractValueFrom(editable);
        this.returnKey = key;
        this.currentType = value !== undefined && value !== null ? String(value) : '';
        this.refreshOptions();
    }

    public refreshOptions(): void {
        const options = this.optionsFn ? this.optionsFn() : this.allOptions;
        this.panel.setState(this.currentType, options);
    }

    override getValue(): EditableRecord {
        return { [this.returnKey ?? '']: this.currentType };
    }

    override destroy(): void {
        super.destroy();
        this.panel.destroy();
    }
}
