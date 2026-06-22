import { type INode } from "../../interfaces";
import { isConnectionNode, isDiagramViewLike } from "../../guards";
import type { INodeCached } from "../../view/view.cache";
import { ConnectionBasics } from "../connection.basics";
import { PolylineAdapter } from "./polyline.adapter";
import { RenderBasics } from "../render.basics";
import type { HollowMode, TextOverflowMode } from "../../factory/node.adapter";

/**
 * LineAdapter is a node adapter responsible for rendering line nodes in the diagram. 
 * It extends the PolylineAdapter to leverage basic polyline rendering capabilities while adding specific logic for handling straight lines and hit testing.
 * Registers with the NodeRegistry under the name 'line'.
 */
export class LineAdapter extends PolylineAdapter {

    public static NAME = 'line';

    hollow_mode: HollowMode = 'always';
    multistep_create = false;
    has_text = true;
    text_overflow = 'visible' as TextOverflowMode;

    render(node: INode, context: CanvasRenderingContext2D): void {
        if (!context) return;
        const diagram = node.owner;
        if (!isDiagramViewLike(diagram)) return;
        const cache = diagram.getCache();
        const cached = cache.getNode(node) || {} as INodeCached;

        if (node.points.length > 1) {
            context.save();
            RenderBasics.prepare(node, context);
            if (isConnectionNode(node)) {
                ConnectionBasics.syncEndpoints(node);
            }

            const path = new Path2D();
            this.renderLine(node, path);
            context.stroke(path);
            if (isConnectionNode(node)) {
                ConnectionBasics.renderArrows(node, context);
            }

            if (node.text) {
                const from = node.points[0]!;
                const to = node.points[1]!;
                RenderBasics.renderText(node, context, { overflow: this.text_overflow, from, to });
            }

            cached.path = path;
            cache.setNode(node, cached);

            context.restore();
        }
    }

    private renderLine(node: INode, path: Path2D): void {
        const from = node.points[0]!;
        const to = node.points[node.points.length - 1]!;

        path.moveTo(from.x, from.y);

        if (node.points.length >= 4) {
            const firstPoint = node.points[1]!;
            const lastPoint = node.points[node.points.length - 2]!;
            path.bezierCurveTo(firstPoint.x, firstPoint.y, lastPoint.x, lastPoint.y, to.x, to.y);
            return;
        }

        if (node.points.length === 3) {
            const control = node.points[1]!;
            path.quadraticCurveTo(control.x, control.y, to.x, to.y);
            return;
        }

        path.lineTo(to.x, to.y);
    }
}