import { NodeRegistry } from "../../factory/node.registry";
import type { IConnection, INode } from "../../interfaces";
import { NodeHandle, type IPoint } from "../../types";
import { CylinderAdapter } from "../rectangle/cylinder.adapter";
import { DATA_FILL_STYLE } from "./Bpmn.Basics";

export class BpmnDataStoreAdapter extends CylinderAdapter {

    static readonly TYPE = 'bpmn_data_store';

    connection_handles = [NodeHandle.N, NodeHandle.S, NodeHandle.E, NodeHandle.W];

    public override canConnectTo(node: INode, handle: NodeHandle, direction: "from" | "to" | "any", target?: Partial<INode>, point?: IPoint): boolean {
        if (target && !target.type?.startsWith('bpmn')) {
            return false;
        }
        return true;
    }

    public override defaultConnection(): Partial<IConnection> | null {
        return NodeRegistry.createDraft('bpmn_data_association') as Partial<IConnection> | null;
    }

    public onCreateDraft(tool: string): Partial<INode> | undefined {
        return {
            type: 'bpmn_data_store',
            points: [{ x: 0, y: 0 }, { x: 64, y: 64 }],
            fillStyle: {
                color: DATA_FILL_STYLE,
            },
        }
    }
}