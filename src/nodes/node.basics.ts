import type { IHandlePoint, INode } from "../interfaces";
import { NodeHandle, type IPoint, type IRect } from "../types";
import { isConnectionNode, isDiagramViewLike, isNode } from "../guards";
import type { INodeCached } from "../view/view.cache";
import { isAspectLocked, isHollow, isLocked } from "../value.utils";
import { NodeRegistry } from "../factory";
import { DiagramConstants } from "../model/diagram.constants";

/**
 * Provides basic operations for manipulating nodes, such as moving, resizing, rotating, and checking for overlaps or containment.
 * These utilities are designed to work with nodes in a diagram editor, allowing for transformations and hit testing based on the node's geometry and the diagram's coordinate system.
 * The methods take into account the node's points, angle, and bounding rectangle to perform accurate calculations for movement, resizing, and selection.
 * This class can be used as a foundation for implementing more complex node behaviors in a diagram editing application.
 */
export class NodeBasics {

    /**
     * Moves a node by the specified deltas.
     * @param node The node to move.
     * @param byX The horizontal delta.
     * @param byY The vertical delta.
     * @param flags Optional flags for movement behavior.
     */
    public static moveBy(node: INode, byX: number, byY: number, flags?: null | 'ignore_scale') {

        if (isLocked(node)) return;

        const diagram = node.owner;
        if (!isDiagramViewLike(diagram)) return;
        const coordinates = diagram.getCoordinates();

        if (flags != 'ignore_scale' && coordinates) {
            byX = byX / coordinates.zoom;
            byY = byY / coordinates.zoom;
        }

        for (let pt of node.points) {
            pt.x += byX;
            pt.y += byY;
        }
    }

    /**
     * Resizes a node by the specified deltas.
     * @param node The node to resize.
     * @param byX The horizontal delta.
     * @param byY The vertical delta.
     * @param preserveAspect Whether to preserve the aspect ratio.
     */
    private static resizeBy(node: INode, byX: number, byY: number, preserveAspect?: boolean): void {

        if (isLocked(node)) return;
        preserveAspect = preserveAspect || isAspectLocked(node);

        const diagram = node.owner;
        if (!isDiagramViewLike(diagram)) return;
        const coordinates = diagram.getCoordinates();

        byX = byX / coordinates.zoom;
        byY = byY / coordinates.zoom;

        let rect = coordinates.getBoundingRect(node);
        rect.width = rect.width || 0.001;
        rect.height = rect.height || 0.001;

        if (preserveAspect) {
            ({ byX, byY } = this.constrainDeltasByAspectRatio(rect, byX, byY));

        } else {
            // prevent reaching zero width or height..
            let minWidth = (node.owner.grid?.forced) ? node.owner.grid.width : 8;
            if (rect.width + (byX) <= minWidth) {
                byX = 0;
            }
            let minHeight = (node.owner.grid?.forced) ? node.owner.grid.height : 8;
            if (rect.height + (byY) <= minHeight) {
                byY = 0;
            }
        }

        for (let pt of node.points) {
            let wRatio = Math.abs(pt.x - rect.left) / rect.width;
            let hRatio = Math.abs(pt.y - rect.top) / rect.height;

            pt.x += byX * wRatio;
            pt.y += byY * hRatio;
        }
    }

    /**
     * Constrains resize deltas to preserve the current aspect ratio while enforcing minimum size.
     * @param rect Current bounding rectangle.
     * @param byX Requested width delta.
     * @param byY Requested height delta.
     * @returns Aspect-constrained deltas.
     */
    private static constrainDeltasByAspectRatio(rect: IRect, byX: number, byY: number): { byX: number, byY: number } {
        const ratio = rect.width / rect.height;
        const minSmallest = 20;

        const minWidth = ratio >= 1 ? minSmallest * ratio : minSmallest;
        const minHeight = ratio >= 1 ? minSmallest : minSmallest / ratio;

        const requestedWidth = rect.width + byX;
        const requestedHeight = rect.height + byY;

        const overshoots = (candidate: number, current: number, requested: number): boolean => {
            if (requested >= current) return candidate > requested;
            return candidate < requested;
        };

        // Try width-driven first, then switch to height-driven if it exceeds the dragged bound.
        let nextWidth = requestedWidth;
        let nextHeight = nextWidth / ratio;

        if (overshoots(nextHeight, rect.height, requestedHeight)) {
            nextHeight = requestedHeight;
            nextWidth = nextHeight * ratio;
        }

        // Aspect-preserving minimum size floor.
        if (nextWidth < minWidth) {
            nextWidth = minWidth;
            nextHeight = nextWidth / ratio;
        }
        if (nextHeight < minHeight) {
            nextHeight = minHeight;
            nextWidth = nextHeight * ratio;
        }

        byX = nextWidth - rect.width;
        byY = nextHeight - rect.height;
        return { byX, byY };
    }

