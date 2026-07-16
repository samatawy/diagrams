import type { IConnection, IConnectionAnchor, IHandlePoint, INode } from "../interfaces";
import { NodeHandle, type IPoint, type IRect } from "../types";
import { isConnection, isDiagramViewLike } from "../guards";
import type { CoordinateSystem } from "../view/coordinate.system";
import { NodeRegistry } from "../factory/node.registry";
import { NodeBasics } from "./node.basics";
import { DiagramConstants } from "../model/diagram.constants";
import { SelectionBasics } from "./selection.basics";
import { absoluteToRelative, arrowAt, relativeToAbsolute } from "../value.utils";

type InteractiveDiagram = INode['owner'] & {
    getCoordinates(): CoordinateSystem;
    hitNodes(x: number, y: number): INode[];
    hitHandle(x: number, y: number, target?: INode): NodeHandle;
    // hitConnectionHandle(x: number, y: number, target?: INode): NodeHandle;
    hitConnectionHandle(x: number, y: number, target?: INode): IHandlePoint;
};

/**
 * Provides basic utilities for handling connections between nodes in a diagram. 
 * This includes logic for reconnecting and disconnecting endpoints of connections, inserting and removing intermediate points on connections, 
 * synchronizing connection endpoints with their attached nodes, and rendering arrowheads on connections. 
 * The methods in this class are designed to work with the diagram's coordinate system and node structure to ensure accurate manipulation of connections within the diagram editor.
 */
export class ConnectionBasics {

    /**
     * Determines if a node supports mutable points, which allows for dynamic modification of its points.
     * @param node The node to check.
     * @returns True if the node supports mutable points, false otherwise.
     */
    public static supportsMutablePoints(node: INode): boolean {
        return NodeRegistry.isMultistepCreate(node.type);
    }

    /**
     * Reconnects a connection node to a new target based on the specified event coordinates.
     * @param node The connection node to reconnect.
     * @param x The x-coordinate of the new target.
     * @param y The y-coordinate of the new target.
     */
    public static reconnect(node: INode & IConnection, x: number, y: number): void {
        const diagram = this.getInteractiveDiagram(node);
        if (!diagram) return;

        const hit = diagram.getCoordinates().getPoint(x, y, 'ignore_grid');
        const adapter = NodeRegistry.adapter(node.type);
        const threshold = DiagramConstants.HANDLE_HIT_EPSILON;

        if (node.points.length > 0) {
            const point = node.points[0]!;
            if (Math.abs(hit.x - point.x) <= threshold && Math.abs(hit.y - point.y) <= threshold) {
                const target = this.preferredTargetAtPointer(diagram, x, y, node.id);
                let fromAnchor = this.getPointerConnectionAnchor(node, x, y);
                if (fromAnchor) {
                    if (!NodeRegistry.canConnectTo(node, NodeHandle.MOVE, 'from', target)) {
                        fromAnchor = undefined;
                    }
                }

                if (!fromAnchor || fromAnchor?.handle === NodeHandle.MOVE) {
                    // const target = diagram.hitNodes(x, y).find(n => n.id !== node.id);
                    fromAnchor = this.getNearestSupportedAnchor(target!, 'from', node, hit);
                }
                const toAnchor = node.to;

                if (fromAnchor && !this.isSameAnchor(fromAnchor, toAnchor)) {
                    node.from = fromAnchor;
                    adapter?.afterConnect?.(node, 'from', fromAnchor ?? null);

                } else {
                    node.from = undefined;
                }
            }
        }

        if (node.points.length > 1) {
            const point = node.points[node.points.length - 1]!;
            if (Math.abs(hit.x - point.x) <= threshold && Math.abs(hit.y - point.y) <= threshold) {
                // const target = diagram.hitNodes(x, y).find(n => n.id !== node.id);
                const target = this.preferredTargetAtPointer(diagram, x, y, node.id);

                const fromAnchor = node.from;
                let toAnchor = this.getPointerConnectionAnchor(node, x, y);
                if (toAnchor) {
                    if (!NodeRegistry.canConnectTo(node, NodeHandle.MOVE, 'to', target)) {
                        toAnchor = undefined;
                    }
                }

                if (!toAnchor || toAnchor?.handle === NodeHandle.MOVE) {
                    // const target = diagram.hitNodes(x, y).find(n => n.id !== node.id);
                    const target = this.preferredTargetAtPointer(diagram, x, y, node.id);
                    toAnchor = this.getNearestSupportedAnchor(target!, 'to', node, hit);
                }

                if (toAnchor && (!this.isSameAnchor(toAnchor, fromAnchor))) {
                    node.to = toAnchor;
                    adapter?.afterConnect?.(node, 'to', toAnchor ?? null);
                } else {
                    node.to = undefined;
                }
            }
        }

        // if (node.points.length > 0) {
        //     const point = node.points[0]!;
        //     if (Math.abs(hit.x - point.x) <= threshold && Math.abs(hit.y - point.y) <= threshold) {
        //         let fromAnchor = this.getPointerConnectionAnchor(node, x, y);
        //         if (!fromAnchor || fromAnchor?.handle === NodeHandle.MOVE) {
        //             const target = diagram.hitNodes(x, y).find(n => n.id !== node.id);
        //             fromAnchor = this.getNearestSupportedAnchor(target!, hit);
        //         }
        //         const toAnchor = node.to;

        //         if (fromAnchor && !this.isSameAnchor(fromAnchor, toAnchor)) {
        //             node.from = fromAnchor;
        //             adapter?.afterConnect?.(node, 'from', fromAnchor ?? null);

        //         } else {
        //             node.from = undefined;
        //         }
        //     }
        // }

        // if (node.points.length > 1) {
        //     const point = node.points[node.points.length - 1]!;
        //     if (Math.abs(hit.x - point.x) <= threshold && Math.abs(hit.y - point.y) <= threshold) {
        //         const fromAnchor = node.from;
        //         let toAnchor = this.getPointerConnectionAnchor(node, x, y);
        //         if (!toAnchor || toAnchor?.handle === NodeHandle.MOVE) {
        //             const target = diagram.hitNodes(x, y).find(n => n.id !== node.id);
        //             toAnchor = this.getNearestSupportedAnchor(target!, hit);
        //         }

        //         if (toAnchor && (!this.isSameAnchor(toAnchor, fromAnchor))) {
        //             node.to = toAnchor;
        //             adapter?.afterConnect?.(node, 'to', toAnchor ?? null);
        //         } else {
        //             node.to = undefined;
        //         }
        //     }
        // }
    }

