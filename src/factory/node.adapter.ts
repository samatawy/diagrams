import type { IGrid, INode } from "../interfaces";
import type { IPoint, NodeHandle } from "../types";
import type { IconSource } from "./icon.registry";

export type { IconSource };

export type HollowMode = 'always' | 'never' | 'if_transparent';

export type TextOverflowMode = 'visible' | 'hidden' | 'ellipsis';

/**
 * INodeAdapter defines the interface for handling different types of nodes in the diagram.
 * It includes methods for hit testing, rendering, and serialization/deserialization of nodes.
 */
export interface INodeAdapter {

    /**
     * The unique name of the adapter, which is used to associate it with nodes of a specific type.
     * This name is typically registered with the NodeRegistry to enable the diagram control to find the appropriate adapter for each node.
     */
    name: string;

    /**
     * Optional icon for this tool shown in the tool palette and any icon-aware UI.
     *
     * Two formats are supported:
     *
     * - **SVG string** — provide the full `<svg>` markup for the icon:
     *   ```ts
     *   icon: {
     *     type: 'svg',
     *     markup: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">...</svg>',
     *   }
     *   ```
     *
     * - **Image URL** — provide any resolvable URL (data URL, CDN, relative path):
     *   ```ts
     *   icon: { type: 'url', src: 'https://example.com/my-tool.svg' }
     *   ```
     *
     * When omitted the palette falls back to the built-in `IconRegistry` entry
     * matching this adapter's `name`, then to a text label.
     */
    icon?: IconSource;

    /**
     * Indicates whether the adapter is for a connector node, which may require special handling for rendering and hit testing.
     */
    is_connector: boolean;

    /**
     * Indicates whether the node creation process involves multiple steps, such as defining multiple points for a polyline or curve. 
     * If true, the diagram control may need to handle additional user interactions during node creation.
     */
    multistep_create?: boolean;

    /**
     * Indicates whether the node can be created by dragging from the tool palette onto the canvas.
     * If true, the adapter should implement the onCreateDraft method to provide the initial geometry of the draft node to be dragged.
     */
    drag_create?: boolean;

    /**
     * The hollow mode determines how the node's hollow property is calculated based on its fill style.
     * - 'always': The node is always hollow regardless of its fill style.
     * - 'never': The node is never hollow regardless of its fill style.
     * - 'if_transparent': The node is hollow if its fill style is 'transparent', otherwise it is not hollow.
     */
    hollow_mode: HollowMode;

    /**
     * Indicates whether the adapter supports rendering text within the node, which may affect how the node is rendered and whether text-related interactions are enabled.
     */
    has_text: boolean;

    /**
     * The text overflow mode determines how text that exceeds the node's bounding box is handled.
     * - 'visible': Text is allowed to overflow the node's bounding box and will be fully visible.
     * - 'hidden': Text that exceeds the node's bounding box is clipped and not visible.
     * - 'ellipsis': Text that exceeds the node's bounding box is truncated and an ellipsis ("...") is displayed to indicate that there is more text.
     * This property is used to control the visual appearance of text within the node and how it behaves when the text content is too large for the available space.
     */
    text_overflow: TextOverflowMode;

    /**
     * Updates the draft node's points while the user is dragging during creation.
     * Called on every pointermove while a draft is active.
     * @param node The draft node being created.
     * @param point The current world-space cursor position.
     */
    onCreateMove(node: INode, point: IPoint): void;

    /**
     * Creates and returns a new draft node for the given tool when the user initiates a drag-create action from the tool palette.
     * This will only be called if the adapter's drag_create property is true.
     * @param tool The tool identifier for which to create the draft node.
     * @returns The newly created draft node, or undefined if the draft node should not be created.
     */
    onCreateDraft?(tool: string): Partial<INode> | undefined;

    /**
     * Updates the node's size while the user is dragging a resize handle.
     * Called on every pointermove while a resize is active.
     * @param node The node being resized.
     * @param handle The handle being used to resize the node.
     */
    afterResize?(node: INode, handle: NodeHandle): void;

    /**
     * Updates a custom handle position while the user is dragging it.
     * Called on every pointermove while a handle drag is active.
     * @param node The node being altered.
     * @param point The current world-space cursor position.
     */
    onAlterMove?(node: INode, point: IPoint): void;

    /**
     * Performs a hit test on the given node with the specified point.
     * @param node The node to test.
     * @param point The point to test against the node.
     * @returns The handle of the node that was hit, or NodeHandle.NONE if no hit occurred.
     */
    hitTest(node: INode, point: IPoint): NodeHandle;

    /**
     * Snaps the given node to the specified grid by modifying its points.
     * @param node The node to snap.
     * @param grid The grid to snap the node to.
     */
    snapToGrid(node: INode, grid: IGrid): void;

    /**
     * Renders the given node on the specified canvas context.
     * @param node The node to render.
     * @param ctx The canvas rendering context to draw on.
     */
    render(node: INode, ctx: CanvasRenderingContext2D): void;

    /**
     * Renders the selection state of the given node on the specified canvas context.
     * @param node The node whose selection state to render.
     * @param ctx The canvas rendering context to draw on.
     */
    renderSelection(node: INode, ctx: CanvasRenderingContext2D): void;

    /**
     * Writes the given node to a JSON-serializable format using the provided serializer.
     * @param node The node to serialize.
     * @param serializer The serializer to use for converting the node to JSON.
     * @returns The JSON-serializable representation of the node.
     */
    write(node: INode, serializer: any): any;

    /**
     * Reads a node from the given JSON data using the provided serializer.
     * @param json The JSON data to read the node from.
     * @param serializer The serializer to use for converting the JSON data to a node.
     * @returns A promise that resolves to the deserialized node.
     */
    read(json: any, serializer: any): Promise<INode>;
}
