import { injectStyles, setClasses } from "../editor.utils";
import { DefaultInspectorAdapter, registerNativeInspectorAdapters } from "./native.adapters";
import { InspectorAdapter, type EditableRecord, type InspectorAdapterInit } from "./inspector.adapter";

export { InspectorAdapter } from "./inspector.adapter";
export type { EditableRecord, InspectorAdapterInit } from "./inspector.adapter";

// ============================================================
// Config
// ============================================================

/**
 * Configuration options for the Inspector control.
 * Provide only the properties you want to override; defaults will be used for the rest.
 */
export interface InspectorConfig {
    /**
     * Optional class name for the host element.
     */
    hostClassName?: string;
    /**
     * Optional class name for each section element.
     */
    sectionClassName?: string;
    /**
     * Optional class name for each section heading element.
     */
    headingClassName?: string;
    /**
     * Optional class name for the properties grid element inside each section.
     */
    gridClassName?: string;
    /**
     * Optional class name for each row (label + control pair) element.
     */
    rowClassName?: string;
    /**
     * Optional class name for label elements.
     */
    labelClassName?: string;
    /**
     * Optional class name for value/control elements.
     */
    valueClassName?: string;
    /**
     * Optional class name applied to rows that are read-only.
     */
    readonlyClassName?: string;
    /**
     * Optional class name applied to rows that are disabled (e.g. mixed multi-selection).
     */
    disabledClassName?: string;
    /**
     * Optional class name applied to value elements that show a mixed/multi state placeholder.
     */
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
    align-items: stretch;
    width: 300px;
    min-width: 300px;
    --inspector-base: 15, 118, 110;
    --inspector-header-bg: rgba(var(--inspector-base), 0.14);
    --inspector-header-border: rgba(var(--inspector-base), 0.34);
    --inspector-label-bg: rgba(var(--inspector-base), 0.08);
    --inspector-value-bg: rgba(var(--inspector-base), 0.03);
    --inspector-caret-ease: cubic-bezier(0.2, 0.75, 0.25, 1);
    gap: var(--diagram-ui-group-gap, 4px);
    padding: var(--diagram-ui-panel-padding, 6px);
    font: var(--diagram-ui-font-size, 12px)/1.4 var(--diagram-ui-font-family, system-ui);
    color: var(--diagram-ui-text, #1f2937);
    background: var(--diagram-ui-surface, rgba(255, 255, 255, 0.88));
    overflow-y: auto;
    box-sizing: border-box;
}

/* Section */
.inspector .inspector-section {
    display: flex;
    flex-direction: column;
    flex: 0 0 auto;
    gap: 0;
}

/* Collapsible body wrapper — uses grid-template-rows so overflow can be cleared after expand */
.inspector .inspector-section-body {
    display: grid;
    grid-template-rows: 1fr;
    transition: grid-template-rows 0.26s var(--inspector-caret-ease);
}
.inspector .inspector-section.is-collapsed .inspector-section-body {
    grid-template-rows: 0fr;
}

/* Section heading */
.inspector .inspector-heading {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 6px 8px;
    font: 600 var(--diagram-ui-label-font-size, 11px)/1.2 var(--diagram-ui-font-family, system-ui);
    color: rgba(var(--inspector-base), 1);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    border: var(--diagram-ui-border-width, 1px) solid var(--inspector-header-border);
    border-radius: var(--inspector-heading-radius, 5px);
    background: var(--inspector-header-bg);
    margin-bottom: 0;
    cursor: default;
    user-select: none;
    transition: background-color 0.22s ease, border-color 0.22s ease, color 0.22s ease;
}
.inspector .inspector-heading::before {
    content: '';
    width: 3px;
    height: 3px;
    border-right: 2px solid currentColor;
    border-bottom: 2px solid currentColor;
    margin-inline-end: 2px;
    transform: rotate(45deg);
    transform-origin: 50% 50%;
    transition: transform 0.26s var(--inspector-caret-ease);
}
.inspector .inspector-section.is-collapsed .inspector-heading::before {
    transform: rotate(-45deg);
}

/* Two-column property grid */
.inspector .inspector-grid {
    display: grid;
    grid-template-columns: var(--inspector-label-width, 80px) minmax(0, 1fr);
    row-gap: 2px;
    column-gap: var(--diagram-ui-control-gap, 8px);
    align-items: start;
    padding: 6px 6px;
    background: color-mix(in srgb, var(--inspector-value-bg) 60%, white 40%);
    border-top: none;
    min-height: 0;
    opacity: 1;
    transition: opacity 0.22s ease, padding 0.26s var(--inspector-caret-ease);
}

.inspector .inspector-section.is-collapsed .inspector-grid {
    opacity: 0;
    padding-top: 0;
    padding-bottom: 0;
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
    font: 600 var(--diagram-ui-label-font-size, 11px)/1.2 var(--diagram-ui-font-family, system-ui);
    color: color-mix(in srgb, rgba(var(--inspector-base), 1) 70%, #0f172a 30%);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    padding: 8px 6px;
    min-height: 26px;
    display: flex;
    align-items: center;
    border-radius: 6px;
    background: var(--inspector-label-bg);
}

/* Value / control cell */
.inspector .inspector-value {
    display: flex;
    align-items: stretch;
    min-height: 26px;
    position: relative;
    border-radius: 6px;
    background: var(--inspector-value-bg);
    padding: 2px;
}
.inspector .inspector-value input[type='text'],
.inspector .inspector-value input[type='number'],
.inspector .inspector-value textarea {
    width: 100%;
    box-sizing: border-box;
    padding: var(--diagram-ui-control-padding-y, 3px) var(--diagram-ui-control-padding-x, 6px);
    border: var(--diagram-ui-border-width, 1px) solid var(--diagram-ui-border, rgba(15, 23, 42, 0.15));
    border-radius: var(--diagram-ui-control-radius, 6px);
    background: var(--diagram-ui-surface, rgba(255, 255, 255, 0.88));
    color: var(--diagram-ui-text, #1f2937);
    font: var(--diagram-ui-font-size, 12px)/1.4 var(--diagram-ui-font-family, system-ui);
    outline: none;
    appearance: none;
}
.inspector .inspector-value input[type='text']:focus,
.inspector .inspector-value input[type='number']:focus,
.inspector .inspector-value textarea:focus {
    border-color: var(--diagram-ui-border-strong, rgba(15, 118, 110, 0.45));
}
.inspector .inspector-value input[type='text']:read-only,
.inspector .inspector-value input[type='number']:read-only,
.inspector .inspector-value textarea:read-only {
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
.inspector .inspector-value.is-mixed input,
.inspector .inspector-value.is-mixed textarea {
    color: var(--diagram-ui-text-muted, #94a3b8);
    font-style: italic;
}
.inspector .inspector-value.is-mixed .color-preset-trigger,
.inspector .inspector-value.is-mixed .font-select-trigger,
.inspector .inspector-value.is-mixed .image-select-trigger {
    position: relative;
}
.inspector .inspector-value.is-unset .color-preset-trigger,
.inspector .inspector-value.is-unset .font-select-trigger,
.inspector .inspector-value.is-unset .image-select-trigger {
    position: relative;
}
.inspector .inspector-value.is-mixed .color-preset-trigger > *,
.inspector .inspector-value.is-mixed .font-select-trigger > *,
.inspector .inspector-value.is-mixed .image-select-trigger > * {
    opacity: 0;
}
.inspector .inspector-value.is-unset .color-preset-trigger > *,
.inspector .inspector-value.is-unset .font-select-trigger > *,
.inspector .inspector-value.is-unset .image-select-trigger > * {
    opacity: 0;
}
.inspector .inspector-value.is-mixed .color-preset-trigger::after,
.inspector .inspector-value.is-mixed .font-select-trigger::after,
.inspector .inspector-value.is-mixed .image-select-trigger::after {
    content: 'Multiple';
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    padding: 0 8px;
    color: var(--diagram-ui-text-muted, #94a3b8);
    font-style: italic;
    pointer-events: none;
}
.inspector .inspector-value.is-unset .color-preset-trigger::after,
.inspector .inspector-value.is-unset .font-select-trigger::after,
.inspector .inspector-value.is-unset .image-select-trigger::after {
    content: '\\00A0';
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    padding: 0 8px;
    pointer-events: none;
}
/* Row-level visibility controlled by isVisible() */
.inspector [data-row-key].is-hidden {
    display: none;
}
/* Section auto-hide when all rows are hidden */
.inspector .inspector-section.is-hidden {
    display: none;
}
/* Inspector-wide selection states */
.inspector.inspector-selection-mixed .inspector-heading {
    color: var(--diagram-ui-text, #0f172a);
}
`;

function ensureDefaultStyles(): void {
    injectStyles(STYLE_ID, DEFAULT_STYLES);
}

// ============================================================
// Interfaces
// ============================================================

export type InspectorAdapterClassName = string & {};

/**
 * Defines how a single inspector row is rendered and edited.
 */
export interface InspectorPropertyDefinition {
    /**
     * Unique key/path used to read and write the property.
     */
    key: string;
    /**
     * Optional display label shown in the inspector row.
     */
    label?: string;
    /**
     * Primitive value category used for adapter resolution.
     */
    type: 'string' | 'number' | 'boolean' | 'select' | 'object';
    /**
     * Optional explicit adapter/editor name overriding type-based resolution.
     */
    editor?: InspectorAdapterClassName;
    /**
     * Optional editor-specific configuration object passed to the adapter.
     */
    editorOptions?: object;
    /**
     * Marks the row as read-only.
     */
    readonly: boolean;
    /**
     * Marks the row as disabled.
     */
    disabled?: boolean;
    /**
     * Marks the row as volatile so it can be rebuilt for selection-specific structures.
     */
    volatile?: boolean;
    /**
     * Optional callback evaluated on every refresh. When it returns false the row is hidden.
     * If omitted the row is always visible.
     */
    isVisible?: () => boolean;
}

/**
 * Aggregated value set for one property across the current selection.
 */
export interface InspectorPropertyData {
    /**
     * Property key associated with this value collection.
     */
    key: string;
    /**
     * Unique set of collected values from selected objects.
     */
    values: Set<unknown>;
}

export type InspectorSelectionState = 'none' | 'single' | 'mixed';

export type InspectorAdapterClass = new (
    cell: HTMLElement,
    mixedClassName: string,
    initial: InspectorAdapterInit,
) => InspectorAdapter;

// ============================================================
// Inspector base class
// ============================================================

/**
 * Generic sectioned inspector that renders property rows and syncs adapter values.
 */
export class Inspector {

    private static adapterRegistry: Map<string, InspectorAdapterClass> = new Map();

    /**
     * Registers an adapter class under a given name for later resolution by adapter/type name.
     * @param name Lookup key used in property definitions.
     * @param adapterClass The adapter constructor to register.
     */
    public static registerAdapter(name: string, adapterClass: InspectorAdapterClass): void {
        Inspector.adapterRegistry.set(name, adapterClass);
    }

    // /**
    //  * Alias for {@link registerAdapter}; kept for backwards compatibility.
    //  * @param name Lookup key used in property definitions.
    //  * @param editorClass The adapter constructor to register.
    //  */
    // public static registerEditor(name: string, editorClass: InspectorAdapterClass): void {
    //     Inspector.registerAdapter(name, editorClass);
    // }

    /**
     * Evaluates every row's isVisible() callback and toggles the 'is-hidden' CSS class on
     * its label and value cells. Also hides sections whose every row is hidden.
     * Subclasses may override to apply additional visibility rules.
     */
    protected syncRowVisibility(): void {
        for (const [key, def] of Object.entries(this.definitions)) {
            const visible = def.isVisible ? def.isVisible() : true;
            this.host.querySelectorAll<HTMLElement>(`[data-row-key="${key}"]`)
                .forEach(el => el.classList.toggle('is-hidden', !visible));
        }
        // Auto-hide sections where every row cell is hidden.
        for (const section of this.host.querySelectorAll<HTMLElement>(`.${DEFAULT_CONFIG.sectionClassName}`)) {
            const rows = section.querySelectorAll<HTMLElement>('[data-row-key]');
            const anyVisible = [...rows].some(r => !r.classList.contains('is-hidden'));
            section.classList.toggle('is-hidden', !anyVisible);
        }
    }

    /**
     * Removes a previously registered adapter by name.
     * @param name The lookup key of the adapter to remove.
     */
    public static unregisterAdapter(name: string): void {
        Inspector.adapterRegistry.delete(name);
    }

    // /**
    //  * Alias for {@link unregisterAdapter}; kept for backwards compatibility.
    //  * @param name The lookup key of the adapter to remove.
    //  */
    // public static unregisterEditor(name: string): void {
    //     Inspector.unregisterAdapter(name);
    // }

    /**
     * Returns the adapter class registered under a given name, or undefined if not found.
     * @param name The lookup key.
     * @returns The registered adapter class, or undefined.
     */
    public static getAdapter(name: string): InspectorAdapterClass | undefined {
        return Inspector.adapterRegistry.get(name);
    }

    // /**
    //  * Alias for {@link getAdapter}; kept for backwards compatibility.
    //  * @param name The lookup key.
    //  * @returns The registered adapter class, or undefined.
    //  */
    // public static getEditor(name: string): InspectorAdapterClass | undefined {
    //     return Inspector.getAdapter(name);
    // }

    protected host: HTMLElement;

    protected config: Required<InspectorConfig>;

    protected readonly: boolean = false;

    protected definitions: { [key: string]: InspectorPropertyDefinition } = {};

    // Adapter bindings keyed by property key.
    protected adapters: Map<string, InspectorAdapter> = new Map();

    // Prevent feedback loops while pushing model values into controls.
    protected syncingAdapters: boolean = false;

    protected data: InspectorPropertyData[] = [];

    // Value cells keyed by property key, for targeted updates.
    protected cells: Map<string, HTMLElement> = new Map();

    /**
     * Creates an inspector mounted inside the given element.
     * @param target The host element that will contain the inspector.
     * @param config Optional style/class overrides for the inspector layout.
     */
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
     * Registers built-in native adapters. Subclasses override to add domain-specific adapters.
     */
    protected registerAdapters(): void {
        registerNativeInspectorAdapters(Inspector.registerAdapter);
    }

    /**
     * Registers a property definition that can be rendered into a row.
     */
    public defineProperty(def: InspectorPropertyDefinition): void {
        this.definitions[def.key] = def;
    }

    /**
     * Registers a property definition and immediately builds its row in the given grid.
     * Stores the value cell for targeted updates by refresh().
     */
    protected addRow(grid: HTMLElement, def: InspectorPropertyDefinition): void {
        this.defineProperty(def);
        const cell = this.buildRow(grid, def);
        const adapter = this.buildAdapter(cell, def);
        if (!def.readonly) {
            adapter.setChangeHandler((value) => {
                if (this.syncingAdapters) return;
                this.onAdapterValueChanged(def, value);
            });
        }
        this.cells.set(def.key, cell);
        this.adapters.set(def.key, adapter);
    }

    /**
     * Hook for subclasses to apply model changes when an adapter emits a user edit.
     */
    protected onAdapterValueChanged(_def: InspectorPropertyDefinition, _value: unknown): void {
        // Subclasses override when they support writing changes back to a model.
    }

    /**
     * Derives the overall selection state from the item count and value diversity.
     * @param selectedCount Number of currently selected nodes.
     * @param values Per-key value sets collected from the selection.
     * @returns 'none', 'single', or 'mixed'.
     */
    protected resolveSelectionState(selectedCount: number, values: Record<string, Set<unknown>>): InspectorSelectionState {
        if (selectedCount === 0) {
            return 'none';
        }

        for (const set of Object.values(values)) {
            if (set.size > 1) {
                return 'mixed';
            }
        }

        return 'single';
    }

    /**
     * Applies selection-state CSS classes to the inspector host element.
     * @param state The current selection state to reflect.
     */
    protected applySelectionState(state: InspectorSelectionState): void {
        this.host.classList.toggle('inspector-selection-none', state === 'none');
        this.host.classList.toggle('inspector-selection-single', state === 'single');
        this.host.classList.toggle('inspector-selection-mixed', state === 'mixed');
    }

    /**
     * Reads a value from a flat or nested record using the registered adapter for the key.
     * Falls back to dot-path traversal if no adapter is registered.
     * @param record The source data record.
     * @param key The property key, supporting dot-separated paths.
     * @returns The resolved value, or undefined if not found.
     */
    protected readRecordValue(record: EditableRecord, key: string): unknown {
        const adapter = this.adapters.get(key);
        return adapter?.extractValueFrom(record, key).value ?? this.getPathValue(record, key);
    }

    /**
     * Traverses a dot-separated path inside a record and returns the leaf value.
     * @param record The root record to traverse.
     * @param path Dot-separated property path, e.g. 'shadowStyle.offset.x'.
     * @returns The value at the path, or undefined if any segment is missing.
     */
    protected getPathValue(record: EditableRecord, path: string): unknown {
        const segments = path.split('.').filter((segment) => segment.length > 0);
        let current: any = record;
        for (const segment of segments) {
            if (current == null) {
                return undefined;
            }
            current = current[segment];
        }
        return current;
    }

    /**
     * Adds a value to a set while deduplicating object values by shallow first-level comparison.
     */
    protected addComparableValue(set: Set<unknown>, value: unknown): void {
        if (!value || typeof value !== 'object') {
            set.add(value);
            return;
        }

        for (const existing of set) {
            if (!existing || typeof existing !== 'object') {
                continue;
            }
            if (this.shallowObjectEquals(existing as Record<string, unknown>, value as Record<string, unknown>)) {
                return;
            }
        }

        set.add(value);
    }

    /**
     * Compares two objects using only first-level keys and values.
     */
    protected shallowObjectEquals(a: Record<string, unknown>, b: Record<string, unknown>): boolean {
        const aKeys = Object.keys(a);
        const bKeys = Object.keys(b);
        if (aKeys.length !== bKeys.length) {
            return false;
        }

        for (const key of aKeys) {
            if (!(key in b)) {
                return false;
            }
            if (this.valueToken(a[key]) !== this.valueToken(b[key])) {
                return false;
            }
        }

        return true;
    }

    /**
     * Generates a stable token for first-level value comparison.
     */
    protected valueToken(value: unknown): string {
        if (value === null) {
            return 'null';
        }
        const type = typeof value;
        if (type === 'undefined') {
            return 'undefined';
        }
        if (type === 'string' || type === 'number' || type === 'boolean' || type === 'bigint') {
            return `${type}:${String(value)}`;
        }
        if (type === 'object') {
            try {
                return `object:${JSON.stringify(value)}`;
            } catch {
                return 'object:[unserializable]';
            }
        }
        return type;
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
        section.appendChild(h);

        const body = document.createElement('div');
        body.className = 'inspector-section-body';
        section.appendChild(body);

        const grid = document.createElement('div');
        setClasses(grid, DEFAULT_CONFIG.gridClassName, this.config.gridClassName);
        body.appendChild(grid);

        h.addEventListener('click', () => {
            const collapsing = !section.classList.contains('is-collapsed');
            if (collapsing) {
                body.style.overflow = 'hidden';
                section.classList.add('is-collapsed');
            } else {
                body.style.overflow = 'hidden';
                section.classList.remove('is-collapsed');
                body.addEventListener('transitionend', () => {
                    body.style.overflow = '';
                }, { once: true });
            }
        });

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
     * Removes all rows marked as volatile from the given grid.
     * Returns the removed keys so subclasses can clear any companion maps.
     */
    protected removeVolatileRowsFromGrid(grid: HTMLElement): string[] {
        const removed: string[] = [];
        for (const [key, def] of Object.entries(this.definitions)) {
            if (!def.volatile) {
                continue;
            }

            const nodes = grid.querySelectorAll<HTMLElement>(`[data-row-key="${key}"]`);
            nodes.forEach((node) => node.remove());
            delete this.definitions[key];
            removed.push(key);
        }
        return removed;
    }

    /**
     * Creates the appropriate inspector adapter for the given property definition
     * and mounts it into the value cell.
     */
    protected buildAdapter(cell: HTMLElement, def: InspectorPropertyDefinition): InspectorAdapter {
        const initial: InspectorAdapterInit = {
            readonly: def.readonly,
            def,
        };

        const adapterName = def.editor ?? def.type;
        const adapterClass = Inspector.getAdapter(adapterName);
        if (adapterClass) {
            return new adapterClass(cell, this.config.mixedClassName, initial);
        }

        return new DefaultInspectorAdapter(cell, this.config.mixedClassName, initial);
    }

}