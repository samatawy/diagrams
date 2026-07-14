import type { IConnection, INode } from "../../interfaces";
import { NodeHandle, type ITextOrientation, type ITextBaseline, type IRect, type IPoint } from "../../types";
import { CircleAdapter } from "../rectangle/circle.adapter";
import { isDiagramViewLike } from "../../guards";
import type { SpecificOptions, TextOverflowMode, TextPlacement } from "../../factory/node.adapter";
import { BpmnBasics, EVENT_FILL_STYLE } from "./Bpmn.Basics";
import { NodeRegistry } from "../../factory/node.registry";

type BpmnEventTriggerType = 'timer' | 'message' | 'signal' | 'error' | 'cancel' | 'compensation' | 'conditional' | 'escalation' | 'none';

/**
 * AbstractBpmnEventAdapter is a node adapter providing common basis for all BPMN event nodes.
 * It extends the CircleAdapter to leverage basic circle rendering capabilities.
 */
export abstract class AbstractBpmnEventAdapter extends CircleAdapter {

    single_line_text = true;
    text_overflow: TextOverflowMode = 'visible';
    text_orientations: ITextOrientation[] = ['horizontal'];
    text_baselines: ITextBaseline[] = ['top'];

    protected renderInternal(node: INode, rect: IRect, context: CanvasRenderingContext2D, show?: 'all' | 'quick'): void {
        switch (node.specific?.bpmn_event_trigger as BpmnEventTriggerType) {
            case 'message':
                BpmnBasics.renderMessage(rect, context, node, show);
                break;
            case 'signal':
                BpmnBasics.renderSignal(rect, context, node, show);
                break;
            case 'timer':
                BpmnBasics.renderTimer(rect, context, node, show);
                break;
            case 'error':
                BpmnBasics.renderError(rect, context, node, show);
                break;
            case 'cancel':
                BpmnBasics.renderCancel(rect, context, node, show);
                break;
            case 'conditional':
                BpmnBasics.renderConditional(rect, context, node, show);
                break;
            case 'compensation':
                BpmnBasics.renderCompensation(rect, context, node, show);
                break;
            case 'escalation':
                BpmnBasics.renderEscalation(rect, context, node, show);
                break;
            default:
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

    public override getVisualRect(node: INode, rect: IRect): IRect {
        const visualRect = super.getVisualRect(node, rect);
        const textPlacement = this.textPlacement(node);
        if (textPlacement.rect) {
            const textRect = textPlacement.rect;
            visualRect.left = Math.min(visualRect.left, textRect.left);
            visualRect.top = Math.min(visualRect.top, textRect.top);
            visualRect.width = Math.max(visualRect.width, textRect.width);
            visualRect.height = visualRect.height + textRect.height;
            // visualRect.width = Math.max(visualRect.width, textRect.left + textRect.width - visualRect.left);
            // visualRect.height = Math.max(visualRect.height, textRect.top + textRect.height - visualRect.top);
        }
        return visualRect;
    }

    public override defaultConnection(): Partial<IConnection> | null {
        return NodeRegistry.createDraft('bpmn_sequence_flow') as Partial<IConnection> | null;
    }

    public override canConnectTo(node: INode, handle: NodeHandle, direction: "from" | "to" | "any", target?: Partial<INode>, point?: IPoint): boolean {
        if (target && !target.type?.startsWith('bpmn')) {
            return false;
        }
        return true;
    }

    public override onCreateDraft(tool: string): Partial<INode> | undefined {
        return {
            type: this.type,
            specific: {
                bpmn_event_trigger: 'none',
            },
            locked_aspect: true,
            points: [{ x: 0, y: 0 }, { x: 40, y: 40 }],
            fillStyle: {
                color: EVENT_FILL_STYLE,
            },
        }
    }

    public specificOptions(node: INode, path: string): SpecificOptions | undefined {

        if (path === 'specific.bpmn_event_trigger' || path === 'bpmn_event_trigger') {
            const result: SpecificOptions = {
                label: 'Trigger',
                readonly: false,
                datatype: 'enum',
                options: {}
            }
            switch (node.type) {
                case 'bpmn_start_event':
                    result.options = {
                        timer: { label: 'Timer', value: 'timer' },
                        message: { label: 'Message', value: 'message' },
                        signal: { label: 'Signal', value: 'signal' },
                        error: { label: 'Error', value: 'error' },
                        conditional: { label: 'Conditional', value: 'conditional' },
                        none: { label: 'None', value: 'none' },
                    };
                    return result;

                case 'bpmn_intermediate_event':
                    result.options = {
                        timer: { label: 'Timer', value: 'timer' },
                        message: { label: 'Message', value: 'message' },
                        signal: { label: 'Signal', value: 'signal' },
                        error: { label: 'Error', value: 'error' },
                        cancel: { label: 'Cancel', value: 'cancel' },
                        compensation: { label: 'Compensation', value: 'compensation' },
                        conditional: { label: 'Conditional', value: 'conditional' },
                        escalation: { label: 'Escalation', value: 'escalation' },
                        none: { label: 'None', value: 'none' },
                    };
                    return result;

                case 'bpmn_end_event':
                    result.options = {
                        message: { label: 'Message', value: 'message' },
                        signal: { label: 'Signal', value: 'signal' },
                        error: { label: 'Error', value: 'error' },
                        cancel: { label: 'Cancel', value: 'cancel' },
                        compensation: { label: 'Compensation', value: 'compensation' },
                        escalation: { label: 'Escalation', value: 'escalation' },
                        none: { label: 'None', value: 'none' },
                    };
                    return result;
            }
        }
        if (path === 'specific.bpmn_event_interrupting' || path === 'bpmn_event_interrupting') {
            const result: SpecificOptions = {
                label: 'Interrupting',
                readonly: false,
                datatype: 'boolean',
            }
            return result;
        }
        if (path === 'specific.bpmn_event_behavior' || path === 'bpmn_event_behavior') {
            const result: SpecificOptions = {
                label: 'Behavior',
                readonly: node.type !== 'bpmn_intermediate_event',
                datatype: 'enum',
                options: {
                    catch: { label: 'Catch', value: 'catch' },
                    throw: { label: 'Throw', value: 'throw' },
                },
            }
            return result;
        }

        return undefined;
    }

}
