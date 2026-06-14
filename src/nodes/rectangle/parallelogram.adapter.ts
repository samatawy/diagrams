import type { INode } from "../../interfaces";
import type { IPoint, IRect } from "../../types";
import { isDiagramViewLike } from "../../guards";
import type { INodeCached } from "../../view/view.cache";
import { RectangleAdapter } from "./rectangle.adapter";
import { RenderBasics } from "../render.basics";
import { imageMode, isHollow, nodeAngle } from "../../value.utils";
import { DiagramConstants } from "../../model/diagram.constants";

/**
 * ParallelogramAdapter is a node adapter responsible for rendering parallelogram nodes in the diagram. 
 * It extends the RectangleAdapter to leverage basic rectangle rendering capabilities while adding specific logic for handling parallelogram shapes and hit testing.
 * Registers with the NodeRegistry under the name 'parallelogram'.
 */
export class ParallelogramAdapter extends RectangleAdapter {

    public static NAME = 'parallelogram';

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

            const skew = this.getSkew(node, rect);

            context.save();
            RenderBasics.prepare(node, context);

            const path = new Path2D();
            path.moveTo(rect.left + skew, rect.top);
            // NW
            path.lineTo(rect.left + rect.width, rect.top);
            // NE
            path.lineTo(rect.left + rect.width - skew, rect.top + rect.height);
            // SE
            path.lineTo(rect.left, rect.top + rect.height);
            // SW
            path.closePath();

            if (cached.img && imageMode(node) == 'frame') {
                context.fill(path);

                context.save();
                context.clip(path);
                context.drawImage(cached.img, rect.left, rect.top, rect.width, rect.height);
                context.restore();
            } else {
                context.fill(path);
            }
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

    protected getSkew(node: INode, rect: IRect): number {
        let skew = node.geometry?.skew ?? -1;
        if (skew >= 0) {
            return skew;
        }

        let min_skew = 0;
        let max_skew = rect.width / 2;
        skew = Math.min(rect.width / 2, rect.height / 2);
        skew = Math.min(max_skew, skew);
        skew = Math.max(min_skew, skew);
        return skew;
    }

    /**
     * Build a rect for the handle used to define a custom skew at the top left of the shape.
     * No transformation necessary here.
     * @param node The node being tested.
     * @param rect The bounding rectangle of the node.
     * @returns A rectangle representing the handle's bounding area.
     */
    private getAlterRect(node: INode, rect: IRect): IRect {
        const skew = this.getSkew(node, rect);
        const epsilon = DiagramConstants.HANDLE_HIT_EPSILON;
        return {
            left: rect.left + skew,
            top: rect.top - epsilon - 2 * epsilon,
            width: 2 * epsilon,
            height: 2 * epsilon,
        }
    }

    /**
    * Test a point against the handle used to define a custom skew at the top left of the shape.
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
     * Render the handle used to define a custom skew at the top left of the shape. 
     * It has the shape of a parallelogram to indicate its function for adjusting the skew.
     * No transformation necessary here.
     * @param node The node being rendered.
     * @param context The canvas rendering context.
     * @param rect The bounding rectangle of the node.
     */
    protected override renderAlterHandle(node: INode, context: CanvasRenderingContext2D, rect: IRect): void {
        const alter_rect = this.getAlterRect(node, rect);
        const epsilon = DiagramConstants.HANDLE_HIT_EPSILON;

        const handles = new Path2D();
        handles.moveTo(alter_rect.left + epsilon / 2, alter_rect.top);
        handles.lineTo(alter_rect.left + alter_rect.width, alter_rect.top);
        handles.lineTo(alter_rect.left + alter_rect.width - epsilon / 2, alter_rect.top + alter_rect.height);
        handles.lineTo(alter_rect.left, alter_rect.top + alter_rect.height);
        handles.closePath();

        context.fill(handles);
        context.stroke(handles);
    }

    /**
     * Sliding the ALTER handle sets the skew as the distance between the handle start and the left of the bounding rect.
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
            let new_skew = Math.min(pt.x - rect.left, rect.width / 2);
            new_skew = Math.max(0, new_skew);

            if (!node.geometry) node.geometry = {};
            node.geometry.skew = new_skew;
        }
    }

}