import { NodeRegistry } from "../../factory/node.registry";
import { type INode } from "../../interfaces";
import { type IPoint } from "../../types";
import { isConnectionNode, isDiagramViewLike } from "../../guards";
import type { INodeCached } from "../../view/view.cache";
import { ConnectionBasics } from "../connection.basics";
import { PolylineAdapter } from "./polyline.adapter";
import { RenderBasics } from "../render.basics";

/**
 * CurveAdapter is a node adapter responsible for rendering curve nodes in the diagram. 
 * It extends the PolylineAdapter to leverage basic polyline rendering capabilities while adding specific logic for handling curved shapes and hit testing.
 * Registers with the NodeRegistry under the name 'curve'.
 * The curve is rendered using quadratic Bezier curves between points, providing a smooth appearance.
 * Hit testing is performed by checking proximity to control points and the curve path itself, allowing for intuitive interaction with the curve nodes.
 * The adapter also handles rendering of arrows for connection nodes, ensuring that directional indicators are properly displayed on curves.
 */
export class CurveAdapter extends PolylineAdapter {

    public static NAME = 'curve';

    has_text = false;

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
            this.renderCurve(node, path);
            context.stroke(path);
            if (isConnectionNode(node)) {
                ConnectionBasics.renderArrows(node, context);
            }

            cached.path = path;
            cache.setNode(node, cached);

            context.restore();
        }
    }

    override onCreateMove(node: INode, point: IPoint): void {
        while (node.points.length < 4) {
            node.points.push({ ...point });
        }
        node.points[1] = { x: point.x, y: node.points[0]!.y };
        node.points[2] = { x: node.points[0]!.x, y: point.y };
        node.points[3] = { ...point };
    }

    private renderCurve(node: INode, path: Path2D): void {
        if (node.points.length < 2) return;

        path.moveTo(node.points[0]!.x, node.points[0]!.y);

        if (node.points.length === 2) {
            path.lineTo(node.points[1]!.x, node.points[1]!.y);
            return;
        }

        let i = 1;
        for (; i < node.points.length - 2; i++) {
            const xc = (node.points[i]!.x + node.points[i + 1]!.x) / 2;
            const yc = (node.points[i]!.y + node.points[i + 1]!.y) / 2;
            path.quadraticCurveTo(node.points[i]!.x, node.points[i]!.y, xc, yc);
        }

        path.quadraticCurveTo(
            node.points[i]!.x,
            node.points[i]!.y,
            node.points[i + 1]!.x,
            node.points[i + 1]!.y,
        );
    }

    private gradient(a: IPoint, b: IPoint) {
        return (b.y - a.y) / (b.x - a.x);
    }
}