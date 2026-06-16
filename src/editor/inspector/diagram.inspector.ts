import type { INode } from "../../interfaces";
import type { DiagramView } from "../../view";
import { DiagramEditView } from "../../editview";
import { DIAGRAM_CHANGED_EVENT } from "../../events";

import { Inspector, InspectorValueEditor, type InspectorConfig, type InspectorPropertyDefinition, type EditableRecord } from "./inspector";
import type { ColorSelectConfig } from "../color.select";
import type { WidthSelectConfig } from "../width.select";
import type { ArrowSelectConfig } from "../arrow.select";
import type { FontSelectConfig } from "../font.select";
import type { SizeSelectConfig } from "../size.select";
import { ColorSelectEditor } from "./color.select.editor";
import { WidthSelectEditor } from "./width.select.editor";
import { ArrowSelectEditor } from "./arrow.select.editor";
import { FontSelectEditor } from "./font.select.editor";
import { SizeSelectEditor } from "./size.select.editor";
import { AngleEditor } from "./angle.editor";
import { EnumSelectEditor, type EnumSelectEditorConfig } from "./enum.select.editor";

export type DiagramInspectorConfig = InspectorConfig & {
    colorSelect?: ColorSelectConfig;
    strokeColor?: ColorSelectConfig;
    fillColor?: ColorSelectConfig;
    textColor?: ColorSelectConfig;
    widthSelect?: WidthSelectConfig;
    arrowSelect?: ArrowSelectConfig;
    fontSelect?: FontSelectConfig;
    sizeSelect?: SizeSelectConfig;
    textAlignOptions?: EnumSelectEditorConfig['options'];
    textBaselineOptions?: EnumSelectEditorConfig['options'];
};

export class DiagramInspector extends Inspector {

    protected diagram: DiagramView;

    protected readonly: boolean = false;

    protected inspectorConfig: DiagramInspectorConfig;

    // Value cells keyed by property key, for targeted updates.
    private cells: Map<string, HTMLElement> = new Map();

    // Editor bindings keyed by property key.
    private editors: Map<string, InspectorValueEditor> = new Map();

    // Prevent feedback loops while pushing model values into controls.
    private syncingEditors: boolean = false;

    constructor(target: HTMLElement, diagram: DiagramView, config: DiagramInspectorConfig = {}) {
        super(target, config);
        this.diagram = diagram;
        this.inspectorConfig = config;
        this.readonly = !(diagram instanceof DiagramEditView);

        this.registerEditors();
        this.initialize();
        this.bindDiagramEvents();
    }

    /**
     * Clears inspector DOM and internal button references.
     */
    public override destroy(): void {
        this.unbindDiagramEvents();
        for (const editor of this.editors.values()) {
            editor.destroy();
        }
        this.editors.clear();
        super.destroy();
    }

    protected registerEditors(): void {
        Inspector.registerEditor('ColorSelect', ColorSelectEditor);
        Inspector.registerEditor('WidthSelect', WidthSelectEditor);
        Inspector.registerEditor('ArrowSelect', ArrowSelectEditor);
        Inspector.registerEditor('FontSelect', FontSelectEditor);
        Inspector.registerEditor('SizeSelect', SizeSelectEditor);
        Inspector.registerEditor('AngleEditor', AngleEditor);
        Inspector.registerEditor('EnumSelect', EnumSelectEditor);
    }

