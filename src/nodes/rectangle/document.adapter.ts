import type { INode } from "../../interfaces";
import type { IPoint, IRect, NodeHandle } from "../../types";
import { isDiagramViewLike } from "../../guards";
import type { INodeCached } from "../../view/view.cache";
import { RectangleAdapter } from "./rectangle.adapter";
import { RenderBasics } from "../render.basics";
import { imageMode, isHollow, nodeAngle } from "../../value.utils";
import { DiagramConstants } from "../../model/diagram.constants";

/**
 * DocumentAdapter is a node adapter responsible for rendering document nodes in the diagram. 
 * It extends the RectangleAdapter to leverage basic rectangle rendering capabilities while adding specific logic for handling document shapes and hit testing.
 * Registers with the NodeRegistry under the name 'document'.
 */
export class DocumentAdapter extends RectangleAdapter {

    public static NAME = 'document';

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

            const waveheight = this.getWaveheight(node, rect);

            context.save();
            RenderBasics.prepare(node, context);

            const path = new Path2D();
            path.moveTo(rect.left, rect.top);
            // NW
            path.lineTo(rect.left + rect.width, rect.top);
            // NE
            path.lineTo(rect.left + rect.width, rect.top + rect.height);
            // SE

            // 1. First half: SE to Middle (Curves UP)
            path.quadraticCurveTo(
                rect.left + rect.width * 0.75, rect.top + rect.height - waveheight * 2, // Control point (pulls UP)
                rect.left + rect.width * 0.5, rect.top + rect.height              // End point (Middle of bottom edge)
            );

            // 2. Second half: Middle to SW (Curves DOWN)
            path.quadraticCurveTo(
                rect.left + rect.width * 0.25, rect.top + rect.height + waveheight * 2, // Control point (pulls DOWN)
                rect.left, rect.top + rect.height              // End point (SW corner)
            );
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

    protected getWaveheight(node: INode, rect: IRect): number {
        let waveheight = node.geometry?.waveheight ?? -1;
        if (waveheight >= 0) {
            return waveheight;
        }

        let min_waveheight = 0;
        let max_waveheight = rect.height / 4;
        waveheight = Math.min(rect.width / 2, rect.height / 2);
        waveheight = Math.min(max_waveheight, waveheight);
        waveheight = Math.max(min_waveheight, waveheight);
        return waveheight;
    }

    /**
     * Build a rect for the handle used to define a custom waveheight at the bottom left of the shape.
     * No transformation necessary here.
     * @param node The node being tested.
     * @param rect The bounding rectangle of the node.
     * @returns A rectangle representing the handle's bounding area.
     */
    private getAlterRect(node: INode, rect: IRect): IRect {
        const waveheight = this.getWaveheight(node, rect);
        const epsilon = DiagramConstants.HANDLE_HIT_EPSILON;
        const handle_size = 2 * epsilon;
        return {
            left: rect.left - epsilon - handle_size,
            top: rect.top + rect.height - waveheight - handle_size,
            width: handle_size,
            height: handle_size,
        }
    }

    /**
    * Test a point against the handle used to define a custom waveheight at the bottom left of the shape.
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
     * Render the handle used to define a custom waveheight at the bottom left of the shape. 
     * It has the shape of a downward semicircle to indicate its function for adjusting the waveheight.
     * No transformation necessary here.
     * @param node The node being rendered.
     * @param context The canvas rendering context.
     * @param rect The bounding rectangle of the node.
     */
    protected override renderAlterHandle(node: INode, context: CanvasRenderingContext2D, rect: IRect): void {
        const alter_rect = this.getAlterRect(node, rect);
        const epsilon = DiagramConstants.HANDLE_HIT_EPSILON;
        const handle_size = 2 * epsilon;

        const handles = new Path2D();
        handles.moveTo(alter_rect.left, alter_rect.top);
        handles.lineTo(alter_rect.left + alter_rect.width, alter_rect.top);
        handles.lineTo(alter_rect.left + alter_rect.width, alter_rect.top + alter_rect.height);

        // 1. First half: SE to Middle (Curves UP)
        handles.quadraticCurveTo(
            alter_rect.left + alter_rect.width * 0.75, alter_rect.top + alter_rect.height - epsilon, // Control point (pulls UP)
            alter_rect.left + alter_rect.width * 0.5, alter_rect.top + alter_rect.height              // End point (Middle of bottom edge)
        );

        // 2. Second half: Middle to SW (Curves DOWN)
        handles.quadraticCurveTo(
            alter_rect.left + alter_rect.width * 0.25, alter_rect.top + alter_rect.height + epsilon, // Control point (pulls DOWN)
            alter_rect.left, alter_rect.top + alter_rect.height              // End point (SW corner)
        );
        handles.closePath();

        context.fill(handles);
        context.stroke(handles);
    }

    /**
     * Sliding the ALTER handle sets the waveheight as the distance between the handle start and the left of the bounding rect.
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
            let new_waveheight = Math.min(rect.top + rect.height - pt.y, rect.height / 2);
            new_waveheight = Math.max(0, new_waveheight);

            if (!node.geometry) node.geometry = {};
            node.geometry.waveheight = new_waveheight;
        }
    }

    public afterResize(node: INode, _handle: NodeHandle): void {
        const diagram = node.owner;
        if (!isDiagramViewLike(diagram)) return;
        if (!node.geometry || typeof node.geometry.waveheight !== 'number' || !Number.isFinite(node.geometry.waveheight)) return;

        const rect = diagram.getCoordinates().getBoundingRect(node);
        const maxWaveheight = rect.height / 2;
        node.geometry.waveheight = Math.max(0, Math.min(maxWaveheight, node.geometry.waveheight));
    }

}