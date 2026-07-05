import type { INode } from "../../interfaces";
import type { ArrowDirection, ArrowType } from "../../types";
import { PolylineAdapter } from "../polyline/polyline.adapter";
import { BPMN_CONNECTION_STROKE_STYLE } from "./Bpmn.Basics";

export class BpmnAssociationAdapter extends PolylineAdapter {

    static readonly TYPE = 'bpmn_association';

    public onCreateDraft(tool: string): Partial<INode> | undefined {
        return {
            type: 'bpmn_association',
            text: 'Association',
            strokeStyle: {
                arrow_at: 'none' as ArrowDirection,
                color: BPMN_CONNECTION_STROKE_STYLE,
                width: 1,
                dash: 'dotted',
            },
        }
    }
}