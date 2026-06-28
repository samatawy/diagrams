import type { INode } from "../interfaces";
import type { Diagram } from "../model/diagram";
import { nodeClass } from "../value.utils";
import type { NodeStyle, SpecSheet } from "./spec.sheet";

export class SheetRepository {

    protected readonly spec_sheets: SpecSheet[] = [];

    public registerSheet(sheet: SpecSheet): void {
        this.spec_sheets.push(sheet);
    }

    public unregisterSheet(sheetId: string): void {
        const index = this.spec_sheets.findIndex(sheet => sheet.id === sheetId);
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

    public sheetClasses(id: string): string[] {
        const sheet = this.sheet(id);
        if (!sheet) {
            throw new Error(`Spec sheet with id "${id}" not found.`);
        }

        return Object.keys(sheet.classes);
    }

    public sheet(id: string): SpecSheet | undefined {
        return this.spec_sheets.find(sheet => sheet.id === id);
    }

    public applyToDiagram(diagram: Diagram, sheetId: string): void {
        const sheet = this.sheet(sheetId);
        if (!sheet) {
            throw new Error(`Spec sheet with id "${sheetId}" not found.`);
        }

        diagram.background = sheet.diagram.background;

        for (const node of diagram.nodes) {
            this.applyToNode(node, sheetId);
        }
    }

    public applyToNode(node: INode, sheetId: string): void {
        const sheet = this.sheet(sheetId);
        if (!sheet) {
            throw new Error(`Spec sheet with id "${sheetId}" not found.`);
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

    private applyStyleToNode(node: INode, style: NodeStyle): void {
        // node.opacity = style.opacity ?? node.opacity;
        // node.geometry = { ...node.geometry, ...style.geometry };

        if (style.fillStyle) node.fillStyle = style.fillStyle;
        if (style.textStyle) node.textStyle = { ...node.textStyle, ...style.textStyle };
        if (style.strokeStyle) node.strokeStyle = { ...node.strokeStyle, ...style.strokeStyle };
        if (style.shadowStyle) node.shadowStyle = { ...node.shadowStyle, ...style.shadowStyle };
    }

    public upsertTypeStyle(type_name: string, style: NodeStyle, sheetId: string): void {
        const sheet = this.sheet(sheetId);
        if (!sheet) {
            throw new Error(`Spec sheet with id "${sheetId}" not found.`);
        }

        sheet.nodes[type_name] = { ...style };
    }

    public upsertClassStyle(class_name: string, style: NodeStyle, sheetId: string): void {
        const sheet = this.sheet(sheetId);
        if (!sheet) {
            throw new Error(`Spec sheet with id "${sheetId}" not found.`);
        }

        sheet.classes[class_name] = { ...style };
    }
}