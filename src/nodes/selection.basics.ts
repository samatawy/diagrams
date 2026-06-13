import type { IGrid, ILayer, INode } from "../interfaces";
import type { IPoint, IRect } from "../types";
import { NodeBasics } from "./node.basics";
import type { CoordinateSystem } from "../view/coordinate.system";

export type SelectionDiagram = {
    layers: ILayer[];
    grid: IGrid;
    node(id: string): INode | undefined;
    hitNodes(x: number, y: number): INode[];
    getCoordinates(): CoordinateSystem;
};

/**
 * Provides basic selection logic for determining which nodes are selected based on a rectangular selection area.
 * It supports both "include" mode (nodes fully inside the rectangle) and "touch" mode (nodes that intersect or are touched by the rectangle).
 * The selection process takes into account the visibility of layers and samples points within the rectangle to find nodes that may be partially covered.
 * This utility can be used in diagram editors to implement selection tools that allow users to select multiple nodes by dragging a selection box.
 * The methods are designed to work with the diagram's coordinate system and grid to ensure accurate selection behavior.
 */
export class SelectionBasics {

    /**
     * Returns the nodes within or touched by the specified rectangular area based on the selection mode.
     * @param diagram The diagram containing the nodes and layers.
     * @param rect The rectangular area to check for node selection.
     * @param mode The selection mode, either 'include' (nodes fully inside) or 'touch' (nodes intersecting).
     * @returns An array of nodes that match the selection criteria.
     */
    public static nodesForRect(diagram: SelectionDiagram, rect: IRect, mode: 'include' | 'touch'): INode[] {
        return mode === 'include'
            ? this.nodesInsideRect(diagram, rect)
            : this.nodesTouchingRect(diagram, rect);
    }

    /**
     * Returns the nodes that are fully inside the specified rectangular area.
     * @param diagram The diagram containing the nodes and layers.
     * @param rect The rectangular area to check for node selection.
     * @returns An array of nodes that are fully inside the rectangle.
     */
    public static nodesInsideRect(diagram: SelectionDiagram, rect: IRect): INode[] {
        const selected: INode[] = [];

        for (const node of this.visibleNodes(diagram)) {
            if (NodeBasics.inside(node, rect)) {
                selected.push(node);
            }
        }

        return selected;
    }

    /**
     * Returns the nodes that are inside or touching the specified rectangular area.
     * @param diagram The diagram containing the nodes and layers.
     * @param rect The rectangular area to check for node selection.
     * @returns An array of nodes that are inside or touching the rectangle.
     */
    public static nodesTouchingRect(diagram: SelectionDiagram, rect: IRect): INode[] {
        const selected = new Map<string, INode>();

        for (const node of this.nodesInsideRect(diagram, rect)) {
            selected.set(node.id, node);
        }

        for (const point of this.samplePoints(rect, diagram.grid)) {
            const canvasPoint = this.toCanvasPoint(diagram.getCoordinates(), point);
            for (const node of diagram.hitNodes(canvasPoint.x, canvasPoint.y)) {
                selected.set(node.id, node);
            }
        }

        return [...selected.values()];
    }

    private static visibleNodes(diagram: SelectionDiagram): INode[] {
        const nodes: INode[] = [];

        for (const layer of diagram.layers) {
            if (!layer.visible) continue;

            for (const id of layer.nodes) {
                const node = diagram.node(id);
                if (node) {
                    nodes.push(node);
                }
            }
        }

        return nodes;
    }

    private static samplePoints(rect: IRect, grid: IGrid): IPoint[] {
        const xs = this.axisSamples(rect.left, rect.width, grid.width || 16);
        const ys = this.axisSamples(rect.top, rect.height, grid.height || 16);
        const points: IPoint[] = [];

        for (const x of xs) {
            for (const y of ys) {
                points.push({ x, y });
            }
        }

        return points;
    }

    private static axisSamples(start: number, length: number, step: number): number[] {
        if (length <= 0) {
            return [start];
        }

        const values = [start, start + length / 2, start + length];
        for (let offset = step; offset < length; offset += step) {
            values.push(start + offset);
        }

        return values.filter((value, index, all) => all.findIndex(other => Math.abs(other - value) < 0.001) === index);
    }

    private static toCanvasPoint(coordinates: CoordinateSystem, point: IPoint): IPoint {
        return {
            x: point.x * coordinates.zoom - coordinates.pan.x,
            y: point.y * coordinates.zoom - coordinates.pan.y,
        };
    }
}