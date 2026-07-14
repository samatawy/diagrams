import type { INode } from "../../interfaces";
import type { ArrowDirection, IPoint, NodeHandle } from "../../types";
import { OrthogonalAdapter } from "../polyline/orthogonal.adapter";
import { BPMN_CONNECTION_STROKE_STYLE } from "./Bpmn.Basics";

export class BpmnAssociationAdapter extends OrthogonalAdapter {

    static readonly TYPE = 'bpmn_association';

    public override canConnectTo(node: INode, handle: NodeHandle, direction: "from" | "to" | "any", target?: Partial<INode>, point?: IPoint): boolean {
        if (target && !target.type?.startsWith('bpmn')) {
            return false;
        }
        return true;
    }

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