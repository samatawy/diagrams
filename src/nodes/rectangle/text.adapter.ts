import type { INode } from "../../interfaces";
import { isDiagramViewLike } from "../../guards";
import { RectangleAdapter } from "./rectangle.adapter";
import { RenderBasics } from "../render.basics";
import type { HollowMode, TextOverflowMode } from "../../factory/node.adapter";

/**
 * TextAdapter is a node adapter responsible for rendering text nodes in the diagram. 
 * It extends the RectangleAdapter to leverage basic rectangle rendering capabilities while adding specific logic for handling text content and hit testing.
 * Registers with the NodeRegistry under the name 'text'.
 */
export class TextAdapter extends RectangleAdapter {

    public static TYPE = 'text';

    hollow_mode: HollowMode = 'always';
    text_overflow: TextOverflowMode = 'visible';

    render(node: INode, context: CanvasRenderingContext2D): void {
        if (!context) return;
        const diagram = node.owner;
        if (!isDiagramViewLike(diagram)) return;

        context.save();
        RenderBasics.prepare(node, context);
        RenderBasics.renderText(node, context, { overflow: this.text_overflow });
        context.restore();
    }

    renderSelection(node: INode, context: CanvasRenderingContext2D, show: 'all_handles' | 'connection_handles'): void {
        super.renderSelection(node, context, show);

        if (!context) return;
        const diagram = node.owner;
        if (!isDiagramViewLike(diagram)) return;
        const coordinates = diagram.getCoordinates();
        const rect = coordinates.getBoundingRect(node);

        context.save();
        RenderBasics.prepareHandles(node, context);

        context.setLineDash([1 / coordinates.zoom, 2 / coordinates.zoom]);
        context.rect(rect.left, rect.top, rect.width, rect.height);
        context.stroke();

        context.restore();
    }

    public onCreateDraft(tool: string): Partial<INode> | undefined {
        return {
            type: this.type,
            points: [{ x: 0, y: 0 }, { x: 64, y: 64 }],
            text: 'Text',
        }
    }
}
