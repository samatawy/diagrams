import type { InspectorAdapterInit, EditableRecord } from "../inspector";
import { InspectorAdapter } from "../inspector";
import { EnumSelect, ENUM_SELECT_CHANGE_EVENT } from "../../inputs/enum.select";

export type EnumSelectAdapterOption = string | { value: string; label?: string };

/**
 * Configuration options for EnumSelectAdapter.
 */
export interface EnumSelectAdapterConfig {
    tooltip?: string;
    /**
     * Allowed option values, with optional display labels.
     * May be a static array or a zero-argument factory called on every refresh,
     * which lets the inspector narrow the list based on the current selection.
     */
    options: EnumSelectAdapterOption[] | (() => EnumSelectAdapterOption[]);
    /**
     * Optional placeholder text when no value is selected.
     */
    placeholder?: string;
}

/**
 * Inspector adapter for constrained string values rendered as a dropdown menu.
 */
export class EnumSelectAdapter extends InspectorAdapter {

    private readonly allOptions: Array<{ value: string; label: string }>;

    private readonly optionsFn: (() => Array<{ value: string; label: string }>) | null;

    private readonly select: EnumSelect<string>;

    private readonly onEnumChange: (event: Event) => void;

    constructor(cell: HTMLElement, mixedClassName: string, initial: InspectorAdapterInit) {
        super(cell, mixedClassName);

        const cfg = (initial.def.editorOptions as EnumSelectAdapterConfig | undefined) || { options: [] };
        const rawOptions = cfg.options;
        const mapOptions = (opts: EnumSelectAdapterOption[]) =>
            opts.map((option) => {
                if (typeof option === 'string') return { value: option, label: option };
                return { value: option.value, label: option.label || option.value };
            });

        if (typeof rawOptions === 'function') {
            this.optionsFn = () => mapOptions(rawOptions());
            this.allOptions = mapOptions(rawOptions());
        } else {
            this.optionsFn = null;
            this.allOptions = mapOptions(rawOptions);
        }

        this.select = new EnumSelect<string>(cell, {
            tooltip: cfg.tooltip || '',
            options: this.allOptions.map((option) => ({ value: option.value, label: option.label })),
            disabled: initial.readonly,
            placeholder: cfg.placeholder || '',
        });

        this.onEnumChange = (event: Event) => {
            const detail = (event as CustomEvent<string>).detail;
            this.notifyChange(detail);
        };
        cell.addEventListener(ENUM_SELECT_CHANGE_EVENT, this.onEnumChange as EventListener);
    }

    override setMixed(mixed: boolean): void {
        super.setMixed(mixed);
        if (mixed) {
            this.select.value = undefined;
        }
    }

    override showValue(editable: EditableRecord): void {
        const { key, value } = this.extractValueFrom(editable);
        this.returnKey = key;
        this.refreshOptions();
        this.select.value = value !== undefined && value !== null ? String(value) : '';
    }

    public refreshOptions(): void {
        const next = this.optionsFn ? this.optionsFn() : this.allOptions;
        this.select.setOptions(next.map((option) => ({ value: option.value, label: option.label })));
    }

    override getValue(): EditableRecord {
        return { [this.returnKey ?? '']: this.select.value ?? '' };
    }

    override destroy(): void {
        super.destroy();
        this.cell.removeEventListener(ENUM_SELECT_CHANGE_EVENT, this.onEnumChange as EventListener);
        this.select.destroy();
    }
}
