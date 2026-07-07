import type { AnimationMode } from "../animation.types";
import { DIAGRAM_CHANGED_EVENT, DIAGRAM_VIEWPORT_EVENT, type DiagramChanged, type DiagramViewportChange } from "../events";
import { NodeRegistry } from "../factory";
import { isConnection, isContainerNode } from "../guards";
import type { IRect } from "../types";
import type { DiagramView } from "./diagram.view";

/**
 * Represents a minimap view of the diagram, providing a scaled-down overview of the entire diagram.
 * The minimap view allows users to quickly navigate and understand the structure of the diagram.
 * It listens to diagram events and updates its rendering accordingly.
 */
export class MinimapView {

    private static readonly PADDING = 8;

    protected readonly diagram: DiagramView;
    protected parent?: HTMLElement;

    protected host?: HTMLElement;
    protected canvas?: HTMLCanvasElement;
    protected context?: CanvasRenderingContext2D;

    protected viewport?: IRect;
    protected canvasDpr = 1;
    protected isDragging = false;

    protected readonly handleDiagramChanged: EventListener;
    protected readonly handleViewportChanged: EventListener;

    protected readonly handlePointerDown: (event: PointerEvent) => void;
    protected readonly handlePointerMove: (event: PointerEvent) => void;
    protected readonly handlePointerUp: (event: PointerEvent) => void;

    constructor(diagram: DiagramView) {
        this.diagram = diagram;

        this.handleDiagramChanged = (event: Event) => this.onDiagramChanged(event as CustomEvent<DiagramChanged>);
        this.handleViewportChanged = (event: Event) => this.onViewportChanged(event as CustomEvent<DiagramViewportChange>);
        this.handlePointerDown = (event: PointerEvent) => this.onPointerDown(event);
        this.handlePointerMove = (event: PointerEvent) => this.onPointerMove(event);
        this.handlePointerUp = (event: PointerEvent) => this.onPointerUp(event);

        this.initialize();
        this.bind();
    }

    destroy(): void {
        this.unbind();
        this.detach();
    }

    public show(container: HTMLElement): void {
        if (this.host && container) {
            this.attach(container);
            this.host.style.display = 'block';
        }
    }

    public hide(): void {
        if (this.host) {
            this.host.style.display = 'none';
        }
    }

    private initialize(): void {
        const host = document.createElement('div');
        host.classList.add('minimap-view');
        host.style.position = 'absolute';
        host.style.zIndex = '200';
        host.style.bottom = '10px';
        host.style.right = '10px';
        host.style.width = '200px';
        host.style.height = '150px';
        host.style.border = '1px solid #ccc';
        host.style.backgroundColor = '#f9f9f9';
        host.style.opacity = '0.9';
        host.style.overflow = 'hidden';
        host.style.touchAction = 'none';

        const canvas = document.createElement('canvas');
        canvas.width = 200;
        canvas.height = 150;
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.cursor = 'crosshair';
        host.appendChild(canvas);

        this.host = host;
        this.canvas = canvas;
        this.context = canvas.getContext('2d') as CanvasRenderingContext2D;

        this.canvas.addEventListener('pointerdown', this.handlePointerDown);
        this.canvas.addEventListener('pointermove', this.handlePointerMove);
        this.canvas.addEventListener('pointerup', this.handlePointerUp);
        this.canvas.addEventListener('pointercancel', this.handlePointerUp);
    }

    private attach(container: HTMLElement): void {
        if (!this.host) return;
        if (this.parent === container && this.host.parentElement === container) return;

        this.detach();
        container.appendChild(this.host);
        this.parent = container;
        this.render();
    }

    private detach(): void {
        if (this.host?.parentElement) {
            this.host.parentElement.removeChild(this.host);
        }
        this.parent = undefined;
    }

    private onPointerDown(event: PointerEvent): void {
        if (!this.canvas) {
            return;
        }
        this.isDragging = true;
        this.canvas.setPointerCapture(event.pointerId);
        this.panToPointer(event, 'animate');    // Make into 'animate' if needed - currently jerky on first following move.
        event.preventDefault();
    }

    private onPointerMove(event: PointerEvent): void {
        if (!this.isDragging) {
            return;
        }
        this.panToPointer(event, 'animate');
        event.preventDefault();
    }

