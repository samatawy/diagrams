import { NodeRegistry } from "../../factory/node.registry";
import type { IGrid, INode } from "../../interfaces";
import { NodeHandle, type IPoint, type IRect } from "../../types";
import { isDiagramViewLike } from "../../guards";
import type { INodeCached } from "../../view/view.cache";
import { RenderBasics } from "../render.basics";
import type { HollowMode, INodeAdapter, TextOverflowMode } from "../../factory/node.adapter";
import { imageMode, isHollow, lineWidth, nodeAngle } from "../../value.utils";
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
            if (cached.img && imageMode(node) == 'frame') {
                context.fill(path);
                context.drawImage(cached.img, rect.left, rect.top, rect.width, rect.height);
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

    public renderSelection(node: INode, context: CanvasRenderingContext2D) {
        if (!context) return;
        const diagram = node.owner;
        if (!isDiagramViewLike(diagram)) return;
        const coordinates = diagram.getCoordinates();

        if (node.points.length > 1) {
            const rect = coordinates.getBoundingRect(node);
            const epsilon = DiagramConstants.HANDLE_HIT_EPSILON;
            const two_epsilon = epsilon * 2;

            context.save();
            RenderBasics.prepareHandles(node, context);

            const handles = new Path2D();

            // NW
            handles.rect(rect.left - epsilon, rect.top - epsilon, two_epsilon, two_epsilon);

            // SW
            handles.rect(rect.left - epsilon, rect.top + rect.height - epsilon, two_epsilon, two_epsilon);

            // NE
            handles.rect(rect.left + rect.width - epsilon, rect.top - epsilon, two_epsilon, two_epsilon);

            // SE
            handles.rect(rect.left + rect.width - epsilon, rect.top + rect.height - epsilon, two_epsilon, two_epsilon);

            // N
            handles.rect(rect.left + rect.width / 2 - epsilon, rect.top - epsilon, two_epsilon, two_epsilon);

            // S
            handles.rect(rect.left + rect.width / 2 - epsilon, rect.top + rect.height - epsilon, two_epsilon, two_epsilon);

            // E
            handles.rect(rect.left + rect.width - epsilon, rect.top + rect.height / 2 - epsilon, two_epsilon, two_epsilon);

            // W
            handles.rect(rect.left - epsilon, rect.top + rect.height / 2 - epsilon, two_epsilon, two_epsilon);

            handles.roundRect(
                rect.left + rect.width + 8,
                rect.top + rect.height / 2 - epsilon,
                two_epsilon, two_epsilon,
                epsilon
            );

            // let rotator = new Path2D();
            // rotator.arc(
            //     rect.left + rect.width + 8 + epsilon,
            //     rect.top + rect.height / 2,
            //     two_epsilon / 2,
            //     0, 2 * Math.PI);

            context.fill(handles);
            context.stroke(handles);

            this.renderAlterHandle(node, context, rect);

            context.restore();
        }
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
