import type { IHandlePoint, INode } from "../../interfaces";
import { NodeHandle, type AnchorScope, type IPoint, type IRect } from "../../types";
import { isDiagramViewLike } from "../../guards";
import { AbstractGateAdapter } from "./abstract.gate.adapter";
import { textColor } from "../../value.utils";

/**
 * LogicMultiplexer_2_1Adapter is a node adapter responsible for rendering 2-to-1 multiplexer nodes in the diagram.
 * It extends the AbstractGateAdapter to leverage basic rectangle rendering capabilities while adding specific logic for handling multiplexer shapes and hit testing.
 * Registers with the NodeRegistry under the name 'logic_multiplexer_2_1'.
 */
export class LogicMultiplexer_2_1Adapter extends AbstractGateAdapter {

    public static TYPE = 'logic_multiplexer_2_1';

    connection_handles: NodeHandle[] = [NodeHandle.W, NodeHandle.E, NodeHandle.S];

    input_handles: NodeHandle[] = [NodeHandle.W, NodeHandle.S];
    output_handles: NodeHandle[] = [NodeHandle.E];

    aspect_ratio = 1 / 1.15;

    protected renderGateShape(node: INode, rect: IRect, context: CanvasRenderingContext2D, show?: 'all' | 'quick'): Path2D {
        // Reserve space for the selector input line at the bottom
        const selectorLineHeight = rect.height * 0.15;
        const bodyHeight = rect.height - selectorLineHeight;

        // Trapezoid: wide on left (inputs), narrow on right (output)
        const rightInset = bodyHeight * 0.2;

        // 1. Draw the trapezoid body
        const bodyPath = new Path2D();
        bodyPath.moveTo(rect.left, rect.top);                                    // Top-left
        bodyPath.lineTo(rect.left + rect.width, rect.top + rightInset);               // Top-right (angled down)
        bodyPath.lineTo(rect.left + rect.width, rect.top + bodyHeight - rightInset);  // Bottom-right
        bodyPath.lineTo(rect.left, rect.top + bodyHeight);                       // Bottom-left
        bodyPath.closePath();

        // 2. Draw the selector line extending down from the bottom center
        const selectorX = rect.left + rect.width * 0.5;
        const selectorPath = new Path2D();
        selectorPath.moveTo(selectorX, rect.top + bodyHeight);
        selectorPath.lineTo(selectorX, rect.top + rect.height);

        // 3. Draw the pin labels
        context.save();
        context.fillStyle = textColor(node);
        context.font = `${Math.min(rect.width, bodyHeight) * 0.2}px sans-serif`;
        context.textBaseline = 'middle';

        const labelInset = rect.width * 0.1;

        // Left side: input labels "0" and "1"
        context.textAlign = 'left';
        context.fillText('0', rect.left + labelInset, rect.top + bodyHeight * (1 / 3));
        context.fillText('1', rect.left + labelInset, rect.top + bodyHeight * (2 / 3));

        // Right side: output label "Y"
        context.textAlign = 'right';
        context.fillText('Y', rect.left + rect.width - labelInset, rect.top + bodyHeight * 0.5);

        // Bottom: selector label "S" (positioned inside the trapezoid near the bottom)
        context.textAlign = 'center';
        context.fillText('S', selectorX, rect.top + bodyHeight - rightInset * 1.5);
        context.restore();

        const path = new Path2D();
        path.addPath(bodyPath);
        path.addPath(selectorPath);

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
            { handle: NodeHandle.W, point: { x: rect.left, y: rect.top + rect.height * 0.283 } }, // Left higher (D0)
            { handle: NodeHandle.W, point: { x: rect.left, y: rect.top + rect.height * 0.567 } }, // Left lower (D1)

            { handle: NodeHandle.E, point: { x: rect.left + rect.width, y: rect.top + rect.height * 0.423 } }, // right middle (Y)

            { handle: NodeHandle.S, point: { x: rect.left + rect.width * 0.5, y: rect.top + rect.height } }, // bottom center (S)
        ];

        if (show === 'all_handles') {
            return [...inherited, ...connectionHandles];
        } else {
            return connectionHandles.filter(anchor => this.canConnectTo(node, anchor.handle, direction, undefined, anchor.point));
            // return connectionHandles.filter(anchor => this.canConnect(node, direction, anchor.handle, anchor.point));
        }
    }

    public override onCreateDraft(tool: string): Partial<INode> | undefined {
        const draft = super.onCreateDraft(tool);
        return {
            ...draft,
            locked_aspect: false,
        };
    }

}