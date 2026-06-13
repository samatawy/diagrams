import type { IConnection, INode } from "../interfaces";
import type { IPoint } from "../types";

/**
 * View events.
 */
export const DIAGRAM_SELECTION_EVENT = "selection";
export const DIAGRAM_NODE_CLICK_EVENT = "node-click";
export const DIAGRAM_BACKGROUND_CLICK_EVENT = "background-click";
export const DIAGRAM_VIEWPORT_EVENT = "viewport-change";

/**
 * EditView events.
 */
export const DIAGRAM_DELETE_REQUEST_EVENT = "delete-request";
export const DIAGRAM_NODE_ADDED_EVENT = "node-added";
export const DIAGRAM_NODE_DELETED_EVENT = "node-deleted";
export const DIAGRAM_NODE_MOVED_EVENT = "node-moved";
export const DIAGRAM_NODE_RESIZED_EVENT = "node-resized";
export const DIAGRAM_NODE_POINTS_CHANGED_EVENT = "node-points-changed";
export const DIAGRAM_CONNECTION_CONNECTED_EVENT = "connection-connected";
export const DIAGRAM_CONNECTION_DISCONNECTED_EVENT = "connection-disconnected";
export const DIAGRAM_EDIT_CONTEXT_MENU_EVENT = "diagram-edit-contextmenu";
export const DIAGRAM_TOOL_CHANGED_EVENT = "tool-changed";
export const DIAGRAM_CLIPBOARD_EVENT = "clipboard-change";

/**
 * Broad compatibility event.
 */
export const DIAGRAM_CHANGED_EVENT = "diagram-changed";

/**
 * Defines the scope of a diagram change, which can be related to the model, view, or style of the diagram. 
 * This categorization allows for more specific handling of changes and updates within the diagram system, 
 * enabling developers to optimize performance and user experience by responding appropriately to different types of changes.
 */
export type DiagramChangeScope = "model" | "view" | "style";

/**
 * Represents a change in the diagram, including the scope of the change and the source event that triggered it.
 * This interface can be used to provide detailed information about changes occurring in the diagram, allowing for more granular handling of updates and interactions.
 */
export interface DiagramChanged {
    scope: DiagramChangeScope;
    sourceEvent: string;
}

/**
 * Defines the structure of a diagram selection change event, which includes information about the selected nodes and their IDs.
 * This interface can be used to provide detailed information about selection changes in the diagram, allowing for more specific handling of selection-related interactions and updates.
 */
export interface DiagramSelectionChange {
    /**
     * The node that is currently selected, if any. This property may be undefined if no single node is selected or if multiple nodes are selected.
     */
    node?: INode;
    /**
     * The ID of the node that is currently selected, if any. This property may be undefined if no single node is selected or if multiple nodes are selected.
     */
    nodeId?: string;
    /**
     * The nodes that are currently selected. This array may be empty if no nodes are selected.
     */
    nodes: INode[];
    /**
     * The IDs of the nodes that are currently selected. This array may be empty if no nodes are selected.
     */
    nodeIds: string[];
}

/**
 * Defines the structure of a diagram background click event, which includes the coordinates of the click in both canvas and world space.
 * This interface can be used to provide detailed information about background click interactions in the diagram, 
 * allowing for more specific handling of such events, such as deselecting nodes or opening context menus.
 */
export interface DiagramBackgroundClick {
    /**
     * The coordinates of the click in canvas space, which represents the position of the click relative to the diagram's viewport.
     */
    canvas: IPoint;
    /**
     * The coordinates of the click in world space, which represents the position of the click in the diagram's coordinate system, 
     * taking into account any transformations such as panning and zooming.
     */
    world: IPoint;
}

/**
 * Defines the structure of a diagram viewport change event, which includes information about the pan and zoom levels of the diagram's viewport.
 * This interface can be used to provide detailed information about changes to the diagram's viewport, allowing for more specific handling of such events, 
 * such as updating the display or synchronizing with other components.
 */
export interface DiagramViewportChange {
    /**
     * The pan offset of the diagram's viewport, represented as an object with x and y properties. 
     * This indicates how much the viewport has been panned from its original position.
     */
    pan: IPoint;
    /**
     * The zoom level of the diagram's viewport, represented as a number. 
     * This indicates how much the viewport has been zoomed in or out from its original scale. 
     * A zoom level of 1 typically represents the original scale, while values greater than 1 indicate zooming in and values less than 1 indicate zooming out.
     */
    zoom: number;
}

