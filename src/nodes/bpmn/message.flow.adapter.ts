import type { INode } from "../../interfaces";
import type { ArrowDirection, ArrowType } from "../../types";
import { PolylineAdapter } from "../polyline/polyline.adapter";
import { BPMN_CONNECTION_STROKE_STYLE } from "./Bpmn.Basics";

export class BpmnMessageFlowAdapter extends PolylineAdapter {

    static readonly TYPE = 'bpmn_message_flow';

    public onCreateDraft(tool: string): Partial<INode> | undefined {
        return {
            type: 'bpmn_message_flow',
            text: 'Message',
            strokeStyle: {
                arrow_type: 'solid_triangle' as ArrowType,
                arrow_at: 'end' as ArrowDirection,
                color: BPMN_CONNECTION_STROKE_STYLE,
                width: 1,
                dash: 'dashed',
            },
        }
    }
}