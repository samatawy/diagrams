import type { INode } from "../../interfaces";
import type { ITextOrientation } from "../../types";
import type { DiagramView } from "../../view";
import { DiagramEditView } from "../../editview";
import { DIAGRAM_CHANGED_EVENT, DIAGRAM_NODE_GEOMETRY_ALTERED_EVENT, DIAGRAM_NODE_POINTS_CHANGED_EVENT, DIAGRAM_SELECTION_EVENT } from "../../events";
import { isConnection } from "../../guards";
import { NodeRegistry } from "../../factory/node.registry";

import { Inspector, type InspectorConfig, type InspectorPropertyDefinition, type EditableRecord } from "./inspector";
import type { ColorSelectConfig } from "../inputs/color.select";
import type { WidthSelectConfig } from "../inputs/width.select";
import type { ArrowSelectConfig } from "../inputs/arrow.select";
import type { DashSelectConfig } from "../inputs/dash.select";
import type { FontSelectConfig } from "../inputs/font.select";
import type { SizeSelectConfig } from "../inputs/size.select";
import { ColorSelectAdapter } from "./color.select.adapter";
import { WidthSelectAdapter } from "./width.select.adapter";
import { ArrowSelectAdapter } from "./arrow.select.adapter";
import { DashSelectAdapter } from "./dash.select.adapter";
import { FontSelectAdapter } from "./font.select.adapter";
import { SizeSelectAdapter } from "./size.select.adapter";
import { AngleAdapter } from "./angle.adapter";
import { EnumSelectAdapter, type EnumSelectAdapterConfig } from "./enum.select.adapter";
import { PointAdapter } from "./point.adapter";
import { ImageSelectAdapter } from "./image.select.adapter";
import type { NumberInputAdapterConfig } from "./number.input.adapter";
import { MetaAddAdapter, MetaValueAdapter, type MetaAddChange, type MetaDeleteChange } from "./meta.kv.adapters";
import { humanize } from "../../value.utils";

export type DiagramInspectorConfig = InspectorConfig & {
    colorSelect?: ColorSelectConfig;
    strokeColor?: ColorSelectConfig;
    fillColor?: ColorSelectConfig;
    textColor?: ColorSelectConfig;
    shadowColor?: ColorSelectConfig;
    widthSelect?: WidthSelectConfig;
    dashSelect?: DashSelectConfig;
    arrowSelect?: ArrowSelectConfig;
    fontSelect?: FontSelectConfig;
    sizeSelect?: SizeSelectConfig;
    textAlignOptions?: EnumSelectAdapterConfig['options'];
    textBaselineOptions?: EnumSelectAdapterConfig['options'];
};

/**
 * Diagram-specific inspector that wires editor sections to the active diagram selection.
 */
export class DiagramInspector extends Inspector {

    protected diagram: DiagramView;

    protected inspectorConfig: DiagramInspectorConfig;

    private geometryGrid?: HTMLElement;
    private metaGrid?: HTMLElement;
    private diagramMetaGrid?: HTMLElement;
    private pendingMetaValueFocusPath?: string;

    /**
     * Creates a DiagramInspector bound to the given diagram view.
     * @param target The host element that will contain the inspector.
     * @param diagram The diagram view to observe and edit.
     * @param config Optional inspector and adapter configuration.
     */
    constructor(target: HTMLElement, diagram: DiagramView, config: DiagramInspectorConfig = {}) {
        super(target, config);
        this.diagram = diagram;
        this.inspectorConfig = config;
        this.readonly = !(diagram instanceof DiagramEditView);

        this.registerAdapters();
        this.initialize();
        this.bindDiagramEvents();
    }

    /**
     * Clears inspector DOM and internal button references.
     */
    public override destroy(): void {
        this.unbindDiagramEvents();
        for (const adapter of this.adapters.values()) {
            adapter.destroy();
        }
        this.adapters.clear();
        super.destroy();
    }

