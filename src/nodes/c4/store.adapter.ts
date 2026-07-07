import { CylinderAdapter } from "../rectangle/cylinder.adapter";
import type { INode } from "../../interfaces";
import { RenderBasics } from "../render.basics";
import { isHollow } from "../../value.utils";
import { isDiagramViewLike } from "../../guards";
import { type IPoint, type IRect, NodeHandle } from "../../types";
import type { INodeCached } from "../../view/view.cache";
export class C4StoreAdapter extends CylinderAdapter {

    static readonly TYPE = 'c4_store';

    connection_handles: NodeHandle[] = [NodeHandle.N, NodeHandle.S];

    public override render(node: INode, context: CanvasRenderingContext2D, show?: 'all' | 'quick'): void {
        if (!context) return;
        const diagram = node.owner;
        if (!isDiagramViewLike(diagram)) return;
        const coordinates = diagram.getCoordinates();
        const cache = diagram.getCache();
        const cached = cache.getNode(node) || {} as INodeCached;

        if (node.points.length > 1) {
            let from = { x: node.points[0]!.x, y: node.points[0]!.y }
            let to = { x: node.points[1]!.x, y: node.points[1]!.y }
            for (let pt of node.points) {
                from.x = Math.min(from.x, pt.x)
                from.y = Math.min(from.y, pt.y)
                to.x = Math.max(to.x, pt.x)
                to.y = Math.max(to.y, pt.y)
            }
            let rect: IRect = { left: from.x, top: from.y, width: to.x - from.x, height: to.y - from.y }

            const aspect = this.getAspect(node, rect);
            const aspectAbs = Math.abs(aspect);
            const insetTop = aspect >= 0;

            context.save();
            RenderBasics.prepare(node, context, show);

            const path = new Path2D();
            if (insetTop) {
                // N surface
                path.ellipse(rect.left + rect.width / 2,
                    rect.top + aspectAbs,
                    rect.width / 2,
                    aspectAbs,
                    0,
                    Math.PI,
                    0,
                    true);
                path.ellipse(rect.left + rect.width / 2,
                    rect.top + aspectAbs,
                    rect.width / 2,
                    aspectAbs,
                    0,
                    0,
                    Math.PI,
                    true);
                // W
                path.lineTo(rect.left + rect.width / 4, rect.top + rect.height - aspectAbs / 2);
                // S
                path.ellipse(
                    rect.left + rect.width / 2,
                    rect.top + rect.height - aspectAbs / 2,
                    rect.width / 4,
                    aspectAbs / 2,
                    0,
                    Math.PI,                    // start at left (angle π)
                    Math.PI * 2,                // end at right via bottom (angle 2π)
                    true                       // clockwise = draws front half
                );
                // E
                path.lineTo(rect.left + rect.width, rect.top + aspectAbs);
            } else {
                // S surface
                path.ellipse(rect.left + rect.width / 2,
                    rect.top + rect.height - aspectAbs,
                    rect.width / 2,
                    aspectAbs,
                    0,
                    Math.PI,
                    0,
                    false);
                path.ellipse(rect.left + rect.width / 2,
                    rect.top + rect.height - aspectAbs,
                    rect.width / 2,
                    aspectAbs,
                    0,
                    0,
                    Math.PI,
                    false);
                // W
                path.lineTo(rect.left + rect.width / 4, rect.top + aspectAbs / 2);
                // N
                path.ellipse(
                    rect.left + rect.width / 2,
                    rect.top + aspectAbs / 2,
                    rect.width / 4,
                    aspectAbs / 2,
                    0,
                    Math.PI,                    // start at left (angle π)
                    Math.PI * 2,                // end at right via bottom (angle 2π)
                    false                       // clockwise = draws front half
                );
                // E
                path.lineTo(rect.left + rect.width, rect.top + rect.height - aspectAbs);
            }
            // path.closePath();

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

    protected override maxAspect(rect: IRect): number {
        return rect.height / 5;
    }

    public override onCreateDraft(tool: string): Partial<INode> | undefined {
        return {
            type: 'c4_store',
            points: [{ x: 0, y: 0 }, { x: 104, y: 80 }],

            text: 'Store',
            fillStyle: {
                color: '#438dd5',
            },
            strokeStyle: {
                color: 'white',
                width: 2,
                dash: [],
            },
            textStyle: {
                color: 'white',
                halo: 'inherit',
                size: 12,
                fontFace: 'system-ui',
                baseline: 'middle',
            },
        }
    }
}
