import type { IHandlePoint, INode } from "../../interfaces";
import { NodeHandle, type AnchorScope, type IRect } from "../../types";
import { isDiagramViewLike } from "../../guards";
import { AbstractGateAdapter } from "./abstract.gate.adapter";

/**
 * LogicDemultiplexer_1_2Adapter is a node adapter responsible for rendering 1-to-2 demultiplexer nodes in the diagram.
 * It extends the AbstractGateAdapter to leverage basic rectangle rendering capabilities while adding specific logic for handling demultiplexer shapes and hit testing.
 * Registers with the NodeRegistry under the name 'logic_demultiplexer_1_2'.
 */
export class LogicDemultiplexer_1_2Adapter extends AbstractGateAdapter {

    public static TYPE = 'logic_demultiplexer_1_2';

    connection_handles: NodeHandle[] = [NodeHandle.W, NodeHandle.E, NodeHandle.S];

    aspect_ratio = 1.0 / 1.15; // enable input at the bottom

    protected renderGateShape(node: INode, rect: IRect, context: CanvasRenderingContext2D, show?: 'all' | 'quick'): Path2D {
        // Reserve space for the selector input line at the bottom
        const selectorLineHeight = rect.height * 0.15;
        const bodyHeight = rect.height - selectorLineHeight;
        // Trapezoid: narrow on left (input), wide on right (outputs)
        const leftInset = bodyHeight * 0.2;

        // 1. Draw the trapezoid body
        const bodyPath = new Path2D();
        bodyPath.moveTo(rect.left, rect.top + leftInset);                        // Top-left (angled down)
        bodyPath.lineTo(rect.left + rect.width, rect.top);                            // Top-right
        bodyPath.lineTo(rect.left + rect.width, rect.top + bodyHeight);               // Bottom-right
        bodyPath.lineTo(rect.left, rect.top + bodyHeight - leftInset);           // Bottom-left (angled up)
        bodyPath.closePath();

        // 2. Draw the selector line extending down from the bottom center
        const selectorX = rect.left + rect.width * 0.5;
        const selectorPath = new Path2D();
        selectorPath.moveTo(selectorX, rect.top + bodyHeight);
        selectorPath.lineTo(selectorX, rect.top + rect.height);
        context.stroke(selectorPath);

        // 3. Draw the pin labels
        context.save();
        context.fillStyle = '#000000';
        context.font = `${Math.min(rect.width, bodyHeight) * 0.2}px sans-serif`;
        context.textBaseline = 'middle';

        const labelInset = rect.width * 0.1;

        // Left side: input label "D"
        context.textAlign = 'left';
        context.fillText('D', rect.left + labelInset, rect.top + bodyHeight * 0.5);

        // Right side: output labels "0" and "1"
        context.textAlign = 'right';
        context.fillText('0', rect.left + rect.width - labelInset, rect.top + bodyHeight * (1 / 3));
        context.fillText('1', rect.left + rect.width - labelInset, rect.top + bodyHeight * (2 / 3));

        // Bottom: selector label "S"
        context.textAlign = 'center';
        context.fillText('S', selectorX, rect.top + bodyHeight - leftInset * 1.5);
        context.restore();

        const path = new Path2D();
        path.addPath(bodyPath);
        path.addPath(selectorPath);

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
            { handle: NodeHandle.W, point: { x: rect.left, y: rect.top + rect.height * 0.425 } }, // Left higher (D)

            { handle: NodeHandle.E, point: { x: rect.left + rect.width, y: rect.top + rect.height * 0.283 } }, // right middle (Y)
            { handle: NodeHandle.E, point: { x: rect.left + rect.width, y: rect.top + rect.height * 0.567 } }, // right middle (Y1)

            { handle: NodeHandle.S, point: { x: rect.left + rect.width * 0.5, y: rect.top + rect.height } }, // bottom center (S)
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