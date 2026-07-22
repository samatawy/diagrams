import type { INodeAdapter } from "./node.adapter";
import type { NodeHandle } from "../types";
import type { INode } from "../interfaces";
import { NodeRegistry } from "./node.registry";

/**
 * Nodes is a convenience utility for quick access to node adapters.
 * 
 * Handlers should be registered with the NodeRegistry first.
 */
export class Nodes {

    /**
     * Retrieves the node handler for a given type.
     * @param type The type of the node to retrieve the handler for.
     * @returns The node handler for the specified type, or undefined if no handler is registered for that type.
     */
    public static adapter(type: string): INodeAdapter | undefined {
        return NodeRegistry.adapter(type);
    }

    /**
     * Checks if the node type represents a connection.
     * @param type The type of the node.
     * @returns True if the node type is a connection, false otherwise.
     */
    public static isConnection(type: string): boolean {
        const handler = this.adapter(type);
        return handler ? handler.is_connector : false;
    }

    /**
     * Checks if the node type represents a container.
     * @param type The type of the node.
     * @returns True if the node type is a container, false otherwise.
     */
    public static isContainer(type: string): boolean {
        const handler = this.adapter(type);
        return handler ? handler.is_container === true : false;
    }

    public static createDraft(type: string): Partial<INode> | undefined {
        const handler = this.adapter(type);
        if (handler) {
            return handler.onCreateDraft?.(type);
        }
        return undefined;
    }

    /**
     * Checks if the node type has text.
     * @param type The type of the node.
     * @returns True if the node type has text, false otherwise.
     */
    public static hasText(type: string): boolean {
        const handler = this.adapter(type);
        return handler ? handler.has_text : false;
    }

    /**
     * Checks if the node type supports single-line text rendering.
     * @param type The type of the node.
     * @returns True if the node type supports single-line text rendering, false otherwise.
     */
    public static isSingleLineText(type: string): boolean {
        const handler = this.adapter(type);
        return handler ? handler.single_line_text === true : false;
    }

    /**
     * Checks if the node type requires a multistep creation process.
     * @param type The type of the node.
     * @returns True if the node type requires multistep creation, false otherwise.
     */
    public static isMultistepCreate(type: string): boolean {
        const handler = this.adapter(type);
        return handler ? handler.multistep_create === true : false;
    }

    /**
     * Checks if the node type supports drag creation.
     * @param type The type of the node.
     * @returns True if the node type supports drag creation, false otherwise.
     */
    public static canDragCreate(type: string): boolean {
        const handler = this.adapter(type);
        return handler ? handler.drag_create === true : false;
    }

    /**
     * Checks if the node type can be rotated.
     * @param type The type of the node.
     * @returns True if the node type can be rotated, false otherwise.
     */
    public static canRotate(type: string): boolean {
        const handler = this.adapter(type);
        return handler ? handler.can_rotate === true : false;
    }

    /**
     * Checks if the node type can snap to a grid or guides.
     * @param type The type of the node.
     * @returns True if the node type can snap to a grid or guides, false otherwise.
     */
    public static canSnap(type: string): boolean {
        const handler = this.adapter(type);
        return handler ? handler.can_snap ?? false : false;
    }

    /**
     * Checks if the specified node can connect from/to the given handle.
     * @param node The node instance.
     * @param direction The direction of the connection ('from' or 'to').
     * @param handle The connection handle.
     * @returns True if the node can connect from/to the handle, false otherwise.
     */
    // public static canConnect(node: INode, direction: 'from' | 'to' | 'any', handle: NodeHandle): boolean {
    //     const handler = this._nodes.get(node.type);
    //     return handler ? handler.canConnect(node, direction, handle, { x: 0, y: 0 }) : false;
    // }

    public static canConnectTo(node: INode, handle: NodeHandle, direction: 'from' | 'to' | 'any', target?: Partial<INode>): boolean {
        const handler = this.adapter(node.type);
        return handler ? handler.canConnectTo(node, handle, direction, target, { x: 0, y: 0 }) : false;
    }

    /**
     * Invokes the afterResize method of the node handler for the specified node type.
     * This method is called after a node has been resized to allow the handler to perform any necessary adjustments or updates.
     * @param node The node instance that was resized.
     * @param handle The handle that was used to resize the node.
     */
    public static afterResize(node: INode, handle: NodeHandle): void {
        const handler = this.adapter(node.type);
        if (handler && typeof handler.afterResize === 'function') {
            handler.afterResize(node, handle);
        }
    }
}
