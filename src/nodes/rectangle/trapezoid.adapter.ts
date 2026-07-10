import type { INode } from "../../interfaces";
import { NodeHandle, type IPoint, type IRect } from "../../types";
import { isDiagramViewLike } from "../../guards";
import type { INodeCached } from "../../view/view.cache";
import { RectangleAdapter } from "./rectangle.adapter";
import { RenderBasics } from "../render.basics";
import { isHollow, nodeAngle } from "../../value.utils";
import { DiagramConstants } from "../../model/diagram.constants";
import type { SpecificOptions } from "../../factory/node.adapter";

/**
 * TrapezoidAdapter is a node adapter responsible for rendering trapezoid nodes in the diagram. 
 * It extends the RectangleAdapter to leverage basic rectangle rendering capabilities while adding specific logic for handling trapezoid shapes and hit testing.
 * Registers with the NodeRegistry under the name 'trapezoid'.
 */
export class TrapezoidAdapter extends RectangleAdapter {

    public static TYPE = 'trapezoid';

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
            let to = { x: node.points[0]!.x, y: node.points[0]!.y }
            for (let pt of node.points) {
                from.x = Math.min(from.x, pt.x)
                from.y = Math.min(from.y, pt.y)
                to.x = Math.max(to.x, pt.x)
                to.y = Math.max(to.y, pt.y)
            }
            let rect: IRect = { left: from.x, top: from.y, width: to.x - from.x, height: to.y - from.y }

            const skew = this.getSkew(node, rect);
            const skewAbs = Math.abs(skew);
            const insetTop = skew >= 0;

            context.save();
            RenderBasics.prepare(node, context, show);

            const path = new Path2D();
            if (insetTop) {
                // Inset top edge: NW and NE corners are moved inward by skew

                path.moveTo(rect.left + skewAbs, rect.top);
                // NW
                path.lineTo(rect.left + rect.width - skewAbs, rect.top);
                // NE
                path.lineTo(rect.left + rect.width, rect.top + rect.height);
                // SE
                path.lineTo(rect.left, rect.top + rect.height);
                // SW
            } else {
                // Inset bottom edge: SW and SE corners are moved inward by skew

                path.moveTo(rect.left, rect.top);
                // NW
                path.lineTo(rect.left + rect.width, rect.top);
                // NE
                path.lineTo(rect.left + rect.width - skewAbs, rect.top + rect.height);
                // SE
                path.lineTo(rect.left + skewAbs, rect.top + rect.height);
                // SW
            }
            path.closePath();

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

    // Respects negative skew values
    protected getSkew(node: INode, rect: IRect): number {
        const rawSkew = node.geometry?.skew;
        if (typeof rawSkew === 'number' && Number.isFinite(rawSkew)) {
            const maxSkew = rect.width / 2;
            return Math.max(-maxSkew, Math.min(maxSkew, rawSkew));
        }

        const maxSkew = rect.width / 2;
        const defaultSkew = Math.min(rect.width / 2, rect.height / 2);
        return Math.max(0, Math.min(maxSkew, defaultSkew));
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
        const skewAbs = Math.abs(skew);
        const insetTop = skew >= 0;
        const epsilon = DiagramConstants.HANDLE_HIT_EPSILON;
        return {
            left: rect.left + skewAbs,
            top: insetTop
                ? rect.top - epsilon - 2 * epsilon
                : rect.top + rect.height - epsilon,
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
     * It has the shape of a trapezoid to indicate its function for adjusting the skew.
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
        handles.lineTo(alter_rect.left + alter_rect.width - epsilon / 2, alter_rect.top);
        handles.lineTo(alter_rect.left + alter_rect.width, alter_rect.top + alter_rect.height);
        handles.lineTo(alter_rect.left, alter_rect.top + alter_rect.height);
        handles.closePath();

        context.fill(handles);
        context.stroke(handles);
    }

    /**
    * Sliding the ALTER handle sets a signed skew.
    * Positive values inset the top edge, negative values inset the bottom edge.
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
            const insetTop = pt.y <= rect.top + rect.height / 2;

            if (!node.geometry) node.geometry = {};
            node.geometry.skew = insetTop ? new_skew : -new_skew;
        }
    }

    public afterResize(node: INode, _handle: NodeHandle): void {
        super.afterResize(node, _handle);

        const diagram = node.owner;
        if (!isDiagramViewLike(diagram)) return;
        if (!node.geometry || typeof node.geometry.skew !== 'number' || !Number.isFinite(node.geometry.skew)) return;

        const rect = diagram.getCoordinates().getBoundingRect(node);
        const maxSkew = rect.width / 2;
        node.geometry.skew = Math.max(-maxSkew, Math.min(maxSkew, node.geometry.skew));
    }

    public geometryOptions(node: INode, path: string): SpecificOptions | undefined {
        if (path === 'geometry.skew' || path === 'skew') {
            return {
                label: 'Skew',
                datatype: 'number',
            }
        }
        return undefined;
    }
}