/**
 * Defines the structure of a diagram node change event, which includes information about the node that has changed and its ID.
 * This interface can be used to provide detailed information about changes to nodes in the diagram, allowing for more specific handling of such events, 
 * such as updating the display or synchronizing with other components.
 */
export interface DiagramNodeChange {
    /**
     * The node that has changed. This property may be undefined if the change is not related to a specific node or if the node information is not available.
     */
    node: INode;
    /**
     * The ID of the node that has changed. This property may be undefined if the change is not related to a specific node or if the node information is not available.
     */
    nodeId: string;
}

/**
 * Defines the structure of a diagram delete request event, which extends the diagram selection change event 
 * and includes an optional trigger property that represents the keyboard event that initiated the delete request.
 * This interface can be used to provide detailed information about delete requests in the diagram, allowing for more specific handling of such events, 
 * such as confirming the delete action or performing additional cleanup.
 */
export interface DiagramDeleteRequest extends DiagramSelectionChange {
    /**
     * The keyboard event that triggered the delete request, if applicable. 
     * This property may be undefined if the delete request was not initiated by a keyboard event or if the event information is not available.
     */
    trigger?: KeyboardEvent;
}

/**
 * Defines the structure of a diagram connection change event, which extends the diagram node change event and includes information about the connection's endpoints.
 * This interface can be used to provide detailed information about changes to connections in the diagram, allowing for more specific handling of such events, 
 * such as updating the display or synchronizing with other components.
 */
export interface DiagramConnectionChange extends DiagramNodeChange {
    /**
     * The source anchor of the connection, if applicable. 
     * This property may be undefined if the change is not related to a connection or if the anchor information is not available.
     */
    from?: IConnection["from"];
    /**
     * The target anchor of the connection, if applicable. 
     * This property may be undefined if the change is not related to a connection or if the anchor information is not available.
     */
    to?: IConnection["to"];
}

/**
 * Defines the structure of a diagram edit context menu event, which extends the diagram background click event and includes information about the node(s) 
 * involved in the context menu interaction.
 */
export interface DiagramEditContextMenu extends DiagramBackgroundClick {
    /**
     * The pointer event that triggered the context menu interaction. 
     * This property provides access to the original pointer event, allowing for more specific handling of the context menu interaction,
     */
    event: PointerEvent;
    /**
     * The node that is the target of the context menu interaction, if applicable. 
     * This property may be undefined if the context menu was triggered on the background or if the node information is not available.
     */
    node?: INode;
    /**
     * The ID of the node that is the target of the context menu interaction, if applicable.
     * This property may be undefined if the context menu was triggered on the background or if the node information is not available.
     */
    nodeId?: string;
    /**
     * The nodes that are involved in the context menu interaction, if applicable. 
     * This array may be empty if the context menu was triggered on the background or if the node information is not available.
     */
    nodes: INode[];
    /**
     * The IDs of the nodes that are involved in the context menu interaction, if applicable.
     * This array may be empty if the context menu was triggered on the background or if the node information is not available.
     */
    nodeIds: string[];
}

/**
 * Defines the structure of a diagram tool change event, which includes information about the new tool and the previous tool.
 * This interface can be used to provide detailed information about tool changes in the diagram, allowing for more specific handling of such events, 
 * such as updating the display or synchronizing with other components.
 */
export interface DiagramToolChange {
    /**
     * The new tool that has been selected or activated in the diagram. 
     * This property represents the current tool that is being used for interactions in the diagram.
     */
    tool: string;
    /**
     * The previous tool that was active in the diagram. 
     * This property represents the tool that was being used before the current tool was selected or activated.
     */
    previousTool: string;
}

/**
 * Clipboard operations emitted by the editor.
 */
export type DiagramClipboardOperation = "copy" | "cut" | "paste";

/**
 * Defines the structure of a diagram clipboard event.
 */
export interface DiagramClipboardEventDetail {
    /**
     * The clipboard operation that produced this event.
     * Can be one of "copy", "cut", or "paste".
     */
    operation: DiagramClipboardOperation;
    /**
     * Whether a paste action is currently possible.
     */
    canPaste: boolean;
    /**
     * The first node involved in the operation, if any.
     */
    node?: INode;
    /**
     * The ID of the first node involved in the operation, if any.
     */
    nodeId?: string;
    /**
     * All nodes involved in the operation.
     */
    nodes: INode[];
    /**
     * IDs of nodes involved in the operation.
     */
    nodeIds: string[];
}
