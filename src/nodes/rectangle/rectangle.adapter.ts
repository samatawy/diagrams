import { NodeRegistry } from "../../factory/node.registry";
import type { IConnection, IGrid, IHandlePoint, INode } from "../../interfaces";
import { NodeHandle, type AnchorScope, type IPoint, type IRect, type ITextBaseline, type ITextOrientation } from "../../types";
import { isDiagramViewLike } from "../../guards";
import type { INodeCached } from "../../view/view.cache";
import { RenderBasics } from "../render.basics";
import type { HollowMode, INodeAdapter, SpecificOptions, TextOverflowMode, TextPlacement } from "../../factory/node.adapter";
import { isHollow, lineWidth, nodeAngle } from "../../value.utils";
import { DiagramConstants } from "../../model/diagram.constants";

/**
 * RectangleAdapter is a node adapter responsible for rendering rectangle nodes in the diagram. 
 * It provides basic rectangle rendering capabilities and hit testing logic.
 * Registers with the NodeRegistry under the name 'rectangle'.
 */
export class RectangleAdapter implements INodeAdapter {

    public static TYPE = 'rectangle';

    public get type(): string {
        return (this.constructor as typeof RectangleAdapter).TYPE;
    }

    hollow_mode: HollowMode = 'if_transparent';
    protected min_width: number = 24;
    protected min_height: number = 16;

    is_connector = false;
    multistep_create = false;
    drag_create = true;
    has_text = true;
    single_line_text = false;
    text_overflow: TextOverflowMode = 'hidden';
    text_orientations: ITextOrientation[] = ['horizontal'];
    text_baselines: ITextBaseline[] = ['top', 'middle', 'bottom'];
    connection_handles: NodeHandle[] = [NodeHandle.N, NodeHandle.S, NodeHandle.E, NodeHandle.W, NodeHandle.NE, NodeHandle.NW, NodeHandle.SE, NodeHandle.SW];
    can_rotate = true;
    can_snap = true;

    /**
     * Registers the RectangleAdapter with the NodeRegistry.
     */
    public static register() {
        NodeRegistry.register(this.TYPE, this);
    }

    /**
     * Registers the RectangleAdapter instance with the NodeRegistry.
     */
    public register() {
        NodeRegistry.register(this.type, this);
    }

