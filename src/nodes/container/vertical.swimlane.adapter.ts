import type { INode, IContainer } from "../../interfaces";
import type { IRect } from "../../types";
import { isDiagramViewLike } from "../../guards";
import type { INodeCached } from "../../view/view.cache";
import { RectangleAdapter } from "../rectangle/rectangle.adapter";
import { RenderBasics } from "../render.basics";
import { isHollow } from "../../value.utils";

/**
 * VerticalSwimlaneAdapter is a node adapter responsible for rendering vertical swimlane nodes in the diagram. 
 * It extends the RectangleAdapter to leverage basic rectangle rendering capabilities while adding specific logic for handling vertical swimlane shapes and hit testing.
 * Registers with the NodeRegistry under the name 'vertical_swimlane'.
 */
export class VerticalSwimlaneAdapter extends RectangleAdapter {

    public static NAME = 'vertical_swimlane';

    public is_container = true;

    public onCreateDraft(tool: string): Partial<INode & IContainer> | undefined {
        return {
            type: this.name,
            points: [{ x: 0, y: 0 }, { x: 104, y: 240 }],
            owns_group: `group-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        }
    }

    public override render(node: INode, context: CanvasRenderingContext2D): void {
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

            const radius = this.getCornerRadius(node, rect);

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

            context.fill(path);
            RenderBasics.renderImage(node, context, rect, path);
            if (!isHollow(node)) {
                RenderBasics.skipShadow(context);
            }
            context.stroke(path);

            RenderBasics.renderText(node, context, { overflow: this.text_overflow, path });

            cached.path = path;
            cache.setNode(node, cached);

            context.restore();
        }
    }

    protected getCornerRadius(node: INode, rect: IRect): number {
        let radius = node.geometry?.radius ?? -1;
        if (+radius >= 0) {
            return +radius;
        }

        let min_radius = Math.min(rect.width, rect.height) / 2;
        let max_radius = Math.max(rect.width, rect.height) / 4;
        radius = Math.min(max_radius, min_radius);
        radius = Math.min(radius, 20);
        return radius;
    }

}