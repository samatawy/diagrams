import { NodeRegistry } from "../../factory/node.registry";
import type { INode } from "../../interfaces";
import { isDiagramViewLike } from "../../guards";
import type { INodeCached } from "../../view/view.cache";
import { RectangleAdapter } from "./rectangle.adapter";
import { RenderBasics } from "../render.basics";
import { isHollow } from "../../value.utils";

/**
 * EllipseAdapter is a node adapter responsible for rendering ellipse nodes in the diagram. 
 * It extends the RectangleAdapter to leverage basic rectangle rendering capabilities while adding specific logic for handling elliptical shapes and hit testing.
 * Registers with the NodeRegistry under the name 'ellipse'.
 */
export class EllipseAdapter extends RectangleAdapter {

    public static TYPE = 'ellipse';

    render(node: INode, context: CanvasRenderingContext2D): void {
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
            RenderBasics.prepare(node, context);

            const path = new Path2D();
            path.ellipse(
                rect.left + rect.width / 2,
                rect.top + rect.height / 2,
                rect.width / 2,
                rect.height / 2,
                0, 0, 2 * Math.PI);

            context.fill(path);
            RenderBasics.renderImage(node, context, rect, path);
            if (!isHollow(node)) {
                RenderBasics.skipShadow(context);
            }
            context.stroke(path);

            RenderBasics.renderText(node, context, { overflow: this.text_overflow, path });

            cached.path = path;
            cache.setNode(node, cached);

            context.restore();
        }
    }

    public onCreateDraft(tool: string): Partial<INode> | undefined {
        return {
            type: this.type,
            points: [{ x: 0, y: 0 }, { x: 104, y: 64 }],
        }
    }

}
