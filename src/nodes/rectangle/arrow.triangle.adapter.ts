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
 * ArrowTriangleAdapter is a node adapter responsible for rendering arrow triangle nodes in the diagram. 
 * It extends the RectangleAdapter to leverage basic rectangle rendering capabilities while adding specific logic for handling arrow shapes and hit testing.
 * Registers with the NodeRegistry under the name 'arrow-triangle'.
 */
export class ArrowTriangleAdapter extends RectangleAdapter {

    public static TYPE = 'arrow_triangle';

    has_text = false;

    connection_handles: NodeHandle[] = [NodeHandle.E, NodeHandle.W];

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

            const head = this.getHead(node, rect);
            const thickness = this.getThickness(node, rect);
            const inset = (rect.height - thickness) / 2;

            context.save();
            RenderBasics.prepare(node, context, show);

            const path = new Path2D();
            // NW
            path.moveTo(rect.left, rect.top + inset);
            // NE
            path.lineTo(rect.left + rect.width - head, rect.top + inset);
            // N-Arrow Tip
            path.lineTo(rect.left + rect.width - head, rect.top);
            // E-Arrow Tip
            path.lineTo(rect.left + rect.width, rect.top + rect.height / 2);
            // S-Arrow Tip
            path.lineTo(rect.left + rect.width - head, rect.top + rect.height);
            // SE
            path.lineTo(rect.left + rect.width - head, rect.top + rect.height - inset);
            // SW
            path.lineTo(rect.left, rect.top + rect.height - inset);
            // SW
            path.closePath();

            context.fill(path);
            RenderBasics.renderImage(node, context, rect, path);
            if (!isHollow(node)) {
                RenderBasics.skipShadow(context);
            }
            context.stroke(path);

            // if (node.text && show !== 'quick') {
            //     RenderBasics.renderText(node, context, { overflow: this.text_overflow, path });
            // }

            cached.path = path;
            cache.setNode(node, cached);

            context.restore();
        }
    }

    private getHead(node: INode, rect: IRect): number {
        const rawHead = node.geometry?.head;
        if (typeof rawHead === 'number' && Number.isFinite(rawHead)) {
            return this.clampHead(rawHead, rect);
        }

        return Math.max(0, Math.min(rect.width / 2, rect.height / 2));
    }

    private getThickness(node: INode, rect: IRect): number {
        const rawThickness = node.geometry?.thickness;
        if (typeof rawThickness === 'number' && Number.isFinite(rawThickness)) {
            return this.clampThickness(rawThickness, rect);
        }

        return Math.max(0, Math.min(rect.height / 2, rect.width / 2));
    }

    private clampHead(head: number, rect: IRect): number {
        return Math.max(0, Math.min(rect.width, head));
    }

    private clampThickness(thickness: number, rect: IRect): number {
        return Math.max(0, Math.min(rect.height, thickness));
    }

    /**
     * Build a rect for the handle used to define a custom sgeometry.
     * No transformation necessary here.
     * @param node The node being tested.
     * @param rect The bounding rectangle of the node.
     * @returns A rectangle representing the handle's bounding area.
     */
    private getAlterRect(node: INode, rect: IRect): IRect {
        const head = this.getHead(node, rect);
        const thickness = this.getThickness(node, rect);
        const inset = (rect.height - thickness) / 2;

        const epsilon = DiagramConstants.HANDLE_HIT_EPSILON;
        return {
            left: rect.left + rect.width - head - epsilon,
            top: rect.top + inset - epsilon,
            width: 2 * epsilon,
            height: 2 * epsilon,
        }
    }

    /**
    * Test a point against the handle used to define the geometry.
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
     * Render the handle used to define the geometry. 
     * It has the shape of a parallelogram to indicate its function for adjusting the geometry.
     * No transformation necessary here.
     * @param node The node being rendered.
     * @param context The canvas rendering context.
     * @param rect The bounding rectangle of the node.
     */
    protected override renderAlterHandle(node: INode, context: CanvasRenderingContext2D, rect: IRect): void {
        const alter_rect = this.getAlterRect(node, rect);
        // const epsilon = DiagramConstants.HANDLE_HIT_EPSILON;

        const handles = new Path2D();
        handles.moveTo(alter_rect.left + alter_rect.width, alter_rect.top);
        handles.lineTo(alter_rect.left + alter_rect.width, alter_rect.top + alter_rect.height);
        handles.lineTo(alter_rect.left, alter_rect.top + alter_rect.height);
        handles.lineTo(alter_rect.left, alter_rect.top);
        handles.closePath();
        // handles.moveTo(alter_rect.left + epsilon / 2, alter_rect.top);
        // handles.lineTo(alter_rect.left + alter_rect.width, alter_rect.top);
        // handles.lineTo(alter_rect.left + alter_rect.width - epsilon / 2, alter_rect.top + alter_rect.height);
        // handles.lineTo(alter_rect.left, alter_rect.top + alter_rect.height);
        // handles.closePath();

        context.fill(handles);
        context.stroke(handles);
    }

    /**
    * Sliding the ALTER handle sets arrow geometry.
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

            let new_head = rect.left + rect.width - pt.x;
            new_head = this.clampHead(new_head, rect);

            let new_thickness = rect.height - 2 * (pt.y - rect.top);
            new_thickness = this.clampThickness(new_thickness, rect);

            if (!node.geometry) node.geometry = {};
            node.geometry.head = new_head;
            node.geometry.thickness = new_thickness;
        }
    }

    public afterResize(node: INode, _handle: NodeHandle): void {
        super.afterResize(node, _handle);

        const diagram = node.owner;
        if (!isDiagramViewLike(diagram)) return;
        if (!node.geometry
            || typeof node.geometry.head !== 'number'
            || !Number.isFinite(node.geometry.head)
            || typeof node.geometry.thickness !== 'number'
            || !Number.isFinite(node.geometry.thickness)) return;

        const rect = diagram.getCoordinates().getBoundingRect(node);
        node.geometry.head = this.clampHead(node.geometry.head, rect);
        node.geometry.thickness = this.clampThickness(node.geometry.thickness, rect);
    }

    public geometryOptions(node: INode, path: string): SpecificOptions | undefined {
        if (path === 'geometry.head' || path === 'head') {
            return {
                label: 'Head',
                datatype: 'number',
            }
        }
        if (path === 'geometry.thickness' || path === 'thickness') {
            return {
                label: 'Thickness',
                datatype: 'number',
            }
        }
        return undefined;
    }
}