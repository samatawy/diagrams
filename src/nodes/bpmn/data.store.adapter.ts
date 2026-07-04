import type { INode } from "../../interfaces";
import { NodeHandle } from "../../types";
import { CylinderAdapter } from "../rectangle/cylinder.adapter";
import { DATA_FILL_STYLE } from "./Bpmn.Basics";

export class BpmnDataStoreAdapter extends CylinderAdapter {

    static readonly TYPE = 'bpmn_data_store';

    connection_handles = [NodeHandle.N, NodeHandle.S, NodeHandle.E, NodeHandle.W];

    public onCreateDraft(tool: string): Partial<INode> | undefined {
        return {
            type: 'bpmn_data_store',
            points: [{ x: 0, y: 0 }, { x: 64, y: 64 }],
            fillStyle: DATA_FILL_STYLE,
        }
    }
}