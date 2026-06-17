import { NodeRegistry } from "../factory/node.registry";
import type { HasSelection, IDiagram, IGrid, ILayer, INode } from "../interfaces";
import { createCanvas2D, downloadBlob, isBrowserRuntime } from "../io/browser.support";
import type { ImageSaveOptions, ImageSerializer, ImageWriteOptions } from "../io/export.types";
import { isNodeRuntime, writeBinaryFile } from "../io/node.support";
import { CanvasImageSerializer } from "../io/image.serializer";
import { FitViewport } from "../layout/fit.viewport";
import { Diagram } from "../model/diagram";
import type { ImageMode, IRect } from "../types";
import { NodeHandle } from "../types";
import {
    type DiagramViewportChange,
} from "../events/diagram.events";
import { EventDispatcher } from "../events/event.dispatcher";
import { CoordinateSystem } from "./coordinate.system";
import { ViewCache } from "./view.cache";
import {
    type FitAlign,
    type DiagramInitialView,
    type DiagramViewOptions,
    type DiagramSelectionOptions,
    type DiagramGuideOptions,
} from "./view.options";
import { DiagramConstants } from "../model/diagram.constants";
import type { DiagramGuide } from "../layout";

export type RenderMode = 'view' | 'editing';

export type RenderScope = 'all' | 'nodes' | 'selection' | 'grid' | 'guides';

const defaultGrid: IGrid = {
    forced: false,
    visible: true,
    color: 'lightgray',
    width: 20,
    height: 20,
};

/**
 * A class representing a diagram in 'view' mode. 
 * This class extends the base Diagram model and adds properties and methods specific to rendering and interacting with the diagram. 
 * 
 * It includes a coordinate system for managing transformations 
 * and a cache for storing precomputed values related to nodes for efficient rendering.
 */
export class DiagramView extends Diagram implements HasSelection {

    protected readonly ownsCanvas: boolean;

    protected coordinates: CoordinateSystem;

    protected cache: ViewCache;

    protected host: HTMLElement;

    protected canvas: HTMLCanvasElement;

    protected context: CanvasRenderingContext2D;

    protected canvasBackgroundColor: string = DiagramConstants.CANVAS_BACKGROUND_COLOR;

    protected readonly eventDispatcher: EventDispatcher;

    protected resizeObserver?: ResizeObserver;

    protected selected_nodes: INode[] = [];

    protected selectionOptions: DiagramSelectionOptions = {
        enable_select: true,
        enable_multi: false,
        enable_rect: false,
        rect_mode: 'touch',
    };

    protected fitViewport: FitViewport;

    public grid: IGrid;

    public guideOptions: DiagramGuideOptions = {
        render: true,
        snap: true,
    };

    protected guides: DiagramGuide[] = [];

    protected isSpacePanning: boolean = false;

    protected dragStartOnNode: boolean = false;

    protected dragPanningWithSpace: boolean = false;

    protected readonly handlePointerDown = (event: PointerEvent) => this.pointerDown(event);

    protected readonly handlePointerMove = (event: PointerEvent) => this.pointerMove(event);

    protected readonly handlePointerUp = (event: PointerEvent) => this.pointerUp(event);

    // Only cancel an in-progress drag when the pointer leaves; ignore plain hover-exits.
    protected readonly handlePointerLeave = (event: PointerEvent) => {
        if (event.buttons !== 0) this.pointerUp(event);
    };

    protected readonly handleWheel = (event: WheelEvent) => this.wheel(event);

    protected readonly handleKeyDown = (event: KeyboardEvent) => this.keydown(event);

    protected readonly handleKeyUp = (event: KeyboardEvent) => this.keyup(event);

    protected readonly handleContextMenu = (event: PointerEvent) => this.contextmenu(event);

    /**
     * Creates a new DiagramView instance.
     * @param id The unique identifier for the diagram.
     * @param target The HTML element or canvas where the diagram will be rendered.
     * @param initial Initial properties for the diagram.
     * @param options Configuration options for the diagram view.
     */
    constructor(id: string,
        target: HTMLElement | HTMLCanvasElement,
        initial?: Partial<Omit<IDiagram, 'id'>>,
        options?: DiagramViewOptions
    ) {
        super(id, initial);
        this.host = target;
        this.ownsCanvas = !(target instanceof HTMLCanvasElement);
        this.canvas = target instanceof HTMLCanvasElement ? target : this.createCanvas(target);
        this.context = this.canvas.getContext('2d')!;
        this.eventDispatcher = new EventDispatcher(this.host);
        this.coordinates = new CoordinateSystem(this.context);
        this.coordinates.attach(this);
        this.cache = new ViewCache();
        this.fitViewport = new FitViewport(this);

        this.grid = initial?.grid ? { ...initial.grid } : { ...defaultGrid };
        this.grid.color = DiagramConstants.GRID_LINE_COLOR;
        this.grid.width = DiagramConstants.GRID_CELL_WIDTH;
        this.grid.height = DiagramConstants.GRID_CELL_HEIGHT;

        if (options?.canvasBackgroundColor !== undefined) {
            this.canvasBackgroundColor = options.canvasBackgroundColor;
        }
        this.selectionOptions = {
            ...this.selectionOptions,
            ...options?.selection,
        };
        this.guideOptions = {
            ...this.guideOptions,
            ...options?.guides,
        }

        this.syncCanvasSize();
        this.bindResizeObserver();
        this.applyInitialView(options?.initialView);
        this.initializeSelection(options);
        this.bindCanvasEvents();
        this.render();
    }

