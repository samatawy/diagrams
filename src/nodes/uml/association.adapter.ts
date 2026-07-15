import type { INode } from "../../interfaces";
import { AbstractUmlRelationAdapter } from "./abstract.uml.relation.adapter";

export class UmlAssociationAdapter extends AbstractUmlRelationAdapter {

    public static TYPE = 'uml_association';

    public override onCreateDraft(tool: string): Partial<INode> | undefined {
        return {
            type: UmlAssociationAdapter.TYPE,
            strokeStyle: {
                color: '#000000',
                arrow_at: 'end',
                arrow_type: 'solid_spear',
                dash: [],
            }
        }
    }
}