import type { INode } from "../interfaces";
import type { Diagram } from "../model/diagram";
import { nodeClass } from "../value.utils";
import type { NodeStyle, EmbeddedSheet, SpecSheet } from "./spec.sheet";

export class SheetRepository {

    protected readonly spec_sheets: SpecSheet[] = [];

    /**
     * Inserts a new sheet or updates an existing one by id.
     * @param sheet Sheet payload to store.
     */
    public upsertSheet(sheet: SpecSheet): void {
        const cloned = this.cloneSpecSheet(sheet);
        const index = this.spec_sheets.findIndex(s => s.id === sheet.id);
        if (index >= 0) {
            this.spec_sheets[index] = cloned;
        } else {
            this.spec_sheets.push(cloned);
        }
    }

    /**
     * Removes a sheet from the repository by id.
     * @param sheet_id Identifier of the sheet to remove.
     */
    public deleteSheet(sheet_id: string): void {
        const index = this.spec_sheets.findIndex(sheet => sheet.id === sheet_id);
        if (index >= 0) {
            this.spec_sheets.splice(index, 1);
        }
    }

    /**
     * Clones a source sheet into a new reusable sheet id and name.
     * @param source_sheet_id Existing sheet id to clone from.
     * @param sheet_id Target id for the published sheet.
     * @param name Target display name for the published sheet.
     * @param description Optional description override.
     * @returns The newly published sheet.
     */
    public publishSheetAs(source_sheet_id: string, sheet_id: string, name: string, description?: string): SpecSheet {
        const source = this.sheet(source_sheet_id);
        if (!source) {
            throw new Error(`Spec sheet with id "${source_sheet_id}" not found.`);
        }

        const nextId = sheet_id.trim();
        const nextName = name.trim();
        if (!nextId) {
            throw new Error('Cannot publish sheet with an empty id.');
        }
        if (!nextName) {
            throw new Error('Cannot publish sheet with an empty name.');
        }
        if (nextId !== source_sheet_id && this.sheet(nextId)) {
            throw new Error(`Spec sheet with id "${nextId}" already exists.`);
        }

        const published: SpecSheet = {
            ...this.cloneSpecSheet(source),
            id: nextId,
            name: nextName,
            description: description ?? source.description,
        };
        this.upsertSheet(published);
        return published;
    }

    /**
     * Reads an embedded sheet payload into normalized sheet data.
     * @param json Raw embedded sheet payload.
     * @returns Normalized embedded sheet object.
     */
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

    /**
     * Writes a repository sheet to an embedded-serialization payload.
     * @param sheet_id Sheet identifier to serialize.
     * @returns Embedded sheet payload.
     */
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

    /**
     * Builds a diagram-scoped custom sheet id.
     * @param owner_id Diagram identifier that owns the custom sheet.
     * @returns Custom sheet id.
     */
    public makeCustomSheetId(owner_id: string): string {
        return `Custom @ ${owner_id}`;
    }

    /**
     * Checks whether a sheet id follows the custom-sheet naming convention.
     * @param sheet_id Sheet id to test.
     * @returns True when the id is custom-scoped; otherwise false.
     */
    public isCustomSheetId(sheet_id?: string): boolean {
        if (!sheet_id) return false;
        return sheet_id.startsWith('Custom @ ');
    }

    /**
     * Returns a sheet reference for read/write operations.
     * @param sheet_id Sheet identifier.
     * @returns The resolved sheet.
     */
    public writeSheet(sheet_id: string): SpecSheet {
        const sheet = this.sheet(sheet_id);
        if (!sheet) {
            throw new Error(`Spec sheet with id "${sheet_id}" not found.`);
        }

        return sheet;
    }

    /**
     * Removes all sheets from the repository.
     */
    public clear(): void {
        this.spec_sheets.length = 0;
    }

    /**
     * Returns a shallow copy of all sheets.
     * @returns Repository sheets snapshot.
     */
    public get sheets(): SpecSheet[] {
        return [...this.spec_sheets];
    }

