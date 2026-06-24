import type { Serializable } from "./io/serialized.types";
import type { ArrowDirection, ImageAlign, ImageMode } from "./types";
import type { ShadowStyle, TextStyle } from "./style.interfaces";
import type { IPoint, NodeHandle } from "./types";

/**
 * INode defines the properties of a node in the diagram, including its ID, type, geometry (points), text properties, styling options, and its relationship to the diagram it belongs to.
 * Nodes are the fundamental building blocks of the diagram, representing entities that can be connected and manipulated.
 */
export interface INode {
    /**
     * The unique identifier of the node, which is used to reference the node within the diagram and for serialization purposes.
     */
    id: string;

    /**
     * The type of the node, which can be used to determine how the node is rendered and interacted with.
     */
    type: string;

    /**
     * A reference to the diagram that owns this node, which allows the node to access diagram-level information and functionality.
     * This is typically set when the node is added to a diagram but not serialized.
     */
    owner: IDiagram;

    /**
     * The points that define the geometry of the node, which can be used for rendering and for determining how connections attach to the node.
     */
    points: IPoint[],

    /**
     * The text content of the node, which can be displayed within the node's bounding box. 
     */
    text?: string,

    /**
     * The text style properties of the node, which can be used to control the appearance of the node's text, 
     * including font, size, color, alignment, and baseline.
     */
    textStyle?: TextStyle;

    /**
     * The ID of the image source stored in the diagram-level image_assets dictionary.
     */
    image_id?: string;

    /**
     * The mode for rendering the image within the node, which can be:
     * - 'contain': The image is scaled to fit within the node's area while maintaining its aspect ratio.
     * - 'cover': The image is scaled to cover the node's area while maintaining its aspect ratio.
     * - 'pattern': The image is repeated to fill the node's area, creating a pattern effect.
     * - 'fit': The image is drawn once within the node's bounding box, without scaling.
     * - 'none': The image is not rendered within the node.
     */
    image_mode?: ImageMode;

    /**
     * The padding in pixels between the image and the node's borders, used when mode is 'contain'.
     */
    image_padding?: number;

    /**
     * Alignment of the image within the node, used when mode is 'contain'. 
     */
    image_align?: ImageAlign;

    /**
     * Indicates whether the node is ready to be rendered, which can be used to control the creation process
     * and ensure that all necessary information is available before finalizing creation.
     */
    ready?: boolean;

    /**
     * Indicates whether the node is locked, which can be used to prevent any modifications to the node's properties or geometry.
     */
    locked?: boolean;

    /**
     * Indicates whether the node's aspect ratio is locked, which can be used to maintain the original proportions of the node when resizing.
     */
    locked_aspect?: boolean;

    /**
     * Indicates whether the whole area of the node is selectable or only its border.
     */
    hollow?: boolean;

    /**
     * Indicates whether the node is invisible, which can be used to control the rendering style of the node.
     */
    invisible?: boolean;

    /**
     * The stroke style of the node, which can be used to control the color and pattern of the node's border.
     */
    strokeStyle: string;

    /**
     * The fill style of the node, which can be used to control the color and pattern of the node's interior.
     */
    fillStyle?: string;

    /**
     * The line width of the node's border, which can be used to control the thickness of the node's outline.
     */
    lineWidth?: number;

    arrow?: ArrowDirection;

    /**
     * The shadow style of the node, which can be used to apply a shadow effect to the node.
     */
    shadowStyle?: ShadowStyle;

    /**
     * The opacity of the node, from 0 (fully transparent) to 100 (fully opaque).
     * Defaults to 100 when not set.
     */
    opacity?: number;

    /**
     * The rotation angle of the node, which can be used to rotate the node around its center.
     */
    angle?: number;
    // The following are cached in the diagram's ViewCache
    // cos?: number;
    // sin?: number;

    geometry?: Record<string, number | string | boolean>;

    meta?: Record<string, unknown>;
}

