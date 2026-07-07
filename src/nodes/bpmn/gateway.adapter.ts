import type { INode } from "../../interfaces";
import { isDiagramViewLike } from "../../guards";
import type { INodeCached } from "../../view/view.cache";
import { RenderBasics } from "../render.basics";
import { isHollow } from "../../value.utils";
import { NodeHandle, type ITextOrientation, type ITextBaseline, type IRect, type IPoint } from "../../types";
import type { SpecificOptions, TextOverflowMode, TextPlacement } from "../../factory/node.adapter";
import { RhombusAdapter } from "../rectangle/rhombus.adapter";
import { BpmnBasics, GATEWAY_FILL_STYLE } from "./Bpmn.Basics";

type BpmnGatewayType = 'exclusive' | 'inclusive' | 'parallel' | 'complex' | 'event_based';

/**
 * Abstract BpmnGatewayAdapter is a node adapter providing common basis for all gateway nodes.
 * It extends the RhombusAdapter to leverage basic rhombus rendering capabilities.
 */
export class BpmnGatewayAdapter extends RhombusAdapter {

    public static TYPE = 'bpmn_gateway';

    single_line_text = true;
    text_overflow: TextOverflowMode = 'hidden';
    text_orientations: ITextOrientation[] = ['horizontal'];
    text_baselines: ITextBaseline[] = ['top'];

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

            const path = new Path2D();
            path.moveTo(rect.left + rect.width / 2, rect.top);
            path.lineTo(rect.left + rect.width, rect.top + rect.height / 2);
            path.lineTo(rect.left + rect.width / 2, rect.top + rect.height);
            path.lineTo(rect.left, rect.top + rect.height / 2);
            path.closePath();

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
                RenderBasics.renderText(node, context, { overflow: this.text_overflow });
            }

            cached.path = path;
            cache.setNode(node, cached);

            context.restore();
        }
    }

    public override textPlacement(node: INode): TextPlacement {
        if (node.points.length > 1) {
            const diagram = node.owner;
            if (!isDiagramViewLike(diagram)) return {};

            const coordinates = diagram.getCoordinates();
            const rect = coordinates.getBoundingRect(node);
            const textWidth = Math.max(rect.width * 1.9, 120);
            const textGap = 0;
            const textHeight = Math.max(rect.height * 0.9, 44);
            return {
                rect: {
                    left: rect.left + (rect.width - textWidth) / 2,
                    top: rect.top + rect.height + textGap,
                    width: textWidth,
                    height: textHeight
                }
            };
        }
        return {};
    }

    public override onCreateDraft(tool: string): Partial<INode> | undefined {
        return {
            type: this.type,
            specific: {
                bpmn_gateway_type: 'exclusive',
            },
            locked_aspect: true,
            points: [{ x: 0, y: 0 }, { x: 40, y: 40 }],
            fillStyle: {
                color: GATEWAY_FILL_STYLE,
            },
        }
    }

    public specificOptions(node: INode, path: string): SpecificOptions | undefined {
        if (path === 'specific.bpmn_gateway_type' || path === 'bpmn_gateway_type') {
            return {
                label: 'Gateway Type',
                datatype: 'enum',
                options: {
                    exclusive: { label: 'Exclusive', value: 'exclusive' },
                    inclusive: { label: 'Inclusive', value: 'inclusive' },
                    parallel: { label: 'Parallel', value: 'parallel' },
                    complex: { label: 'Complex', value: 'complex' },
                    event_based: { label: 'Event-Based', value: 'event_based' },
                }
            };
        }
        return undefined;
    }

    private renderInternal(node: INode, rect: IRect, context: CanvasRenderingContext2D, show?: 'all' | 'quick'): void {
        switch (node.specific?.bpmn_gateway_type) {
            case 'exclusive':
                BpmnBasics.renderExclusive(rect, context, show);
                break;
            case 'inclusive':
                BpmnBasics.renderInclusive(rect, context, show);
                break;
            case 'parallel':
                BpmnBasics.renderParallel(rect, context, show);
                break;
            case 'complex':
                BpmnBasics.renderComplex(rect, context, show);
                break;
            case 'event_based':
                BpmnBasics.renderEventBased(rect, context, show);
                break;
            default:
        }
    }

}
