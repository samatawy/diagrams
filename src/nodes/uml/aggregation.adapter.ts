import type { INode } from "../../interfaces";
import { AbstractUmlRelationAdapter } from "./abstract.uml.relation.adapter";

export class UmlAggregationAdapter extends AbstractUmlRelationAdapter {

    public static TYPE = 'uml_aggregation';

    public override onCreateDraft(tool: string): Partial<INode> | undefined {
        return {
            type: UmlAggregationAdapter.TYPE,
            strokeStyle: {
                color: '#000000',
                arrow_at: 'end',
                arrow_type: 'hollow_diamond',
                dash: [],
            }
        }
    }
}