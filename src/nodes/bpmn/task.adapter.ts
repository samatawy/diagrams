import type { INode } from "../../interfaces";
import { NodeHandle } from "../../types";
import { RoundRectangleAdapter } from "../rectangle/round.rectangle.adapter";
import { TASK_FILL_STYLE } from "./Bpmn.Basics";

export class BpmnTaskAdapter extends RoundRectangleAdapter {

    static readonly TYPE = 'bpmn_task';

    connection_handles = [NodeHandle.N, NodeHandle.S, NodeHandle.E, NodeHandle.W];

    public onCreateDraft(tool: string): Partial<INode> | undefined {
        return {
            type: 'bpmn_task',
            points: [{ x: 0, y: 0 }, { x: 104, y: 40 }],
            geometry: {
                radius: 8,
            },
            fillStyle: TASK_FILL_STYLE,
        }
    }
}