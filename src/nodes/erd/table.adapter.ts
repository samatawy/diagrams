import { isContainer, isDiagramViewLike } from "../../guards";
import type { IContainer, INode } from "../../interfaces";
import { isHollow } from "../../value.utils";
import type { INodeCached } from "../../view/view.cache";
import { VerticalPoolAdapter } from "../container/vertical.pool.adapter";
import { RenderBasics } from "../render.basics";
import { NodeHandle, type AnchorScope, type IPoint } from "../../types";
import { GroupBasics } from "../group.basics";
import { DiagramConstants } from "../../model/diagram.constants";
import { NodeRegistry } from "../../factory/node.registry";

export class TableAdapter extends VerticalPoolAdapter {

    public static TYPE = 'table';

    connection_handles = [NodeHandle.N, NodeHandle.S];

    public override render(node: INode, context: CanvasRenderingContext2D, show?: 'all' | 'quick'): void {

        if (!context) return;
        const diagram = node.owner;
        if (!isDiagramViewLike(diagram)) return;

        const coordinates = diagram.getCoordinates();
        const cache = diagram.getCache();
        const cached = cache.getNode(node) || {} as INodeCached;

        if (node.points.length > 1) {
            this.layoutRows(node);

            let rect = coordinates.getBoundingRect(node);
            let radius = this.getCornerRadius(node, rect);

            context.save();
            RenderBasics.prepare(node, context, show);

            const path = new Path2D();
            path.moveTo(rect.left, rect.top + radius);
            // NW
            path.arcTo(rect.left, rect.top, rect.left + radius, rect.top, radius);
            path.lineTo(rect.left + rect.width - radius, rect.top);
            // NE
            path.arcTo(rect.left + rect.width, rect.top, rect.left + rect.width, rect.top + radius, radius);
            path.lineTo(rect.left + rect.width, rect.top + rect.height - radius);

            // South corners are not curved in current implementation.
            radius = 0;

            // SE
            path.arcTo(rect.left + rect.width, rect.top + rect.height, rect.left + rect.width - radius, rect.top + rect.height, radius);
            path.lineTo(rect.left + radius, rect.top + rect.height);
            // SW
            path.arcTo(rect.left, rect.top + rect.height, rect.left, rect.top + rect.height - radius, radius);
            path.closePath();
            // path.rect(rect.left, rect.top, rect.width, rect.height);

            context.fill(path);
            RenderBasics.renderImage(node, context, rect, path);

            if (!isHollow(node)) {
                RenderBasics.skipShadow(context);
            }
            context.stroke(path);

            if (node.text && show !== 'quick') {
                if (node.specific?.rows && node.specific?.columns) {
                    node.textStyle = node.textStyle || {};
                    node.textStyle.baseline = 'top';
                    node.textStyle.orientation = 'horizontal';
                    node.textStyle.size = Math.max(Math.min(node.textStyle.size || 0, 12), 8);
                }
                RenderBasics.renderText(node, context, { overflow: this.text_overflow, path });
            }

            cached.path = path;
            cache.setNode(node, cached);

            context.restore();
        }
    }

    public override renderSelection(node: INode, context: CanvasRenderingContext2D, show: AnchorScope) {
        // super.renderSelection(node, context);

        if (!context) return;
        const diagram = node.owner;
        if (!isDiagramViewLike(diagram)) return;
        const coordinates = diagram.getCoordinates();

        if (node.points.length > 1) {
            const rect = coordinates.getBoundingRect(node);
            const epsilon = DiagramConstants.HANDLE_HIT_EPSILON;

            // Not needed in this node type as all visible points are known to be connection-ready.
            // EXCEPT ALTER for descendants?
            // const allowed = (show === 'connection_handles') ?
            //     this.connection_handles :
            //     [NodeHandle.N, NodeHandle.S, NodeHandle.E, NodeHandle.W, NodeHandle.NE, NodeHandle.NW, NodeHandle.SE, NodeHandle.SW, NodeHandle.ROTATE];

            context.save();
            RenderBasics.prepareHandles(node, context);

            const handles = new Path2D();


            const anchors = NodeRegistry.adapter(node.type)?.getAnchors(node, show) ?? [];
            for (const anchor of anchors) {
                RenderBasics.renderHandle(node, anchor.point, handles, context);
                break;
            }

            // // NW            
            // RenderBasics.renderHandle(node, { x: rect.left, y: rect.top }, handles, context);

            // // SW
            // RenderBasics.renderHandle(node, { x: rect.left, y: rect.top + rect.height }, handles, context);

            // // NE
            // RenderBasics.renderHandle(node, { x: rect.left + rect.width, y: rect.top }, handles, context);

            // // SE
            // RenderBasics.renderHandle(node, { x: rect.left + rect.width, y: rect.top + rect.height }, handles, context);

            // // N
            // RenderBasics.renderHandle(node, { x: rect.left + rect.width / 2, y: rect.top }, handles, context);

            // // S
            // RenderBasics.renderHandle(node, { x: rect.left + rect.width / 2, y: rect.top + rect.height }, handles, context);

            // E
            // RenderBasics.renderHandle(node, { x: rect.left + rect.width, y: rect.top + rect.height / 2 }, handles, context);

            // W
            // RenderBasics.renderHandle(node, { x: rect.left, y: rect.top + rect.height / 2 }, handles, context);

            context.fill(handles);
            context.stroke(handles);

            // line dash respecting the current zoom level
            // [6 / zoom, 4 / zoom])
            context.setLineDash([6 / coordinates.zoom, 6 / coordinates.zoom]);
            context.lineDashOffset = diagram.animations.enabled ? diagram.animations.lineDashOffset : 0;

            const holder = new Path2D();
            holder.rect(rect.left + epsilon, rect.top + epsilon, rect.width - 2 * epsilon, rect.height - 2 * epsilon);

            context.stroke(holder);

            // if (allowed.includes(NodeHandle.ALTER)) {
            if (show === 'all_handles' || show === 'selection_handles') {
                this.renderAlterHandle(node, context, rect);
            }

            context.restore();
        }
    }

