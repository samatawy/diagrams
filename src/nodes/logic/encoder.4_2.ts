import type { IHandlePoint, INode } from "../../interfaces";
import { NodeHandle, type AnchorScope, type IRect } from "../../types";
import { isDiagramViewLike } from "../../guards";
import { AbstractGateAdapter } from "./abstract.gate.adapter";

/**
 * LogicEncoder_4_2Adapter is a node adapter responsible for rendering 4-to-2 encoder nodes in the diagram.
 * It extends the AbstractGateAdapter to leverage basic rectangle rendering capabilities while adding specific logic for handling decoder shapes and hit testing.
 * Registers with the NodeRegistry under the name 'logic_encoder_4_2'.
 */
export class LogicEncoder_4_2Adapter extends AbstractGateAdapter {

    public static TYPE = 'logic_encoder_4_2';

    connection_handles: NodeHandle[] = [NodeHandle.W, NodeHandle.E, NodeHandle.S];

    aspect_ratio = 1.0 / 2.12; // Four inputs on the left, two outputs on the right, and one enable input at the bottom

    protected renderGateShape(node: INode, rect: IRect, context: CanvasRenderingContext2D, show?: 'all' | 'quick'): Path2D {
        // Reserve space for the enable input at the bottom
        const enableLineHeight = rect.height * 0.12;
        const bodyHeight = rect.height - enableLineHeight;

        // 1. Draw the main rectangular body (shorter to account for enable)
        const bodyPath = new Path2D();
        bodyPath.rect(rect.left, rect.top, rect.width, bodyHeight);

        // 2. Draw the enable line extending down from the bottom center
        const enableX = rect.left + rect.width * 0.5;
        const enablePath = new Path2D();
        enablePath.moveTo(enableX, rect.top + bodyHeight);
        enablePath.lineTo(enableX, rect.top + rect.height);
        context.stroke(enablePath);

        // 3. Draw the pin labels
        context.save();
        context.fillStyle = '#000000';
        context.font = `${Math.min(rect.width, bodyHeight) * 0.16}px sans-serif`;
        context.textBaseline = 'middle';

        const labelInset = rect.width * 0.08;

        // Left side: 4 inputs at 1/5, 2/5, 3/5, 4/5 of bodyHeight
        context.textAlign = 'left';
        context.fillText('I0', rect.left + labelInset, rect.top + bodyHeight * (1 / 5));
        context.fillText('I1', rect.left + labelInset, rect.top + bodyHeight * (2 / 5));
        context.fillText('I2', rect.left + labelInset, rect.top + bodyHeight * (3 / 5));
        context.fillText('I3', rect.left + labelInset, rect.top + bodyHeight * (4 / 5));

        // Right side: 2 outputs at 1/3 and 2/3 of bodyHeight
        context.textAlign = 'right';
        context.fillText('A0', rect.left + rect.width - labelInset, rect.top + bodyHeight * (1 / 3));
        context.fillText('A1', rect.left + rect.width - labelInset, rect.top + bodyHeight * (2 / 3));

        // Bottom: enable label
        context.textAlign = 'center';
        context.fillText('E', enableX, rect.top + bodyHeight - bodyHeight * 0.08);
        context.restore();

        const path = new Path2D();
        path.addPath(bodyPath);
        path.addPath(enablePath);
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
            { handle: NodeHandle.W, point: { x: rect.left + rect.width, y: rect.top + rect.height * 0.176 } }, // left (I0)
            { handle: NodeHandle.W, point: { x: rect.left + rect.width, y: rect.top + rect.height * 0.352 } }, // left (I1)
            { handle: NodeHandle.W, point: { x: rect.left + rect.width, y: rect.top + rect.height * 0.528 } }, // left (I2)
            { handle: NodeHandle.W, point: { x: rect.left + rect.width, y: rect.top + rect.height * 0.704 } }, // left (I3)

            { handle: NodeHandle.E, point: { x: rect.left, y: rect.top + rect.height * 0.289 } }, // right higher (A0)
            { handle: NodeHandle.E, point: { x: rect.left, y: rect.top + rect.height * 0.568 } }, // right lower (A1)

            { handle: NodeHandle.S, point: { x: rect.left + rect.width * 0.5, y: rect.top + rect.height } }, // bottom center (E)
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