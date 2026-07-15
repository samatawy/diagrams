import type { INode } from "../../interfaces";
import { AbstractUmlRelationAdapter } from "./abstract.uml.relation.adapter";

export class UmlGeneralizationAdapter extends AbstractUmlRelationAdapter {

    public static TYPE = 'uml_generalization';

    public override onCreateDraft(tool: string): Partial<INode> | undefined {
        return {
            type: UmlGeneralizationAdapter.TYPE,
            strokeStyle: {
                color: '#000000',
                arrow_at: 'end',
                arrow_type: 'hollow_triangle',
                dash: [],
            }
        }
    }
}