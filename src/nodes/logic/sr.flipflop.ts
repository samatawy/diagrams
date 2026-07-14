import type { IHandlePoint, INode } from "../../interfaces";
import { NodeHandle, type AnchorScope, type IRect } from "../../types";
import { isDiagramViewLike } from "../../guards";
import { AbstractGateAdapter } from "./abstract.gate.adapter";
import { textColor } from "../../value.utils";

/**
 * LogicSRFlipFlopAdapter is a node adapter responsible for rendering SR flip-flop nodes in the diagram.
 * It extends the AbstractGateAdapter to leverage basic rectangle rendering capabilities while adding specific logic for handling SR flip-flop shapes and hit testing.
 * Registers with the NodeRegistry under the name 'sr_flipflop'.
 */
export class LogicSRFlipFlopAdapter extends AbstractGateAdapter {

    public static TYPE = 'logic_sr_flipflop';

    protected renderGateShape(node: INode, rect: IRect, context: CanvasRenderingContext2D, show?: 'all' | 'quick'): Path2D {
        // 1. Draw the main rectangular body
        const bodyPath = new Path2D();
        bodyPath.rect(rect.left, rect.top, rect.width, rect.height);

        // 2. Draw the clock wedge on the CLK input (middle of left side)
        const wedgeSize = Math.min(rect.width, rect.height) * 0.12;
        const clkY = rect.top + rect.height * 0.5; // CLK is exactly in the middle

        const wedgePath = new Path2D();
        wedgePath.moveTo(rect.left, clkY - wedgeSize);           // Top of wedge
        wedgePath.lineTo(rect.left + wedgeSize, clkY);           // Point (inside)
        wedgePath.lineTo(rect.left, clkY + wedgeSize);           // Bottom of wedge
        wedgePath.closePath();

        // 3. Draw the pin labels
        context.save();
        context.fillStyle = textColor(node);
        context.font = `${Math.min(rect.width, rect.height) * 0.18}px sans-serif`;
        context.textBaseline = 'middle';

        const labelInset = rect.width * 0.08;

        // Left side labels (inputs) - 3 inputs, so we use 1/4, 2/4, 3/4 spacing
        context.textAlign = 'left';
        context.fillText('S', rect.left + labelInset, rect.top + rect.height * 0.25);
        context.fillText('CLK', rect.left + labelInset, clkY);
        context.fillText('R', rect.left + labelInset, rect.top + rect.height * 0.75);

        // Right side labels (outputs) - 2 outputs, so we use 1/3, 2/3 spacing
        context.textAlign = 'right';
        context.fillText('Q', rect.left + rect.width - labelInset, rect.top + rect.height * (1 / 3));
        context.fillText('Q̄', rect.left + rect.width - labelInset, rect.top + rect.height * (2 / 3));
        context.restore();

        const path = new Path2D();
        path.addPath(bodyPath);
        path.addPath(wedgePath);
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
            { handle: NodeHandle.W, point: { x: rect.left, y: rect.top + rect.height / 3 } }, // Left higher (S)
            { handle: NodeHandle.W, point: { x: rect.left, y: rect.top + rect.height * 2 / 3 } }, // Left lower (R)

            { handle: NodeHandle.E, point: { x: rect.left + rect.width, y: rect.top + rect.height / 3 } }, // right higher (Q)
            { handle: NodeHandle.E, point: { x: rect.left + rect.width, y: rect.top + rect.height * 2 / 3 } }, // right lower (Q̄)
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