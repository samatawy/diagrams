import type { IConnection, IConnectionAnchor, IDiagram, ILayer, INode } from "../interfaces";
import type { ISerializer, ISerializedConnectionAnchor, ISerializedDiagram, ISerializedLayer, ISerializedNode } from '../io/serialized.types';
import { jsonSerializer } from '../io/json.serializer';
import { downloadTextFile, exportTextBlob, isBrowserRuntime } from '../io/browser.support';
import { isNodeRuntime, writeTextFile } from '../io/node.support';
import type { DiagramExportFormat, DiagramSaveOptions } from "../io/export.types";
import { AssetStore } from "../view/asset.store";
import type { ImageMode } from "../types";


/**
 * A diagram is the core data structure that holds all nodes, layers, and metadata.
 * It provides methods for managing these elements and supports serialization and deserialization for persistence and data exchange.
 * 
 * It does not support viewing. For that, use DiagramView which extends this base model and adds rendering, selection, and interaction capabilities.
 * It does not support editing. For that, use DiagramController which manages user interactions and updates the Diagram model accordingly.
 */
export class Diagram implements IDiagram {

    public id: string;

    public nodes: INode[];

    public layers: ILayer[] = [];

    public background?: string;

    public meta?: Record<string, any>;

    private readonly asset_store = new AssetStore();

    public get image_assets(): Record<string, string> {
        return this.asset_store.snapshot() ?? {};
    }

    constructor(id: string, initial?: Partial<Omit<IDiagram, 'id'>>) {
        this.id = id;
        this.nodes = [];
        this.layers = initial?.layers ? initial.layers.map(layer => this.createLayer(layer.id, layer.name, layer.visible, layer.nodes)) : [];
        this.background = initial?.background;
        this.meta = initial?.meta ? { ...initial.meta } : undefined;

        if (initial?.nodes) {
            for (const node of initial.nodes) {
                this.upsertNode(node);
            }
        }
    }

    /**
     * Releases model-managed resources.
     */
    public destroy(): void {
        this.asset_store.destroy();
    }

    // ======================================
    // ========== Model management methods ==========
    // ======================================

    /**
     * Retrieves a node by its ID.
     * @param id The ID of the node to retrieve.
     * @returns The node with the specified ID, or undefined if not found.
     */
    public node(id: string): INode | undefined {
        return this.nodes.find(node => node.id === id);
    }

    /**
     * Retrieves a layer by its ID.
     * @param id The ID of the layer to retrieve.
     * @returns The layer with the specified ID, or undefined if not found.
     */
    public layer(id: string): ILayer | undefined {
        return this.layers.find(layer => layer.id === id);
    }

    /**
     * Inserts a new node or updates an existing node in the diagram.
     * @param node The node to upsert.
     * @returns The upserted node.
     */
    public upsertNode(node: INode): INode {
        node.owner = this;
        const existingIndex = this.nodes.findIndex(existing => existing.id === node.id);

        if (existingIndex >= 0) {
            this.nodes[existingIndex] = node;
        } else {
            this.nodes.push(node);
        }
        return node;
    }

    /**
     * Inserts a new layer or updates an existing layer in the diagram.
     * @param layer The layer to upsert, or the ID of the layer to create.
     * @returns The upserted layer.
     */
    public upsertLayer(layer: string | ILayer): ILayer {
        const _layer = (typeof layer === 'string')
            ? this.createLayer(layer)
            : layer;

        const existingIndex = this.layers.findIndex(existing => existing.id === _layer.id);

        if (existingIndex >= 0) {
            this.layers[existingIndex] = _layer;
        } else {
            this.layers.push(_layer);
        }
        return _layer;
    }

    /**
     * Deletes a node from the diagram.
     * @param nodeId The ID of the node to delete.
     */
    public deleteNode(nodeId: string): void {
        for (const node of this.nodes) {
            const connection = node as INode & IConnection;

            if (this.anchorTargetsNode(connection.from, nodeId)) {
                connection.from = undefined;
            }
            if (this.anchorTargetsNode(connection.to, nodeId)) {
                connection.to = undefined;
            }
        }

        this.nodes = this.nodes.filter(node => node.id !== nodeId);
        this.layers = this.layers.map(layer => this.createLayer(
            layer.id,
            layer.name,
            layer.visible,
            layer.nodes.filter(id => id !== nodeId),
        ));
    }

    /**
     * Deletes a layer from the diagram.
     * @param layerId The ID of the layer to delete.
     */
    public deleteLayer(layerId: string): void {
        this.layers = this.layers.filter(layer => layer.id !== layerId);
    }

