import type { InspectorPropertyDefinition } from "./inspector";

export type EditableRecord = Record<string, unknown>;

export interface InspectorAdapterInit {
    readonly: boolean;
    def: InspectorPropertyDefinition;
}

export abstract class InspectorAdapter {

    protected readonly cell: HTMLElement;
    protected readonly mixedClassName: string;

    protected returnKey?: string;

    private changeHandler: ((value: unknown) => void) | null = null;

    constructor(cell: HTMLElement, mixedClassName: string) {
        this.cell = cell;
        this.mixedClassName = mixedClassName;
    }

    public abstract showValue(editable: EditableRecord): void;

    public abstract getValue(): EditableRecord;

    public setMixed(mixed: boolean): void {
        this.cell.classList.toggle(this.mixedClassName, mixed);
        if (mixed) {
            this.cell.classList.remove('is-unset');
        }
    }

    protected setUnset(unset: boolean): void {
        this.cell.classList.toggle('is-unset', unset);
    }

    public setChangeHandler(handler: ((value: unknown) => void) | null): void {
        this.changeHandler = handler;
    }

    protected notifyChange(value: unknown): void {
        this.changeHandler?.(value);
    }

    public extractValueFrom(record: EditableRecord, key?: string): { key: string; value: unknown } {
        if (key && record) {
            return { key, value: record[key] };
        }

        key = Object.keys(record)[0];
        return key ? { key, value: record[key] } : { key: '', value: undefined };
    }

    public destroy(): void {
        this.changeHandler = null;
    }
}
