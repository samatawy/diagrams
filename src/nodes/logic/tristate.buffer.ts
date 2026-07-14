import type { IHandlePoint, INode } from "../../interfaces";
import { NodeHandle, type AnchorScope, type IRect } from "../../types";
import { isDiagramViewLike } from "../../guards";
import { AbstractGateAdapter } from "./abstract.gate.adapter";

/**
 * LogicTristateBufferAdapter is a node adapter responsible for rendering TRISTATE BUFFER gate nodes in the diagram.
 * It extends the AbstractGateAdapter to leverage basic rectangle rendering capabilities while adding specific logic for handling TRISTATE BUFFER gate shapes and hit testing.
 * Registers with the NodeRegistry under the name 'logic_tristate_buffer_gate'.
 */
export class LogicTristateBufferAdapter extends AbstractGateAdapter {

    public static TYPE = 'logic_tristate_buffer';

    connection_handles: NodeHandle[] = [NodeHandle.W, NodeHandle.E, NodeHandle.S];

    input_handles: NodeHandle[] = [NodeHandle.W, NodeHandle.S];
    output_handles: NodeHandle[] = [NodeHandle.E];

    aspect_ratio = 1.0 / 1.2; // Slightly taller than wide to accommodate the enable input

    protected renderGateShape(node: INode, rect: IRect, context: CanvasRenderingContext2D, show?: 'all' | 'quick'): Path2D {
        // 1. Define proportions
        // The enable input takes up some space at the bottom
        const enableInputHeight = rect.height * 0.2;
        const bodyHeight = rect.height - enableInputHeight;
        const bodyY = rect.top;

        // 2. Draw the buffer triangle (upper portion)
        const trianglePath = new Path2D();

        trianglePath.moveTo(rect.left, bodyY);                      // Top-left
        trianglePath.lineTo(rect.left, bodyY + bodyHeight);         // Bottom-left of triangle
        trianglePath.lineTo(rect.left + rect.width, bodyY + bodyHeight * 0.5); // Point on the right
        trianglePath.closePath();

        // 3. Draw the enable input line (comes in from the bottom-left)
        const enablePath = new Path2D();

        // Line from bottom-left corner going up to meet the triangle
        enablePath.moveTo(rect.left + rect.width * 0.15, rect.top + rect.height); // Start at bottom
        enablePath.lineTo(rect.left + rect.width * 0.15, bodyY + bodyHeight * 0.7); // End inside triangle

        const path = new Path2D();
        path.addPath(trianglePath);
        path.addPath(enablePath);
        return path;
    }

    public getAnchors(node: INode, show: AnchorScope, direction: 'from' | 'to' | 'any' = 'any'): IHandlePoint[] {
        const inherited = super.getAnchors(node, show, direction);
        if (show === 'selection_handles') {
            return inherited;
        }

        const diagram = node.owner;
        if (!isDiagramViewLike(diagram)) return [];
        const coordinates = diagram.getCoordinates();
        const rect = coordinates.getBoundingRect(node);

        const connectionHandles = [
            { handle: NodeHandle.W, point: { x: rect.left, y: rect.top + rect.height * 0.4 } }, // Left above middle

            { handle: NodeHandle.E, point: { x: rect.left + rect.width, y: rect.top + rect.height * 0.4 } }, // Right above middle

            { handle: NodeHandle.S, point: { x: rect.left + rect.width * 0.15, y: rect.top + rect.height } }, // Enable: Left bottom
        ];

        if (show === 'all_handles') {
            return [...inherited, ...connectionHandles];
        } else {
            return connectionHandles.filter(anchor => this.canConnectTo(node, anchor.handle, direction, undefined, anchor.point));
            // return connectionHandles.filter(anchor => this.canConnect(node, direction, anchor.handle, anchor.point));
        }
    }

}