/**
 * IConnectionAnchor defines the properties of an anchor point for a connection, including the node it is attached to, the handle of the node, 
 * and optional properties for specifying the exact point on the node where the connection should attach (such as a specific point index or offsets).
 * This interface is used to determine how connections are anchored to nodes in the diagram, 
 * allowing for flexible connection points based on the node's geometry and the desired connection style.
 */
export interface IConnectionAnchor {
    /**
     * The node to which the connection anchor is attached, specified by either the node's ID or a reference to the INode object.
     */
    node: string | INode;

    /**
     * The handle of the node that the connection is anchored to, which indicates the specific part of the node (e.g., 'n', 's', 'e', 'w', etc.) where the connection should attach.
     */
    handle: NodeHandle;

    /**
     * An optional index specifying a particular point on the node's geometry to anchor to, allowing for more precise connection points beyond just the handles.
     */
    point?: number;

    /**
     * Optional pixel offsets that can be applied to the anchor point, providing additional control over the exact position of the connection attachment on the node.
     */
    xOffset?: number;

    /**
     * Optional pixel offsets that can be applied to the anchor point, providing additional control over the exact position of the connection attachment on the node.
     */
    yOffset?: number;
}

/**
 * The IConnection interface defines the properties of a connection between nodes in the diagram, including the source and target anchors, arrow styles, and readiness state.
 * It represents the relationships between nodes and is used to determine how nodes are connected and rendered in the diagram.
 */
export interface IConnection {
    /**
     * The source anchor of the connection, which specifies where the connection starts on the source node. It includes information about the node, handle, and optional offsets.
     */
    from?: IConnectionAnchor;

    /**
     * The target anchor of the connection, which specifies where the connection ends on the target node. It includes information about the node, handle, and optional offsets.
     */
    to?: IConnectionAnchor;
}

/**
 * The ILayer interface defines the properties of a layer in the diagram, including its ID, name, visibility, and the nodes it contains.
 */
export interface ILayer {
    /**
     * The unique identifier of the layer.
     */
    id: string;

    /**
     * The name of the layer.
     */
    name: string;

    /**
     * A boolean indicating whether the layer is visible.
     */
    visible: boolean;

    /**
     * An array of node IDs that belong to this layer.
     */
    nodes: string[];
}

/**
 * The IGrid interface defines the properties of the grid used in the diagram. 
 * It includes options for forcing nodes to snap to the grid, toggling grid visibility, and customizing the grid's color and cell size.
 */
export interface IGrid {
    /**
     * A boolean indicating whether nodes should be forced to snap to the grid, which can help maintain alignment and consistency in the diagram layout.
     */
    forced: boolean;

    /**
     * A boolean indicating whether the grid should be visible, which can assist users in aligning nodes and understanding the spatial relationships in the diagram.
     */
    visible: boolean;

    /**
     * The color of the grid lines, which can be customized to improve visibility or match the overall design of the diagram.
     */
    color: string;

    /**
     * The size of the grid cells in pixels, which determines the spacing of the grid lines and can affect how nodes snap to the grid.
     */
    // cell_size: number;

    /**
     * The width of the grid cell in pixels.
     */
    width: number;

    /**
     * The height of the grid cell in pixels.
     */
    height: number;
}

/**
 * IDiagram defines the main interface for a diagram, which includes nodes, layers, and a grid. 
 * It also includes methods for managing nodes and layers, as well as serialization and deserialization of the diagram.
 * The diagram serves as the central data structure that holds all the information about the nodes, layers, and their relationships.
 */
export interface IDiagram extends Serializable {
    id: string;
    nodes: INode[];
    layers: ILayer[];
    background?: string;
    meta?: Record<string, unknown>;
    grid?: IGrid;

    node(id: string): INode | undefined;
}

/**
 * Payload for selection change events, which includes the currently selected nodes and their IDs.
 */
export interface HasSelection {
    selection(): INode[];
    isSelected(node: INode): boolean;
    select(node: INode): void;
    deselect(node: INode): void;
    clearSelection(): void;
}
