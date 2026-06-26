import type { INode } from "../../interfaces";
import type { IPoint, IRect } from "../../types";
import { isDiagramViewLike } from "../../guards";
import type { INodeCached } from "../../view/view.cache";
import { RectangleAdapter } from "./rectangle.adapter";
import { RenderBasics } from "../render.basics";
import { isHollow, nodeAngle } from "../../value.utils";
import { DiagramConstants } from "../../model/diagram.constants";

/**
 * RoundRectangleAdapter is a node adapter responsible for rendering rounded rectangle nodes in the diagram. 
 * It extends the RectangleAdapter to leverage basic rectangle rendering capabilities while adding specific logic for handling rounded corners and hit testing.
 * Registers with the NodeRegistry under the name 'round_rectangle'.
 */
export class RoundRectangleAdapter extends RectangleAdapter {

    public static TYPE = 'round_rectangle';

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

    /**
     * Build a rect for the handle used to define a custom radius at the top left of the shape.
     * No transformation necessary here.
     * @param node The node being tested.
     * @param rect The bounding rectangle of the node.
     * @returns A rectangle representing the handle's bounding area.
     */
    private getAlterRect(node: INode, rect: IRect): IRect {
        const radius = this.getCornerRadius(node, rect);
        const epsilon = DiagramConstants.HANDLE_HIT_EPSILON;
        return {
            left: rect.left + radius,
            top: rect.top - epsilon - 2 * epsilon,
            width: 2 * epsilon,
            height: 2 * epsilon,
        }
    }

    /**
     * Test a point against the handle used to define a custom radius at the top left of the shape.
     * No transformation necessary here.
     * @param node The node being tested.
     * @param rect The bounding rectangle of the node.
     * @param point The point to test.
     * @returns True if the point is within the handle's bounding rectangle, false otherwise.
     */
    protected override hitTestAlter(node: INode, rect: IRect, point: IPoint): boolean {
        const alter_rect = this.getAlterRect(node, rect);
        if (point.x >= alter_rect.left && point.x <= alter_rect.left + alter_rect.width &&
            point.y >= alter_rect.top && point.y <= alter_rect.top + alter_rect.height) {
            return true;
        }
        return false;
    }

    /** 
     * Render the handle used to define a custom radius at the top left of the shape. 
     * It has a rounded rectangle shape to indicate its function for adjusting the corner radius.
     * No transformation necessary here.
     * @param node The node being rendered.
     * @param context The canvas rendering context.
     * @param rect The bounding rectangle of the node.
     */
    protected override renderAlterHandle(node: INode, context: CanvasRenderingContext2D, rect: IRect): void {
        const alter_rect = this.getAlterRect(node, rect);

        const handles = new Path2D();
        handles.roundRect(alter_rect.left, alter_rect.top, alter_rect.width, alter_rect.height, [alter_rect.width / 2, 0, 0, 0]);
        context.fill(handles);
        context.stroke(handles);
    }

    /**
     * Sliding the ALTER handle sets the corner radius as the distance between the handle start and the left of the bounding rect.
     * Transformation is necessary here.
     * @param node The node being altered.
     * @param point The point where the handle is currently at.
     */
    public onAlterMove(node: INode, point: IPoint): void {
        const diagram = node.owner;
        if (!isDiagramViewLike(diagram)) return;
        const coordinates = diagram.getCoordinates();
        const cache = diagram.getCache();
        const cached = cache.getNode(node) || {} as INodeCached;

        if (node.points.length > 1) {
            const angle = nodeAngle(node);
            let cos = cached?.cos || Math.cos(angle);
            let sin = cached?.sin || Math.sin(angle);

            const rect = coordinates.getBoundingRect(node);
            const pt = coordinates.getHitPoint({ x: point.x, y: point.y }, rect, angle, cos, sin);
            let new_radius = Math.min(pt.x - rect.left, rect.width / 2, rect.height / 2);
            new_radius = Math.max(0, new_radius);

            if (!node.geometry) node.geometry = {};
            node.geometry.radius = new_radius;
        }
    }

}