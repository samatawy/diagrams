import type { INode } from "../../interfaces";
import { isDiagramViewLike } from "../../guards";
import { RenderBasics } from "../render.basics";
import { isHollow } from "../../value.utils";
import { NodeHandle } from "../../types";
import { RectangleAdapter } from "../rectangle/rectangle.adapter";
import { DATA_FILL_STYLE } from "./Bpmn.Basics";
import type { INodeCached } from "../../view/view.cache";

export class BpmnDataObjectAdapter extends RectangleAdapter {

    static readonly TYPE = 'bpmn_data_object';

    connection_handles = [NodeHandle.N, NodeHandle.S, NodeHandle.E, NodeHandle.W,
    // NodeHandle.NE, 
    NodeHandle.NW, NodeHandle.SE, NodeHandle.SW
    ];

    public render(node: INode, context: CanvasRenderingContext2D, show?: 'all' | 'quick'): void {
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

            const fold = 16;
            const path = new Path2D();
            // path.rect(rect.left, rect.top, rect.width, rect.height);

            // path.moveTo(rect.left, rect.top);
            path.moveTo(rect.left + rect.width - fold, rect.top);
            path.lineTo(rect.left + rect.width - fold, rect.top + fold);
            path.lineTo(rect.left + rect.width, rect.top + fold);
            path.lineTo(rect.left + rect.width - fold, rect.top);

            path.moveTo(rect.left + rect.width, rect.top + fold);
            path.lineTo(rect.left + rect.width, rect.top + rect.height);
            path.lineTo(rect.left, rect.top + rect.height);
            path.lineTo(rect.left, rect.top);
            path.lineTo(rect.left + rect.width - fold, rect.top);
            // path.closePath();

            context.fill(path);
            RenderBasics.renderImage(node, context, rect, path);

            if (!isHollow(node)) {
                RenderBasics.skipShadow(context);
            }
            context.stroke(path);

            if (node.text && show !== 'quick') {
                RenderBasics.renderText(node, context, { overflow: this.text_overflow, path });
            }

            cached.path = path;
            cache.setNode(node, cached);

            context.restore();
        }
    }

    public onCreateDraft(tool: string): Partial<INode> | undefined {
        return {
            type: 'bpmn_data_object',
            points: [{ x: 0, y: 0 }, { x: 64, y: 80 }],
            fillStyle: {
                color: DATA_FILL_STYLE,
            },
        }
    }
}