    /**
     * Registers diagram-specific adapters in addition to the native ones.
     */
    protected override registerAdapters(): void {
        super.registerAdapters();

        Inspector.registerAdapter('ColorSelect', ColorSelectAdapter);
        Inspector.registerAdapter('WidthSelect', WidthSelectAdapter);
        Inspector.registerAdapter('ArrowSelect', ArrowSelectAdapter);
        Inspector.registerAdapter('DashSelect', DashSelectAdapter);
        Inspector.registerAdapter('FontSelect', FontSelectAdapter);
        Inspector.registerAdapter('SizeSelect', SizeSelectAdapter);
        Inspector.registerAdapter('Point', PointAdapter);
        Inspector.registerAdapter('AngleEditor', AngleAdapter);
        Inspector.registerAdapter('EnumSelect', EnumSelectAdapter);
        Inspector.registerAdapter('ImageSelect', ImageSelectAdapter);
        Inspector.registerAdapter('MetaValue', MetaValueAdapter);
        Inspector.registerAdapter('MetaAdd', MetaAddAdapter);
    }

    /**
     * Builds all static inspector sections and rows during construction.
     */
    protected initialize(): void {
        const readonly = this.readonly;
        const selected = () => this.diagram.selection();
        const hasSelected = () => selected().length > 0;
        const noSelection = () => selected().length === 0;
        const hasConnections = () => selected().some((node) => isConnection(node));
        const hasNonConnections = () => selected().some((node) => !isConnection(node));

        // ---- Diagram section (visible only when nothing is selected) ----
        const { grid: diagramGrid } = this.buildSection('Diagram', 'expanded');
        this.addRow(diagramGrid, {
            key: 'diagram.id',
            label: 'ID',
            type: 'string',
            readonly: true,
            isVisible: noSelection,
        });
        this.addRow(diagramGrid, {
            key: 'diagram.background',
            label: 'Background',
            type: 'string',
            editor: 'ColorSelect',
            editorOptions: { ...(this.inspectorConfig.colorSelect || {}), allowEmpty: true },
            readonly: readonly,
            isVisible: noSelection,
        });
        const { grid: diagramMetaGridEl } = this.buildSection('Diagram Metadata', 'expanded');
        this.diagramMetaGrid = diagramMetaGridEl;
        this.addRow(diagramMetaGridEl, {
            key: 'diagram.meta.__add',
            label: 'Add',
            type: 'string',
            editor: 'MetaAdd',
            editorOptions: { basePath: 'diagram.meta', buttonLabel: '+' },
            readonly: readonly,
            isVisible: () => noSelection() && !readonly,
        });

        // ---- Node sections (visible only when at least one node is selected) ----
        const { grid: identity } = this.buildSection('Identity', 'expanded');
        this.addRow(identity, {
            key: 'id',
            label: 'ID',
            type: 'string',
            readonly: true,
            isVisible: hasSelected,
        });
        this.addRow(identity, {
            key: 'type',
            label: 'Type',
            type: 'string',
            readonly: true,
            isVisible: hasSelected,
        });

        const { grid: geometry } = this.buildSection('Geometry', 'collapsed');
        this.geometryGrid = geometry;
        this.addRow(geometry, { key: 'locked', label: 'Locked', type: 'boolean', readonly: readonly, isVisible: hasSelected });
        this.addRow(geometry, { key: 'locked_aspect', label: 'Lock Aspect', type: 'boolean', readonly: readonly, isVisible: hasSelected });
        this.addRow(geometry, {
            key: 'opacity', label: 'Opacity', type: 'number',
            editorOptions: { min: 0, max: 100, precision: 0, defaultWhenUnset: 100 } as NumberInputAdapterConfig,
            readonly: readonly, isVisible: hasSelected,
        });
        this.addRow(geometry, {
            key: 'angle', label: 'Angle', type: 'number',
            editor: 'AngleEditor', editorOptions: { precision: 4 },
            readonly: readonly, isVisible: hasSelected,
        });

        const { grid: text } = this.buildSection('Text', 'collapsed');
        this.addRow(text, {
            key: 'text', label: 'Content', type: 'string',
            editorOptions: { multiline: true },
            readonly: readonly, isVisible: hasSelected
        });
        this.addRow(text, {
            key: 'textStyle.fontFace', label: 'Font Face',
            type: 'string', editor: 'FontSelect',
            editorOptions: this.inspectorConfig.fontSelect || {},
            readonly: readonly, isVisible: hasSelected
        });
        this.addRow(text, {
            key: 'textStyle.size', label: 'Font Size',
            type: 'number', editor: 'SizeSelect',
            editorOptions: this.inspectorConfig.sizeSelect || {},
            readonly: readonly, isVisible: hasSelected
        });
        this.addRow(text, {
            key: 'textStyle.color', label: 'Color',
            type: 'string', editor: 'ColorSelect',
            editorOptions: { ...(this.inspectorConfig.colorSelect || {}), ...(this.inspectorConfig.textColor || {}) },
            readonly: readonly, isVisible: hasSelected
        });
        this.addRow(text, {
            key: 'textStyle.weight', label: 'Weight', type: 'select', editor: 'EnumSelect',
            editorOptions: { options: [100, 200, 300, 400, 500, 600, 700, 800, 900].map((w) => ({ value: w, label: w })) },
            readonly: readonly, isVisible: hasSelected,
        });
        this.addRow(text, { key: 'textStyle.italic', label: 'Italic', type: 'boolean', readonly: readonly, isVisible: hasSelected });
        this.addRow(text, {
            key: 'textStyle.halo', label: 'Halo', type: 'string', editor: 'ColorSelect',
            editorOptions: { ...(this.inspectorConfig.colorSelect || {}), allowEmpty: true, showInheritOption: true },
            readonly: readonly, isVisible: hasSelected,
        });
        this.addRow(text, {
            key: 'textStyle.align', label: 'Align', type: 'select', editor: 'EnumSelect',
            editorOptions: { options: this.inspectorConfig.textAlignOptions || ['left', 'center', 'right'] } as EnumSelectAdapterConfig,
            readonly: readonly, isVisible: hasSelected,
        });
        this.addRow(text, {
            key: 'textStyle.baseline', label: 'Baseline', type: 'select', editor: 'EnumSelect',
            editorOptions: { options: this.inspectorConfig.textBaselineOptions || ['top', 'middle', 'bottom'] } as EnumSelectAdapterConfig,
            readonly: readonly, isVisible: hasSelected,
        });
        this.addRow(text, {
            key: 'textStyle.orientation', label: 'Orientation', type: 'select', editor: 'EnumSelect',
            editorOptions: {
                options: () => {
                    const sel = this.diagram.selection();
                    if (!sel.length) return ['horizontal', 'vertical', 'path'];
                    const ALL: ITextOrientation[] = ['horizontal', 'vertical', 'path'];
                    const perNode = sel.map(n => NodeRegistry.adapter(n.type)?.text_orientations ?? ALL);
                    // Intersection: keep only orientations every selected node supports.
                    return perNode.reduce((acc, cur) => acc.filter(o => cur.includes(o)));
                },
            } as EnumSelectAdapterConfig,
            readonly: readonly, isVisible: hasSelected,
        });

        const { grid: line } = this.buildSection('Line', 'collapsed');
        this.addRow(line, {
            key: 'strokeStyle.color', label: 'Line Color',
            type: 'string', editor: 'ColorSelect',
            editorOptions: { ...(this.inspectorConfig.colorSelect || {}), ...(this.inspectorConfig.strokeColor || {}) },
            readonly: readonly, isVisible: hasSelected
        });
        this.addRow(line, {
            key: 'strokeStyle.width', label: 'Line Width',
            type: 'number', editor: 'WidthSelect',
            editorOptions: this.inspectorConfig.widthSelect || {},
            readonly: readonly, isVisible: hasSelected
        });
        this.addRow(line, {
            key: 'strokeStyle.dash', label: 'Line Style',
            type: 'number', editor: 'DashSelect',
            editorOptions: this.inspectorConfig.dashSelect || {},
            readonly: readonly, isVisible: hasSelected
        });
        this.addRow(line, {
            key: 'strokeStyle.arrow', label: 'Arrow',
            type: 'string', editor: 'ArrowSelect',
            editorOptions: this.inspectorConfig.arrowSelect || {},
            readonly: readonly, isVisible: hasConnections
        });

        const { grid: fill } = this.buildSection('Fill', 'collapsed');
        this.addRow(fill, {
            key: 'fillStyle', label: 'Fill Color',
            type: 'string', editor: 'ColorSelect',
            editorOptions: { ...(this.inspectorConfig.colorSelect || {}), ...(this.inspectorConfig.fillColor || {}) },
            readonly: readonly, isVisible: hasSelected
        });
        this.addRow(fill, {
            key: 'image_id', label: 'Image',
            type: 'string', editor: 'ImageSelect',
            editorOptions: { diagram: this.diagram },
            readonly: readonly, isVisible: hasNonConnections
        });
        this.addRow(fill, {
            key: 'image_mode', label: 'Mode', type: 'select', editor: 'EnumSelect',
            editorOptions: { options: ['contain', 'cover', 'fit', 'pattern', 'none'] } as EnumSelectAdapterConfig,
            readonly: readonly, isVisible: hasNonConnections,
        });
        this.addRow(fill, {
            key: 'image_align', label: 'Align', type: 'select', editor: 'EnumSelect',
            editorOptions: { options: ['left', 'center', 'right', 'top', 'middle', 'bottom', 'top-left', 'top-right', 'bottom-left', 'bottom-right'] } as EnumSelectAdapterConfig,
            readonly: readonly, isVisible: hasNonConnections,
        });
        this.addRow(fill, { key: 'image_padding', label: 'Padding', type: 'number', readonly: readonly, isVisible: hasNonConnections });

        const { grid: shadow } = this.buildSection('Shadow', 'collapsed');
        this.addRow(shadow, {
            key: 'shadowStyle.color',
            label: 'Color',
            type: 'string',
            editor: 'ColorSelect',
            editorOptions: {
                ...(this.inspectorConfig.colorSelect || {}),
                ...(this.inspectorConfig.shadowColor || {}),
                showInheritOption: true,
            },
            readonly: readonly,
            isVisible: hasSelected
        });
        this.addRow(shadow, {
            key: 'shadowStyle.blur', label: 'Blur', type: 'number',
            editorOptions: { min: 0 } as NumberInputAdapterConfig, readonly: readonly, isVisible: hasSelected
        });
        this.addRow(shadow, {
            key: 'shadowStyle.offset.x', label: 'Offset X', type: 'number',
            readonly: readonly, isVisible: hasSelected
        });
        this.addRow(shadow, {
            key: 'shadowStyle.offset.y', label: 'Offset Y', type: 'number',
            readonly: readonly, isVisible: hasSelected
        });

        const { grid: meta } = this.buildSection('Metadata', 'collapsed');
        this.metaGrid = meta;
        this.addRow(meta, {
            key: 'meta.__add',
            label: 'Add',
            type: 'string',
            editor: 'MetaAdd',
            editorOptions: { basePath: 'meta', buttonLabel: '+' },
            readonly: readonly,
            isVisible: () => hasSelected() && !readonly,
        });
    }

