import { NodeRegistry } from "../../factory/node.registry";
import type { INode } from "../../interfaces";
import { isDiagramViewLike } from "../../guards";
import type { INodeCached } from "../../view/view.cache";
import { PolylineAdapter } from "../polyline/polyline.adapter";
import { RenderBasics } from "../render.basics";
import type { HollowMode, TextOverflowMode } from "../../factory/node.adapter";


/**
 * PolygonAdapter is a node adapter responsible for rendering polygon nodes in the diagram. 
 * It extends the PolylineAdapter to leverage basic polyline rendering capabilities while adding specific logic for handling closed shapes and hit testing.
 * Registers with the NodeRegistry under the name 'polygon'.
 */
export class PolygonAdapter extends PolylineAdapter {

    public static NAME = 'polygon';

    hollow_mode: HollowMode = 'if_transparent';
    has_text = true;
    text_overflow: TextOverflowMode = 'hidden';

    render(node: INode, context: CanvasRenderingContext2D): void {
        if (!context) return;
        const diagram = node.owner;
        if (!isDiagramViewLike(diagram)) return;
        const coordinates = diagram.getCoordinates();
        const cache = diagram.getCache();
        const cached = cache.getNode(node) || {} as INodeCached;

        if (node.points.length > 1) {
            context.save();
            RenderBasics.prepare(node, context);

            const path = new Path2D();
            path.moveTo(node.points[0]!.x, node.points[0]!.y);
            for (let i = 1; i < node.points.length; i++) {
                path.lineTo(node.points[i]!.x, node.points[i]!.y);
            }
            path.closePath();

            const rect = coordinates.getBoundingRect(node);
            context.fill(path);
            RenderBasics.renderImage(node, context, rect, path);
            context.stroke(path);

            cached.path = path;
            cache.setNode(node, cached);

            context.restore();
        }
    }
}
