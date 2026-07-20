import type { INode } from "../../interfaces";
import type { IPoint, NodeHandle } from "../../types";
import { OrthogonalAdapter } from "../polyline/orthogonal.adapter";
import { BPMN_CONNECTION_STROKE_STYLE } from "./Bpmn.Basics";

export class BpmnMessageFlowAdapter extends OrthogonalAdapter {

    static readonly TYPE = 'bpmn_message_flow';

    public override canConnectTo(node: INode, handle: NodeHandle, direction: "from" | "to" | "any", target?: Partial<INode>, point?: IPoint): boolean {
        if (target && !target.type?.startsWith('bpmn')) {
            return false;
        }
        return true;
    }

    public onCreateDraft(tool: string): Partial<INode> | undefined {
        return {
            type: 'bpmn_message_flow',
            text: 'Message',
            strokeStyle: {
                color: BPMN_CONNECTION_STROKE_STYLE,
                width: 1,
                dash: 'dashed',
                arrow_start: 'none',
                arrow_end: 'solid_triangle',
            },
        }
    }
}