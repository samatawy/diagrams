import type { INode } from "../../interfaces";
import type { DiagramView } from "../../view";
import { DiagramEditView } from "../../editview";
import { DIAGRAM_CHANGED_EVENT, DIAGRAM_SELECTION_EVENT } from "../../events";
import { DiagramConstants } from "../../model/diagram.constants";

import { Inspector, type InspectorConfig, type InspectorPropertyDefinition, type EditableRecord } from "./inspector";
import type { ColorSelectConfig } from "../color.select";
import type { WidthSelectConfig } from "../width.select";
import type { ArrowSelectConfig } from "../arrow.select";
import type { FontSelectConfig } from "../font.select";
import type { SizeSelectConfig } from "../size.select";
import { ColorSelectAdapter } from "./color.select.adapter";
import { WidthSelectAdapter } from "./width.select.adapter";
import { ArrowSelectAdapter } from "./arrow.select.adapter";
import { FontSelectAdapter } from "./font.select.adapter";
import { SizeSelectAdapter } from "./size.select.adapter";
import { AngleAdapter } from "./angle.adapter";
import { EnumSelectAdapter, type EnumSelectAdapterConfig } from "./enum.select.adapter";
import { PointAdapter } from "./point.adapter";

export type DiagramInspectorConfig = InspectorConfig & {
    colorSelect?: ColorSelectConfig;
    strokeColor?: ColorSelectConfig;
    fillColor?: ColorSelectConfig;
    textColor?: ColorSelectConfig;
    shadowColor?: ColorSelectConfig;
    widthSelect?: WidthSelectConfig;
    arrowSelect?: ArrowSelectConfig;
    fontSelect?: FontSelectConfig;
    sizeSelect?: SizeSelectConfig;
    textAlignOptions?: EnumSelectAdapterConfig['options'];
    textBaselineOptions?: EnumSelectAdapterConfig['options'];
};

export class DiagramInspector extends Inspector {

    protected diagram: DiagramView;

    protected inspectorConfig: DiagramInspectorConfig;

    private geometryGrid?: HTMLElement;

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

    protected override registerAdapters(): void {
        super.registerAdapters();

        Inspector.registerAdapter('ColorSelect', ColorSelectAdapter);
        Inspector.registerAdapter('WidthSelect', WidthSelectAdapter);
        Inspector.registerAdapter('ArrowSelect', ArrowSelectAdapter);
        Inspector.registerAdapter('FontSelect', FontSelectAdapter);
        Inspector.registerAdapter('SizeSelect', SizeSelectAdapter);
        Inspector.registerAdapter('Angle', AngleAdapter);
        Inspector.registerAdapter('Point', PointAdapter);
        Inspector.registerAdapter('AngleEditor', AngleAdapter);
        Inspector.registerAdapter('EnumSelect', EnumSelectAdapter);
    }

