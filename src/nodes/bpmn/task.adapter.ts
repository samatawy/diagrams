import { NodeRegistry } from "../../factory/node.registry";
import type { IConnection, INode } from "../../interfaces";
import { NodeHandle, type IPoint } from "../../types";
import { RoundRectangleAdapter } from "../rectangle/round.rectangle.adapter";
import { TASK_FILL_STYLE } from "./Bpmn.Basics";

export class BpmnTaskAdapter extends RoundRectangleAdapter {

    static readonly TYPE = 'bpmn_task';

    connection_handles = [NodeHandle.N, NodeHandle.S, NodeHandle.E, NodeHandle.W];

    public override canConnectTo(node: INode, handle: NodeHandle, direction: "from" | "to" | "any", target?: Partial<INode>, point?: IPoint): boolean {
        if (target && !target.type?.startsWith('bpmn')) {
            return false;
        }
        return true;
    }

    public override defaultConnection(): Partial<IConnection> | null {
        return NodeRegistry.createDraft('bpmn_sequence_flow') as Partial<IConnection> | null;
    }

    public onCreateDraft(tool: string): Partial<INode> | undefined {
        return {
            type: 'bpmn_task',
            points: [{ x: 0, y: 0 }, { x: 104, y: 40 }],
            geometry: {
                radius: 8,
            },
            fillStyle: {
                color: TASK_FILL_STYLE,
            },
        }
    }
}