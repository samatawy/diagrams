import { injectStyles, setClasses } from "../editor.utils";

// ============================================================
// Config
// ============================================================

/**
 * Configuration options for the Inspector control.
 * Provide only the properties you want to override; defaults will be used for the rest.
 */
export interface InspectorConfig {
    /** Optional class name for the host element. */
    hostClassName?: string;
    /** Optional class name for each section element. */
    sectionClassName?: string;
    /** Optional class name for each section heading element. */
    headingClassName?: string;
    /** Optional class name for the properties grid element inside each section. */
    gridClassName?: string;
    /** Optional class name for each row (label + control pair) element. */
    rowClassName?: string;
    /** Optional class name for label elements. */
    labelClassName?: string;
    /** Optional class name for value/control elements. */
    valueClassName?: string;
    /** Optional class name applied to rows that are read-only. */
    readonlyClassName?: string;
    /** Optional class name applied to rows that are disabled (e.g. mixed multi-selection). */
    disabledClassName?: string;
    /** Optional class name applied to value elements that show a mixed/multi state placeholder. */
    mixedClassName?: string;
}

const DEFAULT_CONFIG: Required<InspectorConfig> = {
    hostClassName: 'inspector',
    sectionClassName: 'inspector-section',
    headingClassName: 'inspector-heading',
    gridClassName: 'inspector-grid',
    rowClassName: 'inspector-row',
    labelClassName: 'inspector-label',
    valueClassName: 'inspector-value',
    readonlyClassName: 'is-readonly',
    disabledClassName: 'is-disabled',
    mixedClassName: 'is-mixed',
};

// ============================================================
// Styles
// ============================================================

const STYLE_ID = 'inspector-defaults';

const DEFAULT_STYLES = `
.inspector {
    display: flex;
    flex-direction: column;
    gap: var(--diagram-ui-group-gap, 4px);
    padding: var(--diagram-ui-panel-padding, 6px);
    font: var(--diagram-ui-font-size, 12px)/1.4 var(--diagram-ui-font-family, 'Helvetica Neue', Helvetica, Arial, sans-serif);
    color: var(--diagram-ui-text, #1f2937);
    background: var(--diagram-ui-surface, rgba(255, 255, 255, 0.88));
    overflow-y: auto;
    box-sizing: border-box;
}

/* Section */
.inspector .inspector-section {
    display: flex;
    flex-direction: column;
    gap: 0;
}

/* Section heading */
.inspector .inspector-heading {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 0 4px 2px;
    font: 600 var(--diagram-ui-label-font-size, 11px)/1.2 var(--diagram-ui-font-family, 'Helvetica Neue', Helvetica, Arial, sans-serif);
    color: var(--diagram-ui-text-muted, #334155);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    border-bottom: var(--diagram-ui-border-width, 1px) solid var(--diagram-ui-border, rgba(15, 23, 42, 0.1));
    margin-bottom: 4px;
    cursor: default;
    user-select: none;
}
.inspector .inspector-heading::before {
    content: '▾';
    font-size: 9px;
    transition: transform 0.15s;
}
.inspector .inspector-section.is-collapsed .inspector-heading::before {
    transform: rotate(-90deg);
}
.inspector .inspector-section.is-collapsed .inspector-grid {
    display: none;
}

/* Two-column property grid */
.inspector .inspector-grid {
    display: grid;
    grid-template-columns: var(--inspector-label-width, 100px) minmax(0, 1fr);
    row-gap: 2px;
    column-gap: var(--diagram-ui-control-gap, 8px);
    align-items: center;
    padding: 2px 0;
}

/* Row */
.inspector .inspector-row {
    display: contents;
}
.inspector .inspector-row.is-disabled .inspector-label,
.inspector .inspector-row.is-disabled .inspector-value {
    opacity: 0.45;
    pointer-events: none;
}
.inspector .inspector-row.is-readonly .inspector-value {
    pointer-events: none;
}

/* Label */
.inspector .inspector-label {
    font: 600 var(--diagram-ui-label-font-size, 11px)/1.2 var(--diagram-ui-font-family, 'Helvetica Neue', Helvetica, Arial, sans-serif);
    color: var(--diagram-ui-text-muted, #334155);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    padding: 4px 0;
    min-height: 26px;
    display: flex;
    align-items: center;
}

/* Value / control cell */
.inspector .inspector-value {
    display: flex;
    align-items: center;
    min-height: 26px;
}
.inspector .inspector-value input[type='text'],
.inspector .inspector-value input[type='number'] {
    width: 100%;
    box-sizing: border-box;
    padding: var(--diagram-ui-control-padding-y, 3px) var(--diagram-ui-control-padding-x, 6px);
    border: var(--diagram-ui-border-width, 1px) solid var(--diagram-ui-border, rgba(15, 23, 42, 0.15));
    border-radius: var(--diagram-ui-control-radius, 6px);
    background: var(--diagram-ui-surface, rgba(255, 255, 255, 0.88));
    color: var(--diagram-ui-text, #1f2937);
    font: var(--diagram-ui-font-size, 12px)/1.4 var(--diagram-ui-font-family, 'Helvetica Neue', Helvetica, Arial, sans-serif);
    outline: none;
    appearance: none;
}
.inspector .inspector-value input[type='text']:focus,
.inspector .inspector-value input[type='number']:focus {
    border-color: var(--diagram-ui-border-strong, rgba(15, 118, 110, 0.45));
}
.inspector .inspector-value input[type='text']:read-only,
.inspector .inspector-value input[type='number']:read-only {
    background: transparent;
    border-color: transparent;
    color: var(--diagram-ui-text-muted, #334155);
    cursor: default;
}
.inspector .inspector-value input[type='checkbox'] {
    width: 14px;
    height: 14px;
    accent-color: var(--diagram-ui-accent, #0f766e);
    cursor: pointer;
}
.inspector .inspector-value.is-mixed input {
    color: var(--diagram-ui-text-muted, #94a3b8);
    font-style: italic;
}
`;

