import type { IHandlePoint, INode } from "../../interfaces";
import { NodeHandle, type AnchorScope, type IRect } from "../../types";
import { isDiagramViewLike } from "../../guards";
import { AbstractGateAdapter } from "./abstract.gate.adapter";

/**
 * LogicXnorGateAdapter is a node adapter responsible for rendering XNOR gate nodes in the diagram.
 * It extends the AbstractGateAdapter to leverage basic rectangle rendering capabilities while adding specific logic for handling XNOR gate shapes and hit testing.
 * Registers with the NodeRegistry under the name 'logic_xnor_gate'.
 */
export class LogicXnorGateAdapter extends AbstractGateAdapter {

    public static TYPE = 'logic_xnor_gate';

    aspect_ratio = 1.36;

    protected renderGateShape(node: INode, rect: IRect, context: CanvasRenderingContext2D, show?: 'all' | 'quick'): Path2D {
        // 1. Define the bubble and offset for the extra curve
        const bubbleRadius = rect.height * 0.12;
        const curveOffset = rect.width * 0.12; // Distance between extra curve and body
        const bodyWidth = rect.width - curveOffset - bubbleRadius * 2; // Space for body + bubble
        const bodyX = rect.left + curveOffset;
        const bubbleCenterX = bodyX + bodyWidth + bubbleRadius;
        const bubbleCenterY = rect.top + rect.height * 0.5;

        // 2. Draw the OR body (shifted right by curveOffset, scaled to bodyWidth)
        const bodyPath = new Path2D();

        bodyPath.moveTo(bodyX, rect.top);

        // Top convex curve
        bodyPath.quadraticCurveTo(
            bodyX + bodyWidth * 0.75,
            rect.top + rect.height * 0.25,
            bodyX + bodyWidth,
            rect.top + rect.height * 0.5
        );

        // Bottom convex curve
        bodyPath.quadraticCurveTo(
            bodyX + bodyWidth * 0.75,
            rect.top + rect.height * 0.75,
            bodyX,
            rect.top + rect.height
        );

        // Concave back curve
        bodyPath.quadraticCurveTo(
            bodyX + bodyWidth * 0.2,
            rect.top + rect.height * 0.5,
            bodyX,
            rect.top
        );

        bodyPath.closePath();

        // 3. Draw the extra curved line on the left (with proper spacing)
        const extraCurvePath = new Path2D();

        extraCurvePath.moveTo(rect.left, rect.top); // Start at the absolute left edge
        extraCurvePath.quadraticCurveTo(
            rect.left + bodyWidth * 0.2,      // Control point aligned with body's curve
            rect.top + rect.height * 0.5,
            rect.left,                        // End at bottom left
            rect.top + rect.height
        );

        // 4. Draw the inversion bubble at the tip
        const bubblePath = new Path2D();
        bubblePath.arc(bubbleCenterX, bubbleCenterY, bubbleRadius, 0, Math.PI * 2);
        bubblePath.closePath();

        const path = new Path2D();
        path.addPath(bodyPath);
        path.addPath(extraCurvePath);
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