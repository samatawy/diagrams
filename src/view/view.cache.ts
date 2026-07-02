import type { ILayer, INode } from "../interfaces";

type Cacheable = INode | ILayer;

/**
 * Cached properties for nodes and layers.
 */
export interface INodeCached {
    cos?: number;
    sin?: number;
    path?: Path2D;
    text_path?: Path2D;
    img?: HTMLImageElement;
    pattern?: CanvasPattern;
    image_loading?: boolean;
}

export interface ILayerCached {
    context?: CanvasRenderingContext2D;
}

/**
 * Helper class for caching computed properties of nodes and layers to optimize rendering performance.
 * It uses WeakMaps to associate cached data with nodes and layers without preventing garbage collection.
 */
export class ViewCache {

    private node_cache: WeakMap<INode, INodeCached> = new WeakMap();
    private layer_cache: WeakMap<ILayer, ILayerCached> = new WeakMap();

    /**
     * Gets cached render data for a node.
     * @param node Target node.
     * @returns Cached node data when present.
     */
    public getNode(node: INode): INodeCached | undefined {
        return this.node_cache.get(node);
    }

    /**
     * Stores cached render data for a node.
     * @param node Target node.
     * @param cached Cached node data.
     */
    public setNode(node: INode, cached: INodeCached): void {
        this.node_cache.set(node, cached);
    }

    /**
     * Removes cached render data for a node.
     * @param node Target node.
     */
    public deleteNode(node: INode): void {
        this.node_cache.delete(node);
    }

    /**
     * Gets cached render data for a layer.
     * @param layer Target layer.
     * @returns Cached layer data when present.
     */
    public getLayer(layer: ILayer): ILayerCached | undefined {
        return this.layer_cache.get(layer);
    }

    /**
     * Stores cached render data for a layer.
     * @param layer Target layer.
     * @param cached Cached layer data.
     */
    public setLayer(layer: ILayer, cached: ILayerCached): void {
        this.layer_cache.set(layer, cached);
    }

    /**
     * Removes cached render data for a layer.
     * @param layer Target layer.
     */
    public deleteLayer(layer: ILayer): void {
        this.layer_cache.delete(layer);
    }

    /**
     * Clears all node and layer cache entries.
     */
    public clear(): void {
        this.node_cache = new WeakMap<INode, INodeCached>();
        this.layer_cache = new WeakMap<ILayer, ILayerCached>();
    }
}