    protected initialize(): void {
        const readonly = this.readonly;

        const { grid: identity } = this.buildSection('Identity');
        this.addRow(identity, { key: 'id', label: 'ID', type: 'string', readonly: true });
        this.addRow(identity, { key: 'type', label: 'Type', type: 'string', readonly: true });

        const { grid: geometry } = this.buildSection('Geometry');
        this.geometryGrid = geometry;
        this.addRow(geometry, { key: 'angle', label: 'Angle', type: 'number', editor: 'Angle', readonly: readonly });

        const { grid: text } = this.buildSection('Text');
        this.addRow(text, { key: 'text', label: 'Content', type: 'string', readonly: readonly });
        this.addRow(text, {
            key: 'fontFace',
            label: 'Font Face',
            type: 'string',
            editor: 'FontSelect',
            editorOptions: this.inspectorConfig.fontSelect || {},
            readonly: readonly,
        });
        this.addRow(text, {
            key: 'fontSize',
            label: 'Font Size',
            type: 'number',
            editor: 'SizeSelect',
            editorOptions: this.inspectorConfig.sizeSelect || {},
            readonly: readonly,
        });
        this.addRow(text, {
            key: 'textColor',
            label: 'Color',
            type: 'string',
            editor: 'ColorSelect',
            editorOptions: { ...(this.inspectorConfig.colorSelect || {}), ...(this.inspectorConfig.textColor || {}) },
            readonly: readonly,
        });
        this.addRow(text, {
            key: 'textAlign',
            label: 'Align',
            type: 'select',
            editor: 'EnumSelect',
            editorOptions: {
                options: this.inspectorConfig.textAlignOptions || ['left', 'center', 'right'],
            } as EnumSelectAdapterConfig,
            readonly: readonly,
        });
        this.addRow(text, {
            key: 'textBaseline',
            label: 'Baseline',
            type: 'select',
            editor: 'EnumSelect',
            editorOptions: {
                options: this.inspectorConfig.textBaselineOptions || ['top', 'middle', 'bottom'],
            } as EnumSelectAdapterConfig,
            readonly: readonly,
        });

        const { grid: line } = this.buildSection('Line');
        this.addRow(line, {
            key: 'strokeStyle',
            label: 'Line Color',
            type: 'string',
            editor: 'ColorSelect',
            editorOptions: { ...(this.inspectorConfig.colorSelect || {}), ...(this.inspectorConfig.strokeColor || {}) },
            readonly: readonly,
        });
        this.addRow(line, {
            key: 'lineWidth',
            label: 'Line width',
            type: 'number',
            editor: 'WidthSelect',
            editorOptions: this.inspectorConfig.widthSelect || {},
            readonly: readonly,
        });
        this.addRow(line, {
            key: 'arrow',
            label: 'Arrow',
            type: 'string',
            editor: 'ArrowSelect',
            editorOptions: this.inspectorConfig.arrowSelect || {},
            readonly: readonly,
        });

        const { grid: fill } = this.buildSection('Fill');
        this.addRow(fill, {
            key: 'fillStyle',
            label: 'Fill Color',
            type: 'string',
            editor: 'ColorSelect',
            editorOptions: { ...(this.inspectorConfig.colorSelect || {}), ...(this.inspectorConfig.fillColor || {}) },
            readonly: readonly,
        });
        this.addRow(fill, { key: 'img_mode', label: 'Mode', type: 'string', readonly: readonly });
        this.addRow(fill, { key: 'image_id', label: 'Asset ID', type: 'string', readonly: readonly });

        const { grid: shadow } = this.buildSection('Shadow');
        this.addRow(shadow, {
            key: 'shadowStyle.color',
            label: 'Color',
            type: 'string',
            editor: 'ColorSelect',
            editorOptions: { ...(this.inspectorConfig.colorSelect || {}), ...(this.inspectorConfig.shadowColor || {}) },
            readonly: readonly,
        });
        this.addRow(shadow, {
            key: 'shadowStyle.blur',
            label: 'Blur',
            type: 'number',
            readonly: readonly,
        });
        this.addRow(shadow, {
            key: 'shadowStyle.offset.x',
            label: 'Offset X',
            type: 'number',
            readonly: readonly,
        });
        this.addRow(shadow, {
            key: 'shadowStyle.offset.y',
            label: 'Offset Y',
            type: 'number',
            readonly: readonly,
        });

        const { grid: meta } = this.buildSection('Metadata');
        this.addRow(meta, { key: 'meta', label: 'Meta', type: 'string', readonly: readonly });
    }

    protected override onAdapterValueChanged(def: InspectorPropertyDefinition, value: unknown): void {
        this.applyInspectorChange(def.key, value);
    }

    // ============================================================
    // Diagram event wiring
    // ============================================================

    protected bindDiagramEvents(): void {
        const source = (this.diagram as any).host as HTMLElement | undefined;
        source?.addEventListener(DIAGRAM_CHANGED_EVENT, this.onDiagramChanged);
        source?.addEventListener(DIAGRAM_SELECTION_EVENT, this.onDiagramSelectionChanged);
    }

