import { type INode } from "../../interfaces";
import { PolylineAdapter } from "../polyline/polyline.adapter";
import type { HollowMode } from "../../factory/node.adapter";
import { NodeHandle, type IPoint } from "../../types";
import { isDiagramViewLike } from "../../guards";
import type { INodeCached } from "../../view/view.cache";
import { RenderBasics } from "../render.basics";
import { DiagramConstants } from "../../model";
import { hexLuminance } from "../../value.utils";

/**
 * FreehandAdapter is a node adapter responsible for rendering freehand nodes in the diagram.
 * It extends the PolylineAdapter to leverage basic polyline rendering capabilities while adding specific logic for handling straight lines and hit testing.
 * Registers with the NodeRegistry under the name 'freehand'.
 */
export class FreehandAdapter extends PolylineAdapter {

    public static TYPE = 'freehand';

    hollow_mode: HollowMode = 'always';
    is_connector = false;
    multistep_create = false;
    has_text = false;
    connection_handles: NodeHandle[] = [];
    can_rotate = false;

    // public canConnect(node: INode, direction: 'from' | 'to' | 'any', handle: NodeHandle, point?: IPoint): boolean {
    //     return false;
    // }

    public override canConnectTo(node: INode, handle: NodeHandle, direction: "from" | "to" | "any", target?: Partial<INode>, point?: IPoint): boolean {
        return false;
    }

    public hitTest(node: INode, point: IPoint, point_as: 'pointer' | 'diagram'): NodeHandle {
        const handle = super.hitTest(node, point, point_as);
        return (handle === NodeHandle.POINT) ? NodeHandle.MOVE : handle;
    }

    public renderSelection(node: INode, context: CanvasRenderingContext2D, show: "all_handles" | "connection_handles"): void {
        /* Do nothing, freehand nodes do not have selection handles */
        const diagram = node.owner;
        if (!isDiagramViewLike(diagram)) return;
        const cache = diagram.getCache();
        const cached = cache.getNode(node) || {} as INodeCached;

        if (cached.path) {
            context.save();
            RenderBasics.prepareHandles(node, context);
            // context.strokeStyle = DiagramConstants.SELECTION_RECT_STROKE_COLOR;
            // context.strokeStyle = hexLuminance(node.strokeStyle?.color || '#000') > 0.179 ? '#000000' : '#ffffff';

            context.strokeStyle = hexLuminance(node.strokeStyle?.color || '#000') > 0.279 ? '#000000' : '#ffffff';
            context.lineWidth = (node.strokeStyle?.width) ? Math.min(2, node.strokeStyle.width) * 2 : 4;
            context.setLineDash([1, 5]);

            context.stroke(cached.path);
            context.restore();
        }
    }

    public render(node: INode, context: CanvasRenderingContext2D, show?: "all" | "quick"): void {
        if (!context) return;

        const diagram = node.owner;
        if (!isDiagramViewLike(diagram)) return;
        const cache = diagram.getCache();
        const cached = cache.getNode(node) || {} as INodeCached;

        const points = node.points;
        if (points.length < 2) return;

        context.save();
        RenderBasics.prepare(node, context, show);
        context.strokeStyle = node.strokeStyle?.color || '#000';
        context.lineWidth = node.strokeStyle?.width || 1;
        context.lineCap = 'round';
        context.lineJoin = 'round';

        // Draw the freehand stroke
        const path = this.drawSmoothCurve(context, points);

        cached.path = path;
        cache.setNode(node, cached);

        context.restore();
    }

    public static drawIncrementalStroke(context: CanvasRenderingContext2D, pts: IPoint[], lastPoint: IPoint) {
        if (pts.length < 3) return; // Need at least 3 points for a curve

        const last = pts[pts.length - 1]!;
        const prev = pts[pts.length - 2]!;
        const prevPrev = pts[pts.length - 3]!;

        // Control point = midpoint between prev & prevPrev
        const cx = (prev.x + prevPrev.x) / 2;
        const cy = (prev.y + prevPrev.y) / 2;

        context.save();
        context.lineCap = 'round';
        context.lineJoin = 'round';

        const path = new Path2D();
        path.moveTo(lastPoint.x, lastPoint.y);
        path.lineTo(cx, cy);
        path.lineTo(last.x, last.y);
        // path.lineTo(last.x, last.y);
        // path.quadraticCurveTo(prev.x, prev.y, (prev.x + last.x) / 2, (prev.y + last.y) / 2);

        context.stroke(path);
        context.fill(path);

        context.restore();
    }

    public static douglasPeucker(points: IPoint[], epsilon: number = 2): IPoint[] {
        if (points.length < 3) return points;

        // Find the point with the maximum distance from the line between start and end
        let dMax = 0;
        let index = 0;
        const end = points.length - 1;

        for (let i = 1; i < end; i++) {
            const d = this.perpendicularDistance(points[i]!, points[0]!, points[end]!);
            if (d > dMax) {
                index = i;
                dMax = d;
            }
        }

        // If max distance is greater than epsilon, recursively simplify
        if (dMax > epsilon) {
            const recResults1 = this.douglasPeucker(points.slice(0, index + 1), epsilon);
            const recResults2 = this.douglasPeucker(points.slice(index), epsilon);

            // Combine results (remove duplicate pivot point)
            return [...recResults1.slice(0, -1), ...recResults2];
        } else {
            // Just return start and end points
            return [points[0]!, points[end]!];
        }
    }

    // Helper: Distance from point p to line segment vw
    private static perpendicularDistance(p: { x: number, y: number }, v: { x: number, y: number }, w: { x: number, y: number }): number {
        const l2 = Math.hypot(v.x - w.x, v.y - w.y) ** 2;
        if (l2 === 0) return Math.hypot(p.x - v.x, p.y - v.y);

        let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
        t = Math.max(0, Math.min(1, t));

        const projX = v.x + t * (w.x - v.x);
        const projY = v.y + t * (w.y - v.y);

        return Math.hypot(p.x - projX, p.y - projY);
    }

    private drawSmoothCurve(context: CanvasRenderingContext2D, points: { x: number, y: number }[]): Path2D | undefined {
        if (points.length < 2) return;

        const path = new Path2D();
        path.moveTo(points[0]!.x, points[0]!.y);

        if (points.length > 2) {
            // Catmull-Rom smoothing
            for (let i = 0; i < points.length - 1; i++) {
                // Get 4 points for context: [Previous, Start, End, Next]
                const p0 = points[Math.max(0, i - 1)]!;       // Previous point
                const p1 = points[i]!;                         // Start of this segment
                const p2 = points[i + 1]!;                     // End of this segment
                const p3 = points[Math.min(points.length - 1, i + 2)]!; // Next point

                // Calculate control points for Cubic Bezier
                // Tension = 0.5 (Standard smoothness)
                const cp1x = p1.x + (p2.x - p0.x) / 6;
                const cp1y = p1.y + (p2.y - p0.y) / 6;

                const cp2x = p2.x - (p3.x - p1.x) / 6;
                const cp2y = p2.y - (p3.y - p1.y) / 6;

                // Draw the segment
                path.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
            }
        } else if (points.length === 2) {
            // If only 2 points, just draw a straight line
            path.lineTo(points[1]!.x, points[1]!.y);
        }

        context.stroke(path);
        return path;
    }
}