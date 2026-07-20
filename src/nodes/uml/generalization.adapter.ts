import type { INode } from "../../interfaces";
import { AbstractUmlRelationAdapter } from "./abstract.uml.relation.adapter";

export class UmlGeneralizationAdapter extends AbstractUmlRelationAdapter {

    public static TYPE = 'uml_generalization';

    public override onCreateDraft(tool: string): Partial<INode> | undefined {
        return {
            type: UmlGeneralizationAdapter.TYPE,
            strokeStyle: {
                color: '#000000',
                dash: [],
                arrow_start: 'none',
                arrow_end: 'hollow_triangle',
            }
        }
    }
}