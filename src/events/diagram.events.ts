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

/**
 * Broad compatibility event.
 */
export const DIAGRAM_CHANGED_EVENT = "diagram-changed";

export type DiagramChangeScope = "model" | "view" | "style";

export interface DiagramChanged {
    scope: DiagramChangeScope;
    sourceEvent: string;
}

export interface DiagramSelectionChange {
    node?: INode;
    nodeId?: string;
    nodes: INode[];
    nodeIds: string[];
}

export interface DiagramBackgroundClick {
    canvas: IPoint;
    world: IPoint;
}

export interface DiagramViewportChange {
    pan: IPoint;
    zoom: number;
}

export interface DiagramNodeChange {
    node: INode;
    nodeId: string;
}

export interface DiagramDeleteRequest extends DiagramSelectionChange {
    trigger?: KeyboardEvent;
}

export interface DiagramConnectionChange extends DiagramNodeChange {
    from?: IConnection["from"];
    to?: IConnection["to"];
}

export interface DiagramEditContextMenu extends DiagramBackgroundClick {
    event: PointerEvent;
    node?: INode;
    nodeId?: string;
    nodes: INode[];
    nodeIds: string[];
}

export interface DiagramToolChange {
    tool: string;
    previousTool: string;
}
