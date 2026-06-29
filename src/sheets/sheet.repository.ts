import type { INode } from "../interfaces";
import type { Diagram } from "../model/diagram";
import { nodeClass } from "../value.utils";
import type { NodeStyle, EmbeddedSheet, SpecSheet } from "./spec.sheet";

export class SheetRepository {

    protected readonly spec_sheets: SpecSheet[] = [];

    public upsertSheet(sheet: SpecSheet): void {
        const cloned = this.cloneSpecSheet(sheet);
        const index = this.spec_sheets.findIndex(s => s.id === sheet.id);
        if (index >= 0) {
            this.spec_sheets[index] = cloned;
        } else {
            this.spec_sheets.push(cloned);
        }
    }

    public deleteSheet(sheet_id: string): void {
        const index = this.spec_sheets.findIndex(sheet => sheet.id === sheet_id);
        if (index >= 0) {
            this.spec_sheets.splice(index, 1);
        }
    }

    public readEmbedded(json: any): EmbeddedSheet {
        const sheet: EmbeddedSheet = {
            id: json.id,
            name: json.name,
            version: json.version,
            description: json.description,

            diagram: json.diagram ?? {},
            types: json.types ?? {},
            classes: json.classes ?? {},
        };
        return sheet;
    }

    public writeEmbedded(sheet_id: string): EmbeddedSheet {
        const sheet = this.sheet(sheet_id);
        if (!sheet) {
            throw new Error(`Spec sheet with id "${sheet_id}" not found.`);
        }

        return {
            id: sheet.id,
            name: sheet.name,
            version: sheet.version,
            description: sheet.description,

            diagram: sheet.diagram,
            types: { ...sheet.types },
            classes: { ...sheet.classes },
        };
    }

    public makeCustomSheetId(owner_id: string): string {
        return `Custom @ ${owner_id}`;
    }

    public isCustomSheetId(sheet_id?: string): boolean {
        if (!sheet_id) return false;
        return sheet_id.startsWith('Custom @ ');
    }

    public writeSheet(sheet_id: string): SpecSheet {
        const sheet = this.sheet(sheet_id);
        if (!sheet) {
            throw new Error(`Spec sheet with id "${sheet_id}" not found.`);
        }

        return sheet;
    }

    public clear(): void {
        this.spec_sheets.length = 0;
    }

    public get sheets(): SpecSheet[] {
        return [...this.spec_sheets];
    }

    public get sheetNames(): { id: string, name: string }[] {
        const all = this.spec_sheets.map(sheet => {
            return { id: sheet.id, name: sheet.name }
        });
        const distinct = new Set(all);
        return Array.from(distinct);
    }

    public sheetClasses(sheet_id: string): string[] {
        const sheet = this.sheet(sheet_id);
        if (!sheet) {
            throw new Error(`Spec sheet with id "${sheet_id}" not found.`);
        }

        return Object.keys(sheet.classes);
    }

    public sheet(sheet_id: string): SpecSheet | undefined {
        return this.spec_sheets.find(sheet => sheet.id === sheet_id);
    }

    public applyToDiagram(diagram: Diagram, sheet_id: string): void {
        const sheet = this.sheet(sheet_id);
        if (!sheet) {
            throw new Error(`Spec sheet with id "${sheet_id}" not found.`);
        }

        diagram.background = sheet.diagram.background;

        for (const node of diagram.nodes) {
            this.applyToNode(node, sheet_id);
        }
    }

    public applyToNode(node: INode, sheet_id: string): void {
        const sheet = this.sheet(sheet_id);
        if (!sheet) {
            throw new Error(`Spec sheet with id "${sheet_id}" not found.`);
        }

        const nodeType = node.type;
        let nodeTypeStyle = sheet.types[nodeType] ?? {} as NodeStyle;

        const _class = nodeClass(node);
        if (_class) {
            const _class_style = sheet.classes[_class];
            if (_class_style) {
                nodeTypeStyle = { ...nodeTypeStyle, ..._class_style };
            }
        }

        this.applyStyleToNode(node, nodeTypeStyle);
    }

    public applyStyleToNode(node: INode, style: Partial<NodeStyle>): void {
        // node.opacity = style.opacity ?? node.opacity;
        // node.geometry = { ...node.geometry, ...style.geometry };

        if (style.fillStyle) node.fillStyle = style.fillStyle;
        if (style.textStyle) node.textStyle = { ...node.textStyle, ...style.textStyle };
        if (style.strokeStyle) node.strokeStyle = { ...node.strokeStyle, ...style.strokeStyle };
        if (style.shadowStyle) node.shadowStyle = { ...node.shadowStyle, ...style.shadowStyle };
    }

    public upsertTypeStyle(type_name: string, style: NodeStyle, sheet_id: string): void {
        const sheet = this.sheet(sheet_id);
        if (!sheet) {
            throw new Error(`Spec sheet with id "${sheet_id}" not found.`);
        }

        sheet.types[type_name] = this.cloneNodeStyle(style);
    }

    public upsertClassStyle(class_name: string, style: NodeStyle, sheet_id: string): void {
        const sheet = this.sheet(sheet_id);
        if (!sheet) {
            throw new Error(`Spec sheet with id "${sheet_id}" not found.`);
        }

        sheet.classes[class_name] = this.cloneNodeStyle(style);
    }

    public renameClass(old_name: string, new_name: string, sheet_id: string): void {
        const sheet = this.sheet(sheet_id);
        if (!sheet) {
            throw new Error(`Spec sheet with id "${sheet_id}" not found.`);
        }

        if (old_name === new_name || !(old_name in sheet.classes)) return;
        sheet.classes[new_name] = { ...sheet.classes[old_name]! };
        delete sheet.classes[old_name];
    }

    private cloneNodeStyle(style: NodeStyle): NodeStyle {
        return {
            fillStyle: style.fillStyle,
            textStyle: { ...style.textStyle },
            strokeStyle: { ...style.strokeStyle },
            shadowStyle: {
                ...style.shadowStyle,
                offset: { ...style.shadowStyle.offset },
            },
        };
    }

    private cloneSpecSheet(sheet: SpecSheet): SpecSheet {
        const types: Record<string, NodeStyle> = {};
        for (const [key, style] of Object.entries(sheet.types ?? {})) {
            types[key] = this.cloneNodeStyle(style);
        }

        const classes: Record<string, NodeStyle> = {};
        for (const [key, style] of Object.entries(sheet.classes ?? {})) {
            classes[key] = this.cloneNodeStyle(style);
        }

        return {
            ...sheet,
            diagram: { ...(sheet.diagram ?? {}) },
            types,
            classes,
        };
    }
}