import type { INode } from "../../interfaces";
import { AbstractRelationAdapter } from "./abstract.relation.adapter";

/**
 * One2OneAdapter is a node adapter responsible for rendering one-to-one connections in the diagram. 
 * It extends the LineAdapter to leverage basic line rendering capabilities while adding specific logic 
 * for handling one-to-one connection routing and hit testing.
 * Registers with the NodeRegistry under the name 'one_to_one'.
 */
export class One2OneRelationAdapter extends AbstractRelationAdapter {

    public static TYPE = 'erd_one_to_one';

    public override onCreateDraft(tool: string): Partial<INode> | undefined {
        return {
            type: this.type,
            strokeStyle: {
                arrow_start: 'none',
                arrow_end: 'none',
            },
            geometry: {
                radius: 8,
            }
        }
    }
}
