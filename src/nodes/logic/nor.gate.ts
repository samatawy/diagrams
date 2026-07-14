import type { IHandlePoint, INode } from "../../interfaces";
import { NodeHandle, type AnchorScope, type IRect } from "../../types";
import { isDiagramViewLike } from "../../guards";
import { AbstractGateAdapter } from "./abstract.gate.adapter";

/**
 * LogicNorGateAdapter is a node adapter responsible for rendering NOR gate nodes in the diagram.
 * It extends the AbstractGateAdapter to leverage basic rectangle rendering capabilities while adding specific logic for handling NOR gate shapes and hit testing.
 * Registers with the NodeRegistry under the name 'logic_nor_gate'.
 */
export class LogicNorGateAdapter extends AbstractGateAdapter {

    public static TYPE = 'logic_nor_gate';

    aspect_ratio = 1.24;

    protected renderGateShape(node: INode, rect: IRect, context: CanvasRenderingContext2D, show?: 'all' | 'quick'): Path2D {
        // 1. Define proportions (same as NOT gate)
        const bubbleRadius = rect.height * 0.12;
        const bodyWidth = rect.width - bubbleRadius * 2; // Space for the OR body
        const bubbleCenterX = rect.left + bodyWidth + bubbleRadius;
        const bubbleCenterY = rect.top + rect.height * 0.5;

        // 2. Draw the OR body (scaled to fit bodyWidth)
        const bodyPath = new Path2D();

        // Start at top-left
        bodyPath.moveTo(rect.left, rect.top);

        // Top convex curve to the point on the right
        bodyPath.quadraticCurveTo(
            rect.left + bodyWidth * 0.75,   // Control point X (scaled)
            rect.top + rect.height * 0.25,
            rect.left + bodyWidth,          // End point X (right edge of body)
            rect.top + rect.height * 0.5
        );

        // Bottom convex curve back to bottom-left
        bodyPath.quadraticCurveTo(
            rect.left + bodyWidth * 0.75,   // Control point X (scaled)
            rect.top + rect.height * 0.75,
            rect.left,                      // End point X (left edge)
            rect.top + rect.height
        );

        // Concave back curve (the "scoop")
        bodyPath.quadraticCurveTo(
            rect.left + bodyWidth * 0.2,    // Control point X (scaled)
            rect.top + rect.height * 0.5,
            rect.left,                      // End point X (back to top-left)
            rect.top
        );

        bodyPath.closePath();

        // 3. Draw the inversion bubble
        const bubblePath = new Path2D();
        bubblePath.arc(bubbleCenterX, bubbleCenterY, bubbleRadius, 0, Math.PI * 2);
        bubblePath.closePath();

        const path = new Path2D();
        path.addPath(bodyPath);
        path.addPath(bubblePath);
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