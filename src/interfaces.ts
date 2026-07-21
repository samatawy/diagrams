import type { Serializable } from "./io/serialized.types";
import type { ImageAlign, ImageMode } from "./types";
import type { FillStyle, ShadowStyle, StrokeStyle, TextStyle } from "./style.interfaces";
import type { IPoint, NodeHandle } from "./types";
import type { SheetRepository } from "./sheets/sheet.repository";

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
     * The optional class name of the node, which can be used to apply specific styles or behaviors to the node based on its class.
     */
    style_class?: string;

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
    strokeStyle?: StrokeStyle;

    /**
     * The fill style of the node, which can be used to control the color and pattern of the node's interior.
     */
    fillStyle?: FillStyle;

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

    /**
     * An optional geometry object that can store additional geometric properties of the node, such as width, height, or other custom measurements.
     * This can be used to extend the node's geometry beyond the basic points and provide more detailed control over its shape and size.
     * The geometry object is a key-value map where keys are property names and values can be numbers, strings, or booleans.
     * This allows for flexible storage of various geometric attributes that may be relevant to the node's rendering or interaction.
     */
    geometry?: Record<string, number | string | boolean>;

    /**
     * An optional specific object that can store additional properties specific to the node's type, 
     * allowing for customization and extension of the node's functionality but not related to its geometry.
     */
    specific?: Record<string, unknown>;

    /**
     * An optional metadata object for the node, which can be used to store additional information about the node.
     * This can include custom properties, annotations, or any other relevant data that is not related to the node's appearance.
     */
    meta?: Record<string, unknown>;
}

/**
 * IAnchorCandidate defines a candidate anchor point for a connection on a node, including the handle of the node and an optional index for a specific point on the node's geometry.
 * This interface is used to determine potential anchor points for connections when establishing relationships between nodes in the diagram.
 * It allows for flexible connection points based on the node's geometry and the desired connection style.
 */
export interface IHandlePoint {
    /**
     * The handle of the nodethat should be used (e.g., 'n', 's', 'e', 'w', etc.) 
     * For example, indicating where a connection should attach.
     */
    handle: NodeHandle;

    /**
     * The point on the node's geometry where the handle is located.
     */
    point: IPoint;
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
    index?: number;

    relative: IPoint;

    // /**
    //  * Optional pixel offsets that can be applied to the anchor point, providing additional control over the exact position of the connection attachment on the node.
    //  */
    // xOffset?: number;

    // /**
    //  * Optional pixel offsets that can be applied to the anchor point, providing additional control over the exact position of the connection attachment on the node.
    //  */
    // yOffset?: number;
}

/**
 * The IConnection interface defines the properties of a connection between nodes in the diagram, including the source and target anchors, arrow styles, and readiness state.
 * It represents the relationships between nodes and is used to determine how nodes are connected and rendered in the diagram.
 */
export interface IConnection extends INode {
    /**
     * The source anchor of the connection, which specifies where the connection starts on the source node. It includes information about the node, handle, and optional offsets.
     */
    from?: IConnectionAnchor;

    /**
     * The target anchor of the connection, which specifies where the connection ends on the target node. It includes information about the node, handle, and optional offsets.
     */
    to?: IConnectionAnchor;
}

// /**
//  * The IChildElement interface can be implemented by objects that are considered child elements of a node.
//  * Example may include icons, table rows, markdown elements, etc.
//  */
// export interface IChildElement {
// }

/**
 * The IContainer interface defines the properties of a container node in the diagram, which can own a group of nodes.
 * It includes a reference to the group it owns, allowing for hierarchical relationships between nodes and groups in the diagram.
 */
export interface IContainer {
    /**
     * The unique identifier of the group that this container owns, which allows for grouping and organizing nodes within the diagram.
     */
    owns_group: string;
}

/**
 * The IGroup interface defines the properties of a group in the diagram, including its ID and the nodes it contains.
 */
export interface IGroup {
    /**
     * The unique identifier of the group.
     */
    id: string;
    /**
     * An array of node IDs that belong to this group.
     */
    nodes: string[];
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
    /**
     * The unique identifier of the diagram, which is used to reference the diagram within the application and for serialization purposes.
     */
    id: string;

    /**
     * An array of nodes that belong to the diagram, which represent the entities and elements that can be connected and manipulated within the diagram.
     */
    nodes: INode[];

    /**
     * An optional array of groups that belong to the diagram, which can be used to organize nodes into visual collections.
     * Grouped nodes maintain their relative positions.
     */
    groups?: IGroup[];

    /**
     * An array of layers that belong to the diagram, which can be used to organize nodes into different visual layers.
     */
    layers: ILayer[];

    /**
     * An optional identifier for the sheet associated with the diagram, which can be used to apply specific styles and configurations 
     * to the diagram's nodes and connections.
     */
    sheet_id?: string;

    /**
     * An optional background fill style for the diagram, which can be used to set the background color or gradient of the diagram area.
     */
    background?: FillStyle;

    /**
     * An optional metadata object for the diagram, which can be used to store additional information about the diagram that is not part of its core structure.
     * This can include custom properties, annotations, or any other relevant data that is not related to diagram rendering.
     */
    meta?: Record<string, unknown>;

    /**
     * An optional grid configuration for the diagram, which defines the properties of the grid used for aligning and snapping nodes.
     */
    grid?: IGrid;

    node(id: string): INode | undefined;
}

/**
 * Payload for selection change events, which includes the currently selected nodes and their IDs.
 */
export interface HasSelection {
    /**
     * Returns an array of currently selected nodes in the diagram.
     * @returns An array of INode objects representing the selected nodes.
     */
    selection(): INode[];
    /**
     * Checks if a given node is currently selected in the diagram.
     * @param node The node to check for selection.
     * @returns True if the node is selected, false otherwise.
     */
    isSelected(node: INode): boolean;
    /**
     * Selects a given node in the diagram.
     * @param node The node to select.
     * @param option The selection option, either 'in_group' or 'isolated'.
     */
    select(node: INode, option: 'in_group' | 'isolated'): void;
    /**
     * Deselects a given node in the diagram.
     * @param node The node to deselect.
     * @param option The selection option, either 'in_group' or 'isolated'.
     */
    deselect(node: INode, option: 'in_group' | 'isolated'): void;
    /**
     * Clears the current selection in the diagram.
     */
    clearSelection(): void;
}

/**
 * Interface for objects that have a SheetRepository, which is responsible for managing sheets and their styles in the diagram.
 */
export interface HasSheetRepository {
    /**
     * The SheetRepository instance associated with the object, which provides methods for managing sheets.
     * Currently only diagrams have a sheet repository.
     */
    sheetRepository: SheetRepository;
}
