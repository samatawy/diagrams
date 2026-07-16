import type { IConnectionAnchor, IDiagram, INode } from "../../interfaces";
import { isConnectionNode, isDiagramViewLike } from "../../guards";
import type { INodeCached } from "../../view/view.cache";
import { LineAdapter } from "./line.adapter";
import { RenderBasics } from "../render.basics";
import type { HollowMode, SpecificOptions, TextOverflowMode, TextPlacement } from "../../factory/node.adapter";
import { ConnectionBasics } from "../connection.basics";
import { NodeBasics } from "../node.basics";
import { type IPoint, NodeHandle } from "../../types";
import type { DiagramView } from "../../view/diagram.view";
import { arrowAt } from "../../value.utils";

type CardinalDirection = 'east' | 'west' | 'north' | 'south';

type DirectedPoint = IPoint & { direction?: CardinalDirection };

const STUB_SIZE = 16;

/**
 * One2OneAdapter is a node adapter responsible for rendering one-to-one connections in the diagram. 
 * It extends the LineAdapter to leverage basic line rendering capabilities while adding specific logic 
 * for handling one-to-one connection routing and hit testing.
 * Registers with the NodeRegistry under the name 'one_to_one'.
 */
export class OrthogonalAdapterCopy extends LineAdapter {

    public static TYPE = 'orthogonal';

