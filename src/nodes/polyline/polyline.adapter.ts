import { NodeRegistry } from "../../factory/node.registry";
import { type IConnection, type IGrid, type IHandlePoint, type INode } from "../../interfaces";
import { NodeHandle, type AnchorScope, type IPoint, type IRect, type ITextBaseline, type ITextOrientation } from "../../types";
import { isConnection, isConnectionNode, isDiagramViewLike } from "../../guards";
import type { INodeCached } from "../../view/view.cache";
import { ConnectionBasics } from "../connection.basics";
import { RenderBasics } from "../render.basics";
import type { HollowMode, INodeAdapter, SpecificOptions, TextOverflowMode, TextPlacement } from "../../factory/node.adapter";
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
    can_rotate = false;

    is_connector = true;
    multistep_create = true;
    has_text = true;
    single_line_text = true;
    text_overflow: TextOverflowMode = 'visible';
    text_orientations: ITextOrientation[] = ['horizontal', 'path'];
    text_baselines: ITextBaseline[] = ['middle'];

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

    public hitTest(node: INode, point: IPoint, point_as: 'pointer' | 'diagram'): NodeHandle {
        const diagram = node.owner;
        if (!isDiagramViewLike(diagram)) return NodeHandle.NONE;
        const coordinates = diagram.getCoordinates();
        const cache = diagram.getCache();
        const cached = cache.getNode(node) || {} as INodeCached;

        if (node.points.length > 1) {
            const epsilon = DiagramConstants.HANDLE_HIT_EPSILON;
            const rect = coordinates.getBoundingRect(node, false);

            let hitPoint = point;
            if (point_as === 'pointer') {
                const angle = nodeAngle(node);
                let cos = cached?.cos || Math.cos(angle);
                let sin = cached?.sin || Math.sin(angle);
                hitPoint = coordinates.getHitPoint({ x: point.x, y: point.y }, rect, angle, cos, sin);
            }

            for (const sourcePoint of node.points) {
                if (Math.abs(sourcePoint.x - hitPoint.x) <= epsilon && Math.abs(sourcePoint.y - hitPoint.y) <= epsilon) {
                    return NodeHandle.POINT;
                }
            }

            if (this.hitTestAlter(node, rect, { x: hitPoint.x, y: hitPoint.y })) {
                return NodeHandle.ALTER;
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

    public getAnchors(node: INode, show: AnchorScope, direction?: 'from' | 'to' | 'any'): IHandlePoint[] {
        const diagram = node.owner;
        if (!isDiagramViewLike(diagram)) return [];
        const coordinates = diagram.getCoordinates();
        const rect = coordinates.getBoundingRect(node);

        const anchors: IHandlePoint[] = node.points.map(point => ({ handle: NodeHandle.POINT, point: { ...point } }));

        if (show === 'connection_handles') {
            // return anchors.filter(anchor => this.canConnect(node, direction ?? 'any', anchor.handle, anchor.point));
            return anchors.filter(anchor => this.canConnectTo(node, anchor.handle, direction ?? 'any', undefined, anchor.point));
        } else {
            return anchors;
        }
    }

    // public canConnect(node: INode, direction: 'from' | 'to' | 'any', handle: NodeHandle, point?: IPoint): boolean {
    //     return handle === NodeHandle.POINT;
    // }
    public canConnectTo(node: INode, handle: NodeHandle, direction: 'from' | 'to' | 'any', target?: Partial<INode>, point?: IPoint): boolean {
        return handle === NodeHandle.POINT;
    }

    public defaultConnection(): Partial<IConnection> | null {
        return null;
    }

    public snapToGrid(node: INode, grid: IGrid, handle?: NodeHandle): void {
        const diagram = node.owner;
        if (!isDiagramViewLike(diagram)) return;
        const coordinates = diagram.getCoordinates();

        if (grid && grid.forced) {
            const start = isConnection(node) ? 1 : 0;
            const end = isConnection(node) ? node.points.length - 2 : node.points.length - 1;

            for (let i = start; i <= end; i++) {
                let point = node.points[i]!;
                node.points[i] = coordinates.getGridPoint(point.x, point.y, grid);
            }
        }
    }

    public render(node: INode, context: CanvasRenderingContext2D, show?: 'all' | 'quick'): void {
        if (!context) return;
        const diagram = node.owner;
        if (!isDiagramViewLike(diagram)) return;
        const cache = diagram.getCache();
        const cached = cache.getNode(node) || {} as INodeCached;

        if (node.points.length > 1) {
            context.save();
            RenderBasics.prepare(node, context, show);

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

            if (node.text && show !== 'quick') {
                // RenderBasics.renderText(node, context, { overflow: this.text_overflow });
                const { from, to } = NodeBasics.longestSegment(node.points) || { from: node.points[0]!, to: node.points[1]! };
                RenderBasics.renderText(node, context, { overflow: this.text_overflow, from, to });
            }

            cached.path = path;
            cache.setNode(node, cached);

            context.restore();
        }
    }

    public renderSelection(node: INode, context: CanvasRenderingContext2D, show: AnchorScope): void {
        if (!context) return;
        const diagram = node.owner;
        if (!isDiagramViewLike(diagram)) return;

        if (node.points.length > 1) {
            context.save();
            RenderBasics.prepareHandles(node, context);

            const handles = new Path2D();
            const allowed_points = (show === 'connection_handles')
                ? node.points.slice(1, node.points.length - 1)
                : node.points;

            for (const point of allowed_points) {
                RenderBasics.renderHandle(node, point, handles, context);
            }

            context.fill(handles);
            context.stroke(handles);


            if (show === 'all_handles' || show === 'selection_handles') {
                const rect = diagram.getCoordinates().getBoundingRect(node);
                this.renderAlterHandle(node, context, rect);
            }

            context.restore();
        }
    }

    protected hitTestAlter(node: INode, rect: IRect, point: IPoint): boolean {
        return false;
    }

    protected renderAlterHandle(node: INode, context: CanvasRenderingContext2D, rect: IRect): void {
    }

    public onAlterMove(node: INode, point: IPoint): void {
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

    public onCreateMove(node: INode, point: IPoint): void {
        node.points[node.points.length - 1] = { ...point };
    }

    public async read(json: any, serializer: any): Promise<INode> {
        return serializer.read(json);
    }
}