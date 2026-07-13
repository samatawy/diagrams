import type { IHandlePoint, INode } from "../../interfaces";
import { NodeHandle, type AnchorScope, type IRect } from "../../types";
import { isDiagramViewLike } from "../../guards";
import { AbstractGateAdapter } from "./abstract.gate.adapter";

/**
 * LogicSRLatchAdapter is a node adapter responsible for rendering SR latch nodes in the diagram.
 * It extends the AbstractGateAdapter to leverage basic rectangle rendering capabilities while adding specific logic for handling SR latch shapes and hit testing.
 * Registers with the NodeRegistry under the name 'sr_latch'.
 */
export class LogicSRLatchAdapter extends AbstractGateAdapter {

    public static TYPE = 'logic_sr_latch';

    protected renderGateShape(node: INode, rect: IRect, context: CanvasRenderingContext2D, show?: 'all' | 'quick'): Path2D {
        // 1. Draw the main rectangular body
        const bodyPath = new Path2D();
        bodyPath.rect(rect.left, rect.top, rect.width, rect.height);

        // 2. NO clock wedge (asynchronous latch)

        // 3. Draw the pin labels
        context.save();
        context.fillStyle = '#000000';
        context.font = `${Math.min(rect.width, rect.height) * 0.2}px sans-serif`;
        context.textBaseline = 'middle';

        const labelInset = rect.width * 0.08;

        // Left side labels (inputs) - 1/3 and 2/3 spacing
        context.textAlign = 'left';
        context.fillText('S', rect.left + labelInset, rect.top + rect.height * (1 / 3));
        context.fillText('R', rect.left + labelInset, rect.top + rect.height * (2 / 3));

        // Right side labels (outputs) - 1/3 and 2/3 spacing
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
            { handle: NodeHandle.W, point: { x: rect.left, y: rect.top + rect.height / 3 } }, // Left higher (S)
            { handle: NodeHandle.W, point: { x: rect.left, y: rect.top + rect.height * 2 / 3 } }, // Left lower (R)

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