    /**
     * Assigns an image source to a node for background/content rendering.
     */
    public setNodeImageSource(node: string | INode, imageSrc: string, mode: ImageMode = 'contain', imageId?: string): INode | undefined {
        const target = this.resolveNode(node);
        if (!target || !imageSrc) {
            return target;
        }

        this.applyNodeImageSource(target, imageSrc, mode, imageId);
        return target;
    }

    /**
     * Assigns SVG markup or SVG source URL/data URL to a node.
     * Raw SVG markup is converted to a data URL.
     */
    public setNodeSvgSource(node: string | INode, svgOrSrc: string, mode: ImageMode = 'contain', imageId?: string): INode | undefined {
        const source = this.toSvgSource(svgOrSrc);
        return this.setNodeImageSource(node, source, mode, imageId);
    }

    /**
     * Removes image source and rendering mode from a node.
     */
    public clearNodeImageSource(node: string | INode): INode | undefined {
        const target = this.resolveNode(node);
        if (!target) {
            return target;
        }

        target.image_id = undefined;
        target.image_mode = 'none';
        return target;
    }
    /**
     * Resolves the concrete image source for a node image reference.
     */
    public resolveNodeImageSource(node: string | INode): string | undefined {
        const target = this.resolveNode(node);
        if (!target) {
            return undefined;
        }

        if (!target.image_id) {
            return undefined;
        }

        return this.asset_store.resolve(target.image_id);
    }

    /**
     * The diagram's asset store, for registering and resolving image/SVG asset sources.
     */
    public get assetStore(): AssetStore {
        return this.asset_store;
    }

    /**
     * Clears all in-memory image assets. Intended for teardown paths.
     */
    public clearImageAssets(): void {
        this.asset_store.clear();
    }

    /**
     * Clears all nodes, layers, metadata, and assets from the diagram, effectively resetting it to an empty state while retaining the same ID. 
     * Intended for reuse scenarios where the diagram instance should be preserved but its content should be cleared.
     */
    public clear(): void {
        this.nodes = [];
        this.layers = [];
        this.deleteMeta();
        this.asset_store.clear();
    }

    // ======================================
    // ========== Metadata methods ==========
    // ======================================

    /**
     * Gets the metadata object for the diagram. If no metadata exists, an empty object is returned.
     * @returns The metadata object for the diagram.
     */
    public get metadata(): Record<string, any> {
        return this.meta || {};
    }

    /**
     * Sets the metadata object for the diagram. If a null or undefined value is provided, the metadata is cleared.
     * @param data The metadata object to set for the diagram.
     */
    public set metadata(data: Record<string, any>) {
        this.meta = data || {};
    }

    /**
     * Gets the value of a specific metadata key for the diagram.
     * @param key The key of the metadata to retrieve.
     * @returns The value of the specified metadata key, or undefined if the key does not exist.
     */
    public getMeta(key?: string): any {
        return key ? (this.meta ? this.meta[key] : undefined) : this.meta;
    }

    /**
     * Sets the value of a specific metadata key for the diagram.
     * @param key The key of the metadata to set.
     * @param value The value to set for the specified metadata key.
     */
    public setMeta(key: string, value: any): void {
        if (!this.meta) {
            this.meta = {};
        }
        this.meta[key] = value;
    }

    /**
     * Deletes a specific metadata key from the diagram.
     * @param key The key of the metadata to delete. If not provided, all metadata for the diagram is deleted.
     */
    public deleteMeta(key?: string): void {
        if (this.meta) {
            if (key) {
                delete (this.meta[key]);
            } else {
                this.meta = undefined;
            }
        }
    }

    /**
     * Gets the value of a specific metadata key for a node.
     * @param node The node or node ID to retrieve metadata from.
     * @param key The key of the metadata to retrieve.
     * @returns The value of the specified metadata key, or undefined if the key does not exist.
     */
    public getNodeMeta(node: string | INode, key: string): any {
        const target = this.resolveNode(node);
        if (!target || !target.meta) {
            return undefined;
        }
        return target.meta[key];
    }

    /**
     * Sets the value of a specific metadata key for a node.
     * @param node The node or node ID to set metadata for.
     * @param key The key of the metadata to set.
     * @param value The value to set for the specified metadata key.
     */
    public setNodeMeta(node: string | INode, key: string, value: any): void {
        const target = this.resolveNode(node);
        if (!target) {
            return;
        }

        if (!target.meta) {
            target.meta = {};
        }
        target.meta[key] = value;
    }

    /**
     * Deletes a specific metadata key from a node.
     * @param node The node or node ID to delete metadata from.
     * @param key The key of the metadata to delete. If not provided, all metadata for the node is deleted.
     */
    public deleteNodeMeta(node: string | INode, key?: string): void {
        const target = this.resolveNode(node);
        if (!target || !target.meta) {
            return;
        }
        if (key) {
            delete (target.meta[key]);
        } else {
            target.meta = undefined;
        }
    }


