import type { IDiagram, IGrid, INode } from "../interfaces";
import type { IPoint, IRect } from "../types";
import { isDiagramViewLike } from "../guards";
import { nodeAngle } from "../value.utils";

/**
 * CoordinateSystem is a utility class that manages the transformation between diagram coordinates and canvas coordinates, including handling zooming, panning, and grid snapping.
 * It provides methods to convert points between the diagram's coordinate system and the canvas coordinate system, as well as methods to apply the current viewport transformation to a canvas context.
 * The class also includes functionality to snap points to a grid if the grid is forced, and to calculate bounding rectangles for nodes based on their geometry and rotation.
 */
export class CoordinateSystem {

    private diagram?: IDiagram;

    private context: CanvasRenderingContext2D;

    private origin: IPoint = { x: 0, y: 0 };

    private zoom_factor: number = 1;

    private pixel_ratio: number = 1;

    /**
     * Creates an instance of CoordinateSystem and attaches it to a canvas rendering context.
     * The CoordinateSystem will use this context to apply transformations and perform hit testing.
     * @param context the CanvasRenderingContext2D to attach to the CoordinateSystem
     */
    constructor(context: CanvasRenderingContext2D) {
        this.context = context;
    }

    /**
     * Attaches a diagram to the CoordinateSystem, allowing it to access diagram-level information such as the grid.
     * @param diagram the IDiagram to attach to the CoordinateSystem
     */
    public attach(diagram: IDiagram): void {
        this.diagram = diagram;
    }

    get zoom(): number {
        return this.zoom_factor;
    }

    set zoom(value: number) {
        this.zoom_factor = value;
    }

    get pan(): IPoint {
        return this.origin;
    }

    set pan(value: IPoint) {
        this.origin = value;
    }

    get pixelRatio(): number {
        return this.pixel_ratio;
    }

    set pixelRatio(value: number) {
        this.pixel_ratio = Number.isFinite(value) && value > 0 ? value : 1;
    }

    /**
     * Applies the current viewport transformation to the specified canvas context, including zooming and panning.
     * @param context the CanvasRenderingContext2D to apply the transformation to
     */
    public applyViewportTransform(context: CanvasRenderingContext2D = this.context): void {
        const scale = this.zoom_factor * this.pixel_ratio;
        context.setTransform(
            scale,
            0,
            0,
            scale,
            -this.origin.x * this.pixel_ratio,
            -this.origin.y * this.pixel_ratio,
        );
    }

    /**
     * Resets the transformation of the specified canvas context to the identity matrix, effectively removing any zooming or panning.
     * @param context the CanvasRenderingContext2D to reset the transformation for
     */
    public resetTransform(context: CanvasRenderingContext2D = this.context): void {
        context.setTransform(this.pixel_ratio, 0, 0, this.pixel_ratio, 0, 0);
    }

    /**
     * Converts the specified coordinates to the nearest grid point, if a grid is defined and forced.
     * @param x the x-coordinate to convert
     * @param y the y-coordinate to convert
     * @param grid an optional grid to use for snapping, defaults to the diagram's grid if not provided
     * @returns the nearest grid point
     */
    public getGridPoint(x: number, y: number, grid?: IGrid): IPoint {
        let pt = {
            x: x,
            y: y
        }
        grid = grid || this.diagram?.grid;

        if (grid && grid.forced) {

            if (grid.width) {
                pt.x = Math.round(pt.x / grid.width) * grid.width;
            }
            if (grid.height) {
                pt.y = Math.round(pt.y / grid.height) * grid.height;
            }
        }
        return pt;
    }

    /**
     * Converts the specified canvas coordinates to diagram coordinates, applying the current zoom and pan transformations, and optionally snapping to the grid.
     * @param x the x-coordinate in canvas space
     * @param y the y-coordinate in canvas space
     * @param grid an optional grid to use for snapping, defaults to the diagram's grid if not provided
     * @returns the corresponding point in diagram coordinates
     */
    public getPoint(x: number, y: number, grid?: IGrid | 'ignore_grid'): IPoint {
        let pt = {
            x: (x + this.origin.x) / this.zoom_factor,
            y: (y + this.origin.y) / this.zoom_factor
        }
        if (grid == 'ignore_grid') {
            return pt;
        } else {
            return this.getGridPoint(pt.x, pt.y, grid);
        }
    }

    /**
     * Converts the specified pointer event coordinates to diagram coordinates, applying the current zoom and pan transformations, and optionally snapping to the grid.
     * @param event the PointerEvent to convert
     * @param grid an optional grid to use for snapping, defaults to the diagram's grid if not provided
     * @returns the corresponding point in diagram coordinates
     */
    public getPointFromEvent(event: PointerEvent, grid?: IGrid | 'ignore_grid'): IPoint {
        if (event.ctrlKey || event.metaKey) {
            return this.getPoint(event.offsetX, event.offsetY, 'ignore_grid');
        } else {
            return this.getPoint(event.offsetX, event.offsetY, grid);
        }
    }

    /**
     * Converts the specified point from canvas coordinates to diagram coordinates, applying the current zoom and pan transformations, and optionally snapping to the grid.
     * @param pt the point in canvas coordinates to convert
     * @param rect the bounding rectangle of the shape
     * @param angle the rotation angle of the shape
     * @param cos optional precomputed cosine of the angle
     * @param sin optional precomputed sine of the angle
     * @returns the corresponding point in diagram coordinates
     */
    public getHitPoint(pt: IPoint, rect: IRect, angle: number, cos?: number, sin?: number): IPoint {
        pt = {
            x: (pt.x + this.origin.x) / this.zoom_factor,
            y: (pt.y + this.origin.y) / this.zoom_factor
        }
        if (!angle) return pt;
        // The following lines should NEVER be called !!
        if (!cos) cos = Math.cos(angle);
        if (!sin) sin = Math.sin(angle);

        let center = {
            x: (rect.left + rect.width / 2),
            y: (rect.top + rect.height / 2)
        };

        // translate point back to origin:
        pt.x -= center.x;
        pt.y -= center.y;

        // rotate point
        let xnew = pt.x * cos - pt.y * -sin;
        let ynew = pt.x * -sin + pt.y * cos;

        // Don't change the actual point..
        pt.x += center.x;
        pt.y += center.y;

        // translate point back:
        return {
            x: xnew + center.x,
            y: ynew + center.y
        };
    }