    // public afterResize(node: INode, _handle: NodeHandle): void {
    //     // Resize all child rows to match the new width of the table
    //     if (!isContainer(node)) return;

    //     const diagram = node.owner;
    //     if (!isDiagramViewLike(diagram)) return;

    //     const coordinates = diagram.getCoordinates();
    //     const cache = diagram.getCache();

    //     const group = GroupBasics.ownedGroup(node);
    //     if (!group) return;

    //     const rect = coordinates.getBoundingRect(node);
    //     const top_padding = (node.textStyle?.size || 12) * 1.4 + 4; /* 1.4; */
    //     const table_height = rect.height - top_padding;

    //     /* Find the group members that are rows */
    //     let rows = group.nodes
    //         .map(id => diagram.node(id))
    //         .filter(row => row && row.type === 'table_row');

    //     this.ensureIndices(rows as INode[]);
    //     let sorted = rows.sort((a, b) => +(a?.geometry?.index || 0) - +(b?.geometry?.index || 0));
    //     const row_height = 24;  //Math.min(table_height / group.nodes.length, 16); // Ensure a minimum row height of 16

    //     let r = 0;
    //     sorted.forEach(row => {
    //         // const row = diagram.node(id);
    //         // if (!row || row.type !== 'table_row') return;

    //         row!.points = [
    //             {
    //                 x: rect.left,
    //                 y: rect.top + top_padding + (r * row_height)
    //             },
    //             {
    //                 x: rect.left + rect.width,
    //                 y: rect.top + top_padding + ((r + 1) * row_height)
    //             }
    //         ];
    //         cache.deleteNode(row!); // Clear cached path for the child row
    //         r++;
    //     });

    //     if (sorted.length > 0) {
    //         node.points[1]!.y = sorted[sorted.length - 1]!.points[1]!.y; // Adjust the bottom of the table to match the last row
    //     }
    // }

    private layoutRows(node: INode): void {
        if (!isContainer(node)) return;

        const diagram = node.owner;
        if (!isDiagramViewLike(diagram)) return;

        const coordinates = diagram.getCoordinates();
        const cache = diagram.getCache();

        const group = GroupBasics.ownedGroup(node);
        if (!group) return;

        const rect = coordinates.getBoundingRect(node);
        const top_padding = (node.textStyle?.size || 12) * 1.4 + 4; /* 1.4; */
        const table_height = rect.height - top_padding;

        /* Find the group members that are rows */
        let rows = group.nodes
            .map(id => diagram.node(id))
            .filter(row => row && row.type === 'field');

        this.ensureIndices(rows as INode[]);
        let sorted = rows.sort((a, b) => +(a?.geometry?.index || 0) - +(b?.geometry?.index || 0));
        const row_height = 24;

        let r = 0;
        sorted.forEach(row => {

            row!.points = [
                {
                    x: rect.left,
                    y: rect.top + top_padding + (r * row_height)
                },
                {
                    x: rect.left + rect.width,
                    y: rect.top + top_padding + ((r + 1) * row_height)
                }
            ];
            cache.deleteNode(row!); // Clear cached path for the child row
            r++;
        });

        if (sorted.length > 0) {
            node.points[1]!.y = sorted[sorted.length - 1]!.points[1]!.y; // Adjust the bottom of the table to match the last row
        }
    }

    /* Ensure an index for each row to preserve ordering */
    private ensureIndices(rows: INode[]): void {
        const indexed = new Set<number>();
        for (const row of rows) {
            if (row.geometry?.index !== undefined && +row.geometry?.index >= 0) {
                indexed.add(+row.geometry.index);
            }
        }

        let index = indexed.size > 0 ? Math.max(...indexed) + 1 : 0;
        for (const row of rows) {
            if (row.geometry?.index === undefined || +row.geometry?.index < 0) {
                row!.geometry = row!.geometry || {};
                row!.geometry.index = index;

                if (!row.text || row.text.trim() === 'Row') {
                    row.text = `Row ${index}`;
                }
                index++;
            }
        }
    }

    public onCreateDraft(tool: string): Partial<INode & IContainer> | undefined {
        return {
            type: this.type,
            points: [{ x: 0, y: 0 }, { x: 104, y: 64 }],
            text: 'Table',
            textStyle: {
                size: 12,
                align: 'center',
                baseline: 'top',
            },
            geometry: { radius: 8 },    // DiagramConstants.HANDLE_HIT_EPSILON },

            owns_group: `table-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        }
    }
}