    /**
     * Cleans up resources used by the DiagramView, including event listeners and the canvas element if it was created by the view.
     */
    public override destroy(): void {
        this.canvas.removeEventListener('pointerdown', this.handlePointerDown);
        this.canvas.removeEventListener('pointermove', this.handlePointerMove);
        this.canvas.removeEventListener('pointerup', this.handlePointerUp);
        this.canvas.removeEventListener('pointerleave', this.handlePointerLeave);
        this.canvas.removeEventListener('wheel', this.handleWheel);
        this.canvas.removeEventListener('contextmenu', this.handleContextMenu);
        window.removeEventListener('keydown', this.handleKeyDown);
        window.removeEventListener('keyup', this.handleKeyUp);

        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
            this.resizeObserver = undefined;
        }

        if (this.ownsCanvas && this.canvas.parentElement === this.host) {
            this.host.removeChild(this.canvas);
        }

        super.destroy();
    }

    public override clear(): void {
        this.clearSelection();
        // this.grid = { ...defaultGrid };
        super.clear();
    }

    /**
     * Gets the active render mode for this view.
     * - 'view': optimized for static viewing of diagrams, with limited interactivity and simplified rendering.
     * - 'editing': optimized for user interaction and mutation of the diagram.
     */
    public get render_mode(): RenderMode {
        return 'view';
    }

    /**
     * Returns the cache used by the DiagramView.
     */
    public getCache(): ViewCache {
        return this.cache;
    }

    /**
     * Returns the coordinate system used by the DiagramView.
     */
    public getCoordinates(): CoordinateSystem {
        return this.coordinates;
    }

    /**
     * Returns the canvas element used by the DiagramView.
     */
    public getCanvas(): HTMLCanvasElement {
        return this.canvas;
    }

    // ===============================================
    // ========== Selection management methods. ==========
    // ===============================================

    /**
     * Selects a node by its ID or node object.
     * @param node The ID of the node or the node object to select.
     * @returns The selected node, if any.
     */
    public selectNode(node: string | INode): INode | undefined {
        // this.setSelection(nodeId ? [this.node(nodeId)].filter((node): node is INode => !!node) : []);
        const _node = typeof node === 'string' ? this.node(node) : node;
        if (!_node) return;

        this.setSelection([_node]);
        this.render();
        return _node;
    }

    /**
     * Returns the currently selected nodes.
     * @returns An array of selected nodes.
     */
    public selection(): INode[] {
        return [...this.selected_nodes];
    }

    /**
     * Checks if a node is currently selected.
     * @param node The node to check.
     * @returns True if the node is selected, false otherwise.
     */
    public isSelected(node: INode): boolean {
        return this.selected_nodes.some(selected => selected.id === node.id);
    }

    /**
     * Selects a node.
     * @param node The node to select.
     */
    public select(node: INode): void {
        if (this.isSelected(node)) {
            return;
        }

        this.selected_nodes = this.selectionOptions.enable_multi
            ? [...this.selected_nodes, node]
            : [node];
        this.emitSelectionChange();
    }

    /**
     * Deselects a node.
     * @param node The node to deselect.
     */
    public deselect(node: INode): void {
        const next = this.selected_nodes.filter(selected => selected.id !== node.id);
        if (next.length === this.selected_nodes.length) {
            return;
        }

        this.selected_nodes = next;
        this.emitSelectionChange();
    }

    /**
     * Clears the selection of all nodes.
     */
    public clearSelection(): void {
        if (!this.selected_nodes.length) {
            return;
        }

        this.selected_nodes = [];
        this.emitSelectionChange();
    }

    /**
     * Selects all nodes in the diagram. Honors the `enable_multi` selection option to determine whether multiple nodes can be selected at once.
     */
    public selectAll(): void {
        if (!this.selectionOptions.enable_multi) {
            return;
        }

        this.clearSelection();
        for (let node of this.nodes) {
            this.select(node);
        }
        this.render('all');
        this.emitSelectionChange();
    }

    /**
     * Sets the selection of nodes.
     * @param nodes The nodes to select.
     */
    public setSelection(nodes: INode[]): void {
        const unique = nodes.filter((node, index, all) => all.findIndex(other => other.id === node.id) === index);
        const next = this.selectionOptions.enable_multi ? unique : unique.slice(0, 1);

        if (
            next.length === this.selected_nodes.length
            && next.every((node, index) => node.id === this.selected_nodes[index]?.id)
        ) {
            return;
        }

        this.selected_nodes = next;
        this.emitSelectionChange();
    }

    /**
     * Toggles the selection state of a node.
     * @param node The node to toggle.
     * @returns void
     */
    public toggleSelection(node: INode): void {
        if (this.isSelected(node)) {
            this.deselect(node);
            return;
        }

        this.select(node);
    }

    // ===============================================
    // ========== Viewport management methods. ==========
    // ==============================================

    /**
     * Sets the viewport of the diagram with a given pan and/or zoom.
     * @param viewport The viewport changes to apply.
     */
    public setViewport(viewport: Partial<DiagramViewportChange>): void {
        let panChanged = false;
        let zoomChanged = false;

        if (viewport.pan) {
            this.coordinates.pan = { ...viewport.pan };
            panChanged = true;
        }
        if (viewport.zoom !== undefined) {
            this.coordinates.zoom = this.fitViewport.clampZoom(viewport.zoom);
            zoomChanged = true;
        }

        this.emitViewportEvents(panChanged, zoomChanged);
        this.render();
    }

    /**
     * Fits the diagram content to the width of the viewport, with optional padding and alignment.
     * @param padding The padding to apply around the content.
     * @param alignment The alignment of the content within the viewport.
     */
    public fitToWidth(options?: { padding?: number, alignment?: FitAlign }): void {
        this.fitViewport.fitToWidth(options);
        this.emitViewportEvents(true, true);
        this.render();
    }

    /**
     * Fits the diagram content to the viewport, with optional padding and alignment.
     * @param padding The padding to apply around the content.
     * @param alignment The alignment of the content within the viewport.
     */
    public fitToNodes(options?: { padding?: number, alignment?: FitAlign }): void {
        this.fitViewport.fitToNodes(options);
        this.emitViewportEvents(true, true);
        this.render();
    }

    /**
     * Set the zoom level directly, optionally around a canvas-space center point.
     * @param zoom The desired zoom level.
     * @param centerX The x coordinate (canvas space) to keep visually stable during zoom.
     * @param centerY The y coordinate (canvas space) to keep visually stable during zoom.
     */
    public zoomTo(zoom: number, centerX: number = this.canvas.width / 2, centerY: number = this.canvas.height / 2): void {
        if (!Number.isFinite(zoom) || zoom <= 0) {
            return;
        }

        const currentZoom = this.coordinates.zoom;
        const nextZoom = this.fitViewport.clampZoom(zoom);
        if (nextZoom === currentZoom) {
            return;
        }

        this.coordinates.pan = {
            x: ((centerX + this.coordinates.pan.x) / currentZoom) * nextZoom - centerX,
            y: ((centerY + this.coordinates.pan.y) / currentZoom) * nextZoom - centerY,
        };
        this.coordinates.zoom = nextZoom;
        this.emitViewportEvents(true, true);
        this.render();
    }

    /**
     * Zoom the diagram by multiplying current zoom by a factor, optionally around a canvas-space center point.
     * @param factor The zoom multiplier. Values greater than 1 zoom in and values between 0 and 1 zoom out.
     * @param centerX The x coordinate (canvas space) to keep visually stable during zoom.
     * @param centerY The y coordinate (canvas space) to keep visually stable during zoom.
     */
    public zoomBy(factor: number, centerX: number = this.canvas.width / 2, centerY: number = this.canvas.height / 2): void {
        if (!Number.isFinite(factor) || factor <= 0) {
            return;
        }

        this.zoomTo(this.coordinates.zoom * factor, centerX, centerY);
    }

    /**
     * Pan the diagram by the specified delta values.
     * @param deltaX The amount to pan in the x direction.
     * @param deltaY The amount to pan in the y direction.
     */
    public panBy(deltaX: number, deltaY: number): void {
        this.coordinates.pan = {
            x: this.coordinates.pan.x - deltaX,
            y: this.coordinates.pan.y - deltaY,
        };
        this.emitViewportEvents(true, false);
    }

    // ============================================
    // ========== Data editing methods. ===========
    // ============================================

    public override upsertNode(node: INode): INode {
        const updated = super.upsertNode(node);
        this.render();
        return updated;
    }

    public override upsertLayer(layer: string | ILayer): ILayer {
        const updated = super.upsertLayer(layer);
        this.render();
        return updated;
    }

    public override deleteNode(nodeId: string): void {
        super.deleteNode(nodeId);
        if (this.selected_nodes.some(node => node.id === nodeId)) {
            this.selected_nodes = this.selected_nodes.filter(node => node.id !== nodeId);
            this.emitSelectionChange();
        }
        this.render();
    }

    public override deleteLayer(layerId: string): void {
        super.deleteLayer(layerId);
        this.render();
    }

    public override setNodeImageSource(node: string | INode, imageSrc: string, mode: ImageMode = 'frame', imageId?: string): INode | undefined {
        const updated = super.setNodeImageSource(node, imageSrc, mode, imageId);
        if (!updated) {
            return updated;
        }

        this.cache.deleteNode(updated);
        this.render('all');
        return updated;
    }

    public override setNodeSvgSource(node: string | INode, svgOrSrc: string, mode: ImageMode = 'frame', imageId?: string): INode | undefined {
        const updated = super.setNodeSvgSource(node, svgOrSrc, mode, imageId);
        if (!updated) {
            return updated;
        }

        this.cache.deleteNode(updated);
        this.render('all');
        return updated;
    }

    public override clearNodeImageSource(node: string | INode): INode | undefined {
        const updated = super.clearNodeImageSource(node);
        if (!updated) {
            return updated;
        }

        this.cache.deleteNode(updated);
        this.render('all');
        return updated;
    }

    // ============================================
    // ========== Rendering methods. ===========
    // ============================================

    /**
     * Renders the diagram onto the canvas, including any selection markers.
     * By default, both nodes and selection markers are rendered, but this can be controlled with the `what` parameter.
     * Accepts the following:
     * - 'nodes' to render only nodes,
     * - 'selection' to render only selection markers,
     * - 'grid' to render only the grid,
     * - 'guides' to render only guides, or
     * - 'all' to render everything.
     * 
    * @param what A RenderScope indicating what to render.
     */
    public render(what: RenderScope = 'all'): void {
        if (!this.canvas || !this.context) return;

        this.coordinates.resetTransform(this.context);
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

        if (this.canvasBackgroundColor && this.canvasBackgroundColor !== 'transparent') {
            this.context.save();
            this.context.fillStyle = this.canvasBackgroundColor;
            this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.context.restore();
        }

        this.coordinates.applyViewportTransform(this.context);

        if (this.grid?.visible && (what === 'grid' || what === 'all')) {
            this.renderGrid(this.context);
        }

        if (this.guides.length && (what === 'guides' || what === 'all')) {
            this.renderGuides(this.context);
        }

        for (const layer of this.layers) {
            if (!layer.visible) continue;

            for (const node of this.layerNodes(layer)) {
                const handler = NodeRegistry.adapter(node.type);
                if (what === 'nodes' || what === 'all') {
                    handler?.render(node, this.context);
                }

                if (what === 'selection' || what === 'all') {
                    if (this.isSelected(node)) {
                        handler?.renderSelection(node, this.context);
                    }
                }
            }
        }

        this.coordinates.resetTransform(this.context);
    }

    private renderGrid(context: CanvasRenderingContext2D): void {
        const { zoom, pan } = this.coordinates;
        const cellW = (this.grid.width || DiagramConstants.GRID_CELL_WIDTH) * zoom;
        const cellH = (this.grid.height || DiagramConstants.GRID_CELL_HEIGHT) * zoom;
        const canvasW = this.canvas!.width;
        const canvasH = this.canvas!.height;

        const startX = -((pan.x % cellW) + cellW) % cellW;
        const startY = -((pan.y % cellH) + cellH) % cellH;

        context.save();
        context.setTransform(1, 0, 0, 1, 0, 0);
        context.strokeStyle = this.grid.color || DiagramConstants.GRID_LINE_COLOR;   // lightgray
        context.lineWidth = 0.5;
        context.globalAlpha = 0.6;
        context.beginPath();

        for (let x = startX; x <= canvasW; x += cellW) {
            context.moveTo(x, 0);
            context.lineTo(x, canvasH);
        }
        for (let y = startY; y <= canvasH; y += cellH) {
            context.moveTo(0, y);
            context.lineTo(canvasW, y);
        }

        context.stroke();
        context.restore();
    }

    protected renderGuides(context: CanvasRenderingContext2D): void {
        if (!this.guides.length) {
            return;
        }

        const zoom = this.coordinates.zoom || 1;
        context.save();

        for (const guide of this.guides) {
            if (guide.kind === 'line' || guide.kind === 'guideline' || guide.kind === undefined) {
                context.beginPath();
                context.strokeStyle = guide.color ?? DiagramConstants.GUIDE_STROKE_STYLE;
                context.globalAlpha = guide.alpha ?? 0.45;
                context.lineWidth = (guide.width ?? 0.9) / zoom;
                context.setLineDash(guide.dash ?? [6 / zoom, 4 / zoom]);
                context.moveTo(guide.from.x, guide.from.y);
                context.lineTo(guide.to.x, guide.to.y);
                context.stroke();
            }
        }

        context.restore();
    }


    /**
     * Updates the grid settings for the diagram and re-renders it to reflect the changes.
     * @param json A partial object containing the grid properties to update. Only the provided properties will be updated, while the others will remain unchanged.
     */
    public updateGrid(json: Partial<IGrid>): void {
        Object.assign(this.grid, json);
        this.render('all');
    }

    /**
     * Updates the guides settings for the diagram.
     * @param options A partial object containing the guide properties to update. Only the provided properties will be updated, while the others will remain unchanged.
     */
    public updateGuides(options: Partial<DiagramGuideOptions>): void {
        Object.assign(this.guideOptions, options);
    }

    public setGuides(guides: DiagramGuide[]): void {
        this.guides = [...guides];
        this.render('guides');
    }

    public clearGuides(): void {
        if (!this.guides.length) {
            return;
        }
        this.guides = [];
        this.render('guides');
    }

    public clearGuidelines(): void {
        this.clearGuides();
    }

    /**
     * Resets the viewport to the default position and zoom level, and clears the selection.
     */
    public resetView(): void {
        this.coordinates.pan = { x: 0, y: 0 };
        this.coordinates.zoom = 1;
        this.clearSelection();
        this.emitViewportEvents(true, true);
        this.render();
    }

    /**
     * Exports the full visible diagram content as an image blob.
     * This export is uncropped and ignores the current viewport pan/zoom.
     * The exported image will be sized to fit the bounds of all visible nodes, plus optional padding.
     * @param options The options for writing the image, including padding and MIME type.
     * @param serializer The serializer to use for writing the image.
     * @returns A promise that resolves to a Blob containing the exported image.
     */
    public async exportImage(options: ImageWriteOptions = {}, serializer: ImageSerializer = new CanvasImageSerializer()): Promise<Blob> {
        const padding = Number.isFinite(options.padding) ? Math.max(0, options.padding!) : DiagramConstants.EXPORT_IMAGE_PADDING;
        const exportCanvas = this.createExportCanvas(padding);
        return serializer.write(exportCanvas, options);
    }

    /**
     * Exports and saves the full visible diagram content as an image file.
     * In Node.js this writes to the file system; in browsers this triggers a download.
     */
    public async saveImage(options: ImageSaveOptions = {}, serializer: ImageSerializer = new CanvasImageSerializer()): Promise<string> {
        const blob = await this.exportImage(options, serializer);
        const mimeType = options.mimeType ?? (blob.type || 'image/png');
        const fileName = options.fileName ?? `${this.id}.${this.getImageExtension(mimeType)}`;

        if (isNodeRuntime()) {
            const path = options.path ?? fileName;
            const bytes = new Uint8Array(await blob.arrayBuffer());
            return writeBinaryFile(path, bytes);
        }

        if (isBrowserRuntime()) {
            return downloadBlob(blob, fileName);
        }

        throw new Error('Unsupported runtime for image save operation');
    }

    // Create a new offscreen canvas element to be used for rendering the full diagram.
    private createExportCanvas(padding: number): HTMLCanvasElement {
        const bounds = this.getNodeBounds();

        if (!bounds || bounds.width <= 0 || bounds.height <= 0) {
            return createCanvas2D(1, 1).canvas;
        }

        const width = bounds.width + padding * 2;
        const height = bounds.height + padding * 2;
        const { canvas, context } = createCanvas2D(width, height);
        this.renderContentToContext(context, bounds, padding);
        return canvas;
    }

    // Render the diagram content onto a canvas context, applying the necessary transformations to position the content based on the provided bounds and padding.
    private renderContentToContext(context: CanvasRenderingContext2D, bounds: IRect, padding: number): void {
        this.coordinates.resetTransform(context);
        context.clearRect(0, 0, context.canvas.width, context.canvas.height);
        context.setTransform(1, 0, 0, 1, -bounds.left + padding, -bounds.top + padding);

        for (const layer of this.layers) {
            if (!layer.visible) continue;

            for (const node of this.layerNodes(layer)) {
                const adapter = NodeRegistry.adapter(node.type);
                adapter?.render(node, context);
            }
        }

        this.coordinates.resetTransform(context);
    }

    // Determine the appropriate file extension for an image based on its MIME type.
    private getImageExtension(mimeType: string): string {
        switch (mimeType) {
            case 'image/jpeg':
                return 'jpg';
            case 'image/webp':
                return 'webp';
            case 'image/avif':
                return 'avif';
            case 'image/png':
            default:
                return 'png';
        }
    }

    /**
     * Calculate the bounding rectangle that encompasses all visible nodes in the diagram.
     * @returns The bounding rectangle of all visible nodes, or `undefined` if there are no visible nodes.
     */
    public getNodeBounds(): IRect | undefined {
        let bounds: IRect | undefined;

        for (const layer of this.layers) {
            if (!layer.visible) continue;

            for (const node of this.layerNodes(layer)) {
                const rect = this.coordinates.getBoundingRect(node, true);

                if (!bounds) {
                    bounds = { ...rect };
                    continue;
                }

                const right = Math.max(bounds.left + bounds.width, rect.left + rect.width);
                const bottom = Math.max(bounds.top + bounds.height, rect.top + rect.height);
                bounds.left = Math.min(bounds.left, rect.left);
                bounds.top = Math.min(bounds.top, rect.top);
                bounds.width = right - bounds.left;
                bounds.height = bottom - bounds.top;
            }
        }

        return bounds;
    }

    // =============================================
    // ========== Event handling methods. ==========
    // =============================================

    /**
     * Returns the first node found at the specified coordinates, if any.
     * @param x The x-coordinate to test.
     * @param y The y-coordinate to test.
     */
    protected hitNode(x: number, y: number): INode | undefined {
        for (let layer of this.layers) {
            if (!layer.visible) continue;

            const nodes = this.layerNodes(layer);

            for (let i = nodes.length - 1; i >= 0; i--) {
                let node = nodes[i]!;
                const handler = NodeRegistry.adapter(node.type);
                const handle = handler ? handler.hitTest(node, { x, y }) : NodeHandle.NONE;
                if (handle != NodeHandle.NONE) return node;
            }
        }
        return undefined;
    }

    /**
     * Returns all nodes at the specified coordinates.
     * @param x The x-coordinate to test.
     * @param y The y-coordinate to test.
     * @returns An array of nodes at the specified coordinates.
     */
    protected hitNodes(x: number, y: number): INode[] {
        let found: INode[] = [];

        for (let layer of this.layers) {
            if (!layer.visible) continue;

            const nodes = this.layerNodes(layer);

            for (let i = nodes.length - 1; i >= 0; i--) {
                let node = nodes[i]!;
                const handler = NodeRegistry.adapter(node.type);
                const handle = handler ? handler.hitTest(node, { x, y }) : NodeHandle.NONE;
                if (handle != NodeHandle.NONE) found.push(node);
            }
        }
        return found;
    }

    /**
     * Returns the handle at the specified coordinates, if any.
     * @param x The x-coordinate to test.
     * @param y The y-coordinate to test.
     * @param target The target node to test, if any.
     * @returns The handle at the specified coordinates, or `NodeHandle.NONE` if none is found.
     */
    protected hitHandle(x: number, y: number, target?: INode): NodeHandle {
        for (let layer of this.layers) {
            if (!target && !layer.visible) continue;

            const nodes = this.layerNodes(layer);

            for (let i = nodes.length - 1; i >= 0; i--) {
                let node = nodes[i]!;
                const handler = NodeRegistry.adapter(node.type);
                const handle = handler?.hitTest(node, { x, y }) || NodeHandle.NONE;
                if (!target || node == target) {
                    return handle;
                }
            }
        }
        return NodeHandle.NONE;
    }

    /**
     * Select the cursor style reflecting a node handle.
     * @param handle The node handle to determine the cursor style for.
     * @returns The CSS cursor style for the specified node handle.
     */
    protected getCursor(handle: NodeHandle): string | undefined {
        switch (handle) {
            case NodeHandle.NONE: return 'default';
            case NodeHandle.MOVE: return 'grab';

            case NodeHandle.NE: return 'ne-resize';
            case NodeHandle.NW: return 'nw-resize';
            case NodeHandle.SE: return 'se-resize';
            case NodeHandle.SW: return 'sw-resize';

            case NodeHandle.N: return 'n-resize';
            case NodeHandle.S: return 's-resize';
            case NodeHandle.E: return 'e-resize';
            case NodeHandle.W: return 'w-resize';

            case NodeHandle.POINT: return 'move';
            case NodeHandle.ROTATE: return 'pointer';
            case NodeHandle.ALTER: return 'pointer';
        }
    }

    /**
     * Respond to pointer down events on the canvas, handling selection and panning based on the event properties and current selection options.
     * @param event The pointer event.
     */
    protected pointerDown(event: PointerEvent): void {
        event.preventDefault();
        event.stopImmediatePropagation();

        if (event.button !== 0) return;

        if (!this.selectionOptions.enable_select) {
            this.emitBackgroundClick(event.offsetX, event.offsetY);
            return;
        }

        this.canvas.setPointerCapture?.(event.pointerId);

        const hit = this.hitNode(event.offsetX, event.offsetY);
        this.dragStartOnNode = !!hit;
        this.dragPanningWithSpace = this.isSpacePanning;

        if (this.dragPanningWithSpace) {
            this.canvas.style.cursor = 'grabbing';
            return;
        }

        const toggleSelection = this.selectionOptions.enable_multi && (event.shiftKey || event.ctrlKey || event.metaKey);

        if (hit) {
            if (toggleSelection) {
                this.toggleSelection(hit);
            } else {
                this.setSelection([hit]);
            }
            this.emitNodeClick(hit);
        } else {
            if (!toggleSelection) {
                this.clearSelection();
            }
            this.emitBackgroundClick(event.offsetX, event.offsetY);
        }

        this.render();
    }

    /**
     * Respond to pointer move events on the canvas, updating the cursor style based on hit testing and handling panning if the primary button is pressed.
     * @param event The pointer event.
     */
    protected pointerMove(event: PointerEvent): void {
        if (!this.canvas) return;

        if ((event.buttons & 1) === 1) {
            if (!this.dragPanningWithSpace && this.dragStartOnNode) {
                return;
            }

            this.coordinates.pan = {
                x: this.coordinates.pan.x - event.movementX,
                y: this.coordinates.pan.y - event.movementY,
            }
            this.emitViewportEvents(true, false);
            this.render();
            return;
        }

        const hoverNode = this.hitNode(event.offsetX, event.offsetY);
        const handle = this.hitHandle(event.offsetX, event.offsetY, hoverNode);
        this.canvas.style.cursor = this.getCursor(handle) || 'default';
    }

    /**
     * Respond to pointer up events on the canvas, releasing pointer capture and re-rendering the diagram if necessary.
     * @param event The pointer event.
     */
    protected pointerUp(event: PointerEvent): void {
        if (!this.canvas) return;

        event.preventDefault();
        event.stopImmediatePropagation();

        if (this.canvas.hasPointerCapture?.(event.pointerId)) {
            this.canvas.releasePointerCapture(event.pointerId);
        }

        this.dragStartOnNode = false;
        this.dragPanningWithSpace = false;

        this.render();
    }

    /**
     * Respond to wheel events on the canvas, handling zooming when the Ctrl or Meta key is pressed and panning otherwise.
     * @param event The wheel event.
     */
    protected wheel(event: WheelEvent): void {
        if (!this.canvas) return;

        event.preventDefault();
        event.stopImmediatePropagation();

        if (event.ctrlKey || event.metaKey) {
            const zoomFactor = event.deltaY > 0 ? 1.1 : 1 / 1.1;
            this.zoomBy(zoomFactor, event.offsetX, event.offsetY);
        } else {
            this.coordinates.pan = {
                x: this.coordinates.pan.x + event.deltaX,
                y: this.coordinates.pan.y + event.deltaY,
            };
            this.emitViewportEvents(true, false);
        }

        this.render();
    }

    /**
     * Respond to keydown events on the window, currently does nothing but can be used for keyboard shortcuts in the future.
     * @param event The keyboard event.
     */
    protected keydown(event: KeyboardEvent): void {
        if (this.shouldIgnoreGlobalKeydown(event)) {
            return;
        }

        const key = event.key.toLowerCase();
        if (key === ' ' || key === 'space' || key === 'spacebar') {
            this.isSpacePanning = true;
        }
    }

    /**
     * Respond to keyup events on the window.
     * @param event The keyboard event.
     */
    protected keyup(event: KeyboardEvent): void {
        const key = event.key.toLowerCase();
        if (key === ' ' || key === 'space' || key === 'spacebar') {
            this.isSpacePanning = false;
            if (this.canvas.style.cursor === 'grabbing') {
                this.canvas.style.cursor = 'default';
            }
        }
    }

    protected shouldIgnoreGlobalKeydown(event: KeyboardEvent): boolean {
        const target = event.target;
        if (!(target instanceof HTMLElement)) {
            return false;
        }

        if (target.isContentEditable || target.closest('[contenteditable="true"]')) {
            return true;
        }

        const tagName = target.tagName.toLowerCase();
        return tagName === 'input' || tagName === 'textarea' || tagName === 'select';
    }

    /**
     * Respond to context menu events on the canvas, preventing the default context menu from appearing.
     * @param event The pointer event.
     */
    protected contextmenu(event: PointerEvent): void {
        event.preventDefault();
        event.stopImmediatePropagation();
    }

    // ================================================
    // ========== Helper methods for wiring. ==========
    // ================================================

    private createCanvas(container: HTMLElement): HTMLCanvasElement {
        const canvas = document.createElement('canvas');
        canvas.style.display = 'block';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        container.appendChild(canvas);
        return canvas;
    }

    private syncCanvasSize(): void {
        const width = Math.max(1, this.host.clientWidth || this.canvas.clientWidth || this.canvas.width || 1);
        const height = Math.max(1, this.host.clientHeight || this.canvas.clientHeight || this.canvas.height || 1);

        if (this.canvas.width === width && this.canvas.height === height) {
            return;
        }

        this.canvas.width = width;
        this.canvas.height = height;
    }

    private bindResizeObserver(): void {
        if (this.host === this.canvas || typeof ResizeObserver === 'undefined') {
            return;
        }

        this.resizeObserver = new ResizeObserver(() => {
            this.syncCanvasSize();
            this.render();
        });
        this.resizeObserver.observe(this.host);
    }

    private bindCanvasEvents(): void {
        this.canvas.style.touchAction = 'none';
        this.canvas.addEventListener('pointerdown', this.handlePointerDown);
        this.canvas.addEventListener('pointermove', this.handlePointerMove);
        this.canvas.addEventListener('pointerup', this.handlePointerUp);
        this.canvas.addEventListener('pointerleave', this.handlePointerLeave);
        this.canvas.addEventListener('wheel', this.handleWheel, { passive: false });
        this.canvas.addEventListener('contextmenu', this.handleContextMenu);
        window.addEventListener('keydown', this.handleKeyDown);
        window.addEventListener('keyup', this.handleKeyUp);
    }

    private emitSelectionChange(): void {
        const selectedNodes = this.selection();
        this.eventDispatcher.selectionChanged({
            node: selectedNodes[0],
            nodeId: selectedNodes[0]?.id,
            nodes: selectedNodes,
            nodeIds: selectedNodes.map(node => node.id),
        });
    }

    private emitNodeClick(node: INode): void {
        const selectedNodes = this.selection();
        this.eventDispatcher.nodeClicked({
            node,
            nodeId: node.id,
            nodes: selectedNodes,
            nodeIds: selectedNodes.map(selected => selected.id),
        });
    }

    private emitBackgroundClick(x: number, y: number): void {
        this.eventDispatcher.backgroundClicked({
            canvas: { x, y },
            world: this.coordinates.getPoint(x, y, 'ignore_grid'),
        });
    }

    // Emits any events that can be captured outside the diagram, such as for selection changes or viewport changes.
    private emitViewportEvents(panChanged: boolean, zoomChanged: boolean): void {
        if (!panChanged && !zoomChanged) {
            return;
        }

        const detail = {
            pan: { ...this.coordinates.pan },
            zoom: this.coordinates.zoom,
        } satisfies DiagramViewportChange;

        this.eventDispatcher.viewportChanged(detail);
    }

    // ==================================================
    // ========== Helper methods for starting. ==========
    // ==================================================

    // Start with the layout specified in the initial view options.
    private applyInitialView(initialView?: DiagramInitialView): void {
        const mode = initialView?.mode || 'saved';

        if (mode === 'fit-all') {
            this.fitViewport.fitToNodes({ padding: initialView?.padding, alignment: initialView?.alignment });
            return;
        }

        if (mode === 'fit-width') {
            this.fitViewport.fitToWidth({ padding: initialView?.padding, alignment: initialView?.alignment });
            return;
        }

        if (initialView?.pan) {
            this.coordinates.pan = { ...initialView.pan };
        }
        if (initialView?.zoom !== undefined) {
            this.coordinates.zoom = this.fitViewport.clampZoom(initialView.zoom);
        }
    }

    // Start with given selection based on options, then emit selection change to notify external listeners.
    private initializeSelection(options?: DiagramViewOptions): void {
        if (options?.selectedNodeIds?.length) {
            const nodes = options.selectedNodeIds
                .map(id => this.node(id))
                .filter((node): node is INode => !!node);

            this.setSelection(nodes);
            return;
        }

        if (options?.selectedNodeId) {
            const node = this.node(options.selectedNodeId);
            this.setSelection(node ? [node] : []);
        }
    }

}