import type { INode } from "../../interfaces";
import { AbstractUmlRelationAdapter } from "./abstract.uml.relation.adapter";

export class UmlCompositionAdapter extends AbstractUmlRelationAdapter {

    public static TYPE = 'uml_composition';

    public override onCreateDraft(tool: string): Partial<INode> | undefined {
        return {
            type: UmlCompositionAdapter.TYPE,
            strokeStyle: {
                color: '#000000',
                arrow_at: 'end',
                arrow_type: 'solid_diamond',
                dash: [],
            }
        }
    }
}