    hollow_mode: HollowMode = 'always';
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
    }

    render(node: INode, context: CanvasRenderingContext2D, show?: 'all' | 'quick'): void {
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

            const fromHandle = node.geometry?.from_handle as NodeHandle;
            const toHandle = node.geometry?.to_handle as NodeHandle;
            const corner_radius = node.geometry?.radius as number ?? 8;

            const pathPoints = this.planBestPath(node, node.points, fromHandle, toHandle);

            const path = new Path2D();
            path.moveTo(pathPoints[0]!.x, pathPoints[0]!.y);

            for (let i = 1; i < pathPoints.length; i++) {
                const prev = pathPoints[i - 1]!;
                const pt = pathPoints[i]!;
                const next = pathPoints[i + 1];

                if (!next) {
                    path.lineTo(pt.x, pt.y);
                    continue;
                }

                const radius = this.drawArcRadius(pt, prev, next, corner_radius);
                if (radius > 0) {
                    path.arcTo(pt.x, pt.y, next.x, next.y, radius);
                } else {
                    path.lineTo(pt.x, pt.y);
                }
            }

            context.stroke(path);

            if (isConnectionNode(node)) {
                // RenderBasics.renderArrows(node, context);
                if (pathPoints.length < 2) return;

                const direction = arrowAt(node);

                if (direction === 'start' || direction === 'both') {
                    RenderBasics.renderArrowTyped(node, pathPoints[1]!, pathPoints[0]!, context);
                }

                if (direction === 'end' || direction === 'both') {
                    RenderBasics.renderArrowTyped(node, pathPoints[pathPoints.length - 2]!, pathPoints[pathPoints.length - 1]!, context);
                }

            }

            if (node.text && show !== 'quick') {
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

    private drawArcRadius(pt: IPoint, prev: IPoint, next: IPoint, corner_radius: number): number {
        // if (!prev || !next) return 0;

        const inDx = pt.x - prev.x;
        const inDy = pt.y - prev.y;
        const outDx = next.x - pt.x;
        const outDy = next.y - pt.y;

        const inLen = Math.hypot(inDx, inDy);
        const outLen = Math.hypot(outDx, outDy);

        if (inLen < 1 || outLen < 1) return 0;

        // cosine of the angle between the two direction vectors
        const dot = (inDx * outDx + inDy * outDy) / (inLen * outLen);

        // Near-hairpin (dot < -cos30° ≈ -0.866): tan(α/2) → ∞ → arc blows up
        if (dot < -0.85) return 0;

        // Near-collinear same direction: no visible turn, skip rounding
        if (dot > 0.999) return 0;

        const alpha = Math.acos(Math.max(-1, Math.min(1, dot)));
        const tanHalf = Math.tan(alpha / 2);
        const maxR = (tanHalf > 1e-4)
            ? Math.min(inLen, outLen) / (2 * tanHalf)
            : Math.min(inLen, outLen) / 2;

        const radius = Math.min(corner_radius, maxR);
        if (radius < 0.5) return 0;

        return radius;
    }

    private planBestPath(node: INode, points: IPoint[], from_handle?: NodeHandle, to_handle?: NodeHandle): IPoint[] {

        const source: DirectedPoint[] = this.cloneDirected(points, from_handle, to_handle);

        let from_stub: DirectedPoint | undefined;
        let from_direction: CardinalDirection | undefined;
        if (from_handle) {
            from_direction = this.infer_cardinal_from_handle(from_handle);
            from_stub = this.makeRelativePoint(source[0]!, from_direction, STUB_SIZE);
            source.splice(1, 0, from_stub);
        }

        let to_stub: DirectedPoint | undefined;
        let to_direction: CardinalDirection | undefined;
        if (to_handle) {
            to_direction = this.infer_cardinal_from_handle(to_handle);
            to_stub = this.makeRelativePoint(source[source.length - 1]!, to_direction, STUB_SIZE);
            source.splice(source.length - 1, 0, to_stub);
        }

        if (source.length < 2) return source;

        if (from_stub && from_direction && to_stub && to_direction) {
            let midway = this.midwayPoint(from_stub, to_stub);
            if (midway) {
                // Try to find an uncovered midway point that doesn't intersect with any nodes in the diagram

                source.splice(2, 0, midway);

                let options = this.infer_cardinal_options(from_stub, midway);
                if (!options[from_direction]) {
                    from_direction = Object.keys(options).find(from => from !== this.invert_cardinal(from_direction!)) as CardinalDirection;
                }

                const first_waypoint = this.wayPoint(from_stub, midway, from_direction);
                if (first_waypoint) {
                    source.splice(2, 0, first_waypoint);
                }

                options = this.infer_cardinal_options(to_stub, midway);
                if (!options[to_direction!]) {
                    to_direction = Object.keys(options).find(to => to !== this.invert_cardinal(to_direction!)) as CardinalDirection;
                }

                const second_waypoint = this.wayPoint(to_stub, midway, to_direction!);
                if (second_waypoint) {
                    source.splice(source.length - 2, 0, second_waypoint);
                }
            }
        }
        return source;
    }

    private midwayPoint(from: DirectedPoint, to: DirectedPoint): DirectedPoint | undefined {
        let mdx = (to.x - from.x);
        if (mdx === 0) return undefined;
        let mdy = (to.y - from.y);
        if (mdy === 0) return undefined;

        let midway = {
            x: from.x + mdx / 2,
            y: from.y + mdy / 2,
            direction: this.infer_cardinal_from_points(from, to)
        }

        /* Reduce sloped lines if possible */
        if (['north', 'south'].includes(from.direction!) && Math.abs(mdy / 1) < STUB_SIZE) {
            midway.y = to.y;
        }
        if (['east', 'west'].includes(from.direction!) && Math.abs(mdx / 1) < STUB_SIZE) {
            midway.x = to.x;
        }

        /* Convert unnecessary multiple elbows to one */
        if (['north', 'south'].includes(from.direction!) && from.direction === to.direction) {
            midway.y = to.y;
        }
        if (['east', 'west'].includes(from.direction!) && from.direction === to.direction) {
            midway.x = to.x;
        }

        /* Best midpoint positioning cases */
        if (['north', 'south'].includes(from.direction!)) {
            if (to.direction === 'east' && midway.x < to.x) {
                midway.x = to.x;
            } else if (to.direction === 'west' && midway.x > to.x) {
                midway.x = to.x;
            } else if (['east', 'west'].includes(to.direction!)) {
                midway.y = to.y;
            }
        }
        if (['east', 'west'].includes(from.direction!)) {
            if (to.direction === 'south' && midway.y < to.y) {
                midway.y = to.y;
            } else if (to.direction === 'north' && midway.y > to.y) {
                midway.y = to.y;
            } else if (['north', 'south'].includes(to.direction!)) {
                midway.x = to.x;
            }
        }
        return midway;
    }

    private wayPoint(from: DirectedPoint, to: DirectedPoint, from_direction: CardinalDirection): DirectedPoint | undefined {
        let mdx = (to.x - from.x);
        if (mdx === 0) return undefined;
        let mdy = (to.y - from.y);
        if (mdy === 0) return undefined;

        switch (from_direction) {
            case 'south':
                (mdy > 0) ? mdy = Math.max(STUB_SIZE, mdy) : mdy = STUB_SIZE;
                return { x: from.x, y: from.y + mdy, direction: 'south' };
            case 'north':
                (mdy < 0) ? mdy = Math.min(-STUB_SIZE, mdy) : mdy = -STUB_SIZE;
                return { x: from.x, y: from.y + mdy, direction: 'north' };
            case 'east':
                (mdx > 0) ? mdx = Math.max(STUB_SIZE, mdx) : mdx = STUB_SIZE;
                return { x: from.x + mdx, y: from.y, direction: 'east' };
            case 'west':
                (mdx < 0) ? mdx = Math.min(-STUB_SIZE, mdx) : mdx = -STUB_SIZE;
                return { x: from.x + mdx, y: from.y, direction: 'west' };
        }
    }

    private infer_cardinal_options(from: IPoint, to: IPoint): { [key in CardinalDirection]?: CardinalDirection } {
        const options: { [key in CardinalDirection]?: CardinalDirection } = {};

        if (!from || !to) return {};

        const dx = to.x - from.x;
        const dy = to.y - from.y;

        if (dx === 0 && dy === 0) return {};
        if (Math.abs(dx) > Math.abs(dy)) {
            if (dx > 0) {
                /* The point is due east, so either start by east or flip directions */
                options.east = dy < 0 ? 'north' : 'south';
                options[options.east] = 'east';
            }
            if (dx < 0) {
                /* The point is due west, so either start by west or flip directions */
                options.west = dy < 0 ? 'north' : 'south';
                options[options.west] = 'west';
            }
        } else {
            if (dy > 0) {
                /* The point is due south, so either start by south or flip directions */
                options.south = dx < 0 ? 'west' : 'east';
                options[options.south] = 'south';
            }
            if (dy < 0) {
                /* The point is due north, so either start by north or flip directions */
                options.north = dx < 0 ? 'west' : 'east';
                options[options.north] = 'north';
            }
        }

        return options;
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

    // private infer_cardinal_to_handle(toHandle?: NodeHandle): CardinalDirection {
    //     switch (toHandle) {
    //         case NodeHandle.E: return 'west';
    //         case NodeHandle.W: return 'east';
    //         case NodeHandle.N: return 'south';
    //         case NodeHandle.S: return 'north';
    //     }
    //     return 'east';
    // }

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

    // Helpers for conflict avoidance

    // private isErdRelationType(type: string): boolean {
    //     return type === "erd_one_to_one" || type === "erd_one_to_many" || type === "erd_many_to_many";
    // }

    // private anchorNodeId(anchor?: IConnectionAnchor): string | undefined {
    //     if (!anchor?.node) return undefined;
    //     return typeof anchor.node === "string" ? anchor.node : anchor.node.id;
    // }

    // /**
    //  * Siblings = ERD relations sharing same source node + source handle.
    //  * This fans out bundles that otherwise overlap near the source.
    //  */
    // private siblingBundle(node: INode, fromHandle?: NodeHandle): INode[] {
    //     if (!fromHandle) return [node];

    //     const diagram = node.owner;
    //     const self = node as INode & { from?: IConnectionAnchor };

    //     const fromNodeId = this.anchorNodeId(self.from);
    //     if (!fromNodeId) return [node];

    //     const all = diagram.nodes.filter(n => this.isErdRelationType(n.type));
    //     const siblings = all.filter(n => {
    //         const c = n as INode & { from?: IConnectionAnchor };
    //         return this.anchorNodeId(c.from) === fromNodeId && c.from?.handle === fromHandle;
    //     });

    //     // Stable order => no routing jitter between renders
    //     siblings.sort((a, b) => a.id.localeCompare(b.id));
    //     return siblings;
    // }

    // /**
    //  * Centered lane index sequence:
    //  * 1 -> [0]
    //  * 2 -> [-0.5, +0.5]
    //  * 3 -> [-1, 0, +1]
    //  * 4 -> [-1.5, -0.5, +0.5, +1.5]
    //  */
    // private laneIndex(node: INode, siblings: INode[]): number {
    //     const idx = Math.max(0, siblings.findIndex(s => s.id === node.id));
    //     const center = (siblings.length - 1) / 2;
    //     return idx - center;
    // }

    // private offsetPerpendicular(base: IPoint, from: IPoint, to: IPoint, amount: number): IPoint {
    //     const dx = to.x - from.x;
    //     const dy = to.y - from.y;
    //     const len = Math.hypot(dx, dy) || 1;

    //     // unit normal
    //     const nx = -dy / len;
    //     const ny = dx / len;

    //     return { x: base.x + nx * amount, y: base.y + ny * amount };
    // }

    /**
     * Tiny local conflict nudge: try nearby lanes if midpoint sits inside a node.
     * Uses DiagramView internals defensively (same pattern you already commented).
     */
    // private nudgeAwayFromNodeHit(node: INode, midpoint: IPoint, from: IPoint, to: IPoint, lane: number): IPoint {
    //     const diagram = node.owner;
    //     if (!isDiagramViewLike(diagram)) return midpoint;
    //     const coordinates = diagram.getCoordinates();

    //     const insideAnyNode = (pt: IPoint): boolean => {
    //         for (const n of diagram.nodes) {
    //             if (n === node) continue;
    //             // if (this.isErdRelationType(n.type)) continue;
    //             const rect = coordinates.getBoundingRect(n);
    //             if (pt.x >= rect.left && pt.x <= rect.left + rect.width &&
    //                 pt.y >= rect.top && pt.y <= rect.top + rect.height) {
    //                 return true;
    //             }
    //         }
    //         return false;
    //     };

    //     if (!insideAnyNode(midpoint)) return midpoint;

    //     for (let k = 1; k <= MAX_LANE_TRIES; k++) {
    //         const plus = this.offsetPerpendicular(midpoint, from, to, k * LANE_SPACING);
    //         if (!insideAnyNode(plus)) return plus;

    //         const minus = this.offsetPerpendicular(midpoint, from, to, -k * LANE_SPACING);
    //         if (!insideAnyNode(minus)) return minus;
    //     }
    //     return midpoint;
    // }

    // private nudgeAwayFromRelationConflict(
    //     node: INode,
    //     midpoint: DirectedPoint,
    //     from: IPoint,
    //     to: IPoint
    // ): DirectedPoint {
    //     if (!isDiagramViewLike(node.owner)) return midpoint;

    //     const diagram = node.owner;
    //     const others = diagram.nodes.filter(n =>
    //         this.isErdRelationType(n.type) && n.id !== node.id
    //     );

    //     const direction = midpoint.direction ?? this.infer_cardinal_from_points(from, to);
    //     const isHorizontal = direction === 'east' || direction === 'west';
    //     const TOLERANCE = LANE_SPACING / 2;

    //     let result = { ...midpoint };

    //     for (const other of others) {
    //         const p0 = other.points[0];
    //         const p1 = other.points[other.points.length - 1];
    //         if (!p0 || !p1) continue;

    //         // Approximate the other relation's spine coordinate from its raw endpoint midpoint.
    //         // Exact path computation would be recursive; this is a close enough proxy.
    //         const otherSpine = isHorizontal
    //             ? (p0.y + p1.y) / 2
    //             : (p0.x + p1.x) / 2;

    //         const ourSpine = isHorizontal ? result.y : result.x;
    //         const diff = ourSpine - otherSpine;

    //         if (Math.abs(diff) < TOLERANCE) {
    //             // Push away from the conflict: if we're above/left stay above/left,
    //             // if we're below/right stay below/right; if exactly equal go positive.
    //             const push = diff >= 0 ? TOLERANCE - diff + 1 : -(TOLERANCE + diff + 1);
    //             if (isHorizontal) {
    //                 result = { ...result, y: result.y + push };
    //             } else {
    //                 result = { ...result, x: result.x + push };
    //             }
    //         }
    //     }

    //     return result;
    // }

    // private samePoint(p1: IPoint, p2: IPoint): boolean {
    //     return Math.abs(p1.x - p2.x) < 1 && Math.abs(p1.y - p2.y) < 1;
    // }

    // private attemptUncovered(diagram: DiagramView, point: IPoint, fixes?: IPoint[]): IPoint {
    //     const hit = (diagram as any).hitNode(point);
    //     if (hit) {
    //         const options = [];
    //         for (const fix of fixes || []) {
    //             options.push({ x: point.x, y: fix.y });
    //             options.push({ x: fix.x, y: point.y });
    //         }
    //         for (const one of options) {
    //             if (!(diagram as any).hitNode(one)) {
    //                 return one;
    //             }
    //         }
    //     }
    //     return point;
    // }

    private inferPoints(node: INode, from_handle?: NodeHandle, to_handle?: NodeHandle): IPoint[] {
        const plan = this.planBestPath(node, node.points, from_handle, to_handle);
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

    public geometryOptions(node: INode, path: string): SpecificOptions | undefined {
        if (path === 'geometry.radius' || path === 'radius') {
            return {
                label: 'Radius',
                datatype: 'number',
            }
        }
        return undefined;
    }
}
