import type { INode } from "../../interfaces";
import { AbstractRelationAdapter } from "./abstract.relation.adapter";

/**
 * Many2ManyAdapter is a node adapter responsible for rendering many-to-many connections in the diagram. 
 * It extends the LineAdapter to leverage basic line rendering capabilities while adding specific logic 
 * for handling many-to-many connection routing and hit testing.
 * Registers with the NodeRegistry under the name 'many_to_many'.
 */
export class Many2ManyRelationAdapter extends AbstractRelationAdapter {

    public static TYPE = 'erd_many_to_many';

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
