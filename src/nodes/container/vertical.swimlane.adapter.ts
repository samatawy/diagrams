import type { INode, IContainer } from "../../interfaces";
import { NodeHandle, type IRect } from "../../types";
import { isDiagramViewLike } from "../../guards";
import type { INodeCached } from "../../view/view.cache";
import { RectangleAdapter } from "../rectangle/rectangle.adapter";
import { RenderBasics } from "../render.basics";
import { isHollow } from "../../value.utils";
import { DiagramConstants } from "../../model/diagram.constants";

/**
 * VerticalSwimlaneAdapter is a node adapter responsible for rendering vertical swimlane nodes in the diagram. 
 * It extends the RectangleAdapter to leverage basic rectangle rendering capabilities while adding specific logic for handling vertical swimlane shapes and hit testing.
 * Registers with the NodeRegistry under the name 'vertical_swimlane'.
 */
export class VerticalSwimlaneAdapter extends RectangleAdapter {

    public static TYPE = 'vertical_swimlane';

    public is_container = true;
    public can_rotate = false;

    public onCreateDraft(tool: string): Partial<INode & IContainer> | undefined {
        return {
            type: this.type,
            points: [{ x: 0, y: 0 }, { x: 104, y: 240 }],
            geometry: { radius: DiagramConstants.HANDLE_HIT_EPSILON },
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

    public renderSelection(node: INode, context: CanvasRenderingContext2D, show: 'all_handles' | 'connection_handles') {
        // super.renderSelection(node, context);

        if (!context) return;
        const diagram = node.owner;
        if (!isDiagramViewLike(diagram)) return;
        const coordinates = diagram.getCoordinates();

        if (node.points.length > 1) {
            const rect = coordinates.getBoundingRect(node);
            const epsilon = DiagramConstants.HANDLE_HIT_EPSILON;

            // Not needed in this node type as all visible points are known to be connection-ready.
            // EXCEPT ALTER for descendants?
            const allowed = (show === 'connection_handles') ?
                this.connection_handles :
                [NodeHandle.N, NodeHandle.S, NodeHandle.E, NodeHandle.W, NodeHandle.NE, NodeHandle.NW, NodeHandle.SE, NodeHandle.SW, NodeHandle.ROTATE];

            context.save();
            RenderBasics.prepareHandles(node, context);

            const handles = new Path2D();

            // NW            
            RenderBasics.renderHandle(node, { x: rect.left, y: rect.top }, handles, context);

            // SW
            RenderBasics.renderHandle(node, { x: rect.left, y: rect.top + rect.height }, handles, context);

            // NE
            RenderBasics.renderHandle(node, { x: rect.left + rect.width, y: rect.top }, handles, context);

            // SE
            RenderBasics.renderHandle(node, { x: rect.left + rect.width, y: rect.top + rect.height }, handles, context);

            // N
            RenderBasics.renderHandle(node, { x: rect.left + rect.width / 2, y: rect.top }, handles, context);

            // S
            RenderBasics.renderHandle(node, { x: rect.left + rect.width / 2, y: rect.top + rect.height }, handles, context);

            // E
            RenderBasics.renderHandle(node, { x: rect.left + rect.width, y: rect.top + rect.height / 2 }, handles, context);

            // W
            RenderBasics.renderHandle(node, { x: rect.left, y: rect.top + rect.height / 2 }, handles, context);

            context.fill(handles);
            context.stroke(handles);

            // line dash respecting the current zoom level
            // [6 / zoom, 4 / zoom])
            context.setLineDash([4 / coordinates.zoom, 2 / coordinates.zoom]);

            const holder = new Path2D();
            holder.rect(rect.left + epsilon, rect.top + epsilon, rect.width - 2 * epsilon, rect.height - 2 * epsilon);

            context.stroke(holder);

            if (allowed.includes(NodeHandle.ALTER)) {
                this.renderAlterHandle(node, context, rect);
            }

            context.restore();
        }
    }

}