    // ======================================
    // ========== I/O methods ==========
    // ======================================

    /**
     * Loads the diagram data from a serialized JSON object.
     * @param source The serialized diagram data.
     * @param serializer The serializer to use for reading the data (optional if source is already an object).
     * @returns The diagram instance.
     * @throws An error if the input is an invalid JSON string or if the parsed JSON is null or undefined.
     */
    public async read(source: string | ISerializedDiagram, serializer?: ISerializer): Promise<this> {
        let json: ISerializedDiagram;
        if (typeof source === 'string') {
            try {
                serializer = serializer ?? jsonSerializer;
                json = await serializer.read<ISerializedDiagram>(source);
                if (!json) {
                    throw new Error('Parsed JSON is null or undefined');
                }
            } catch (e) {
                const msg = e instanceof Error ? e.message : String(e);
                throw new Error(`Invalid JSON string provided for diagram loading, ${msg}`);
            }
        } else {
            json = source;
        }

        this.id = json.id;
        this.asset_store.merge(json.image_assets);
        this.nodes = (json.nodes ?? []).map(node => this.hydrateNode(node));
        this.layers = (json.layers ?? []).map(layer => this.hydrateLayer(layer));
        this.background = json.background;
        this.meta = json.meta ? { ...json.meta } : undefined;
        // this.grid = json.grid ? { ...defaultGrid, ...json.grid } : { ...defaultGrid };
        if (this.layers.length === 0) {
            this.buildMissingLayer();
        } else {
            this.pruneMissingLayerNodes();
        }
        return this;
    }

    /**
     * Writes the diagram data to the specified serializer.
     * @param serializer The serializer to use for writing the data.
     * @returns The serialized diagram data.
     */
    public write(serializer: ISerializer): any {
        const serializedNodes = this.nodes.map(node => this.serializeNode(node));

        const serializedLayers = this.isImplicitSingleLayer()
            ? []
            : this.layers.map(layer => ({
                id: layer.id,
                name: layer.name,
                visible: layer.visible,
                nodes: [...layer.nodes],
            }));

        const allAssets = this.asset_store.snapshot();
        let imageAssets: Record<string, string> | undefined;
        if (allAssets) {
            for (const node of serializedNodes) {
                if (node.image_id && allAssets[node.image_id]) {
                    imageAssets ??= {};
                    imageAssets[node.image_id] = allAssets[node.image_id]!;
                }
            }
        }

        return serializer.write({
            id: this.id,
            nodes: serializedNodes,
            layers: serializedLayers,
            image_assets: imageAssets,
            background: this.background,
            meta: this.meta ? { ...this.meta } : undefined,
        } satisfies ISerializedDiagram);
    }

    /**
     * Exports the current diagram in a native format.
     * Supported formats are JSON text, UTF-8 bytes, and Blob (browser runtime).
     * @param format The format to export the diagram in ('json', 'bytes', or 'blob'). (defaults to 'json')
     * @param pretty Whether to pretty-print the output (applicable to JSON format). (defaults to true)
     * @param serializer The serializer to use for exporting the diagram. (optional)
     * @returns The exported diagram data in the specified format.
     */
    public export(
        format: DiagramExportFormat = 'json',
        pretty: boolean = true,
        serializer: ISerializer = jsonSerializer,
    ): string | Uint8Array | Blob {
        const json = this.toJsonString(serializer, pretty);

        switch (format) {
            case 'json':
                return json;
            case 'bytes':
                return new TextEncoder().encode(json);
            case 'blob': {
                if (!isBrowserRuntime() || typeof Blob === 'undefined') {
                    throw new Error("Blob export is available only in browser-like runtimes");
                }
                return exportTextBlob(json, 'application/json');
            }
        }
    }

    /**
     * Saves the current diagram directly from the model.
     * In Node.js this writes to the file system; in browsers this triggers a file download.
     * @param options The options for saving the diagram, including path, file name, serializer, pretty-printing, and MIME type.
     * @returns A promise that resolves to the path or download URL of the saved file.
     */
    public async save(options: DiagramSaveOptions = {}): Promise<string> {
        const serializer = options.serializer ?? jsonSerializer;
        const pretty = options.pretty ?? true;
        const fileName = options.fileName ?? `${this.id}.json`;
        const content = this.toJsonString(serializer, pretty);

        if (isNodeRuntime()) {
            const path = options.path ?? fileName;
            return writeTextFile(path, content);
        }

        if (isBrowserRuntime()) {
            const mimeType = options.mimeType ?? 'application/json';
            return downloadTextFile(content, fileName, mimeType);
        }

        throw new Error('Unsupported runtime for save operation');
    }

    private toJsonString(serializer: ISerializer, pretty: boolean): string {
        const serialized = this.write(serializer);

        if (!pretty) {
            return serialized;
        }

        try {
            return JSON.stringify(JSON.parse(serialized), null, 2);
        } catch {
            return serialized;
        }
    }

