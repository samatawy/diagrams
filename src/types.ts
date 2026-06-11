/**
 * A single point in 2D space, defined by its x and y coordinates.
 */
export interface IPoint {
    x: number;
    y: number;
}

/**
 * A single point in 2D space that serves as an anchor for connections, defined by its ID and coordinates.
 */
export interface AnchorPoint extends IPoint {
    id: string;
}

/**
 * A rectangle defined by its left and top coordinates, as well as its width and height. 
 * This is commonly used for bounding boxes and layout calculations.
 */
export interface IRect {
    left: number;
    top: number;
    width: number;
    height: number;
}

/**
 * Text alignment options for nodes, which determine how the text is aligned horizontally within the node's bounding box.
 * - left: Aligns text to the left edge of the node.
 * - center: Centers text horizontally within the node.
 * - right: Aligns text to the right edge of the node.
 */
export type ITextAlign = 'left' | 'center' | 'right';

/**
 * Text baseline options for nodes, which determine how the text is aligned vertically within the node's bounding box.
 * - top: Aligns text to the top edge of the node.
 * - middle: Centers text vertically within the node.
 * - bottom: Aligns text to the bottom edge of the node.
 */
export type ITextBaseline = 'top' | 'middle' | 'bottom';

/**
 * NodeHandle represents the different types of handles that can be used for manipulating nodes in the diagram.
 * - MOVE: A handle for moving the entire node.
 * - POINT: A handle for manipulating individual points of a node (e.g., for a polyline).
 * - ROTATE: A handle for rotating the node.
 * - N, S, E, W: Handles for resizing the node from the north, south, east, and west sides, respectively.
 * - NE, NW, SE, SW: Handles for resizing the node from the northeast, northwest, southeast, and southwest corners, respectively.
 * - NONE: Indicates that no handle is active or selected.
 * These handles are used to determine how user interactions affect the node, such as dragging to move, resize, or rotate the node based on the active handle.
 * The specific behavior of each handle is defined in the node's interaction logic and rendering code.
 * For example, dragging the MOVE handle would translate the node's position, while dragging a corner handle like NE would resize the node while maintaining its aspect ratio.
 */
export enum NodeHandle {
    MOVE = 'move',
    POINT = 'point',
    ROTATE = 'rotate',
    N = 'n',
    S = 's',
    E = 'e',
    W = 'w',
    NE = 'ne',
    NW = 'nw',
    SE = 'se',
    SW = 'sw',
    NONE = 'none'
}