    private onPointerUp(event: PointerEvent): void {
        if (!this.canvas) {
            return;
        }
        if (this.canvas.hasPointerCapture(event.pointerId)) {
            this.canvas.releasePointerCapture(event.pointerId);
        }
        this.isDragging = false;
    }

    private panToPointer(event: PointerEvent, mode: AnimationMode): void {
        if (!this.canvas || !this.host) {
            return;
        }

        const bounds = this.diagram.getNodeBounds();
        if (!bounds || bounds.width <= 0 || bounds.height <= 0) {
            return;
        }

        const fit = this.getFitTransform(bounds);
        if (!Number.isFinite(fit.scale) || fit.scale <= 0) {
            return;
        }

        const rect = this.canvas.getBoundingClientRect();
        const x = (event.clientX - rect.left) * this.canvasDpr;
        const y = (event.clientY - rect.top) * this.canvasDpr;

        const worldX = (x - fit.offsetX) / fit.scale;
        const worldY = (y - fit.offsetY) / fit.scale;

        const coordinates = this.diagram.getCoordinates();
        const zoom = coordinates.zoom || 1;
        if (!Number.isFinite(zoom) || zoom <= 0) {
            return;
        }

        const viewportHost = (this.diagram as any).host as HTMLElement | undefined;
        const viewportWidth = Math.max(1, viewportHost?.clientWidth || 0);
        const viewportHeight = Math.max(1, viewportHost?.clientHeight || 0);

        if (mode === 'animate') {
            this.diagram.animateViewport({
                pan: {
                    x: worldX * zoom - viewportWidth / 2,
                    y: worldY * zoom - viewportHeight / 2,
                },
            }, () => {
                this.diagram.render('all');
                this.render();
                // this.onViewportChanged(new CustomEvent(DIAGRAM_VIEWPORT_EVENT, { detail: { pan: coordinates.pan, zoom } }));
            });
        } else {
            this.diagram.setViewport({
                pan: {
                    x: worldX * zoom - viewportWidth / 2,
                    y: worldY * zoom - viewportHeight / 2,
                },
            });
        }
        // this.onViewportChanged(new CustomEvent(DIAGRAM_VIEWPORT_EVENT, { detail: { pan: coordinates.pan, zoom } }));
    }

    /**
     * Listen to diagram events and update the minimap view accordingly.
     */
    private bind(): void {
        this.diagram.onEvent(DIAGRAM_CHANGED_EVENT, this.handleDiagramChanged);
        this.diagram.onEvent(DIAGRAM_VIEWPORT_EVENT, this.handleViewportChanged);
    }

    /**
     * Stop listening to diagram events and clean up any resources used by the minimap view.
     */
    private unbind(): void {
        this.diagram.clearEvent(DIAGRAM_CHANGED_EVENT, this.handleDiagramChanged);
        this.diagram.clearEvent(DIAGRAM_VIEWPORT_EVENT, this.handleViewportChanged);
        this.canvas?.removeEventListener('pointerdown', this.handlePointerDown);
        this.canvas?.removeEventListener('pointermove', this.handlePointerMove);
        this.canvas?.removeEventListener('pointerup', this.handlePointerUp);
        this.canvas?.removeEventListener('pointercancel', this.handlePointerUp);
    }

    private onDiagramChanged(_event: CustomEvent<DiagramChanged>): void {
        // Handle diagram changes and update the minimap view accordingly.
        this.render();
    }

    private onViewportChanged(_event: CustomEvent<DiagramViewportChange>): void {
        // Handle viewport changes and update the minimap view accordingly.
        // const source = this.diagram;
        // const bounds = source.getNodeBounds();

        // if (!bounds || bounds.width <= 0 || bounds.height <= 0) {
        //     return;
        // }
        // const fit = this.getFitTransform(bounds);
        // this.renderViewport(bounds, fit);
        this.render();
    }