    /**
     * Forwards an adapter value change to the inspector apply pipeline.
     * @param def The property definition that changed.
     * @param value The new value emitted by the adapter.
     */
    protected override onAdapterValueChanged(def: InspectorPropertyDefinition, value: unknown): void {
        this.applyInspectorChange(def.key, value);
    }

    // ============================================================
    // Diagram event wiring
    // ============================================================

    /**
     * Subscribes to diagram-level events that should trigger an inspector refresh or row rebuild.
     */
    protected bindDiagramEvents(): void {
        const source = (this.diagram as any).host as HTMLElement | undefined;
        source?.addEventListener(DIAGRAM_CHANGED_EVENT, this.onDiagramChanged);
        source?.addEventListener(DIAGRAM_SELECTION_EVENT, this.onDiagramSelectionChanged);
        source?.addEventListener(DIAGRAM_NODE_POINTS_CHANGED_EVENT, this.onDiagramSelectionChanged);
        source?.addEventListener(DIAGRAM_NODE_GEOMETRY_ALTERED_EVENT, this.onDiagramSelectionChanged);
    }

    /**
     * Unsubscribes all diagram-level event listeners attached by {@link bindDiagramEvents}.
     */
    protected unbindDiagramEvents(): void {
        const source = (this.diagram as any).host as HTMLElement | undefined;
        source?.removeEventListener(DIAGRAM_CHANGED_EVENT, this.onDiagramChanged);
        source?.removeEventListener(DIAGRAM_SELECTION_EVENT, this.onDiagramSelectionChanged);
        source?.removeEventListener(DIAGRAM_NODE_POINTS_CHANGED_EVENT, this.onDiagramSelectionChanged);
        source?.removeEventListener(DIAGRAM_NODE_GEOMETRY_ALTERED_EVENT, this.onDiagramSelectionChanged);
    }

