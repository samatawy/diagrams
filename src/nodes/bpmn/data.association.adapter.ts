import type { INode } from "../../interfaces";
import type { NodeHandle, IPoint } from "../../types";
import { OrthogonalAdapter } from "../polyline/orthogonal.adapter";
import { BPMN_CONNECTION_STROKE_STYLE } from "./Bpmn.Basics";

export class BpmnDataAssociationAdapter extends OrthogonalAdapter {

    static readonly TYPE = 'bpmn_data_association';

    public override canConnectTo(node: INode, handle: NodeHandle, direction: "from" | "to" | "any", target?: Partial<INode>, point?: IPoint): boolean {
        if (target && !target.type?.startsWith('bpmn')) {
            return false;
        }
        return true;
    }

    public onCreateDraft(tool: string): Partial<INode> | undefined {
        return {
            type: 'bpmn_data_association',
            text: '',
            strokeStyle: {
                color: BPMN_CONNECTION_STROKE_STYLE,
                width: 1,
                dash: 'dotted',
                arrow_start: 'none',
                arrow_end: 'solid_spear',
            },
        }
    }
}