import { isNode } from "../guards";
import type { IConnection, IConnectionAnchor, IContainer, IGroup, INode } from "../interfaces";
import { jsonSerializer } from "../io/json.serializer";
import type { ISerializedNode } from "../io/serialized.types";
import { NodeBasics } from "../nodes/node.basics";
import { deepClone, isHollow } from "../value.utils";
import type { DiagramEditView } from "./diagram.edit.view";


interface DiagramClipboardEnvelope {
    nodes: ISerializedNode[];
    groups: IGroup[];
    image_assets?: Record<string, string>;
}

/**
 * Helper class for managing clipboard operations in the diagram editor. It provides methods for copying and pasting nodes and styles, as well as checking the clipboard state.
 * It handles serialization and deserialization of nodes and styles, ensuring that pasted elements are correctly integrated into the diagram.
 * The class also manages the clipboard snapshot to maintain a consistent state across different operations.
 * The owning diagram is responsible for rendering and dispatching events.
 */
export class DiagramClipboard {

    protected readonly diagram: DiagramEditView;

    protected can_paste: boolean = false;

    protected can_paste_styles: boolean = false;

    private clipboardSnapshot: string = '';

    constructor(diagram: DiagramEditView) {
        this.diagram = diagram;
    }

    /**
     * Copies styles.
     * @returns Nothing.
     */
    public copyStyles(): void {
        const selected = this.diagram.selection();
        if (selected.length !== 1) return;

        const style = selected[0]!;
        const serialized = {
            opacity: style.opacity,
            strokeStyle: style.strokeStyle,
            fillStyle: style.fillStyle,
            textStyle: style.textStyle,
            shadowStyle: style.shadowStyle,
            image_id: isNode(style) ? style.image_id : undefined,
            image_mode: isNode(style) ? style.image_mode : undefined,
            image_align: isNode(style) ? style.image_align : undefined,
            image_padding: isNode(style) ? style.image_padding : undefined,
        };

        this.can_paste_styles = true;

        void this.writeClipboardText(jsonSerializer.write(serialized));
    }

    /**
     * Pastes styles.
     * @returns A promise that resolves to an array of the nodes that were updated with the pasted styles.
     */
    public pasteStyles(): Promise<INode[]> {
        const selected = this.diagram.selection();
        if (selected.length === 0) return Promise.resolve([]);

        return this.readClipboardText()
            .then(async (json) => {
                const style = JSON.parse(json);
                if (!style || typeof style !== 'object') return [];

                this.diagram.addUndo();

                for (const node of selected) {
                    if (style.opacity !== undefined) node.opacity = style.opacity;
                    if (style.strokeStyle) node.strokeStyle = style.strokeStyle;
                    if (style.fillStyle) node.fillStyle = style.fillStyle;
                    if (style.textStyle) node.textStyle = style.textStyle;
                    if (style.shadowStyle) node.shadowStyle = style.shadowStyle;

                    if (style.image_id !== undefined) node.image_id = style.image_id;
                    if (style.image_mode !== undefined) node.image_mode = style.image_mode;
                    if (style.image_align !== undefined) node.image_align = style.image_align;
                    if (style.image_padding !== undefined) node.image_padding = style.image_padding;

                    node.hollow = undefined; node.hollow = isHollow(node);
                }

                this.diagram.applyClassChange(selected, {
                    fillStyle: style.fillStyle,
                    strokeStyle: style.strokeStyle,
                    textStyle: style.textStyle,
                    shadowStyle: style.shadowStyle,
                });

                return selected;

                // this.diagram.render('all');
                // this.diagram.renderPreview();
                // this.diagram.eventDispatcher.styleChanged('paste-styles');
            })
    }

    /**
     * Checks if the clipboard contains styles that can be pasted into selected nodes.
     * @returns A promise that resolves to true if styles are available for pasting, false otherwise.
     */
    public hasStyles(): Promise<boolean> {
        return this.readClipboardText()
            .then((json) => {
                this.can_paste_styles = false;

                const style = JSON.parse(json);
                if (!style || typeof style !== 'object') return false;

                if (style.strokeStyle || style.fillStyle || style.textColor || style.lineWidth || style.lineDash
                    || style.fontFace || style.fontSize || style.textAlign || style.textBaseline
                    || style.shadowStyle
                    || style.image_id || style.image_mode || style.image_align || style.image_padding) {

                    this.can_paste_styles = true;
                    return true;
                } else {
                    return false;
                }
            });
    }

