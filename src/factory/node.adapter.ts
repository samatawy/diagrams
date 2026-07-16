import type { IConnection, IConnectionAnchor, IGrid, IHandlePoint, INode } from "../interfaces";
import type { ITextOrientation, IPoint, IRect, NodeHandle, ITextBaseline, AnchorScope } from "../types";
import type { IconSource } from "./icon.registry";

export type { IconSource };

export type HollowMode = 'always' | 'never' | 'if_transparent';

export type TextOverflowMode = 'visible' | 'hidden' | 'ellipsis';

export interface TextPlacement {
    /** 
     * World-space rect for axis-aligned text (rectangles, boxes).
     */
    rect?: IRect;
    /** 
     * World-space segment for line-following text (polylines, connectors).
     */
    segment?: { from: IPoint; to: IPoint };
}

export interface SpecificOptions {
    label: string;
    readonly?: boolean;
    datatype?: 'string' | 'number' | 'boolean' | 'enum';
    options?: Record<string, {
        label: string; value: unknown
    }> | ((node: INode) => Record<string, {
        label: string; value: unknown
    }>);
}

/**
 * INodeAdapter defines the interface for handling different types of nodes in the diagram.
 * It includes methods for hit testing, rendering, and serialization/deserialization of nodes.
 */
export interface INodeAdapter {

    /**
     * The unique type name of the adapter, which is used to associate it with nodes of a specific type.
     * This type is typically registered with the NodeRegistry to enable the diagram control to find the appropriate adapter for each node.
     */
    type: string;

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
     * matching this adapter's `type`, then to a text label.
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
     * Indicates whether the adapter supports single-line text rendering within the node. 
     * If true, the text will be rendered on a single line, and any overflow will be handled according 
     * to the text_overflow property. If false or undefined, multi-line text rendering may be supported.
     */
    single_line_text?: boolean;

    /**
     * The text overflow mode determines how text that exceeds the node's bounding box is handled.
     * - 'visible': Text is allowed to overflow the node's bounding box and will be fully visible.
     * - 'hidden': Text that exceeds the node's bounding box is clipped and not visible.
     * - 'ellipsis': Text that exceeds the node's bounding box is truncated and an ellipsis ("...") is displayed to indicate that there is more text.
     * This property is used to control the visual appearance of text within the node and how it behaves when the text content is too large for the available space.
     */
    text_overflow: TextOverflowMode;

    /**
     * Returns the text orientation values this node type supports.
     * Only relevant for nodes that support text (`has_text === true`).
     * When not defined, all orientations are assumed to be supported.
     * Adapters that render text differently (e.g. curved text) should override this to return a restricted subset.
     */
    text_orientations: ITextOrientation[];

    /**
     * Returns the text baseline values this node type supports.
     * Only relevant for nodes that support text (`has_text === true`).
     * When not defined, all baselines are assumed to be supported.
     * Adapters that render text differently (e.g. curved text) should override this to return a restricted subset.
     * The baseline determines how the text is aligned vertically relative to its bounding box or path.
     * For example, 'top' aligns the top of the text with the top of the bounding box, 'middle' centers the text vertically, and 'bottom' aligns the bottom of the text with the bottom of the bounding box.
     */
    text_baselines: ITextBaseline[];

    /**
     * Specifies the connection handles that this node type supports for connecting to other nodes.
     * Each handle is represented by a NodeHandle value, which indicates the position or type of the handle on the node.
     * This property is used to determine where connections can be made to this node and how the diagram control should render connection points.
     * Adapters that support connections should override this to return the appropriate handles for their node type.
     */
    connection_handles: NodeHandle[];

    /**
     * Specifies which resize handles are available for this node type. If not defined, all resize handles are assumed to be supported.
     * Each handle is represented by a NodeHandle value, which indicates the position or type of the handle on the node.
     * This property is used to determine where the user can click and drag to resize the node and how the diagram control should render resize handles.
     * Adapters that support resizing should override this to return the appropriate handles for their node type.
     */
    resize_handles?: NodeHandle[];

