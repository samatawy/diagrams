import type { IHandlePoint, INode } from "../../interfaces";
import { NodeHandle, type AnchorScope, type IRect } from "../../types";
import { isDiagramViewLike } from "../../guards";
import { AbstractGateAdapter } from "./abstract.gate.adapter";
import { textColor } from "../../value.utils";

/**
 * LogicHalfAdderAdapter is a node adapter responsible for rendering half adder nodes in the diagram.
 * It extends the AbstractGateAdapter to leverage basic rectangle rendering capabilities while adding specific logic for handling half adder shapes and hit testing.
 * Registers with the NodeRegistry under the name 'logic_half_adder'.
 */
export class LogicHalfAdderAdapter extends AbstractGateAdapter {

    public static TYPE = 'logic_half_adder';

    protected renderGateShape(node: INode, rect: IRect, context: CanvasRenderingContext2D, show?: 'all' | 'quick'): Path2D {
        // 1. Draw the main rectangular body
        const bodyPath = new Path2D();
        bodyPath.rect(rect.left, rect.top, rect.width, rect.height);

        // 2. Draw the pin labels
        context.save();
        context.fillStyle = textColor(node);    //'#000000';
        context.font = `${Math.min(rect.width, rect.height) * 0.2}px sans-serif`;
        context.textBaseline = 'middle';

        const labelInset = rect.width * 0.08;

        // Left side: 2 inputs at 1/3 and 2/3
        context.textAlign = 'left';
        context.fillText('A', rect.left + labelInset, rect.top + rect.height * (1 / 3));
        context.fillText('B', rect.left + labelInset, rect.top + rect.height * (2 / 3));

        // Right side: 2 outputs at 1/3 and 2/3
        context.textAlign = 'right';
        context.fillText('S', rect.left + rect.width - labelInset, rect.top + rect.height * (1 / 3));
        context.fillText('C', rect.left + rect.width - labelInset, rect.top + rect.height * (2 / 3));

        // Add internal label
        context.font = `${Math.min(rect.width, rect.height) * 0.25}px sans-serif`;
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText('HA', rect.left + rect.width * 0.5, rect.top + rect.height * 0.5);

        context.restore();

        return bodyPath;
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
            { handle: NodeHandle.W, point: { x: rect.left, y: rect.top + rect.height / 3 } }, // Left higher (D)
            { handle: NodeHandle.W, point: { x: rect.left, y: rect.top + rect.height * 2 / 3 } }, // Left lower (E)

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