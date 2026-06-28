import { NodeRegistry } from "../../factory/node.registry";
import { type IGrid, type INode } from "../../interfaces";
import { NodeHandle, type IPoint, type IRect, type ITextOrientation } from "../../types";
import { isConnectionNode, isDiagramViewLike } from "../../guards";
import type { INodeCached } from "../../view/view.cache";
import { ConnectionBasics } from "../connection.basics";
import { RenderBasics } from "../render.basics";
import type { HollowMode, INodeAdapter, TextOverflowMode, TextPlacement } from "../../factory/node.adapter";
import { isHollow, lineWidth, nodeAngle } from "../../value.utils";
import { DiagramConstants } from "../../model/diagram.constants";
import { NodeBasics } from "../node.basics";

/**
 * PolylineAdapter is a node adapter responsible for rendering polyline nodes in the diagram. 
 * It provides rendering capabilities for polylines and hit testing logic specific to polylines.
 * Registers with the NodeRegistry under the name 'polyline'.
 */
export class PolylineAdapter implements INodeAdapter {

    public static TYPE = 'polyline';

    connection_handles: NodeHandle[] = [NodeHandle.POINT];

    /**
     * Gets the registry name for this adapter.
     */
    public get type(): string {
        return (this.constructor as typeof PolylineAdapter).TYPE;
    }

    // protected readonly hitStrokePadding = DiagramConstants.SELECTION_LINE_PADDING;

    hollow_mode: HollowMode = 'always';

    is_connector = true;
    multistep_create = true;
    has_text = true;
    text_overflow: TextOverflowMode = 'visible';
    text_orientations: ITextOrientation[] = ['horizontal', 'path'];

    /**
     * Registers the PolylineAdapter with the NodeRegistry.
     */
    public static register() {
        NodeRegistry.register(this.TYPE, this);
    }

    /**
     * Registers the PolylineAdapter instance with the NodeRegistry.
     */
    public register() {
        NodeRegistry.register(this.type, this);
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

            const rect = coordinates.getBoundingRect(node, false);
            const cos = cached.cos || Math.cos(angle);
            const sin = cached.sin || Math.sin(angle);
            const hitPoint = coordinates.getHitPoint({ x: point.x, y: point.y }, rect, angle, cos, sin);

            for (const sourcePoint of node.points) {
                if (Math.abs(sourcePoint.x - hitPoint.x) <= epsilon && Math.abs(sourcePoint.y - hitPoint.y) <= epsilon) {
                    return NodeHandle.POINT;
                }
            }

            if (cached?.text_path && coordinates.isPointInPath(cached.text_path, hitPoint.x, hitPoint.y)) {
                return NodeHandle.MOVE;
            }

            if (cached.path) {
                const hitStrokeWidth = Math.max(lineWidth(node) + DiagramConstants.PATH_HIT_PADDING, 10);
                const inPath = isHollow(node) ?
                    coordinates.isPointInStroke(cached.path, hitPoint.x, hitPoint.y, hitStrokeWidth) :
                    coordinates.isPointInPath(cached.path, hitPoint.x, hitPoint.y);
                return inPath ? NodeHandle.MOVE : NodeHandle.NONE;
            }
        }

        return NodeHandle.NONE;
    }

    public snapToGrid(node: INode, grid: IGrid, handle: NodeHandle): void {
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
        const cache = diagram.getCache();
        const cached = cache.getNode(node) || {} as INodeCached;

        if (node.points.length > 1) {
            context.save();
            RenderBasics.prepare(node, context);

            if (isConnectionNode(node)) {
                ConnectionBasics.syncEndpoints(node);
            }

            const path = new Path2D();
            path.moveTo(node.points[0]!.x, node.points[0]!.y);
            for (let i = 1; i < node.points.length; i++) {
                path.lineTo(node.points[i]!.x, node.points[i]!.y);
            }

            context.stroke(path);
            if (isConnectionNode(node)) {
                RenderBasics.renderArrows(node, context);
            }

            if (node.text) {
                // RenderBasics.renderText(node, context, { overflow: this.text_overflow });
                const { from, to } = NodeBasics.longestSegment(node.points) || { from: node.points[0]!, to: node.points[1]! };
                RenderBasics.renderText(node, context, { overflow: this.text_overflow, from, to });
            }

            cached.path = path;
            cache.setNode(node, cached);

            context.restore();
        }
    }

    public renderSelection(node: INode, context: CanvasRenderingContext2D, show: 'all_handles' | 'connection_handles'): void {
        if (!context) return;
        const diagram = node.owner;
        if (!isDiagramViewLike(diagram)) return;

        if (node.points.length > 1) {
            context.save();
            RenderBasics.prepareHandles(node, context);

            const handles = new Path2D();
            const allowed_points = (show === 'all_handles') ? node.points : node.points.slice(1, node.points.length - 1);

            for (const point of allowed_points) {
                RenderBasics.renderHandle(node, point, handles, context);
            }
            context.fill(handles);
            context.stroke(handles);

            context.restore();
        }
    }

    public textPlacement(node: INode): TextPlacement {
        const { from, to } = NodeBasics.longestSegment(node.points) || { from: node.points[0]!, to: node.points[1]! };
        return {
            segment: { from, to }
        };
    }

    public getVisualRect(_node: INode, rect: IRect): IRect {
        return rect;
    }

    public write(node: INode, serializer: any): any {
        return serializer.write({
            ...node,
            type: this.type,
        });
    }

    public onCreateMove(node: INode, point: IPoint): void {
        node.points[node.points.length - 1] = { ...point };
    }

    public async read(json: any, serializer: any): Promise<INode> {
        return serializer.read(json);
    }
}