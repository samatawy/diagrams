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

export class SelectionBasics {

    static nodesForRect(diagram: SelectionDiagram, rect: IRect, mode: 'include' | 'touch'): INode[] {
        return mode === 'include'
            ? this.nodesInsideRect(diagram, rect)
            : this.nodesTouchingRect(diagram, rect);
    }

    static nodesInsideRect(diagram: SelectionDiagram, rect: IRect): INode[] {
        const selected: INode[] = [];

        for (const node of this.visibleNodes(diagram)) {
            if (NodeBasics.inside(node, rect)) {
                selected.push(node);
            }
        }

        return selected;
    }

    static nodesTouchingRect(diagram: SelectionDiagram, rect: IRect): INode[] {
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