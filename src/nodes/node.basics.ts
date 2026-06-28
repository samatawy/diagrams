import type { INode } from "../interfaces";
import { NodeHandle, type IPoint, type IRect } from "../types";
import { isDiagramViewLike, isNode } from "../guards";
import type { INodeCached } from "../view/view.cache";
import { isAspectLocked, isHollow, isLocked } from "../value.utils";
import { DiagramConstants } from "../model/diagram.constants";
import { NodeRegistry } from "../factory";

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
        preserveAspect = preserveAspect || isAspectLocked(node);

        const diagram = node.owner;
        if (!isDiagramViewLike(diagram)) return;
        const coordinates = diagram.getCoordinates();
        // const cache = diagram.getCache();

        // To preserve ratio, we can rely on Shape resizing..
        let ratio = 1;

        if (preserveAspect) {
            let rect = coordinates.getBoundingRect(node);
            ratio = rect.width / rect.height;
            byY = (byX / ratio);
            // if (Math.abs(byX) >= Math.abs(byY * ratio)) {
            //     byY = byX / ratio;
            // } else {
            //     byX = byY * ratio;
            // }
            // byY = (byX / ratio);
            // console.log('preserveAspect', preserveAspect, 'ratio', ratio, 'byX', byX, 'byY', byY);
        } else {
            // console.log('preserveAspect', preserveAspect, 'locked', isAspectLocked(node));
        }

        switch (handle) {
            case NodeHandle.NW: {  // Tested
                // if (preserveAspect) {
                //     let rect = shape.getRect();
                //     let ratio = rect.width / rect.height;
                //     byY = byX / ratio;
                // }
                this.resizeBy(node, -byX, -byY, preserveAspect);
                this.moveBy(node, byX, byY);
                break;
            }
            case NodeHandle.NE: {  // Tested
                // if (preserveAspect) {
                //     let rect = shape.getRect();
                //     let ratio = rect.width / rect.height;
                //     byY = -byX / ratio;
                // }

                // Here is the only place this matters !!!
                if (preserveAspect) byY = -byY;

                this.resizeBy(node, byX, -byY, preserveAspect);
                this.moveBy(node, 0, byY);
                break;
            }
            case NodeHandle.SW: {
                // if (preserveAspect) {
                //     let rect = shape.getRect();
                //     let ratio = rect.width / rect.height;
                //     byY = -byX / ratio;
                // }
                if (preserveAspect) byY = -byY;

                this.resizeBy(node, -byX, byY, preserveAspect);
                this.moveBy(node, byX, 0);
                break;
            }
            case NodeHandle.SE: {
                // if (preserveAspect) {   // Tested
                //     let rect = shape.getRect();
                //     let ratio = rect.width / rect.height;
                //     byY = byX / ratio;
                // }     
                this.resizeBy(node, byX, byY, preserveAspect);
                break;
            }
            case NodeHandle.N: {  // Tested
                if (preserveAspect) {
                    this.resizeBy(node, -byY * ratio, -byY, preserveAspect);
                } else {
                    this.resizeBy(node, 0, -byY, preserveAspect);
                }
                // shape.resizeBy(0, -byY, preserveAspect);
                this.moveBy(node, 0, byY);
                break;
            }
            case NodeHandle.S: {  // Tested
                if (preserveAspect) {
                    this.resizeBy(node, byY * ratio, byY, preserveAspect);
                } else {
                    this.resizeBy(node, 0, byY, preserveAspect);
                }
                // shape.moveBy(0, byY);
                break;
            }
            case NodeHandle.E: {
                this.resizeBy(node, byX, 0, preserveAspect);
                break;
            }
            case NodeHandle.W: {
                // if (preserveAspect) byY = -byY;

                this.resizeBy(node, -byX, 0, preserveAspect);
                this.moveBy(node, byX, 0);
                break;
            }
            // }

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
        // node.cos = Math.cos(node.angle);
        // node.sin = Math.sin(node.angle);
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


        if (!node.angle) return true;   // No further calculation required..

        // An alternative:
        // if (!this.angle && !this.hollow) return true;   // No further calculation required..

        // if (!this.angle && this.hollow) {
        //     let inpath: boolean;
        //     if (this.path) {
        //         inpath = (this.hollow)? 
        //                 this.owner.context.isPointInStroke(this.path, rect.left, rect.top) :
        //                 this.owner.context.isPointInPath(this.path, rect.left, rect.top);

        //         if (!inpath) inpath = (this.hollow)? 
        //                 this.owner.context.isPointInStroke(this.path, rect.left + rect.width, rect.top + rect.height) :
        //                 this.owner.context.isPointInPath(this.path, rect.left + rect.width, rect.top + rect.height);
        //     }
        //     if (inpath) return true;                
        // }

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

    public static calculateLength(from: IPoint, to: IPoint): number {
        return Math.sqrt((to.x - from.x) ** 2 + (to.y - from.y) ** 2);
    }

    public static calculateAngle(from: IPoint, to: IPoint): number {
        return Math.atan2(to.y - from.y, to.x - from.x);
    }

    public static normalizeLine(from: IPoint, to: IPoint): { from: IPoint, to: IPoint } {
        if (this.isInvertedLine(from, to)) {
            return { from: to, to: from };
        } else {
            return { from, to };
        }
    }

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


    public static nearestHandle(node: INode, point: IPoint, is_inside: boolean, tolerance?: number): { handle: NodeHandle, point: IPoint } | undefined {
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

        const handlePoints: Record<string, IPoint> = {
            [NodeHandle.N]: { x: rect.left + rect.width / 2, y: rect.top },
            [NodeHandle.S]: { x: rect.left + rect.width / 2, y: rect.top + rect.height },
            [NodeHandle.E]: { x: rect.left + rect.width, y: rect.top + rect.height / 2 },
            [NodeHandle.W]: { x: rect.left, y: rect.top + rect.height / 2 },
            [NodeHandle.NE]: { x: rect.left + rect.width, y: rect.top },
            [NodeHandle.NW]: { x: rect.left, y: rect.top },
            [NodeHandle.SE]: { x: rect.left + rect.width, y: rect.top + rect.height },
            [NodeHandle.SW]: { x: rect.left, y: rect.top + rect.height },
        };

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

        if (minDistance === Infinity) {
            // No nearest handle found, return undefined
            return undefined;
        }
        return { handle: nearestHandle, point: nearestPoint };
    }

    public static nearestConnectionHandle(node: INode, point: IPoint, is_inside: boolean, tolerance?: number): { handle: NodeHandle, point: IPoint } | undefined {
        const diagram = node.owner;
        if (!isDiagramViewLike(diagram)) return undefined;
        const coordinates = diagram.getCoordinates();
        const rect = coordinates.getBoundingRect(node, true);

        if (!rect) return undefined;

        const allowed_handles = NodeRegistry.connectionHandles(node.type);
        const fallbackHandle = (is_inside && allowed_handles.includes(NodeHandle.MOVE)) ? NodeHandle.MOVE : NodeHandle.NONE;
        tolerance = tolerance ?? 24; // Default tolerance if not provided

        // Return MOVE only when the point is genuinely inside the node rect
        // AND far from every edge.
        if (point.x > rect.left + tolerance &&
            point.x < rect.left + rect.width - tolerance &&
            point.y > rect.top + tolerance &&
            point.y < rect.top + rect.height - tolerance) {
            return { handle: fallbackHandle, point: { ...point } };
        }

        const inifintelyFar = { x: Infinity, y: Infinity };

        const handlePoints: Record<string, IPoint | typeof inifintelyFar> = {
            [NodeHandle.N]: (allowed_handles.includes(NodeHandle.N)) ? { x: rect.left + rect.width / 2, y: rect.top } : inifintelyFar,
            [NodeHandle.S]: (allowed_handles.includes(NodeHandle.S)) ? { x: rect.left + rect.width / 2, y: rect.top + rect.height } : inifintelyFar,
            [NodeHandle.E]: (allowed_handles.includes(NodeHandle.E)) ? { x: rect.left + rect.width, y: rect.top + rect.height / 2 } : inifintelyFar,
            [NodeHandle.W]: (allowed_handles.includes(NodeHandle.W)) ? { x: rect.left, y: rect.top + rect.height / 2 } : inifintelyFar,
            [NodeHandle.NE]: (allowed_handles.includes(NodeHandle.NE)) ? { x: rect.left + rect.width, y: rect.top } : inifintelyFar,
            [NodeHandle.NW]: (allowed_handles.includes(NodeHandle.NW)) ? { x: rect.left, y: rect.top } : inifintelyFar,
            [NodeHandle.SE]: (allowed_handles.includes(NodeHandle.SE)) ? { x: rect.left + rect.width, y: rect.top + rect.height } : inifintelyFar,
            [NodeHandle.SW]: (allowed_handles.includes(NodeHandle.SW)) ? { x: rect.left, y: rect.top + rect.height } : inifintelyFar,
        };

        let nearestHandle: NodeHandle = fallbackHandle;
        let nearestPoint: IPoint = { x: 0, y: 0 };
        let minDistance = Infinity;

        for (const [handle, handlePoint] of Object.entries(handlePoints)) {
            if (handlePoint === inifintelyFar) continue; // Skip handles that are not allowed

            const distance = Math.sqrt((point.x - handlePoint.x) ** 2 + (point.y - handlePoint.y) ** 2);
            if (distance < minDistance) {
                minDistance = distance;
                nearestHandle = handle as NodeHandle;
                nearestPoint = { ...handlePoint };
            }
        }

        if (minDistance === Infinity) {
            // No nearest handle found, return undefined
            return undefined;
        }
        return { handle: nearestHandle, point: nearestPoint };
    }

}