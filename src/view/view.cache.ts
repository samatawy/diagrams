import type { ILayer, INode } from "../interfaces";

export type Cacheable = INode | ILayer;

/**
 * Cached properties for nodes and layers.
 */
export interface INodeCached {
    cos?: number;
    sin?: number;
    path?: Path2D;
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

    public getNode(node: INode): INodeCached | undefined {
        return this.node_cache.get(node);
    }

    public setNode(node: INode, cached: INodeCached): void {
        this.node_cache.set(node, cached);
    }

    public deleteNode(node: INode): void {
        this.node_cache.delete(node);
    }

    public getLayer(layer: ILayer): ILayerCached | undefined {
        return this.layer_cache.get(layer);
    }

    public setLayer(layer: ILayer, cached: ILayerCached): void {
        this.layer_cache.set(layer, cached);
    }

    public deleteLayer(layer: ILayer): void {
        this.layer_cache.delete(layer);
    }

    public clear(): void {
        this.node_cache = new WeakMap<INode, INodeCached>();
        this.layer_cache = new WeakMap<ILayer, ILayerCached>();
    }
}