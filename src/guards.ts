import { NodeRegistry } from "./factory";
import type { IConnection, IContainer, IDiagram, INode } from "./interfaces";
import type { DiagramAnimations } from "./layout/animations";
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

    if ((value as INode).type) {
        return NodeRegistry.adapter((value as INode).type)?.is_connector === true;
    }
    // fallback check that should not be normally reached
    return 'from' in value
        || 'to' in value;
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
 * Type guard to check if a value is an IContainer.
 * @param value The value to check.
 * @returns True if the value is an IContainer, false otherwise.
 */
export function isContainer(value: unknown): value is IContainer {
    if (NodeRegistry.isContainer((value as INode)?.type)) {
        return true;
    }
    return isNode(value) && 'owns_group' in value && typeof (value as any).owns_group === 'string';
}

/**
 * Type guard to check if a value is both an INode and an IContainer, indicating that it is a container node.
 * @param value The value to check.
 * @returns True if the value is an INode and an IContainer, false otherwise.
 */
export function isContainerNode(value: unknown): value is INode & IContainer {
    return isNode(value) && isContainer(value);
}

/**
 * Partial DiagramView contract.
 */
export interface DiagramViewLike extends IDiagram {
    render_mode: 'edit' | 'view';
    animations: DiagramAnimations;
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