    /**
     * Resizes a node based on the specified handle and movement deltas.
     * @param node The node to resize.
     * @param handle The handle being used for resizing.
     * @param byX The horizontal movement delta.
     * @param byY The vertical movement delta.
     * @param preserveAspect Whether to preserve the aspect ratio during resizing.
     */
    public static resizeHandle(node: INode, handle: NodeHandle, byX: number, byY: number, preserveAspect?: boolean): void {

        if (isLocked(node)) return;
        // const adapter = NodeRegistry.adapter(node.type);
        // const allowed = adapter?.resize_handles;
        // if (allowed && !allowed?.includes(handle)) return;

        preserveAspect = preserveAspect || isAspectLocked(node);

        const diagram = node.owner;
        if (!isDiagramViewLike(diagram)) return;
        const coordinates = diagram.getCoordinates();

        // To preserve ratio, we can rely on Shape resizing..
        let ratio = 1;

        if (preserveAspect) {
            let rect = coordinates.getBoundingRect(node);
            ratio = rect.width / rect.height;
            byY = (byX / ratio);
        }

        switch (handle) {
            case NodeHandle.NW: {  // Tested
                this.resizeBy(node, -byX, -byY, preserveAspect);
                this.moveBy(node, byX, byY);
                break;
            }
            case NodeHandle.NE: {  // Tested

                // Here is the only place this matters !!!
                if (preserveAspect) byY = -byY;

                this.resizeBy(node, byX, -byY, preserveAspect);
                this.moveBy(node, 0, byY);
                break;
            }
            case NodeHandle.SW: {
                if (preserveAspect) byY = -byY;

                this.resizeBy(node, -byX, byY, preserveAspect);
                this.moveBy(node, byX, 0);
                break;
            }
            case NodeHandle.SE: {
                this.resizeBy(node, byX, byY, preserveAspect);
                break;
            }
            case NodeHandle.N: {  // Tested
                if (preserveAspect) {
                    this.resizeBy(node, -byY * ratio, -byY, preserveAspect);
                } else {
                    this.resizeBy(node, 0, -byY, preserveAspect);
                }

                this.moveBy(node, 0, byY);
                break;
            }
            case NodeHandle.S: {  // Tested
                if (preserveAspect) {
                    this.resizeBy(node, byY * ratio, byY, preserveAspect);
                } else {
                    this.resizeBy(node, 0, byY, preserveAspect);
                }
                break;
            }
            case NodeHandle.E: {
                this.resizeBy(node, byX, 0, preserveAspect);
                break;
            }
            case NodeHandle.W: {
                this.resizeBy(node, -byX, 0, preserveAspect);
                this.moveBy(node, byX, 0);
                break;
            }

        }
    }

    /**
     * Rotates a node to the specified angle.
     * @param node The node to rotate.
     * @param degrees The angle to rotate the node to.
     * @param kind The unit of the angle, either 'degrees' or 'radians'.
     */
    public static rotateTo(node: INode, degrees: number, kind: 'degrees' | 'radians' = 'degrees'): void {

        if (isLocked(node)) return;

        const diagram = node.owner;
        if (!isDiagramViewLike(diagram)) return;
        const cache = diagram.getCache();
        let cached = cache.getNode(node) || {} as INodeCached;

        node.angle = (kind === 'degrees') ? degrees * Math.PI / 180 : degrees;
        cached.cos = Math.cos(node.angle);
        cached.sin = Math.sin(node.angle);
        cache.setNode(node, cached);
    }

