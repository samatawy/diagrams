import type { IHandlePoint, INode } from "../../interfaces";
import { NodeHandle, type AnchorScope, type IRect } from "../../types";
import { isDiagramViewLike } from "../../guards";
import { AbstractGateAdapter } from "./abstract.gate.adapter";

/**
 * LogicAndGateAdapter is a node adapter responsible for rendering AND gate nodes in the diagram.
 * It extends the AbstractGateAdapter to leverage basic rectangle rendering capabilities while adding specific logic for handling AND gate shapes and hit testing.
 * Registers with the NodeRegistry under the name 'logic_and-gate'.
 */
export class LogicAndGateAdapter extends AbstractGateAdapter {

    public static TYPE = 'logic_and_gate';

    protected renderGateShape(node: INode, rect: IRect, context: CanvasRenderingContext2D, show?: 'all' | 'quick'): Path2D {
        const path = new Path2D();
        path.moveTo(rect.left, rect.top);

        // Draw top edge to the start of the curve (50% across)
        path.lineTo(rect.left + rect.width * 0.5, rect.top);

        // Draw the curved right side (semi-circle/ellipse)
        // Parameters: centerX, centerY, radiusX, radiusY, rotation, startAngle, endAngle
        path.ellipse(
            rect.left + rect.width * 0.5,          // Center X (middle of the bounding box)
            rect.top + rect.height * 0.5,         // Center Y (middle of the bounding box)
            rect.width * 0.5,              // X Radius (half the width)
            rect.height * 0.5,             // Y Radius (half the height)
            0,                        // Rotation (0 radians)
            -Math.PI / 2,             // Start angle (Top: -90 degrees)
            Math.PI / 2               // End angle (Bottom: 90 degrees)
        );

        // Draw bottom edge back to the left side
        path.lineTo(rect.left, rect.top + rect.height);

        path.closePath();
        return path;
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
            { handle: NodeHandle.W, point: { x: rect.left, y: rect.top + rect.height / 3 } }, // Left higher
            { handle: NodeHandle.W, point: { x: rect.left, y: rect.top + rect.height * 2 / 3 } }, // Left lower
            { handle: NodeHandle.E, point: { x: rect.left + rect.width, y: rect.top + rect.height / 2 } }, // Right middle
        ];

        if (show === 'all_handles') {
            return [...inherited, ...connectionHandles];
        } else {
            return connectionHandles.filter(anchor => this.canConnect(node, 'any', anchor.handle, anchor.point));
        }
    }

}