    /**
     * Checks if two connection anchors are effectively the same by comparing their node, handle, and point properties.
     * @param anchorA The first anchor to compare.
     * @param anchorB The second anchor to compare.
     * @returns True if the anchors are effectively the same, false otherwise.
     */
    private static isSameAnchor(anchorA: IConnectionAnchor | undefined, anchorB: IConnectionAnchor | undefined): boolean {
        if (anchorA && !anchorB) return false;
        if (!anchorA && anchorB) return false;
        if (anchorA?.node !== anchorB?.node) return false;
        if (anchorA?.handle !== anchorB?.handle) return false;
        if (anchorA?.index !== anchorB?.index) return false;
        return true;
    }

    private static preferredTargetAtPointer(diagram: InteractiveDiagram, x: number, y: number, excludeId: string): INode | undefined {
        const hits = diagram.hitNodes(x, y).filter(n => n.id !== excludeId);
        const nonConnections = hits.filter(n => !isConnection(n));
        return nonConnections[0] ?? hits[0];
    }

    /**
     * Disconnects a connection node from its target based on the specified coordinates.
     * @param node The connection node to disconnect.
     * @param x The x-coordinate of the target to disconnect from.
     * @param y The y-coordinate of the target to disconnect from.
     */
    public static disconnect(node: INode & IConnection, x: number, y: number): void {
        if (!node.from && !node.to) return;

        const anchor = this.getPointerConnectionAnchor(node, x, y);
        const target = anchor ? this.resolveAnchorNode(node, anchor) : undefined;
        if (!target) return;

        const fromTarget = node.from ? this.resolveAnchorNode(node, node.from) : undefined;
        if (fromTarget?.id === target.id) {
            node.from = undefined;
        }

        const toTarget = node.to ? this.resolveAnchorNode(node, node.to) : undefined;
        if (toTarget?.id === target.id) {
            node.to = undefined;
        }
    }

