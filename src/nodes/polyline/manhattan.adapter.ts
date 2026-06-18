import type { IConnectionAnchor, INode } from "../../interfaces";
import { isConnectionNode, isDiagramViewLike } from "../../guards";
import type { INodeCached } from "../../view/view.cache";
import { PolylineAdapter } from "./polyline.adapter";
import { RenderBasics } from "../render.basics";
import type { HollowMode, TextOverflowMode, TextPlacement } from "../../factory/node.adapter";
import { ConnectionBasics } from "../connection.basics";
import { NodeBasics } from "../node.basics";
import { type IPoint, NodeHandle } from "../../types";

type Direction = 'horizontal' | 'vertical';

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
                // RenderBasics.renderText(node, context, { overflow: this.text_overflow });
                const { from, to } = NodeBasics.longestSegment(inferredPoints) || { from: inferredPoints[0]!, to: inferredPoints[1]! };
                RenderBasics.renderText(node, context, { overflow: this.text_overflow, from, to });
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

        let direction = this.inferDirection(first, next, from_handle);
        let corner: IPoint;

        // Skip first and last points for special handling
        for (let i = 1; i < node.points.length; i++) {
            corner = (direction == 'horizontal')
                ? { x: next.x, y: first.y }
                : { x: first.x, y: next.y };

            inferred.push(corner);
            // console.log(`leg ${i} going ${direction}`);

            if (next == last) {
                break;
            }
            // Prepare for next pair of points
            direction = (direction == 'horizontal') ? 'vertical' : 'horizontal';

            first = corner;
            next = node.points[i + 1]!;
            if (next == last) {
                const to_direction = this.inferDirection(corner, next, to_handle);
                const corners = this.inferCorners(corner, next, direction, to_direction);
                inferred.push(...corners);
                break;
            }
        }
        inferred.push(last);
        // console.log('last leg going ', this.inferDirection(undefined, undefined, to_handle));

        return inferred;
    }

    private inferCorners(from: IPoint, to: IPoint, from_direction: Direction, to_direction?: Direction): IPoint[] {
        const corners: IPoint[] = [];

        if (from_direction !== to_direction) {
            const corner = (from_direction == 'horizontal')
                ? { x: to.x, y: from.y }
                : { x: from.x, y: to.y };
            corners.push(corner);
            // console.log(`last corner going ${from_direction}`);

        } else {
            corners.push(from);

            const corner = (to_direction == 'horizontal')
                ? { x: to.x, y: from.y }
                : { x: from.x, y: to.y };
            corners.push(corner);
            // console.log(`last corners going ${from_direction} then ${to_direction}`);
        }
        return corners;
    }

    private inferDirection(from?: IPoint, to?: IPoint, fromHandle?: NodeHandle): Direction {
        if (fromHandle === NodeHandle.N || fromHandle === NodeHandle.S) {
            return 'vertical';
        } else if (fromHandle === NodeHandle.E || fromHandle === NodeHandle.W) {
            return 'horizontal';
        }
        if (!from || !to) {
            return 'horizontal'; // Default direction if points are not provided
        }

        const dx = Math.abs(to.x - from.x);
        const dy = Math.abs(to.y - from.y);
        return (dx > dy) ? 'horizontal' : 'vertical';
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
