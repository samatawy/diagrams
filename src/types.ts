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
 * Text orientation options for nodes, which determine the direction in which the text is rendered.
 * - horizontal: Renders text in a standard horizontal orientation.
 * - vertical: Renders text in a vertical orientation, typically rotated 90 degrees.
 * - path: Renders text along a specified path, allowing for curved or angled text placement.
 * This property is useful for creating visually dynamic diagrams where text needs to follow specific shapes or directions.
 * For example, text can be oriented along a curved connection line or around a circular node.
 */
export type ITextOrientation = 'horizontal' | 'vertical' | 'path';

/**
 * Font weight options for text within nodes, represented as numeric values corresponding to standard font weights.
 */
export type IFontWeight = 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;

/**
 * ImageAlign defines the possible alignments for images within nodes. The options are:
 * - 'center': The image is centered within the node.
 * - 'top': The image is aligned to the top edge of the node.
 * - 'bottom': The image is aligned to the bottom edge of the node.
 * - 'left': The image is aligned to the left edge of the node.
 * - 'right': The image is aligned to the right edge of the node.
 * - 'top-left': The image is aligned to the top-left corner of the node.
 * - 'top-right': The image is aligned to the top-right corner of the node.
 * - 'bottom-left': The image is aligned to the bottom-left corner of the node.
 * - 'bottom-right': The image is aligned to the bottom-right corner of the node.
 * This property allows for flexible positioning of images within nodes, enabling both decorative and functional use of images in diagrams.
 */
export type ImageAlign = 'center' | 'top' | 'bottom' | 'left' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

/**
 * ImageMode defines how an image is rendered within a node. The options are:
 * - 'contain': The image is scaled to fit within the node's area while maintaining its aspect ratio.
 * - 'cover': The image is scaled to cover the node's area while maintaining its aspect ratio.
 * - 'pattern': The image is repeated to fill the node's area, creating a pattern effect.
 * - 'fit': The image is drawn once within the node's bounding box, without scaling.
 * - 'none': The image is not rendered within the node.
 * This property allows for flexible use of images in nodes, enabling both decorative patterns and single-image frames depending on the desired visual style.
 */
export type ImageMode = 'contain' | 'cover' | 'pattern' | 'fit' | 'none';

/**
 * LineDash defines the possible styles for dashed lines in connections between nodes. The options are:
 * - 'solid': A solid line with no dashes.
 * - 'dashed': A line with a standard dash pattern.
 * - 'dotted': A line with a dotted pattern.
 * - 'dashdot': A line with a dash-dot pattern.
 * - number[]: A custom dash pattern defined by an array of numbers, where each number represents the length of dashes and gaps in the pattern.
 * This property allows for visual differentiation of connections between nodes, enabling users to convey different types of relationships or flows in the diagram through line styling.
 */
export type LineDash = 'solid' | 'dashed' | 'dotted' | 'dashdot' | number[];

/**
 * ArrowDirection defines the possible directions for arrows on connections between nodes. The options are:
 * - 'start': An arrow is drawn at the starting point of the connection.
 * - 'end': An arrow is drawn at the ending point of the connection.
 * - 'both': Arrows are drawn at both the starting and ending points of the connection.
 * - 'none': No arrows are drawn on the connection.
 * This property allows for clear visual indication of the directionality of connections between nodes in the diagram, which can be important for understanding flow and relationships.
 */
export type ArrowDirection = 'start' | 'end' | 'both' | 'none';

/**
 * NodeHandle represents the different types of handles that can be used for manipulating nodes in the diagram.
 * - MOVE: A handle for moving the entire node.
 * - POINT: A handle for manipulating individual points of a node (e.g., for a polyline).
 * - ROTATE: A handle for rotating the node.
 * - ALTER: A handle for altering the geometry of the node.
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
    ALTER = 'alter',
    NONE = 'none'
}
