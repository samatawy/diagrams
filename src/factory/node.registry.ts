import type { INodeAdapter } from "./node.adapter";

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

    /**
     * Registers a node handler for a specific type.
     * @param type The type of the node.
     * @param handler The handler responsible for managing the node type.
     */
    public static register(type: string, handler: INodeAdapter | (new () => INodeAdapter)): void {
        handler = typeof handler === 'function' ? new handler() : handler;
        this._nodes.set(type, handler);
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
    }

    /**
     * Retrieves a list of all registered node types in the registry.
     * @returns An array of strings representing the registered node types.
     */
    public static registeredTypes(): string[] {
        return Array.from(this._nodes.keys());
    }

    public static isConnection(type: string): boolean {
        const handler = this._nodes.get(type);
        return handler ? handler.is_connector : false;
    }

    public static hasText(type: string): boolean {
        const handler = this._nodes.get(type);
        return handler ? handler.has_text : false;
    }

    public static isMultistepCreate(type: string): boolean {
        const handler = this._nodes.get(type);
        return handler ? handler.multistep_create === true : false;
    }
}

// export function nodeAdapter(type: string): INodeAdapter | undefined {
//     return NodeRegistry.adapter(type);
// }