import type { IHandlePoint, INode } from "../../interfaces";
import { NodeHandle, type AnchorScope, type IRect } from "../../types";
import { isDiagramViewLike } from "../../guards";
import { AbstractGateAdapter } from "./abstract.gate.adapter";

/**
 * LogicBufferAdapter is a node adapter responsible for rendering BUFFER gate nodes in the diagram.
 * It extends the AbstractGateAdapter to leverage basic rectangle rendering capabilities while adding specific logic for handling BUFFER gate shapes and hit testing.
 * Registers with the NodeRegistry under the name 'logic_buffer_gate'.
 */
export class LogicBufferAdapter extends AbstractGateAdapter {

    public static TYPE = 'logic_buffer';

    aspect_ratio = 1.0;

    protected renderGateShape(node: INode, rect: IRect, context: CanvasRenderingContext2D, show?: 'all' | 'quick'): Path2D {
        // 1. Draw the triangle body (takes up full width)
        const trianglePath = new Path2D();

        trianglePath.moveTo(rect.left, rect.top);                      // Top-left
        trianglePath.lineTo(rect.left, rect.top + rect.height);       // Bottom-left
        trianglePath.lineTo(rect.left + rect.width, rect.top + rect.height * 0.5); // Point on the right
        trianglePath.closePath();
        return trianglePath;
    }

    public getAnchors(node: INode, show: AnchorScope): IHandlePoint[] {
        const inherited = super.getAnchors(node, show);
        if (show === 'selection_handles') {
            return inherited;
        }

        const diagram = node.owner;
        if (!isDiagramViewLike(diagram)) return [];
        const coordinates = diagram.getCoordinates();
        const rect = coordinates.getBoundingRect(node);

        const connectionHandles = [
            { handle: NodeHandle.W, point: { x: rect.left, y: rect.top + rect.height / 2 } }, // Left middle
            { handle: NodeHandle.E, point: { x: rect.left + rect.width, y: rect.top + rect.height / 2 } }, // Right middle
        ];

        if (show === 'all_handles') {
            return [...inherited, ...connectionHandles];
        } else {
            return connectionHandles.filter(anchor => this.canConnect(node, 'any', anchor.handle, anchor.point));
        }
    }

}