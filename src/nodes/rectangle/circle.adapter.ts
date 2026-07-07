import { isDiagramViewLike } from "../../guards";
import type { INode } from "../../interfaces";
import { NodeHandle, type IPoint } from "../../types";
import { isHollow } from "../../value.utils";
import type { INodeCached } from "../../view/view.cache";
import { RenderBasics } from "../render.basics";
import { EllipseAdapter } from "./ellipse.adapter";

/**
 * CircleAdapter is a node adapter responsible for rendering circle nodes in the diagram. 
 * It extends the RectangleAdapter to leverage basic rectangle rendering capabilities while adding specific logic for handling circular shapes and hit testing.
 * Registers with the NodeRegistry under the name 'circle'.
 */
export class CircleAdapter extends EllipseAdapter {

    public static TYPE = 'circle';

    min_width: number = 16;
    min_height: number = 16;

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
                from.x = Math.min(from.x, pt!.x)
                from.y = Math.min(from.y, pt!.y)
                to.x = Math.max(to.x, pt!.x)
                to.y = Math.max(to.y, pt!.y)
            }

            let rect = coordinates.getBoundingRect(node);

            context.save();
            RenderBasics.prepare(node, context, show);

            const path = new Path2D();
            path.arc(
                rect.left + rect.width / 2,
                rect.top + rect.height / 2,
                Math.min(rect.width, rect.height) / 2,
                0, 2 * Math.PI);
            // path.ellipse(
            //     rect.left + rect.width / 2,
            //     rect.top + rect.height / 2,
            //     rect.width / 2,
            //     rect.height / 2,
            //     0, 0, 2 * Math.PI);

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
            locked_aspect: true,
            points: [{ x: 0, y: 0 }, { x: 84, y: 84 }],
        }
    }

    // public onCreateMove(node: INode, point: IPoint): void {
    //     super.onCreateMove(node, point);
    //     if (node.points.length > 1) {
    //         const width = node.points[1]!.x - node.points[0]!.x;
    //         const height = node.points[1]!.y - node.points[0]!.y;

    //         if (width !== height) {
    //             const size = Math.min(width, height);
    //             node.points[1]!.x = node.points[0]!.x + size;
    //             node.points[1]!.y = node.points[0]!.y + size;
    //         }
    //     }
    // }

}