    public hitTest(node: INode, point: IPoint, point_as: 'pointer' | 'diagram'): NodeHandle {
        const diagram = node.owner;
        if (!isDiagramViewLike(diagram)) return NodeHandle.NONE;
        const coordinates = diagram.getCoordinates();
        const cache = diagram.getCache();
        const cached = cache.getNode(node) || {} as INodeCached;

        if (node.points.length > 1) {
            const epsilon = DiagramConstants.HANDLE_HIT_EPSILON;
            const rect = coordinates.getBoundingRect(node, false);

            let pt = point;
            if (point_as === 'pointer') {
                const angle = nodeAngle(node);
                let cos = cached?.cos || Math.cos(angle);
                let sin = cached?.sin || Math.sin(angle);
                pt = coordinates.getHitPoint({ x: point.x, y: point.y }, rect, angle, cos, sin);
            }
            let x = pt.x!;
            let y = pt.y!;

            const anchors = this.getAnchors(node, 'all_handles', 'any');

            for (const anchor of anchors) {
                if (Math.abs(anchor.point.x - x) <= epsilon && Math.abs(anchor.point.y - y) <= epsilon) {
                    return anchor.handle;
                }
            }

            // if (Math.abs(rect.left - x) <= epsilon && Math.abs(rect.top - y) <= epsilon) return NodeHandle.NW;
            // if (Math.abs(rect.left - x) <= epsilon && Math.abs(rect.top + rect.height - y) <= epsilon) return NodeHandle.SW;
            // if (Math.abs(rect.left + rect.width - x) <= epsilon && Math.abs(rect.top - y) <= epsilon) return NodeHandle.NE;
            // if (Math.abs(rect.left + rect.width - x) <= epsilon && Math.abs(rect.top + rect.height - y) <= epsilon) return NodeHandle.SE;

            // if (Math.abs(rect.left + rect.width / 2 - x) <= epsilon && Math.abs(rect.top - y) <= epsilon) return NodeHandle.N;
            // if (Math.abs(rect.left + rect.width / 2 - x) <= epsilon && Math.abs(rect.top + rect.height - y) <= epsilon) return NodeHandle.S;
            // if (Math.abs(rect.left - x) <= epsilon && Math.abs(rect.top + rect.height / 2 - y) <= epsilon) return NodeHandle.W;
            // if (Math.abs(rect.left + rect.width - x) <= epsilon && Math.abs(rect.top + rect.height / 2 - y) <= epsilon) return NodeHandle.E;

            if (NodeRegistry.canRotate(node.type)) {
                if (Math.abs(rect.left + rect.width + 8 + epsilon - x) <= epsilon &&
                    Math.abs(rect.top + rect.height / 2 - y) <= epsilon) return NodeHandle.ROTATE;
            }

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

    public defaultConnection(): Partial<IConnection> | null {
        return NodeRegistry.createDraft('orthogonal') as Partial<IConnection> | null;
    }

    public onCreateDraft(tool: string): Partial<INode> | undefined {
        return {
            type: this.type,
            points: [{ x: 0, y: 0 }, { x: 104, y: 40 }],
        }
    }

    public onCreateMove(node: INode, point: IPoint): void {
        if (node.points.length < 2) {
            node.points.push({ ...point });
        }
        node.points[1] = { ...point };

        if (node.locked_aspect) {
            const width = node.points[1]!.x - node.points[0]!.x;
            const height = node.points[1]!.y - node.points[0]!.y;

            if (width !== height) {
                const size = Math.min(width, height);
                node.points[1]!.x = node.points[0]!.x + size;
                node.points[1]!.y = node.points[0]!.y + size;
            }
        }
    }

    public getAnchors(node: INode, show: AnchorScope, direction?: 'from' | 'to' | 'any'): IHandlePoint[] {
        const diagram = node.owner;
        if (!isDiagramViewLike(diagram)) return [];
        const coordinates = diagram.getCoordinates();
        const rect = coordinates.getBoundingRect(node);

        const anchors: IHandlePoint[] = [];

        const handles = (show === 'all_handles' || show === 'selection_handles') ? [
            NodeHandle.N, NodeHandle.S, NodeHandle.E, NodeHandle.W,
            NodeHandle.NE, NodeHandle.NW, NodeHandle.SE, NodeHandle.SW
        ] : this.connection_handles;

        for (const handle of handles) {
            switch (handle) {
                case NodeHandle.N:
                    anchors.push({ handle, point: { x: rect.left + rect.width / 2, y: rect.top } });
                    break;
                case NodeHandle.S:
                    anchors.push({ handle, point: { x: rect.left + rect.width / 2, y: rect.top + rect.height } });
                    break;
                case NodeHandle.E:
                    anchors.push({ handle, point: { x: rect.left + rect.width, y: rect.top + rect.height / 2 } });
                    break;
                case NodeHandle.W:
                    anchors.push({ handle, point: { x: rect.left, y: rect.top + rect.height / 2 } });
                    break;
                case NodeHandle.NE:
                    anchors.push({ handle, point: { x: rect.left + rect.width, y: rect.top } });
                    break;
                case NodeHandle.NW:
                    anchors.push({ handle, point: { x: rect.left, y: rect.top } });
                    break;
                case NodeHandle.SE:
                    anchors.push({ handle, point: { x: rect.left + rect.width, y: rect.top + rect.height } });
                    break;
                case NodeHandle.SW:
                    anchors.push({ handle, point: { x: rect.left, y: rect.top + rect.height } });
                    break;
            }
        }

        if (show === 'connection_handles') {
            return anchors.filter(anchor => this.canConnectTo(node, anchor.handle, direction ?? 'any', undefined, anchor.point));
            // return anchors.filter(anchor => this.canConnect(node, direction ?? 'any', anchor.handle, anchor.point));
        } else {
            return anchors;
        }
    }

    // public canConnect(node: INode, direction: 'from' | 'to' | 'any', handle: NodeHandle, point: IPoint): boolean {
    //     return this.connection_handles.includes(handle);
    // }
    public canConnectTo(node: INode, handle: NodeHandle, direction: 'from' | 'to' | 'any', target?: Partial<INode>, point?: IPoint): boolean {
        return this.connection_handles.includes(handle);
    }

    public afterResize(node: INode, _handle: NodeHandle): void {
        if (node.points.length > 1) {
            const topLeft = node.points[0]!;
            const bottomRight = node.points[1]!;

            // Ensure the rectangle maintains a minimum size

            if (bottomRight.x - topLeft.x < this.min_width) {
                bottomRight.x = topLeft.x + this.min_width;
            }
            if (bottomRight.y - topLeft.y < this.min_height) {
                bottomRight.y = topLeft.y + this.min_height;
            }
        }
    }

    public snapToGrid(node: INode, grid: IGrid, handle: NodeHandle): void {
        if (!grid || !grid.forced) return;

        const diagram = node.owner;
        if (!isDiagramViewLike(diagram)) return;
        const coordinates = diagram.getCoordinates();

        const topLeft = node.points[0]!;
        const bottomRight = node.points[1]!;
        let snapTopLeft: Partial<IPoint> = {};
        let snapBottomRight: Partial<IPoint> = {};
        let snapPoint: IPoint;

        switch (handle) {
            case NodeHandle.MOVE:
                // Snap all points to the grid, preserving their relative positions

                const original = node.points[0]!;
                const snapped = coordinates.getGridPoint(original.x, original.y, grid);
                const dx = snapped.x - original.x;
                const dy = snapped.y - original.y;

                for (let i = 0; i < node.points.length; i++) {
                    let point = node.points[i]!;
                    point.x += dx;
                    point.y += dy;
                }
                break;
            case NodeHandle.N:
                snapTopLeft = {
                    y: coordinates.getGridPoint(topLeft.x, topLeft.y, grid).y
                }
                break;
            case NodeHandle.S:
                snapBottomRight = {
                    y: coordinates.getGridPoint(bottomRight.x, bottomRight.y, grid).y
                }
                break;
            case NodeHandle.E:
                snapBottomRight = {
                    x: coordinates.getGridPoint(bottomRight.x, bottomRight.y, grid).x
                }
                break;
            case NodeHandle.W:
                snapTopLeft = {
                    x: coordinates.getGridPoint(topLeft.x, topLeft.y, grid).x
                }
                break;
            case NodeHandle.NE:
                snapTopLeft = {
                    y: coordinates.getGridPoint(topLeft.x, topLeft.y, grid).y
                };
                snapBottomRight = {
                    x: coordinates.getGridPoint(bottomRight.x, bottomRight.y, grid).x
                };
                break;
            case NodeHandle.NW:
                snapPoint = coordinates.getGridPoint(node.points[0]!.x, node.points[0]!.y, grid);
                snapTopLeft = {
                    x: snapPoint.x,
                    y: snapPoint.y
                };
                break;
            case NodeHandle.SE:
                snapPoint = coordinates.getGridPoint(node.points[1]!.x, node.points[1]!.y, grid);
                snapBottomRight = {
                    x: snapPoint.x,
                    y: snapPoint.y
                };
                break;
            case NodeHandle.SW:
                snapTopLeft = {
                    x: coordinates.getGridPoint(topLeft.x, topLeft.y, grid).x
                };
                snapBottomRight = {
                    y: coordinates.getGridPoint(bottomRight.x, bottomRight.y, grid).y
                };
                break;
        }
        node.points[0] = { ...topLeft, ...snapTopLeft };
        node.points[1] = { ...bottomRight, ...snapBottomRight };
    }

    public render(node: INode, context: CanvasRenderingContext2D, show?: 'all' | 'quick'): void {
        if (!context) return;
        const diagram = node.owner;
        if (!isDiagramViewLike(diagram)) return;

        const coordinates = diagram.getCoordinates();
        const cache = diagram.getCache();
        const cached = cache.getNode(node) || {} as INodeCached;

        if (node.points.length > 1) {
            let rect = coordinates.getBoundingRect(node);

            context.save();
            RenderBasics.prepare(node, context, show);

            const path = new Path2D();
            path.rect(rect.left, rect.top, rect.width, rect.height);
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

    public renderSelection(node: INode, context: CanvasRenderingContext2D, show: AnchorScope) {
        if (!context) return;
        const diagram = node.owner;
        if (!isDiagramViewLike(diagram)) return;
        const coordinates = diagram.getCoordinates();

        if (node.points.length > 1) {
            const rect = coordinates.getBoundingRect(node);
            const epsilon = DiagramConstants.HANDLE_HIT_EPSILON;
            // const allowed = (show === 'connection_handles') ?
            //     this.connection_handles :
            //     [NodeHandle.N, NodeHandle.S, NodeHandle.E, NodeHandle.W, NodeHandle.NE, NodeHandle.NW, NodeHandle.SE, NodeHandle.SW, NodeHandle.ROTATE, NodeHandle.ALTER];

            context.save();
            RenderBasics.prepareHandles(node, context);

            const handles = new Path2D();

            const anchors = NodeRegistry.adapter(node.type)?.getAnchors(node, show, 'any') ?? [];
            for (const anchor of anchors) {
                // switch (anchor.handle) {
                // case NodeHandle.ALTER:
                //     this.renderAlterHandle(node, context, rect);
                //     break;
                // case NodeHandle.ROTATE:
                //     if (NodeRegistry.canRotate(node.type)) {
                //         RenderBasics.renderRotateHandle(node, anchor.point, handles, context);
                //     }
                //     break;
                //     default:
                RenderBasics.renderHandle(node, anchor.point, handles, context);
                // break;
                // }
            }

            // // NW
            // if (allowed.includes(NodeHandle.NW)) {
            //     RenderBasics.renderHandle(node, { x: rect.left, y: rect.top }, handles, context);
            // }

            // // SW
            // if (allowed.includes(NodeHandle.SW)) {
            //     RenderBasics.renderHandle(node, { x: rect.left, y: rect.top + rect.height }, handles, context);
            // }

            // // NE
            // if (allowed.includes(NodeHandle.NE)) {
            //     RenderBasics.renderHandle(node, { x: rect.left + rect.width, y: rect.top }, handles, context);
            // }

            // // SE
            // if (allowed.includes(NodeHandle.SE)) {
            //     RenderBasics.renderHandle(node, { x: rect.left + rect.width, y: rect.top + rect.height }, handles, context);
            // }

            // // N
            // if (allowed.includes(NodeHandle.N)) {
            //     RenderBasics.renderHandle(node, { x: rect.left + rect.width / 2, y: rect.top }, handles, context);
            // }

            // // S
            // if (allowed.includes(NodeHandle.S)) {
            //     RenderBasics.renderHandle(node, { x: rect.left + rect.width / 2, y: rect.top + rect.height }, handles, context);
            // }

            // // E
            // if (allowed.includes(NodeHandle.E)) {
            //     RenderBasics.renderHandle(node, { x: rect.left + rect.width, y: rect.top + rect.height / 2 }, handles, context);
            // }

            // // W
            // if (allowed.includes(NodeHandle.W)) {
            //     RenderBasics.renderHandle(node, { x: rect.left, y: rect.top + rect.height / 2 }, handles, context);
            // }

            // if (NodeRegistry.canRotate(node.type) && allowed.includes(NodeHandle.ROTATE)) {
            if ((show === 'all_handles' || show === 'selection_handles') && NodeRegistry.canRotate(node.type)) {
                RenderBasics.renderRotateHandle(node, {
                    x: rect.left + rect.width + 8 + epsilon,
                    y: rect.top + rect.height / 2
                }, handles, context);
            }

            context.fill(handles);
            context.stroke(handles);

            // if (allowed.includes(NodeHandle.ALTER)) {
            if (show === 'all_handles' || show === 'selection_handles') {
                this.renderAlterHandle(node, context, rect);
            }

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

    public geometryOptions(node: INode, path: string): SpecificOptions | undefined {
        return undefined;
    }

    public specificOptions(node: INode, path: string): SpecificOptions | undefined {
        return undefined;
    }

    public write(node: INode, serializer: any): any {
        return serializer.write({
            ...node,
            type: this.type,
        });
    }

    public async read(json: any, serializer: any): Promise<INode> {
        return serializer.read(json);
    }
}
