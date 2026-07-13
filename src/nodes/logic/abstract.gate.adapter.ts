import type { IConnectionAnchor, IHandlePoint, INode } from "../../interfaces";
import { NodeHandle, type AnchorScope, type IPoint, type IRect } from "../../types";
import { isDiagramViewLike } from "../../guards";
import type { INodeCached } from "../../view/view.cache";
import { RectangleAdapter } from "../rectangle/rectangle.adapter";
import { RenderBasics } from "../render.basics";
import { isHollow } from "../../value.utils";

/**
 * AbstractGateAdapter is a node adapter responsible for rendering generic logic gate nodes in the diagram. 
 * It extends the RectangleAdapter to leverage basic rectangle rendering capabilities while adding specific logic for handling gate shapes and hit testing.
 * Registers with the NodeRegistry under the appropriate gate name.
 */
export abstract class AbstractGateAdapter extends RectangleAdapter {

    has_text = false;
    min_width = 24;
    min_height = 24;

    connection_handles: NodeHandle[] = [NodeHandle.E, NodeHandle.W];

    protected aspect_ratio = 1;

    public getAnchors(node: INode, show: AnchorScope): IHandlePoint[] {
        return super.getAnchors(node, show);
    }

    protected abstract renderGateShape(node: INode, rect: IRect, context: CanvasRenderingContext2D, show?: 'all' | 'quick'): Path2D;

    public override render(node: INode, context: CanvasRenderingContext2D, show?: 'all' | 'quick'): void {
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
                from.x = Math.min(from.x, pt.x)
                from.y = Math.min(from.y, pt.y)
                to.x = Math.max(to.x, pt.x)
                to.y = Math.max(to.y, pt.y)
            }
            let rect: IRect = { left: from.x, top: from.y, width: to.x - from.x, height: to.y - from.y }

            /* Draw a horizontal AND logic gate, inputs on the left and output on the right */

            context.save();
            RenderBasics.prepare(node, context, show);

            const path = this.renderGateShape(node, rect, context, show);

            context.fill(path);

            if (!isHollow(node)) {
                RenderBasics.skipShadow(context);
            }
            context.stroke(path);

            cached.path = path;
            cache.setNode(node, cached);

            context.restore();
        }
    }

    public onCreateDraft(tool: string): Partial<INode> | undefined {
        let width = 40, height = 40;
        if (this.aspect_ratio > 1) {
            width = height * this.aspect_ratio;
        } else if (this.aspect_ratio < 1) {
            height = width / this.aspect_ratio;
        }

        return {
            type: this.type,
            locked_aspect: true,
            points: [{ x: 0, y: 0 }, { x: width, y: height }],
            strokeStyle: {
                color: '#000000',
                width: 1,
            },
        }
    }

}