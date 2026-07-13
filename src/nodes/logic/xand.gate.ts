import type { IHandlePoint, INode } from "../../interfaces";
import { NodeHandle, type AnchorScope, type IRect } from "../../types";
import { isDiagramViewLike } from "../../guards";
import { AbstractGateAdapter } from "./abstract.gate.adapter";

/**
 * LogicXandGateAdapter is a node adapter responsible for rendering XAND gate nodes in the diagram.
 * It extends the AbstractGateAdapter to leverage basic rectangle rendering capabilities while adding specific logic for handling XAND gate shapes and hit testing.
 * Registers with the NodeRegistry under the name 'logic_xand_gate'.
 */
export class LogicXandGateAdapter extends AbstractGateAdapter {

    public static TYPE = 'logic_xand_gate';

    aspect_ratio = 1.12;

    protected renderGateShape(node: INode, rect: IRect, context: CanvasRenderingContext2D, show?: 'all' | 'quick'): Path2D {
        // 1. Define the offset for the extra curve
        const curveOffset = rect.width * 0.12;
        const bodyX = rect.left + curveOffset;
        const bodyWidth = rect.width - curveOffset;

        // 2. Draw the AND body (shifted right by curveOffset)
        const bodyPath = new Path2D();

        // Top edge
        bodyPath.moveTo(bodyX, rect.top);
        bodyPath.lineTo(bodyX + bodyWidth * 0.5, rect.top);

        // Curved right side
        bodyPath.ellipse(
            bodyX + bodyWidth * 0.5,
            rect.top + rect.height * 0.5,
            bodyWidth * 0.5,
            rect.height * 0.5,
            0,
            -Math.PI / 2,
            Math.PI / 2
        );

        // Bottom edge
        bodyPath.lineTo(bodyX, rect.top + rect.height);
        bodyPath.closePath();

        // 3. Draw the extra curved line on the left
        // For XAND, this follows the contour of the AND gate's flat back
        const extraCurvePath = new Path2D();

        // A curved line parallel to the left edge, offset to the left
        // extraCurvePath.moveTo(bodyX - curveOffset * 0.3, rect.top);
        // extraCurvePath.quadraticCurveTo(
        //     bodyX - curveOffset * 0.5,  // Pulls it slightly inward
        //     rect.top + rect.height * 0.5,
        //     bodyX - curveOffset * 0.3,
        //     rect.top + rect.height
        // );
        extraCurvePath.moveTo(rect.left, rect.top); // Start at the very left edge
        extraCurvePath.quadraticCurveTo(
            rect.left + bodyWidth * 0.2,      // Control point aligned with body's curve
            rect.top + rect.height * 0.5,
            rect.left,                        // End at bottom left
            rect.top + rect.height
        );

        const path = new Path2D();
        path.addPath(bodyPath);
        path.addPath(extraCurvePath);
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