import type { IConnectionAnchor, INode } from "../../interfaces";
import { isConnectionNode, isDiagramViewLike } from "../../guards";
import type { INodeCached } from "../../view/view.cache";
import { PolylineAdapter } from "./polyline.adapter";
import { RenderBasics } from "../render.basics";
import type { HollowMode, TextOverflowMode, TextPlacement } from "../../factory/node.adapter";
import { ConnectionBasics } from "../connection.basics";
import { NodeBasics } from "../node.basics";
import { type IPoint, NodeHandle } from "../../types";

type CardinalDirection = 'east' | 'west' | 'north' | 'south' | 'north_east' | 'north_west' | 'south_east' | 'south_west';

/**
 * ManhattanAdapter is a node adapter responsible for rendering Manhattan-style polyline nodes in the diagram. 
 * It extends the PolylineAdapter to leverage basic polyline rendering capabilities while adding specific logic 
 * for handling Manhattan-style routing and hit testing.
 * Registers with the NodeRegistry under the name 'manhattan'.
 */
export class ManhattanAdapter extends PolylineAdapter {

    public static NAME = 'manhattan';

    hollow_mode: HollowMode = 'if_transparent';
    has_text = true;
    text_overflow: TextOverflowMode = 'hidden';

    afterConnect?(node: INode, direction: 'from' | 'to', anchor: IConnectionAnchor | null): void {
        if (direction === 'from') {
            node.geometry = node.geometry || {} as any;
            node.geometry!.from_handle = String(anchor?.handle);
        } else if (direction === 'to') {
            node.geometry = node.geometry || {} as any;
            node.geometry!.to_handle = String(anchor?.handle);
        }
        console.log('afterConnect', { node, direction, anchor });
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

            const fromHandle = node.geometry?.from_handle as NodeHandle;
            const toHandle = node.geometry?.to_handle as NodeHandle;

            const inferredPoints: IPoint[] = this.inferPoints(node, fromHandle, toHandle);

            const path = new Path2D();
            path.moveTo(inferredPoints[0]!.x, inferredPoints[0]!.y);

            for (let i = 1; i < inferredPoints.length; i++) {
                const next = inferredPoints[i]!;
                path.lineTo(next.x, next.y);
            }

            context.stroke(path);
            if (isConnectionNode(node)) {
                ConnectionBasics.renderArrows(node, context, inferredPoints);
            }

            if (node.text) {
                const { from, to } = NodeBasics.longestSegment(inferredPoints) || { from: inferredPoints[0]!, to: inferredPoints[1]! };
                RenderBasics.renderText(node, context, {
                    overflow: this.text_overflow,
                    from, to
                });
            }

            cached.path = path;
            cache.setNode(node, cached);

            context.restore();
        }
    }

    private inferPoints(node: INode, from_handle?: NodeHandle, to_handle?: NodeHandle): IPoint[] {
        const inferred: IPoint[] = [];

        let first = node.points[0];
        if (!first) return inferred;
        inferred.push(first);

        let next = node.points[1];
        if (!next) return inferred;

        const last = node.points[node.points.length - 1]!;

        let direction = this.infer_cardinal_from_handle(from_handle);
        let segment = this.inferSegment(first, next, direction);

        inferred.push(...segment);
        inferred.push(next);

        for (let i = 1; i < node.points.length - 1; i++) {
            const from = inferred[inferred.length - 1]!;
            const to = node.points[i]!;

            direction = this.infer_cardinal_from_points(from, to);
            segment = this.inferSegment(from, to, direction);

            inferred.push(...segment);
            inferred.push(to);
        }

        const from = inferred[inferred.length - 1]!;
        const end_direction = this.infer_cardinal_from_handle(to_handle);
        const end_segment = this.inferSegment(last, from, end_direction).reverse();

        inferred.push(...end_segment);
        inferred.push(last);

        console.log('inferred points', inferred);
        return inferred;
    }

    /**
     * Return the corner points needed to connect two points in a Manhattan-style polyline, based on the direction of the connection.
     * @param from The starting point of the segment.
     * @param to The ending point of the segment.
     * @param from_direction The direction from which the segment starts.
     * @param to_direction The direction towards which the segment ends.
     * @returns An array of points representing the corners of the Manhattan-style polyline segment.
     */
    private inferSegment(from: IPoint, to: IPoint, from_direction: CardinalDirection, to_direction?: CardinalDirection): IPoint[] {
        const points: IPoint[] = [];

        if (from.x == to.x || from.y == to.y) {
            return [];
        }

        const stub = 24; // Minimum segment length before a turn is forced

        let walker = { x: from.x, y: from.y };
        let dx = to.x - from.x;
        let dy = to.y - from.y;

        // if (to_direction) {
        //     return this.inferSegment(to, from, to_direction);
        // }

        if (from_direction === 'north') {
            walker = { x: from.x, y: from.y + Math.min(-stub, dy) };
            points.push(walker);

            if (Math.abs(to.y - walker.y) >= 1) {
                walker = { x: to.x, y: walker.y };
                points.push(walker);
            }
        }

        if (from_direction === 'south') {
            walker = { x: from.x, y: from.y + Math.max(stub, dy) };
            points.push(walker);

            if (Math.abs(to.y - walker.y) >= 1) {
                walker = { x: to.x, y: walker.y };
                points.push(walker);
            }
        }

        if (from_direction === 'west') {
            walker = { x: from.x + Math.min(-stub, dx), y: from.y };
            points.push(walker);

            if (Math.abs(to.x - walker.x) >= 1) {
                walker = { x: walker.x, y: to.y };
                points.push(walker);
            }
        }

        if (from_direction === 'east') {
            walker = { x: from.x + Math.max(stub, dx), y: from.y };
            points.push(walker);

            if (Math.abs(to.x - walker.x) >= 1) {
                walker = { x: walker.x, y: to.y };
                points.push(walker);
            }
        }

        if (to_direction) {
            if (to_direction === 'north') {
                walker = { x: to.x, y: to.y + Math.min(-stub, dy) };
                points.push(walker);
            }

            if (to_direction === 'south') {
                walker = { x: to.x, y: to.y + Math.max(stub, dy) };
                points.push(walker);
            }

            if (to_direction === 'west') {
                walker = { x: to.x + Math.min(-stub, dx), y: to.y };
                points.push(walker);
            }

            if (to_direction === 'east') {
                walker = { x: to.x + Math.max(stub, dx), y: to.y };
                points.push(walker);
            }
        }

        return points;
    }

    private infer_cardinal_from_handle(fromHandle?: NodeHandle, toHandle?: NodeHandle): CardinalDirection {
        if (fromHandle) {
            switch (fromHandle) {
                case NodeHandle.E: return 'east';
                case NodeHandle.W: return 'west';
                case NodeHandle.N: return 'north';
                case NodeHandle.S: return 'south';
            }
        } else if (toHandle) {
            switch (toHandle) {
                case NodeHandle.E: return 'west';
                case NodeHandle.W: return 'east';
                case NodeHandle.N: return 'south';
                case NodeHandle.S: return 'north';
            }
        }
        return 'east';
    }

    private infer_cardinal_from_points(from: IPoint, to: IPoint): CardinalDirection {
        if (!from || !to) {
            return 'east';
        }

        const dx = to.x - from.x;
        const dy = to.y - from.y;
        if (Math.abs(dx) >= Math.abs(dy)) {
            return dx >= 0 ? 'east' : 'west';
        }
        return dy >= 0 ? 'south' : 'north';
    }

    public textPlacement(node: INode): TextPlacement {
        const from_handle = node.geometry?.from_handle as NodeHandle;
        const to_handle = node.geometry?.to_handle as NodeHandle;
        const inferred = this.inferPoints(node, from_handle, to_handle);
        if (inferred.length < 2) {
            return {};
        }

        const { from, to } = NodeBasics.longestSegment(inferred) || { from: inferred[0]!, to: inferred[1]! };
        return {
            segment: { from, to }
        };
    }
}
