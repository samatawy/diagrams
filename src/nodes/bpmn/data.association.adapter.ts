import type { INode } from "../../interfaces";
import type { ArrowDirection, ArrowType } from "../../types";
import { PolylineAdapter } from "../polyline/polyline.adapter";
import { BPMN_CONNECTION_STROKE_STYLE } from "./Bpmn.Basics";

export class BpmnDataAssociationAdapter extends PolylineAdapter {

    static readonly TYPE = 'bpmn_data_association';

    public onCreateDraft(tool: string): Partial<INode> | undefined {
        return {
            type: 'bpmn_data_association',
            text: '',
            strokeStyle: {
                arrow_type: 'solid_spear' as ArrowType,
                arrow_at: 'end' as ArrowDirection,
                color: BPMN_CONNECTION_STROKE_STYLE,
                width: 1,
                dash: 'dotted',
            },
        }
    }
}