    /**
     * Handles DIAGRAM_CHANGED_EVENT by refreshing displayed adapter values.
     */
    protected onDiagramChanged = (): void => {
        this.refresh();
    }

    /**
     * Handles selection and geometry change events by rebuilding volatile rows then refreshing.
     */
    protected onDiagramSelectionChanged = (): void => {
        this.syncDynamicRows(this.diagram.selection());
        this.refresh();
    }

    // ============================================================
    // Refresh
    // ============================================================

    /**
     * Pushes the latest selection values into all adapter controls.
     */
    protected refresh(): void {
        this.syncingAdapters = true;
        try {
            const selected = this.diagram.selection();
            const colors = this.readonly ? [] : (this.diagram as DiagramEditView).getFrequentColors();

            // Use node values when something is selected; diagram values when empty.
            const values = selected.length > 0
                ? this.collectNodeValues(selected)
                : this.collectDiagramValues();

            const state = this.resolveSelectionState(selected.length, values);
            this.applySelectionState(state);

            for (const [key, cell] of this.cells) {
                const def = this.definitions[key];
                if (!def) continue;

                const valueSet = values[key];
                if (!valueSet || valueSet.size === 0) {
                    this.clearCell(cell, def);
                    continue;
                }

                const adapter = this.adapters.get(key);
                if (!adapter) continue;

                if (adapter instanceof EnumSelectAdapter) {
                    adapter.refreshOptions();
                }

                if (valueSet.size > 1) {
                    adapter.setMixed?.(true);
                } else {
                    const v = [...valueSet][0];
                    const displayValue = key === 'type' && typeof v === 'string'
                        ? humanize(v)
                        : v;
                    cell.classList.remove(this.config.mixedClassName);
                    adapter.setMixed?.(false);
                    adapter.showValue({ [key]: displayValue });
                }
                if (adapter instanceof ColorSelectAdapter) {
                    (adapter as ColorSelectAdapter).setColors(colors);
                }
            }

            this.syncRowVisibility();
            this.schedulePendingMetaValueFocus();
        } finally {
            this.syncingAdapters = false;
        }
    }