    /**
     * Checks if a node overlaps with a target rectangle or another node's bounding rectangle.
     * @param node The node to check.
     * @param target The target rectangle or node to check against.
     * @returns True if the node overlaps with the target, false otherwise.
     */
    public static overlaps(node: INode, target: IRect | INode): boolean {
        const diagram = node.owner;
        if (!isDiagramViewLike(diagram)) return false;
        const coordinates = diagram.getCoordinates();
        const cache = diagram.getCache();
        const cached = cache.getNode(node) || {} as INodeCached;

        if (!target) return false;
        target = isNode(target) ? coordinates.getBoundingRect(target as INode, true) : target;
        let rect = coordinates.getBoundingRect(node, true);
        if (!rect) return false;

        if (rect.left > target.left + target.width) return false;
        if (rect.top > target.top + target.height) return false;
        if (target.left > rect.left + rect.width) return false;
        if (target.top > rect.top + rect.height) return false;

        if (isConnectionNode(node)) {
            // TODO: Add logic for checking overlap with polyline connections; bounding rect is too wide.
        }

        if (!node.angle) return true;   // No further calculation required..

        if (node.angle) {
            const grid_width = node.owner.grid?.width || 0;
            const grid_height = node.owner.grid?.height || 0;

            for (let x = 0; x < target.width; x = Math.min(x + grid_width, target.width)) {
                for (let y = 0; y < target.height; y = Math.min(y + grid_height, target.height)) {

                    // let check = this.owner.getHitPoint({x: target.left + x, y: target.top + y}, rect, this.angle, this.cos, this.sin);
                    let check = { x: target.left + x, y: target.top + y };
                    // let tx = pt.x; y = pt.y;

                    for (let pt of node.points) {
                        if (Math.abs(pt.x - check.x) <= 4 && Math.abs(pt.y - check.y) <= 4)
                            return true;
                    }

                    let inpath: boolean = false;
                    if (cached.path && coordinates) {
                        inpath = isHollow(node) ?
                            coordinates.isPointInStroke(cached.path, x, y) :
                            coordinates.isPointInPath(cached.path, x, y);
                    }

                    if (inpath) return true;
                }
            }
            return false;
        } else {
            return true;
        }
    }