    protected unbindDiagramEvents(): void {
        const source = (this.diagram as any).host as HTMLElement | undefined;
        source?.removeEventListener(DIAGRAM_CHANGED_EVENT, this.onDiagramChanged);
        source?.removeEventListener(DIAGRAM_SELECTION_EVENT, this.onDiagramSelectionChanged);
    }

    protected onDiagramChanged = (): void => {
        this.refresh();
    }

    protected onDiagramSelectionChanged = (): void => {
        this.syncPointRows(this.diagram.selection());
        this.refresh();
    }

    // ============================================================
    // Refresh
    // ============================================================

    protected refresh(): void {
        this.syncingAdapters = true;
        try {
            const selected = this.diagram.selection();

            const values = this.collectNodeValues(selected);
            const colors = this.readonly ? [] : (this.diagram as DiagramEditView).getFrequentColors();
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
                if (!adapter) {
                    continue;
                }

                if (valueSet.size > 1) {
                    adapter.setMixed?.(true);
                } else {
                    const v = [...valueSet][0];
                    cell.classList.remove(this.config.mixedClassName);
                    adapter.setMixed?.(false);
                    adapter.showValue({ [key]: v });
                }

                if (adapter instanceof ColorSelectAdapter) {
                    (adapter as ColorSelectAdapter).setColors(colors);
                }
            }
        } finally {
            this.syncingAdapters = false;
        }
    }

    private syncPointRows(selected: INode[]): void {
        if (!this.geometryGrid) {
            return;
        }

        const removed = this.removeVolatileRowsFromGrid(this.geometryGrid);
        for (const key of removed) {
            this.cells.delete(key);
            this.adapters.get(key)?.destroy();
            this.adapters.delete(key);
        }

        const pointDefs = this.buildPointRowDefinitions(selected);
        for (const def of pointDefs) {
            this.addRow(this.geometryGrid, def);
        }
    }

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
            readonly: this.readonly,
            volatile: true,
        }));
    }

    private applyInspectorChange(key: string, value: unknown): void {
        const adapter = this.adapters.get(key);
        const patch = adapter?.getValue();
        this.applyPatchToSelection(patch, key);
    }

    private applyPatchToSelection(patch: EditableRecord | undefined, sourceKey: string): void {
        const selected = this.diagram.selection();
        if (!selected.length) {
            return;
        }

        for (const node of selected) {
            for (const [path, value] of Object.entries(patch ?? {})) {
                this.setPathValue(node as unknown as Record<string, unknown>, path, value);
            }
        }

        const edit = this.diagram as any;
        this.updateDiagramDefaultsFromPatch(edit, patch);
        edit.render?.('all');
        edit.renderPreview?.();
        this.emitInspectorChanged(sourceKey);
        this.refresh();
    }

    private updateDiagramDefaultsFromPatch(edit: any, patch: EditableRecord | undefined): void {
        if (patch === undefined) {
            return;
        }
        // text
        if (patch['text'] !== undefined) edit.settings.nodeText = String(patch['text']);
        if (patch['fontFace'] !== undefined) edit.settings.fontFace = String(patch['fontFace']);
        if (patch['fontSize'] !== undefined) edit.settings.fontSize = Number(patch['fontSize']);
        if (patch['textColor'] !== undefined) edit.settings.textColor = String(patch['textColor']);
        if (patch['textAlign'] !== undefined) edit.settings.textAlign = patch['textAlign'];
        if (patch['textBaseline'] !== undefined) edit.settings.textBaseline = patch['textBaseline'];

        // line
        if (patch['strokeStyle'] !== undefined) edit.settings.strokeColor = String(patch['strokeStyle']);
        if (patch['lineWidth'] !== undefined) edit.settings.lineWidth = Number(patch['lineWidth']);
        if (patch['startArrow'] !== undefined) edit.settings.startArrow = Boolean(patch['startArrow']);
        if (patch['endArrow'] !== undefined) edit.settings.endArrow = Boolean(patch['endArrow']);

        // fill
        if (patch['fillStyle'] !== undefined) edit.settings.fillColor = String(patch['fillStyle']);

        const hasShadowPatch = Object.keys(patch).some((key) => key.startsWith('shadowStyle.'));
        if (hasShadowPatch) {
            edit.settings.shadowStyle = this.normalizeShadowStyle(edit.settings.shadowStyle);
        }

        const shadowColor = patch['shadowStyle.color'];
        if (shadowColor !== undefined) {
            edit.settings.shadowStyle = {
                ...edit.settings.shadowStyle,
                color: String(shadowColor),
            };
        }

        const shadowBlur = patch['shadowStyle.blur'];
        if (shadowBlur !== undefined) {
            edit.settings.shadowStyle = {
                ...edit.settings.shadowStyle,
                blur: Number(shadowBlur),
            };
        }

        const shadowOffsetX = patch['shadowStyle.offset.x'];
        if (shadowOffsetX !== undefined) {
            edit.settings.shadowStyle = {
                ...edit.settings.shadowStyle,
                offset: {
                    ...edit.settings.shadowStyle.offset,
                    x: Number(shadowOffsetX),
                },
            };
        }

        const shadowOffsetY = patch['shadowStyle.offset.y'];
        if (shadowOffsetY !== undefined) {
            edit.settings.shadowStyle = {
                ...edit.settings.shadowStyle,
                offset: {
                    ...edit.settings.shadowStyle.offset,
                    y: Number(shadowOffsetY),
                },
            };
        }
    }

    private setPathValue(target: Record<string, unknown>, path: string, value: unknown): void {
        const segments = path.split('.').filter((segment) => segment.length > 0);
        if (!segments.length) {
            return;
        }

        if (segments[0] === 'shadowStyle') {
            const currentShadow = (target as any)['shadowStyle'];
            (target as any)['shadowStyle'] = this.normalizeShadowStyle(currentShadow);
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

    private normalizeShadowStyle(style: any): { name: string; color: string; blur: number; offset: { x: number; y: number } } {
        const base = DiagramConstants.NO_SHADOW;
        const next = style && typeof style === 'object' ? style : {};
        const offset = next.offset && typeof next.offset === 'object' ? next.offset : {};

        const blur = Number(next.blur);
        const ox = Number(offset.x);
        const oy = Number(offset.y);

        return {
            name: typeof next.name === 'string' && next.name.length > 0 ? next.name : base.name,
            color: typeof next.color === 'string' ? next.color : base.color,
            blur: Number.isFinite(blur) ? blur : base.blur,
            offset: {
                x: Number.isFinite(ox) ? ox : base.offset.x,
                y: Number.isFinite(oy) ? oy : base.offset.y,
            },
        };
    }

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

    private clearCell(cell: HTMLElement, def: InspectorPropertyDefinition): void {
        cell.classList.remove(this.config.mixedClassName);
        const adapter = this.adapters.get(def.key);
        adapter?.setMixed?.(false);
        adapter?.showValue({ [def.key]: undefined });
    }

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

    private toValueRecord(node: INode): EditableRecord {
        const n = node as any;
        return {
            id: n.id,
            type: n.type,
            angle: n.angle,
            points: n.points,
            strokeStyle: n.strokeStyle,
            fillStyle: n.fillStyle,
            lineWidth: n.lineWidth,
            hollow: n.hollow,
            transparent: n.transparent,
            shadowStyle: n.shadowStyle,
            text: n.text,
            fontFace: n.fontFace,
            fontSize: n.fontSize,
            textColor: n.textColor,
            textAlign: n.textAlign,
            textBaseline: n.textBaseline,
            startArrow: n.startArrow,
            endArrow: n.endArrow,
            img_mode: n.img_mode,
            image_id: n.image_id,
            meta: n.meta,
        };
    }
}