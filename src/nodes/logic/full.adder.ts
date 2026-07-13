import type { IHandlePoint, INode } from "../../interfaces";
import { NodeHandle, type AnchorScope, type IRect } from "../../types";
import { isDiagramViewLike } from "../../guards";
import { AbstractGateAdapter } from "./abstract.gate.adapter";

/**
 * LogicFullAdderAdapter is a node adapter responsible for rendering full adder nodes in the diagram.
 * It extends the AbstractGateAdapter to leverage basic rectangle rendering capabilities while adding specific logic for handling full adder shapes and hit testing.
 * Registers with the NodeRegistry under the name 'logic_full_adder'.
 */
export class LogicFullAdderAdapter extends AbstractGateAdapter {

    public static TYPE = 'logic_full_adder';

    aspect_ratio = 1 / 1.5; // Full adder is taller than it is wide

    protected renderGateShape(node: INode, rect: IRect, context: CanvasRenderingContext2D, show?: 'all' | 'quick'): Path2D {
        // 1. Draw the main rectangular body
        const bodyPath = new Path2D();
        bodyPath.rect(rect.left, rect.top, rect.width, rect.height);

        // 2. Draw the pin labels
        context.save();
        context.fillStyle = '#000000';
        context.font = `${Math.min(rect.width, rect.height) * 0.2}px sans-serif`;
        context.textBaseline = 'middle';

        const labelInset = rect.width * 0.08;

        // Left side: 2 inputs at 1/3 and 2/3
        context.textAlign = 'left';
        context.fillText('A', rect.left + labelInset, rect.top + rect.height / 4);
        context.fillText('B', rect.left + labelInset, rect.top + rect.height / 2);
        context.fillText('C', rect.left + labelInset, rect.top + rect.height * 3 / 4);

        // Right side: 2 outputs at 1/3 and 2/3
        context.textAlign = 'right';
        context.fillText('S', rect.left + rect.width - labelInset, rect.top + rect.height / 3);
        context.fillText('C', rect.left + rect.width - labelInset, rect.top + rect.height * 2 / 3);

        // Add internal label
        context.font = `${Math.min(rect.width, rect.height) * 0.25}px sans-serif`;
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText('FA', rect.left + rect.width * 0.5, rect.top + rect.height * 0.5);

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
            { handle: NodeHandle.W, point: { x: rect.left, y: rect.top + rect.height / 4 } }, // Left higher (A)
            { handle: NodeHandle.W, point: { x: rect.left, y: rect.top + rect.height / 2 } }, // Left middle (B)
            { handle: NodeHandle.W, point: { x: rect.left, y: rect.top + rect.height * 3 / 4 } }, // Left lower (Cin)

            { handle: NodeHandle.E, point: { x: rect.left + rect.width, y: rect.top + rect.height / 3 } }, // right higher (S)
            { handle: NodeHandle.E, point: { x: rect.left + rect.width, y: rect.top + rect.height * 2 / 3 } }, // right lower (Cout)
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