    public static guessConnectionDirection(node: INode & IConnection, x: number, y: number): 'from' | 'to' | 'any' {
        const arrow = arrowAt(node);
        const forward = arrow === 'end';
        const backward = arrow === 'start';

        if (node.points.length < 2) return (forward) ? 'from' : (backward) ? 'to' : 'any';

        if (Math.abs(node.points[0]!.x - x) <= DiagramConstants.HANDLE_HIT_EPSILON
            && Math.abs(node.points[0]!.y - y) <= DiagramConstants.HANDLE_HIT_EPSILON) {
            return (forward) ? 'from' : (backward) ? 'to' : 'any';
        }

        if (Math.abs(node.points[node.points.length - 1]!.x - x) <= DiagramConstants.HANDLE_HIT_EPSILON
            && Math.abs(node.points[node.points.length - 1]!.y - y) <= DiagramConstants.HANDLE_HIT_EPSILON) {
            return (backward) ? 'to' : (forward) ? 'from' : 'any';
        }
        return 'any';
    }

    /**
     * Inserts a new point into a connection node at the specified coordinates.
     * @param node The connection node to modify.
     * @param x The x-coordinate of the new point.
     * @param y The y-coordinate of the new point.
     */
    public static insertPoint(node: INode, x: number, y: number): void {
        if (!this.supportsMutablePoints(node)) return;
        const diagram = node.owner;
        if (!isDiagramViewLike(diagram)) return;

        const hit = diagram.getCoordinates().getPoint(x, y, 'ignore_grid');
        const pts = node.points;
        if (pts.length < 2) return;

        // Find the segment whose projected foot is closest to the hit point.
        let bestIndex = -1;
        let bestDist = Infinity;

        for (let i = 0; i < pts.length - 1; i++) {
            const a = pts[i]!;
            const b = pts[i + 1]!;
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const lenSq = dx * dx + dy * dy;
            if (lenSq === 0) continue;
            const t = Math.max(0, Math.min(1, ((hit.x - a.x) * dx + (hit.y - a.y) * dy) / lenSq));
            const fx = a.x + t * dx;
            const fy = a.y + t * dy;
            const d = Math.hypot(hit.x - fx, hit.y - fy);
            if (d < bestDist) {
                bestDist = d;
                bestIndex = i + 1; // insert after point i
            }
        }

        if (bestIndex >= 0) {
            node.points.splice(bestIndex, 0, { x: hit.x, y: hit.y });
        }
    }

    /**
     * Removes a point from a connection node at the specified coordinates.
     * @param node The connection node to modify.
     * @param x The x-coordinate of the point to remove.
     * @param y The y-coordinate of the point to remove.
     */
    public static removePoint(node: INode, x: number, y: number): void {
        if (!this.supportsMutablePoints(node)) return;
        const diagram = node.owner;
        if (!isDiagramViewLike(diagram)) return;

        const hit = diagram.getCoordinates().getPoint(x, y, 'ignore_grid');
        const pts = node.points;
        // Never remove the first or last point (they are the endpoints).
        for (let i = 1; i < pts.length - 1; i++) {
            const point = pts[i]!;
            if (Math.abs(point.x - hit.x) <= 8 && Math.abs(point.y - hit.y) <= 8) {
                pts.splice(i, 1);
                return;
            }
        }
    }

    /**
     * Synchronizes the endpoints of a connection node with its anchors.
     * @param node The connection node to synchronize.
     */
    public static syncEndpoints(node: INode & IConnection): void {
        if (node.points.length === 0) return;

        if (node.from) {
            const from = this.getAnchorPoint(node, node.from);
            if (from) {
                node.points[0] = from;
            }
        }

        if (node.to && node.points.length > 1) {
            const to = this.getAnchorPoint(node, node.to);
            if (to) {
                node.points[node.points.length - 1] = to;
            }
        }
    }

