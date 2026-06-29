import type { INode } from "../interfaces";
import type { Diagram } from "../model/diagram";
import { nodeClass } from "../value.utils";
import type { NodeStyle, SpecSheet } from "./spec.sheet";

export class SheetRepository {

    protected readonly spec_sheets: SpecSheet[] = [];

    public registerSheet(sheet: SpecSheet): void {
        this.spec_sheets.push(sheet);
    }

    public unregisterSheet(sheet_id: string): void {
        const index = this.spec_sheets.findIndex(sheet => sheet.id === sheet_id);
        if (index >= 0) {
            this.spec_sheets.splice(index, 1);
        }
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
        let nodeTypeStyle = sheet.nodes[nodeType] ?? {} as NodeStyle;

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

        sheet.nodes[type_name] = { ...style };
    }

    public upsertClassStyle(class_name: string, style: NodeStyle, sheet_id: string): void {
        const sheet = this.sheet(sheet_id);
        if (!sheet) {
            throw new Error(`Spec sheet with id "${sheet_id}" not found.`);
        }

        sheet.classes[class_name] = { ...style };
    }

    public renameClass(old_name: string, new_name: string, sheet_id: string): void {
        const sheet = this.sheet(sheet_id);
        if (!sheet) {
            throw new Error(`Spec sheet with id "${sheet_id}" not found.`);
        }

        if (old_name === new_name || !(old_name in sheet.classes)) return;
        sheet.classes[new_name] = { ...sheet.classes[old_name]!, id: new_name };
        delete sheet.classes[old_name];
    }
}