function ensureDefaultStyles(): void {
    injectStyles(STYLE_ID, DEFAULT_STYLES);
}

// ============================================================
// Interfaces
// ============================================================

export type InspectorEditorClassName = string & {};

export interface InspectorPropertyDefinition {
    key: string;
    label?: string;
    type: 'string' | 'number' | 'boolean' | 'select';
    editor?: InspectorEditorClassName;
    editorOptions?: object;
    readonly: boolean;
    disabled?: boolean;
}

export interface InspectorPropertyData {
    key: string;
    values: Set<unknown>;
}

export type EditableRecord = Record<string, unknown>;

export interface InspectorEditorInit {
    readonly: boolean;
    def: InspectorPropertyDefinition;
}

export type InspectorValueEditorClass = new (
    cell: HTMLElement,
    mixedClassName: string,
    initial: InspectorEditorInit,
) => InspectorValueEditor;

// ============================================================
// InspectorValueEditor — base class for all inspector row editors
// ============================================================

export abstract class InspectorValueEditor {

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
    }

    /** Registers a single handler called whenever the user changes the value in the control. */
    public setChangeHandler(handler: ((value: unknown) => void) | null): void {
        this.changeHandler = handler;
    }

    /** Called by subclass DOM listeners to propagate a user-driven change. */
    protected notifyChange(value: unknown): void {
        this.changeHandler?.(value);
    }

    public extractValueFrom(record: EditableRecord, key?: string): { key: string; value: unknown } {
        if (key && record) {
            return { key, value: record[key] };
        } else {
            key = Object.keys(record)[0];
            return key ? { key, value: record[key] } : { key: '', value: undefined };
        }
    }

    public destroy(): void {
        this.changeHandler = null;
    }
}

class CheckboxEditor extends InspectorValueEditor {

    private readonly input: HTMLInputElement;

    constructor(cell: HTMLElement, mixedClassName: string, initial: InspectorEditorInit) {
        super(cell, mixedClassName);
        this.input = document.createElement('input');
        this.input.type = 'checkbox';
        this.input.disabled = initial.readonly;
        cell.appendChild(this.input);
        this.input.addEventListener('change', () => this.notifyChange(this.input.checked));
    }

    override showValue(editable: EditableRecord): void {
        const { key, value } = this.extractValueFrom(editable);
        this.returnKey = key;
        this.input.checked = Boolean(value);
    }

    override getValue(): EditableRecord {
        return { [this.returnKey ?? '']: this.input.checked };
    }
}

class TextInputEditor extends InspectorValueEditor {

    private readonly input: HTMLInputElement;

    constructor(cell: HTMLElement, mixedClassName: string, initial: InspectorEditorInit) {
        super(cell, mixedClassName);
        this.input = document.createElement('input');
        this.input.type = 'text';
        this.input.readOnly = initial.readonly;
        cell.appendChild(this.input);
        this.input.addEventListener('input', () => this.notifyChange(this.input.value));
    }

    override showValue(editable: EditableRecord): void {
        const { key, value } = this.extractValueFrom(editable);
        this.returnKey = key;
        this.input.value = value !== undefined && value !== null ? String(value) : '';
        this.input.placeholder = '';
    }

    override getValue(): EditableRecord {
        return { [this.returnKey ?? '']: this.input.value };
    }
}

class NumberInputEditor extends InspectorValueEditor {

    private readonly input: HTMLInputElement;

    constructor(cell: HTMLElement, mixedClassName: string, initial: InspectorEditorInit) {
        super(cell, mixedClassName);
        this.input = document.createElement('input');
        this.input.type = 'number';
        this.input.readOnly = initial.readonly;
        cell.appendChild(this.input);
        this.input.addEventListener('input', () => {
            const parsed = Number(this.input.value);
            if (this.input.value === '') {
                this.notifyChange(undefined);
                return;
            }
            if (Number.isFinite(parsed)) {
                this.notifyChange(parsed);
            }
        });
    }