    /**
     * Gets the anchor point for a connection node.
     * @param node The connection node.
     * @param anchor The connection anchor.
     * @returns The anchor point or undefined if not found.
     */
    public static getAnchorPoint(node: INode, anchor: IConnectionAnchor): IPoint | undefined {
        const target = this.resolveAnchorNode(node, anchor);
        if (!target) return undefined;

        const diagram = node.owner;
        if (!isDiagramViewLike(diagram)) return undefined;

        const coordinates = diagram.getCoordinates();
        // Anchor resolution is computed in node-local (unrotated) space,
        // then rotated once at the end when needed.
        const rect = coordinates.getBoundingRect(target, false);

        let point: IPoint | undefined;
        if (anchor.handle === NodeHandle.POINT && typeof anchor.index === 'number' && anchor.index >= 0) {
            point = target.points[anchor.index];
        } else if (anchor.handle === NodeHandle.MOVE) {
            point = {
                x: rect.left + ((anchor.relative.x ?? 0.5) * rect.width),
                y: rect.top + ((anchor.relative.y ?? 0.5) * rect.height),
            };
            // point = {
            //     x: rect.left + ((anchor.xOffset ?? 0.5) * rect.width),
            //     y: rect.top + ((anchor.yOffset ?? 0.5) * rect.height),
            // };
        } else {
            point = relativeToAbsolute(anchor.relative, rect);  // ?? this.handlePoint(rect, anchor.handle);
        }

        if (!point) return undefined;
        if (!target.angle) {
            return { x: point.x, y: point.y };
        }

        const cache = diagram.getCache();
        const cached = cache.getNode(target);
        const cos = cached?.cos || Math.cos(target.angle);
        const sin = cached?.sin || Math.sin(target.angle);
        return coordinates.getRenderPoint({ x: point.x, y: point.y }, rect, target.angle, cos, sin);
    }

    /**
     * Reassigns one endpoint anchor to the nearest handle supported by its current target node.
     *
     * Assumption: the endpoint already targets the intended node. This method does not perform hit testing.
     * @param node The connection node containing the endpoint anchor.
     * @param endpoint Which endpoint to normalize ('from' or 'to').
     * @param tolerance Maximum distance used while selecting the nearest supported handle.
     * @returns The updated anchor if one could be resolved, otherwise undefined.
     */
    public static reconnectToBestHandle(node: INode & IConnection, endpoint: 'from' | 'to', tolerance: number = 24): IConnectionAnchor | undefined {
        const anchor = endpoint === 'from' ? node.from : node.to;
        if (!anchor) {
            return undefined;
        }

        const target = this.resolveAnchorNode(node, anchor);
        if (!target) {
            return undefined;
        }

        // Use the OTHER end of the connection as the reference point so we pick
        // the handle on the target that faces the far endpoint, not the old handle position.
        const otherAnchor = endpoint === 'from' ? node.to : node.from;
        const referencePoint = (otherAnchor ? this.getAnchorPoint(node, otherAnchor) : undefined)
            ?? this.getConnectionEndpoint(node, endpoint === 'from' ? 'to' : 'from');

        if (!referencePoint) {
            return undefined;
        }

        const next = this.getNearestSupportedAnchor(target, endpoint, node, referencePoint, tolerance);
        if (!next) {
            return undefined;
        }

        if (endpoint === 'from') {
            node.from = next;
        } else {
            node.to = next;
        }

        return next;
    }

    /**
     * Selects the nearest connection-enabled anchor handle on a target node.
     * This method does not perform hit testing; it simply finds the nearest handle to a reference point that is valid for connection purposes.
     * @param target Target node.
     * @param nearPoint Reference point used for nearest-handle lookup.
     * @param tolerance Maximum distance used while selecting a handle.
     * @returns A normalized anchor for the target, or undefined when no supported handle is found.
     */
    private static getNearestSupportedAnchor(target: INode, direction: 'from' | 'to', origin: INode, nearPoint: IPoint, tolerance: number = 24): IConnectionAnchor | undefined {
        const diagram = target?.owner;
        if (!isDiagramViewLike(diagram)) {
            return undefined;
        }

        const coordinates = diagram.getCoordinates();
        const rect = coordinates.getBoundingRect(target, false);
        const nearest = NodeBasics.nearestConnectionHandle(target, direction, origin, nearPoint, true, tolerance);
        if (!nearest || nearest.handle === NodeHandle.NONE) {
            return undefined;
        }

        const next: IConnectionAnchor = {
            node: target,
            handle: nearest.handle,
            relative: absoluteToRelative(nearest.point, rect),
        };

        const localPoint = coordinates.getHitPoint({ x: nearest.point.x, y: nearest.point.y }, rect, target.angle || 0);
        if (nearest.handle === NodeHandle.POINT) {
            next.index = this.getPointIndex(target, localPoint.x, localPoint.y);
        }

        // if (nearest.handle === NodeHandle.MOVE) {
        //     next.offset = {
        //         x: rect.width ? (localPoint.x - rect.left) / rect.width : 0.5,
        //         y: rect.height ? (localPoint.y - rect.top) / rect.height : 0.5,
        //     };
        //     // next.xOffset = rect.width ? (localPoint.x - rect.left) / rect.width : 0.5;
        //     // next.yOffset = rect.height ? (localPoint.y - rect.top) / rect.height : 0.5;
        // }

        return next;
    }

