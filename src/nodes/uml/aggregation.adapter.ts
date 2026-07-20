import type { INode } from "../../interfaces";
import { AbstractUmlRelationAdapter } from "./abstract.uml.relation.adapter";

export class UmlAggregationAdapter extends AbstractUmlRelationAdapter {

    public static TYPE = 'uml_aggregation';

    public override onCreateDraft(tool: string): Partial<INode> | undefined {
        return {
            type: UmlAggregationAdapter.TYPE,
            strokeStyle: {
                color: '#000000',
                dash: [],
                arrow_start: 'none',
                arrow_end: 'hollow_diamond',
            }
        }
    }
}