    /**
     * Copies the selected nodes to the clipboard in JSON format. 
     * The copied data includes all properties of the nodes, allowing for accurate reconstruction when pasted. 
     * After copying, the `canPaste` flag is set to true, indicating that there is data available in the clipboard that can be pasted into the diagram.
     * @param operation The clipboard operation type, either 'copy' or 'cut'. Defaults to 'copy'.
     * @returns An array of the nodes that were copied to the clipboard.
     */
    public copySelected(): INode[] {
        const nodes = this.diagram.selection();
        if (!nodes.length) {
            return [];
        }

        const serialized = nodes.map(node => (this.diagram as any).serializeNode(node));

        /* Collect only groups with selected members */
        const groups = this.diagram.groups.filter(group => group.nodes.some(id => nodes.some(node => node.id === id)));
        for (const group of groups) {
            group.nodes = group.nodes.filter(id => nodes.some(node => node.id === id));
        }

        /* Collect only the assets referenced by the copied nodes. */
        const allAssets = this.diagram.assetStore.snapshot();
        let image_assets: Record<string, string> | undefined;
        if (allAssets) {
            for (const node of serialized) {
                if (node.image_id && allAssets[node.image_id]) {
                    image_assets ??= {};
                    image_assets[node.image_id] = allAssets[node.image_id]!;
                }
            }
        }

        const envelope: DiagramClipboardEnvelope = { nodes: serialized, groups, image_assets };

        this.can_paste = true;
        // this.emitClipboardChange(operation, nodes);

        void this.writeClipboardText(jsonSerializer.write(envelope));
        return nodes;
    }

    /**
     * Pastes nodes from the clipboard into the diagram.
     * @returns A promise that resolves to an array of the nodes that were pasted into the diagram.
     */
    public pasteNodes(): Promise<INode[]> {
        return this.readClipboardText()
            .then((json) => {
                const envelope = this.parseClipboardEnvelope(json)
                    || this.parseClipboardEnvelope(this.clipboardSnapshot);

                if (!envelope || !envelope.nodes.length) {
                    return [];
                }

                /* Merge referenced groups into this diagram before hydrating. */
                if (envelope.groups?.length) {
                    for (const group of envelope.groups) {
                        /* We only need the groups, members will be cloned into them */
                        this.diagram.groups.push(group);    // { id: group.id, nodes: [] });
                    }
                }

                /* Merge referenced assets into this diagram's store before hydrating. */
                if (envelope.image_assets) {
                    this.diagram.assetStore.merge(envelope.image_assets);
                }

                this.diagram.addUndo();
                const pastedNodes = this.cloneNodes(envelope.nodes);
                this.diagram.setSelection(pastedNodes);

                this.can_paste = true;
                // this.emitClipboardChange('paste', pastedNodes);

                // this.diagram.render('all');
                // this.diagram.renderPreview();

                return pastedNodes;
            });
    }

    /**
     * Checks if the clipboard contains nodes that can be pasted into the diagram.
     * @returns A promise that resolves to true if nodes are available for pasting, false otherwise.
     */
    public hasNodes(): Promise<boolean> {
        return this.readClipboardText()
            .then(async (json) => {
                this.can_paste = false;

                const envelope = this.parseClipboardEnvelope(json)
                    || this.parseClipboardEnvelope(this.clipboardSnapshot);

                if (envelope?.nodes.length) {
                    this.can_paste = true;
                }
            })
            .then(() => this.can_paste);
    }

