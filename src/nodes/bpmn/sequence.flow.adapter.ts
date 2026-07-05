import type { INode } from "../../interfaces";
import type { ArrowDirection, ArrowType } from "../../types";
import { PolylineAdapter } from "../polyline/polyline.adapter";
import { BPMN_CONNECTION_STROKE_STYLE } from "./Bpmn.Basics";

export class BpmnSequenceFlowAdapter extends PolylineAdapter {

    static readonly TYPE = 'bpmn_sequence_flow';

    public onCreateDraft(tool: string): Partial<INode> | undefined {
        return {
            type: 'bpmn_sequence_flow',
            text: '',
            strokeStyle: {
                arrow_type: 'solid_triangle' as ArrowType,
                arrow_at: 'end' as ArrowDirection,
                color: BPMN_CONNECTION_STROKE_STYLE,
                dash: 'solid',
            },
        }
    }
}