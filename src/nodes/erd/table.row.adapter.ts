import type { TextOverflowMode } from "../../factory";
import { isDiagramViewLike } from "../../guards";
import type { INode } from "../../interfaces";
import { DiagramConstants } from "../../model/diagram.constants";
import { NodeHandle, type IPoint, type ITextBaseline, type ITextOrientation } from "../../types";
import type { INodeCached } from "../../view/view.cache";
import { RectangleAdapter } from "../rectangle/rectangle.adapter";
import { RenderBasics } from "../render.basics";

export class TableRowAdapter extends RectangleAdapter {

    public static TYPE = 'table_row';

    can_rotate = false;
    drag_create = true;
    connection_handles = [NodeHandle.E, NodeHandle.W];
    resize_handles = [];
    single_line_text = true;
    text_overflow: TextOverflowMode = 'hidden';
    text_baselines: ITextBaseline[] = ['middle'];
    text_orientations: ITextOrientation[] = ['horizontal'];

    /**
     * Overrides the render method to skip certain elements.
     * @param node 
     * @param context 
     * @param show 
     */
    public override render(node: INode, context: CanvasRenderingContext2D, show?: 'all' | 'quick'): void {
        if (!context) return;
        const diagram = node.owner;
        if (!isDiagramViewLike(diagram)) return;

        const coordinates = diagram.getCoordinates();
        const cache = diagram.getCache();
        const cached = cache.getNode(node) || {} as INodeCached;

        if (node.points.length > 1) {
            let rect = coordinates.getBoundingRect(node);

            context.save();
            RenderBasics.prepare(node, context, show);

            const path = new Path2D();
            path.rect(rect.left, rect.top, rect.width, rect.height);
            context.fill(path);

            RenderBasics.skipShadow(context);
            context.stroke(path);

            if (node.text && show !== 'quick') {
                RenderBasics.renderText(node, context, { overflow: this.text_overflow, path });
            }

            cached.path = path;
            cache.setNode(node, cached);

            context.restore();
        }
    }

    public renderSelection(node: INode, context: CanvasRenderingContext2D, show: 'all_handles' | 'connection_handles') {
        if (!context) return;
        const diagram = node.owner;
        if (!isDiagramViewLike(diagram)) return;
        const coordinates = diagram.getCoordinates();

        if (node.points.length > 1) {
            const rect = coordinates.getBoundingRect(node);
            const epsilon = DiagramConstants.HANDLE_HIT_EPSILON;
            const allowed = (show === 'connection_handles') ?
                this.connection_handles :
                [NodeHandle.N, NodeHandle.S, NodeHandle.E, NodeHandle.W, NodeHandle.NE, NodeHandle.NW, NodeHandle.SE, NodeHandle.SW, NodeHandle.ROTATE, NodeHandle.ALTER];

            context.save();
            RenderBasics.prepareHandles(node, context);

            const handles = new Path2D();

            // E
            if (allowed.includes(NodeHandle.E)) {
                RenderBasics.renderHandle(node, { x: rect.left + rect.width, y: rect.top + rect.height / 2 }, handles, context);
            }

            // W
            if (allowed.includes(NodeHandle.W)) {
                RenderBasics.renderHandle(node, { x: rect.left, y: rect.top + rect.height / 2 }, handles, context);
            }

            context.fill(handles);
            context.stroke(handles);
            context.restore();
        }
    }

    public override hitTest(node: INode, point: IPoint): NodeHandle {
        const result = super.hitTest(node, point);
        // Allow only MOVE (body), E and W (connection anchors). All resize handles are suppressed.
        if (result === NodeHandle.MOVE || result === NodeHandle.E || result === NodeHandle.W) {
            return result;
        }
        return NodeHandle.NONE;
    }

    public override canConnect(node: INode, direction: "from" | "to", handle: NodeHandle, point: IPoint): boolean {
        if (!this.connection_handles.includes(handle)) return false;
        return node.ready === true;
    }


    public onCreateDraft(tool: string): Partial<INode> | undefined {
        return {
            type: this.type,
            points: [{ x: 0, y: 0 }, { x: 104, y: 16 }],
            text: 'Row',
            textStyle: {
                size: 10,
                align: 'left',
                baseline: 'middle',
            },
            geometry: {
                index: -1
            }
        }
    }
}