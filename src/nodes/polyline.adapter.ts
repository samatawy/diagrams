import { NodeRegistry } from "../factory/node.registry";
import { type IGrid, type INode } from "../interfaces";
import { NodeHandle, type IPoint } from "../types";
import { isConnectionNode, isDiagramViewLike } from "../guards";
import type { INodeCached } from "../view/view.cache";
import { ConnectionBasics } from "./connection.basics";
import { RenderBasics } from "./render.basics";
import type { HollowMode, INodeAdapter, TextOverflowMode } from "../factory/node.adapter";
import { isHollow, lineWidth, nodeAngle } from "../value.utils";

/**
 * PolylineAdapter is a node adapter responsible for rendering polyline nodes in the diagram. 
 * It provides rendering capabilities for polylines and hit testing logic specific to polylines.
 * Registers with the NodeRegistry under the name 'polyline'.
 */
export class PolylineAdapter implements INodeAdapter {

    protected readonly hitStrokePadding = 8;

    hollow_mode: HollowMode = 'always';

    is_connector = true;
    multistep_create = true;
    has_text = false;
    text_overflow: TextOverflowMode = 'hidden';

    public static NAME = 'polyline';
    public name = PolylineAdapter.NAME;

    register() {
        NodeRegistry.register(this.name, this);
    }

    hitTest(node: INode, point: IPoint): NodeHandle | undefined {
        const diagram = node.owner;
        if (!isDiagramViewLike(diagram)) return NodeHandle.NONE;
        const coordinates = diagram.getCoordinates();
        const cache = diagram.getCache();
        const cached = cache.getNode(node) || {} as INodeCached;

        if (node.points.length > 1) {
            const angle = nodeAngle(node);

            const rect = coordinates.getBoundingRect(node, false);
            const cos = cached.cos || Math.cos(angle);
            const sin = cached.sin || Math.sin(angle);
            const hitPoint = coordinates.getHitPoint({ x: point.x, y: point.y }, rect, angle, cos, sin);

            for (const sourcePoint of node.points) {
                if (Math.abs(sourcePoint.x - hitPoint.x) <= 4 && Math.abs(sourcePoint.y - hitPoint.y) <= 4) {
                    return NodeHandle.POINT;
                }
            }

            if (cached.path) {
                const hitStrokeWidth = Math.max(lineWidth(node) + this.hitStrokePadding, 10);
                const inPath = isHollow(node)
                    ? coordinates.isPointInStroke(cached.path, hitPoint.x, hitPoint.y, hitStrokeWidth)
                    : coordinates.isPointInPath(cached.path, hitPoint.x, hitPoint.y);
                return inPath ? NodeHandle.MOVE : NodeHandle.NONE;
            }
        }

        return NodeHandle.NONE;
    }

    snapToGrid(node: INode, grid: IGrid): void {
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

    render(node: INode, context: CanvasRenderingContext2D): void {
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
                ConnectionBasics.renderArrows(node, context);
            }

            cached.path = path;
            cache.setNode(node, cached);

            context.restore();
        }
    }

    renderSelection(node: INode, context: CanvasRenderingContext2D): void {
        if (!context) return;
        const diagram = node.owner;
        if (!isDiagramViewLike(diagram)) return;

        if (node.points.length > 1) {
            context.save();
            RenderBasics.prepareHandles(node, context);

            const handles = new Path2D();

            for (const point of node.points) {
                handles.rect(point.x - 4, point.y - 4, 8, 8);
            }
            context.fill(handles);
            context.stroke(handles);

            context.restore();
        }
    }

    write(node: INode, serializer: any): any {
        return serializer.write({
            ...node,
            type: this.name,
        });
    }

    onCreateMove(node: INode, point: IPoint): void {
        node.points[node.points.length - 1] = { ...point };
    }

    async read(json: any, serializer: any): Promise<INode> {
        return serializer.read(json);
    }
}