    /**
     * Returns ids and names for all available sheets.
     * @returns Array of selectable sheet metadata.
     */
    public get sheetNames(): { id: string, name: string }[] {
        const all = this.spec_sheets.map(sheet => {
            return { id: sheet.id, name: sheet.name }
        });
        const distinct = new Set(all);
        return Array.from(distinct);
    }

    /**
     * Lists class names defined in a sheet.
     * @param sheet_id Sheet identifier.
     * @returns Class name list.
     */
    public sheetClasses(sheet_id: string): string[] {
        const sheet = this.sheet(sheet_id);
        if (!sheet) {
            throw new Error(`Spec sheet with id "${sheet_id}" not found.`);
        }

        return Object.keys(sheet.classes);
    }

    /**
     * Finds a sheet by id.
     * @param sheet_id Sheet identifier.
     * @returns Resolved sheet or undefined when not found.
     */
    public sheet(sheet_id: string): SpecSheet | undefined {
        return this.spec_sheets.find(sheet => sheet.id === sheet_id);
    }

    /**
     * Applies diagram-level and node-level styles from a sheet.
     * @param diagram Target diagram.
     * @param sheet_id Source sheet identifier.
     */
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

    /**
     * Applies the computed style of a sheet to a single node.
     * @param node Target node.
     * @param sheet_id Source sheet identifier.
     */
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

    /**
     * Merges a partial node style into a node's current style values.
     * @param node Target node to mutate.
     * @param style Partial style values to apply.
     */
    public applyStyleToNode(node: INode, style: Partial<NodeStyle>): void {
        // node.opacity = style.opacity ?? node.opacity;
        // node.geometry = { ...node.geometry, ...style.geometry };

        if (style.fillStyle) node.fillStyle = style.fillStyle;
        if (style.textStyle) node.textStyle = { ...node.textStyle, ...style.textStyle };
        if (style.strokeStyle) node.strokeStyle = { ...node.strokeStyle, ...style.strokeStyle };
        if (style.shadowStyle) node.shadowStyle = { ...node.shadowStyle, ...style.shadowStyle };
    }

    /**
     * Inserts or updates a type style in a sheet.
     * @param type_name Node type key.
     * @param style Style payload.
     * @param sheet_id Target sheet identifier.
     */
    public upsertTypeStyle(type_name: string, style: NodeStyle, sheet_id: string): void {
        const sheet = this.sheet(sheet_id);
        if (!sheet) {
            throw new Error(`Spec sheet with id "${sheet_id}" not found.`);
        }

        sheet.types[type_name] = this.cloneNodeStyle(style);
    }

    /**
     * Inserts or updates a class style in a sheet.
     * @param class_name Class key.
     * @param style Style payload.
     * @param sheet_id Target sheet identifier.
     */
    public upsertClassStyle(class_name: string, style: NodeStyle, sheet_id: string): void {
        const sheet = this.sheet(sheet_id);
        if (!sheet) {
            throw new Error(`Spec sheet with id "${sheet_id}" not found.`);
        }

        sheet.classes[class_name] = this.cloneNodeStyle(style);
    }

    /**
     * Renames a class style key inside a sheet.
     * @param old_name Existing class key.
     * @param new_name Replacement class key.
     * @param sheet_id Target sheet identifier.
     */
    public renameClass(old_name: string, new_name: string, sheet_id: string): void {
        const sheet = this.sheet(sheet_id);
        if (!sheet) {
            throw new Error(`Spec sheet with id "${sheet_id}" not found.`);
        }

        if (old_name === new_name || !(old_name in sheet.classes)) return;
        sheet.classes[new_name] = { ...sheet.classes[old_name]! };
        delete sheet.classes[old_name];
    }

    /**
     * Deep-clones a node style payload to avoid reference sharing.
     * @param style Style payload to clone.
     * @returns Cloned style.
     */
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

    /**
     * Deep-clones a sheet payload including all type/class styles.
     * @param sheet Sheet payload to clone.
     * @returns Cloned sheet.
     */
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