    private render(): void {
        if (!this.context || !this.canvas) return;

        this.syncCanvasSize();

        const source = this.diagram;
        const bounds = source.getNodeBounds();

        // Clear the canvas
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

        const background = source.background;
        if (background?.color && background.color !== 'transparent') {
            this.context.save();
            this.context.fillStyle = background.color;
            this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.context.restore();
        }

        if (!bounds || bounds.width <= 0 || bounds.height <= 0) {
            return;
        }

        const fit = this.getFitTransform(bounds);

        this.context.save();
        this.context.setTransform(fit.scale, 0, 0, fit.scale, fit.offsetX, fit.offsetY);

        for (const layer of source.layers) {
            if (!layer.visible) continue;

            const nodes = source.layerNodes(layer);
            const containers = nodes.filter(isContainerNode);
            const connections = nodes.filter(isConnection);

            // Render containers first..
            for (const container of containers) {
                const handler = NodeRegistry.adapter(container.type);
                handler?.render(container, this.context, 'quick');
            }

            // Render connections first..
            for (const node of connections) {
                const handler = NodeRegistry.adapter(node.type);
                handler?.render(node, this.context, 'quick');
            }

            // Then render non-connection nodes on top, so they appear above connecting lines.
            for (const node of nodes) {
                const handler = NodeRegistry.adapter(node.type);
                if (!isContainerNode(node) && !isConnection(node)) {
                    handler?.render(node, this.context, 'quick');
                }
            }
        }

        this.context.restore();
        this.renderViewport(bounds, fit);
    }

    private renderViewport(bounds: IRect, fit: { scale: number, offsetX: number, offsetY: number }): void {
        if (!this.context || !this.canvas) return;

        const coordinates = this.diagram.getCoordinates();
        const zoom = coordinates.zoom || 1;
        if (!Number.isFinite(zoom) || zoom <= 0) {
            return;
        }
        const pan = coordinates.pan;
        const viewportHost = (this.diagram as any).host as HTMLElement | undefined;
        const viewportWidthPx = Math.max(1, viewportHost?.clientWidth || 0);
        const viewportHeightPx = Math.max(1, viewportHost?.clientHeight || 0);

        // Convert from screen-space viewport to diagram-world coordinates.
        const viewportWidth = viewportWidthPx / zoom;
        const viewportHeight = viewportHeightPx / zoom;
        const viewportLeft = pan.x / zoom;
        const viewportTop = pan.y / zoom;

        const left = viewportLeft * fit.scale + fit.offsetX;
        const top = viewportTop * fit.scale + fit.offsetY;
        const width = viewportWidth * fit.scale;
        const height = viewportHeight * fit.scale;

        this.context.strokeStyle = 'rgba(15, 118, 110, 0.9)';
        this.context.lineWidth = 1.5;
        this.context.fillStyle = 'rgba(15, 118, 110, 0.08)';
        this.context.fillRect(left, top, width, height);
        this.context.strokeRect(left, top, width, height);
    }

    private getFitTransform(bounds: IRect): { scale: number, offsetX: number, offsetY: number } {
        if (!this.canvas) return { scale: 1, offsetX: 0, offsetY: 0 };

        const availableWidth = Math.max(1, this.canvas.width - MinimapView.PADDING * 2);
        const availableHeight = Math.max(1, this.canvas.height - MinimapView.PADDING * 2);
        const scale = Math.min(availableWidth / bounds.width, availableHeight / bounds.height);
        const offsetX = (this.canvas.width - bounds.width * scale) / 2 - bounds.left * scale;
        const offsetY = (this.canvas.height - bounds.height * scale) / 2 - bounds.top * scale;
        return { scale, offsetX, offsetY };
    }

    private syncCanvasSize(): void {
        if (!this.host || !this.canvas || !this.context) return;

        const width = Math.max(1, Math.floor(this.host.clientWidth));
        const height = Math.max(1, Math.floor(this.host.clientHeight));
        const dpr = Math.max(1, Math.floor((window.devicePixelRatio || 1) * 100) / 100);

        const targetWidth = Math.max(1, Math.round(width * dpr));
        const targetHeight = Math.max(1, Math.round(height * dpr));

        if (this.canvas.width === targetWidth && this.canvas.height === targetHeight && this.canvasDpr === dpr) {
            return;
        }

        this.canvas.width = targetWidth;
        this.canvas.height = targetHeight;
        this.canvasDpr = dpr;
    }

}