    /**
     * Rebuilds volatile rows (points, geometry, meta) to match the current selection.
     * @param selected Currently selected nodes.
     */
    private syncDynamicRows(selected: INode[]): void {
        if (!this.geometryGrid || !this.metaGrid) {
            return;
        }

        const removed = this.removeVolatileRowsFromGrid(this.host);
        for (const key of removed) {
            this.cells.delete(key);
            this.adapters.get(key)?.destroy();
            this.adapters.delete(key);
        }

        if (selected.length === 0) {
            if (this.diagramMetaGrid) {
                for (const def of this.buildDiagramMetaRowDefinitions()) {
                    this.addRow(this.diagramMetaGrid, def);
                }
                this.ensureRowAtEnd(this.diagramMetaGrid, 'diagram.meta.__add');
            }
            return;
        }

        const pointDefs = this.buildPointRowDefinitions(selected);
        for (const def of pointDefs) {
            this.addRow(this.geometryGrid, def);
        }

        const geometryDefs = this.buildGeometryRowDefinitions(selected);
        for (const def of geometryDefs) {
            this.addRow(this.geometryGrid, def);
        }

        const metaDefs = this.buildNodeMetaRowDefinitions(selected);
        for (const def of metaDefs) {
            this.addRow(this.metaGrid, def);
        }
        this.ensureRowAtEnd(this.metaGrid, 'meta.__add');
    }

    /**
     * Returns true when all selected nodes share an identical point array structure.
     * @param selected Currently selected nodes.
     * @returns True if point rows can be safely rendered.
     */
    private canShowPointRows(selected: INode[]): boolean {
        if (!selected.length) {
            return false;
        }

        const signatures = new Set<string>();
        for (const node of selected) {
            const points = Array.isArray((node as any).points) ? (node as any).points as Array<{ x: unknown; y: unknown }> : [];
            signatures.add(JSON.stringify(points.map((p) => [Number((p as any).x), Number((p as any).y)])));
        }

        return signatures.size <= 1;
    }

    /**
     * Builds property definitions for each point in the first selected node.
     * @param selected Currently selected nodes.
     * @returns An array of volatile property definitions for point rows.
     */
    private buildPointRowDefinitions(selected: INode[]): InspectorPropertyDefinition[] {
        if (!this.canShowPointRows(selected)) {
            return [];
        }

        const points = Array.isArray((selected[0] as any).points) ? (selected[0] as any).points as Array<unknown> : [];
        return points.map((_, index) => ({
            key: `points.${index}`,
            label: index === 0 ? 'Points' : '\u00A0',
            type: 'object',
            editor: 'Point',
            editorOptions: { precision: 2 },
            readonly: this.readonly,
            volatile: true,
        }));
    }

