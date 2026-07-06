import type { IPoint } from "../types";

/**
 * Horizontal alignment options for fit-to-view operations.
 */
export type HorizontalAlign = "left" | "center" | "right";

/**
 * Vertical alignment options for fit-to-view operations.
 */
export type VerticalAlign = "top" | "center" | "bottom";

/**
 * Alignment options used by fit-to-width and fit-to-nodes operations.
 */
export interface FitAlign {
    horizontal?: HorizontalAlign;
    vertical?: VerticalAlign;
}

/**
 * Initial view modes for DiagramView. Determines how the viewport is set when the diagram is first loaded.
 */
export type InitialViewMode = "saved" | "fit-horizontally" | "fit-all";

/**
 * Selection options to define how selection works in the diagram view.
 */
export interface DiagramSelectionOptions {
    enable_select: boolean;
    enable_multi: boolean;
    enable_rect: boolean;
    rect_mode: "include" | "touch";
}

/**
 * Options for rendering and snapping guides in the diagram view.
 */
export interface DiagramGuideOptions {
    render: boolean;
    snap: boolean;
    render_threshold?: number;
    snap_threshold?: number;
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
 * Construction options for DiagramView and subclasses.
 */
export interface DiagramViewOptions {
    initialView?: DiagramInitialView;
    selectedNodeId?: string;
    selectedNodeIds?: string[];
    selection?: DiagramSelectionOptions;
    guides?: DiagramGuideOptions;
    /**
     * Canvas background color for DiagramView rendering. Use 'transparent' to keep the canvas clear.
     */
    canvasBackgroundColor?: string;
}
