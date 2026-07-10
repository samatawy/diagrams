import type { INodeAdapter } from "./node.adapter";
import { IconRegistry } from "./icon.registry";
import type { NodeHandle } from "../types";
import type { INode } from "../interfaces";

/**
 * NodeRegistry is a central registry for managing different types of node handlers.
 * It allows for registering, retrieving, and unregistering node handlers based on their type.
 * This enables the diagram system to support various node types and their associated behaviors in a modular way.
 * 
 * Handlers should be registered with a unique type string that identifies the kind of node they handle.
 * The registry can then be queried to retrieve the appropriate handler for a given node type when needed.
 * This design promotes extensibility and separation of concerns within the diagram system.
 * 
 * Example usage:
 * const rectangleHandler = new RectangleHandler();
 * rectangleHandler.register(); // Registers the handler with the NodeRegistry
 * 
 * const handler = NodeRegistry.get('rectangle'); // Retrieves the handler for 'rectangle' nodes
 * if (handler) {
 *     handler.render(node, context); // Uses the handler to render a node
 * }
 */
export class NodeRegistry {

    private static _nodes: Map<string, INodeAdapter> = new Map();

    private static _transferables: Map<string, string[]> = new Map();

    /**
     * Registers a node handler for a specific type.
     * @param type The type of the node.
     * @param handler The handler responsible for managing the node type.
     */
    public static register(type: string, handler: INodeAdapter | (new () => INodeAdapter)): void {
        handler = typeof handler === 'function' ? new handler() : handler;
        this._nodes.set(type, handler);

        if (handler.icon && !IconRegistry.has(type)) {
            IconRegistry.register(type, handler.icon);
        }
    }

    /**
     * Retrieves the node handler for a given type.
     * @param type The type of the node to retrieve the handler for.
     * @returns The node handler for the specified type, or undefined if no handler is registered for that type.
     */
    public static adapter(type: string): INodeAdapter | undefined {
        return this._nodes.get(type);
    }

    /**
     * Unregisters a node handler for a specific type.
     * @param type The type of the node to unregister the handler for.
     */
    public static unregister(type: string): void {
        this._nodes.delete(type);

        this._transferables.delete(type);
        for (const [key, value] of this._transferables.entries()) {
            this._transferables.set(key, value.filter(t => t !== type));
        }
    }

    /**
     * Retrieves a list of all registered node types in the registry.
     * @returns An array of strings representing the registered node types.
     */
    public static registeredTypes(): string[] {
        return Array.from(this._nodes.keys());
    }

    public static registerTransferables(transferables: string[]): void {
        for (const type of transferables) {
            this._transferables.set(type, transferables);
        }
    }

    public static getTransferables(type: string): string[] {
        return this._transferables.get(type) ?? [];
    }

    // public static canTransfer(fromType: string, toType: string): boolean {
    //     const transferables = this._transferables.get(fromType);
    //     return transferables ? transferables.includes(toType) : false;
    // }

    /**
     * Checks if the node type represents a connection.
     * @param type The type of the node.
     * @returns True if the node type is a connection, false otherwise.
     */
    public static isConnection(type: string): boolean {
        const handler = this._nodes.get(type);
        return handler ? handler.is_connector : false;
    }

    /**
     * Checks if the node type represents a container.
     * @param type The type of the node.
     * @returns True if the node type is a container, false otherwise.
     */
    public static isContainer(type: string): boolean {
        const handler = this._nodes.get(type);
        return handler ? handler.is_container === true : false;
    }

    /**
     * Checks if the node type has text.
     * @param type The type of the node.
     * @returns True if the node type has text, false otherwise.
     */
    public static hasText(type: string): boolean {
        const handler = this._nodes.get(type);
        return handler ? handler.has_text : false;
    }

    /**
     * Checks if the node type supports single-line text rendering.
     * @param type The type of the node.
     * @returns True if the node type supports single-line text rendering, false otherwise.
     */
    public static isSingleLineText(type: string): boolean {
        const handler = this._nodes.get(type);
        return handler ? handler.single_line_text === true : false;
    }

    /**
     * Checks if the node type requires a multistep creation process.
     * @param type The type of the node.
     * @returns True if the node type requires multistep creation, false otherwise.
     */
    public static isMultistepCreate(type: string): boolean {
        const handler = this._nodes.get(type);
        return handler ? handler.multistep_create === true : false;
    }

    /**
     * Checks if the node type supports drag creation.
     * @param type The type of the node.
     * @returns True if the node type supports drag creation, false otherwise.
     */
    public static canDragCreate(type: string): boolean {
        const handler = this._nodes.get(type);
        return handler ? handler.drag_create === true : false;
    }

    /**
     * Checks if the node type can be rotated.
     * @param type The type of the node.
     * @returns True if the node type can be rotated, false otherwise.
     */
    public static canRotate(type: string): boolean {
        const handler = this._nodes.get(type);
        return handler ? handler.can_rotate === true : false;
    }

    /**
     * Checks if the node type can snap to a grid or guides.
     * @param type The type of the node.
     * @returns True if the node type can snap to a grid or guides, false otherwise.
     */
    public static canSnap(type: string): boolean {
        const handler = this._nodes.get(type);
        return handler ? handler.can_snap ?? false : false;
    }

    /**
     * Checks if the specified node can connect from/to the given handle.
     * @param node The node instance.
     * @param direction The direction of the connection ('from' or 'to').
     * @param handle The connection handle.
     * @returns True if the node can connect from/to the handle, false otherwise.
     */
    public static canConnect(node: INode, direction: 'from' | 'to', handle: NodeHandle): boolean {
        const handler = this._nodes.get(node.type);
        return handler ? handler.canConnect(node, direction, handle, { x: 0, y: 0 }) : false;
    }

    /**
     * Invokes the afterResize method of the node handler for the specified node type.
     * This method is called after a node has been resized to allow the handler to perform any necessary adjustments or updates.
     * @param node The node instance that was resized.
     * @param handle The handle that was used to resize the node.
     */
    public static afterResize(node: INode, handle: NodeHandle): void {
        const handler = this._nodes.get(node.type);
        if (handler && typeof handler.afterResize === 'function') {
            handler.afterResize(node, handle);
        }
    }
}
