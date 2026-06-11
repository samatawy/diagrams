import { NodeRegistry } from "../../factory/node.registry";
import type { INode } from "../../interfaces";
import { type IRect } from "../../types";
import { isDiagramViewLike } from "../../guards";
import type { INodeCached } from "../../view/view.cache";
import { RectangleAdapter } from "./rectangle.adapter";
import { RenderBasics } from "../render.basics";

/**
 * RoundRectangleAdapter is a node adapter responsible for rendering rounded rectangle nodes in the diagram. 
 * It extends the RectangleAdapter to leverage basic rectangle rendering capabilities while adding specific logic for handling rounded corners and hit testing.
 * Registers with the NodeRegistry under the name 'round_rectangle'.
 */
export class RoundRectangleAdapter extends RectangleAdapter {

    public static NAME = 'round_rectangle';
    protected name = RoundRectangleAdapter.NAME;

    register() {
        NodeRegistry.register(this.name, this);
    }

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
                from.x = Math.min(from.x, pt.x)
                from.y = Math.min(from.y, pt.y)
                to.x = Math.max(to.x, pt.x)
                to.y = Math.max(to.y, pt.y)
            }
            let rect: IRect = { left: from.x, top: from.y, width: to.x - from.x, height: to.y - from.y }

            // Add a control point if necessary..
            // This is controversial if we switch types..
            /* if (this.points.length == 2) {
                 this.points.push({
                     x: rect.left + 12,
                     y: rect.top
                 })
             }
             let radius_handle = this.points[2];*/

            // let rect: ARect = {left: this.points[0].x, top: this.points[0].y, width: 0, height: 0};

            // for(let pt of this.points) {
            //     rect.left = Math.min(pt.x, rect.left);
            //     rect.top = Math.min(pt.y, rect.top);
            //     rect.width = Math.max(Math.abs(pt.x - rect.left), rect.width);
            //     rect.height = Math.max(Math.abs(pt.y - rect.top), rect.height);
            // }

            let min_radius = Math.min(rect.width, rect.height) / 2;
            let max_radius = Math.max(rect.width, rect.height) / 4;
            // let radius = min_radius / 8;
            let radius = Math.min(max_radius, min_radius);
            radius = Math.min(radius, 20);

            context.save();
            RenderBasics.prepare(node, context);

            const path = new Path2D();
            path.moveTo(rect.left, rect.top + radius);
            // NW
            path.arcTo(rect.left, rect.top, rect.left + radius, rect.top, radius);
            path.lineTo(rect.left + rect.width - radius, rect.top);
            // NE
            path.arcTo(rect.left + rect.width, rect.top, rect.left + rect.width, rect.top + radius, radius);
            path.lineTo(rect.left + rect.width, rect.top + rect.height - radius);
            // SE
            path.arcTo(rect.left + rect.width, rect.top + rect.height, rect.left + rect.width - radius, rect.top + rect.height, radius);
            path.lineTo(rect.left + radius, rect.top + rect.height);
            // SW
            path.arcTo(rect.left, rect.top + rect.height, rect.left, rect.top + rect.height - radius, radius);
            path.closePath();

            if (cached.img && node.img_mode == 'frame') {
                context.fill(path);

                context.save();
                context.clip(path);
                context.drawImage(cached.img, rect.left, rect.top, rect.width, rect.height);
                context.restore();
            } else {
                context.fill(path);
            }
            context.stroke(path);

            RenderBasics.renderText(node, context, { overflow: this.text_overflow, path });

            cached.path = path;
            cache.setNode(node, cached);

            context.restore();
        }
    }
}