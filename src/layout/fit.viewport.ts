import type { IRect } from "../types";
import type { FitAlign, HorizontalAlign, VerticalAlign } from "../view/dto";
import type { DiagramView } from "../view/diagram.view";

/**
 * FitViewport is a utility class that provides methods to adjust the viewport of a DiagramView to fit its content (nodes) within the visible area. 
 * It calculates the appropriate zoom level and pan offset based on the dimensions of the nodes and the canvas, 
 * allowing for different alignment options (center, left, right, top, bottom). 
 * The class also includes methods to clamp the zoom level within specified minimum and maximum values.
 */
export class FitViewport {

    private diagram: DiagramView;

    private minZoom = 0.2;
    private maxZoom = 4;

    /**
     * Creates an instance of FitViewport and attaches it to a DiagramView.
     * This allows the FitViewport to manipulate the viewport of the DiagramView when fitting content.
     * @param diagram the DiagramView instance to attach to
     * @param options optional configuration for minimum and maximum zoom levels
     */
    constructor(
        diagram: DiagramView,
        options?: {
            minZoom?: number,
            maxZoom?: number,
        }
    ) {
        this.diagram = diagram;
        if (options) {
            this.minZoom = options.minZoom !== undefined ? options.minZoom : this.minZoom;
            this.maxZoom = options.maxZoom !== undefined ? options.maxZoom : this.maxZoom;
        }
    }

    /**
     * Adjusts the viewport to fit the width of the nodes within the visible area of the canvas.
     * @param padding The padding to apply around the content.
     * @param alignment The alignment options for fitting the content.
     */
    public fitToWidth(padding: number = 32, alignment?: FitAlign): void {
        const bounds = this.diagram.getNodeBounds();
        if (!bounds) return;
        const canvas = this.diagram.getCanvas();
        const fitAlignment: FitAlign = {
            horizontal: alignment?.horizontal || 'center',
            vertical: alignment?.vertical || 'top',
        };

        const width = Math.max(1, canvas.width - padding * 2);
        const zoom = this.clampZoom(width / Math.max(bounds.width, 1));
        this.applyViewportForBounds(bounds, zoom, padding, fitAlignment);
    }

    /**
     * Adjusts the viewport to fit all nodes within the visible area of the canvas.
     * @param padding The padding to apply around the content.
     * @param alignment The alignment options for fitting the content.
     */
    public fitToNodes(padding: number = 32, alignment?: FitAlign): void {
        const bounds = this.diagram.getNodeBounds();
        if (!bounds) return;
        const canvas = this.diagram.getCanvas();

        const availableWidth = Math.max(1, canvas.width - padding * 2);
        const availableHeight = Math.max(1, canvas.height - padding * 2);
        const zoom = this.clampZoom(Math.min(
            availableWidth / Math.max(bounds.width, 1),
            availableHeight / Math.max(bounds.height, 1),
        ));
        this.applyViewportForBounds(bounds, zoom, padding, alignment);
    }

    /**
     * Applies the calculated viewport settings (zoom and pan) to the diagram based on the provided bounds.
     * This method applies a transform to the diagram's canvas and coordinate system.
     * @param bounds The bounding rectangle of the content to fit.
     * @param zoom The zoom level to apply.
     * @param padding The padding to apply around the content.
     * @param alignment The alignment options for fitting the content.
     */
    public applyViewportForBounds(bounds: IRect, zoom: number, padding: number = 32, alignment?: FitAlign): void {
        const canvas = this.diagram.getCanvas();
        const coordinates = this.diagram.getCoordinates();
        const horizontal = alignment?.horizontal || 'center';
        const vertical = alignment?.vertical || 'center';

        const contentWidth = bounds.width * zoom;
        const contentHeight = bounds.height * zoom;
        const offsetX = this.getHorizontalOffset(canvas.width, contentWidth, padding, horizontal);
        const offsetY = this.getVerticalOffset(canvas.height, contentHeight, padding, vertical);

        coordinates.zoom = zoom;
        coordinates.pan = {
            x: bounds.left * zoom - offsetX,
            y: bounds.top * zoom - offsetY,
        };
    }

    /**
     * Clamps the zoom value to the allowed range defined by `minZoom` and `maxZoom`.
     * @param value The zoom value to clamp.
     * @returns The clamped zoom value.
     */
    public clampZoom(value: number): number {
        return Math.min(this.maxZoom, Math.max(this.minZoom, value || 1));
    }

    private getHorizontalOffset(viewportWidth: number, contentWidth: number, padding: number, alignment: HorizontalAlign): number {
        switch (alignment) {
            case 'left':
                return padding;
            case 'right':
                return viewportWidth - padding - contentWidth;
            default:
                return (viewportWidth - contentWidth) / 2;
        }
    }

    private getVerticalOffset(viewportHeight: number, contentHeight: number, padding: number, alignment: VerticalAlign): number {
        switch (alignment) {
            case 'top':
                return padding;
            case 'bottom':
                return viewportHeight - padding - contentHeight;
            default:
                return (viewportHeight - contentHeight) / 2;
        }
    }

}