    /**
     * Gets one endpoint point from a connection polyline.
     * @param node Connection node.
     * @param endpoint Endpoint selector; either 'from' or 'to'.
     * @returns The selected endpoint point, or undefined when no points exist.
     */
    private static getConnectionEndpoint(node: INode & IConnection, endpoint: 'from' | 'to'): IPoint | undefined {
        if (!node.points.length) {
            return undefined;
        }

        if (endpoint === 'from') {
            return node.points[0];
        }

        return node.points[node.points.length - 1];
    }

    /**
     * Resolves an anchor node reference to an in-memory node instance.
     * @param node Connection owner node.
     * @param anchor Anchor whose node may be an id string.
     * @returns Resolved node instance, or undefined when resolution fails.
     */
    private static resolveAnchorNode(node: INode, anchor: IConnectionAnchor): INode | undefined {
        if (typeof anchor.node !== 'string') {
            return anchor.node;
        }

        const target = node.owner.node(anchor.node);
        if (target) {
            anchor.node = target;
        }
        return target;
    }

    /**
     * Validates and returns a diagram owner with interactive hit-test APIs.
     * This exposes protected methods that are not part of the public diagram interface, but are required for connection handling.
     * @param node Node whose owner should provide interaction methods.
     * @returns A narrowed interactive diagram instance, or undefined when unavailable.
     */
    private static getInteractiveDiagram(node: INode): InteractiveDiagram | undefined {
        const diagram = node.owner;
        if (!isDiagramViewLike(diagram)) return undefined;
        if (typeof (diagram as any).hitNodes !== 'function' ||
            typeof (diagram as any).hitHandle !== 'function' ||
            typeof (diagram as any).hitConnectionHandle !== 'function') {
            return undefined;
        }

        return diagram as unknown as InteractiveDiagram;
    }

    /**
     * Builds a connectable anchor from an already-hit handle and local (unrotated) point.
     * This is a pure normalization step and does not perform hit testing.
     * @param source Node that was hit.
     * @param handle Handle that was hit.
     * @param localPoint Local (unrotated) point that was hit.
     * @param rect Bounding rectangle of the source node.
     * @returns A normalized connection anchor, or undefined when the handle is not connectable.
     */
    public static buildConnectableAnchor(source: INode, handle: NodeHandle, localPoint: IPoint, rect: IRect): IConnectionAnchor | undefined {
        if (handle === NodeHandle.NONE || handle === NodeHandle.ROTATE) {
            return undefined;
        }

        const anchor: IConnectionAnchor = {
            node: source,
            handle,
            relative: absoluteToRelative(localPoint, rect),
        };

        if (handle === NodeHandle.POINT) {
            const pointIndex = this.getPointIndex(source, localPoint.x, localPoint.y);
            if (pointIndex < 1 || pointIndex >= source.points.length - 1) {
                // Don't allow connecting to the first or last point of a connection.
                return undefined;
            }
            anchor.index = pointIndex;
            return anchor;
        }

        // if (handle === NodeHandle.MOVE) {
        //     anchor.xOffset = rect.width ? (localPoint.x - rect.left) / rect.width : 0.5;
        //     anchor.yOffset = rect.height ? (localPoint.y - rect.top) / rect.height : 0.5;
        //     return anchor;
        // }

        return anchor;
    }

