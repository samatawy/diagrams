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
 * CylinderAdapter is a node adapter responsible for rendering cylinder nodes in the diagram. 
 * It extends the RectangleAdapter to leverage basic rectangle rendering capabilities while adding specific logic for handling cylinder shapes and hit testing.
 * Registers with the NodeRegistry under the name 'cylinder'.
 */
export class CylinderAdapter extends RectangleAdapter {

    public static TYPE = 'cylinder';

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
                path.lineTo(rect.left, rect.top + rect.height - aspectAbs);
                // S
                path.ellipse(
                    rect.left + rect.width / 2,
                    rect.top + rect.height - aspectAbs,
                    rect.width / 2,
                    aspectAbs,
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
                path.lineTo(rect.left, rect.top + aspectAbs);
                // N
                path.ellipse(
                    rect.left + rect.width / 2,
                    rect.top + aspectAbs,
                    rect.width / 2,
                    aspectAbs,
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

    protected getAspect(node: INode, rect: IRect): number {
        const rawAspect = node.geometry?.aspect;
        const maxAspect = this.maxAspect(rect);

        if (typeof rawAspect === 'number' && Number.isFinite(rawAspect)) {
            return Math.max(-maxAspect, Math.min(maxAspect, rawAspect));
        }

        const defaultAspect = this.defaultAspect(rect);
        return Math.max(0, Math.min(maxAspect, defaultAspect));
    }

    /**
     * Build a rect for the handle used to define a custom aspect at the left side of the shape.
     * No transformation necessary here.
     * @param node The node being tested.
     * @param rect The bounding rectangle of the node.
     * @returns A rectangle representing the handle's bounding area.
     */
    private getAlterRect(node: INode, rect: IRect): IRect {
        const aspect = this.getAspect(node, rect);
        const aspectAbs = Math.abs(aspect);
        const insetTop = aspect >= 0;
        const epsilon = DiagramConstants.HANDLE_HIT_EPSILON;
        return {
            left: rect.left - epsilon - epsilon * 2,
            top: insetTop
                ? rect.top + aspectAbs
                : rect.top + rect.height - aspectAbs,
            width: 2 * epsilon,
            height: 2 * epsilon,
        }
    }

    /**
    * Test a point against the handle used to define a custom aspect at the left side of the shape.
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
     * Render the handle used to define a custom aspect at the left side of the shape. 
     * It has the shape of a parallelogram to indicate its function for adjusting the aspect.
     * No transformation necessary here.
     * @param node The node being rendered.
     * @param context The canvas rendering context.
     * @param rect The bounding rectangle of the node.
     */
    protected override renderAlterHandle(node: INode, context: CanvasRenderingContext2D, rect: IRect): void {
        const alter_rect = this.getAlterRect(node, rect);
        const epsilon = DiagramConstants.HANDLE_HIT_EPSILON;

        const handles = new Path2D();
        handles.ellipse(
            alter_rect.left + alter_rect.width / 2,
            alter_rect.top + alter_rect.height / 2,
            epsilon * 1.2, epsilon * 0.7, 0, 0, 2 * Math.PI);
        // handles.moveTo(alter_rect.left + epsilon / 2, alter_rect.top);
        // handles.lineTo(alter_rect.left + alter_rect.width, alter_rect.top);
        // handles.lineTo(alter_rect.left + alter_rect.width - epsilon / 2, alter_rect.top + alter_rect.height);
        // handles.lineTo(alter_rect.left, alter_rect.top + alter_rect.height);
        // handles.closePath();

        context.fill(handles);
        context.stroke(handles);
    }

    /**
    * Sliding the ALTER handle sets a signed aspect.
    * Positive values increase the aspect, negative values decrease the aspect.
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

            const insetTop = pt.y <= rect.top + rect.height / 2;
            let new_aspect = 0;
            if (insetTop) {
                new_aspect = Math.min(pt.y - rect.top, rect.height / 2);
                new_aspect = Math.max(0, new_aspect);
            } else {
                new_aspect = Math.min(rect.top + rect.height - pt.y, rect.height / 2);
                new_aspect = Math.max(0, new_aspect);
            }

            if (!node.geometry) node.geometry = {};
            node.geometry.aspect = insetTop ? new_aspect : -new_aspect;
        }
    }

    protected defaultAspect(rect: IRect): number {
        return Math.min(rect.width / 5, rect.height / 5);
    }

    protected maxAspect(rect: IRect): number {
        return rect.height / 2; //5;
    }

    public afterResize(node: INode, _handle: NodeHandle): void {
        super.afterResize(node, _handle);

        const diagram = node.owner;
        if (!isDiagramViewLike(diagram)) return;
        if (!node.geometry || typeof node.geometry.aspect !== 'number' || !Number.isFinite(node.geometry.aspect)) return;

        const rect = diagram.getCoordinates().getBoundingRect(node);
        const maxAspect = this.maxAspect(rect);
        node.geometry.aspect = Math.max(-maxAspect, Math.min(maxAspect, node.geometry.aspect));
    }

    public geometryOptions(node: INode, path: string): SpecificOptions | undefined {
        if (path === 'geometry.aspect' || path === 'aspect') {
            return {
                label: 'Aspect',
                datatype: 'number',
            }
        }
        return undefined;
    }

    public onCreateDraft(tool: string): Partial<INode> | undefined {
        return {
            type: 'cylinder',
            points: [{ x: 0, y: 0 }, { x: 64, y: 80 }],
        }
    }
}