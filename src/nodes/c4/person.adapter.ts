import { isDiagramViewLike } from "../../guards";
import type { INode } from "../../interfaces";
import { NodeHandle, type IRect } from "../../types";
import type { INodeCached } from "../../view/view.cache";
import { RectangleAdapter } from "../rectangle/rectangle.adapter";
import { RenderBasics } from "../render.basics";

export class C4PersonAdapter extends RectangleAdapter {

    static readonly TYPE = 'c4_person';

    connection_handles: NodeHandle[] = [NodeHandle.N, NodeHandle.S, NodeHandle.E, NodeHandle.W];

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

            context.save();
            RenderBasics.prepare(node, context, show);

            const path = new Path2D();
            const cx = rect.left + rect.width / 2;
            // const padding = Math.min(rect.width, rect.height) * 0.12; // Proportional padding

            // ── HEAD PATH ──
            const headRadius = rect.width * 0.2;
            const headCy = rect.top + headRadius;

            const headPath = new Path2D();
            headPath.arc(cx, headCy, headRadius, 0, Math.PI * 2);

            // context.fill(headPath);
            // context.stroke(headPath);

            // ── TORSO PATH ──
            const torsoTop = headCy + headRadius * 0.8;
            const torsoBottom = rect.top + rect.height;
            // const torsoHeight = torsoBottom - torsoTop;

            const shoulderWidth = rect.width * 0.42;
            const waistWidth = rect.width * 0.42;  // * 0.28;
            const shoulderRadius = headRadius / 2; //// rect.width * 0.18;
            const bottomRadius = node.geometry?.radius && Number.isFinite(node.geometry.radius)
                ? +node.geometry.radius : 8;    // rect.width * 0.15;

            const torsoPath = new Path2D();

            // Start at neck center
            torsoPath.moveTo(cx, torsoTop);
            torsoPath.lineTo(cx - (shoulderWidth - shoulderRadius), torsoTop);

            // ── LEFT SHOULDER (arc) ──
            const leftShoulderCx = cx - shoulderWidth + shoulderRadius;
            const leftShoulderCy = torsoTop + shoulderRadius;
            // Arc from neck to shoulder point, counterclockwise
            torsoPath.arc(leftShoulderCx, leftShoulderCy, shoulderRadius, Math.PI * 1.5, Math.PI, true);

            // ── LEFT SIDE ──
            torsoPath.lineTo(cx - waistWidth, torsoBottom - bottomRadius);

            // ── BOTTOM LEFT CURVE (arc) ──
            torsoPath.arc(cx - (waistWidth - bottomRadius), torsoBottom - bottomRadius,
                bottomRadius, Math.PI, Math.PI * 0.5, true);

            // Torso bottom line
            torsoPath.lineTo(cx + (waistWidth - bottomRadius), torsoBottom);

            // ── BOTTOM RIGHT CURVE (arc) ──
            torsoPath.arc(cx + (waistWidth - bottomRadius), torsoBottom - bottomRadius,
                bottomRadius, Math.PI * 0.5, 0, true);

            // ── RIGHT SIDE ──
            torsoPath.lineTo(cx + waistWidth, torsoTop + shoulderRadius);

            // ── RIGHT SHOULDER (arc) ──
            const rightShoulderCx = cx + (shoulderWidth - shoulderRadius);
            const rightShoulderCy = torsoTop + shoulderRadius;
            // Arc from shoulder point back to neck, clockwise
            torsoPath.arc(rightShoulderCx, rightShoulderCy, shoulderRadius, 0, Math.PI * 1.5, true);

            torsoPath.lineTo(cx, torsoTop); // Back to neck center
            // torsoPath.closePath();

            context.fill(torsoPath);
            context.stroke(torsoPath);

            context.fill(headPath);
            context.stroke(headPath);

            // RenderBasics.renderImage(node, context, rect);

            if (node.text && show !== 'quick') {
                RenderBasics.renderText(node, context, { overflow: this.text_overflow });
            }

            path.addPath(headPath);
            path.addPath(torsoPath);

            cached.path = path;
            cache.setNode(node, cached);
        }
    }

    public override onCreateDraft(tool: string): Partial<INode> | undefined {
        return {
            type: 'c4_person',
            points: [{ x: 0, y: 0 }, { x: 80, y: 80 }],
            locked_aspect: true,
            text: 'Person',
            fillStyle: {
                color: '#08427B',
            },
            strokeStyle: {
                color: 'white',
                width: 2,
                dash: [],
            },
            textStyle: {
                color: 'white',
                halo: 'inherit',
                size: 10,
                fontFace: 'system-ui',
                baseline: 'bottom',
            },
        }
    }
}
