import type { IHandlePoint, INode } from "../../interfaces";
import { NodeHandle, type AnchorScope, type IRect } from "../../types";
import { isDiagramViewLike } from "../../guards";
import { AbstractGateAdapter } from "./abstract.gate.adapter";

/**
 * LogicOrGateAdapter is a node adapter responsible for rendering OR gate nodes in the diagram.
 * It extends the AbstractGateAdapter to leverage basic rectangle rendering capabilities while adding specific logic for handling OR gate shapes and hit testing.
 * Registers with the NodeRegistry under the name 'logic_or-gate'.
 */
export class LogicOrGateAdapter extends AbstractGateAdapter {

    public static TYPE = 'logic_or_gate';

    protected renderGateShape(node: INode, rect: IRect, context: CanvasRenderingContext2D, show?: 'all' | 'quick'): Path2D {
        const path = new Path2D();
        // 1. Start at top-left corner
        path.moveTo(rect.left, rect.top);

        // 2. Draw top convex curve to the point on the right
        // Using quadraticCurveTo for a smooth curve
        path.quadraticCurveTo(
            rect.left + rect.width * 0.75,  // Control point X (pulls curve outward)
            rect.top + rect.height * 0.25, // Control point Y
            rect.left + rect.width,         // End point X (the tip)
            rect.top + rect.height * 0.5   // End point Y (middle height)
        );

        // 3. Draw bottom convex curve back to bottom-left
        path.quadraticCurveTo(
            rect.left + rect.width * 0.75,  // Control point X
            rect.top + rect.height * 0.75, // Control point Y
            rect.left,                 // End point X (left edge)
            rect.top + rect.height         // End point Y (bottom-left)
        );

        // 4. Draw the concave back curve (the distinctive "scoop" on the left)
        // This curves inward, creating the classic OR gate shape
        path.quadraticCurveTo(
            rect.left + rect.width * 0.2,   // Control point X (pulls curve inward)
            rect.top + rect.height * 0.5,  // Control point Y (middle)
            rect.left,                 // End point X (back to top-left)
            rect.top                  // End point Y
        );

        // Close the path (optional, but ensures clean fill)
        path.closePath();
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
            { handle: NodeHandle.W, point: { x: rect.left, y: rect.top + rect.height / 3 } }, // Left higher
            { handle: NodeHandle.W, point: { x: rect.left, y: rect.top + rect.height * 2 / 3 } }, // Left lower

            { handle: NodeHandle.E, point: { x: rect.left + rect.width, y: rect.top + rect.height / 2 } }, // Right middle
        ];

        if (show === 'all_handles') {
            return [...inherited, ...connectionHandles];
        } else {
            return connectionHandles.filter(anchor => this.canConnectTo(node, anchor.handle, direction, undefined, anchor.point));
            // return connectionHandles.filter(anchor => this.canConnect(node, direction, anchor.handle, anchor.point));
        }
    }

}