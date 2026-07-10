import type { INode } from "../../interfaces";
import { AbstractRelationAdapter } from "./abstract.relation.adapter";

/**
 * One2ManyAdapter is a node adapter responsible for rendering one-to-many connections in the diagram. 
 * It extends the LineAdapter to leverage basic line rendering capabilities while adding specific logic 
 * for handling one-to-many connection routing and hit testing.
 * Registers with the NodeRegistry under the name 'one_to_many'.
 */
export class One2ManyRelationAdapter extends AbstractRelationAdapter {

    public static TYPE = 'erd_one_to_many';

    public override onCreateDraft(tool: string): Partial<INode> | undefined {
        return {
            type: this.type,
            strokeStyle: {
                arrow_at: 'none',
                arrow_type: 'none',
            },
            geometry: {
                radius: 8,
            }
        }
    }
}