    /**
     * Builds property definitions for flat editable keys in each node's geometry container.
     * @param selected Currently selected nodes.
     * @returns An array of volatile property definitions for geometry rows.
     */
    private buildGeometryRowDefinitions(selected: INode[]): InspectorPropertyDefinition[] {
        const keys = this.collectFlatRecordKeys(selected, 'geometry');
        return keys.map((key) => {
            const type = this.resolveFlatValueType(selected, 'geometry', key);
            return {
                key: `geometry.${key}`,
                label: key.length ? `${key[0]!.toUpperCase()}${key.slice(1)}` : key,
                type,
                editorOptions: type === 'number' ? { precision: 4 } : undefined,
                readonly: this.readonly,
                volatile: true,
            };
        });
    }

    /**
     * Builds property definitions for flat editable keys in each node's meta container.
     * @param selected Currently selected nodes.
     * @returns An array of volatile property definitions for meta rows.
     */
    private buildNodeMetaRowDefinitions(selected: INode[]): InspectorPropertyDefinition[] {
        const keys = this.collectFlatRecordKeys(selected, 'meta', false);
        return keys.map((key) => ({
            key: `meta.${key}`,
            label: key,
            type: this.resolveFlatValueType(selected, 'meta', key),
            editor: 'MetaValue',
            readonly: this.readonly,
            volatile: true,
        }));
    }

