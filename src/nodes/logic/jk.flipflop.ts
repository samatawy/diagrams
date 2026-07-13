import type { IHandlePoint, INode } from "../../interfaces";
import { NodeHandle, type AnchorScope, type IRect } from "../../types";
import { isDiagramViewLike } from "../../guards";
import { AbstractGateAdapter } from "./abstract.gate.adapter";

/**
 * LogicJKFlipFlopAdapter is a node adapter responsible for rendering JK flip-flop nodes in the diagram.
 * It extends the AbstractGateAdapter to leverage basic rectangle rendering capabilities while adding specific logic for handling JK flip-flop shapes and hit testing.
 * Registers with the NodeRegistry under the name 'jk_flipflop'.
 */
export class LogicJKFlipFlopAdapter extends AbstractGateAdapter {

    public static TYPE = 'logic_jk_flipflop';

    aspect_ratio = 1 / 1.5;

    protected renderGateShape(node: INode, rect: IRect, context: CanvasRenderingContext2D, show?: 'all' | 'quick'): Path2D {
        // 1. Draw the main rectangular body
        const bodyPath = new Path2D();
        bodyPath.rect(rect.left, rect.top, rect.width, rect.height);

        // 2. Draw the clock wedge on the CLK input (middle of left side)
        const wedgeSize = Math.min(rect.width, rect.height) * 0.12;
        const clkY = rect.top + rect.height * 0.5; // CLK at middle

        const wedgePath = new Path2D();
        wedgePath.moveTo(rect.left, clkY - wedgeSize);
        wedgePath.lineTo(rect.left + wedgeSize, clkY);
        wedgePath.lineTo(rect.left, clkY + wedgeSize);
        wedgePath.closePath();

        // 3. Draw the pin labels
        context.save();
        context.fillStyle = '#000000';
        context.font = `${Math.min(rect.width, rect.height) * 0.18}px sans-serif`;
        context.textBaseline = 'middle';

        // Left side labels (inputs) - using 1/4, 2/4, 3/4 spacing
        const labelInset = rect.width * 0.08;
        context.textAlign = 'left';
        context.fillText('J', rect.left + labelInset, rect.top + rect.height * 0.25);
        context.fillText('CLK', rect.left + labelInset, clkY);
        context.fillText('K', rect.left + labelInset, rect.top + rect.height * 0.75);

        // Right side labels (outputs) - using 1/3, 2/3 spacing
        context.textAlign = 'right';
        context.fillText('Q', rect.left + rect.width - labelInset, rect.top + rect.height * (1 / 3));
        context.fillText('Q̄', rect.left + rect.width - labelInset, rect.top + rect.height * (2 / 3));
        context.restore();

        return bodyPath;
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
            { handle: NodeHandle.W, point: { x: rect.left, y: rect.top + rect.height / 4 } }, // Left higher (J)
            { handle: NodeHandle.W, point: { x: rect.left, y: rect.top + rect.height / 2 } }, // Left middle (CLK)
            { handle: NodeHandle.W, point: { x: rect.left, y: rect.top + rect.height * 3 / 4 } }, // Left lower (K)

            { handle: NodeHandle.E, point: { x: rect.left + rect.width, y: rect.top + rect.height / 3 } }, // right higher (Q)
            { handle: NodeHandle.E, point: { x: rect.left + rect.width, y: rect.top + rect.height * 2 / 3 } }, // right lower (Q̄)
        ];

        if (show === 'all_handles') {
            return [...inherited, ...connectionHandles];
        } else {
            return connectionHandles.filter(anchor => this.canConnect(node, 'any', anchor.handle, anchor.point));
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