    override showValue(editable: EditableRecord): void {
        const { key, value } = this.extractValueFrom(editable);
        this.returnKey = key;
        this.input.value = value !== undefined && value !== null ? String(value) : '';
        this.input.placeholder = '';
    }

    override getValue(): EditableRecord {
        const parsed = Number(this.input.value);
        return { [this.returnKey ?? '']: Number.isFinite(parsed) ? parsed : undefined };
    }
}

// ============================================================
// Inspector base class
// ============================================================

export class Inspector {

    private static editorRegistry: Map<string, InspectorValueEditorClass> = new Map();

    public static registerEditor(name: string, editorClass: InspectorValueEditorClass): void {
        Inspector.editorRegistry.set(name, editorClass);
    }

    public static unregisterEditor(name: string): void {
        Inspector.editorRegistry.delete(name);
    }

    public static getEditor(name: string): InspectorValueEditorClass | undefined {
        return Inspector.editorRegistry.get(name);
    }

    protected host: HTMLElement;

    protected config: Required<InspectorConfig>;

    protected definitions: { [key: string]: InspectorPropertyDefinition } = {};

    protected data: InspectorPropertyData[] = [];

    constructor(target: HTMLElement, config: InspectorConfig = {}) {
        ensureDefaultStyles();
        this.host = target;
        this.config = { ...DEFAULT_CONFIG, ...config };
        setClasses(this.host, DEFAULT_CONFIG.hostClassName, this.config.hostClassName);
    }

    /**
     * Releases DOM and event resources owned by the control.
     */
    public destroy(): void {
        this.host.innerHTML = '';
    }

    /**
     * Registers a property definition that can be rendered into a row.
     */
    public defineProperty(def: InspectorPropertyDefinition): void {
        this.definitions[def.key] = def;
    }

    // ============================================================
    // DOM helpers for subclasses
    // ============================================================

    /**
     * Creates a collapsible section element with a heading and a two-column property grid inside.
     * Returns the section root and the inner grid so rows can be appended to it.
     */
    protected buildSection(heading: string): { section: HTMLElement; grid: HTMLElement } {
        const section = document.createElement('div');
        setClasses(section, DEFAULT_CONFIG.sectionClassName, this.config.sectionClassName);

        const h = document.createElement('div');
        setClasses(h, DEFAULT_CONFIG.headingClassName, this.config.headingClassName);
        h.textContent = heading;
        h.addEventListener('click', () => section.classList.toggle('is-collapsed'));
        section.appendChild(h);

        const grid = document.createElement('div');
        setClasses(grid, DEFAULT_CONFIG.gridClassName, this.config.gridClassName);
        section.appendChild(grid);

        this.host.appendChild(section);
        return { section, grid };
    }

    /**
     * Creates and appends a label + control row into the given grid.
     * Returns the value cell so callers can populate it with a specific control.
     */
    protected buildRow(grid: HTMLElement, def: InspectorPropertyDefinition): HTMLElement {
        const label = document.createElement('div');
        setClasses(label, DEFAULT_CONFIG.labelClassName, this.config.labelClassName);
        label.textContent = def.label ?? def.key;
        label.title = def.label ?? def.key;

        const value = document.createElement('div');
        setClasses(value, DEFAULT_CONFIG.valueClassName, this.config.valueClassName);

        grid.appendChild(label);
        grid.appendChild(value);

        // Wrap both cells in a logical row via data attribute for later queries
        label.dataset['rowKey'] = def.key;
        value.dataset['rowKey'] = def.key;

        if (def.readonly) {
            label.classList.add(this.config.readonlyClassName);
            value.classList.add(this.config.readonlyClassName);
        }
        if (def.disabled) {
            label.classList.add(this.config.disabledClassName);
            value.classList.add(this.config.disabledClassName);
        }

        return value;
    }

    /**
     * Creates the appropriate InspectorValueEditor for the given property definition
     * and mounts it into the value cell.
     */
    protected buildEditor(cell: HTMLElement, def: InspectorPropertyDefinition): InspectorValueEditor {
        const initial: InspectorEditorInit = {
            readonly: def.readonly,
            def,
        };

        if (def.editor) {
            const editorClass = Inspector.getEditor(def.editor);
            if (editorClass) {
                return new editorClass(cell, this.config.mixedClassName, initial);
            }
        }

        if (def.type === 'boolean') return new CheckboxEditor(cell, this.config.mixedClassName, initial);
        if (def.type === 'number') return new NumberInputEditor(cell, this.config.mixedClassName, initial);
        return new TextInputEditor(cell, this.config.mixedClassName, initial);
    }
}