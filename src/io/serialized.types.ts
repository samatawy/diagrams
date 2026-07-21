import type { IConnectionAnchor, IGrid, INode } from "../interfaces";
// import type { EmbeddedSheet } from "../sheets/spec.sheet";
import type { FillStyle } from "../style.interfaces";

/**
 * An ISerializer defines the methods for serializing and deserializing data, allowing objects to be converted to and from a string representation.
 */
export interface ISerializer {
    write(data: unknown): string;
    read<T>(data: string): Promise<T>;
}

/**
 * The Serializable interface defines the contract for objects that can be serialized and deserialized using an ISerializer.
 * It requires implementing a write method that converts the object to a serializable format, and a read method that reconstructs the object from its serialized representation.
 */
export interface Serializable {
    write(serializer: ISerializer): any;
    read(json: any, serializer: ISerializer): Promise<this>;
}

/**
 * Serialized representation of a connection anchor, where the 'node' property is represented by the node's identifier instead of a reference to the node object. 
 * This format is suitable for JSON serialization and deserialization.
 */
export interface ISerializedConnectionAnchor extends Omit<IConnectionAnchor, 'node'> {
    node: string;
}

/**
 * Serialized representation of a node, suitable for JSON serialization. 
 * The 'owner' property is not serialized, and connection anchors are represented with their own serialized format.
 */
export interface ISerializedNode extends Omit<INode, 'owner'> {
    from?: ISerializedConnectionAnchor;
    to?: ISerializedConnectionAnchor;
}

/**
 * Serialized representation of a group, containing its identifier and the identifiers of the nodes it contains.
 */
export interface ISerializedGroup {
    id: string;
    nodes: string[];
}

/**
 * Serialized representation of a layer, containing its identifier, name, visibility status, and the identifiers of the nodes it contains.
 */
export interface ISerializedLayer {
    id: string;
    name: string;
    visible: boolean;
    nodes: string[];
}

/**
 * Serialized representation of a diagram, containing its identifier, nodes, layers, metadata, and optional grid settings.
 */
export interface ISerializedDiagram {
    id: string;
    nodes: ISerializedNode[];
    groups?: ISerializedGroup[];
    layers: ISerializedLayer[];
    sheet_id?: string;
    // sheet?: EmbeddedSheet;
    background?: FillStyle;
    meta?: Record<string, unknown>;
    image_assets?: Record<string, string>;
}
