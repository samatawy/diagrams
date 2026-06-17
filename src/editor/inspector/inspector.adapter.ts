import type { InspectorPropertyDefinition } from "./inspector";

export type EditableRecord = Record<string, unknown>;

/**
 * Constructor-time context passed to each inspector adapter.
 */
export interface InspectorAdapterInit {
    /**
     * Indicates whether the adapter should render in read-only mode.
     */
    readonly: boolean;
    /**
     * Property definition that describes which field the adapter edits.
     */
    def: InspectorPropertyDefinition;
}

/**
 * Base contract for inspector field editors that map between UI controls and property values.
 */
export abstract class InspectorAdapter {

    protected readonly cell: HTMLElement;
    protected readonly mixedClassName: string;

    protected returnKey?: string;

    private changeHandler: ((value: unknown) => void) | null = null;

    /**
     * Mounts the adapter into the given value cell element.
     * @param cell The DOM element that will host the adapter's input control.
     * @param mixedClassName CSS class applied to the cell when showing a mixed-value placeholder.
     */
    constructor(cell: HTMLElement, mixedClassName: string) {
        this.cell = cell;
        this.mixedClassName = mixedClassName;
    }

    /**
     * Populates the adapter's control with the value(s) from the given record.
     * @param editable Record containing at least one key-value entry to display.
     */
    public abstract showValue(editable: EditableRecord): void;

    /**
     * Returns the current value of the adapter's control as a record entry.
     * @returns A single-entry record keyed by the last-shown property key.
     */
    public abstract getValue(): EditableRecord;

    /**
     * Toggles the mixed-value visual state on the cell element.
     * Mixed state is shown when the selection contains more than one distinct value.
     * @param mixed True to enter mixed state, false to clear it.
     */
    public setMixed(mixed: boolean): void {
        this.cell.classList.toggle(this.mixedClassName, mixed);
        if (mixed) {
            this.cell.classList.remove('is-unset');
        }
    }

    /**
     * Toggles the unset/empty visual state on the cell element.
     * @param unset True when the current value is undefined or null.
     */
    protected setUnset(unset: boolean): void {
        this.cell.classList.toggle('is-unset', unset);
    }

    /**
     * Registers the callback invoked whenever the user changes the control value.
     * Pass null to disconnect the handler.
     * @param handler The callback to invoke, or null to clear.
     */
    public setChangeHandler(handler: ((value: unknown) => void) | null): void {
        this.changeHandler = handler;
    }

    /**
     * Fires the registered change handler with the new value.
     * No-op when no handler is registered.
     * @param value The new value produced by the control.
     */
    protected notifyChange(value: unknown): void {
        this.changeHandler?.(value);
    }

    /**
     * Extracts a key-value pair from a record, optionally by explicit key.
     * Falls back to the first entry in the record when no key is given.
     * @param record The source record.
     * @param key Optional explicit key override.
     * @returns An object containing the resolved key and its value.
     */
    public extractValueFrom(record: EditableRecord, key?: string): { key: string; value: unknown } {
        if (key && record) {
            return { key, value: record[key] };
        }

        key = Object.keys(record)[0];
        return key ? { key, value: record[key] } : { key: '', value: undefined };
    }

    /**
     * Releases resources held by the adapter, including the change handler reference.
     */
    public destroy(): void {
        this.changeHandler = null;
    }
}