    private resolveNode(node: string | INode): INode | undefined {
        return typeof node === 'string' ? this.node(node) : node;
    }

    private toSvgSource(svgOrSrc: string): string {
        const trimmed = svgOrSrc.trim();
        if (!trimmed) {
            return trimmed;
        }

        const isDataUrl = /^data:image\/svg\+xml/i.test(trimmed);
        const isLikelyUrl = /^https?:\/\//i.test(trimmed) || /^\//.test(trimmed);
        const isSvgMarkup = /^<svg[\s>]/i.test(trimmed);

        if (isDataUrl || isLikelyUrl || !isSvgMarkup) {
            return trimmed;
        }

        return `data:image/svg+xml;utf8,${encodeURIComponent(trimmed)}`;
    }

    protected applyNodeImageSource(target: INode, imageSrc: string, mode: ImageMode = 'contain', imageId?: string): void {
        target.image_id = this.asset_store.register(imageSrc, imageId);
        target.image_mode = mode;
    }

    /**
     * Returns all nodes within the specified layer.
     * @param layer The layer whose nodes should be returned.
     * @returns An array of nodes within the specified layer.
     */
    public layerNodes(layer: ILayer): INode[] {
        return layer.nodes
            .map(nodeId => this.node(nodeId))
            .filter((node): node is INode => !!node);
    }

    protected serializeNode(node: INode): ISerializedNode {
        const serialized: ISerializedNode = {
            ...node,
            points: node.points.map(point => ({ ...point })),
        };

        delete (serialized as Partial<INode>).owner;

        const connection = node as INode & IConnection;
        if ('from' in connection) {
            serialized.from = this.serializeAnchor(connection.from);
        }
        if ('to' in connection) {
            serialized.to = this.serializeAnchor(connection.to);
        }
        if ('ready' in connection) {
            serialized.ready = connection.ready;
        }

        return serialized;
    }

    private hydrateNode(node: ISerializedNode): INode {
        return {
            ...node,
            points: node.points.map(point => ({ ...point })),
            from: this.hydrateAnchor(node.from),
            to: this.hydrateAnchor(node.to),
            owner: this,
        } as INode;
    }

    private hydrateLayer(layer: ISerializedLayer): ILayer {
        return this.createLayer(
            layer.id,
            layer.name,
            layer.visible,
            [...new Set(layer.nodes ?? [])],
        );
    }

    /**
     * Creates a new layer with the specified properties.
     * @param id The ID of the layer.
     * @param name The name of the layer.
     * @param visible Whether the layer is visible.
     * @param nodes The nodes within the layer.
     * @returns The created layer.
     */
    protected createLayer(id: string, name: string = id, visible: boolean = true, nodes: string[] = []): ILayer {
        return {
            id,
            name,
            visible,
            nodes: [...nodes],
        };
    }

    private serializeAnchor(anchor?: IConnection['from']): ISerializedConnectionAnchor | undefined {
        if (!anchor) {
            return undefined;
        }

        return {
            ...anchor,
            node: typeof anchor.node === 'string' ? anchor.node : anchor.node.id,
        };
    }

    private hydrateAnchor(anchor?: ISerializedConnectionAnchor): IConnection['from'] | undefined {
        return anchor ? { ...anchor } : undefined;
    }

    private anchorTargetsNode(anchor: IConnectionAnchor | undefined, nodeId: string): boolean {
        if (!anchor) {
            return false;
        }

        return (typeof anchor.node === 'string' ? anchor.node : anchor.node.id) === nodeId;
    }

    private pruneMissingLayerNodes(): void {
        const validIds = new Set(this.nodes.map(node => node.id));
        this.layers = this.layers.map(layer => this.createLayer(
            layer.id,
            layer.name,
            layer.visible,
            layer.nodes.filter(nodeId => validIds.has(nodeId)),
        ));
    }

    private buildMissingLayer(): void {
        const layer = this.createLayer('layer-1', 'layer-1', true,
            this.nodes.map(node => node.id)
        );
        this.layers = [layer];
    }

    private isImplicitSingleLayer(): boolean {
        // Multiple layers must all be serialized.
        if (this.layers.length !== 1) {
            return false;
        }

        const layer = this.layers[0]!;
        // Check layer metadata.
        if (layer.id !== 'layer-1' || layer.name !== 'layer-1' || layer.visible !== true) {
            return false;
        }

        // Check nodes count.
        if (layer.nodes.length !== this.nodes.length) {
            return false;
        }

        // Check nodes order.
        for (let i = 0; i < this.nodes.length; i++) {
            if (layer.nodes[i] !== this.nodes[i]!.id) {
                return false;
            }
        }

        return true;
    }

}

