import type { INode } from "../../interfaces";
import { AbstractUmlRelationAdapter } from "./abstract.uml.relation.adapter";

export class UmlDependencyAdapter extends AbstractUmlRelationAdapter {

    public static TYPE = 'uml_dependency';

    public override onCreateDraft(tool: string): Partial<INode> | undefined {
        return {
            type: UmlDependencyAdapter.TYPE,
            strokeStyle: {
                color: '#000000',
                arrow_at: 'end',
                arrow_type: 'solid_spear',
                dash: [6, 4],
            }
        }
    }
}