    /**
     * Writes clipboard text.
     * @param value The value value.
     * @returns The computed result.
     */
    private async writeClipboardText(value: string): Promise<void> {
        this.clipboardSnapshot = value;

        try {
            if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(value);
            }
        } catch (e) {
            console.error('Failed to write clipboard text', e);
        }
    }

    /**
     * Reads clipboard text.
     * @returns The computed result.
     */
    private async readClipboardText(): Promise<string> {
        try {
            if (typeof navigator !== 'undefined' && navigator.clipboard?.readText) {
                const value = await navigator.clipboard.readText();
                if (typeof value === 'string' && value.length) {
                    return value;
                }
            }
        } catch (e) {
            console.error('Failed to read clipboard text', e);
        }

        return this.clipboardSnapshot || '';
    }

    // /**
    //  * Emits clipboard change.
    //  * @param operation Clipboard operation type.
    //  * @param nodes Nodes to process.
    //  * @returns Nothing.
    //  */
    // private emitClipboardChange(operation: DiagramClipboardOperation, nodes: INode[] = []): void {
    //     this.diagram.eventDispatcher.clipboardChanged({
    //         operation,
    //         canPaste: this.can_paste,
    //         node: nodes[0],
    //         nodeId: nodes[0]?.id,
    //         nodes,
    //         nodeIds: nodes.map(node => node.id),
    //     });
    // }

    /**
     * Parses clipboard envelope.
     * @param json JSON payload to parse.
     * @returns The resolved value, or undefined when it cannot be resolved.
     */
    private parseClipboardEnvelope(json: string): DiagramClipboardEnvelope | undefined {
        if (!json?.length) return undefined;
        try {
            const payload = JSON.parse(json);
            if (payload && typeof payload === 'object' && !Array.isArray(payload) && Array.isArray(payload.nodes)) {
                return payload as DiagramClipboardEnvelope;
            }
            if (Array.isArray(payload)) {   // May not be required, but for backward compatibility, we allow a raw array of nodes to be pasted.
                return { nodes: payload as ISerializedNode[], groups: [], image_assets: {} };
            }
        } catch {
            /* ignore parse errors */
        }
        return undefined;
    }

    /**
     * Handles clone node.
     * @param node The target node.
     * @param id The identifier value.
     * @returns The computed result.
     */
    protected cloneNode(node: INode | ISerializedNode, id?: string): INode {
        return {
            ...node,    /* Must NOT use deepClone on INode */
            id: id || `${node.type}-clone-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            points: deepClone(node.points),         // node.points.map(p => ({ ...p })),
            ...(node.textStyle && { textStyle: deepClone(node.textStyle) }),
            ...(node.strokeStyle && { strokeStyle: deepClone(node.strokeStyle) }),
            ...(node.shadowStyle && { shadowStyle: deepClone(node.shadowStyle) }),
            ...(node.specific && { specific: deepClone(node.specific) }),
            ...(node.geometry && { geometry: deepClone(node.geometry) }),
            ...(node.meta && { meta: deepClone(node.meta) }),
        } as INode;
    }

    /**
     * Handles clone nodes, including id remapping, reconnecting anchors, and handling groups.
     * @param nodes The nodes to clone.
     * @returns The cloned nodes, already inserted into the current layer.
     */
    public cloneNodes(nodes: INode[] | ISerializedNode[]): INode[] {
        const layer = this.diagram.ensureCurrentLayer();
        const cloned: INode[] = [];

        /* First pass: assign new IDs so connection anchors within this
           paste batch can be remapped before any node is inserted. 
         */
        const idMap = new Map<string, string>();
        for (const node of nodes) {
            const newId = `${node.type}-clone-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
            idMap.set(node.id, newId);
        }

        const remapAnchor = (anchor: IConnectionAnchor | undefined): IConnectionAnchor | undefined => {
            if (!anchor) return undefined;
            const oldId = typeof anchor.node === 'string' ? anchor.node : anchor.node.id;
            const newId = idMap.get(oldId);
            return newId ? { ...anchor, node: newId } : { ...anchor };
        };

        /* Second pass: remap group memberships
            creating new cloned groups if there was a container node in the paste batch.
        */
        const groupMap: Map<string, IGroup> = new Map();
        for (let node of nodes) {       // }.filter(n => (n as IContainer & INode)?.owns_group)) {
            const group_id = (node as IContainer & INode)?.owns_group;
            if (group_id) {
                const group = this.diagram.group(group_id);
                if (group) {
                    /* create a clone group from selected nodes */
                    let cloned_group_id = `group-clone-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
                    let new_members = group.nodes.filter(id => idMap.has(id));
                    new_members = new_members.map(id => idMap.get(id)!);
                    const new_group = { id: cloned_group_id, nodes: new_members };
                    groupMap.set(group.id, new_group);

                    this.diagram.upsertGroup(new_group);
                }
            }
        }

        /* Finally, clone the nodes into the diagram. */
        for (let node of nodes) {
            const clone = this.cloneNode(node, idMap.get(node.id));
            const conn = clone as INode & IConnection;
            conn.from = remapAnchor(conn.from);
            conn.to = remapAnchor(conn.to);
            if ((clone as any).owns_group) (clone as any).owns_group = groupMap.get((clone as any).owns_group)?.id;
            this.diagram.upsertNode(clone);
            layer.nodes.push(clone.id);

            NodeBasics.moveBy(clone, 24, 24, 'ignore_scale');
            cloned.push(clone);
        }

        return cloned;
    }
}