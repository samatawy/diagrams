import type { IHandlePoint, INode } from "../../interfaces";
import { NodeHandle, type AnchorScope, type IRect } from "../../types";
import { isDiagramViewLike } from "../../guards";
import { AbstractGateAdapter } from "./abstract.gate.adapter";

/**
 * LogicNandGateAdapter is a node adapter responsible for rendering NAND gate nodes in the diagram.
 * It extends the AbstractGateAdapter to leverage basic rectangle rendering capabilities while adding specific logic for handling NAND gate shapes and hit testing.
 * Registers with the NodeRegistry under the name 'logic_nand_gate'.
 */
export class LogicNandGateAdapter extends AbstractGateAdapter {

    public static TYPE = 'logic_nand_gate';

    aspect_ratio = 1.24;

    protected renderGateShape(node: INode, rect: IRect, context: CanvasRenderingContext2D, show?: 'all' | 'quick'): Path2D {
        // 1. Define proportions (same as NOT gate)
        const bubbleRadius = rect.height * 0.12;
        const bodyWidth = rect.width - bubbleRadius * 2; // Space for the AND body
        const bubbleCenterX = rect.left + bodyWidth + bubbleRadius;
        const bubbleCenterY = rect.top + rect.height * 0.5;

        // 2. Draw the AND body (scaled to fit bodyWidth)
        const bodyPath = new Path2D();

        // Top edge
        bodyPath.moveTo(rect.left, rect.top);
        bodyPath.lineTo(rect.left + bodyWidth * 0.5, rect.top);

        // Curved right side (semi-ellipse)
        bodyPath.ellipse(
            rect.left + bodyWidth * 0.5,    // Center X
            rect.top + rect.height * 0.5,       // Center Y
            bodyWidth * 0.5,        // X Radius (scaled to bodyWidth)
            rect.height * 0.5,           // Y Radius
            0,                      // Rotation
            -Math.PI / 2,           // Start angle (top)
            Math.PI / 2             // End angle (bottom)
        );

        // Bottom edge
        bodyPath.lineTo(rect.left, rect.top + rect.height);
        bodyPath.closePath();

        // 3. Draw the inversion bubble (small circle at the tip)
        const bubblePath = new Path2D();
        bubblePath.arc(bubbleCenterX, bubbleCenterY, bubbleRadius, 0, Math.PI * 2);

        const path = new Path2D();
        path.addPath(bodyPath);
        path.addPath(bubblePath);
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