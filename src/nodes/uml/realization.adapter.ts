import type { INode } from "../../interfaces";
import { AbstractUmlRelationAdapter } from "./abstract.uml.relation.adapter";

export class UmlRealizationAdapter extends AbstractUmlRelationAdapter {

    public static TYPE = 'uml_realization';

    public override onCreateDraft(tool: string): Partial<INode> | undefined {
        return {
            type: UmlRealizationAdapter.TYPE,
            strokeStyle: {
                color: '#000000',
                dash: [6, 4],
                arrow_start: 'none',
                arrow_end: 'hollow_triangle',
            }
        }
    }
}