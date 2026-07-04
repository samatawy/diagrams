import { RenderBasics } from "../render.basics";
import type { INode } from "../../interfaces";
import type { INodeCached } from "../../view/view.cache";
import { isDiagramViewLike } from "../../guards";
import { isHollow } from "../../value.utils";
import { AbstractBpmnEventAdapter } from "./abstract.event.adapter";
import type { SpecificOptions } from "../../factory/node.adapter";
import { EVENT_FILL_STYLE } from "./Bpmn.Basics";

/**
 * BpmnIntermediateEventAdapter is a node adapter responsible for rendering BPMN intermediate event circle nodes in the diagram. 
 * It extends the Bpmn_EventAdapter to leverage basic circle rendering capabilities while adding specific logic for handling BPMN intermediate events and hit testing.
 * Registers with the NodeRegistry under the name 'bpmn_intermediate_event'.
 */
export class BpmnIntermediateEventAdapter extends AbstractBpmnEventAdapter {

    public static TYPE = 'bpmn_intermediate_event';

    public override render(node: INode, context: CanvasRenderingContext2D, show?: 'all' | 'quick'): void {
        if (!context) return;
        const diagram = node.owner;
        if (!isDiagramViewLike(diagram)) return;
        const coordinates = diagram.getCoordinates();
        const cache = diagram.getCache();
        const cached = cache.getNode(node) || {} as INodeCached;

        if (node.points.length > 1) {
            let from = { x: node.points[0]!.x, y: node.points[0]!.y }
            let to = { x: node.points[0]!.x, y: node.points[0]!.y }
            for (let pt of node.points) {
                from.x = Math.min(from.x, pt!.x)
                from.y = Math.min(from.y, pt!.y)
                to.x = Math.max(to.x, pt!.x)
                to.y = Math.max(to.y, pt!.y)
            }

            let rect = coordinates.getBoundingRect(node);

            context.save();
            RenderBasics.prepare(node, context, show);
            /* Specific override */
            if (node.specific?.bpmn_event_interrupting === false) {
                context.setLineDash([4, 3]);
            } else {
                context.setLineDash([]);
            }

            const path = new Path2D();
            path.ellipse(
                rect.left + rect.width / 2,
                rect.top + rect.height / 2,
                rect.width / 2,
                rect.height / 2,
                0, 0, 2 * Math.PI);

            path.ellipse(
                rect.left + rect.width / 2,
                rect.top + rect.height / 2,
                rect.width / 2 - 4,
                rect.height / 2 - 4,
                0, 0, 2 * Math.PI);

            context.fill(path);

            context.save();
            this.renderInternal(node, rect, context, show);
            context.restore();

            // RenderBasics.renderImage(node, context, rect, path);
            if (!isHollow(node)) {
                RenderBasics.skipShadow(context);
            }
            context.stroke(path);

            if (node.text && show !== 'quick') {
                RenderBasics.renderText(node, context, { overflow: this.text_overflow, path });
            }

            cached.path = path;
            cache.setNode(node, cached);

            context.restore();
        }
    }

    public override onCreateDraft(tool: string): Partial<INode> | undefined {
        return {
            type: this.type,
            specific: {
                bpmn_event_trigger: 'none',
                bpmn_event_interrupting: true,
                bpmn_event_behavior: 'catch',
            },
            locked_aspect: true,
            points: [{ x: 0, y: 0 }, { x: 40, y: 40 }],
            fillStyle: EVENT_FILL_STYLE,
        }
    }

}
