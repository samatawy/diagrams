import type { INode } from "../../interfaces";
import type { IPoint, NodeHandle } from "../../types";
import { OrthogonalAdapter } from "../polyline/orthogonal.adapter";

/**
 * Many2ManyAdapter is a node adapter responsible for rendering many-to-many connections in the diagram. 
 * It extends the LineAdapter to leverage basic line rendering capabilities while adding specific logic 
 * for handling many-to-many connection routing and hit testing.
 * Registers with the NodeRegistry under the name 'many_to_many'.
 */
export class LogicConnectionAdapter extends OrthogonalAdapter {

    public static TYPE = 'logic_connection';

    public override canConnectTo(node: INode, handle: NodeHandle, direction: 'from' | 'to' | 'any', target?: Partial<INode>, point?: IPoint): boolean {
        if (target && !target.type?.startsWith('logic')) {
            return false;
        }
        return true;
    }

    public override onCreateDraft(tool: string): Partial<INode> | undefined {
        return {
            type: this.type,
            strokeStyle: {
                color: '#000000',
                width: 1,
                arrow_at: 'none',
                arrow_type: 'none',
            },
            geometry: {
                radius: 0,
            }
        }
    }
}
