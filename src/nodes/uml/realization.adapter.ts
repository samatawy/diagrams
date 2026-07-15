import type { INode } from "../../interfaces";
import { AbstractUmlRelationAdapter } from "./abstract.uml.relation.adapter";

export class UmlRealizationAdapter extends AbstractUmlRelationAdapter {

    public static TYPE = 'uml_realization';

    public override onCreateDraft(tool: string): Partial<INode> | undefined {
        return {
            type: UmlRealizationAdapter.TYPE,
            strokeStyle: {
                color: '#000000',
                arrow_at: 'end',
                arrow_type: 'hollow_triangle',
                dash: [6, 4],
            }
        }
    }
}