    /**
     * Additional logic to determine whether a connection can be made to this node from the specified direction and handle.
     * This method is called during connection creation to validate whether a connection is allowed based on the node's state, geometry, or other criteria.
     * The target can also be used to decide whether a connection can be made. The target can be the connection iteself or the node that is being connected to. 
     * The point parameter can be used to determine the world-space coordinates of the connection point, if available.
     * Adapters that support connections should override this to implement custom connection rules.
     * @param node The node to which the connection is being made.
     * @param handle The connection handle on the node.
     * @param direction The direction of the connection, either 'from' (outgoing) or 'to' (incoming).
     * @param target The target node or connection that is being connected to, if available. This can be used to determine whether the connection is allowed based on the target's type or state.
     * @param point The world-space coordinates of the connection point, if available.
     */
    canConnectTo(node: INode, handle: NodeHandle, direction: 'from' | 'to' | 'any', target?: Partial<INode>, point?: IPoint): boolean;

    // canConnect(node: INode, direction: 'from' | 'to' | 'any', handle: NodeHandle, point?: IPoint): boolean;

    /**
     * Returns a default connection object for this node type, which can be used to create a new connection when the user 
     * initiates a connection to this node.
     */
    defaultConnection(): Partial<IConnection> | null;

    /**
     * Indicates whether the adapter supports owning a group of other nodes.
     */
    is_container?: boolean;

    /**
     * Indicates whether the adapter supports rotation of the node.
     * If true, the diagram control may provide rotation handles and allow the user to rotate the node.
     */
    can_rotate?: boolean;

    /**
     * Indicates whether the adapter supports snapping the node to a grid or guides when moving or resizing.
     * If true, the diagram control may adjust the node's position and size to align with the grid or guides.
     */
    can_snap?: boolean;

    // can_snap_points?: number[];

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
     * Any special handling to perform after a connection is made to this node, such as updating its geometry or state 
     * based on the new connection.
     * @param node The node that was connected.
     * @param direction The direction of the connection ('from' or 'to').
     * @param anchor The connection anchor involved in the connection, or null if none.
     */
    afterConnect?(node: INode, direction: 'from' | 'to', anchor: IConnectionAnchor): void;

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
    hitTest(node: INode, point: IPoint, point_as: 'pointer' | 'diagram'): NodeHandle;

    /**
     * Snaps the given node to the specified grid by modifying its points.
     * @param node The node to snap.
     * @param grid The grid to snap the node to.
     * @param handle The handle being used to resize the node.
     */
    snapToGrid(node: INode, grid: IGrid, handle?: NodeHandle): void;

    /**
     * Renders the given node on the specified canvas context.
     * @param node The node to render.
     * @param ctx The canvas rendering context to draw on.
     */
    render(node: INode, ctx: CanvasRenderingContext2D, show?: 'all' | 'quick'): void;

    /**
     * Renders the selection state of the given node on the specified canvas context.
     * @param node The node whose selection state to render.
     * @param ctx The canvas rendering context to draw on.
     * @param show Specifies whether to show all handles or connection handles.
     */
    renderSelection(node: INode, ctx: CanvasRenderingContext2D, show: AnchorScope): void;

    /**
     * Where to place the text for this node, if it has any. This is used for rendering and in-place editing.
     * @param node The node whose text placement to determine.
     * @returns The text placement information, or undefined if the node has no text.
     */
    textPlacement(node: INode): TextPlacement | undefined;

    /**
     * Returns the visual bounding rect of the node's rendered path in world coordinates.
     * For most nodes this equals the `rect` computed from their points.
     * Adapters whose paths extend beyond that rect (e.g. a document node whose
     * wavy bottom dips below the bottom edge) should override this to return the
     * true visual bounds so that cover-mode images fill the entire visible shape.
     *
     * The default implementation returns `rect` unchanged.
     *
     * @param node The node being rendered.
     * @param rect The rect derived from the node's control points.
     * @returns The visual bounding rect.
     */
    getVisualRect(node: INode, rect: IRect): IRect;

    getAnchors(node: INode, show: AnchorScope, direction?: 'from' | 'to' | 'any'): IHandlePoint[];

    geometryOptions(node: INode, path: string): SpecificOptions | undefined;

    specificOptions(node: INode, path: string): SpecificOptions | undefined;

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