    /**
     * Converts the specified point from diagram coordinates to canvas coordinates, applying the current zoom and pan transformations.
     * @param pt the point in diagram coordinates to convert
     * @param rect the bounding rectangle of the shape
     * @param angle the rotation angle of the shape
     * @param cos optional precomputed cosine of the angle
     * @param sin optional precomputed sine of the angle
     * @returns the corresponding point in canvas coordinates
     */
    public getRenderPoint(pt: IPoint, rect: IRect, angle: number, cos?: number, sin?: number): IPoint {
        if (!angle) return pt;

        let center = {
            x: (rect.left + rect.width / 2),
            y: (rect.top + rect.height / 2)
        };

        // translate point back to origin:
        pt.x -= center.x;
        pt.y -= center.y;

        // rotate point
        angle = -angle;
        cos = Math.cos(angle);
        sin = Math.sin(angle);
        let xnew = pt.x * cos - pt.y * -sin;
        let ynew = pt.x * -sin + pt.y * cos;

        // Don't change the actual point..
        pt.x += center.x;
        pt.y += center.y;

        return {
            x: xnew + center.x,
            y: ynew + center.y,
        }
    }

    /**
     * Calculates the bounding rectangle for a given node, taking into account its geometry and rotation. 
     * If the node has multiple points, it calculates the bounding rectangle defined by the top-left and bottom-right points. 
     * If the node is rotated, it calculates the bounding rectangle after rotation to ensure that it encompasses the entire shape.
     * @param node the INode for which to calculate the bounding rectangle
     * @param withAngle whether to take the node's rotation angle into account when calculating the bounding rectangle.
     * @returns the calculated bounding rectangle
     */
    public getBoundingRect(node: INode, withAngle?: boolean): IRect {
        const diagram = node.owner;
        if (!isDiagramViewLike(diagram)) return { left: 0, top: 0, width: 0, height: 0 };
        const cache = diagram.getCache();

        if (node.points.length > 1) {
            // get bounding rect defined by top-left and bottom-right points..

            let from = { x: node.points[0]!.x, y: node.points[0]!.y }
            let to = { x: from.x, y: from.y }

            for (let pt of node.points) {
                from.x = Math.min(from.x, pt.x)
                from.y = Math.min(from.y, pt.y)
                to.x = Math.max(to.x, pt.x)
                to.y = Math.max(to.y, pt.y)
            }
            let rect = { left: from.x, top: from.y, width: to.x - from.x, height: to.y - from.y };

            if (!withAngle || !node.angle) {
                // Return bounding rect unchanged..
                return rect;

            } else {
                const angle = nodeAngle(node);
                const cached = cache.getNode(node);
                const cos = cached?.cos || Math.cos(angle);
                const sin = cached?.sin || Math.sin(angle);

                // Calculate bounding rect after rotation.. 
                // (Reserved only for previews to prevent clipping off rotated shapes..)
                let nw = this.getRenderPoint(from, rect, angle, cos, sin);
                let ne = this.getRenderPoint({ x: to.x, y: from.y }, rect, angle, cos, sin);
                let sw = this.getRenderPoint({ x: from.x, y: to.y }, rect, angle, cos, sin);
                let se = this.getRenderPoint(to, rect, angle, cos, sin);

                from.x = Math.min(nw.x, ne.x, sw.x, se.x);
                from.y = Math.min(nw.y, ne.y, sw.y, se.y);
                to.x = Math.max(nw.x, ne.x, sw.x, se.x);
                to.y = Math.max(nw.y, ne.y, sw.y, se.y);

                return { left: from.x, top: from.y, width: to.x - from.x, height: to.y - from.y };
            }
        }
        return { left: 0, top: 0, width: 0, height: 0 };
    }

    /**
     * Detects whether a given point (x, y) is within the stroke of a specified path, taking into account an optional line width.
     * This method is useful for hit testing when determining if a user interaction (like a mouse click) occurred on the border of a shape.
     * @param path the Path2D object representing the shape's stroke
     * @param x the x-coordinate of the point to test
     * @param y the y-coordinate of the point to test
     * @param lineWidth optional line width to consider for the stroke
     * @returns true if the point is within the stroke, false otherwise
     */
    public isPointInStroke(path: Path2D, x: number, y: number, lineWidth?: number): boolean {
        if (!lineWidth || lineWidth <= 0) {
            return this.context.isPointInStroke(path, x, y);
        }

        this.context.save();
        this.context.lineWidth = lineWidth;
        const hit = this.context.isPointInStroke(path, x, y);
        this.context.restore();
        return hit;
    }

    /**
     * Detects whether a given point (x, y) is within the path of a specified shape.
     * This method is useful for hit testing when determining if a user interaction (like a mouse click) occurred inside a shape.
     * @param path the Path2D object representing the shape's path
     * @param x the x-coordinate of the point to test
     * @param y the y-coordinate of the point to test
     * @returns true if the point is within the path, false otherwise
     */
    public isPointInPath(path: Path2D, x: number, y: number): boolean {
        return this.context.isPointInPath(path, x, y);
    }

}