import type { IConnection, IConnectionAnchor, INode } from "../interfaces";
import { NodeHandle, type IPoint, type IRect } from "../types";
import { isDiagramViewLike } from "../guards";
import type { CoordinateSystem } from "../view/coordinate.system";
import { NodeRegistry } from "../factory/node.registry";
import { NodeBasics } from "./node.basics";

type InteractiveDiagram = INode['owner'] & {
    getCoordinates(): CoordinateSystem;
    hitNodes(x: number, y: number): INode[];
    hitHandle(x: number, y: number, target?: INode): NodeHandle;
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
     * Reconnects a connection node to a new target based on the specified coordinates.
     * @param node The connection node to reconnect.
     * @param x The x-coordinate of the new target.
     * @param y The y-coordinate of the new target.
     */
    public static reconnect(node: INode & IConnection, x: number, y: number): void {
        const diagram = this.getInteractiveDiagram(node);
        if (!diagram) return;

        const hit = diagram.getCoordinates().getPoint(x, y, 'ignore_grid');
        const adapter = NodeRegistry.adapter(node.type);

        if (node.points.length > 0) {
            const point = node.points[0]!;
            if (Math.abs(hit.x - point.x) <= 4 && Math.abs(hit.y - point.y) <= 4) {
                const fromAnchor = this.getMouseAnchor(node, x, y);
                const toTarget = node.to ? this.resolveAnchorNode(node, node.to) : undefined;
                const fromTarget = fromAnchor ? this.resolveAnchorNode(node, fromAnchor) : undefined;

                if (fromAnchor && (!toTarget || toTarget.id !== fromTarget?.id)) {
                    node.from = fromAnchor;

                } else {
                    node.from = undefined;
                }
                adapter?.afterConnect?.(node, 'from', fromAnchor ?? null);
            }
        }

        if (node.points.length > 1) {
            const point = node.points[node.points.length - 1]!;
            if (Math.abs(hit.x - point.x) <= 4 && Math.abs(hit.y - point.y) <= 4) {
                const toAnchor = this.getMouseAnchor(node, x, y);
                const fromTarget = node.from ? this.resolveAnchorNode(node, node.from) : undefined;
                const toTarget = toAnchor ? this.resolveAnchorNode(node, toAnchor) : undefined;

                if (toAnchor && (!fromTarget || fromTarget.id !== toTarget?.id)) {
                    node.to = toAnchor;

                } else {
                    node.to = undefined;
                }
                adapter?.afterConnect?.(node, 'to', toAnchor ?? null);
            }
        }
    }

    /**
     * Disconnects a connection node from its target based on the specified coordinates.
     * @param node The connection node to disconnect.
     * @param x The x-coordinate of the target to disconnect from.
     * @param y The y-coordinate of the target to disconnect from.
     */
    public static disconnect(node: INode & IConnection, x: number, y: number): void {
        if (!node.from && !node.to) return;

        const anchor = this.getMouseAnchor(node, x, y);
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
     * Renders the arrows for a connection node.
     * @param node The connection node to render arrows for.
     * @param context The canvas rendering context.
     */
    public static renderArrows(node: INode & IConnection, context: CanvasRenderingContext2D, points?: IPoint[]): void {
        points = points || node.points;
        if (points.length < 2) return;

        if (node.startArrow) {
            this.renderArrow(points[1]!, points[0]!, context);
        }

        if (node.endArrow) {
            this.renderArrow(points[points.length - 2]!, points[points.length - 1]!, context);
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
        if (anchor.handle === NodeHandle.POINT && typeof anchor.point === 'number' && anchor.point >= 0) {
            point = target.points[anchor.point];
        } else if (anchor.handle === NodeHandle.MOVE) {
            point = {
                x: rect.left + ((anchor.xOffset ?? 0.5) * rect.width),
                y: rect.top + ((anchor.yOffset ?? 0.5) * rect.height),
            };
        } else {
            point = this.handlePoint(rect, anchor.handle);
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

    private static getInteractiveDiagram(node: INode): InteractiveDiagram | undefined {
        const diagram = node.owner;
        if (!isDiagramViewLike(diagram)) return undefined;
        if (typeof (diagram as any).hitNodes !== 'function' || typeof (diagram as any).hitHandle !== 'function') {
            return undefined;
        }

        return diagram as unknown as InteractiveDiagram;
    }

    private static getMouseAnchor(node: INode & IConnection, x: number, y: number): IConnectionAnchor | undefined {
        const diagram = this.getInteractiveDiagram(node);
        if (!diagram) return undefined;

        const coordinates = diagram.getCoordinates();
        const atPoint = diagram.hitNodes(x, y);
        if (!atPoint.length) return undefined;

        for (const source of atPoint) {
            if (source.id === node.id) continue;

            const handle = diagram.hitHandle(x, y, source);
            if (handle === NodeHandle.ROTATE) continue;

            const anchor: IConnectionAnchor = {
                node: source,
                handle,
            };

            // Anchor capture must use node-local coordinates so rotation does not skew
            // point indices and normalized MOVE offsets.
            const rect = coordinates.getBoundingRect(source, false);
            const point = coordinates.getHitPoint({ x, y }, rect, source.angle || 0);

            if (handle === NodeHandle.POINT) {
                anchor.point = this.getPointIndex(source, point.x, point.y);
            }

            if (handle === NodeHandle.MOVE) {
                anchor.xOffset = rect.width ? (point.x - rect.left) / rect.width : 0.5;
                anchor.yOffset = rect.height ? (point.y - rect.top) / rect.height : 0.5;
            }

            return anchor;
        }

        return undefined;
    }

    private static getPointIndex(node: INode, x: number, y: number): number {
        for (let i = 0; i < node.points.length; i++) {
            const point = node.points[i]!;
            if (Math.abs(x - point.x) <= 4 && Math.abs(y - point.y) <= 4) {
                return i;
            }
        }

        return -1;
    }

    private static handlePoint(rect: IRect, handle: NodeHandle): IPoint | undefined {
        switch (handle) {
            case NodeHandle.NW:
                return { x: rect.left, y: rect.top };
            case NodeHandle.NE:
                return { x: rect.left + rect.width, y: rect.top };
            case NodeHandle.SW:
                return { x: rect.left, y: rect.top + rect.height };
            case NodeHandle.SE:
                return { x: rect.left + rect.width, y: rect.top + rect.height };
            case NodeHandle.N:
                return { x: rect.left + rect.width / 2, y: rect.top };
            case NodeHandle.S:
                return { x: rect.left + rect.width / 2, y: rect.top + rect.height };
            case NodeHandle.W:
                return { x: rect.left, y: rect.top + rect.height / 2 };
            case NodeHandle.E:
                return { x: rect.left + rect.width, y: rect.top + rect.height / 2 };
            default:
                return undefined;
        }
    }

    private static renderArrow(from: IPoint, to: IPoint, context: CanvasRenderingContext2D): void {
        const headlen = 10;
        const angle = NodeBasics.calculateAngle(from, to);  //to.y - from.y, to.x - from.x);

        context.beginPath();
        context.moveTo(to.x, to.y);
        context.lineTo(
            to.x - headlen * Math.cos(angle - Math.PI / 7),
            to.y - headlen * Math.sin(angle - Math.PI / 7),
        );
        context.lineTo(
            to.x - headlen * Math.cos(angle + Math.PI / 7),
            to.y - headlen * Math.sin(angle + Math.PI / 7),
        );
        context.lineTo(to.x, to.y);
        context.lineTo(
            to.x - headlen * Math.cos(angle - Math.PI / 7),
            to.y - headlen * Math.sin(angle - Math.PI / 7),
        );

        context.fillStyle = context.strokeStyle;
        context.fill();
        context.stroke();
    }
}