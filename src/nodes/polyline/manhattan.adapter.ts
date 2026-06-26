import type { IConnectionAnchor, IDiagram, INode } from "../../interfaces";
import { isConnectionNode, isDiagramViewLike } from "../../guards";
import type { INodeCached } from "../../view/view.cache";
import { PolylineAdapter } from "./polyline.adapter";
import { RenderBasics } from "../render.basics";
import type { HollowMode, TextOverflowMode, TextPlacement } from "../../factory/node.adapter";
import { ConnectionBasics } from "../connection.basics";
import { NodeBasics } from "../node.basics";
import { type IPoint, type IRect, NodeHandle } from "../../types";
import type { DiagramView } from "../../view/diagram.view";

type CardinalDirection = 'east' | 'west' | 'north' | 'south';   // | 'north_east' | 'north_west' | 'south_east' | 'south_west';

type DirectedPoint = IPoint & { direction?: CardinalDirection };

/**
 * ManhattanAdapter is a node adapter responsible for rendering Manhattan-style polyline nodes in the diagram. 
 * It extends the PolylineAdapter to leverage basic polyline rendering capabilities while adding specific logic 
 * for handling Manhattan-style routing and hit testing.
 * Registers with the NodeRegistry under the name 'manhattan'.
 */
export class ManhattanAdapter extends PolylineAdapter {

    public static TYPE = 'manhattan';

    hollow_mode: HollowMode = 'if_transparent';
    has_text = true;
    text_overflow: TextOverflowMode = 'hidden';

