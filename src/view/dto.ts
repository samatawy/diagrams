import type { IConnection, INode } from "../interfaces";
import type { IPoint } from "../types";

/**
 * View events.
 */

/**
 * Emitted when the current selection changes.
 */
export const DIAGRAM_SELECTION_EVENT = 'selection';

/**
 * Emitted when a node is clicked in view or select mode.
 */
export const DIAGRAM_NODE_CLICK_EVENT = 'node-click';

/**
 * Emitted when the background is clicked.
 */
export const DIAGRAM_BACKGROUND_CLICK_EVENT = 'background-click';

/**
 * Emitted when the pan portion of the viewport changes.
 */
export const DIAGRAM_PAN_EVENT = 'pan-change';

/**
 * Emitted when the zoom portion of the viewport changes.
 */
export const DIAGRAM_ZOOM_EVENT = 'zoom-change';

/**
 * Emitted when any viewport property changes.
 */
export const DIAGRAM_VIEWPORT_EVENT = 'viewport-change';

/**
 * EditView events.
 */

/**
 * Emitted before deleting the current selection.
 *
 * This event is cancelable. Call `preventDefault()` to block deletion.
 */
export const DIAGRAM_DELETE_REQUEST_EVENT = 'delete-request';

/**
 * Emitted when a node is added to the diagram.
 */
export const DIAGRAM_NODE_ADDED_EVENT = 'node-added';

/**
 * Emitted when a node is deleted from the diagram.
 */
export const DIAGRAM_NODE_DELETED_EVENT = 'node-deleted';

/**
 * Emitted after one or more selected nodes are moved.
 */
export const DIAGRAM_NODE_MOVED_EVENT = 'node-moved';

/**
 * Emitted after one or more selected nodes are resized.
 */
export const DIAGRAM_NODE_RESIZED_EVENT = 'node-resized';

/**
 * Emitted after a node's point collection changes or a point is moved.
 */
export const DIAGRAM_NODE_POINTS_CHANGED_EVENT = 'node-points-changed';

/**
 * Emitted when a connector establishes or updates an anchor connection.
 */
export const DIAGRAM_CONNECTION_CONNECTED_EVENT = 'connection-connected';

/**
 * Emitted when a connector loses an anchor connection.
 */
export const DIAGRAM_CONNECTION_DISCONNECTED_EVENT = 'connection-disconnected';

/**
 * Emitted when the edit view surface receives a context-menu request.
 */
export const DIAGRAM_EDIT_CONTEXT_MENU_EVENT = 'diagram-edit-contextmenu';

/**
 * Emitted when the active editing tool changes.
 */
export const DIAGRAM_TOOL_CHANGED_EVENT = 'tool-changed';

/**
 * Shared payload and option types.
 */

/**
 * Horizontal alignment options for fit-to-view operations.
 */
export type HorizontalAlign = 'left' | 'center' | 'right';

/**
 * Vertical alignment options for fit-to-view operations.
 */
export type VerticalAlign = 'top' | 'center' | 'bottom';

/**
 * Alignment options used by fit-to-width and fit-to-nodes operations.
 */
export interface FitAlign {
    horizontal?: HorizontalAlign;
    vertical?: VerticalAlign;
}

/**
 * Payload for selection-related events.
 *
 * `nodes` and `nodeIds` are the canonical fields for all selection modes.
 * `node` and `nodeId` are convenience aliases for the primary selected node.
 */
export interface DiagramSelectionChange {
    node?: INode;
    nodeId?: string;
    nodes: INode[];
    nodeIds: string[];
}

/**
 * Payload for background click events.
 */
export interface DiagramBackgroundClick {
    canvas: IPoint;
    world: IPoint;
}

/**
 * Payload for viewport-related events.
 */
export interface DiagramViewportChange {
    pan: IPoint;
    zoom: number;
}

/**
 * Payload for single-node mutation events.
 */
export interface DiagramNodeChange {
    node: INode;
    nodeId: string;
}

/**
 * Payload for delete-request events.
 */
export interface DiagramDeleteRequest extends DiagramSelectionChange {
    trigger?: KeyboardEvent;
}

/**
 * Payload for connector mutation events.
 */
export interface DiagramConnectionChange extends DiagramNodeChange {
    from?: IConnection['from'];
    to?: IConnection['to'];
}

/**
 * Payload for edit view context-menu events.
 */
export interface DiagramEditContextMenu extends DiagramBackgroundClick {
    event: PointerEvent;
    node?: INode;
    nodeId?: string;
    nodes: INode[];
    nodeIds: string[];
}

/**
 * Payload for tool-change events.
 */
export interface DiagramToolChange {
    tool: string;
    previousTool: string;
}

/**
 * Initial view modes for DiagramView. Determines how the viewport is set when the diagram is first loaded.
 */
export type InitialViewMode = 'saved' | 'fit-width' | 'fit-all';

/**
 * Selection options to define how selection works in the diagram view. 
 * This can be used to enable or disable selection, multi-selection, and rectangular selection, 
 * as well as to specify how rectangular selection should determine which nodes are selected.
 */
export interface DiagramSelectionOptions {
    enable_select: boolean;
    enable_multi: boolean;
    enable_rect: boolean;
    rect_mode: 'include' | 'touch';
}

/**
 * Initial viewport settings for a diagram view.
 */
export interface DiagramInitialView {
    mode?: InitialViewMode;
    pan?: IPoint;
    zoom?: number;
    padding?: number;
    alignment?: FitAlign;
}

/**
 * Construction options for `DiagramView` and subclasses.
 */
export interface DiagramViewOptions {
    initialView?: DiagramInitialView;
    selectedNodeId?: string;
    selectedNodeIds?: string[];
    selection?: DiagramSelectionOptions,
}