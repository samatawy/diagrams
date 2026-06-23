import { NodeRegistry } from "../../factory/node.registry";
import type { IGrid, INode } from "../../interfaces";
import { NodeHandle, type IPoint, type IRect, type ITextOrientation } from "../../types";
import { isDiagramViewLike } from "../../guards";
import type { INodeCached } from "../../view/view.cache";
import { RenderBasics } from "../render.basics";
import type { HollowMode, INodeAdapter, TextOverflowMode, TextPlacement } from "../../factory/node.adapter";
import { isHollow, lineWidth, nodeAngle } from "../../value.utils";
import { DiagramConstants } from "../../model/diagram.constants";

/**
 * RectangleAdapter is a node adapter responsible for rendering rectangle nodes in the diagram. 
 * It provides basic rectangle rendering capabilities and hit testing logic.
 * Registers with the NodeRegistry under the name 'rectangle'.
 */
export class RectangleAdapter implements INodeAdapter {

    public static NAME = 'rectangle';

    public get name(): string {
        return (this.constructor as typeof RectangleAdapter).NAME;
    }

    hollow_mode: HollowMode = 'if_transparent';

    is_connector = false;
    multistep_create = false;
    drag_create = true;
    has_text = true;
    text_overflow: TextOverflowMode = 'hidden';
    text_orientations: ITextOrientation[] = ['horizontal'];

    /**
     * Registers the RectangleAdapter with the NodeRegistry.
     */
    public static register() {
        NodeRegistry.register(this.NAME, this);
    }

    /**
     * Registers the RectangleAdapter instance with the NodeRegistry.
     */
    public register() {
        NodeRegistry.register(this.name, this);
    }

    public hitTest(node: INode, point: IPoint): NodeHandle {
        const diagram = node.owner;
        if (!isDiagramViewLike(diagram)) return NodeHandle.NONE;
        const coordinates = diagram.getCoordinates();
        const cache = diagram.getCache();
        const cached = cache.getNode(node) || {} as INodeCached;

        if (node.points.length > 1) {
            const angle = nodeAngle(node);
            const epsilon = DiagramConstants.HANDLE_HIT_EPSILON;

            let rect = coordinates.getBoundingRect(node, false);
            let cos = cached?.cos || Math.cos(angle);
            let sin = cached?.sin || Math.sin(angle);
            let pt = coordinates.getHitPoint({ x: point.x, y: point.y }, rect, angle, cos, sin);
            let x = pt.x!;
            let y = pt.y!;

            if (Math.abs(rect.left - x) <= epsilon && Math.abs(rect.top - y) <= epsilon) return NodeHandle.NW;
            if (Math.abs(rect.left - x) <= epsilon && Math.abs(rect.top + rect.height - y) <= epsilon) return NodeHandle.SW;
            if (Math.abs(rect.left + rect.width - x) <= epsilon && Math.abs(rect.top - y) <= epsilon) return NodeHandle.NE;
            if (Math.abs(rect.left + rect.width - x) <= epsilon && Math.abs(rect.top + rect.height - y) <= epsilon) return NodeHandle.SE;

            if (Math.abs(rect.left + rect.width / 2 - x) <= epsilon && Math.abs(rect.top - y) <= epsilon) return NodeHandle.N;
            if (Math.abs(rect.left + rect.width / 2 - x) <= epsilon && Math.abs(rect.top + rect.height - y) <= epsilon) return NodeHandle.S;
            if (Math.abs(rect.left - x) <= epsilon && Math.abs(rect.top + rect.height / 2 - y) <= epsilon) return NodeHandle.W;
            if (Math.abs(rect.left + rect.width - x) <= epsilon && Math.abs(rect.top + rect.height / 2 - y) <= epsilon) return NodeHandle.E;

            if (Math.abs(rect.left + rect.width + 8 + epsilon - x) <= epsilon &&
                Math.abs(rect.top + rect.height / 2 - y) <= epsilon) return NodeHandle.ROTATE;

            if (this.hitTestAlter(node, rect, { x, y })) {
                return NodeHandle.ALTER;
            }

            if (cached?.text_path && coordinates.isPointInPath(cached.text_path, x, y)) {
                return NodeHandle.MOVE;
            }

            let inpath: boolean = false;
            if (cached?.path) {
                const hitStrokeWidth = Math.max(lineWidth(node) + DiagramConstants.PATH_HIT_PADDING, 10);
                inpath = isHollow(node) ?
                    coordinates.isPointInStroke(cached.path, x, y, hitStrokeWidth) :
                    coordinates.isPointInPath(cached.path, x, y);
            }

            return inpath ? NodeHandle.MOVE : NodeHandle.NONE;
        }
        return NodeHandle.NONE;
    }