    /**
     * Resolves the connectable anchor, if any, at the current pointer location.
     * @param node Connection being re-targeted.
     * @param x Pointer x coordinate in canvas space.
     * @param y Pointer y coordinate in canvas space.
     * @returns The best non-MOVE anchor at the pointer, or MOVE fallback when only body hit is available.
     */
    public static getPointerConnectionAnchor(node: INode & IConnection, x: number, y: number): IConnectionAnchor | undefined {
        const diagram = this.getInteractiveDiagram(node);
        if (!diagram) return undefined;

        const coordinates = diagram.getCoordinates();
        let atPoint = diagram.hitNodes(x, y);
        const nonConnections = atPoint.filter(n => !isConnection(n));
        if (nonConnections.length > 0) {
            atPoint = nonConnections;
        }
        if (!atPoint.length) return undefined;

        let moveFallback: IConnectionAnchor | undefined;

        for (const source of atPoint) {
            if (source.id === node.id) continue;

            const handlePoint = diagram.hitConnectionHandle(x, y, source);
            if (handlePoint.handle === NodeHandle.ROTATE) continue;
            // const handle = diagram.hitConnectionHandle(x, y, source);
            // if (handle === NodeHandle.ROTATE) continue;

            // Anchor capture must use node-local coordinates so rotation does not skew
            // point indices and normalized MOVE offsets.
            const rect = coordinates.getBoundingRect(source, false);
            // const point = coordinates.getHitPoint({ x, y }, rect, source.angle || 0);
            // const anchor = this.buildConnectableAnchor(source, handle, point, rect);

            const anchor = this.buildConnectableAnchor(source, handlePoint.handle, handlePoint.point, rect);

            if (!anchor) {
                continue;
            }

            if (anchor.handle === NodeHandle.MOVE) {
                moveFallback = moveFallback || anchor;
                continue;
            }

            return anchor;
        }

        return moveFallback;
    }

    /**
     * Finds a point index matching local coordinates on a node.
     * @param node Target node.
     * @param x Local x coordinate.
     * @param y Local y coordinate.
     * @returns Matching point index, or -1 when no point is within hit epsilon.
     */
    private static getPointIndex(node: INode, x: number, y: number): number {
        for (let i = 0; i < node.points.length; i++) {
            const point = node.points[i]!;
            if (Math.abs(x - point.x) <= 4 && Math.abs(y - point.y) <= 4) {
                return i;
            }
        }

        return -1;
    }

    public static resolveConnectionPoint(node: INode, given: IHandlePoint): IHandlePoint {
        const adapter = NodeRegistry.adapter(node.type);
        if (!adapter) {
            return given;
        }

        const anchors = adapter.getAnchors(node, 'connection_handles', 'any');
        const epsilon = DiagramConstants.HANDLE_HIT_EPSILON;
        for (const anchor of anchors) {
            if (anchor.handle !== given.handle) continue;
            if (Math.abs(anchor.point.x - given.point.x) <= epsilon && Math.abs(anchor.point.y - given.point.y) <= epsilon) {
                return anchor;
            }
        }
        return given;
    }

    // /**
    //  * Maps a handle to its point on the provided rectangle.
    //  * @param rect Bounding rectangle.
    //  * @param handle Handle to map.
    //  * @returns Handle point in world coordinates, or undefined when the handle has no geometric point mapping.
    //  */
    // private static handlePoint(rect: IRect, handle: NodeHandle): IPoint | undefined {
    //     switch (handle) {
    //         case NodeHandle.NW:
    //             return { x: rect.left, y: rect.top };
    //         case NodeHandle.NE:
    //             return { x: rect.left + rect.width, y: rect.top };
    //         case NodeHandle.SW:
    //             return { x: rect.left, y: rect.top + rect.height };
    //         case NodeHandle.SE:
    //             return { x: rect.left + rect.width, y: rect.top + rect.height };
    //         case NodeHandle.N:
    //             return { x: rect.left + rect.width / 2, y: rect.top };
    //         case NodeHandle.S:
    //             return { x: rect.left + rect.width / 2, y: rect.top + rect.height };
    //         case NodeHandle.W:
    //             return { x: rect.left, y: rect.top + rect.height / 2 };
    //         case NodeHandle.E:
    //             return { x: rect.left + rect.width, y: rect.top + rect.height / 2 };
    //         default:
    //             return undefined;
    //     }
    // }

}