    /**
     * Checks if a node is fully inside a target rectangle or another node's bounding rectangle.
     * @param node The node to check.
     * @param target The target rectangle or node to check against.
     * @returns True if the node is fully inside the target, false otherwise.
     */
    public static inside(node: INode, target: IRect | INode): boolean {
        if (!target) return false;
        const diagram = node.owner;
        if (!isDiagramViewLike(diagram)) return false;
        const coordinates = diagram.getCoordinates();

        target = isNode(target) ? coordinates.getBoundingRect(target as INode, true) : target;
        let rect = coordinates.getBoundingRect(node, true);
        if (!rect) return false;

        if (rect.left >= target.left && rect.top >= target.top) {
            if (rect.width <= target.width - (rect.left - target.left)) {
                if (rect.height <= target.height - (rect.top - target.top)) {
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * Returns the longest segment from an ordered point list.
     * @param points Ordered polyline points.
     * @returns The longest segment endpoints, or undefined when fewer than two points are provided.
     */
    public static longestSegment(points: IPoint[]): { from: IPoint, to: IPoint } | undefined {
        if (points.length < 2) {
            return undefined;
        }
        const segments: { from: IPoint, to: IPoint, length: number }[] = [];
        for (let i = 1; i < points.length; i++) {
            const from = points[i - 1]!;
            const to = points[i]!;
            const length = this.calculateLength(from, to);
            segments.push({ from, to, length });
        }
        segments.sort((a, b) => b.length - a.length);
        return segments[0];
    }

    /**
     * Computes Euclidean distance between two points.
     * @param from Start point.
     * @param to End point.
     * @returns Segment length.
     */
    public static calculateLength(from: IPoint, to: IPoint): number {
        return Math.sqrt((to.x - from.x) ** 2 + (to.y - from.y) ** 2);
    }

    /**
     * Computes the line angle from one point to another.
     * @param from Start point.
     * @param to End point.
     * @returns Angle in radians.
     */
    public static calculateAngle(from: IPoint, to: IPoint): number {
        return Math.atan2(to.y - from.y, to.x - from.x);
    }

    /**
     * Normalizes line orientation to a deterministic direction.
     * @param from First endpoint.
     * @param to Second endpoint.
     * @returns Endpoints in normalized order.
     */
    public static normalizeLine(from: IPoint, to: IPoint): { from: IPoint, to: IPoint } {
        if (this.isInvertedLine(from, to)) {
            return { from: to, to: from };
        } else {
            return { from, to };
        }
    }

    /**
     * Determines whether a line orientation is considered inverted.
     * @param from First endpoint.
     * @param to Second endpoint.
     * @returns True when the line should be flipped by normalizeLine.
     */
    public static isInvertedLine(from: IPoint, to: IPoint): boolean {
        const dx = to.x - from.x;
        if (dx < 0) {
            return true;
        }
        if (dx > 0) {
            return false;
        }

        // Vertical tie-breaker keeps normalization deterministic.
        return from.y > to.y;
    }


    /**
     * Finds the nearest generic node handle for a point.
     * That handle may not be valid for connection purposes, but it is the closest handle to the point.
     * @param node Target node.
     * @param point Lookup point in world coordinates.
     * @param is_inside Whether inside hits should resolve to MOVE fallback.
     * @param tolerance Interior distance threshold.
     * @returns Nearest handle and snapped point, or undefined when no candidate is found.
     */
    public static nearestHandle(node: INode, point: IPoint, is_inside: boolean, tolerance?: number): IHandlePoint | undefined {
        const diagram = node.owner;
        if (!isDiagramViewLike(diagram)) return undefined;
        const coordinates = diagram.getCoordinates();
        const rect = coordinates.getBoundingRect(node, true);

        if (!rect) return undefined;

        const fallbackHandle = is_inside ? NodeHandle.MOVE : NodeHandle.NONE;
        tolerance = tolerance ?? 24; // Default tolerance if not provided

        // Return MOVE only when the point is genuinely inside the node rect
        // AND far from every edge.
        if (point.x > rect.left + tolerance &&
            point.x < rect.left + rect.width - tolerance &&
            point.y > rect.top + tolerance &&
            point.y < rect.top + rect.height - tolerance) {
            return { handle: fallbackHandle, point: { ...point } };
        }

        // const supportsPointHandle = NodeRegistry
        //     .connectionHandles(node.type)
        //     .includes(NodeHandle.POINT);
        const isAllowed = NodeRegistry.canConnect(node, 'to', NodeHandle.POINT);

        const handlePoints: Record<string, IPoint> = !isAllowed // supportsPointHandle
            ? {
                [NodeHandle.N]: { x: rect.left + rect.width / 2, y: rect.top },
                [NodeHandle.S]: { x: rect.left + rect.width / 2, y: rect.top + rect.height },
                [NodeHandle.E]: { x: rect.left + rect.width, y: rect.top + rect.height / 2 },
                [NodeHandle.W]: { x: rect.left, y: rect.top + rect.height / 2 },
                [NodeHandle.NE]: { x: rect.left + rect.width, y: rect.top },
                [NodeHandle.NW]: { x: rect.left, y: rect.top },
                [NodeHandle.SE]: { x: rect.left + rect.width, y: rect.top + rect.height },
                [NodeHandle.SW]: { x: rect.left, y: rect.top + rect.height },
            }
            : {};

        let nearestHandle: NodeHandle = fallbackHandle;
        let nearestPoint: IPoint = { x: 0, y: 0 };
        let minDistance = Infinity;

        for (const [handle, handlePoint] of Object.entries(handlePoints)) {
            const distance = Math.sqrt((point.x - handlePoint.x) ** 2 + (point.y - handlePoint.y) ** 2);
            if (distance < minDistance) {
                minDistance = distance;
                nearestHandle = handle as NodeHandle;
                nearestPoint = { ...handlePoint };
            }
        }

        if (isAllowed) {            // supportsPointHandle) {
            for (const handlePoint of node.points) {
                const distance = Math.sqrt((point.x - handlePoint.x) ** 2 + (point.y - handlePoint.y) ** 2);
                if (distance < minDistance) {
                    minDistance = distance;
                    nearestHandle = NodeHandle.POINT;
                    nearestPoint = { ...handlePoint };
                }
            }
        }

        if (minDistance === Infinity) {
            // No nearest handle found, return undefined
            return undefined;
        }
        return { handle: nearestHandle, point: nearestPoint };
    }

    /**
     * Finds the nearest allowed connection handle for a point.
     * The returned handle is guaranteed to be valid for connection purposes, or MOVE if the point is inside the node and MOVE is allowed.
     * @param node Target node.
     * @param point Lookup point in world coordinates.
     * @param is_inside Whether inside hits should resolve to MOVE fallback when supported.
     * @param tolerance Interior distance threshold.
     * @returns Nearest connection handle and snapped point, or undefined when no candidate is found.
     */
    public static nearestConnectionHandle(node: INode, point: IPoint, is_inside: boolean, tolerance?: number): IHandlePoint | undefined {
        const diagram = node.owner;
        if (!isDiagramViewLike(diagram)) return undefined;
        const coordinates = diagram.getCoordinates();
        const rect = coordinates.getBoundingRect(node, true);

        if (!rect) return undefined;

        // const allowed_handles = NodeRegistry.connectionHandles(node.type);
        // const fallbackHandle = (is_inside && allowed_handles.includes(NodeHandle.MOVE)) ? NodeHandle.MOVE : NodeHandle.NONE;
        const fallbackHandle = (is_inside && NodeRegistry.canConnect(node, 'to', NodeHandle.MOVE)) ? NodeHandle.MOVE : NodeHandle.NONE;
        tolerance = tolerance ?? 24; // Default tolerance if not provided

        // Return MOVE only when the point is genuinely inside the node rect
        // AND far from every edge.
        if (point.x > rect.left + tolerance &&
            point.x < rect.left + rect.width - tolerance &&
            point.y > rect.top + tolerance &&
            point.y < rect.top + rect.height - tolerance) {
            return { handle: fallbackHandle, point: { ...point } };
        }

        // const candidates = this.getConnectionHandleCandidates(node, rect);
        const candidates = NodeRegistry.adapter(node.type)?.getAnchors(node, 'connection_handles') ?? []; // Get connection handle candidates

        let nearestHandle: NodeHandle = fallbackHandle;
        let nearestPoint: IPoint = { x: 0, y: 0 };
        let minDistance = Infinity;

        for (const candidate of candidates) {
            const distance = Math.sqrt((point.x - candidate.point.x) ** 2 + (point.y - candidate.point.y) ** 2);
            if (distance < minDistance) {
                minDistance = distance;
                nearestHandle = candidate.handle;
                nearestPoint = { ...candidate.point };
            }
        }

        if (minDistance === Infinity) {
            // No nearest handle found, return undefined
            return undefined;
        }
        return { handle: nearestHandle, point: nearestPoint };
    }

    /**
     * Resolves the exact connection handle hit at a point within a tolerance.
     * @param node Target node.
     * @param point Lookup point in world coordinates.
     * @param tolerance Maximum distance for a handle hit.
     * @returns Matching handle and snapped point, or undefined when no candidate matches.
     */
    public static connectionHandleAtPoint(node: INode, point: IPoint, tolerance: number = DiagramConstants.HANDLE_HIT_EPSILON): IHandlePoint | undefined {
        const diagram = node.owner;
        if (!isDiagramViewLike(diagram)) return undefined;
        const coordinates = diagram.getCoordinates();
        const rect = coordinates.getBoundingRect(node, true);
        if (!rect) return undefined;

        // const allowed_handles = NodeRegistry.connectionHandles(node.type);
        // const candidates = this.getConnectionHandleCandidates(node, rect);  //, allowed_handles);
        const candidates = NodeRegistry.adapter(node.type)?.getAnchors(node, 'connection_handles') ?? []; // Get connection handle candidates

        let exact: IHandlePoint | undefined;
        let minDistance = Infinity;

        for (const candidate of candidates) {
            const distance = Math.sqrt((point.x - candidate.point.x) ** 2 + (point.y - candidate.point.y) ** 2);
            if (distance <= tolerance && distance < minDistance) {
                minDistance = distance;
                exact = { handle: candidate.handle, point: { ...candidate.point } };
            }
        }

        if (exact) {
            return exact;
        }

        // if (allowed_handles.includes(NodeHandle.MOVE)
        if (NodeRegistry.canConnect(node, 'to', NodeHandle.MOVE)
            && point.x >= rect.left
            && point.x <= rect.left + rect.width
            && point.y >= rect.top
            && point.y <= rect.top + rect.height) {
            return { handle: NodeHandle.MOVE, point: { ...point } };
        }

        return undefined;
    }

    /**
     * Builds geometric candidates for connection-handle matching.
     * @param node Target node.
     * @param rect Node bounding rectangle.
     * @param allowed_handles Handles allowed by the adapter.
     * @returns Candidate handle positions in world coordinates.
     */
    private static getConnectionHandleCandidates(node: INode, rect: IRect): Array<IHandlePoint> {
        const candidates: Array<IHandlePoint> = [];

        const adapter = NodeRegistry.adapter(node.type);
        if (!adapter) return candidates;
        if (adapter.canConnect(node, 'to', NodeHandle.N)) candidates.push({ handle: NodeHandle.N, point: { x: rect.left + rect.width / 2, y: rect.top } });
        if (adapter.canConnect(node, 'to', NodeHandle.S)) candidates.push({ handle: NodeHandle.S, point: { x: rect.left + rect.width / 2, y: rect.top + rect.height } });
        if (adapter.canConnect(node, 'to', NodeHandle.E)) candidates.push({ handle: NodeHandle.E, point: { x: rect.left + rect.width, y: rect.top + rect.height / 2 } });
        if (adapter.canConnect(node, 'to', NodeHandle.W)) candidates.push({ handle: NodeHandle.W, point: { x: rect.left, y: rect.top + rect.height / 2 } });
        if (adapter.canConnect(node, 'to', NodeHandle.NE)) candidates.push({ handle: NodeHandle.NE, point: { x: rect.left + rect.width, y: rect.top } });
        if (adapter.canConnect(node, 'to', NodeHandle.NW)) candidates.push({ handle: NodeHandle.NW, point: { x: rect.left, y: rect.top } });
        if (adapter.canConnect(node, 'to', NodeHandle.SE)) candidates.push({ handle: NodeHandle.SE, point: { x: rect.left + rect.width, y: rect.top + rect.height } });
        if (adapter.canConnect(node, 'to', NodeHandle.SW)) candidates.push({ handle: NodeHandle.SW, point: { x: rect.left, y: rect.top + rect.height } });

        // POINT is connection-specific: for polylines/curves use only inner points,
        // never first/last endpoints, so drag-connect cannot snap to connection ends.
        // if (adapter.canConnect(node, 'to', NodeHandle.POINT, point) && node.points.length > 2) {
        for (let i = 1; i < node.points.length - 1; i++) {
            const p = node.points[i]!;
            if (adapter.canConnect(node, 'to', NodeHandle.POINT, p)) {
                candidates.push({ handle: NodeHandle.POINT, point: { ...p } });
            }
        }

        return candidates;
    }
    // private static getConnectionHandleCandidates(node: INode, rect: IRect, allowed_handles: NodeHandle[]): Array<{ handle: NodeHandle, point: IPoint }> {
    //     const candidates: Array<{ handle: NodeHandle, point: IPoint }> = [];

    //     if (allowed_handles.includes(NodeHandle.N)) candidates.push({ handle: NodeHandle.N, point: { x: rect.left + rect.width / 2, y: rect.top } });
    //     if (allowed_handles.includes(NodeHandle.S)) candidates.push({ handle: NodeHandle.S, point: { x: rect.left + rect.width / 2, y: rect.top + rect.height } });
    //     if (allowed_handles.includes(NodeHandle.E)) candidates.push({ handle: NodeHandle.E, point: { x: rect.left + rect.width, y: rect.top + rect.height / 2 } });
    //     if (allowed_handles.includes(NodeHandle.W)) candidates.push({ handle: NodeHandle.W, point: { x: rect.left, y: rect.top + rect.height / 2 } });
    //     if (allowed_handles.includes(NodeHandle.NE)) candidates.push({ handle: NodeHandle.NE, point: { x: rect.left + rect.width, y: rect.top } });
    //     if (allowed_handles.includes(NodeHandle.NW)) candidates.push({ handle: NodeHandle.NW, point: { x: rect.left, y: rect.top } });
    //     if (allowed_handles.includes(NodeHandle.SE)) candidates.push({ handle: NodeHandle.SE, point: { x: rect.left + rect.width, y: rect.top + rect.height } });
    //     if (allowed_handles.includes(NodeHandle.SW)) candidates.push({ handle: NodeHandle.SW, point: { x: rect.left, y: rect.top + rect.height } });

    //     // POINT is connection-specific: for polylines/curves use only inner points,
    //     // never first/last endpoints, so drag-connect cannot snap to connection ends.
    //     if (allowed_handles.includes(NodeHandle.POINT) && node.points.length > 2) {
    //         for (let i = 1; i < node.points.length - 1; i++) {
    //             const p = node.points[i];
    //             if (p) candidates.push({ handle: NodeHandle.POINT, point: { ...p } });
    //         }
    //     }

    //     return candidates;
    // }

}