    /**
     * Child adapters can override this method to provide custom hit testing logic for the ALTER handle.
     * This method is called during hit testing to determine if the point is within the ALTER handle's bounding rectangle.
     * No transformation necessary here (already performed).
     * @param node The node being tested.
     * @param rect The bounding rectangle of the node.
     * @param point The point to test.
     * @returns True if the point is within the ALTER handle's bounding rectangle, false otherwise.
     */
    protected hitTestAlter(node: INode, rect: IRect, point: IPoint): boolean {
        return false;
    }

    /**
     * Renders the node on the provided canvas context. It draws the rectangle shape, applies fill and stroke styles, and renders any text associated with the node.
     * This method is called while rendering selection.
     * No transformation necessary here (already performed).
     * @param node The node to render.
     * @param context The canvas rendering context.
     * @param rect The bounding rectangle of the node.
     */
    protected renderAlterHandle(node: INode, context: CanvasRenderingContext2D, rect: IRect): void {    //}, angle: number, cos: number, sin: number): void {
    }

    public onCreateDraft(tool: string): Partial<INode> | undefined {
        return {
            type: this.name,
            points: [{ x: 0, y: 0 }, { x: 104, y: 40 }],
        }
    }

    public onCreateMove(node: INode, point: IPoint): void {
        if (node.points.length < 2) {
            node.points.push({ ...point });
        }
        node.points[1] = { ...point };
    }

    public snapToGrid(node: INode, grid: IGrid): void {
        const diagram = node.owner;
        if (!isDiagramViewLike(diagram)) return;
        const coordinates = diagram.getCoordinates();

        if (grid && grid.forced) {
            for (let i = 0; i < node.points.length; i++) {
                let point = node.points[i]!;
                node.points[i] = coordinates.getGridPoint(point!.x, point!.y, grid);
            }
        }
    }

    public render(node: INode, context: CanvasRenderingContext2D): void {
        if (!context) return;
        const diagram = node.owner;
        if (!isDiagramViewLike(diagram)) return;

        const coordinates = diagram.getCoordinates();
        const cache = diagram.getCache();
        const cached = cache.getNode(node) || {} as INodeCached;

        if (node.points.length > 1) {
            let rect = coordinates.getBoundingRect(node);

            context.save();
            RenderBasics.prepare(node, context);

            const path = new Path2D();
            path.rect(rect.left, rect.top, rect.width, rect.height);
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

    public renderSelection(node: INode, context: CanvasRenderingContext2D) {
        if (!context) return;
        const diagram = node.owner;
        if (!isDiagramViewLike(diagram)) return;
        const coordinates = diagram.getCoordinates();

        if (node.points.length > 1) {
            const rect = coordinates.getBoundingRect(node);
            const epsilon = DiagramConstants.HANDLE_HIT_EPSILON;

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

            RenderBasics.renderRotateHandle(node, {
                x: rect.left + rect.width + 8 + epsilon,
                y: rect.top + rect.height / 2
            }, handles, context);

            context.fill(handles);
            context.stroke(handles);

            this.renderAlterHandle(node, context, rect);

            context.restore();
        }
    }

    public textPlacement(node: INode): TextPlacement {
        if (node.points.length > 1) {
            const diagram = node.owner;
            if (!isDiagramViewLike(diagram)) return {};

            const coordinates = diagram.getCoordinates();
            const rect = coordinates.getBoundingRect(node);
            return { rect };
        }
        return {};
    }

    public getVisualRect(_node: INode, rect: IRect): IRect {
        return rect;
    }

    public write(node: INode, serializer: any): any {
        return serializer.write({
            ...node,
            type: this.name,
        });
    }

    public async read(json: any, serializer: any): Promise<INode> {
        return serializer.read(json);
    }
}
