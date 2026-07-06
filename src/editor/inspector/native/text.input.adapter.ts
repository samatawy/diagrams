import { InspectorAdapter, type EditableRecord, type InspectorAdapterInit } from "../inspector.adapter";

/**
 * Configuration options for {@link TextInputAdapter}.
 */
export interface TextAdapterConfig {
    /**
     * When true the user may insert a newline with Ctrl+Enter.
     * When false (default) all Enter keypresses are prevented so the control
     * behaves like a single-line input.
     */
    multiline?: boolean;
    /**
     * Maximum number of characters accepted.
     * When undefined (default) there is no limit.
     */
    maxLength?: number;
}

/**
 * Inspector adapter for plain text properties.
 * Always renders a textarea that wraps text and grows to fit its content
 * via the native `field-sizing: content` CSS property.
 * Ctrl+Enter inserts a newline only when `multiline` is enabled.
 */
export class TextInputAdapter extends InspectorAdapter {

    private readonly textarea: HTMLTextAreaElement;

    /**
     * Creates the adapter and mounts an auto-growing textarea into the cell.
     * @param cell The DOM element that will host the textarea.
     * @param mixedClassName CSS class for mixed-value state.
     * @param initial Constructor-time context including the property definition and readonly flag.
     */
    constructor(cell: HTMLElement, mixedClassName: string, initial: InspectorAdapterInit) {
        super(cell, mixedClassName);

        const config = (initial.def.editorOptions ?? {}) as TextAdapterConfig;
        const multiline = config.multiline ?? false;
        const maxLength = config.maxLength;

        const ta = document.createElement('textarea');
        ta.rows = 1;
        ta.readOnly = initial.readonly;
        ta.style.resize = 'none';
        // Native auto-grow: the textarea automatically sizes to its content.
        ta.style.setProperty('field-sizing', 'content');

        if (maxLength !== undefined) {
            ta.maxLength = maxLength;
        }

        ta.addEventListener('input', () => this.notifyChange(ta.value));

        ta.addEventListener('keydown', (e: KeyboardEvent) => {
            if (e.key !== 'Enter') return;

            if (multiline && e.ctrlKey) {
                // Explicitly insert \n at the cursor so behaviour is consistent
                // across all browsers/OS combinations (Ctrl+Enter has no
                // guaranteed default action in a textarea).
                e.preventDefault();
                const start = ta.selectionStart ?? ta.value.length;
                const end = ta.selectionEnd ?? ta.value.length;
                ta.value = ta.value.slice(0, start) + '\n' + ta.value.slice(end);
                ta.selectionStart = ta.selectionEnd = start + 1;
                this.notifyChange(ta.value);
                return;
            }

            // In all other cases prevent the textarea from inserting a newline.
            // We do NOT stopPropagation so the event still bubbles to any
            // external handlers (e.g. form submit, focus management).
            e.preventDefault();
        });

        this.textarea = ta;
        cell.appendChild(ta);
    }

    /**
     * Populates the textarea with the value from the given record.
     * @param editable Record containing at least one key-value entry to display.
     */
    override showValue(editable: EditableRecord): void {
        const { key, value } = this.extractValueFrom(editable);
        this.returnKey = key;
        this.setUnset(value === undefined || value === null);
        this.textarea.value = value !== undefined && value !== null ? String(value) : '';
        this.textarea.placeholder = '';
    }

    /**
     * Returns the current textarea value as a record entry.
     * @returns A single-entry record keyed by the last-shown property key.
     */
    override getValue(): EditableRecord {
        return { [this.returnKey ?? '']: this.textarea.value };
    }

    /**
     * Applies or clears the mixed-value placeholder state.
     * @param mixed True to show the 'Multiple' placeholder, false to clear it.
     */
    override setMixed(mixed: boolean): void {
        super.setMixed(mixed);
        if (mixed) {
            this.textarea.value = '';
            this.textarea.placeholder = 'Multiple';
        } else {
            this.textarea.placeholder = '';
        }
    }
}
