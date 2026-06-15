import type { IConnection, IDiagram, INode } from "./interfaces";
import type { CoordinateSystem } from "./view/coordinate.system";
import type { ViewCache } from "./view/view.cache";

/**
 * Type guard to check if a value is an INode.
 * @param node The value to check.
 * @returns True if the value is an INode, false otherwise.
 */
export function isNode(node: unknown): node is INode {
    return !!node && typeof node === 'object' && 'id' in node && typeof (node as any).id === 'string' && 'points' in node && Array.isArray((node as any).points);
}

/**
 * Type guard to check if a value is an IConnection.
 * @param value The value to check.
 * @returns True if the value is an IConnection, false otherwise.
 */
export function isConnection(value: unknown): value is IConnection {
    if (!value || typeof value !== 'object') {
        return false;
    }

    return 'from' in value
        || 'to' in value
        || 'startArrow' in value
        || 'endArrow' in value;
    // || 'ready' in value;     Why was this here?
}

/**
 * Type guard to check if a value is both an INode and an IConnection, indicating that it is a connection node.
 * @param value The value to check.
 * @returns True if the value is an INode and an IConnection, false otherwise.
 */
export function isConnectionNode(value: unknown): value is INode & IConnection {
    return isNode(value) && isConnection(value);
}

/**
 * Partial DiagramView contract.
 */
export interface DiagramViewLike extends IDiagram {
    render_mode: 'edit' | 'view';
    getCache(): ViewCache;
    getCoordinates(): CoordinateSystem;
}

/**
 * Type guard to check if a value is a DiagramViewLike, which is an IDiagram with additional properties and methods for rendering and caching.
 * @param diagram The value to check.
 * @returns True if the value is a DiagramViewLike, false otherwise.
 */
export function isDiagramViewLike(diagram: unknown): diagram is DiagramViewLike {
    return !!diagram
        && typeof diagram === 'object'
        && 'render_mode' in diagram
        && typeof (diagram as DiagramViewLike).getCache === 'function'
        && typeof (diagram as DiagramViewLike).getCoordinates === 'function';
}
