import type { IHandlePoint, INode } from "../../interfaces";
import { NodeHandle, type AnchorScope, type IRect } from "../../types";
import { isDiagramViewLike } from "../../guards";
import { AbstractGateAdapter } from "./abstract.gate.adapter";

/**
 * LogicDLatchAdapter is a node adapter responsible for rendering D latch nodes in the diagram.
 * It extends the AbstractGateAdapter to leverage basic rectangle rendering capabilities while adding specific logic for handling D latch shapes and hit testing.
 * Registers with the NodeRegistry under the name 'd_latch'.
 */
export class LogicDLatchAdapter extends AbstractGateAdapter {

    public static TYPE = 'logic_d_latch';

    protected renderGateShape(node: INode, rect: IRect, context: CanvasRenderingContext2D, show?: 'all' | 'quick'): Path2D {
        // 1. Draw the main rectangular body (same as D Flip-Flop)
        const bodyPath = new Path2D();
        bodyPath.rect(rect.left, rect.top, rect.width, rect.height);

        // 2. NO clock wedge! (This is the key difference)

        // 3. Draw the pin labels
        context.save();
        context.fillStyle = '#000000';
        context.font = `${Math.min(rect.width, rect.height) * 0.18}px system-ui`;
        context.textAlign = 'left';
        context.textBaseline = 'middle';

        // Left side labels (inputs)
        // Use a small inset so labels don't overlap the border
        const labelInset = rect.width * 0.08;
        context.fillText('D', rect.left + labelInset, rect.top + rect.height * (1 / 3));
        context.fillText('E', rect.left + labelInset, rect.top + rect.height * (2 / 3)); // "E" for Enable, not "CLK"

        // Right side labels (outputs)
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
            { handle: NodeHandle.W, point: { x: rect.left, y: rect.top + rect.height / 3 } }, // Left higher (D)
            { handle: NodeHandle.W, point: { x: rect.left, y: rect.top + rect.height * 2 / 3 } }, // Left lower (E)

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