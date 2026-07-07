import type { INode } from "../../interfaces";
import { isDiagramViewLike } from "../../guards";
import type { INodeCached } from "../../view/view.cache";
import { RectangleAdapter } from "./rectangle.adapter";
import { RenderBasics } from "../render.basics";
import { isHollow } from "../../value.utils";
import { NodeHandle, type IPoint } from "../../types";

/**
 * RhombusAdapter is a node adapter responsible for rendering rhombus nodes in the diagram. 
 * It extends the RectangleAdapter to leverage basic rectangle rendering capabilities while adding specific logic for handling rhombus shapes and hit testing.
 * Registers with the NodeRegistry under the name 'rhombus'.
 */
export class RhombusAdapter extends RectangleAdapter {

    public static TYPE = 'rhombus';

    min_width: number = 16;
    min_height: number = 16;
    connection_handles: NodeHandle[] = [NodeHandle.N, NodeHandle.S, NodeHandle.E, NodeHandle.W];

    render(node: INode, context: CanvasRenderingContext2D, show?: 'all' | 'quick'): void {
        if (!context) return;
        const diagram = node.owner;
        if (!isDiagramViewLike(diagram)) return;
        const coordinates = diagram.getCoordinates();
        const cache = diagram.getCache();
        const cached = cache.getNode(node) || {} as INodeCached;

        if (node.points.length > 1) {
            let from = { x: node.points[0]!.x, y: node.points[0]!.y }
            let to = { x: node.points[0]!.x, y: node.points[0]!.y }
            for (let pt of node.points) {
                from.x = Math.min(from.x, pt!.x)
                from.y = Math.min(from.y, pt!.y)
                to.x = Math.max(to.x, pt!.x)
                to.y = Math.max(to.y, pt!.y)
            }

            let rect = coordinates.getBoundingRect(node);

            context.save();
            RenderBasics.prepare(node, context, show);

            const path = new Path2D();
            path.moveTo(rect.left + rect.width / 2, rect.top);
            path.lineTo(rect.left + rect.width, rect.top + rect.height / 2);
            path.lineTo(rect.left + rect.width / 2, rect.top + rect.height);
            path.lineTo(rect.left, rect.top + rect.height / 2);
            path.closePath();

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
            type: this.type,
            points: [{ x: 0, y: 0 }, { x: 64, y: 64 }],
        }
    }

}
