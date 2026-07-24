import type { INode } from "../../interfaces";
import { isDiagramViewLike } from "../../guards";
import type { INodeCached } from "../../view/view.cache";
import { RectangleAdapter } from "./rectangle.adapter";
import { RenderBasics } from "../render.basics";
import type { HollowMode } from "../../factory/node.adapter";
import { imageMode } from "../../value.utils";

/**
 * SvgAdapter is a node adapter responsible for rendering SVG nodes in the diagram. 
 * It extends the RectangleAdapter to leverage basic rectangle rendering capabilities while adding specific logic for handling SVG content and hit testing.
 * Registers with the NodeRegistry under the name 'svg'.
 */
export class SvgAdapter extends RectangleAdapter {

    public static TYPE = 'svg';

    hollow_mode: HollowMode = 'never';

    render(node: INode, context: CanvasRenderingContext2D, show?: 'all' | 'quick'): void {
        if (!context) return;
        const diagram = node.owner;
        if (!isDiagramViewLike(diagram)) return;
        const coordinates = diagram.getCoordinates();
        const cache = diagram.getCache();
        const cached = cache.getNode(node) || {} as INodeCached;

        if (node.points.length > 1) {
            const rect = coordinates.getBoundingRect(node);

            context.save();
            RenderBasics.prepare(node, context, show);

            const path = new Path2D();
            path.rect(rect.left, rect.top, rect.width, rect.height);

            if (imageMode(node) !== 'none') {
                RenderBasics.renderImage(node, context, rect, path);
            } else {
                context.fill(path);
            }


            cached.path = path;
            cache.setNode(node, cached);

            context.restore();
        }
    }
}