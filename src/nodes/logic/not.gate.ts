import type { IHandlePoint, INode } from "../../interfaces";
import { NodeHandle, type AnchorScope, type IRect } from "../../types";
import { isDiagramViewLike } from "../../guards";
import { AbstractGateAdapter } from "./abstract.gate.adapter";

/**
 * LogicNotGateAdapter is a node adapter responsible for rendering NOT gate nodes in the diagram.
 * It extends the AbstractGateAdapter to leverage basic rectangle rendering capabilities while adding specific logic for handling NOT gate shapes and hit testing.
 * Registers with the NodeRegistry under the name 'logic_not_gate'.
 */
export class LogicNotGateAdapter extends AbstractGateAdapter {

    public static TYPE = 'logic_not_gate';

    aspect_ratio = 1.24;

    protected renderGateShape(node: INode, rect: IRect, context: CanvasRenderingContext2D, show?: 'all' | 'quick'): Path2D {
        const bubbleRadius = rect.height * 0.12;
        const triangleTipX = rect.left + rect.width - bubbleRadius * 2;
        const bubbleCenterX = triangleTipX + bubbleRadius;
        const bubbleCenterY = rect.top + rect.height * 0.5;

        // 2. Draw the triangle body
        const trianglePath = new Path2D();
        trianglePath.moveTo(rect.left, rect.top);                      // Top-left
        trianglePath.lineTo(rect.left, rect.top + rect.height);             // Bottom-left
        trianglePath.lineTo(triangleTipX, bubbleCenterY);   // Point on the right
        trianglePath.closePath();

        // 3. Draw the inversion bubble (small circle at the tip)
        const bubblePath = new Path2D();
        bubblePath.arc(bubbleCenterX, bubbleCenterY, bubbleRadius, 0, Math.PI * 2);

        const path = new Path2D();
        path.addPath(trianglePath);
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
            { handle: NodeHandle.W, point: { x: rect.left, y: rect.top + rect.height / 2 } }, // Left middle

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