    protected initialize(): void {
        const readonly = this.readonly;

        const { grid: identity } = this.buildSection('Identity');
        this.addRow(identity, { key: 'id', label: 'ID', type: 'string', readonly: true });
        this.addRow(identity, { key: 'type', label: 'Type', type: 'string', readonly: true });

        const { grid: geometry } = this.buildSection('Geometry');
        this.addRow(geometry, { key: 'angle', label: 'Angle', type: 'number', editor: 'AngleEditor', readonly: readonly });

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
            } as EnumSelectEditorConfig,
            readonly: readonly,
        });
        this.addRow(text, {
            key: 'textBaseline',
            label: 'Baseline',
            type: 'select',
            editor: 'EnumSelect',
            editorOptions: {
                options: this.inspectorConfig.textBaselineOptions || ['top', 'middle', 'bottom'],
            } as EnumSelectEditorConfig,
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

        // this.addRow(appearance, { key: 'hollow', label: 'Hollow', type: 'boolean', readonly: readonly });
        // this.addRow(appearance, { key: 'transparent', label: 'Transparent', type: 'boolean', readonly: readonly });
        // this.addRow(appearance, { key: 'shadowStyle', label: 'Shadow', type: 'string', readonly: readonly });

        const { grid: meta } = this.buildSection('Metadata');
        this.addRow(meta, { key: 'meta', label: 'Meta', type: 'string', readonly: readonly });
    }

    // ============================================================
    // Private helpers
    // ============================================================

    /**
     * Registers a property definition and immediately builds its row in the given grid.
     * Stores the value cell for targeted updates by refresh().
     */
    private addRow(grid: HTMLElement, def: InspectorPropertyDefinition): void {
        this.defineProperty(def);
        const cell = this.buildRow(grid, def);
        const editor = this.buildEditor(cell, def);
        if (!def.readonly) {
            editor.setChangeHandler((value) => {
                if (this.syncingEditors) return;
                this.applyInspectorChange(def.key, value);
            });
        }
        this.cells.set(def.key, cell);
        this.editors.set(def.key, editor);
    }

    // ============================================================
    // Diagram event wiring
    // ============================================================

    protected bindDiagramEvents(): void {
        const source = (this.diagram as any).host as HTMLElement | undefined;
        source?.addEventListener(DIAGRAM_CHANGED_EVENT, this.onDiagramChanged);
    }

    protected unbindDiagramEvents(): void {
        const source = (this.diagram as any).host as HTMLElement | undefined;
        source?.removeEventListener(DIAGRAM_CHANGED_EVENT, this.onDiagramChanged);
    }

    protected onDiagramChanged = (): void => {
        this.refresh();
    }

    // ============================================================
    // Refresh
    // ============================================================

    protected refresh(): void {
        this.syncingEditors = true;
        try {
            const selected = this.diagram.selection();
            const values = this.collectNodeValues(selected);
            const colors = this.readonly ? [] : (this.diagram as DiagramEditView).getFrequentColors();

            for (const [key, cell] of this.cells) {
                const def = this.definitions[key];
                if (!def) continue;

                const valueSet = values[key];
                if (!valueSet || valueSet.size === 0) {
                    this.clearCell(cell, def);
                    continue;
                }

                const editor = this.editors.get(key);
                if (!editor) {
                    continue;
                }

                if (valueSet.size > 1) {
                    editor.setMixed?.(true);
                } else {
                    const v = [...valueSet][0];
                    cell.classList.remove(this.config.mixedClassName);
                    editor.setMixed?.(false);
                    editor.showValue({ [key]: v });
                }

                if (editor instanceof ColorSelectEditor) {
                    (editor as ColorSelectEditor).setColors(colors);
                }
            }
        } finally {
            this.syncingEditors = false;
        }
    }

    private applyInspectorChange(key: string, value: unknown): void {
        const editor = this.editors.get(key);
        const patch = editor?.getValue();
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

        const shadowColor = patch['shadowStyle.color'];
        if (shadowColor !== undefined) {
            edit.settings.shadowStyle = {
                ...edit.settings.shadowStyle,
                color: String(shadowColor),
            };
        }
    }

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
        const editor = this.editors.get(def.key);
        editor?.setMixed?.(false);
        editor?.showValue({ [def.key]: undefined });
    }

    private collectNodeValues(nodes: INode[]): Record<string, Set<unknown>> {
        const result: Record<string, Set<unknown>> = {};
        for (const key of Object.keys(this.definitions)) {
            const set = new Set<unknown>();
            for (const node of nodes) {
                const owned = Object.prototype.hasOwnProperty.call(nodes[0] as any, key);
                // const raw = node as any;

                const record = owned ? { [key]: (node as any)[key] } : this.toValueRecord(node);
                set.add(this.readRecordValue(record, key));
            }
            result[key] = set;
        }
        console.log('Collected node values for inspector:', result);
        return result;
    }

    private readRecordValue(record: EditableRecord, key: string): unknown {
        const editor = this.editors.get(key);
        return editor?.extractValueFrom(record).value ?? this.getPathValue(record, key);
    }

    private getPathValue(record: EditableRecord, path: string): unknown {
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

    private toValueRecord(node: INode): EditableRecord {
        const n = node as any;
        return {
            id: n.id,
            type: n.type,
            angle: n.angle,
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