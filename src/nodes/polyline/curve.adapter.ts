import { NodeRegistry } from "../../factory/node.registry";
import { type INode } from "../../interfaces";
import { type ITextOrientation, type IPoint } from "../../types";
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

    public static TYPE = 'curve';

    has_text = true;
    text_orientations: ITextOrientation[] = ['horizontal'];

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

            if (node.text) {
                const placement = this.textPlacement(node);
                const segment = placement?.segment;
                if (segment) {
                    RenderBasics.renderText(node, context, {
                        overflow: this.text_overflow,
                        from: segment.from,
                        to: segment.to,
                    });
                }
            }

            cached.path = path;
            cache.setNode(node, cached);

            context.restore();
        }
    }

    renderSelection(node: INode, context: CanvasRenderingContext2D): void {
        super.renderSelection(node, context);

        if (!context || node.points.length <= 2) return;

        context.save();
        RenderBasics.prepareHandles(node, context);
        context.strokeStyle = 'rgba(0,0,0,.25)';
        context.setLineDash([4, 2]);

        const handles = new Path2D();

        handles.moveTo(node.points[0]!.x, node.points[0]!.y);
        handles.lineTo(node.points[1]!.x, node.points[1]!.y);

        if (node.points.length > 3) {
            handles.moveTo(node.points[node.points.length - 1]!.x, node.points[node.points.length - 1]!.y);
            handles.lineTo(node.points[node.points.length - 2]!.x, node.points[node.points.length - 2]!.y);
        }
        context.fill(handles);
        context.stroke(handles);

        context.restore();
    }

    override onCreateMove(node: INode, point: IPoint): void {
        while (node.points.length < 4) {
            node.points.push({ ...point });
        }

        const p0 = node.points[0]!;
        const dx = point.x - p0.x;
        const dy = point.y - p0.y;

        // Use the same stub as Manhattan routing for a consistent minimum handle offset.
        const stub = 24;

        const sx = Math.sign(dx) || 1;
        const sy = Math.sign(dy) || 1;

        const ctrl1: IPoint = {
            x: p0.x + sx * stub,
            y: p0.y + sy * stub,
        };
        const ctrl2: IPoint = {
            x: point.x - sx * stub,
            y: point.y - sy * stub,
        };

        node.points[1] = ctrl1;
        node.points[2] = ctrl2;
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