    afterConnect(node: INode, direction: 'from' | 'to', anchor: IConnectionAnchor | null): void {
        if (direction === 'from' && anchor) {
            node.geometry = node.geometry || {} as any;
            const target = this.resolveNode(node.owner, anchor);
            node.geometry!.from_handle = this.normalizeHandle(anchor, target);

        } else if (direction === 'to' && anchor) {
            node.geometry = node.geometry || {} as any;
            const target = this.resolveNode(node.owner, anchor);
            node.geometry!.to_handle = this.normalizeHandle(anchor, target);
        }


        // Ensure at least one midpoint exists.
        // if (node.points.length === 2 && node.geometry?.from_handle && node.geometry?.to_handle) {

        //     const first = node.points[0]!;
        //     const second = node.points[1]!;
        //     let mid_x = (first.x + second.x) / 2;
        //     let mid_y = (first.y + second.y) / 2;
        //     let offset: number;

        //     switch (anchor?.handle) {
        //         case NodeHandle.N:
        //             offset = -24;
        //             node.points.splice(1, 0, { x: mid_x, y: first.y + offset });
        //             break;
        //         case NodeHandle.S:
        //             offset = 24;
        //             node.points.splice(1, 0, { x: mid_x, y: first.y + offset });
        //             break;
        //         case NodeHandle.W:
        //             offset = -24;
        //             node.points.splice(1, 0, { x: first.x + offset, y: mid_y });
        //             break;
        //         case NodeHandle.E:
        //             offset = 24;
        //             node.points.splice(1, 0, { x: first.x + offset, y: mid_y });
        //             break;
        //     }
        // }

        // Single-waypoint rule: compute from/to stub tips and insert one elbow only when useful.
        if (node.points.length === 2 && node.geometry?.from_handle && node.geometry?.to_handle) {
            const first = node.points[0]!;
            const second = node.points[1]!;

            const fromHandle = node.geometry.from_handle as NodeHandle;
            const toHandle = node.geometry.to_handle as NodeHandle;

            const stub = 24;
            const fromDir = this.infer_cardinal_from_handle(fromHandle);
            const toDir = this.infer_cardinal_from_handle(toHandle);
            const fromStub = this.makeRelativePoint(first, fromDir, stub);
            const toStub = this.makeRelativePoint(second, toDir, stub);

            // If stub tips are already aligned, the midpoint between them is enough.
            if (fromStub.x === toStub.x || fromStub.y === toStub.y) {
                node.points.splice(1, 0, {
                    x: (fromStub.x + toStub.x) / 2,
                    y: (fromStub.y + toStub.y) / 2,
                });
                return;
            }

            const candidates: IPoint[] = [
                { x: fromStub.x, y: toStub.y },
                { x: toStub.x, y: fromStub.y },
            ];

            const selected = candidates.find((candidate) => {
                const degenerateFrom = this.samePoint(fromStub, candidate);
                const degenerateTo = this.samePoint(candidate, toStub);
                if (degenerateFrom || degenerateTo) {
                    return false;
                }

                const depart = this.infer_cardinal_from_points(fromStub, candidate);
                const arrive = this.infer_cardinal_from_points(candidate, toStub);

                // Do not immediately reverse the start stub, and do not approach end stub
                // in the same direction as the stub itself (would backtrack on final hop).
                return depart !== this.invert_cardinal(fromDir) && arrive !== toDir;
            });

            if (selected) {
                node.points.splice(1, 0, selected);
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

            const fromHandle = node.geometry?.from_handle as NodeHandle;
            const toHandle = node.geometry?.to_handle as NodeHandle;

            const pathPoints = this.planBestPath(node.points, fromHandle, toHandle);

            const path = new Path2D();
            path.moveTo(pathPoints[0]!.x, pathPoints[0]!.y);
            for (let i = 1; i < pathPoints.length; i++) {
                const next = pathPoints[i]!;
                path.lineTo(next.x, next.y);
            }
            context.stroke(path);
            if (isConnectionNode(node)) {
                ConnectionBasics.renderArrows(node, context, pathPoints);
            }

            if (node.text) {
                const { from, to } = NodeBasics.longestSegment(pathPoints) || { from: pathPoints[0]!, to: pathPoints[1]! };
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

    // Find and build best path

    private planBestPath(points: IPoint[], from_handle?: NodeHandle, to_handle?: NodeHandle): DirectedPoint[] {
        const pathPoints: DirectedPoint[] = [];
        const stub = 24;

        const source: DirectedPoint[] = this.cloneDirected(points, from_handle, to_handle);

        let to_stub: DirectedPoint | undefined;
        let to_direction: CardinalDirection | undefined;
        if (to_handle) {
            to_direction = this.infer_cardinal_from_handle(to_handle);
            to_stub = this.makeRelativePoint(source[source.length - 1]!, to_direction, stub);
            source.splice(source.length - 1, 0, to_stub);
        }

        if (source.length < 2) return source;
        let leg: { start: DirectedPoint; end: DirectedPoint } = { start: source[0]!, end: source[1]! };
        pathPoints.push(leg.start);

        let dx: number;
        let dy: number;
        let next_point: DirectedPoint;
        let next_direction: CardinalDirection, prior_direction: CardinalDirection;

        next_direction = from_handle ? this.infer_cardinal_from_handle(from_handle)
            : this.nextDirection(leg.start, leg.end);

        next_point = this.nextPoint(leg.start, leg.end, next_direction, stub);
        pathPoints.push(next_point);
        leg = { start: next_point, end: leg.end };
        prior_direction = next_direction;

        let index = 1;
        let i = 0;
        while (index < source.length && i < 100) {
            dx = leg.end.x - leg.start.x;
            dy = leg.end.y - leg.start.y;

            if (to_direction && leg.end === to_stub) {
                next_direction = this.nextDirection(leg.start, leg.end, prior_direction,
                    this.invert_cardinal(to_direction));
            } else {
                next_direction = this.nextDirection(leg.start, leg.end, prior_direction);
            }
            next_point = this.nextPoint(leg.start, leg.end, next_direction, 0);

            pathPoints.push(next_point);

            if (this.samePoint(next_point, leg.end)) {
                // Take up the next leg immediately, since the point is already aligned with the current leg.
                leg = { start: leg.end, end: source[index + 1]! };
                index++;
            } else {
                // Continue to the end of the current leg.
                leg = { start: next_point, end: leg.end };
            }
            prior_direction = next_direction;
            i++;
        }

        return pathPoints;
    }

    private nextDirection(from: IPoint, to: IPoint, prior_direction?: CardinalDirection, to_direction?: CardinalDirection): CardinalDirection {
        const dx = to.x - from.x;
        const dy = to.y - from.y;

        if (to_direction) {
            const options = this.alternativePaths(from, to, prior_direction);
            const valid_options = options.filter(path => this.isValidSequence(path[path.length - 1]!, to_direction));
            if (valid_options.length > 0) {
                const best_option = valid_options.reduce((best, current) => {
                    const best_length = best.reduce((sum, dir) => sum + 1, 0);
                    const current_length = current.reduce((sum, dir) => sum + 1, 0);
                    return current_length < best_length ? current : best;
                }, valid_options[0]!);
                return best_option[0]!;
            }
            console.log('No path valid from ', options);
        }

        // If no to_direction, things are simpler.
        if (prior_direction === 'east') {
            if (dx > 0) return 'east';
            return dy < 0 ? 'north' : 'south';

        } else if (prior_direction === 'west') {
            if (dx < 0) return 'west';
            return dy < 0 ? 'north' : 'south';

        } else if (prior_direction === 'north') {
            if (dy < 0) return 'north';
            return dx < 0 ? 'west' : 'east';

        } else if (prior_direction === 'south') {
            if (dy > 0) return 'south';
            return dx < 0 ? 'west' : 'east';
        }

        const prefer_horizontal = Math.abs(dx) >= Math.abs(dy);
        if (prefer_horizontal) {
            return dx < 0 ? 'west' : 'east';
        } else {
            return dy < 0 ? 'north' : 'south';
        }
    }

    private alternativePaths(from: IPoint, to: IPoint, prior_direction?: CardinalDirection): CardinalDirection[][] {
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const options: CardinalDirection[] = [];

        if (prior_direction === 'east') {
            if (dx > 0) options.push('east');
            options.push(dy < 0 ? 'north' : 'south');

        } else if (prior_direction === 'west') {
            if (dx < 0) options.push('west');
            options.push(dy < 0 ? 'north' : 'south');

        } else if (prior_direction === 'north') {
            if (dy < 0) options.push('north');
            options.push(dx < 0 ? 'west' : 'east');

        } else if (prior_direction === 'south') {
            if (dy > 0) options.push('south');
            options.push(dx < 0 ? 'west' : 'east');
        }

        const results: CardinalDirection[][] = [];
        for (const one of options) {
            const point = this.nextPoint(from, to, one, 0);
            if (this.samePoint(point, to)) {
                results.push([one]);
            } else {
                const next = this.alternativePaths(point, to, one);
                for (const two of next) {
                    results.push([one, ...two]);
                }
            }
        }

        return results;
    }

    private nextPoint(from: IPoint, to: IPoint, direction: CardinalDirection, stub: number): DirectedPoint {

        let mdx = (to.x - from.x);
        if (mdx === 0) return { ...to, direction: this.infer_cardinal_from_points(from, to) };
        let mdy = (to.y - from.y);
        if (mdy === 0) return { ...to, direction: this.infer_cardinal_from_points(from, to) };

        switch (direction) {
            case 'north':
                mdy = mdy < 0 ? Math.min(-stub, mdy) : -stub;
                return { x: from.x, y: from.y + mdy, direction: 'north' };
            case 'south':
                mdy = mdy > 0 ? Math.max(stub, mdy) : stub;
                return { x: from.x, y: from.y + mdy, direction: 'south' };
            case 'west':
                mdx = mdx < 0 ? Math.min(-stub, mdx) : -stub;
                return { x: from.x + mdx, y: from.y, direction: 'west' };
            case 'east':
                mdx = mdx > 0 ? Math.max(stub, mdx) : stub;
                return { x: from.x + mdx, y: from.y, direction: 'east' };
            default:
                return { ...from, direction: this.infer_cardinal_from_points(from, to) };
        }
    }

    // Helper routines

    private normalizeHandle(anchor: IConnectionAnchor, node?: INode): NodeHandle {
        const given = anchor.handle;
        if (given === NodeHandle.N || given === NodeHandle.S || given === NodeHandle.E || given === NodeHandle.W) {
            return given;
        }

        if (!node) {
            return given;
        }

        const diagram = node.owner as DiagramView;
        const coordinates = diagram.getCoordinates();
        const rect = coordinates.getBoundingRect(node);
        switch (given) {
            case NodeHandle.NE:
                return (rect.width > rect.height) ? NodeHandle.N : NodeHandle.E;
            case NodeHandle.NW:
                return (rect.width > rect.height) ? NodeHandle.N : NodeHandle.W;
            case NodeHandle.SE:
                return (rect.width > rect.height) ? NodeHandle.S : NodeHandle.E;
            case NodeHandle.SW:
                return (rect.width > rect.height) ? NodeHandle.S : NodeHandle.W;
            default:
                return given;
        }
    }

    private resolveNode(diagram: IDiagram, anchor: IConnectionAnchor): INode | undefined {
        if (anchor.node) {
            if (typeof anchor.node === 'string') {
                return diagram.node(anchor.node);
            } else {
                return anchor.node;
            }
        }
    }

    private infer_cardinal_from_handle(fromHandle?: NodeHandle): CardinalDirection {
        switch (fromHandle) {
            case NodeHandle.E: return 'east';
            case NodeHandle.W: return 'west';
            case NodeHandle.N: return 'north';
            case NodeHandle.S: return 'south';
        }
        return 'east';
    }

    private infer_cardinal_to_handle(toHandle?: NodeHandle): CardinalDirection {
        switch (toHandle) {
            case NodeHandle.E: return 'west';
            case NodeHandle.W: return 'east';
            case NodeHandle.N: return 'south';
            case NodeHandle.S: return 'north';
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

    private invert_cardinal(direction: CardinalDirection): CardinalDirection {
        switch (direction) {
            case 'east': return 'west';
            case 'west': return 'east';
            case 'north': return 'south';
            case 'south': return 'north';
        }
    }

    private cloneDirected(points: IPoint[], from_handle?: NodeHandle, to_handle?: NodeHandle): DirectedPoint[] {
        const directed: DirectedPoint[] = [];
        if (points.length < 2) return directed;

        directed.push({
            x: points[0]!.x,
            y: points[0]!.y,
            direction: this.infer_cardinal_from_handle(from_handle)
        });

        for (let i = 1; i < points.length - 1; i++) {
            directed.push({
                x: points[i]!.x,
                y: points[i]!.y,
                direction: this.infer_cardinal_from_points(points[i]!, points[i + 1]!)
            });
        }

        directed.push({
            x: points[points.length - 1]!.x,
            y: points[points.length - 1]!.y,
            direction: this.infer_cardinal_from_handle(to_handle)
        });

        return directed;
    }

    private makeRelativePoint(point: IPoint, direction: CardinalDirection, distance: number): DirectedPoint {
        switch (direction) {
            case 'north':
                return { x: point.x, y: point.y - distance, direction: 'north' };
            case 'south':
                return { x: point.x, y: point.y + distance, direction: 'south' };
            case 'west':
                return { x: point.x - distance, y: point.y, direction: 'west' };
            case 'east':
                return { x: point.x + distance, y: point.y, direction: 'east' };
            default:
                return { ...point, direction: this.infer_cardinal_from_points(point, { x: point.x, y: point.y }) };
        }
    }

    private isValidSequence(dir1: CardinalDirection, dir2: CardinalDirection): boolean {
        if (dir1 === 'east' && dir2 === 'west') return false;
        if (dir1 === 'west' && dir2 === 'east') return false;
        if (dir1 === 'north' && dir2 === 'south') return false;
        if (dir1 === 'south' && dir2 === 'north') return false;
        return true;
    }

    private samePoint(p1: IPoint, p2: IPoint): boolean {
        return Math.abs(p1.x - p2.x) < 1 && Math.abs(p1.y - p2.y) < 1;
    }

    // Use path for hot testing and editing text 

    private inferPoints(node: INode, from_handle?: NodeHandle, to_handle?: NodeHandle): IPoint[] {
        const plan = this.planBestPath(node.points, from_handle, to_handle);
        return plan;
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



// private inferPoints(node: INode, from_handle?: NodeHandle, to_handle?: NodeHandle): IPoint[] {
//     const inferred: IPoint[] = [];

//     let first = node.points[0];
//     if (!first) return inferred;
//     inferred.push(first);

//     let next = node.points[1];
//     if (!next) return inferred;

//     const last = node.points[node.points.length - 1]!;

//     // const plan = this.planDirections(node.points, from_handle, to_handle);
//     // console.log('Plan for first segment:', plan);

//     let direction = this.infer_cardinal_from_handle(from_handle);
//     let segment = this.inferSegment(first, next, direction);

//     inferred.push(...segment);
//     inferred.push(next);

//     for (let i = 1; i < node.points.length - 1; i++) {
//         const from = inferred[inferred.length - 1]!;
//         const to = node.points[i]!;

//         direction = this.infer_cardinal_from_points(from, to);
//         segment = this.inferSegment(from, to, direction);

//         inferred.push(...segment);
//         inferred.push(to);
//     }

//     const from = inferred[inferred.length - 1]!;
//     const end_direction = this.infer_cardinal_from_handle(to_handle);
//     const end_segment = this.inferSegment(last, from, end_direction).reverse();

//     inferred.push(...end_segment);
//     inferred.push(last);

//     return inferred;
// }

// /**
//  * Return the corner points needed to connect two points in a Manhattan-style polyline, based on the direction of the connection.
//  * @param from The starting point of the segment.
//  * @param to The ending point of the segment.
//  * @param from_direction The direction from which the segment starts.
//  * @returns An array of points representing the corners of the Manhattan-style polyline segment.
//  */
// private inferSegment(from: IPoint, to: IPoint, from_direction: CardinalDirection): IPoint[] {
//     const points: IPoint[] = [];

//     if (from.x == to.x || from.y == to.y) {
//         return [];
//     }

//     const stub = 24; // Minimum segment length before a turn is forced

//     let walker = { x: from.x, y: from.y };
//     let dx = to.x - from.x;
//     let dy = to.y - from.y;

//     // Pre-check: if `to` is behind or too close, shift `from` one stub unit in from_direction
//     // before running the walker. This keeps the path from retracing the segment that just arrived.
//     // if (from_direction === 'east' && dx < 0) {
//     //     points.push({ x: from.x, y: from.y + stub * Math.sign(dy) });
//     //     from = points[points.length - 1]!;
//     //     console.log('Detour from east');
//     // }
//     // if (from_direction === 'west' && dx > 0) {
//     //     points.push({ x: from.x, y: from.y + stub * Math.sign(dy) });
//     //     from = points[points.length - 1]!;
//     //     console.log('Detour from west');
//     // }
//     // if (from_direction === 'north' && dy > 0) {
//     //     points.push({ x: from.x + stub * Math.sign(dx), y: from.y });
//     //     from = points[points.length - 1]!;
//     //     console.log('Detour from north');
//     // }
//     // if (from_direction === 'south' && dy < 0) {
//     //     points.push({ x: from.x + stub * Math.sign(dx), y: from.y });
//     //     from = points[points.length - 1]!;
//     //     console.log('Detour from south');
//     // }

//     if (from_direction === 'north') {
//         walker = { x: from.x, y: from.y + Math.min(-stub, dy) };
//         points.push(walker);

//         // if (walker.y - to.y <= 0) {       // Prevent backtracking
//         //     walker = { x: walker.x + stub * Math.sign(dx), y: walker.y };
//         //     points.push(walker);
//         //     console.log('Detour from north');
//         // }

//         if (Math.abs(to.y - walker.y) >= 1) {
//             walker = { x: to.x, y: walker.y };
//             points.push(walker);
//         }
//     }

//     if (from_direction === 'south') {
//         walker = { x: from.x, y: from.y + Math.max(stub, dy) };
//         points.push(walker); ``

//         // if (walker.y - to.y <= 0) {       // Prevent backtracking
//         //     walker = { x: walker.x + stub * Math.sign(dx), y: walker.y };
//         //     points.push(walker);
//         //     console.log('Detour from south');
//         // }

//         if (Math.abs(to.y - walker.y) >= 1) {
//             walker = { x: to.x, y: walker.y };
//             points.push(walker);
//         }
//     }

//     if (from_direction === 'west') {
//         walker = { x: from.x + Math.min(-stub, dx), y: from.y };
//         points.push(walker);

//         // if (walker.x - to.x <= 0) {       // Prevent backtracking
//         //     walker = { x: walker.x, y: walker.y + stub * Math.sign(dy) };
//         //     points.push(walker);
//         //     console.log('Detour from west');
//         // }

//         if (Math.abs(to.x - walker.x) >= 1) {
//             walker = { x: walker.x, y: to.y };
//             points.push(walker);
//         }
//     }

//     if (from_direction === 'east') {
//         walker = { x: from.x + Math.max(stub, dx), y: from.y };
//         points.push(walker);

//         // if (walker.x - to.x <= 0) {       // Prevent backtracking
//         //     walker = { x: walker.x, y: walker.y + stub * Math.sign(dy) };
//         //     points.push(walker);
//         //     console.log('Detour from east');
//         // }

//         if (Math.abs(to.x - walker.x) >= 1) {
//             walker = { x: walker.x, y: to.y };
//             points.push(walker);
//         }
//     }

//     // if (to_direction) {
//     //     if (to_direction === 'north') {
//     //         walker = { x: to.x, y: to.y + Math.min(-stub, dy) };
//     //         points.push(walker);
//     //     }

//     //     if (to_direction === 'south') {
//     //         walker = { x: to.x, y: to.y + Math.max(stub, dy) };
//     //         points.push(walker);
//     //     }

//     //     if (to_direction === 'west') {
//     //         walker = { x: to.x + Math.min(-stub, dx), y: to.y };
//     //         points.push(walker);
//     //     }

//     //     if (to_direction === 'east') {
//     //         walker = { x: to.x + Math.max(stub, dx), y: to.y };
//     //         points.push(walker);
//     //     }
//     // }

//     return points;
// }


// /**
//  * Plan one CardinalDirection per segment (points.length - 1 entries).
//  * Consecutive directions are never opposing (east↔west, north↔south).
//  * east/west segments arrive horizontally, so the next segment must be vertical, and vice-versa.
//  */
// private planDirections(points: IPoint[], from_handle?: NodeHandle, to_handle?: NodeHandle): CardinalDirection[] {
//     const plan: CardinalDirection[] = [];
//     if (points.length < 2) return plan;

//     const isHorizontal = (d: CardinalDirection) => d === 'east' || d === 'west';
//     const isVertical = (d: CardinalDirection) => d === 'north' || d === 'south';

//     // Segment 0: driven by the from handle
//     plan.push(this.infer_cardinal_from_handle(from_handle));

//     // Middle segments: pick candidate from geometry, but forbid same axis as previous
//     for (let i = 1; i < points.length - 1; i++) {
//         const prev = plan[plan.length - 1]!;
//         const from = points[i]!;
//         const to = points[i + 1]!;
//         const dx = to.x - from.x;
//         const dy = to.y - from.y;
//         let candidate = this.infer_cardinal_from_points(from, to);

//         // east/west arrival → next must be vertical; north/south arrival → next must be horizontal
//         if (isHorizontal(prev) && isHorizontal(candidate)) {
//             candidate = dy >= 0 ? 'south' : 'north';
//         } else if (isVertical(prev) && isVertical(candidate)) {
//             candidate = dx >= 0 ? 'east' : 'west';
//         }

//         plan.push(candidate);
//     }

//     // Last segment: driven by the to handle (inverted by infer_cardinal_from_handle)
//     plan.push(this.infer_cardinal_from_handle(undefined, to_handle));

//     return plan;
// }

// /**
//  * Convert an interleaved plan [p0, dir0, p1, dir1, ..., pN] into a flat IPoint[]
//  * ready for lineTo() calls. One L-corner is inserted per segment based on exit direction:
//  *   east/west → horizontal leg first  → corner at { x: to.x, y: from.y }
//  *   north/south → vertical leg first  → corner at { x: from.x, y: to.y }
//  * No corner is inserted when from and to are already axis-aligned.
//  */
// private buildPoints(plan: (CardinalDirection | IPoint)[]): IPoint[] {
//     const result: IPoint[] = [];
//     if (plan.length === 0) return result;

//     const isPoint = (x: CardinalDirection | IPoint): x is IPoint => typeof x === 'object';

//     let current = plan[0] as IPoint;
//     result.push(current);
//     let i = 1;

//     while (i < plan.length) {
//         // Collect consecutive directions until the next point
//         const dirs: CardinalDirection[] = [];
//         while (i < plan.length && !isPoint(plan[i]!)) {
//             dirs.push(plan[i] as CardinalDirection);
//             i++;
//         }
//         const target = plan[i] as IPoint;
//         i++;

//         if (dirs.length === 1) {
//             // Straight — no corner needed
//         } else if (dirs.length === 2) {
//             // L-turn: one corner based on exit direction
//             const d1 = dirs[0]!;
//             if (d1 === 'east' || d1 === 'west') {
//                 result.push({ x: target.x, y: current.y }); // horizontal first
//             } else {
//                 result.push({ x: current.x, y: target.y }); // vertical first
//             }
//         }

//         result.push(target);
//         current = target;
//     }

//     return result;
// }

// /**
//  * Build an interleaved plan: [point, ...directions, point, ...directions, ..., point].
//  * Stub IPoints are inserted after points[0] (from handle) and before points[last] (to handle)
//  * so that all segments are natural L-turns — no special 3-dir cases needed.
//  */
// private inferPlan(points: IPoint[], from_handle?: NodeHandle, to_handle?: NodeHandle): (CardinalDirection | IPoint)[] {
//     if (points.length < 2) return [...points];

//     const stub = 24;

//     // Augment: insert a stub waypoint right after the first point (forced exit)
//     const augmented: IPoint[] = [...points];
//     if (from_handle) {
//         const origin = augmented[0]!;
//         const exit_dir = this.infer_cardinal_from_handle(from_handle);
//         const stub_pt: IPoint =
//             exit_dir === 'east' ? { x: origin.x + stub, y: origin.y } :
//                 exit_dir === 'west' ? { x: origin.x - stub, y: origin.y } :
//                     exit_dir === 'north' ? { x: origin.x, y: origin.y - stub } :
//                         { x: origin.x, y: origin.y + stub };
//         augmented.splice(1, 0, stub_pt);
//     }

//     // Augment: insert a stub waypoint right before the last point (forced arrival)
//     if (to_handle) {
//         const dest = augmented[augmented.length - 1]!;
//         const arrive_dir = this.infer_cardinal_from_handle(undefined, to_handle);
//         const stub_pt: IPoint =
//             arrive_dir === 'east' ? { x: dest.x - stub, y: dest.y } :
//                 arrive_dir === 'west' ? { x: dest.x + stub, y: dest.y } :
//                     arrive_dir === 'north' ? { x: dest.x, y: dest.y + stub } :
//                         { x: dest.x, y: dest.y - stub };
//         augmented.splice(augmented.length - 1, 0, stub_pt);
//     }

//     // Route between all augmented points with natural L-turns only.
//     // Track last_dir so we never start a segment with the opposing direction.
//     const opposite: Record<string, CardinalDirection> = { east: 'west', west: 'east', north: 'south', south: 'north' };
//     const plan: (CardinalDirection | IPoint)[] = [augmented[0]!];
//     let last_dir: CardinalDirection | null = null;

//     for (let i = 0; i < augmented.length - 1; i++) {
//         const from = augmented[i]!;
//         const to = augmented[i + 1]!;
//         const dx = to.x - from.x;
//         const dy = to.y - from.y;

//         if (dx === 0) {
//             last_dir = dy > 0 ? 'south' : 'north';
//             plan.push(last_dir, to);
//         } else if (dy === 0) {
//             last_dir = dx > 0 ? 'east' : 'west';
//             plan.push(last_dir, to);
//         } else {
//             const h_dir: CardinalDirection = dx >= 0 ? 'east' : 'west';
//             const v_dir: CardinalDirection = dy >= 0 ? 'south' : 'north';
//             // If the natural first direction opposes last_dir, start with perpendicular
//             const prefer_h = Math.abs(dx) >= Math.abs(dy);
//             const first = prefer_h ? h_dir : v_dir;
//             const second = prefer_h ? v_dir : h_dir;
//             if (last_dir && first === opposite[last_dir]) {
//                 plan.push(second, first, to);
//                 last_dir = first;
//             } else {
//                 plan.push(first, second, to);
//                 last_dir = second;
//             }
//         }
//     }

//     return plan;
// }


// private isValid(points: DirectedPoint[], from_handle?: NodeHandle, to_handle?: NodeHandle): boolean {
//     if (points.length < 2) return false;
//     if (from_handle) {
//         const from_direction = this.infer_cardinal_from_handle(from_handle);
//         if (points[0]!.direction !== from_direction) return false;
//     }
//     if (to_handle) {
//         const to_direction = this.infer_cardinal_from_handle(undefined, to_handle);
//         if (points[points.length - 2]!.direction !== to_direction) return false;
//     }

//     for (let i = 1; i < points.length; i++) {
//         const p1 = points[i - 1]!;
//         const p2 = points[i]!;
//         if (p1.direction === 'east' && p2.direction === 'west') return false;
//         if (p1.direction === 'west' && p2.direction === 'east') return false;
//         if (p1.direction === 'north' && p2.direction === 'south') return false;
//         if (p1.direction === 'south' && p2.direction === 'north') return false;
//     }
//     return true;
// }