    /**
     * Builds volatile property definitions for each flat key in the diagram's meta record.
     */
    private buildDiagramMetaRowDefinitions(): InspectorPropertyDefinition[] {
        const meta = (this.diagram as any).meta as Record<string, unknown> | undefined;
        if (!meta || typeof meta !== 'object' || Array.isArray(meta)) return [];
        const noSelection = () => this.diagram.selection().length === 0;
        return Object.entries(meta)
            .filter(([, v]) => typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean')
            .map(([key, v]) => ({
                key: `diagram.meta.${key}`,
                label: key,
                type: (typeof v === 'number' ? 'number' : typeof v === 'boolean' ? 'boolean' : 'string') as 'string' | 'number' | 'boolean',
                editor: 'MetaValue',
                readonly: this.readonly,
                volatile: true,
                isVisible: noSelection,
            }));
    }

    /**
     * Collects the union of all flat string/number/boolean keys from the given container across every selected node.
     * @param selected Currently selected nodes.
     * @param container Either 'geometry' or 'meta'.
     * @param sort Whether to sort keys alphabetically. Defaults to true.
     * @returns Sorted array of unique key names.
     */
    private collectFlatRecordKeys(selected: INode[], container: 'geometry' | 'meta', sort: boolean = true): string[] {
        const keySet = new Set<string>();
        for (const node of selected) {
            const record = (node as any)[container];
            if (!record || typeof record !== 'object' || Array.isArray(record)) {
                continue;
            }

            for (const [key, value] of Object.entries(record as Record<string, unknown>)) {
                if (this.isFlatEditableValue(value)) {
                    keySet.add(key);
                }
            }
        }

        const keys = [...keySet];
        if (sort) {
            keys.sort();
        }
        return keys;
    }

    /**
     * Determines the TypeScript primitive type for a flat container key across the selection.
     * @param selected Currently selected nodes.
    * @param container Either 'geometry' or 'meta'.
     * @param key The flat key to inspect.
     * @returns 'number', 'boolean', or 'string'.
     */
    private resolveFlatValueType(selected: INode[], container: 'geometry' | 'meta', key: string): 'string' | 'number' | 'boolean' {
        for (const node of selected) {
            const record = (node as any)[container] as Record<string, unknown> | undefined;
            const value = record?.[key];
            if (!this.isFlatEditableValue(value)) {
                continue;
            }

            if (typeof value === 'number') {
                return 'number';
            }

            if (typeof value === 'boolean') {
                return 'boolean';
            }

            return 'string';
        }

        return 'string';
    }

    /**
     * Returns true when the value is a string, number, or boolean that can be displayed inline.
     * @param value The value to test.
     * @returns True if the value is a flat editable primitive.
     */
    private isFlatEditableValue(value: unknown): value is string | number | boolean {
        return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean';
    }

    /**
     * Reads the adapter's current value and forwards it to the patch pipeline.
     * @param key The property key that triggered the change.
     * @param value The new value (unused; adapter value is read directly).
     */
    private applyInspectorChange(key: string, value: unknown): void {

        // Special handling for meta objects
        if (this.isMetaAddChange(value)) {
            this.pendingMetaValueFocusPath = value.path;
            const patch: EditableRecord = { [value.path]: '' };
            if (this.diagram.selection().length === 0) {
                this.applyPatchToDiagram(patch, key);
            } else {
                this.applyPatchToSelection(patch, key);
            }
            return;
        }

        if (this.isMetaDeleteChange(value)) {
            const patch: EditableRecord = { [value.path]: undefined };
            if (this.diagram.selection().length === 0) {
                this.applyPatchToDiagram(patch, key);
            } else {
                this.applyPatchToSelection(patch, key);
            }
            return;
        }

        // Default handling for known properties.

        const adapter = this.adapters.get(key);
        const patch = adapter?.getValue();

        const selected = this.diagram.selection();
        if (selected.length === 0) {
            // Route to diagram-level writes when nothing is selected.
            this.applyPatchToDiagram(patch, key);
            return;
        } else {
            // Route to node-level writes when at least one node is selected.
            this.applyPatchToSelection(patch, key);
        }
    }

    /**
     * Applies a patch record to every selected node, then triggers a render and refresh.
     * @param patch The key-value changes to write to each node.
     * @param sourceKey The originating property key, used when emitting the changed event.
     */
    private applyPatchToSelection(patch: EditableRecord | undefined, sourceKey: string): void {
        const selected = this.diagram.selection();

        const edit = this.diagram as any;

        // For DiagramEditView supporting patches
        if (typeof edit.applyNodePatch === 'function') {
            edit.applyNodePatch(patch ?? {}, sourceKey);
            this.syncDynamicRows(this.diagram.selection());
            this.refresh();
            return;
        }

        // Fallback for readonly DiagramView (no undo, no defaults).
        for (const node of selected) {
            for (const [path, value] of Object.entries(patch ?? {})) {
                this.setPathValue(node as unknown as Record<string, unknown>, path, value);
            }
        }

        edit.render('all');
        edit.renderPreview();
        this.emitInspectorChanged(sourceKey);
        this.syncDynamicRows(this.diagram.selection());
        this.refresh();
    }

    /**
     * Applies a patch to the diagram itself (used when nothing is selected).
     * Keys use the 'diagram.' prefix used in the Diagram section rows.
     */
    private applyPatchToDiagram(patch: EditableRecord | undefined, sourceKey: string): void {
        if (!patch || this.readonly) return;
        const edit = this.diagram as any;

        // For DiagramEditView supporting patches
        if (typeof edit.applyDiagramPatch === 'function') {
            edit.applyDiagramPatch(patch ?? {}, sourceKey);
            this.syncDynamicRows(this.diagram.selection());
            this.refresh();
            return;
        }

        // Fallback for readonly DiagramView (no undo, no defaults).
        for (const [key, value] of Object.entries(patch)) {
            // Strip the 'diagram.' prefix then write via path helper.
            const path = key.startsWith('diagram.') ? key.slice('diagram.'.length) : key;
            this.setPathValue(edit, path, value);
        }
        edit.render('all');
        edit.renderPreview();
        this.emitInspectorChanged(sourceKey);
        this.syncDynamicRows(this.diagram.selection());
        this.refresh();
    }

    /**
     * Type guard for metadata add-row changes.
     */
    private isMetaAddChange(value: unknown): value is MetaAddChange {
        if (!value || typeof value !== 'object') return false;
        const v = value as Record<string, unknown>;
        return v['kind'] === 'add' && typeof v['path'] === 'string';
    }

    /**
     * Type guard for metadata key delete changes.
     */
    private isMetaDeleteChange(value: unknown): value is MetaDeleteChange {
        if (!value || typeof value !== 'object') return false;
        const v = value as Record<string, unknown>;
        return v['kind'] === 'delete' && typeof v['path'] === 'string';
    }

    /**
     * Moves the given row to the end of its grid so add-rows always stay last.
     */
    private ensureRowAtEnd(grid: HTMLElement, rowKey: string): void {
        const nodes = Array.from(grid.querySelectorAll<HTMLElement>(`[data-row-key="${rowKey}"]`));
        if (!nodes.length) {
            return;
        }
        nodes.forEach((node) => grid.appendChild(node));
    }

    /**
     * Schedules focus for the value input of a newly added metadata row after DOM updates settle.
     */
    private schedulePendingMetaValueFocus(): void {
        if (!this.pendingMetaValueFocusPath) {
            return;
        }

        const path = this.pendingMetaValueFocusPath;
        this.pendingMetaValueFocusPath = undefined;

        const tryFocus = (remainingAttempts: number): void => {
            const cell = this.cells.get(path);
            const input = cell?.querySelector<HTMLInputElement>('input[type="text"]');
            if (input) {
                input.focus();
                input.select();
                return;
            }

            if (remainingAttempts <= 0) {
                return;
            }

            window.setTimeout(() => tryFocus(remainingAttempts - 1), 16);
        };

        window.setTimeout(() => tryFocus(1), 0);
    }

    /**
     * Writes a value at a dot-separated path inside a target object, creating intermediate objects as needed.
     * Used only by the readonly fallback path in applyPatchToSelection.
     * @param target The root object to mutate.
     * @param path Dot-separated property path, e.g. 'shadowStyle.offset.x'.
     * @param value The value to set at the leaf.
     */
    private setPathValue(target: Record<string, unknown>, path: string, value: unknown): void {
        const segments = path.split('.').filter((segment) => segment.length > 0);
        if (!segments.length) {
            return;
        }

        let current: any = target;
        for (let i = 0; i < segments.length - 1; i++) {
            const key = segments[i] as string;
            const next = current[key];
            if (!next || typeof next !== 'object') {
                current[key] = {};
            }
            current = current[key];
        }
        const leafKey = segments[segments.length - 1] as string;
        current[leafKey] = value;
    }

    /**
     * Dispatches DIAGRAM_CHANGED_EVENT with scope 'style' from the diagram host element.
     * @param key The property key that was changed, included in the event sourceEvent field.
     */
    private emitInspectorChanged(key: string): void {
        const source = (this.diagram as any).host as HTMLElement | undefined;
        if (!source) {
            return;
        }

        source.dispatchEvent(new CustomEvent(DIAGRAM_CHANGED_EVENT, {
            detail: {
                scope: 'style',
                sourceEvent: `inspector:${key}`,
            },
            bubbles: true,
        }));
    }

    /**
     * Resets an adapter cell to an unset/empty state.
     * @param cell The value cell DOM element.
     * @param def The property definition for the cell.
     */
    private clearCell(cell: HTMLElement, def: InspectorPropertyDefinition): void {
        cell.classList.remove(this.config.mixedClassName);
        const adapter = this.adapters.get(def.key);
        adapter?.setMixed?.(false);
        adapter?.showValue({ [def.key]: undefined });
    }

    /**
     * Collects per-property value sets from all selected nodes.
     * @param nodes The selected nodes to read values from.
     * @returns A map of property key to its set of distinct values across the selection.
     */
    private collectNodeValues(nodes: INode[]): Record<string, Set<unknown>> {
        const result: Record<string, Set<unknown>> = {};
        for (const key of Object.keys(this.definitions)) {
            const set = new Set<unknown>();
            for (const node of nodes) {
                const owned = Object.prototype.hasOwnProperty.call(nodes[0] as any, key);
                // const raw = node as any;

                const record = owned ? { [key]: (node as any)[key] } : this.toValueRecord(node);
                this.addComparableValue(set, this.readRecordValue(record, key));
            }
            result[key] = set;
        }
        return result;
    }

    /**
     * Converts a diagram node into a flat key-value record for adapter consumption.
     * @param node The node to convert.
     * @returns A flat record with all inspectable properties of the node.
     */
    private toValueRecord(node: INode): EditableRecord {
        return node as unknown as EditableRecord;
    }

    /**
     * Collects current diagram-level property values keyed by their 'diagram.*' row keys.
     * Used as the value source when no nodes are selected.
     */
    private collectDiagramValues(): Record<string, Set<unknown>> {
        const result: Record<string, Set<unknown>> = {};
        const diagramRecord = this.diagram as unknown as EditableRecord;
        for (const key of Object.keys(this.definitions)) {
            const def = this.definitions[key];
            if (!def?.isVisible || def.isVisible()) {
                // Strip 'diagram.' prefix to read from the diagram object.
                const recordKey = key.startsWith('diagram.') ? key.slice('diagram.'.length) : key;
                const value = this.readRecordValue(diagramRecord, recordKey);
                const set = new Set<unknown>();
                if (value !== undefined) set.add(value);
                result[key] = set;
            }
        }
        return result;
    }
}
